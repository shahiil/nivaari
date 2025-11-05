import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getInviteTokensCollection, getModeratorsCollection, getUsersCollection, type UserDocument, type UserRole } from '@/lib/mongodb';
import { createUser, findUserByEmail, mapUser } from '@/lib/auth-service';
import { setSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';

const registerSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server misconfigured: JWT_SECRET is not set' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const tokens = await getInviteTokensCollection();
    const tokenDoc = await tokens.findOne({ token: parsed.data.token, used: false });
    console.log('🎫 Found invite token:', {
      email: tokenDoc?.email,
      hasLocation: !!tokenDoc?.assignedLocation,
      location: tokenDoc?.assignedLocation,
      expired: tokenDoc ? tokenDoc.expiresAt < new Date() : 'no token'
    });
    
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // If user exists, upgrade to moderator; otherwise create as moderator
    let user = await findUserByEmail(parsed.data.email);
    if (!user) {
      const created = await createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: 'moderator',
        status: 'online',
      });
      user = await findUserByEmail(parsed.data.email);
      if (!user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    } else {
      // Update existing user to moderator role
      const users = await getUsersCollection();
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            role: 'moderator',
            name: parsed.data.name,
            status: 'online',
            updatedAt: new Date()
          } 
        }
      );
      // Refetch user with updated data
      user = await findUserByEmail(parsed.data.email);
      if (!user) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    }

    // Create moderator record
    const moderators = await getModeratorsCollection();
    const now = new Date();
    
    // Check if moderator already exists for this user
    const existingModerator = await moderators.findOne({ userId: user._id });
    console.log('Existing moderator check:', existingModerator);
    
    const updateDoc: any = {
      userId: user._id,
      email: user.email,
      mobile: parsed.data.mobile,
      status: 'online',
      updatedAt: now,
    };
    
    // Add assigned location if it exists in the token
    console.log('🎯 Location assignment check:');
    console.log('  Token has assignedLocation property:', 'assignedLocation' in tokenDoc);
    console.log('  assignedLocation value:', JSON.stringify(tokenDoc.assignedLocation));
    console.log('  assignedLocation type:', typeof tokenDoc.assignedLocation);
    console.log('  Location truthy check:', !!tokenDoc.assignedLocation);
    
    // More robust location check - ensure it has lat and lng properties
    const hasValidLocation = tokenDoc.assignedLocation && 
                            typeof tokenDoc.assignedLocation === 'object' &&
                            typeof tokenDoc.assignedLocation.lat === 'number' &&
                            typeof tokenDoc.assignedLocation.lng === 'number';
    
    console.log('  Has valid location (lat/lng):', hasValidLocation);
    
    if (hasValidLocation) {
      updateDoc.assignedLocation = tokenDoc.assignedLocation;
      console.log('✅ Adding assigned location from token:', JSON.stringify(tokenDoc.assignedLocation));
    } else {
      console.log('❌ No valid location found in token - not assigning location');
      if (tokenDoc.assignedLocation) {
        console.log('❌ Invalid location structure:', JSON.stringify(tokenDoc.assignedLocation));
      }
    }
    
    // If moderator exists and we're not updating location, preserve existing location
    if (existingModerator && existingModerator.assignedLocation && !tokenDoc.assignedLocation) {
      updateDoc.assignedLocation = existingModerator.assignedLocation;
      console.log('Preserving existing location:', existingModerator.assignedLocation);
    }
    
    console.log('🔨 Creating/updating moderator with data:', updateDoc);
    console.log('📍 Location in updateDoc:', updateDoc.assignedLocation);
    
    const result = await moderators.updateOne(
      { userId: user._id },
      {
        $set: updateDoc,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    
    console.log('✅ Moderator update result:', result);
    console.log('📝 Operation type:', result.upsertedId ? 'INSERT' : 'UPDATE');
    console.log('📊 Documents matched:', result.matchedCount);
    console.log('📊 Documents modified:', result.modifiedCount);
    console.log('User ID being used:', user._id.toString());
    console.log('Final user data:', { name: user.name, email: user.email, role: user.role });
    
    // Verify the moderator was actually created/updated
    const createdModerator = await moderators.findOne({ userId: user._id });
    console.log('Verification - Created moderator:', createdModerator);
    
    // Additional verification for location assignment
    if (hasValidLocation && !createdModerator?.assignedLocation) {
      console.log('🚨 CRITICAL: Location was supposed to be assigned but is missing!');
      console.log('🔧 Attempting to fix location assignment...');
      
      // Retry the location assignment
      const fixResult = await moderators.updateOne(
        { userId: user._id },
        { 
          $set: { 
            assignedLocation: tokenDoc.assignedLocation,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('🔧 Fix result:', fixResult);
      
      // Re-verify
      const fixedModerator = await moderators.findOne({ userId: user._id });
      console.log('🔧 After fix - has location:', !!fixedModerator?.assignedLocation);
    }
    
    // Log final state for debugging
    console.log('=== REGISTRATION COMPLETE ===');
    console.log('User ID:', user._id.toString());
    console.log('User Email:', user.email);
    console.log('User Role:', user.role);
    console.log('Moderator ID:', createdModerator?._id?.toString());
    console.log('Assigned Location:', createdModerator?.assignedLocation);
    console.log('============================');

    // Mark token used
    await tokens.updateOne({ _id: tokenDoc._id }, { $set: { used: true, usedAt: new Date() } });
    
    // Clean up any other unused tokens for this email to prevent confusion
    await tokens.updateMany(
      { 
        email: parsed.data.email, 
        used: false,
        _id: { $ne: tokenDoc._id }
      }, 
      { $set: { used: true, usedAt: new Date() } }
    );
    console.log('Cleaned up other unused tokens for email:', parsed.data.email);

    // Set session cookie
  await setSessionCookie({ sub: user._id.toString(), email: user.email, role: 'moderator', name: user.name });

    // Construct a minimal user doc compatible with mapUser
    const mapped = mapUser({
      _id: user._id,
      email: user.email,
      passwordHash: '',
  role: 'moderator' as UserRole,
      name: user.name,
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserDocument);

    return NextResponse.json({ user: mapped });
  } catch (e) {
    console.error('Moderator register error', e);
    return NextResponse.json({ error: 'Failed to register moderator' }, { status: 500 });
  }
}
