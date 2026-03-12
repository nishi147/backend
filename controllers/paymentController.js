const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Booking = require('../models/Booking');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private (Student)
exports.createOrder = async (req, res) => {
    try {
        const { courseId } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const amount = course.totalCoursePrice * 100; // Razorpay expects amount in paise

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify Payment
// @route   POST /api/payments/verify
// @access  Private (Student)
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is successful
            // Create payment record
            const course = await Course.findById(courseId);
            const payment = await Payment.create({
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                user_id: req.user.id,
                course_id: courseId,
                amount: course.totalCoursePrice,
                status: 'success'
            });

            // Enroll the student
            await Enrollment.create({
                student: req.user.id,
                course: courseId,
                status: 'active',
                paymentId: payment._id
            });

            return res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create Razorpay Order for ₹1 Intro Offer
// @route   POST /api/payments/intro-order
// @access  Public
exports.createIntroOrder = async (req, res) => {
    try {
        const options = {
            amount: 100, // ₹1 = 100 paise
            currency: 'INR',
            receipt: `intro_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify ₹1 Intro Payment
// @route   POST /api/payments/intro-verify
// @access  Public
exports.verifyIntroPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            studentName, 
            parentName, 
            email, 
            phone, 
            age 
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Save Booking
            await Booking.create({
                studentName,
                parentName,
                email,
                phone,
                age,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                status: 'completed'
            });

            return res.status(200).json({ success: true, message: "₹1 Offer Claimed Successfully!" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
