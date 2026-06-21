const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch(e) { res.status(401).json({ error: 'Invalid token' }); }
};

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findOne({ username: req.user.username });
  if (!user) return res.status(404).json({ error: 'Not found' });

  if (user.blockedUntil) {
    if (user.blockedUntil === 'permanent') return res.status(403).json({ error: 'Permanently blocked' });
    if (new Date(user.blockedUntil) > new Date()) return res.status(403).json({ error: `Blocked until ${new Date(user.blockedUntil).toLocaleString()}` });
    user.blockedUntil = undefined;
    await user.save();
  }

  const actualFriends = user.friends || [];
  const interactedUsers = new Set();
  const msgs = await Message.find({ $or: [{ sender: user.username }, { receiver: user.username }] });
  msgs.forEach(m => {
    if (m.sender === user.username) interactedUsers.add(m.receiver);
    else interactedUsers.add(m.sender);
  });
  
  const friendsAndInteracted = new Set([...actualFriends, ...interactedUsers]);
  const friendsList = [];
  const isMeAdmin = user.role === 'admin' || user.role === 'superadmin';

  for (let uname of friendsAndInteracted) {
    if (uname === user.username || uname.toLowerCase() === 'admin') continue;
    const fUser = await User.findOne({ username: uname });
    if (fUser) {
      if (!isMeAdmin && !actualFriends.includes(uname) && fUser.role !== 'admin' && fUser.role !== 'superadmin') continue;
      friendsList.push({
        username: fUser.username,
        email: fUser.email,
        profilePic: fUser.profilePic,
        gender: fUser.gender,
        socials: fUser.socials,
        role: fUser.role,
        isFriend: actualFriends.includes(fUser.username),
        warningHistory: fUser.warningHistory,
        blockedUntil: fUser.blockedUntil
      });
    }
  }

  const superadminUser = await User.findOne({ role: 'superadmin' });
  if (superadminUser && user.role !== 'superadmin' && !friendsList.find(f => f.username === superadminUser.username)) {
    friendsList.push({
      username: superadminUser.username,
      profilePic: superadminUser.profilePic,
      gender: superadminUser.gender,
      socials: superadminUser.socials,
      role: 'superadmin',
      isFriend: true
    });
  }

  const friendRequests = [];
  for (let r of (user.friendRequests || [])) {
    const reqUser = await User.findOne({ username: r.username });
    if (reqUser) friendRequests.push({
      username: reqUser.username,
      profilePic: reqUser.profilePic,
      gender: reqUser.gender,
      socials: reqUser.socials,
      role: reqUser.role
    });
  }

  res.json({
    username: user.username,
    email: user.email,
    profilePic: user.profilePic,
    gender: user.gender,
    socials: user.socials,
    friends: friendsList,
    friendRequests,
    role: user.role
  });
});

router.post('/profile-pic', authMiddleware, async (req, res) => {
  const user = await User.findOneAndUpdate({ username: req.user.username }, { profilePic: req.body.profilePic || '' }, { new: true });
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (req.io) req.io.emit('admin-update');
  res.json({ success: true, profilePic: user.profilePic });
});

router.post('/profile/socials', authMiddleware, async (req, res) => {
  const user = await User.findOneAndUpdate({ username: req.user.username }, { socials: req.body.socials }, { new: true });
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (req.io) req.io.emit('admin-update');
  res.json({ success: true, socials: user.socials });
});

router.post('/profile/gender', authMiddleware, async (req, res) => {
  const user = await User.findOneAndUpdate({ username: req.user.username }, { gender: req.body.gender || 'Not Specified' }, { new: true });
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (req.io) req.io.emit('admin-update');
  res.json({ success: true, gender: user.gender });
});

router.post('/profile/change-username', authMiddleware, async (req, res) => {
  const oldUsername = req.user.username;
  let { newUsername } = req.body;
  if (!newUsername) return res.status(400).json({ error: 'New username required' });
  newUsername = newUsername.trim();
  if (newUsername.length < 3 || newUsername.length > 20) return res.status(400).json({ error: 'Username must be 3-20 chars' });
  if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) return res.status(400).json({ error: 'Invalid characters' });

  if (await User.findOne({ username: new RegExp('^' + newUsername + '$', 'i') })) return res.status(400).json({ error: 'Username taken' });

  const user = await User.findOne({ username: oldUsername });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  if (user.lastUsernameChangeDate && Date.now() - user.lastUsernameChangeDate < oneYearMs) {
    return res.status(400).json({ error: 'You can only change username once a year.' });
  }

  user.username = newUsername;
  user.lastUsernameChangeDate = Date.now();
  await user.save();

  // Update friends lists and friend requests
  await User.updateMany({ friends: oldUsername }, { $set: { "friends.$": newUsername } });
  await User.updateMany({ "friendRequests.username": oldUsername }, { $set: { "friendRequests.$.username": newUsername } });
  await User.updateMany({ "warningHistory.byAdmin": oldUsername }, { $set: { "warningHistory.$.byAdmin": newUsername } });
  
  await Message.updateMany({ sender: oldUsername }, { sender: newUsername });
  await Message.updateMany({ receiver: oldUsername }, { receiver: newUsername });

  const token = jwt.sign({ username: newUsername, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  if (req.io) req.io.emit('admin-update');
  
  res.json({ success: true, token, newUsername });
});

module.exports = router;
