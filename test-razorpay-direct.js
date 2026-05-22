const Razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

async function run() {
    try {
        console.log("Using Key:", process.env.RAZORPAY_KEY_ID);
        const options = {
            amount: 4000, // 40.00 USD (in cents)
            currency: 'USD',
            receipt: `test_receipt_${Date.now()}`
        };
        console.log("Creating USD Order directly in Razorpay with options:", options);
        const order = await razorpay.orders.create(options);
        console.log("SUCCESS! Created order:", order);
    } catch (err) {
        console.error("FAILED to create order:", err);
    }
}
run();
