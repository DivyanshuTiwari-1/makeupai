  'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/ImageUpload';
import MakeupStyleSelector from '@/components/MakeupStyleSelector';
import { makeupStyles, MakeupStyle } from '@/lib/replicate';
import CreditStatus from '@/components/CreditStatus';
import SubscribeModal from '@/components/SubscribeModal';
import Image from 'next/image';

export default function GeneratePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<MakeupStyle | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [makeupBreakdown, setMakeupBreakdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [hasCredits, setHasCredits] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check user credits on component mount
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const response = await fetch('/api/user/credits');
        const data = await response.json();
        if (response.ok) {
          setHasCredits(data.hasCredits);
          setIsSubscribed(data.isSubscribed);
        }
      } catch (error) {
        console.error('Failed to check credits:', error);
      }
    };
    checkCredits();
  }, []);

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedImage(file);
    setPreviewUrl(previewUrl);
    setError(null);
  };

  const handleStyleSelect = (style: MakeupStyle) => {
    setSelectedStyle(style);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedStyle) {
      setError('Please select an image and makeup style');
      return;
    }

    // Check if user has credits before generating
    if (!hasCredits && !isSubscribed) {
      setError('You have no credits remaining. Please upgrade to premium for unlimited generations.');
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('styleId', selectedStyle.id);
      if (customPrompt) {
        formData.append('customPrompt', customPrompt);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 && data.needsUpgrade) {
          setError(data.error || 'You have no credits remaining. Please upgrade to premium for unlimited generations.');
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.generatedImageUrl);
      setMakeupBreakdown(data.makeupBreakdown);

      // Update credit status after successful generation
      if (!data.isSubscribed) {
        setHasCredits(data.creditsRemaining > 0);
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
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

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glowai-${selectedStyle?.name.toLowerCase()}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download image');
    }
  };

  const handleSave = async () => {
    // TODO: Implement save to user's history
    console.log('Save to history - to be implemented');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Makeup Generator</h1>
          <p className="text-gray-600">Upload your selfie and try different makeup styles</p>
          <div className="mt-4">
            <CreditStatus />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Style Selection */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Selfie</h2>
              <ImageUpload onImageSelect={handleImageSelect} />
            </div>

            {/* Style Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <MakeupStyleSelector
                styles={makeupStyles}
                selectedStyle={selectedStyle}
                onStyleSelect={handleStyleSelect}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
              />
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {!hasCredits && !isSubscribed && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    You have no credits remaining. Please upgrade to premium for unlimited generations.
                  </p>
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!selectedImage || !selectedStyle || isGenerating || (!hasCredits && !isSubscribed)}
                className={`
                  w-full py-3 px-6 rounded-lg font-medium text-white transition-colors
                  ${!selectedImage || !selectedStyle || isGenerating || (!hasCredits && !isSubscribed)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                  }
                `}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  'Generate Makeup Look'
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isSubscribed ? 'Unlimited generations with premium' : 'This will use 1 credit from your account'}
              </p>
            </div>
          </div>

          {/* Right Column - Preview and Results */}
          <div className="space-y-6">
            {/* Original Image Preview */}
            {previewUrl && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Image</h3>
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={previewUrl}
                    alt="Original selfie"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Generated Result */}
            {generatedImage && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Result</h3>
                
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={generatedImage}
                    alt="Generated makeup look"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Makeup Breakdown */}
                {makeupBreakdown && (
                  <div className="mb-4 p-4 bg-pink-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Makeup Breakdown</h4>
                    <p className="text-sm text-gray-700">{makeupBreakdown}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save to History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <SubscribeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        upgrading={upgrading}
      />
    </main>
  );
} 