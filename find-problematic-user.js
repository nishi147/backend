const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const findUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const emailToFind = 'nishhhhh147@gmail.com';
        const user = await User.findOne({ email: emailToFind.toLowerCase().trim() });
        
        if (user) {
            console.log('User found:', user);
        } else {
            console.log('User NOT found with normalized email.');
            // Try searching with regex case-insensitive just in case
            const userCI = await User.findOne({ email: new RegExp('^' + emailToFind + '$', 'i') });
            if (userCI) {
                console.log('User found with Case-Insensitive search:', userCI);
            } else {
                console.log('User NOT found at all.');
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findUser();
