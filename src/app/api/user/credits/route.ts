import { NextRequest, NextResponse } from 'next/server';
import { checkUserCredits } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    // Get user from middleware headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized user is found' }, { status: 401 });
    }

    // Get cookies for Supabase client
    const reqCookies = request.cookies;
    // Adapter to match expected interface
    const cookies = {
      getAll: () => Array.from(reqCookies.getAll()).map(({ name, value }) => ({ name, value })),
      setAll: () => {
        // Next.js RequestCookies is read-only in API routes, so set is a no-op here
        // If you need to set cookies in response, do it on the response object
      },
    };

    // Check user credits
    const creditStatus = await checkUserCredits(userId, cookies);

    return NextResponse.json({
      success: true,
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
}