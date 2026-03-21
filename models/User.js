const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'teacher', 'admin', 'sales'], default: 'student' },
    isApprovedTeacher: { type: Boolean, default: false }, // Admins must approve teachers
    isApprovedStudent: { type: Boolean, default: false }, // Admins must approve students
    specialization: { type: String, default: '' }, // e.g., "Coding Expert", "Math Wizard"
    profilePicture: { type: String, default: '' },
    referralCode: { type: String, unique: true, sparse: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    progress: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
    }],
    stars: { type: Number, default: 0 },
    gems: { type: Number, default: 0 }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    if (this.isNew && !this.referralCode) {
        this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
