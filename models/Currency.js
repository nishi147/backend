const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a currency code'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [5, 'Currency code cannot exceed 5 characters']
  },
  symbol: {
    type: String,
    required: [true, 'Please add a currency symbol']
  },
  exchangeRate: {
    type: Number,
    required: [true, 'Please add an exchange rate against the base currency']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Currency', currencySchema);
