const nodemailer = require('nodemailer');
const sendEmail = require('./sendEmail');

/**
 * Sends a reminder email for an upcoming class
 * @param {Object} student - Student object (name, email)
 * @param {Object} classInfo - Class info (title, scheduledDate, meetingLink)
 */
const sendClassReminder = async (student, classInfo) => {
    const dateStr = new Date(classInfo.scheduledDate).toLocaleString();
    
    const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">Class Reminder: ${classInfo.title} 🎥</h2>
            <p>Hi <b>${student.name}</b>,</p>
            <p>This is a reminder for your upcoming live class at <b>Ruzann</b>.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><b>Class:</b> ${classInfo.title}</p>
                <p><b>Time:</b> ${dateStr}</p>
            </div>
            <p>Click the button below to join the session:</p>
            <a href="${classInfo.meetingLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Class Now</a>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">Happy Learning!</p>
        </div>
    `;

    try {
        await sendEmail({
            email: student.email,
            subject: `Reminder: ${classInfo.title} is starting soon!`,
            message
        });
        console.log(`Reminder sent to ${student.email}`);
    } catch (error) {
        console.error(`Error sending reminder to ${student.email}:`, error);
    }
};

module.exports = sendClassReminder;
