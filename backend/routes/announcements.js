const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

router.get('/announcements', async (req, res) => {
  const announcements = await Announcement.find().sort({ timestamp: -1 });
  res.json(announcements);
});

router.post('/announcements', async (req, res) => {
  const { title, content } = req.body;
  const ann = new Announcement({ title, content });
  await ann.save();
  if (req.io) req.io.emit('new-announcement', ann);
  res.json(ann);
});

router.delete('/announcements/:id', async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
