import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('🔥 MIDDLEWARE IS RUNNING!');
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('❌ No user, redirecting...');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Attach user headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email ?? '');
 
  }

  console.log('✅ User authenticated:', user.email);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
