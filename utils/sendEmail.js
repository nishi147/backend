const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Diagnostic Logging
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('WARNING: SMTP_USER or SMTP_PASS environment variables are missing. Email will likely fail.');
  }

  // Create a transporter
  const port = process.env.SMTP_PORT || 2525;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: port,
    secure: port == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Helps with some shared hosting/firewall issues
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'RUZANN EdTech'} <${process.env.FROM_EMAIL || 'no-reply@ruzann.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed:', error);
    // In dev, we don't want to crash if SMTP fails
    return null;
  }
};

module.exports = sendEmail;
