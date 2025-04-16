require('dotenv').config();
const mongoose = require('mongoose');
const supervisionDatesQueue = require('../queues/supervisionDates.queue');

// Configure MongoDB connection with robust settings
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds to select server
  socketTimeoutMS: 45000, // Close sockets after 45s inactivity
  connectTimeoutMS: 30000, // 30 seconds to establish connection
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10, // Maximum number of connections in pool
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if can't connect to DB
  });

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('disconnected', () => {
  console.error('Mongoose disconnected from DB');
  // Optionally attempt to reconnect here
});

// Queue event listeners
supervisionDatesQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed - ${job.data.dateRange.startDate} to ${job.data.dateRange.endDate}`);
});

supervisionDatesQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  
  // Specific handling for timeout errors
  if (err.message.includes('buffering timed out')) {
    console.error('Database operation timeout - check MongoDB connection and performance');
  }
});

supervisionDatesQueue.on('error', (err) => {
  console.error('Queue system error:', err);
});

supervisionDatesQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} waiting to be processed`);
});

// Process unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Process uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Consider proper error handling/restart here
});

// Health check endpoint (optional)
if (process.env.WORKER_HEALTH_PORT) {
  const express = require('express');
  const app = express();
  app.get('/health', (req, res) => {
    res.status(mongoose.connection.readyState === 1 ? 200 : 500)
      .json({
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        queue: 'running'
      });
  });
  app.listen(process.env.WORKER_HEALTH_PORT, () => {
    console.log(`Worker health check on port ${process.env.WORKER_HEALTH_PORT}`);
  });
}

console.log('Worker started and waiting for jobs...');