import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const allHeaders = Object.fromEntries(request.headers.entries());
  
  return NextResponse.json({
    message: 'Headers test',
    xUserId: request.headers.get('x-user-id'),
    xUserEmail: request.headers.get('x-user-email'),
    allHeaders,
    timestamp: new Date().toISOString()
  });
}