const mongoose = require('mongoose');
const Project = require('./models/Project');
require('dotenv').config();

const seedProjects = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding projects...');

        const projects = [
            {
                title: 'Solar System',
                url: 'https://scratch.mit.edu/projects/1107796274',
                studentName: 'Ruzann Student',
                description: 'An interactive exploration of our solar system with moving planets and fun facts!',
                isApproved: true
            },
            {
                title: 'Ping Pong Game',
                url: 'https://scratch.mit.edu/projects/1105272409',
                studentName: 'Ruzann Student',
                description: 'A classic arcade-style ping pong game. Can you beat the computer?',
                isApproved: true
            },
            {
                title: 'Maze Game',
                url: 'https://scratch.mit.edu/projects/1135458115',
                studentName: 'Ruzann Student',
                description: 'Navigate through challenging puzzles in this tricky maze game.',
                isApproved: true
            },
            {
                title: 'Calculator',
                url: 'https://scratch.mit.edu/projects/1123907238',
                studentName: 'Ruzann Student',
                description: 'A fully functional calculator built entirely in Scratch!',
                isApproved: true
            },
            {
                title: 'Google - Jumping Game',
                url: 'https://scratch.mit.edu/projects/1105538341',
                studentName: 'Ruzann Student',
                description: 'Inspired by the classic jumping dino game. How high can you score?',
                isApproved: true
            },
            {
                title: 'Mouse Trial',
                url: 'https://scratch.mit.edu/projects/1106385497',
                studentName: 'Ruzann Student',
                description: 'Test your reflexes and precision with this fun mouse-tracking project.',
                isApproved: true
            }
        ];

        // Clear existing and re-seed
        await Project.deleteMany({ studentName: 'Ruzann Student' });
        await Project.insertMany(projects);

        console.log('Seeded 6 student projects successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedProjects();
