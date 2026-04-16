const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'check' + Date.now() + '@example.com';
        
        console.log(`Creating user ${email}...`);
        const user = await User.create({
            name: 'Check Status',
            email: email,
            password: 'Password123!',
            role: 'student'
        });

        console.log('User created. Result from Mongo:');
        const rawUser = await mongoose.connection.db.collection('users').findOne({ _id: user._id });
        console.log(JSON.stringify(rawUser, null, 2));

        if (rawUser.isVerified === false) {
            console.log('isVerified is CORRECTLY set to false');
        } else {
            console.log('isVerified is WRONGLY set to:', rawUser.isVerified);
        }

        await User.deleteOne({ _id: user._id });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
