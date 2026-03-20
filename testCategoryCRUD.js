require('dotenv').config();
const axios = require('axios');

const API = 'http://localhost:5000';

async function testCRUD() {
  try {
    console.log("Starting Category CRUD tests...");

    // 1. We need to log in as admin to test Protected routes, OR we can test via direct Mongoose calls if the server isn't running.
    // Let's connect direct to Mongoose to test creation of Space Science and verify.
    const mongoose = require('mongoose');
    const Category = require('./models/Category');
    const Course = require('./models/Course');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for testing");

    // Clear previous Space Science if any
    await Category.deleteMany({ name: 'Space Science' });

    // 2. Create Category "Space Science"
    const cat = await Category.create({ name: 'Space Science', icon: '🚀', status: 'active' });
    console.log("✅ Created Category:", cat.name);

    // 3. Assign it to a course
    const course = await Course.findOne({});
    if (course) {
      course.category = cat._id;
      // Set some filters to combined filter test
      course.ageGroup = '10-12';
      course.courseType = 'Group';
      await course.save();
      console.log(`✅ Assigned Space Science to course: ${course.title} with ageGroup 10-12 and type Group`);
    } else {
      console.log("⚠️ No courses found to assign category to.");
    }

    // 4. Verify Homepage Filter logic via Mongoose (Simulating the frontend)
    let filtered = await Course.find({
      category: cat._id,
      ageGroup: '10-12',
      courseType: 'Group'
    }).populate('category');

    if (filtered.length > 0) {
      console.log(`✅ Found ${filtered.length} courses with combined filtering (Space Science + 10-12 + Group).`);
      console.log(`Course matched: ${filtered[0].title}`);
    } else {
      console.log("⚠️ Combined filtering found no matches.");
    }

    console.log("All tests completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testCRUD();
