const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const lowercaseEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const users = await User.find({});
        console.log(`Found ${users.length} users. Checking for mixed-case emails...`);

        let count = 0;
        for (const user of users) {
            const originalEmail = user.email;
            const normalizedEmail = originalEmail.toLowerCase().trim();

            if (originalEmail !== normalizedEmail) {
                user.email = normalizedEmail;
                // Use validateBeforeSave: false to avoid issues with missing fields in old records
                await user.save({ validateBeforeSave: false });
                console.log(`Updated: ${originalEmail} -> ${normalizedEmail}`);
                count++;
            }
        }

        console.log(`Finished! Updated ${count} users.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

lowercaseEmails();
