'use client';

import { useState } from 'react';
import { MakeupStyle } from '@/lib/replicate';

interface MakeupStyleSelectorProps {
  styles: MakeupStyle[];
  selectedStyle: MakeupStyle | null;
  onStyleSelect: (style: MakeupStyle) => void;
  customPrompt?: string;
  onCustomPromptChange?: (prompt: string) => void;
}

export default function MakeupStyleSelector({
  styles,
  selectedStyle,
  onStyleSelect,
  customPrompt = '',
  onCustomPromptChange
}: MakeupStyleSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);

  const getStyleIcon = (category: string) => {
    switch (category) {
      case 'natural':
        return '🌸';
      case 'glam':
        return '💄';
      case 'bridal':
        return '👰';
      case 'party':
        return '🎉';
      case 'custom':
        return '✨';
      default:
        return '💋';
    }
  };

  const getStyleColor = (category: string) => {
    switch (category) {
      case 'natural':
        return 'bg-green-50 border-green-200 hover:border-green-300';
      case 'glam':
        return 'bg-pink-50 border-pink-200 hover:border-pink-300';
      case 'bridal':
        return 'bg-purple-50 border-purple-200 hover:border-purple-300';
      case 'party':
        return 'bg-orange-50 border-orange-200 hover:border-orange-300';
      case 'custom':
        return 'bg-blue-50 border-blue-200 hover:border-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 hover:border-gray-300';
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Makeup Style</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => {
              onStyleSelect(style);
              if (style.id === 'custom') {
                setShowCustom(true);
              } else {
                setShowCustom(false);
              }
            }}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${getStyleColor(style.category)}
              ${selectedStyle?.id === style.id 
                ? 'ring-2 ring-pink-500 ring-offset-2' 
                : 'hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">{getStyleIcon(style.category)}</span>
              <h4 className="font-medium text-gray-900">{style.name}</h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {style.description}
            </p>
            
            {selectedStyle?.id === style.id && (
              <div className="flex items-center text-pink-600 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Prompt Input */}
      {showCustom && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your custom makeup look
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange?.(e.target.value)}
            placeholder="e.g., Apply a smoky eye with gold shimmer, coral blush, and a bold red lipstick..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific about colors, techniques, and the overall look you want to achieve.
          </p>
        </div>
      )}

      {/* Selected Style Preview */}
      {selectedStyle && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Style: {selectedStyle.name}</h4>
          <p className="text-sm text-gray-600">
            {showCustom && customPrompt ? customPrompt : selectedStyle.prompt}
          </p>
        </div>
      )}
    </div>
  );
} 