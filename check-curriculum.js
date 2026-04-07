const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Course = require('./models/Course');

async function checkCourses() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses`);
        
        courses.forEach(course => {
            console.log(`Course: ${course.title} (ID: ${course._id})`);
            console.log(`  Modules Array Count: ${course.modules ? course.modules.length : 'MISSING'}`);
            if (course.modules && course.modules.length > 0) {
                course.modules.forEach((m, idx) => {
                    console.log(`    Module ${idx+1}: ${m.title} (${m.lessons ? m.lessons.length : 0} lessons)`);
                });
            }
        });

        process.exit(0);
    } catch (err) {
        console.error("CRASH ERROR:", err);
        process.exit(1);
    }
}

checkCourses();
