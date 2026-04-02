const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');

dotenv.config();

const fixCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all courses that are approved but not published
        const result = await Course.updateMany(
            { isApproved: true, isPublished: false },
            { isPublished: true }
        );

        console.log(`Updated ${result.modifiedCount} courses to isPublished: true`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixCourses();
