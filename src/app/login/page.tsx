'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Check for configuration errors from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'database_not_configured') {
      console.error('Database not configured');
      return;
    }

    if (!supabase) {
      return;
    }
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router, supabase]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GlowAI</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        {supabase ? (
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#ec4899',
                  brandAccent: '#be185d',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`}
          showLinks={true}
          view="sign_in"
        />
        ) : (
          <div className="text-center text-red-600">
            Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </div>
        )}
      </div>
    </main>
  );
} 