import { NextResponse } from 'next/server';
import { getInviteTokensCollection } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking invite tokens in database');
    
    const coll = await getInviteTokensCollection();
    const tokens = await coll.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`📋 Found ${tokens.length} invite tokens`);
    
    const results = tokens.map(token => ({
      token: token.token?.substring(0, 8) + '...',
      email: token.email,
      type: token.type,
      hasLocation: !!token.assignedLocation,
      location: token.assignedLocation,
      created: token.createdAt,
      expires: token.expiresAt,
      used: token.used
    }));
    
    const summary = {
      total: tokens.length,
      withLocations: tokens.filter(t => t.assignedLocation).length,
      used: tokens.filter(t => t.used).length,
      unused: tokens.filter(t => !t.used).length
    };
    
    console.log('📊 Summary:', summary);
    
    return NextResponse.json({
      success: true,
      tokens: results,
      summary
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}