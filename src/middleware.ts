import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/generate', 
  '/history',
  '/api/generate',
  '/api/save',
  '/api/user/credits',
  '/api/stripe/checkout'
];

// Public routes that don't need authentication
const publicRoutes = [
  '/',
  '/login',
  '/api/stripe/webhook' // Stripe webhooks should be public
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute for general routes
const API_RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute for API routes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is protected or public first
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Skip auth check for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Create Supabase client for server-side auth
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseUrl === 'your_supabase_project_url' ||
      supabaseKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' ||
      supabaseKey === 'your_supabase_anon_key') {
    
    // For protected routes, return proper error
    if (isProtectedRoute) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Database not configured. Please set up your Supabase credentials in environment variables.' 
          }),
          { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      } else {
        // For page routes, redirect to login with error
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'database_not_configured');
        return NextResponse.redirect(loginUrl);
      }
    }
    
    // For other routes, continue without Supabase
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const isApiRoute = pathname.startsWith('/api/');
  const maxRequests = isApiRoute ? API_RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS;
  
  if (!checkRateLimit(clientIP, maxRequests)) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }



  // For protected routes, check authentication
  if (isProtectedRoute) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Add user info to headers for API routes
      if (pathname.startsWith('/api/')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', user.id);
        requestHeaders.set('x-user-email', user.email || '');
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

    } catch (error) {
      console.error('Auth middleware error:', error);
      // Redirect to login on auth error
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

// Rate limiting helper function
function checkRateLimit(clientIP: string, maxRequests: number): boolean {
  const now = Date.now();
  
  
  const clientData = rateLimitStore.get(clientIP);
  
  if (!clientData || clientData.resetTime < now) {
    // First request or window expired
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Increment count
  clientData.count++;
  rateLimitStore.set(clientIP, clientData);
  return true;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 