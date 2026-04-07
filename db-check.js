const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));
    const courses = await Course.find({});
    
    console.log(`Found ${courses.length} courses`);
    courses.forEach(c => {
      console.log(`Course: ${c.title} (Has Modules: ${!!c.modules}, Count: ${c.modules?.length || 0})`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
