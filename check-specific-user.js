const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkSpecificUser() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nivaari');
    const users = db.collection('users');
    const moderators = db.collection('moderators');
    
    console.log('🔍 Searching for test-location-debug@example.com...\n');
    
    // Check users collection
    const user = await users.findOne({ email: 'test-location-debug@example.com' });
    if (user) {
      console.log('👤 USER FOUND:');
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Check for corresponding moderator record
      const moderator = await moderators.findOne({ userId: user._id });
      if (moderator) {
        console.log('\n👨‍💼 MODERATOR RECORD FOUND:');
        console.log(`   ID: ${moderator._id}`);
        console.log(`   User ID: ${moderator.userId}`);
        console.log(`   Email: ${moderator.email}`);
        console.log(`   Has Location: ${!!moderator.assignedLocation}`);
        if (moderator.assignedLocation) {
          console.log(`   Location: lat=${moderator.assignedLocation.lat}, lng=${moderator.assignedLocation.lng}`);
        }
        console.log(`   Status: ${moderator.status}`);
        console.log(`   Created: ${moderator.createdAt}`);
        
        // Success or failure analysis
        if (moderator.assignedLocation) {
          console.log('\n🎉 SUCCESS: Location assignment worked!');
          console.log('✅ Automatic location transfer from invite token successful');
        } else {
          console.log('\n❌ FAILURE: Location not assigned');
          console.log('🔍 Need to investigate why location transfer failed');
        }
      } else {
        console.log('\n❌ MODERATOR RECORD NOT FOUND');
        console.log('🔍 User exists but no moderator record created');
      }
    } else {
      console.log('❌ USER NOT FOUND');
      console.log('🔍 Registration may not have completed successfully');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSpecificUser();