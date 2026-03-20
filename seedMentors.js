const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const mentors = [
    {
        name: "Dr. Sarah Chen",
        email: "sarah.chen@ruzann.com",
        password: "password123",
        role: "teacher",
        isApprovedTeacher: true,
        specialization: "Quantum Physics & Robotics",
        profilePicture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"
    },
    {
        name: "Alex Rivera",
        email: "alex.rivera@ruzann.com",
        password: "password123",
        role: "teacher",
        isApprovedTeacher: true,
        specialization: "Full Stack Web Magic",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200"
    },
    {
        name: "Elena Rodriguez",
        email: "elena.r@ruzann.com",
        password: "password123",
        role: "teacher",
        isApprovedTeacher: true,
        specialization: "Creative Arts & Design",
        profilePicture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200"
    },
    {
        name: "James Wilson",
        email: "james.w@ruzann.com",
        password: "password123",
        role: "teacher",
        isApprovedTeacher: true,
        specialization: "Python & Game Dev",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200"
    },
    {
        name: "Dr. Maya Patil",
        email: "maya.patil@ruzann.com",
        password: "password123",
        role: "teacher",
        isApprovedTeacher: true,
        specialization: "Logic & Critical Thinking",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200"
    },
    {
        name: "Leo Zhang",
        email: "leo.zhang@ruzann.com",
        password: "password123",
        role: "teacher",
        isApprovedTeacher: true,
        specialization: "AI & Machine Learning",
        profilePicture: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200"
    }
];

const seedMentors = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding mentions...');

        for (const mentor of mentors) {
            const exists = await User.findOne({ email: mentor.email });
            if (!exists) {
                await User.create(mentor);
                console.log(`Created mentor: ${mentor.name}`);
            } else {
                console.log(`Mentor already exists: ${mentor.name}`);
            }
        }

        console.log('Seeding completed!');
        process.exit();
    } catch (error) {
        console.error('Error seeding mentors:', error);
        process.exit(1);
    }
};

seedMentors();
