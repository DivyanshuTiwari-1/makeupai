import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const debugInfo = {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(debugInfo);
}