require('dotenv').config();
const { uploadToCloudinary } = require('./utils/cloudinary');
const axios = require('axios');

async function testCloudinary() {
  console.log('--- Testing Cloudinary Integration ---');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  
  try {
    // 1. Get a sample image buffer
    const response = await axios.get('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      responseType: 'arraybuffer'
    });
    const buffer = Buffer.from(response.data);
    console.log('✓ Successfully fetched sample image buffer');

    // 2. Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const url = await uploadToCloudinary(buffer, 'ruzann_test');
    
    console.log('✓ Upload Successful!');
    console.log('Uploaded URL:', url);
    
    if (url.startsWith('https://res.cloudinary.com/')) {
        console.log('🎉 Integration Verified!');
    } else {
        console.log('❌ Unexpected URL format.');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.response) {
        console.error('Response Data:', error.response.data);
    }
  }
}

testCloudinary();
