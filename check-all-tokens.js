const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAllTokens() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nivaari');
    const inviteTokens = db.collection('inviteTokens');
    
    console.log('🔍 All tokens for test-location-debug@example.com:\n');
    
    const tokens = await inviteTokens.find({ 
      email: 'test-location-debug@example.com' 
    }).sort({ createdAt: -1 }).toArray();
    
    tokens.forEach((token, i) => {
      console.log(`📧 Token ${i + 1}:`);
      console.log(`   ID: ${token._id}`);
      console.log(`   Token: ${token.token.substring(0, 8)}...`);
      console.log(`   Has Location: ${!!token.assignedLocation}`);
      if (token.assignedLocation) {
        console.log(`   Location: lat=${token.assignedLocation.lat}, lng=${token.assignedLocation.lng}`);
      }
      console.log(`   Used: ${token.used}`);
      console.log(`   Created: ${token.createdAt}`);
      console.log(`   Expires: ${token.expiresAt}`);
      console.log('');
    });
    
    // Check which token would be found by the registration query
    const registrationQuery = await inviteTokens.findOne({ 
      email: 'test-location-debug@example.com',
      used: false 
    });
    
    if (registrationQuery) {
      console.log('🎯 Token that registration would find:');
      console.log(`   ID: ${registrationQuery._id}`);
      console.log(`   Has Location: ${!!registrationQuery.assignedLocation}`);
      console.log(`   Location:`, registrationQuery.assignedLocation);
    } else {
      console.log('❌ No unused tokens found for registration');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllTokens();