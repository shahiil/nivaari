const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function simulateRegistration() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nivaari');
    const inviteTokens = db.collection('inviteTokens');
    const moderators = db.collection('moderators');
    const users = db.collection('users');
    
    console.log('🔍 Simulating registration process...\n');
    
    // Step 1: Find the used token for our test user
    const tokenDoc = await inviteTokens.findOne({ 
      email: 'test-location-debug@example.com',
      used: true 
    });
    
    if (!tokenDoc) {
      console.log('❌ Token not found');
      return;
    }
    
    console.log('🎫 Found token:');
    console.log('  Email:', tokenDoc.email);
    console.log('  Has Location:', !!tokenDoc.assignedLocation);
    console.log('  Location:', tokenDoc.assignedLocation);
    console.log('  Used:', tokenDoc.used);
    
    // Step 2: Find the user that was created
    const user = await users.findOne({ email: 'test-location-debug@example.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n👤 Found user:');
    console.log('  ID:', user._id.toString());
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    
    // Step 3: Find the moderator record
    const moderator = await moderators.findOne({ userId: user._id });
    if (!moderator) {
      console.log('❌ Moderator record not found');
      return;
    }
    
    console.log('\n👨‍💼 Found moderator:');
    console.log('  ID:', moderator._id.toString());
    console.log('  User ID:', moderator.userId.toString());
    console.log('  Email:', moderator.email);
    console.log('  Has Location:', !!moderator.assignedLocation);
    console.log('  Location:', moderator.assignedLocation);
    
    // Step 4: Analysis - simulate what should have happened
    console.log('\n🔍 REGISTRATION PROCESS ANALYSIS:');
    console.log('=====================================');
    
    console.log('✅ Token had location:', !!tokenDoc.assignedLocation);
    console.log('✅ User was created:', !!user);
    console.log('✅ Moderator record exists:', !!moderator);
    console.log('❌ Location was transferred:', !!moderator.assignedLocation);
    
    if (tokenDoc.assignedLocation && !moderator.assignedLocation) {
      console.log('\n💡 ISSUE IDENTIFIED:');
      console.log('The token had a location but it was not transferred to the moderator record.');
      console.log('This indicates a bug in the registration endpoint logic.');
      
      console.log('\n🔧 SIMULATING FIX:');
      console.log('What the registration should have done:');
      
      const updateDoc = {
        userId: user._id,
        email: user.email,
        status: 'online',
        assignedLocation: tokenDoc.assignedLocation, // This should have been added
        updatedAt: new Date()
      };
      
      console.log('Expected updateDoc:', JSON.stringify(updateDoc, null, 2));
      
      // Let's manually fix this record to test
      console.log('\n🛠️  APPLYING MANUAL FIX:');
      const fixResult = await moderators.updateOne(
        { _id: moderator._id },
        { 
          $set: { 
            assignedLocation: tokenDoc.assignedLocation,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('Fix result:', fixResult);
      
      // Verify the fix
      const fixedModerator = await moderators.findOne({ _id: moderator._id });
      console.log('✅ After fix - Has Location:', !!fixedModerator.assignedLocation);
      console.log('✅ After fix - Location:', fixedModerator.assignedLocation);
      
      if (fixedModerator.assignedLocation) {
        console.log('\n🎉 MANUAL FIX SUCCESSFUL!');
        console.log('The moderator now has the location that should have been assigned during registration.');
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simulateRegistration();