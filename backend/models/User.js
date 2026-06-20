const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  gender: { type: String, default: 'Not Specified' },
  profilePic: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  lastUsernameChangeDate: { type: Date },
  blockedUntil: { type: mongoose.Schema.Types.Mixed }, // String ('permanent') or Date
  socials: {
    linkedin: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    snapchat: { type: String, default: '' }
  },
  friends: [{ type: String }], // Array of usernames
  friendRequests: [{
    username: String,
    timestamp: { type: Date, default: Date.now }
  }],
  warningHistory: [{
    message: String,
    reason: String,
    screenshot: String,
    reporter: String,
    date: String,
    timestamp: { type: Date, default: Date.now },
    byAdmin: String
  }]
});

module.exports = mongoose.model('User', userSchema);
