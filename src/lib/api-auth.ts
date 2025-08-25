// lib/api-auth.ts
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Get authenticated user ID for API routes
 * Returns user object or throws error response
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<AuthenticatedUser> {
  try {
    // Create a response to attach new cookies if Supabase refreshes them
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // ✅ Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('No valid session:', sessionError?.message || 'No session found');
      throw NextResponse.json(
        { error: 'Authentication required', message: 'No valid session found' },
        { status: 401 }
      );
    }

    // ✅ Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError?.message || 'No user found');
      throw NextResponse.json(
        { error: 'Authentication failed', message: userError?.message || 'No user found' },
        { status: 401 }
      );
    }

    return {
      id: user.id,
      email: user.email || ''
    };

  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof NextResponse) {
      throw error;
    }
    throw NextResponse.json(
      { error: 'Authentication error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Wrapper function to handle authenticated API routes
 * Usage: export const GET = withAuth(async (request, user) => { ... })
 */
export function withAuth<T extends unknown[] = unknown[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUserId(request);
      return handler(request, user, ...args);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error in withAuth wrapper:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}
