const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: __dirname + '/../.env' });

async function debugFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'debug' + Date.now() + '@example.com';
        
        console.log(`--- REGISTER STEP ---`);
        const user = await User.create({
            name: 'Debug User',
            email: email,
            password: 'Password123!',
            role: 'student'
        });
        console.log(`User created. isVerified (raw):`, user.isVerified);
        
        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });
        console.log(`Tokens set. isVerified (after save):`, user.isVerified);

        console.log(`\n--- LOGIN STEP ---`);
        const normalizedEmail = email.toLowerCase().trim();
        const foundUser = await User.findOne({ email: normalizedEmail }).select('+password');
        
        if (!foundUser) {
            console.log(`ERROR: User not found with normalized email ${normalizedEmail}`);
        } else {
            console.log(`User found. Role: ${foundUser.role}, isVerified: ${foundUser.isVerified}`);
            
            const isMatch = (foundUser.role !== 'admin' && !foundUser.isVerified);
            console.log(`Check logic (user.role !== 'admin' && !user.isVerified):`, isMatch);
            
            if (isMatch) {
                console.log(`Result: LOGIN BLOCKED (Correct)`);
            } else {
                console.log(`Result: LOGIN ALLOWED (Incorrect)`);
            }
        }

        await User.deleteOne({ _id: user._id });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugFlow();
