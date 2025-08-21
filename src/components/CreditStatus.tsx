'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';

interface CreditStatusProps {
  className?: string;
  showUpgradeButton?: boolean;
}

interface CreditData {
  credits: number;
  hasCredits: boolean;
  isSubscribed: boolean;
}

export default function CreditStatus({ className = '', showUpgradeButton = true }: CreditStatusProps) {
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/credits');
      const data = await response.json();

      if (response.ok) {
        setCreditData(data);
      } else {
        setError(data.error || 'Failed to fetch credits');
      }
    } catch (err) {
      setError( `Failed to fetch credit information ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      setError(null);

      const response = await axios.get('/api/user/credits');
      const {data} = await response.data;
        setCreditData(data);

      if (response.status && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data);
        if (response.status === 401) {
          setError('Authentication failed. Please refresh the page and try again.');
        } else if (response.status === 503) {
          setError(data.error || 'Service temporarily unavailable. Please check configuration.');
        } else {
          setError(data.error || 'Failed to create checkout session');
        }
      }
    } catch (err) {
      setError(`Failed to initiate upgrade process ${err}`);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
        <span className="text-sm text-gray-500">Loading credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        {error}
      </div>
    );
  }

  if (!creditData) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Credits:</span>
          {creditData.isSubscribed ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Unlimited
            </span>
          ) : (
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
              creditData.credits > 0 
                ? 'bg-pink-100 text-pink-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {creditData.credits} remaining
            </span>
          )}
        </div>

        {creditData.isSubscribed && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            Premium
          </span>
        )}
      </div>

      {showUpgradeButton && !creditData.isSubscribed && (
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            upgrading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
          }`}
        >
          {upgrading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Upgrading...</span>
            </div>
          ) : (
            'Upgrade to Premium'
          )}
        </button>
      )}
    </div>
  );
} 