'use client';

import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading?: boolean;
}

export default function SubscribeModal({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  upgrading = false 
}: SubscribeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upgrade to Premium
          </h2>
          <p className="text-gray-600">
            Get unlimited AI makeup generations and exclusive features
          </p>
        </div>

        {/* Plan Details */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {SUBSCRIPTION_PLANS.premium.name}
            </h3>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              ₹{SUBSCRIPTION_PLANS.premium.price}
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {SUBSCRIPTION_PLANS.premium.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUpgrade}
            disabled={upgrading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              upgrading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
            }`}
          >
            {upgrading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Upgrade Now'
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Cancel anytime. No commitment required.
          </p>
        </div>
      </div>
    </div>
  );
} 