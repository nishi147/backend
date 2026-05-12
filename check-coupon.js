const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    const Coupon = mongoose.model('Coupon', new mongoose.Schema({}, { strict: false }));
    const coupon = await Coupon.findOne({ code: 'RUZANN25' });
    
    console.log("Coupon found:", coupon);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
