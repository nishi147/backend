const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Bootcamp = mongoose.models.Bootcamp || mongoose.model('Bootcamp', new mongoose.Schema({}, { strict: false }));

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const bootcamp = await Bootcamp.findById('69fd9ecc36c034626ea8eb90');
    console.log('--- BOOTCAMP IN DB ---');
    console.log(JSON.stringify(bootcamp, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
