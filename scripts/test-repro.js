const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const testEmail = 'testverify' + Date.now() + '@example.com';
        const testPassword = 'Password123!';

        console.log(`Registering user: ${testEmail}`);
        
        // Mocking the register logic
        const user = await User.create({
            name: 'Test User',
            email: testEmail,
            phone: '1234567890',
            password: testPassword,
            role: 'student'
        });

        console.log('User created. isVerified:', user.isVerified);

        // Try to login (mocking login controller)
        const foundUser = await User.findOne({ email: testEmail }).select('+password');
        console.log('Found user in DB for login. isVerified:', foundUser.isVerified);

        if (foundUser.role !== 'admin' && !foundUser.isVerified) {
            console.log('Login BLOCKED as expected (unverified)');
        } else {
            console.log('Login ALLOWED - ISSUE DETECTED (should be blocked)');
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log('Test user deleted');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

runTest();
