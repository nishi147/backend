const sendEmail = require('../utils/sendEmail');
require('dotenv').config({ path: __dirname + '/../.env' });

async function testEmail() {
    try {
        console.log('Testing email to support@ruzann.com (or change to your test email)');
        const result = await sendEmail({
            email: 'sumitkushwahatg@gmail.com', // Change this to a real test email if needed
            subject: 'RUZANN Email Test',
            message: 'This is a test email to verify SMTP configuration.',
            html: '<h1>Email Test</h1><p>If you see this, SMTP is working!</p>'
        });

        if (result) {
            console.log('SUCCESS: Email sent successfully! Info:', result);
        } else {
            console.log('FAILURE: sendEmail returned null.');
        }
    } catch (err) {
        console.error('ERROR during email test:', err);
    }
}

testEmail();
