const Course = require('./models/Course');
const { createCourse } = require('./controllers/courseController');

// Mock req and res
const req = {
    headers: { 'content-type': 'multipart/form-data' },
    body: {
        title: "Test Course",
        category: "Test",
        description: "Test description",
        numberOfSessions: 1,
        pricePerSession: 10
    },
    user: { id: '60d5f5b2b5b5b5b5b5b5b5b5' }, // Mock user ID
    file: null
};

const res = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        this.data = data;
        return this;
    }
};

async function test() {
    console.log("Testing createCourse with empty req.file...");
    try {
        await createCourse(req, res);
        console.log("Status:", res.statusCode);
        console.log("Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("CRASH DETECTED IN TEST:", err);
    }
}

// Note: This script might fail if DB connection is required and not available, 
// but we want to see if the CONTROLLER logic itself crashes before the DB call.
test();
