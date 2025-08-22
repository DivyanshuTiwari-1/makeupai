import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { updateSubscriptionStatus } from '@/lib/credits';
import { createSupabaseServerClientDirect } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user from middleware headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClientDirect();
    const stripe = getServerStripe();

    // Get user's Stripe customer ID
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_id')
      .eq('id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      return NextResponse.json({ 
        isSubscribed: false, 
        message: 'No Stripe customer found' 
      });
    }

    // Check subscription status in Stripe
    if (userProfile.subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(userProfile.subscription_id);
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        
        // Update local database if status has changed
        if (isActive !== userProfile.is_subscribed) {
          await updateSubscriptionStatus(
            userId,
            isActive,
            { getAll: () => [], setAll: () => {} },
            subscription.id
          );
        }

        return NextResponse.json({
          isSubscribed: isActive,
          subscriptionStatus: subscription.status,
          message: 'Subscription status synced from Stripe'
        });
      } catch (error) {
        console.error('Error retrieving subscription from Stripe:', error);
        return NextResponse.json({ 
          isSubscribed: false, 
          message: 'Error retrieving subscription from Stripe' 
        });
      }
    }

    // Check if user has any active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: userProfile.stripe_customer_id,
      status: 'active'
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      
      // Update local database
      await updateSubscriptionStatus(
        userId,
        isActive,
        { getAll: () => [], setAll: () => {} },
        subscription.id
      );

      return NextResponse.json({
        isSubscribed: isActive,
        subscriptionStatus: subscription.status,
        message: 'Found active subscription and updated local status'
      });
    }

    return NextResponse.json({ 
      isSubscribed: false, 
      message: 'No active subscriptions found' 
    });

  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription status' },
      { status: 500 }
    );
  }
}