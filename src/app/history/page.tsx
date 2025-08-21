'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

interface GeneratedLook {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string;
  style_name: string;
  makeup_breakdown: string;
  created_at: string;
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [looks, setLooks] = useState<GeneratedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkUserAndLoadHistory = async () => {
      try {
        // Check if Supabase is properly configured
        if (!supabase) {
          setError('Database configuration missing. Please check your environment variables.');
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch user's generated looks
          const { data, error } = await supabase
            .from('generated_looks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching history:', error);
            setError('Failed to load your history. Please check your database configuration.');
          } else {
            setLooks(data || []);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        if (err instanceof Error && err.message.includes('SUPABASE')) {
          setError('Database configuration error. Please set up your Supabase credentials.');
        } else {
          setError('Something went wrong');
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadHistory();
  }, [supabase]);

  const deleteLook = async (lookId: string) => {
    try {
      const { error } = await supabase
        .from('generated_looks')
        .delete()
        .eq('id', lookId);

      if (error) {
        console.error('Error deleting look:', error);
        setError('Failed to delete look');
      } else {
        setLooks(looks.filter(look => look.id !== lookId));
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to delete look');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your history...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your history.</p>
          <Link 
            href="/login"
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Makeup History</h1>
          <Link 
            href="/generate"
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Create New Look
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {looks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No looks yet</h2>
            <p className="text-gray-600 mb-6">Start creating your first AI makeup look!</p>
            <Link 
              href="/generate"
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Create Your First Look
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {looks.map((look) => (
              <div key={look.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <div className="grid grid-cols-2">
                    <div className="relative h-48">
                      <Image
                        src={look.original_image_url}
                        alt="Original"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative h-48">
                      <Image
                        src={look.generated_image_url}
                        alt="Generated"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteLook(look.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Delete look"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{look.style_name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {look.makeup_breakdown}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(look.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 