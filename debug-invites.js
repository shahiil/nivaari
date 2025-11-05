require('dotenv').config();
const { MongoClient } = require('mongodb');

async function debugInvites() {
  console.log('🔌 Connecting to MongoDB...');
  console.log('📍 URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
  
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/nivaari');
  
  try {
    console.log('⏳ Attempting connection...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const db = client.db('nivaari');
    const inviteTokens = db.collection('inviteTokens');
    
    console.log('🔍 Querying invite tokens...');
    const tokens = await inviteTokens.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(`📋 Found ${tokens.length} tokens`);
    
    if (tokens.length === 0) {
      console.log('📪 No invite tokens found in the database');
      return;
    }
    
    tokens.forEach((token, index) => {
      console.log(`\n📧 Invite ${index + 1}:`);
      console.log(`  Token: ${token.token?.substring(0, 8)}...`);
      console.log(`  Email: ${token.email || 'N/A'}`);
      console.log(`  Type: ${token.type}`);
      console.log(`  Role: ${token.role}`);
      console.log(`  Has Location: ${!!token.assignedLocation}`);
      if (token.assignedLocation) {
        console.log(`  Location: lat=${token.assignedLocation.lat}, lng=${token.assignedLocation.lng}`);
      }
      console.log(`  Created: ${token.createdAt}`);
      console.log(`  Used: ${token.used}`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total invites: ${tokens.length}`);
    console.log(`  With locations: ${tokens.filter(t => t.assignedLocation).length}`);
    console.log(`  Used: ${tokens.filter(t => t.used).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('🔌 Closing connection...');
    await client.close();
    console.log('✅ Connection closed');
  }
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.log('⏰ Script timeout after 30 seconds');
  process.exit(1);
}, 30000);

debugInvites().then(() => {
  clearTimeout(timeout);
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  clearTimeout(timeout);
  console.error('💥 Script failed:', error);
  process.exit(1);
});