const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function getLatestToken() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nivaari');
    const inviteTokens = db.collection('inviteTokens');
    
    // Get the token we just created
    const token = await inviteTokens.findOne({ 
      _id: new ObjectId('690b0b2d097f427523a698f7') 
    });
    
    if (token) {
      console.log('🎯 Found invite token:');
      console.log('Email:', token.email);
      console.log('Token Value:', token.token);
      console.log('Has Location:', !!token.assignedLocation);
      console.log('Location:', token.assignedLocation);
      console.log('Expires:', token.expiresAt);
      console.log('Used:', token.used);
      console.log('');
      console.log('🔗 Registration URL:');
      console.log(`http://localhost:3000/moderator/register?token=${token.token}`);
    } else {
      console.log('❌ Token not found');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getLatestToken();