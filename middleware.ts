import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Always add a debug header so you can check in response headers
  const response = NextResponse.next();
  response.headers.set('x-middleware-check', 'true');
  response.headers.set('x-middleware-path', url.pathname);

  // Skip middleware for static files
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.includes('.')
  ) {
    response.headers.set('x-middleware-skip', 'static-or-auth');
    return response;
  }

  // Define public routes
  const publicPaths = ['/login', '/signup', '/auth/callback'];
  const isPublicPath = publicPaths.includes(url.pathname);

  if (isPublicPath) {
    response.headers.set('x-middleware-skip', 'public');
    return response;
  }

  // Create Supabase client
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
      response.headers.set('x-middleware-auth-error', error.message);
    }

    if (!user) {
      response.headers.set('x-middleware-auth', 'no-user');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    if (url.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
    }

    response.headers.set('x-middleware-auth', 'ok');
    return response;

  } catch (error) {
    response.headers.set('x-middleware-exception', 'true');
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.|public/).*)',
  ],
};
