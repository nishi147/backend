const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const CurrencySchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    symbol: { type: String, required: true },
    exchangeRate: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDefault: { type: Boolean, default: false }
});

const Currency = mongoose.models.Currency || mongoose.model('Currency', CurrencySchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const currencyObj = await Currency.findOne({ code: 'USD', status: 'active' });
    console.log('Query result:', currencyObj);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
