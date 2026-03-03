const mongoose = require('mongoose');
const WebsiteEnquiry = require('./roomhy-backend/models/WebsiteEnquiry');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/roomhy');
    console.log('Connected to MongoDB');

    // Test if 'accepted' status is valid
    const testEnquiry = new WebsiteEnquiry({
      enquiry_id: 'test_' + Date.now(),
      property_type: 'test',
      property_name: 'test property',
      city: 'test city',
      owner_name: 'test owner',
      owner_phone: '1234567890',
      status: 'accepted'
    });

    await testEnquiry.save();
    console.log('Successfully saved enquiry with status: accepted');

    // Test query
    const enquiries = await WebsiteEnquiry.find({ status: 'accepted' });
    console.log('Found enquiries with status accepted:', enquiries.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
