import { NextRequest, NextResponse } from 'next/server';
import { generateMakeupImage, makeupStyles } from '@/lib/replicate';
import { checkUserCredits, deductCredit } from '@/lib/credits';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const userId = user.id;

    // Parse request body
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const styleId = formData.get('styleId') as string;
    const customPrompt = formData.get('customPrompt') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!styleId) {
      return NextResponse.json({ error: 'No style selected' }, { status: 400 });
    }

    // Find the selected style
    const selectedStyle = makeupStyles.find(style => style.id === styleId);
    if (!selectedStyle) {
      return NextResponse.json({ error: 'Invalid style selected' }, { status: 400 });
    }

    // Check user credits
    const creditStatus = await checkUserCredits(userId, {
      getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
      setAll: () => {},
    });

    if (!creditStatus.hasCredits) {
      return NextResponse.json({ 
        error: 'No credits remaining. Please upgrade to premium for unlimited generations.',
        needsUpgrade: true
      }, { status: 402 });
    }

    // Deduct credit (for non-subscribed users)
    if (!creditStatus.isSubscribed) {
      const creditDeducted = await deductCredit(userId, {
        getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: () => {},
      });
      if (!creditDeducted) {
        return NextResponse.json({ 
          error: 'Failed to deduct credit. Please try again.',
          needsUpgrade: true
        }, { status: 500 });
      }
    }

    // Convert image to base64 for Replicate
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // Generate makeup image
    const result = await generateMakeupImage(
      dataUrl,
      selectedStyle,
      customPrompt || undefined
    );

    // Save to Supabase Storage (you'll implement this later)
    // For now, return the result directly

    return NextResponse.json({
      success: true,
      generatedImageUrl: result.imageUrl,
      makeupBreakdown: result.breakdown,
      style: selectedStyle.name,
      creditsRemaining: creditStatus.isSubscribed ? -1 : creditStatus.credits - 1,
      isSubscribed: creditStatus.isSubscribed
    });

  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate makeup image' },
      { status: 500 }
    );
  }
});