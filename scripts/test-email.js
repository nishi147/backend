require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('--- SMTP Diagnostic Test ---');
    console.log('Host:', process.env.SMTP_HOST || 'smtp.mailtrap.io');
    console.log('Port:', process.env.SMTP_PORT || 2525);
    console.log('User:', process.env.SMTP_USER ? '***' : 'MISSING');
    console.log('Pass:', process.env.SMTP_PASS ? '***' : 'MISSING');
    console.log('From:', process.env.FROM_EMAIL || 'no-reply@ruzann.com');

    const port = process.env.SMTP_PORT || 2525;
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: port,
        secure: port == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection successful!');

        console.log('Sending test email to:', process.env.FROM_EMAIL || 'test@example.com');
        const info = await transporter.sendMail({
            from: `"Ruzann Test" <${process.env.FROM_EMAIL || 'no-reply@ruzann.com'}>`,
            to: process.env.FROM_EMAIL || 'test@example.com',
            subject: 'Ruzann SMTP Test',
            text: 'If you see this, your SMTP settings are working perfectly!',
            html: '<b>If you see this, your SMTP settings are working perfectly!</b>'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.code === 'EAUTH') {
            console.log('\nTIP: Authentication failed. If using Gmail, make sure you are using an "App Password" (not your regular password) and port 587.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\nTIP: Connection was refused. Check your host or port.');
        }
    }
};

testEmail();
