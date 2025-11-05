const fetch = require('node-fetch');

async function checkDebugData() {
  try {
    console.log('🔍 Fetching debug data from registration endpoint...');
    
    const response = await fetch('http://localhost:3000/api/debug/registration');
    const data = await response.json();
    
    if (data.success) {
      console.log('\n📧 INVITE TOKENS:');
      console.log('================');
      data.tokens.forEach((token, i) => {
        console.log(`${i + 1}. Email: ${token.email}`);
        console.log(`   Type: ${token.type}`);
        console.log(`   Has Location: ${token.hasLocation}`);
        if (token.hasLocation) {
          console.log(`   Location: lat=${token.location.lat}, lng=${token.location.lng}`);
        }
        console.log(`   Used: ${token.used}`);
        console.log(`   Expired: ${token.expired}`);
        console.log('');
      });
      
      console.log('\n👨‍💼 MODERATORS:');
      console.log('================');
      data.moderators.forEach((mod, i) => {
        console.log(`${i + 1}. Email: ${mod.email}`);
        console.log(`   User ID: ${mod.userId}`);
        console.log(`   Has Location: ${mod.hasLocation}`);
        if (mod.hasLocation) {
          console.log(`   Location: lat=${mod.location.lat}, lng=${mod.location.lng}`);
        }
        console.log('');
      });
      
      console.log('\n👤 USERS (Moderator Role):');
      console.log('==========================');
      data.users.forEach((user, i) => {
        console.log(`${i + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
      
      console.log('\n📊 ANALYSIS:');
      console.log('============');
      console.log(`Total Tokens: ${data.analysis.tokens.total}`);
      console.log(`Tokens with Locations: ${data.analysis.tokens.withLocations}`);
      console.log(`Used Tokens: ${data.analysis.tokens.used}`);
      console.log(`Expired Tokens: ${data.analysis.tokens.expired}`);
      console.log(`Total Moderators: ${data.analysis.moderators.total}`);
      console.log(`Moderators with Locations: ${data.analysis.moderators.withLocations}`);
      console.log(`Total Moderator Users: ${data.analysis.users.totalModerators}`);
      
      if (data.analysis.issues.orphanModerators > 0) {
        console.log(`\n⚠️  ORPHAN MODERATORS (${data.analysis.issues.orphanModerators}):`);
        data.orphanModerators.forEach(m => {
          console.log(`   - ${m.email} (User ID: ${m.userId})`);
        });
      }
      
      if (data.analysis.issues.orphanUsers > 0) {
        console.log(`\n⚠️  ORPHAN USERS (${data.analysis.issues.orphanUsers}):`);
        data.orphanUsers.forEach(u => {
          console.log(`   - ${u.name} (${u.email}) [ID: ${u.id}]`);
        });
      }
      
    } else {
      console.error('❌ Debug request failed:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Error fetching debug data:', error.message);
  }
}

checkDebugData();