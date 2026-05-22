const axios = require('axios');

async function test() {
    try {
        console.log("Fetching bootcamps to get a valid ID...");
        const res = await axios.get('http://localhost:5000/api/bootcamps');
        const bootcamps = res.data.data;
        if (!bootcamps || bootcamps.length === 0) {
            console.log("No bootcamps found.");
            return;
        }
        const bootcampId = bootcamps[0]._id;
        console.log(`Using Bootcamp ID: ${bootcampId}`);

        console.log("Sending request to bootcamp-order with currency: 'USD'...");
        const orderRes = await axios.post('http://localhost:5000/api/payments/bootcamp-order', {
            bootcampId,
            currency: 'USD',
            amount: 3999
        });
        console.log("Order Response Status:", orderRes.status);
        console.log("Order Response Data:", JSON.stringify(orderRes.data, null, 2));
    } catch (err) {
        console.error("Error calling backend:", err.response ? err.response.data : err.message);
    }
}
test();
