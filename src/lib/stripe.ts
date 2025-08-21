import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Validate Stripe secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || stripeSecretKey === 'sk_test_your_stripe_secret_key') {
  throw new Error('STRIPE_SECRET_KEY is not configured. Please add your Stripe secret key to .env.local');
}

// Server-side Stripe instance
export const stripe = new Stripe(stripeSecretKey);

// Client-side Stripe instance
export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey === 'pk_test_your_stripe_publishable_key') {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured. Please add your Stripe publishable key to .env.local');
    return null;
  }
  return loadStripe(publishableKey);
};

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  premium: {
    name: 'Premium Plan',
    price: 20, // ₹299/month
    currency: 'usd',
    interval: 'month' as const,
    features: [
      'Unlimited makeup generations',
      'Access to all makeup styles',
      'High-resolution downloads',
      'Priority support',
      'No watermarks'
    ]
  }
};

// Webhook event types
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed'
}; 