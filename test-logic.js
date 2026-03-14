require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { getApprovedTeachers } = require('./controllers/userController');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const approvedTeachers = await User.find({ role: 'teacher', isApprovedTeacher: true });
    console.log(`Found ${approvedTeachers.length} approved teachers:`);
    approvedTeachers.forEach(t => console.log(`- ${t.name} (${t.email})`));

    // Mock res
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    console.log('\nRunning getApprovedTeachers controller...');
    await getApprovedTeachers({}, res);
    console.log('Controller Response Status:', res.statusCode);
    console.log('Controller Response Data:', JSON.stringify(res.data, null, 2));

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkData();
