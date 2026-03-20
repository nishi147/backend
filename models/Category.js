const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true
    },
    icon: { 
        type: String, 
        default: '📚' 
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
