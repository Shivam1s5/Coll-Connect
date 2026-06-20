const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    res.json({ url: req.file.path });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
