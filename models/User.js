const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    isApprovedTeacher: { type: Boolean, default: false }, // Admins must approve teachers
    isApprovedStudent: { type: Boolean, default: false }, // Admins must approve students
    profilePicture: { type: String, default: '' },
    progress: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
    }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
