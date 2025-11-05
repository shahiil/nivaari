import { NextResponse } from 'next/server';
import { getInviteTokensCollection, getModeratorsCollection, getUsersCollection } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('🔍 Debug: Complete registration flow analysis');
    
    const [tokens, moderators, users] = await Promise.all([
      getInviteTokensCollection(),
      getModeratorsCollection(),
      getUsersCollection()
    ]);
    
    // Check invite tokens
    console.log('📧 Checking invite tokens...');
    const allTokens = await tokens.find({}).sort({ createdAt: -1 }).toArray();
    const tokensSummary = allTokens.map(t => ({
      email: t.email,
      type: t.type,
      hasLocation: !!t.assignedLocation,
      location: t.assignedLocation,
      used: t.used,
      expired: t.expiresAt < new Date()
    }));
    
    console.log('📧 Token summary:', tokensSummary);
    
    // Check moderators
    console.log('👨‍💼 Checking moderators...');
    const allModerators = await moderators.find({}).toArray();
    const moderatorsSummary = allModerators.map(m => ({
      email: m.email,
      userId: m.userId.toString(),
      hasLocation: !!m.assignedLocation,
      location: m.assignedLocation
    }));
    
    console.log('👨‍💼 Moderator summary:', moderatorsSummary);
    
    // Check users with moderator role  
    console.log('👤 Checking users...');
    const moderatorUsers = await users.find({ role: 'moderator' }).toArray();
    const usersSummary = moderatorUsers.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role
    }));
    
    console.log('👤 User summary:', usersSummary);
    
    // Cross-reference: find moderators without matching users
    const orphanModerators = allModerators.filter(m => 
      !moderatorUsers.some(u => u._id.toString() === m.userId.toString())
    );
    
    // Cross-reference: find users without matching moderators
    const orphanUsers = moderatorUsers.filter(u => 
      !allModerators.some(m => m.userId.toString() === u._id.toString())
    );
    
    const analysis = {
      tokens: {
        total: allTokens.length,
        withLocations: allTokens.filter(t => t.assignedLocation).length,
        used: allTokens.filter(t => t.used).length,
        expired: allTokens.filter(t => t.expiresAt < new Date()).length
      },
      moderators: {
        total: allModerators.length,
        withLocations: allModerators.filter(m => m.assignedLocation).length
      },
      users: {
        totalModerators: moderatorUsers.length
      },
      issues: {
        orphanModerators: orphanModerators.length,
        orphanUsers: orphanUsers.length
      }
    };
    
    console.log('📊 Analysis:', analysis);
    
    return NextResponse.json({
      success: true,
      tokens: tokensSummary,
      moderators: moderatorsSummary,
      users: usersSummary,
      analysis,
      orphanModerators: orphanModerators.map(m => ({ email: m.email, userId: m.userId.toString() })),
      orphanUsers: orphanUsers.map(u => ({ name: u.name, email: u.email, id: u._id.toString() }))
    });
    
  } catch (error) {
    console.error('❌ Registration debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}