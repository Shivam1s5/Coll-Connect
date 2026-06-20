const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');

router.post('/support', async (req, res) => {
  const { email, subject, message } = req.body;
  if (!email || !subject || !message) return res.status(400).json({ error: 'All fields are required' });
  
  const ticket = new SupportTicket({ email, subject, message });
  await ticket.save();
  res.json({ success: true, ticket });
});

router.get('/support', async (req, res) => {
  const tickets = await SupportTicket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

router.post('/support/:id/resolve', async (req, res) => {
  await SupportTicket.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: Date.now() });
  res.json({ success: true });
});

router.delete('/support/:id', async (req, res) => {
  await SupportTicket.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
