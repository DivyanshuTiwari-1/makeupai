import { NextRequest, NextResponse } from 'next/server';
import { checkUserCredits } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    // Get user from middleware headers
    let userId = request.headers.get('x-user-id');
    
    console.log('[Credits API] Headers received:', {
      'x-user-id': userId,
      'x-user-email': request.headers.get('x-user-email'),
      'all-headers': Object.fromEntries(request.headers.entries())
    });

    // Fallback: Try to get user directly from Supabase if header is missing
    if (!userId) {
      console.log('[Credits API] No x-user-id header found, trying direct Supabase auth...');
      
      try {
        const { createServerClient } = require('@supabase/ssr');
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll() {
                // No-op for API routes
              },
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          userId = user.id;
          console.log('[Credits API] Got user from direct auth:', userId);
        } else {
          console.log('[Credits API] Direct auth also failed:', error?.message);
        }
      } catch (fallbackError) {
        console.log('[Credits API] Fallback auth error:', fallbackError);
      }
    }

    if (!userId) {
      console.log('[Credits API] No user ID available, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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