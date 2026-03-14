require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const axios = require('axios');

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Find Admin
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('No admin found');
    
    // 2. Generate Token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Token for Admin:', admin.email);

    // 3. Find a victim (another user)
    const victim = await User.findOne({ _id: { $ne: admin._id } });
    if (!victim) throw new Error('No other user found');
    console.log('Victim:', victim.email, victim._id);

    // 4. Test DELETE
    const url = `http://localhost:5000/api/users/${victim._id}`;
    console.log('Testing DELETE', url);

    try {
      const res = await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Success!', res.status, res.data);
    } catch (err) {
      console.log('DELETE Failed:', err.response ? err.response.status : err.message);
      if (err.response) console.log('Response Body:', JSON.stringify(err.response.data, null, 2));
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

runTest();
