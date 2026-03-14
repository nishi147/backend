const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.get('http://localhost:5000/api/mentors');
    console.log('Mentors API Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching mentors:', err.message);
  }
}

testApi();
