// utils/email.js
const nodemailer = require('nodemailer');
const util = require('util');

// Configure transporter with verbose debugging
const transporter = nodemailer.createTransport({
  host: "mail.curlben.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME || "no-reply@curlben.com",
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Only for testing, remove in production
  },
  debug: true, // Enable SMTP protocol debugging
  logger: true // Output logs to console
});

// Verify connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Connection Verification Failed:', error);
  } else {
    console.log('SMTP Server is ready to accept messages');
  }
});

exports.sendSupervisionDateNotification = async (email, dateRange) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "MSUAS Info <no-reply@curlben.com>",
    to: email,
    subject: 'Supervision Dates Updated',
    html: `
      <h2>Supervision Dates Notification</h2>
      <p>New supervision dates have been scheduled:</p>
      <p><strong>From:</strong> ${new Date(dateRange.startDate).toLocaleString()}</p>
      <p><strong>To:</strong> ${new Date(dateRange.endDate).toLocaleString()}</p>
      <p>Please check the system for more details.</p>
    `,
    // Add headers to prevent spam classification
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'MSUAS Notification System'
    }
  };

  console.log('Attempting to send email with options:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to %s: %s', email, info.messageId);
    
    // Log the SMTP response
    console.log('SMTP Response:', {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    
    return info;
  } catch (error) {
    console.error('Failed to send email to %s:', email, error);
    
    // Detailed error logging
    if (error.responseCode) {
      console.error('SMTP Error Code:', error.responseCode);
    }
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    
    throw error;
  }
};