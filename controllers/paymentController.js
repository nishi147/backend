const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
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
const StudentRegistration = require('../models/StudentRegistration');
const Currency = require('../models/Currency');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

// Helper to get Razorpay subunit multiplier based on currency code
const getSubunitMultiplier = (currencyCode) => {
    const code = (currencyCode || 'INR').toUpperCase();
    // 3 decimal places
    if (['BHD', 'KWD', 'OMR', 'JOD', 'LYD', 'TND'].includes(code)) {
        return 1000;
    }
    // 0 decimal places
    if (['JPY', 'KRW', 'CLP', 'VND', 'PYG'].includes(code)) {
        return 1;
    }
    // Default (2 decimal places, e.g. INR, USD, EUR, GBP, AED, SAR, etc.)
    return 100;
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private (Student)
exports.createOrder = async (req, res) => {
    try {
        const { courseId, sessions, couponCode, currency } = req.body;
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

        let rate = 1;
        let currencyCode = 'INR';
        if (currency && currency !== 'INR') {
            const currencyObj = await Currency.findOne({ code: currency.toUpperCase(), status: 'active' });
            if (currencyObj) {
                rate = currencyObj.exchangeRate;
                if (rate <= 0) rate = 1;
                currencyCode = currencyObj.code;
            }
        }

        const convertedAmount = amount / rate;
        const multiplier = getSubunitMultiplier(currencyCode);
        const finalAmountInPaise = Math.round(convertedAmount * multiplier);

        const options = {
            amount: finalAmountInPaise,
            currency: currencyCode,
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessions, amount, couponCode } = req.body;
        const courseId = req.body.courseId || req.body.course_id;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is successful
            // Create payment record
            const course = await Course.findById(courseId).populate('teacher');
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
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
            
            const protocol = req.protocol;
            const host = req.get('host');
            const invoiceUrl = `${protocol}://${host}/api/payments/invoice/${payment._id}`;

            const { generateInvoiceHTML } = require('../utils/invoice');
            const sendWhatsApp = require('../utils/sendWhatsApp');

            const invoiceHtml = generateInvoiceHTML(
                {
                    user_id: req.user,
                    course_id: course,
                    payment_id: razorpay_payment_id,
                    amount: amount,
                    createdAt: payment.createdAt || new Date()
                },
                'course',
                `${protocol}://${host}`
            );

            const html = `
              <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
                  <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Enrollment Confirmed 🎒</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Welcome to the course!</p>
                </div>
                <div style="padding:32px 24px;background:white;">
                  <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${req.user.name}</strong>,</p>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 16px;">Payment successful! We are thrilled to have you enrolled in <strong>${course.title}</strong>. Your invoice is attached to this email.</p>
                  <div style="background:#F3F4F6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Course Details:</strong></p>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#4B5563;">
                      <li><strong>Course Name:</strong> ${course.title}</li>
                      <li><strong>Modules:</strong> ${sessions}</li>
                      <li><strong>Instructor:</strong> ${instructorName}</li>
                    </ul>
                  </div>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">You can access your course materials and schedule directly from your student dashboard. You can also view your invoice online using the link below.</p>
                  <div style="text-align:center;margin-bottom:24px;display:flex;justify-content:center;gap:10px;">
                    <a href="${process.env.CLIENT_URL || 'https://ruzann.com'}/dashboard/student/courses" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:14px;margin-right:10px;">Go to Dashboard</a>
                    <a href="${invoiceUrl}" target="_blank" style="display:inline-block;background:#10b981;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:14px;">View Invoice 🧾</a>
                  </div>
                  <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;">Happy Learning!<br>Team RUZANN</p>
                </div>
              </div>
            `;

            await sendEmail({
                email: req.user.email,
                subject: `Enrollment Confirmed - RUZANN`,
                message: `Hi ${req.user.name},\n\nPayment successful! You are enrolled in ${course.title} with instructor ${instructorName}. Modules: ${sessions}.\n\nView Invoice: ${invoiceUrl}\n\nTeam RUZANN`,
                html,
                attachments: [
                    {
                        filename: `invoice_${razorpay_payment_id}.html`,
                        content: invoiceHtml
                    }
                ]
            });

            if (req.user.phone) {
                const waMessage = `Hello *${req.user.name}*,\n\nYour payment of *₹${amount}* for *${course.title}* at Ruzann was successful! 🚀\n\n*Details:*\n- Course: ${course.title}\n- Transaction ID: ${razorpay_payment_id}\n- Date: ${new Date().toLocaleDateString()}\n\nYou can view and print your invoice here:\n${invoiceUrl}\n\nHappy learning!\nTeam RUZANN`;
                await sendWhatsApp({ to: req.user.phone, message: waMessage });
            }

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
        const { currency } = req.body;
        
        let rate = 1;
        let currencyCode = 'INR';
        if (currency && currency !== 'INR') {
            const currencyObj = await Currency.findOne({ code: currency.toUpperCase(), status: 'active' });
            if (currencyObj) {
                rate = currencyObj.exchangeRate;
                if (rate <= 0) rate = 1;
                currencyCode = currencyObj.code;
            }
        }

        const baseAmount = 99;
        const convertedAmount = baseAmount / rate;
        const multiplier = getSubunitMultiplier(currencyCode);
        const finalAmountInPaise = Math.round(convertedAmount * multiplier);

        const options = {
            amount: finalAmountInPaise,
            currency: currencyCode,
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
            const booking = await Booking.create({
                studentName,
                parentName,
                email,
                phone,
                age,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                status: 'completed',
                amount: 99
            });

            // Send Confirmation Email for Intro Offer
            const trialLink = "https://zoom.us/j/ruzann-trial-session";
            
            const protocol = req.protocol;
            const host = req.get('host');
            const invoiceUrl = `${protocol}://${host}/api/payments/invoice/${booking._id}`;

            const { generateInvoiceHTML } = require('../utils/invoice');
            const sendWhatsApp = require('../utils/sendWhatsApp');

            const invoiceHtml = generateInvoiceHTML(
                {
                    studentName,
                    parentName,
                    email,
                    phone,
                    age,
                    paymentId: razorpay_payment_id,
                    amount: 99,
                    createdAt: booking.createdAt || new Date()
                },
                'intro',
                `${protocol}://${host}`
            );

            const html = `
              <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
                  <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Your RUZANN Adventure Starts Now! 🌟</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Welcome to the family!</p>
                </div>
                <div style="padding:32px 24px;background:white;">
                  <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${parentName}</strong>,</p>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 16px;">Payment of <strong>₹99</strong> successful! We've received your booking for <strong>${studentName}</strong> (Age: ${age}). Your invoice is attached to this email.</p>
                  <div style="background:#F3F4F6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Trial Details:</strong></p>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#4B5563;">
                      <li><strong>Student Name:</strong> ${studentName}</li>
                      <li><strong>Meeting Link:</strong> <a href="${trialLink}" style="color:#4f46e5;">Join zoom.us</a></li>
                    </ul>
                  </div>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">Our team will contact you shortly at <strong>${phone}</strong> with the next steps. You can view your invoice online using the link below.</p>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${invoiceUrl}" target="_blank" style="display:inline-block;background:#10b981;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:14px;">View Invoice 🧾</a>
                  </div>
                  <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;">Happy Learning!<br>Team RUZANN</p>
                </div>
              </div>
            `;

            await sendEmail({
                email: email,
                subject: 'Your RUZANN Adventure Starts Now! 🌟',
                message: `Hi ${parentName},\n\nPayment of ₹99 successful for ${studentName}.\n\nMeeting Link: ${trialLink}\nView Invoice: ${invoiceUrl}\n\nTeam RUZANN`,
                html,
                attachments: [
                    {
                        filename: `invoice_${razorpay_payment_id}.html`,
                        content: invoiceHtml
                    }
                ]
            });

            if (phone) {
                const waMessage = `Hello *${parentName}*,\n\nPayment of *₹99* successful for *${studentName}*! 🌟\n\n*Details:*\n- Trial Meeting Link: ${trialLink}\n- Transaction ID: ${razorpay_payment_id}\n- Date: ${new Date().toLocaleDateString()}\n\nOur team will contact you shortly with the next steps. You can view your invoice here:\n${invoiceUrl}\n\nTeam RUZANN`;
                await sendWhatsApp({ to: phone, message: waMessage });
            }

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
        const { workshopId, slotId, couponCode, amount: passedAmount, currency } = req.body;
        const Coupon = require('../models/Coupon');
        
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

        let amount = passedAmount !== undefined ? passedAmount : workshop.price;
        let discountAmount = 0;

        if (couponCode && passedAmount === undefined) {
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

        let rate = 1;
        let currencyCode = 'INR';
        if (currency && currency !== 'INR') {
            const currencyObj = await Currency.findOne({ code: currency.toUpperCase(), status: 'active' });
            if (currencyObj) {
                rate = currencyObj.exchangeRate;
                if (rate <= 0) rate = 1;
                currencyCode = currencyObj.code;
            }
        }

        const convertedAmount = amount / rate;
        const multiplier = getSubunitMultiplier(currencyCode);
        const finalAmountInPaise = Math.round(convertedAmount * multiplier);

        const options = {
            amount: finalAmountInPaise,
            currency: currencyCode,
            receipt: `workshop_order_${Date.now()}`,
            notes: {
                workshopId,
                slotId: slotId || '',
                userId: req.user?.id,
                couponCode: couponCode || ''
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, workshopId, slotId, registrationId, amount, couponCode } = req.body;

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
        
        const finalAmount = amount !== undefined ? amount : workshop.price;

        // Create workshop booking record
        const booking = await WorkshopBooking.create({
            user: req.user?.id,
            workshop: workshopId,
            slotId: slotId || undefined,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: finalAmount,
            status: 'success'
        });

        // Update StudentRegistration if exists
        if (registrationId) {
            await StudentRegistration.findByIdAndUpdate(registrationId, {
                status: 'success',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: finalAmount
            });
        }

        // Handle Coupon/Sale Tracking
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon) {
                const originalAmount = workshop.price;
                const calculatedDiscount = originalAmount - finalAmount;

                await Sale.create({
                    userId: req.user ? req.user.id : undefined,
                    salesUserId: coupon.createdBy,
                    couponCode: coupon.code,
                    originalAmount: originalAmount,
                    discountAmount: calculatedDiscount,
                    finalAmount: finalAmount
                });
            }
        }

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
        let targetEmail = req.user?.email;
        let targetName = req.user?.name;
        let targetPhone = req.user?.phone;

        if (registrationId) {
            const reg = await StudentRegistration.findById(registrationId);
            if (reg) {
                if (!targetEmail) targetEmail = reg.email;
                if (!targetName) targetName = reg.name;
                if (!targetPhone) targetPhone = reg.phone;
            }
        }

        if (targetEmail) {
            const protocol = req.protocol;
            const host = req.get('host');
            const invoiceUrl = `${protocol}://${host}/api/payments/invoice/${booking._id}`;

            const { generateInvoiceHTML } = require('../utils/invoice');
            const sendWhatsApp = require('../utils/sendWhatsApp');

            // Find slot if exists
            let slotObj = null;
            if (slotId) {
                const WorkshopSlot = require('../models/WorkshopSlot');
                slotObj = await WorkshopSlot.findById(slotId);
            }

            // Generate invoice HTML
            const invoiceHtml = generateInvoiceHTML(
                {
                    user: req.user ? req.user : { name: targetName, email: targetEmail, phone: targetPhone },
                    guestName: targetName,
                    guestEmail: targetEmail,
                    guestPhone: targetPhone,
                    workshop: workshop,
                    slotId: slotObj,
                    paymentId: razorpay_payment_id,
                    amount: finalAmount,
                    createdAt: booking.createdAt || new Date()
                },
                'workshop',
                `${protocol}://${host}`
            );

            const html = `
              <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
                  <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Seat Confirmed! 🎟️</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">We are excited to see you!</p>
                </div>
                <div style="padding:32px 24px;background:white;">
                  <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${targetName}</strong>,</p>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 16px;">Your seat is booked for: <strong>${workshop.title}</strong>. Your invoice is attached to this email.</p>
                  <div style="background:#F3F4F6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Workshop Details:</strong></p>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#4B5563;">
                      <li><strong>Name:</strong> ${workshop.title}</li>
                      <li><strong>Date:</strong> ${new Date(workshop.date).toLocaleDateString()}</li>
                      ${slotDetailsHtml ? `<li><strong>Time:</strong> ${slotDetailsHtml.replace('<br><strong>Time:</strong> ', '')}</li>` : ''}
                      <li><strong>Venue:</strong> ${workshop.venue}</li>
                    </ul>
                  </div>
                  <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">You can view and print your invoice online using the link below.</p>
                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${invoiceUrl}" target="_blank" style="display:inline-block;background:#10b981;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:14px;">View Invoice 🧾</a>
                  </div>
                  <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;">See you there!<br>Team RUZANN</p>
                </div>
              </div>
            `;

            await sendEmail({
                email: targetEmail,
                subject: `Seat Confirmed: ${workshop.title}! 🎟️`,
                message: `Hi ${targetName},\n\nYour seat is booked for: ${workshop.title}.\nDate: ${new Date(workshop.date).toLocaleDateString()}${slotDetailsTxt}\nVenue: ${workshop.venue}\n\nView Invoice: ${invoiceUrl}\n\nTeam RUZANN`,
                html,
                attachments: [
                    {
                        filename: `invoice_${razorpay_payment_id}.html`,
                        content: invoiceHtml
                    }
                ]
            });

            if (targetPhone) {
                const waMessage = `Hello *${targetName}*,\n\nYour seat is confirmed for the workshop *${workshop.title}*! 🎟️\n\n*Details:*\n- Date: ${new Date(workshop.date).toLocaleDateString()}\n- Venue: ${workshop.venue}\n- Transaction ID: ${razorpay_payment_id}\n\nYou can view your invoice here:\n${invoiceUrl}\n\nSee you there!\nTeam RUZANN`;
                await sendWhatsApp({ to: targetPhone, message: waMessage });
            }
        }

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
        const { bootcampId, couponCode, amount: passedAmount, currency } = req.body;
        const Coupon = require('../models/Coupon');
        
        if (!bootcampId) {
            return res.status(400).json({ success: false, message: 'Bootcamp ID is required' });
        }

        const bootcamp = await Bootcamp.findById(bootcampId);
        if (!bootcamp) {
            return res.status(404).json({ success: false, message: 'Bootcamp not found' });
        }

        let amount = passedAmount !== undefined ? passedAmount : bootcamp.price;
        let discountAmount = 0;

        if (couponCode && passedAmount === undefined) {
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

        let rate = 1;
        let currencyCode = 'INR';
        if (currency && currency !== 'INR') {
            const currencyObj = await Currency.findOne({ code: currency.toUpperCase(), status: 'active' });
            if (currencyObj) {
                rate = currencyObj.exchangeRate;
                if (rate <= 0) rate = 1;
                currencyCode = currencyObj.code;
            }
        }

        const convertedAmount = amount / rate;
        const multiplier = getSubunitMultiplier(currencyCode);
        const finalAmountInPaise = Math.round(convertedAmount * multiplier);

        const options = {
            amount: finalAmountInPaise,
            currency: currencyCode,
            receipt: `bootcamp_order_${Date.now()}`,
            notes: {
                bootcampId,
                userId: req.user?.id,
                couponCode: couponCode || ''
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, data: order, calculatedAmount: amount });
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
            guestAge,
            registrationId,
            amount,
            couponCode
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
        
        const finalAmount = amount !== undefined ? amount : bootcamp.price;

        // Create bootcamp booking record
        const booking = await BootcampBooking.create({
            user: req.user ? req.user.id : undefined,
            bootcamp: bootcampId,
            guestName,
            guestEmail,
            guestPhone,
            guestAge,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: finalAmount,
            status: 'success'
        });

        // Update StudentRegistration if exists
        if (registrationId) {
            await StudentRegistration.findByIdAndUpdate(registrationId, {
                status: 'success',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: finalAmount
            });
        }

        // Handle Coupon/Sale Tracking
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon) {
                const originalAmount = bootcamp.price;
                const calculatedDiscount = originalAmount - finalAmount;

                await Sale.create({
                    userId: req.user ? req.user.id : undefined,
                    salesUserId: coupon.createdBy,
                    couponCode: coupon.code,
                    originalAmount: originalAmount,
                    discountAmount: calculatedDiscount,
                    finalAmount: finalAmount
                });
            }
        }

        // Send Confirmation Email
        let targetEmail = req.user ? req.user.email : guestEmail;
        let targetName = req.user ? req.user.name : guestName;
        let targetPhone = req.user ? req.user.phone : guestPhone;

        if (registrationId) {
            const reg = await StudentRegistration.findById(registrationId);
            if (reg) {
                if (!targetEmail) targetEmail = reg.email;
                if (!targetName) targetName = reg.name;
                if (!targetPhone) targetPhone = reg.phone;
            }
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const invoiceUrl = `${protocol}://${host}/api/payments/invoice/${booking._id}`;

        const { generateInvoiceHTML } = require('../utils/invoice');
        const sendWhatsApp = require('../utils/sendWhatsApp');

        // Generate invoice HTML
        const invoiceHtml = generateInvoiceHTML(
            {
                user: req.user ? req.user : { name: targetName, email: targetEmail, phone: targetPhone },
                guestName: targetName,
                guestEmail: targetEmail,
                guestPhone: targetPhone,
                bootcamp: bootcamp,
                paymentId: razorpay_payment_id,
                amount: finalAmount,
                createdAt: booking.createdAt || new Date()
            },
            'bootcamp',
            `${protocol}://${host}`
        );

        const html = `
          <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Bootcamp Confirmed! 🎓</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Get ready to accelerate your skills!</p>
            </div>
            <div style="padding:32px 24px;background:white;">
              <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${targetName}</strong>,</p>
              <p style="color:#6B7280;font-size:14px;margin:0 0 16px;">You are officially enrolled in: <strong>${bootcamp.title}</strong>. Your invoice is attached to this email.</p>
              <div style="background:#F3F4F6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Bootcamp Details:</strong></p>
                <ul style="margin:0;padding-left:20px;font-size:14px;color:#4B5563;">
                  <li><strong>Name:</strong> ${bootcamp.title}</li>
                  <li><strong>Dates:</strong> ${new Date(bootcamp.date).toLocaleDateString()} to ${new Date(bootcamp.endDate).toLocaleDateString()}</li>
                  <li><strong>Venue:</strong> ${bootcamp.venue}</li>
                </ul>
              </div>
              <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">You can view and print your invoice online using the link below.</p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${invoiceUrl}" target="_blank" style="display:inline-block;background:#10b981;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:14px;">View Invoice 🧾</a>
              </div>
              <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;">Happy Learning!<br>Team RUZANN</p>
            </div>
          </div>
        `;

        await sendEmail({
            email: targetEmail,
            subject: `Bootcamp Confirmed: ${bootcamp.title}! 🎓`,
            message: `Hi ${targetName},\n\nYour seat is confirmed for the bootcamp: ${bootcamp.title}.\nDate: ${new Date(bootcamp.date).toLocaleDateString()} to ${new Date(bootcamp.endDate).toLocaleDateString()}\nVenue: ${bootcamp.venue}\n\nView Invoice: ${invoiceUrl}\n\nTeam RUZANN`,
            html,
            attachments: [
                {
                    filename: `invoice_${razorpay_payment_id}.html`,
                    content: invoiceHtml
                }
            ]
        });

        if (targetPhone) {
            const waMessage = `Hello *${targetName}*,\n\nYour seat is confirmed for the bootcamp *${bootcamp.title}*! 🎓\n\n*Details:*\n- Dates: ${new Date(bootcamp.date).toLocaleDateString()} to ${new Date(bootcamp.endDate).toLocaleDateString()}\n- Venue: ${bootcamp.venue}\n- Transaction ID: ${razorpay_payment_id}\n\nYou can view your invoice here:\n${invoiceUrl}\n\nHappy learning!\nTeam RUZANN`;
            await sendWhatsApp({ to: targetPhone, message: waMessage });
        }
        return res.status(200).json({ success: true, message: "Bootcamp booking confirmed" });
    } catch (error) {
        console.error("Bootcamp Verification Error:", error);
        res.status(500).json({ success: false, message: 'Internal server error during verification' });
    }
};

// @desc    Get Print-friendly Invoice HTML Page
// @route   GET /api/payments/invoice/:id
// @access  Public (Obfuscated by Unique ID)
exports.getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        
        let doc = null;
        let type = '';

        // 1. Course Payment
        let query = isObjectId ? { _id: id } : { payment_id: id };
        doc = await Payment.findOne(query).populate('user_id').populate({
            path: 'course_id',
            populate: { path: 'teacher' }
        });
        if (doc) {
            type = 'course';
        }

        // 2. Workshop Booking
        if (!doc) {
            query = isObjectId ? { _id: id } : { paymentId: id };
            doc = await WorkshopBooking.findOne(query).populate('user').populate('workshop').populate('slotId');
            if (doc) {
                type = 'workshop';
            }
        }

        // 3. Bootcamp Booking
        if (!doc) {
            query = isObjectId ? { _id: id } : { paymentId: id };
            doc = await BootcampBooking.findOne(query).populate('user').populate('bootcamp');
            if (doc) {
                type = 'bootcamp';
            }
        }

        // 4. Intro Booking (Booking)
        if (!doc) {
            query = isObjectId ? { _id: id } : { paymentId: id };
            doc = await Booking.findOne(query);
            if (doc) {
                type = 'intro';
            }
        }

        if (!doc) {
            return res.status(404).send('<h1>Invoice Not Found</h1><p>We could not find an invoice for this transaction.</p>');
        }

        const { generateInvoiceHTML } = require('../utils/invoice');
        const html = generateInvoiceHTML(doc, type, `${req.protocol}://${req.get('host')}`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Get Invoice Error:', error);
        res.status(500).send('<h1>Server Error</h1><p>An error occurred retrieving the invoice.</p>');
    }
};

// @desc    Get logged in user's payment history
// @route   GET /api/payments/my-payments
// @access  Private (Student)
exports.getMyPayments = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const userPhone = req.user.phone;

        const userPayments = [];

        // 1. Course Payments
        const coursePayments = await Payment.find({ user_id: userId }).populate('course_id');
        coursePayments.forEach(p => {
            userPayments.push({
                _id: p._id,
                createdAt: p.createdAt || p.payment_date || new Date(),
                amount: p.amount,
                status: p.status,
                course: {
                    title: p.course_id ? p.course_id.title : 'Course Enrollment'
                }
            });
        });

        // 2. Workshop Bookings
        const workshopBookings = await WorkshopBooking.find({ user: userId }).populate('workshop');
        workshopBookings.forEach(w => {
            userPayments.push({
                _id: w._id,
                createdAt: w.createdAt || new Date(),
                amount: w.amount,
                status: w.status,
                course: {
                    title: w.workshop ? `Workshop: ${w.workshop.title}` : 'Workshop Booking'
                }
            });
        });

        // 3. Bootcamp Bookings
        const bootcampBookings = await BootcampBooking.find({ user: userId }).populate('bootcamp');
        bootcampBookings.forEach(b => {
            userPayments.push({
                _id: b._id,
                createdAt: b.createdAt || new Date(),
                amount: b.amount,
                status: b.status,
                course: {
                    title: b.bootcamp ? `Bootcamp: ${b.bootcamp.title}` : 'Bootcamp Booking'
                }
            });
        });

        // 4. Intro Offer Trial Bookings (matched by email/phone if there's no direct user reference)
        if (userEmail) {
            const introBookings = await Booking.find({ 
                $or: [
                    { email: userEmail },
                    ...(userPhone ? [{ phone: userPhone }] : [])
                ]
            });
            introBookings.forEach(i => {
                userPayments.push({
                    _id: i._id,
                    createdAt: i.createdAt || new Date(),
                    amount: i.amount,
                    status: i.status === 'completed' ? 'success' : i.status,
                    course: {
                        title: '₹99 Trial Session'
                    }
                });
            });
        }

        // Sort payments by date descending
        userPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: userPayments });
    } catch (error) {
        console.error('Get My Payments Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

