const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const debugPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ email: 'admin@ruzann.com' }).select('+password');
        
        const passwordToTest = '@SAruzann#786';
        console.log('Testing Password:', passwordToTest);
        console.log('Stored Hash:', admin.password);
        
        const isMatch = await bcrypt.compare(passwordToTest, admin.password);
        console.log('Bcrypt Match Result:', isMatch);
        
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

debugPassword();
