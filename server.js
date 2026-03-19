// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const { getApprovedTeachers } = require('./controllers/userController');
// const app = express();


// // Database Connection
// mongoose.connect(process.env.MONGODB_URI, {
//     family: 4, // Force IPv4 to avoid DNS loop issues with SRV
//     serverSelectionTimeoutMS: 5000 // 5 seconds timeout
// })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch((err) => console.error('MongoDB connection error:', err));

// // Middleware
// const allowedOrigins = [
//     'http://localhost:3001',
//     'http://localhost:3000',
//     'https://frontend-gilt-two-38.vercel.app',
//     process.env.CLIENT_URL
// ].filter(Boolean);

// app.use(cors({
//     origin: function (origin, callback) {
//         // allow requests with no origin (like mobile apps or curl requests)
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.indexOf(origin) === -1) {
//             const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
//             return callback(new Error(msg), false);
//         }
//         return callback(null, true);
//     },
//     credentials: true,
// }));
// app.use(express.json());
// app.use(cookieParser());
// app.use('/uploads', express.static('uploads'));

// app.get('/api/mentors', getApprovedTeachers);

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/courses', require('./routes/courses'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/live-classes', require('./routes/liveClasses'));
// app.use('/api/workshops', require('./routes/workshops'));
// app.use('/api/projects', require('./routes/projects'));

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getApprovedTeachers } = require('./controllers/userController');

const app = express();

// Database Connection (Cached for Serverless Stability)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('MongoDB is already connected');
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10 // Prevent exhausting Free Tier connections
        });
        isConnected = db.connections[0].readyState === 1;
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // Do not crash server, let routes handle 500 logic safely against DB checks
    }
};

// Initialize connection
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));


// Routes
app.get('/api/mentors', getApprovedTeachers);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/live-classes', require('./routes/liveClasses'));
app.use('/api/workshops', require('./routes/workshops'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/curriculum', require('./routes/curriculum'));


// Start server only for local development
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Global Error Handler (Critical for Vercel/Serverless JSON stability)
app.use((err, req, res, next) => {
    console.error("GLOBAL SERVER ERROR:", err);
    
    // 1. Handle Multer Storage/Limit errors
    if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
            success: false, 
            message: `Upload Error: ${err.message}`,
            code: err.code 
        });
    }

    // 2. Handle JSON Parsing errors (Body Parser)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }

    // 3. Fallback for all other errors
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server error',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.stack
    });
});

// Export for Vercel
module.exports = app;