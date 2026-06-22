const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const resetCodes = new Map();

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
  if (!user) return res.status(404).json({ error: 'User with this email not found' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;
  resetCodes.set(email.toLowerCase(), { code, expiresAt });

  // Send email asynchronously
  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1e293b; color: #f8fafc; padding: 20px; border-radius: 10px;">
      <h2 style="color: #3b82f6; text-align: center;">Password Reset OTP</h2>
      <p style="font-size: 16px;">Hello <strong>${user.username}</strong>,</p>
      <p style="font-size: 16px;">You requested to reset your password. Use the OTP below to complete the process. It is valid for 15 minutes.</p>
      <div style="background-color: #374151; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h1 style="color: #f8fafc; margin: 0; letter-spacing: 4px;">${code}</h1>
      </div>
      <p style="font-size: 16px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <br>
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">Best regards,<br>The Coll-Connect Team</p>
    </div>
  `;
  try {
    await sendEmail(user.email, '🔐 Password Reset OTP', mailHtml);
  } catch (e) {
    console.error('[Mailer] OTP email failed:', e);
  }

  res.json({ success: true, message: 'If the email exists, an OTP has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields required' });
  const record = resetCodes.get(email.toLowerCase());
  if (!record || Date.now() > record.expiresAt || record.code !== code) return res.status(400).json({ error: 'Invalid or expired code' });

  const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.password = newPassword;
  await user.save();
  resetCodes.delete(email.toLowerCase());
  // Send email asynchronously
  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1e293b; color: #f8fafc; padding: 20px; border-radius: 10px;">
      <h2 style="color: #10b981; text-align: center;">Password Reset Successful</h2>
      <p style="font-size: 16px;">Hello <strong>${user.username}</strong>,</p>
      <p style="font-size: 16px;">Your password has been successfully reset.</p>
      <p style="font-size: 16px;">If you did not make this change, please contact an administrator immediately as your account may be compromised.</p>
      <br>
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">Best regards,<br>The Coll-Connect Team</p>
    </div>
  `;
  res.json({ success: true, message: 'Password reset successfully!' });

  // Fire email in background
  sendEmail(user.email, '✅ Password Reset Successful', mailHtml).catch(e => console.error('[Mailer] Background send failed:', e));
});

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'All fields required' });
  
  if (await User.findOne({ email: new RegExp('^' + email + '$', 'i') })) return res.status(400).json({ error: 'Email already registered' });
  if (await User.findOne({ username: new RegExp('^' + username + '$', 'i') })) return res.status(400).json({ error: 'Username taken' });

  const role = email.toLowerCase() === 'coder.st.15@gmail.com' ? 'superadmin' : 'user';
  const newUser = new User({ email, username, password, role });
  await newUser.save();

  const token = jwt.sign({ username, email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username, role, success: true });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  
  const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i'), password });
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });

  if (user.blockedUntil) {
    if (user.blockedUntil === 'permanent') return res.status(403).json({ error: 'Permanently blocked' });
    if (new Date(user.blockedUntil) > new Date()) return res.status(403).json({ error: 'Blocked', blockedUntil: user.blockedUntil });
    user.blockedUntil = undefined;
    await user.save();
  }

  const token = jwt.sign({ username: user.username, email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username, role: user.role, success: true });
});

router.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token missing' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture } = ticket.getPayload();
    
    let user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user) {
      const baseUsername = (name || 'user').replace(/\\s+/g, '').toLowerCase();
      return res.json({ requiresRegistration: true, email, baseUsername, googleToken: token, picture });
    } else if (!user.profilePic && picture) {
      user.profilePic = picture;
      await user.save();
    }

    if (user.blockedUntil) {
      if (user.blockedUntil === 'permanent') return res.status(403).json({ error: 'Permanently blocked' });
      if (new Date(user.blockedUntil) > new Date()) return res.status(403).json({ error: 'Blocked', blockedUntil: user.blockedUntil });
      user.blockedUntil = undefined;
      await user.save();
    }

    const jwtToken = jwt.sign({ username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: jwtToken, username: user.username, role: user.role, success: true });
  } catch (err) {
    res.status(400).json({ error: 'Google auth failed' });
  }
});

router.post('/auth/google-register', async (req, res) => {
  const { googleToken, username, password } = req.body;
  if (!googleToken || !username || !password) return res.status(400).json({ error: 'All fields required' });
  
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: googleToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, picture } = ticket.getPayload();
    
    if (await User.findOne({ email: new RegExp('^' + email + '$', 'i') })) return res.status(400).json({ error: 'Email already registered' });
    if (await User.findOne({ username: new RegExp('^' + username + '$', 'i') })) return res.status(400).json({ error: 'Username taken' });

    const assignedRole = email.toLowerCase() === 'coder.st.15@gmail.com' ? 'superadmin' : 'user';
    const newUser = new User({
      username, email, password, profilePic: picture || '', role: assignedRole
    });
    await newUser.save();

    const jwtToken = jwt.sign({ username: newUser.username, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: jwtToken, username: newUser.username, role: newUser.role, success: true });
  } catch(err) {
    res.status(400).json({ error: 'Google auth failed' });
  }
});


module.exports = router;

