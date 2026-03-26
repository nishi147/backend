const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Booking = require('../models/Booking');
const Workshop = require('../models/Workshop');
const WorkshopBooking = require('../models/WorkshopBooking');
const sendEmail = require('../utils/sendEmail');
const Coupon = require('../models/Coupon');
const Sale = require('../models/Sale');
const Lead = require('../models/Lead');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private (Student)
exports.createOrder = async (req, res) => {
    try {
        const { courseId, sessions, couponCode } = req.body;
        const Coupon = require('../models/Coupon');
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!sessions || sessions < 1 || sessions > course.numberOfSessions) {
            return res.status(400).json({ success: false, message: 'Invalid number of sessions' });
        }

        let amount = course.pricePerSession * sessions;
        let discountAmount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ 
                code: couponCode.toUpperCase(), 
                isActive: true, 
                expiryDate: { $gt: Date.now() } 
            });
            if (coupon) {
                if (coupon.discountType === 'percent') {
                    discountAmount = (amount * coupon.discountValue) / 100;
                } else {
                    discountAmount = coupon.discountValue;
                }
                amount = Math.max(0, amount - discountAmount);
            }
        }

        const finalAmountInPaise = Math.round(amount * 100);

        const options = {
            amount: finalAmountInPaise,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
            notes: {
                couponCode: couponCode || ''
            }
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, sessions, amount, couponCode } = req.body;

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
                amount: amount,
                status: 'success'
            });

            // Enroll the student
            await Enrollment.create({
                student: req.user.id,
                course: courseId,
                sessionsPurchased: sessions,
                amountPaid: amount,
                status: 'active',
                paymentId: payment._id
            });

            // Handle Coupon/Sale Tracking
            if (couponCode) {
                const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
                if (coupon) {
                    const originalPriceBeforeDiscount = amount / (1 - (coupon.discountType === 'percent' ? coupon.discountValue/100 : 0)); // Approx if fixed not easily reversible without more data, but better to fetch original from course.
                    // Recalculate original from course for precision
                    const originalAmount = course.pricePerSession * sessions;
                    const calculatedDiscount = originalAmount - amount;

                    await Sale.create({
                        userId: req.user.id,
                        salesUserId: coupon.createdBy,
                        couponCode: coupon.code,
                        originalAmount: originalAmount,
                        discountAmount: calculatedDiscount,
                        finalAmount: amount
                    });

                    // Update Lead
                    const lead = await Lead.findOne({ 
                        $or: [{ email: req.user.email }, { phone: req.user.phone }] 
                    });
                    if (lead) {
                        lead.status = 'Converted';
                        lead.revenue = amount;
                        lead.convertedAt = Date.now();
                        await lead.save();
                    }
                }
            }

            // Send Confirmation Email
            await sendEmail({
                email: req.user.email,
                subject: `Welcome to ${course.title}! 🎒`,
                message: `Hi ${req.user.name},\n\nPayment successful! You are now enrolled in ${course.title}. Log in to your dashboard to start learning.\n\nHappy Learning!\nTeam RUZANN`,
                html: `<h1>Welcome to ${course.title}! 🎒</h1><p>Hi ${req.user.name},</p><p>Payment successful! You are now enrolled in <strong>${course.title}</strong>.</p><p>Log in to your dashboard to start learning.</p><p>Happy Learning!<br>Team RUZANN</p>`
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

            // Send Confirmation Email for Intro Offer
            await sendEmail({
                email: email,
                subject: 'Your RUZANN Adventure Starts Now! 🌟',
                message: `Hi ${parentName},\n\nPayment of ₹1 successful! We've received your booking for ${studentName}. Our team will contact you shortly with the next steps.\n\nWelcome to the family!\nTeam RUZANN`,
                html: `<h1>Your RUZANN Adventure Starts Now! 🌟</h1><p>Hi ${parentName},</p><p>Payment of <strong>₹1</strong> successful!</p><p>We've received your booking for <strong>${studentName}</strong> (Age: ${age}). Our team will contact you shortly at ${phone} with the next steps.</p><p>Welcome to the family!<br>Team RUZANN</p>`
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

// @desc    Create Razorpay Order for Workshop
// @route   POST /api/payments/workshop-order
// @access  Private (Student)
exports.createWorkshopOrder = async (req, res) => {
    try {
        const { workshopId } = req.body;
        
        const workshop = await Workshop.findById(workshopId);
        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Workshop not found' });
        }

        const amount = workshop.price * 100; // Razorpay expects amount in paise

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_workshop_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify Workshop Payment
// @route   POST /api/payments/workshop-verify
// @access  Private (Student)
exports.verifyWorkshopPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, workshopId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const workshop = await Workshop.findById(workshopId);
            
            // Create workshop booking record
            await WorkshopBooking.create({
                user: req.user.id,
                workshop: workshopId,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: workshop.price,
                status: 'success'
            });

            // Send Confirmation Email
            const meetingDetailsTxt = workshop.meetingLink ? `\nMeeting Link: ${workshop.meetingLink}\nMake sure to save this link to join the session!` : '';
            const meetingDetailsHtml = workshop.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${workshop.meetingLink}">${workshop.meetingLink}</a></p><p>Make sure to save this link to join the session!</p>` : '';

            await sendEmail({
                email: req.user.email,
                subject: `Your Seat is Booked for ${workshop.title}! 🎟️`,
                message: `Hi ${req.user.name},\n\nPayment successful! Your seat is now booked for the workshop: ${workshop.title}.\n\nDate: ${new Date(workshop.date).toLocaleDateString()}\nVenue: ${workshop.venue}${meetingDetailsTxt}\n\nSee you there!\nTeam RUZANN`,
                html: `<h1>Your Seat is Booked! 🎟️</h1><p>Hi ${req.user.name},</p><p>Payment successful! Your seat is now booked for the workshop: <strong>${workshop.title}</strong>.</p><p><strong>Date:</strong> ${new Date(workshop.date).toLocaleDateString()}<br><strong>Venue:</strong> ${workshop.venue}</p>${meetingDetailsHtml}<p>See you there!<br>Team RUZANN</p>`
            });

            return res.status(200).json({ success: true, message: "Workshop payment verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
