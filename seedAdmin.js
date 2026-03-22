const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const adminExists = await User.findOne({ email: 'admin@ruzann.com' });
        if (adminExists) {
            console.log('Admin already exists. Updating password...');
            adminExists.password = '@SAruzann#786';
            adminExists.role = 'admin';
            adminExists.isApprovedTeacher = true;
            await adminExists.save();
        } else {
            await User.create({
                name: 'Super Admin',
                email: 'admin@ruzann.com',
                password: '@SAruzann#786',
                role: 'admin',
                isApprovedTeacher: true
            });
            console.log('Default Admin created!');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
