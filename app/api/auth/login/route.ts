import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic

export async function POST(req: NextRequest) {
  try {
    console.log('Login API called');
    const { email, password } = await req.json();
    console.log(`Login attempt for email: ${email}`);
    
    // Validate inputs
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }    // Verify password (direct comparison, no hashing)
    const passwordMatch = password === user.password;
    
    if (!passwordMatch) {
      console.log(`Password verification failed for ${email}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
      console.log(`Login successful for ${email}`);
    
    try {
      // Get user profile and permissions
      const userProfile = await db.userProfile.findUnique({
        where: { userId: user.id }
      });
      
      const userPermissions = await db.userPermission.findMany({
        where: { userId: user.id },
        include: { permission: true }
      });
      
      // Create session token (in a real app, you'd set cookies/JWT)
      // For this example, we'll just return user info (excluding password)
      const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({
        message: 'Login successful',
        user: {
          ...userWithoutPassword,
          profile: userProfile,
          permissions: userPermissions.map(up => up.permission.code),
          redirectTo: '/dashboard'
        },
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      
      // Even if there's an error getting profile/permissions, still log the user in
      // with basic information
      const { password: _, ...userWithoutPassword } = user;
      
      return NextResponse.json({
        message: 'Login successful with limited information',
        user: userWithoutPassword,
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in login:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
