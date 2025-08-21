import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';

// Validate Supabase configuration
function validateSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || url === 'https://placeholder.supabase.co' || url === 'your_supabase_project_url') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured. Please add your Supabase project URL to environment variables.');
  }
  
  if (!key || key === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' || key === 'your_supabase_anon_key') {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Please add your Supabase anon key to environment variables.');
  }
  
  return { url, key };
}

export function createSupabaseBrowserClient() {
  // Avoid creating client during SSR/prerender
  if (typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(url, key);
}

export function createSupabaseServerClient(cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
}) {
  const { url, key } = validateSupabaseConfig();
  return createServerClient(url, key, { cookies });
}

// For API routes without cookies
export function createSupabaseServerClientDirect() {
  const { url, key } = validateSupabaseConfig();
  return createServerClient(url, key, { 
    cookies: { getAll: () => [], setAll: () => {} } 
  });
} 