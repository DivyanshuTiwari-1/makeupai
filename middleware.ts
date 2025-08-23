import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  console.log('🔥 SIMPLE MIDDLEWARE RUNNING ON:', url.pathname);
  
  // Skip middleware for static files
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For API routes, always add x-user-id header
  if (url.pathname.startsWith('/api/')) {
    console.log('🔗 Adding x-user-id header for API route:', url.pathname);
    const response = NextResponse.next();
    response.headers.set('x-user-id', 'simple-user-id-123');
    response.headers.set('x-user-email', 'user@example.com');
    return response;
  }

  // For all other routes, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};