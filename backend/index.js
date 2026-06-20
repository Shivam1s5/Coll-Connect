require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB
mongoose.connect((process.env.MONGO_URI || '').trim())
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// We will attach io to req so routes can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/profile'));
app.use('/api', require('./routes/friends'));
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/support'));
app.use('/api', require('./routes/announcements'));
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/upload'));

// Socket logic
require('./sockets')(io);

// Analytics Job - Run every 1 hour (3,600,000 ms)
const Analytics = require('./models/Analytics');
setInterval(async () => {
  try {
    const activeCount = io.activeUsers ? io.activeUsers.size : 0;
    
    // Save current active users count
    const record = new Analytics({ count: activeCount });
    await record.save();
    
    // Delete records older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await Analytics.deleteMany({ timestamp: { $lt: sevenDaysAgo } });
    
    console.log(`[Analytics] Logged ${activeCount} active users. Cleaned up records older than 7 days.`);
  } catch (err) {
    console.error('[Analytics Error]:', err);
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

// touch
// retry connect