const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

router.get('/announcements', authenticate, async (req, res) => {
  const announcements = await Announcement.find().sort({ timestamp: -1 });
  res.json(announcements);
});

router.post('/announcements', authenticate, isSuperAdmin, async (req, res) => {
  const { title, content, imageUrl } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  const ann = new Announcement({ title, content, imageUrl: imageUrl || '' });
  await ann.save();
  if (req.io) req.io.emit('new-announcement', ann);
  res.json(ann);
});

router.delete('/announcements/:id', authenticate, isSuperAdmin, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  if (req.io) req.io.emit('delete-announcement', req.params.id);
  res.json({ success: true });
});

module.exports = router;
