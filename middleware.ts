import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  console.log('🔥 MIDDLEWARE IS RUNNING ON:', url.pathname);
  
  // Skip middleware for static files
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Define public routes
  const publicPaths = ['/login', '/signup', '/auth/callback'];
  const isPublicPath = publicPaths.includes(url.pathname);

  if (isPublicPath) {
    console.log('📖 Public route, skipping auth');
    return NextResponse.next();
  }

  // TEMPORARY: Allow all routes for debugging
  // Remove this section once authentication is working
  if (process.env.NODE_ENV === 'development') {
    console.log('🚧 DEBUG MODE: Allowing all routes');
    const response = NextResponse.next();
    // Add mock headers for testing API routes
    if (url.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', 'debug-user-id');
      response.headers.set('x-user-email', 'debug@example.com');
      console.log('🔗 Added debug headers for API route');
    }
    return response;
  }

  // Create Supabase client
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
          cookies.forEach(({ name, value }) => {
            response.cookies.set(name, value);
          });
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Auth error:', error.message);
    }

    if (!user) {
      console.log('❌ No user found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    if (url.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
      console.log('🔗 Added user headers for API route');
    }

    console.log('✅ User authenticated:', user.email);
    return response;

  } catch (error) {
    console.error('❌ Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.|public/).*)',
  ],
};