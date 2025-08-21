'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function DebugAuth() {
  const [authState, setAuthState] = useState<any>(null);
  const [creditsTest, setCreditsTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Create Supabase client
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Check current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        setAuthState({
          user: user ? { id: user.id, email: user.email } : null,
          error: error?.message || null,
          hasSession: !!user,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });

        // Test credits endpoint
        console.log('Testing credits endpoint...');
        const response = await fetch('/api/user/credits');
        const creditsData = await response.text();
        
        setCreditsTest({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: creditsData
        });

      } catch (err) {
        console.error('Debug error:', err);
        setAuthState({ error: err.message });
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-4">Loading debug info...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Authentication State</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Credits API Test</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(creditsTest, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check the browser console for middleware logs</li>
            <li>Check the server console (terminal) for server-side logs</li>
            <li>If user is null, go to /login first</li>
            <li>If user exists but credits API fails, check middleware logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}