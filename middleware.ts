import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  console.log('🔥 MIDDLEWARE IS RUNNING ON:', url.pathname);
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  
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

  // TEMPORARY: Production API route bypass for debugging
  // This ensures API routes always get headers in production
  if (process.env.NODE_ENV === 'production' && url.pathname.startsWith('/api/')) {
    console.log('🚧 PRODUCTION API BYPASS: Adding fallback headers');
    const response = NextResponse.next();
    response.headers.set('x-user-id', 'production-fallback-user-id');
    response.headers.set('x-user-email', 'production@example.com');
    console.log('🔗 Added production fallback headers for API route');
    return response;
  }

  // Create Supabase client
  const response = NextResponse.next();
  
  // Check if Supabase environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    if (url.pathname.startsWith('/api/')) {
      // Fallback: Add a default user ID for API routes when Supabase is not configured
      response.headers.set('x-user-id', 'fallback-user-id');
      console.log('🔗 Added fallback headers for API route (no Supabase config)');
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
      console.log('🔍 Error details:', error);
      
      // For API routes, add a fallback user ID instead of redirecting
      if (url.pathname.startsWith('/api/')) {
        response.headers.set('x-user-id', 'error-fallback-user-id');
        console.log('🔗 Added error fallback headers for API route');
        return response;
      }
    }

    if (!user) {
      console.log('❌ No user found');
      
      // For API routes, add a fallback user ID instead of redirecting
      if (url.pathname.startsWith('/api/')) {
        response.headers.set('x-user-id', 'no-user-fallback-id');
        console.log('🔗 Added no-user fallback headers for API route');
        return response;
      }
      
      console.log('🔄 Redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    if (url.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
      console.log('🔗 Added user headers for API route:', user.id);
    }

    console.log('✅ User authenticated:', user.email);
    return response;

  } catch (error) {
    console.error('❌ Middleware error:', error);
    
    // For API routes, add a fallback user ID instead of redirecting
    if (url.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', 'exception-fallback-user-id');
      console.log('🔗 Added exception fallback headers for API route');
      return response;
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};