/**
 * Sends a WhatsApp message using configured provider or falls back to simulation log
 * @param {Object} options - { to: String, message: String }
 */
const sendWhatsApp = async (options) => {
    const { to, message } = options;
    if (!to) {
        console.log('[WHATSAPP] Skipped - No recipient phone number provided.');
        return false;
    }

    // Clean phone number: remove non-digits, ensure country code is present (defaulting to 91 for India if 10 digits)
    let cleanPhone = to.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    console.log(`\n======================================================`);
    console.log(`[WHATSAPP AUTOMATION - SIMULATED SEND]`);
    console.log(`To: +${cleanPhone}`);
    console.log(`Message:\n${message}`);
    console.log(`======================================================\n`);

    // Twilio Integration
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'
            
            const authHeader = 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64');
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            
            const params = new URLSearchParams();
            params.append('To', `whatsapp:+${cleanPhone}`);
            params.append('From', fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`);
            params.append('Body', message);

            const https = require('https');
            const reqOptions = {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            };

            const req = https.request(url, reqOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    console.log(`[TWILIO WHATSAPP RESPONSE]: Status ${res.statusCode}, Body: ${data}`);
                });
            });

            req.on('error', (err) => {
                console.error('[TWILIO WHATSAPP ERROR]:', err);
            });

            req.write(params.toString());
            req.end();
        } catch (error) {
            console.error('[WHATSAPP SEND ERROR (Twilio)]:', error.message);
        }
    }

    // UltraMsg Integration
    if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
        try {
            const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
            const token = process.env.ULTRAMSG_TOKEN;
            const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;

            const params = new URLSearchParams();
            params.append('token', token);
            params.append('to', `+${cleanPhone}`);
            params.append('body', message);

            const https = require('https');
            const reqOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            };

            const req = https.request(url, reqOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    console.log(`[ULTRAMSG WHATSAPP RESPONSE]: Status ${res.statusCode}, Body: ${data}`);
                });
            });

            req.on('error', (err) => {
                console.error('[ULTRAMSG WHATSAPP ERROR]:', err);
            });

            req.write(params.toString());
            req.end();
        } catch (error) {
            console.error('[WHATSAPP SEND ERROR (UltraMsg)]:', error.message);
        }
    }

    return true;
};

module.exports = sendWhatsApp;
