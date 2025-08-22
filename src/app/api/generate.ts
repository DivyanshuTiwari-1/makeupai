import { NextRequest, NextResponse } from 'next/server';
import { generateMakeupImage, makeupStyles } from '@/lib/replicate';
import { checkUserCredits, deductCredit } from '@/lib/credits';
export async function POST(request: NextRequest) {
  try {
    // Get user from middleware headers
    let userId = request.headers.get('x-user-id');
    
    // Fallback: If middleware didn't set headers, try to get user from cookies directly
    if (!userId) {
      console.log('[Generate API] No x-user-id header found, trying fallback authentication');
      
      try {
        const { createSupabaseServerClientDirect } = await import('@/lib/supabase');
        const supabase = createSupabaseServerClientDirect();
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('[Generate API] Fallback auth failed:', error?.message || 'No user found');
          return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 });
        }
        
        userId = user.id;
        console.log('[Generate API] Fallback auth successful for user:', userId);
      } catch (fallbackError) {
        console.error('[Generate API] Fallback auth error:', fallbackError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    }

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
    const reqCookies = request.cookies;
    // Adapter to match expected interface
       const cookies = {
         getAll: () => Array.from(reqCookies.getAll()).map(({ name, value }) => ({ name, value })),
         setAll: () => {
           // Next.js RequestCookies is read-only in API routes, so set is a no-op here
           // If you need to set cookies in response, do it on the response object
         },
       };
    const creditStatus = await checkUserCredits(userId, cookies);

    if (!creditStatus.hasCredits) {
      return NextResponse.json({ 
        error: 'You have no credits remaining. Please upgrade to premium for unlimited generations or wait for your credits to refresh.',
        needsUpgrade: true
      }, { status: 402 });
    }

    // Deduct credit (for non-subscribed users)
    if (!creditStatus.isSubscribed) {
      const creditDeducted = await deductCredit(userId, cookies);
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
} 