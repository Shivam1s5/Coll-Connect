const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'omegle-clone-uploads', resource_type: 'auto' },
    (error, result) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ url: result.secure_url });
    }
  );

  uploadStream.end(req.file.buffer);
});

module.exports = router;
