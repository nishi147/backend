/**
 * Premium Invoice Generator (HTML Template)
 * Supports Courses, Workshops, Bootcamps, and Intro Offers
 * @param {Object} doc - Payment/Booking document
 * @param {String} type - Type of payment ('course', 'workshop', 'bootcamp', 'intro')
 * @returns {String} HTML string for the invoice page
 */
const generateInvoiceHTML = (doc, type, baseUrl = '') => {
    const logoUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/uploads/ruzann_logo_new_v3.png` : '/uploads/ruzann_logo_new_v3.png';
    let userName = 'Student';
    let userEmail = '';
    let userPhone = '';
    let description = 'Ruzann Education Enrollment';
    let transactionId = '';
    let amount = 0;
    let date = new Date();
    let detailsHtml = '';

    if (type === 'course') {
        userName = doc.user_id?.name || 'Student';
        userEmail = doc.user_id?.email || '';
        userPhone = doc.user_id?.phone || '';
        description = doc.course_id?.title || 'Course Enrollment';
        transactionId = doc.payment_id;
        amount = doc.amount;
        date = doc.createdAt || doc.payment_date || new Date();
        detailsHtml = `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #1f2937; font-size: 15px;">${description}</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">
                        Instructor: ${doc.course_id?.teacher?.name || 'RUZANN Instructor'}
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1f2937;">
                    ₹${amount}
                </td>
            </tr>
        `;
    } else if (type === 'workshop') {
        userName = doc.user?.name || doc.guestName || 'Student';
        userEmail = doc.user?.email || doc.guestEmail || '';
        userPhone = doc.user?.phone || doc.guestPhone || '';
        description = doc.workshop?.title || 'Workshop Seat';
        transactionId = doc.paymentId;
        amount = doc.amount;
        date = doc.createdAt || new Date();
        const slotText = doc.slotId ? ` (${doc.slotId.startTime} - ${doc.slotId.endTime})` : '';
        detailsHtml = `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #1f2937; font-size: 15px;">${description}</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">
                        Date: ${doc.workshop?.date ? new Date(doc.workshop.date).toLocaleDateString() : 'N/A'}${slotText}<br/>
                        Venue: ${doc.workshop?.venue || 'Online'}
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1f2937;">
                    ₹${amount}
                </td>
            </tr>
        `;
    } else if (type === 'bootcamp') {
        userName = doc.user?.name || doc.guestName || 'Student';
        userEmail = doc.user?.email || doc.guestEmail || '';
        userPhone = doc.user?.phone || doc.guestPhone || '';
        description = doc.bootcamp?.title || 'Bootcamp Enrollment';
        transactionId = doc.paymentId;
        amount = doc.amount;
        date = doc.createdAt || new Date();
        detailsHtml = `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #1f2937; font-size: 15px;">${description}</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">
                        Dates: ${doc.bootcamp?.date ? new Date(doc.bootcamp.date).toLocaleDateString() : 'N/A'} to ${doc.bootcamp?.endDate ? new Date(doc.bootcamp.endDate).toLocaleDateString() : 'N/A'}<br/>
                        Venue: ${doc.bootcamp?.venue || 'Online'}
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1f2937;">
                    ₹${amount}
                </td>
            </tr>
        `;
    } else if (type === 'intro') {
        userName = doc.parentName || doc.studentName || 'Student';
        userEmail = doc.email || '';
        userPhone = doc.phone || '';
        description = `₹99 Intro Offer Booking (Student: ${doc.studentName || 'N/A'}, Age: ${doc.age || 'N/A'})`;
        transactionId = doc.paymentId;
        amount = doc.amount || 99;
        date = doc.createdAt || new Date();
        detailsHtml = `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #1f2937; font-size: 15px;">${description}</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">
                        Includes 1-on-1 Trial Session with Mentor & AI Funnel Report.<br/>
                        Zoom Meeting Link: <a href="https://zoom.us/j/ruzann-trial-session" style="color: #6366f1; text-decoration: none;">Join zoom.us</a>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1f2937;">
                    ₹${amount}
                </td>
            </tr>
        `;
    }

    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - ${transactionId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 40px 20px;
        }
        .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }
        .header-gradient {
            background: linear-gradient(135deg, #4f46e5, #ef4444);
            padding: 40px;
            color: #ffffff;
        }
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo-text {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -1px;
            margin: 0;
        }
        .invoice-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 800;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 6px 14px;
            border-radius: 99px;
            margin: 0;
            display: inline-block;
        }
        .details-section {
            padding: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            border-bottom: 1px solid #e2e8f0;
        }
        .bill-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 800;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        .bill-value {
            font-size: 15px;
            line-height: 1.6;
            margin: 0;
            color: #1e293b;
        }
        .table-section {
            padding: 40px;
        }
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }
        .invoice-table th {
            padding: 12px 15px;
            border-bottom: 2px solid #e2e8f0;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 800;
        }
        .total-row {
            margin-top: 30px;
            text-align: right;
            padding: 0 40px 40px;
        }
        .total-amount {
            font-size: 24px;
            font-weight: 900;
            color: #4f46e5;
            margin: 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .print-btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            font-weight: bold;
            padding: 10px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 14px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
            transition: all 0.2s;
        }
        .print-btn:hover {
            background-color: #4338ca;
            transform: translateY(-1px);
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background-color: #ffffff;
                padding: 0;
            }
            .invoice-card {
                border: none;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-card">
        <div class="header-gradient">
            <div class="header-content">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="background-color: #ffffff; padding: 6px 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); vertical-align: middle;">
                        <img src="${logoUrl}" alt="RUZANN Logo" style="height: 36px; display: block; object-fit: contain;" />
                    </div>
                    <div>
                        <p style="margin: 0; opacity: 0.9; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Future-Ready EdTech Platform</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span class="invoice-title">Official Receipt</span>
                </div>
            </div>
        </div>

        <div class="details-section">
            <div>
                <div class="bill-label">Billed To</div>
                <p class="bill-value">
                    <strong>${userName}</strong><br/>
                    ${userEmail ? `${userEmail}<br/>` : ''}
                    ${userPhone ? `${userPhone}` : ''}
                </p>
            </div>
            <div style="text-align: right;">
                <div class="bill-label">Payment Information</div>
                <p class="bill-value">
                    <strong>Invoice Date:</strong> ${formattedDate}<br/>
                    <strong>Transaction ID:</strong> ${transactionId}<br/>
                    <strong>Status:</strong> Paid ✅
                </p>
            </div>
        </div>

        <div class="table-section">
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${detailsHtml}
                </tbody>
            </table>
        </div>

        <div class="total-row">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Grand Total Paid</p>
            <h2 class="total-amount">₹${amount}</h2>
        </div>

        <div class="no-print" style="text-align: center; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
            <button onclick="window.print()" class="print-btn">Print Invoice 🖨️</button>
        </div>

        <div class="footer">
            <p style="margin: 0; font-weight: bold;">Thank you for choosing Ruzann! 🚀</p>
            <p style="margin: 4px 0 0 0; font-size: 11px;">If you have any questions, please contact support@ruzann.com</p>
        </div>
    </div>
</body>
</html>
`;
};

module.exports = { generateInvoiceHTML };
