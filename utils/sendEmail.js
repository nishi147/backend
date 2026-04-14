const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('ERROR: SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set. Email cannot be sent.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'RUZANN'} <${process.env.FROM_EMAIL || smtpUser}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
    attachments: options.attachments || []
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return null;
  }
};

module.exports = sendEmail;
