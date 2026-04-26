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
const Bootcamp = require('../models/Bootcamp');
const BootcampBooking = require('../models/BootcampBooking');

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
            const course = await Course.findById(courseId).populate('teacher');
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
            const instructorName = course.teacher && course.teacher.name ? course.teacher.name : 'RUZANN Instructor';
            
            const html = `
              <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
                  <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Enrollment Confirmed 🎒</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Welcome to the course!</p>
                </div>
                <div style="padding:32px 24px;background:white;">
                  <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${req.user.name}</strong>,</p>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 16px;">Payment successful! We are thrilled to have you enrolled in <strong>${course.title}</strong>.</p>
                  <div style="background:#F3F4F6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Course Details:</strong></p>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#4B5563;">
                      <li><strong>Course Name:</strong> ${course.title}</li>
                      <li><strong>Modules:</strong> ${sessions}</li>
                      <li><strong>Instructor:</strong> ${instructorName}</li>
                    </ul>
                  </div>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">You can access your course materials and schedule directly from your student dashboard.</p>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${process.env.CLIENT_URL || 'https://ruzann.com'}/dashboard/student/courses" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:16px;">Go to Dashboard</a>
                  </div>
                  <p style="color:#9CA3AF;font-size:12px;margin:0;">Happy Learning!<br>Team RUZANN</p>
                </div>
              </div>
            `;

            await sendEmail({
                email: req.user.email,
                subject: `Enrollment Confirmed - RUZANN`,
                message: `Hi ${req.user.name},\n\nPayment successful! You are enrolled in ${course.title} with instructor ${instructorName}. Modules: ${sessions}.\n\nLog in to your dashboard to start learning.\nTeam RUZANN`,
                html
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

// @desc    Create Razorpay Order for ₹99 Intro Offer
// @route   POST /api/payments/intro-order
// @access  Public
exports.createIntroOrder = async (req, res) => {
    try {
        const options = {
            amount: 9900, // ₹99 = 9900 paise
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

// @desc    Verify ₹99 Intro Payment
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
            const trialLink = "https://zoom.us/j/ruzann-trial-session";
            
            await sendEmail({
                email: email,
                subject: 'Your RUZANN Adventure Starts Now! 🌟',
                message: `Hi ${parentName},\n\nPayment of ₹99 successful! We've received your booking for ${studentName}.\n\nMeeting Link: ${trialLink}\nOur team will contact you shortly with the next steps.\n\nWelcome to the family!\nTeam RUZANN`,
                html: `<h1>Your RUZANN Adventure Starts Now! 🌟</h1><p>Hi ${parentName},</p><p>Payment of <strong>₹99</strong> successful!</p><p>We've received your booking for <strong>${studentName}</strong> (Age: ${age}).</p><p><strong>Meeting Link:</strong> <a href="${trialLink}">${trialLink}</a></p><p>Our team will contact you shortly at ${phone} with the next steps.</p><p>Welcome to the family!<br>Team RUZANN</p>`
            });

            return res.status(200).json({ success: true, message: "₹99 Offer Claimed Successfully!" });
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
// @access  Private (Authenticated)
exports.createWorkshopOrder = async (req, res) => {
    try {
        const { workshopId, slotId } = req.body;
        
        if (!workshopId) {
            return res.status(400).json({ success: false, message: 'Workshop ID is required' });
        }

        const workshop = await Workshop.findById(workshopId);
        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Workshop not found' });
        }

        if (slotId) {
            const WorkshopSlot = require('../models/WorkshopSlot');
            const slot = await WorkshopSlot.findById(slotId);
            if (!slot) {
                return res.status(404).json({ success: false, message: 'Time slot not found' });
            }
            if (slot.capacity <= slot.bookedCount) {
                return res.status(400).json({ success: false, message: 'Slot is already full' });
            }
        }

        const options = {
            amount: Math.round(workshop.price * 100), // Ensure integer paise
            currency: 'INR',
            receipt: `workshop_order_${Date.now()}`,
            notes: {
                workshopId,
                slotId: slotId || '',
                userId: req.user?.id
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Workshop Order Error:", error);
        res.status(500).json({ success: false, message: 'Failed to create workshop order' });
    }
};

// @desc    Verify Workshop Payment
// @route   POST /api/payments/workshop-verify
// @access  Private (Authenticated)
exports.verifyWorkshopPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, workshopId, slotId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment identifiers" });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        const workshop = await Workshop.findById(workshopId);
        if (!workshop) {
            return res.status(404).json({ success: false, message: "Workshop details not found" });
        }
        
        // Create workshop booking record
        await WorkshopBooking.create({
            user: req.user.id,
            workshop: workshopId,
            slotId: slotId || undefined,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: workshop.price,
            status: 'success'
        });

        // Handle Slot Booked Count
        let slotDetailsTxt = '';
        let slotDetailsHtml = '';
        if (slotId) {
            const WorkshopSlot = require('../models/WorkshopSlot');
            const slot = await WorkshopSlot.findByIdAndUpdate(slotId, {
                $inc: { bookedCount: 1 }
            }, { new: true });
            
            if (slot) {
                slotDetailsTxt = `\nTime: ${slot.startTime} to ${slot.endTime}`;
                slotDetailsHtml = `<br><strong>Time:</strong> ${slot.startTime} to ${slot.endTime}`;
            }
        }

        // Send Confirmation Email
        await sendEmail({
            email: req.user.email,
            subject: `Seat Confirmed: ${workshop.title}! 🎟️`,
            message: `Hi ${req.user.name},\n\nYour seat is booked for: ${workshop.title}.\nDate: ${new Date(workshop.date).toLocaleDateString()}${slotDetailsTxt}\nVenue: ${workshop.venue}\n\nSee you there!\nTeam RUZANN`,
            html: `<h1>Seat Confirmed! 🎟️</h1><p>Hi ${req.user.name},</p><p>You are booked for: <strong>${workshop.title}</strong>.</p><p><strong>Date:</strong> ${new Date(workshop.date).toLocaleDateString()}${slotDetailsHtml}<br><strong>Venue:</strong> ${workshop.venue}</p><p>See you there!<br>Team RUZANN</p>`
        });

        return res.status(200).json({ success: true, message: "Workshop booking confirmed" });

    } catch (error) {
        console.error("Workshop Verification Error:", error);
        res.status(500).json({ success: false, message: 'Internal server error during verification' });
    }
};

// @desc    Create Razorpay Order for Bootcamp
// @route   POST /api/payments/bootcamp-order
// @access  Private (Authenticated)
exports.createBootcampOrder = async (req, res) => {
    try {
        const { bootcampId } = req.body;
        
        if (!bootcampId) {
            return res.status(400).json({ success: false, message: 'Bootcamp ID is required' });
        }

        const bootcamp = await Bootcamp.findById(bootcampId);
        if (!bootcamp) {
            return res.status(404).json({ success: false, message: 'Bootcamp not found' });
        }

        const options = {
            amount: Math.round(bootcamp.price * 100), // Ensure integer paise
            currency: 'INR',
            receipt: `bootcamp_order_${Date.now()}`,
            notes: {
                bootcampId,
                userId: req.user?.id
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Bootcamp Order Error:", error);
        res.status(500).json({ success: false, message: 'Failed to create bootcamp order' });
    }
};

// @desc    Verify Bootcamp Payment
// @route   POST /api/payments/bootcamp-verify
// @access  Private (Authenticated)
exports.verifyBootcampPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            bootcampId,
            guestName,
            guestEmail,
            guestPhone,
            guestAge
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment identifiers" });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        const bootcamp = await Bootcamp.findById(bootcampId);
        if (!bootcamp) {
            return res.status(404).json({ success: false, message: "Bootcamp details not found" });
        }
        
        // Create bootcamp booking record
        await BootcampBooking.create({
            user: req.user ? req.user.id : undefined,
            bootcamp: bootcampId,
            guestName,
            guestEmail,
            guestPhone,
            guestAge,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: bootcamp.price,
            status: 'success'
        });

        // Send Confirmation Email
        const targetEmail = req.user ? req.user.email : guestEmail;
        const targetName = req.user ? req.user.name : guestName;

        await sendEmail({
            email: targetEmail,
            subject: `Bootcamp Confirmed: ${bootcamp.title}! 🎓`,
            message: `Hi ${targetName},\n\nYour seat is confirmed for the bootcamp: ${bootcamp.title}.\nDate: ${new Date(bootcamp.date).toLocaleDateString()} to ${new Date(bootcamp.endDate).toLocaleDateString()}\nVenue: ${bootcamp.venue}\n\nGet ready for an intensive learning journey!\nTeam RUZANN`,
            html: `<h1>Bootcamp Enrollment Confirmed! 🎓</h1><p>Hi ${targetName},</p><p>You are officially enrolled in: <strong>${bootcamp.title}</strong>.</p><p><strong>Dates:</strong> ${new Date(bootcamp.date).toLocaleDateString()} to ${new Date(bootcamp.endDate).toLocaleDateString()}<br><strong>Venue:</strong> ${bootcamp.venue}</p><p>Get ready for an intensive learning journey!<br>Team RUZANN</p>`
        });

        return res.status(200).json({ success: true, message: "Bootcamp booking confirmed" });

    } catch (error) {
        console.error("Bootcamp Verification Error:", error);
        res.status(500).json({ success: false, message: 'Internal server error during verification' });
    }
};
