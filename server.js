require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    family: 4, // Force IPv4 to avoid DNS loop issues with SRV
    serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://frontend-gilt-two-38.vercel.app',
    'https://ruzann.com',
    'https://www.ruzann.com',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !origin.includes('vercel.app')) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            // return callback(new Error(msg), false);
            return callback(null, true); // Fallback to allow for now if debugging
        }
        return callback(null, true);
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/live-classes', require('./routes/liveClasses'));
app.use('/api/workshops', require('./routes/workshops'));
app.use('/api/bootcamps', require('./routes/bootcamps'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/currencies', require('./routes/currencies'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/minigames', require('./routes/minigames'));
app.use('/api/mentors', require('./routes/mentors'));
app.use('/api/student-details', require('./routes/studentDetails'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("GLOBAL SERVER ERROR:", err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server error'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;