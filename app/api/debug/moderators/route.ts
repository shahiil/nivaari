import { NextResponse } from 'next/server';
import { getModeratorsCollection, getUsersCollection } from '@/lib/mongodb';

export async function GET() {
  try {
    const moderators = await getModeratorsCollection();
    const users = await getUsersCollection();
    
    const allModerators = await moderators.find({}).toArray();
    const allUsers = await users.find({ role: 'moderator' }).toArray();
    
    console.log('🔍 DEBUG: All moderators in database:', allModerators.length);
    allModerators.forEach((mod, index) => {
      console.log(`📋 Moderator ${index + 1}:`, {
        email: mod.email,
        userId: mod.userId.toString(),
        hasLocation: !!mod.assignedLocation,
        location: mod.assignedLocation
      });
    });
    
    console.log('👥 DEBUG: All users with moderator role:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`, {
        name: user.name,
        email: user.email,
        role: user.role
      });
    });
    
    return NextResponse.json({
      moderators: allModerators.map(m => ({
        email: m.email,
        userId: m.userId.toString(),
        assignedLocation: m.assignedLocation
      })),
      users: allUsers.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
}