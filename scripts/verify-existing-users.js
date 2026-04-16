const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected For Script'))
    .catch(err => {
        console.error('MongoDB Connection Error: ', err);
        process.exit(1);
    });

async function run() {
    try {
        console.log('Finding all users...');
        const users = await User.find({ isVerified: { $ne: true } });
        
        console.log(`Found ${users.length} unverified users. Updating...`);
        
        for (let user of users) {
             user.isVerified = true;
             await user.save({ validateBeforeSave: false });
        }
        
        console.log('Update Complete! All existing users are now verified.');
        process.exit(0);
    } catch (err) {
        console.error('Error in script run', err);
        process.exit(1);
    }
}

run();
