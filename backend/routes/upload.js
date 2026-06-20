const express = require('express');
const router = express.Router();
const { cloudinary } = require('../config/cloudinary');

router.post('/upload', async (req, res) => {
  const { fileData, fileType } = req.body;
  if (!fileData) return res.status(400).json({ error: 'No file data' });
  try {
    const uploadRes = await cloudinary.uploader.upload(fileData, {
      resource_type: fileType === 'audio' || fileType === 'video' ? 'video' : 'image',
      folder: 'omegle-clone-uploads'
    });
    res.json({ url: uploadRes.secure_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
