/**
 * Simple Invoice Generator (HTML Template)
 * @param {Object} payment - Payment object
 * @returns {String} HTML string for the invoice
 */
const generateInvoiceHTML = (payment) => {
    return `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; border: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #6366f1; margin: 0;">RUZANN INVOICE</h1>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: bold;">Ruzann Education</p>
                    <p style="margin: 0; font-size: 12px;">invoice@ruzann.com</p>
                </div>
            </div>

            <div style="margin-bottom: 40px;">
                <h3 style="margin-bottom: 10px;">Bill To:</h3>
                <p style="margin: 0;"><b>${payment.user?.name || 'Student'}</b></p>
                <p style="margin: 0;">${payment.user?.email || ''}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                <thead>
                    <tr style="background: #f9fafb text-align: left;">
                        <th style="padding: 12px; border-bottom: 1px solid #eee;">Description</th>
                        <th style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #eee;">
                            ${payment.course?.title || 'Course Enrollment'}
                            <br/>
                            <small style="color: #666;">Transaction ID: ${payment.razorpay_payment_id || payment._id}</small>
                        </td>
                        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                            ₹${payment.amount}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 40px;">
                <p style="font-size: 18px; font-weight: bold; color: #6366f1;">Total Paid: ₹${payment.amount}</p>
                <p style="font-size: 12px; color: #999;">Date: ${new Date(payment.createdAt).toLocaleDateString()}</p>
            </div>

            <div style="margin-top: 60px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="font-size: 12px; color: #999;">Thank you for choosing Ruzann! 🚀</p>
            </div>
        </div>
    `;
};

module.exports = { generateInvoiceHTML };
