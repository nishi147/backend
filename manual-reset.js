const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ email: 'admin@ruzann.com' });
        if (admin) {
            console.log('Resetting password for admin...');
            admin.password = '@SAruzann#786';
            await admin.save();
            console.log('Password reset successful!');
        } else {
            console.log('Admin user not found.');
        }
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

resetAdmin();
