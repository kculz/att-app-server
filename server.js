require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoute');
const userRoutes = require('./routes/userRoute');
const internshipRoutes = require('./routes/internshipRoute');
const reportRoutes = require('./routes/reportRoute');
const chatRoutes = require('./routes/chatRoute');
const scheduleRoutes = require('./routes/scheduleRoute');
const callRoutes = require('./routes/callRoute');
const supervisionSetRoutes = require('./routes/supervisionSetRoute');

// Import WebSocket controller
const {WebSocketServer} = require('./controllers/websocket');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/internship', internshipRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/supervisions', scheduleRoutes);
app.use('/api/v1/calls', callRoutes);
app.use('/api/v1/supervision-dates', supervisionSetRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
new WebSocketServer(server);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server available at ws://localhost:${port}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});