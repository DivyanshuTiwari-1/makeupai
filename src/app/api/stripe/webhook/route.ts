import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe';
import { updateSubscriptionStatus } from '@/lib/credits';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'whsec_your_stripe_webhook_secret') {
    console.error('STRIPE_WEBHOOK_SECRET is not configured. Please add your Stripe webhook secret to .env.local');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getServerStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        console.log('Subscription created event received');
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        console.log('Subscription updated event received');
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        console.log('Subscription deleted event received');
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        console.log('Payment succeeded event received');
        await handlePaymentSuccess(event.data.object as Stripe.Invoice);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        console.log('Payment failed event received');
        await handlePaymentFailure(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    console.log(`Processing subscription update for subscription ${subscription.id}, status: ${subscription.status}`);
    
    const stripe = getServerStripe();
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    const userId = (customer?.metadata?.user_id) ?? null;

    if (!userId) {
      console.error('No user_id found in customer metadata for subscription', subscription.id);
      return;
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    console.log(`Setting subscription status to ${isActive} for user ${userId}`);

    const success = await updateSubscriptionStatus(
      userId,
      isActive,
      { getAll: () => [], setAll: () => {} },
      subscription.id
    );

    if (success) {
      console.log(`Successfully updated subscription status to ${isActive} for user ${userId}, subscription ${subscription.id}`);
    } else {
      console.error(`Failed to update subscription status for user ${userId}, subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdate:', error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    const stripe = getServerStripe();
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    const userId = (customer?.metadata?.user_id) ?? null;

    if (!userId) {
      console.error('No user_id found in customer metadata');
      return;
    }

    await updateSubscriptionStatus(userId, false, { getAll: () => [], setAll: () => {} }, subscription.id);
    console.log(`Subscription cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error in handleSubscriptionCancellation:', error);
  }
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  const customerId = invoice.customer;
  try {
    const stripe = getServerStripe();
    const customer = await stripe.customers.retrieve(customerId as string) as Stripe.Customer;
    const userId = (customer?.metadata?.user_id) ?? null;
    
    if (userId) {
      // Check if this is a subscription payment by looking at the subscription property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionId = 'subscription' in invoice ? (invoice as any).subscription : null;
      if (subscriptionId && typeof subscriptionId === 'string') {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        
        // Update subscription status in database
        await updateSubscriptionStatus(
          userId,
          isActive,
          { getAll: () => [], setAll: () => {} },
          subscription.id
        );
        
        console.log(`Payment succeeded for user ${userId}, subscription ${subscription.id} is ${subscription.status}`);
      } else {
        // One-time payment - log for analytics
        console.log(`One-time payment succeeded for user ${userId}, invoice ${invoice.id}`);
      }
    } else {
      console.log(`Payment succeeded for unknown user, invoice ${invoice.id}`);
    }
  } catch (err) {
    console.error('Error handling payment success:', err);
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const customerId = invoice.customer;
  try {
    const stripe = getServerStripe();
    const customer = await stripe.customers.retrieve(customerId as string) as Stripe.Customer;
    const userId = (customer?.metadata?.user_id) ?? null;
    if (userId) {
      // Optionally, notify user of payment failure or log analytics here
      console.log(`Payment failed for user ${userId}, invoice ${invoice.id}`);
    } else {
      console.log(`Payment failed for unknown user, invoice ${invoice.id}`);
    }
  } catch (err) {
    console.error('Error handling payment failure:', err);
  }
}