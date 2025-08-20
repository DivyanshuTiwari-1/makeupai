import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export interface MakeupStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'natural' | 'glam' | 'bridal' | 'party' | 'custom';
}

export const makeupStyles: MakeupStyle[] = [
  {
    id: 'natural',
    name: 'Natural Glow',
    description: 'Subtle, everyday makeup with a fresh, natural look',
    prompt: 'Apply natural makeup with light foundation, subtle blush, neutral eyeshadow, and nude lipstick. Keep it minimal and fresh.',
    category: 'natural'
  },
  {
    id: 'glam',
    name: 'Glamorous',
    description: 'Bold, dramatic makeup perfect for special occasions',
    prompt: 'Apply glamorous makeup with full coverage foundation, dramatic winged eyeliner, bold eyeshadow, false lashes, contouring, and bold lipstick.',
    category: 'glam'
  },
  {
    id: 'bridal',
    name: 'Bridal Beauty',
    description: 'Elegant, timeless makeup for wedding day',
    prompt: 'Apply elegant bridal makeup with flawless foundation, soft pink blush, shimmery eyeshadow, natural lashes, and soft pink lipstick. Keep it romantic and timeless.',
    category: 'bridal'
  },
  {
    id: 'party',
    name: 'Party Ready',
    description: 'Fun, vibrant makeup for night out',
    prompt: 'Apply party makeup with medium coverage foundation, bright blush, colorful eyeshadow, bold eyeliner, and vibrant lipstick. Make it fun and energetic.',
    category: 'party'
  },
  {
    id: 'custom',
    name: 'Custom Style',
    description: 'Create your own unique makeup look',
    prompt: 'Apply custom makeup based on user preferences. Focus on enhancing natural features while maintaining a cohesive look.',
    category: 'custom'
  }
];

export async function generateMakeupImage(
  imageUrl: string,
  style: MakeupStyle,
  customPrompt?: string
): Promise<{ imageUrl: string; breakdown: string }> {
  try {
    // Use SDXL with IP-Adapter for makeup application
    // This is a placeholder - you'll need to adjust based on your specific Replicate model
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: customPrompt || style.prompt,
          image: imageUrl,
          strength: 0.8, // Adjust based on how much makeup to apply
          guidance_scale: 7.5,
          num_inference_steps: 20,
          negative_prompt: "blurry, low quality, distorted, unrealistic, overdone makeup, heavy foundation"
        }
      }
    );

    // Generate makeup breakdown based on the style
    const breakdown = generateMakeupBreakdown(style);

    return {
      imageUrl: output as unknown as string,
      breakdown
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate makeup image');
  }
}

function generateMakeupBreakdown(style: MakeupStyle): string {
  const breakdowns = {
    natural: {
      foundation: 'Light coverage foundation or BB cream',
      concealer: 'Under-eye concealer for brightening',
      blush: 'Soft pink or peach blush',
      eyeshadow: 'Neutral brown or beige eyeshadow',
      eyeliner: 'Brown eyeliner (optional)',
      mascara: 'Natural black mascara',
      lipstick: 'Nude or soft pink lipstick',
      highlighter: 'Subtle champagne highlighter'
    },
    glam: {
      foundation: 'Full coverage foundation',
      concealer: 'Full coverage concealer',
      blush: 'Bold pink or coral blush',
      eyeshadow: 'Dramatic eyeshadow palette',
      eyeliner: 'Bold black winged eyeliner',
      mascara: 'Volumizing black mascara',
      lipstick: 'Bold red or dark lipstick',
      highlighter: 'Intense champagne highlighter',
      contour: 'Bronzer for contouring'
    },
    bridal: {
      foundation: 'Medium coverage foundation',
      concealer: 'Under-eye and spot concealer',
      blush: 'Soft pink blush',
      eyeshadow: 'Shimmery champagne and brown eyeshadow',
      eyeliner: 'Soft brown eyeliner',
      mascara: 'Natural black mascara',
      lipstick: 'Soft pink or nude lipstick',
      highlighter: 'Soft champagne highlighter'
    },
    party: {
      foundation: 'Medium coverage foundation',
      concealer: 'Full coverage concealer',
      blush: 'Bright pink or coral blush',
      eyeshadow: 'Colorful eyeshadow palette',
      eyeliner: 'Bold colored eyeliner',
      mascara: 'Volumizing black mascara',
      lipstick: 'Bright or bold lipstick',
      highlighter: 'Intense highlighter'
    },
    custom: {
      foundation: 'Custom foundation based on preference',
      concealer: 'Custom concealer application',
      blush: 'Custom blush color and placement',
      eyeshadow: 'Custom eyeshadow colors',
      eyeliner: 'Custom eyeliner style',
      mascara: 'Custom mascara application',
      lipstick: 'Custom lipstick color',
      highlighter: 'Custom highlighter placement'
    }
  };

  const breakdown = breakdowns[style.category];
  return Object.entries(breakdown)
    .map(([product, description]) => `${product.charAt(0).toUpperCase() + product.slice(1)}: ${description}`)
    .join(', ');
} 