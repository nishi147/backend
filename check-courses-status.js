const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Course = require('./models/Course');
const Category = require('./models/Category');

dotenv.config();

const checkCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find().populate('category', 'name _id');
        console.log(`Total courses in DB: ${courses.length}`);
        
        courses.forEach(c => {
            console.log(`- Title: ${c.title}`);
            console.log(`  ID: ${c._id}`);
            console.log(`  isApproved: ${c.isApproved}`);
            console.log(`  isPublished: ${c.isPublished}`);
            console.log(`  Category Name: ${c.category?.name}`);
            console.log(`  Category ID: ${c.category?._id}`);
            console.log('---');
        });

        const activeCourses = await Course.find({ isPublished: true, isApproved: true });
        console.log(`Active courses (shown on home): ${activeCourses.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkCourses();
