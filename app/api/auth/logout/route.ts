import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic

export async function POST(req: NextRequest) {
  try {
    console.log('Logout API called');
    
    // In a real application with proper sessions:
    // 1. Clear session cookies
    // 2. Invalidate tokens or sessions in the database
    // 3. Perform any other cleanup tasks
    
    // For now we'll just return a success response
    // The actual logout happens on the client side by clearing the Zustand store
    
    return NextResponse.json({
      message: 'Logout successful',
      redirectTo: '/login'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in logout:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
