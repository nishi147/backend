const axios = require('axios');

const testLogin = async () => {
    const API = 'http://localhost:5000';
    try {
        console.log(`[TEST] Sending request to ${API}/api/auth/login...`);
        const res = await axios.post(`${API}/api/auth/login`, {
            email: 'admin@ruzann.com',
            password: '@SAruzann#786'
        });
        console.log('[TEST] SUCCESS:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('[TEST] ERROR:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Message:', err.message);
        }
    }
};

testLogin();
