const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Currency = require('./models/Currency');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

const currencies = [
  {
    code: 'INR',
    symbol: '₹',
    exchangeRate: 1,
    status: 'active',
    isDefault: true
  },
  {
    code: 'USD',
    symbol: '$',
    exchangeRate: 0.012,
    status: 'active',
    isDefault: false
  },
  {
    code: 'EUR',
    symbol: '€',
    exchangeRate: 0.011,
    status: 'active',
    isDefault: false
  },
  {
    code: 'GBP',
    symbol: '£',
    exchangeRate: 0.0095,
    status: 'active',
    isDefault: false
  }
];

const seedData = async () => {
  try {
    // Note: To prevent duplicating, check if counts > 0
    const count = await Currency.countDocuments();
    if (count > 0) {
      console.log('Currencies already exist. Skipping seed.');
      process.exit(0);
    }
    await Currency.create(currencies);
    console.log('Initial Currencies Imported...');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
