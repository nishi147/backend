const axios = require('axios');

async function testDelete() {
  try {
    // This will likely fail with 401/403 since it's protected, 
    // but if it returns 404, then we know the route is missing.
    const res = await axios.delete('http://localhost:5000/api/users/some-fake-id');
    console.log('Delete Response:', res.status);
  } catch (err) {
    console.log('Delete Error Status:', err.response ? err.response.status : err.message);
  }
}

testDelete();
