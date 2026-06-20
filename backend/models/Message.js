const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // username
  receiver: { type: String, required: true }, // username
  text: { type: String, default: '' },
  type: { type: String, default: 'text' }, // text, image, video, audio
  fileUrl: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
