const axios = require('axios');

async function testBoth() {
  try {
    console.log('--- Testing GET /api/users ---');
    try {
      const getRes = await axios.get('http://localhost:5000/api/users');
      console.log('GET Status:', getRes.status);
    } catch (e) {
      console.log('GET Failed:', e.response ? e.response.status : e.message);
    }

    console.log('\n--- Testing DELETE /api/users/some-id ---');
    try {
      const delRes = await axios.delete('http://localhost:5000/api/users/69b263476d3f7b8efdb3f769');
      console.log('DELETE Status:', delRes.status);
    } catch (e) {
      console.log('DELETE Failed:', e.response ? e.response.status : e.message);
    }
  } catch (err) {
    console.error(err);
  }
}

testBoth();
