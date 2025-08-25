// app/api/user/credits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { checkUserCredits } from '@/lib/credits';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Check user credits using the authenticated user ID
    const creditStatus = await checkUserCredits(user.id, {
      getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
      setAll: () => {},
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      credits: creditStatus.credits,
      hasCredits: creditStatus.hasCredits,
      isSubscribed: creditStatus.isSubscribed
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit information' },
      { status: 500 }
    );
  }
});

// Remove the manual POST handler if not needed
// If you need a POST handler, you can add it like this:
/*
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    // Your POST logic here using user.id
    
    return NextResponse.json({
      success: true,
      message: 'Operation completed',
      userId: user.id
    });
  } catch (error) {
    console.error('Credits POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
});
*/