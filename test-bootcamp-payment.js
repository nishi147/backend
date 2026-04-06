const axios = require('axios');

const testBootcampPayment = async () => {
    try {
        console.log("--- Testing Bootcamp Payment Order Creation ---");
        // We need a valid bootcamp ID from the DB.
        // For testing, we'll try to fetch all bootcamps first.
        const res = await axios.get('http://localhost:5000/api/bootcamps');
        const bootcamps = res.data.data;
        
        if (bootcamps.length === 0) {
            console.log("No bootcamps found. Please seed some bootcamps first.");
            return;
        }

        const bootcampId = bootcamps[0]._id;
        console.log(`Using Bootcamp ID: ${bootcampId}`);

        const orderRes = await axios.post('http://localhost:5000/api/payments/bootcamp-order', {
            bootcampId
        });
        
        console.log("Order Response:", orderRes.data);
        console.log("✓ Success!");

    } catch (error) {
        console.error("Test Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
};

testBootcampPayment();
