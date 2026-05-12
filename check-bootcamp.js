const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    const Bootcamp = mongoose.model('Bootcamp', new mongoose.Schema({}, { strict: false }));
    const bootcamp = await Bootcamp.findOne({ _id: '69fd9ecc36c034626ea8eb90' });
    
    console.log("Bootcamp found:", bootcamp);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
