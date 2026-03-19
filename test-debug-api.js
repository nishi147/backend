const axios = require('axios');

async function debugRequest() {
  console.log("Starting local DEBUG request to http://localhost:5000/api/courses...");
  
  try {
    const res = await axios.post('http://localhost:5000/api/courses', {
      title: "Debug Course",
      category: "Test",
      description: "Debug test",
      modules: []
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("SUCCESS:", res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.log("SERVER RETURNED ERROR:", err.response.status);
      console.log("RESPONSE DATA (JSON expected):", err.response.data);
      if (typeof err.response.data === 'string' && err.response.data.includes('DOCTYPE html')) {
          console.log("ERROR IS HTML - FIX NOT ACTIVE OR MIDDLEWARE CRASH");
      }
    } else {
      console.log("NETWORK ERROR / SERVER NOT RUNNING:", err.message);
    }
  }
}

debugRequest();
