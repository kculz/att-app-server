// queues/supervisionDates.queue.js
const Queue = require('bull')
const { sendSupervisionDateNotification } = require('../email')
const User = require('../../models/User')


const supervisionDatesQueue = new Queue('supervisionDates', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
})

// Process jobs
// queues/supervisionDates.queue.js
supervisionDatesQueue.process(async (job) => {
  const { dateRange } = job.data;
  console.log("Processing job for date range:", dateRange);

  try {
    // Add timeout handling for the User query
    const users = await User.find({
      role: { $in: ['student', 'supervisor', 'super-admin'] },
      email: { $exists: true }
    }).maxTimeMS(30000); // 30 second timeout for this query

    console.log(`Found ${users.length} users to notify`);

    // Send emails
    for (const user of users) {
      if (!user.email) {
        console.warn(`User ${user._id} has no email`);
        continue;
      }

      console.log(`Sending to ${user.email}`);
      try {
        await sendSupervisionDateNotification(user.email, dateRange);
      } catch (emailErr) {
        console.error(`Email failed for ${user.email}:`, emailErr);
      }
    }
  } catch (dbErr) {
    console.error('Database operation failed:', dbErr);
    throw dbErr; // This will trigger Bull's retry mechanism
  }
});

module.exports = supervisionDatesQueue