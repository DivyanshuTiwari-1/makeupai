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

  // Check if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseUrl === 'your_supabase_project_url' ||
      supabaseKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' ||
      supabaseKey === 'your_supabase_anon_key') {
    
    console.log('❌ Supabase not configured, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
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
    
    console.log(`[Middleware] Route: ${url.pathname}, User: ${user?.id || 'none'}, Error: ${error?.message || 'none'}`);
    
    if (error) {
      console.log('❌ Auth error:', error.message);
      // For API routes, return 401 instead of redirecting
      if (url.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication failed' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!user) {
      console.log('❌ No user found');
      // For API routes, return 401 instead of redirecting
      if (url.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    if (url.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
      console.log(`🔗 Added user headers for API route: ${user.id}`);
    }

    console.log('✅ User authenticated:', user.email);
    return response;

  } catch (error) {
    console.error('❌ Middleware error:', error);
    // For API routes, return 401 instead of redirecting
    if (url.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.|public/).*)',
  ],
};