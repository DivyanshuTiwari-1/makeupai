import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { createSupabaseServerClientDirect } from '@/lib/supabase';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const userId = user.id;
    const userEmail = user.email;
    
    // Initialize Stripe and Supabase
    let stripe;
    try {
      stripe = getServerStripe();
    } catch (stripeError) {
      console.error('Stripe configuration error:', stripeError);
      return NextResponse.json({ 
        error: 'Payment system not configured. Please set up Stripe credentials.' 
      }, { status: 503 });
    }
    
    let supabase;
    try {
      supabase = createSupabaseServerClientDirect();
    } catch (supabaseError) {
      console.error('Supabase configuration error:', supabaseError);
      return NextResponse.json({ 
        error: 'Database not configured. Please set up Supabase credentials.' 
      }, { status: 503 });
    }
    
    // Check if user already has a Stripe customer ID
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = userProfile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId
        }
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          stripe_customer_id: customerId
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: SUBSCRIPTION_PLANS.premium.currency,
            product_data: {
              name: SUBSCRIPTION_PLANS.premium.name,
              description: 'Unlimited AI makeup generations',
            },
            unit_amount: SUBSCRIPTION_PLANS.premium.price * 100, // Convert to cents
            recurring: {
              interval: 'month' as const,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        user_id: userId
      }
    });

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
});