'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import CreditStatus from '@/components/CreditStatus';
import SubscribeModal from '@/components/SubscribeModal';

interface User {
  id: string;
  email: string;
}

function SearchParamsNotification() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show success message if redirected from Stripe
    if (searchParams?.get('success') === 'true') {
      // You can add a toast notification here
      console.log('Payment successful!');
    }
    if (searchParams?.get('canceled') === 'true') {
      console.log('Payment canceled');
    }
  }, [searchParams]);

  return null;
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user as User);
      setLoading(false);
    };
    checkUser();
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <SearchParamsNotification />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GlowAI Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-gray-600 mb-2">Email: {user?.email}</p>
          <CreditStatus />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/generate"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💄</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Generate Makeup Look</h3>
              <p className="text-gray-600">Upload a selfie and try different makeup styles</p>
            </div>
          </Link>

          <Link
            href="/history"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">View History</h3>
              <p className="text-gray-600">See your previously generated looks</p>
            </div>
          </Link>
        </div>

        {/* Upgrade Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
          <p className="mb-4">Get unlimited makeup generations and access to all features!</p>
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-white text-pink-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Upgrade Now - 20$ per month
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <SubscribeModal isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)} 
          onUpgrade={handleUpgrade}
          upgrading={upgrading}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}