const axios = require('axios');
require('dotenv').config();

const testLogin = async () => {
    const API = `http://localhost:${process.env.PORT || 5000}`;
    try {
        console.log(`Testing login at ${API}/api/auth/login...`);
        const res = await axios.post(`${API}/api/auth/login`, {
            email: 'admin@ruzann.com',
            password: '@SAruzann#786'
        });
        console.log('Login successful:', res.data);
    } catch (err) {
        console.error('Login failed:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

testLogin();
