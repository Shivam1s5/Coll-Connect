const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SupportTicket = require('../models/SupportTicket');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch(e) { res.status(401).json({ error: 'Invalid token' }); }
};

const isSuperAdmin = async (req, res, next) => {
  authMiddleware(req, res, async () => {
    const User = require('../models/User');
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
};

router.post('/support', authMiddleware, async (req, res) => {
  const { subject, message, imageUrl } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
  
  const ticket = new SupportTicket({ 
    email: req.user.email, 
    username: req.user.username,
    subject, 
    message,
    imageUrl: imageUrl || ''
  });
  await ticket.save();
  res.json({ success: true, ticket });
});

router.get('/support', isSuperAdmin, async (req, res) => {
  const tickets = await SupportTicket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

router.post('/support/:id/resolve', isSuperAdmin, async (req, res) => {
  await SupportTicket.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: Date.now() });
  res.json({ success: true });
});

router.delete('/support/:id', isSuperAdmin, async (req, res) => {
  await SupportTicket.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
