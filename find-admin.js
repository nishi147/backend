require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function findAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admins = await User.find({ role: 'admin' });
    console.log('Admins:', JSON.stringify(admins, null, 2));
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

findAdmin();
