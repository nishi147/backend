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

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    family: 4,
    serverSelectionTimeoutMS: 10000
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));


// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
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


// Start server only for local development
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;