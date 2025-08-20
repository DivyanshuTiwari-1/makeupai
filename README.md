# GlowAI – Virtual Makeup Preview App

Let users upload a selfie and preview AI-applied makeup looks, with options to customize, download, and replicate the look using real product breakdowns.

## Tech Stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Supabase (Auth, DB, Storage)
- Replicate (AI image generation)
- Stripe (subscriptions)
- Vercel (deployment)

## Features
- 🔐 **User Authentication** - Supabase Auth with Google OAuth
- 💄 **AI Makeup Generation** - 5 preset styles + custom prompts
- 💳 **Credit System** - 3 free generations, unlimited with premium
- 💳 **Stripe Integration** - ₹299/month subscription
- 📸 **Image Management** - Upload, generate, download, save to history
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS

## Setup

### 1. Prerequisites
- Node.js 18+ 
- Supabase account
- Replicate account
- Stripe account

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd makeupai

# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local
```

### 3. Environment Configuration
Edit `.env.local` and add your API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Replicate AI Configuration
REPLICATE_API_TOKEN=your_replicate_api_token

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `database-schema.sql`

### 5. Stripe Configuration
1. Create a product in Stripe Dashboard
2. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
3. Add webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### 6. Run Development Server
```bash
npm run dev
```

## Folder Structure
- `/src/app` – App routes (login, dashboard, generate, history)
- `/src/components` – Shared UI components
- `/src/lib` – Utility libraries (supabase, stripe, replicate, credits)
- `/src/app/api` – API endpoints

## API Endpoints
- `POST /api/generate` - Generate AI makeup image
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/user/credits` - Get user credit information

## Database Structure
- **profiles** table extends `auth.users` with:
  - `credit_count` - Number of free generations remaining
  - `is_subscribed` - Premium subscription status
  - `subscription_id` - Stripe subscription ID
  - `stripe_customer_id` - Stripe customer ID

## Credit System
- **Free Users**: 3 AI generations (stored in profiles table)
- **Premium Users**: Unlimited generations (₹299/month)
- Credits are automatically deducted on each generation
- Subscription status is managed via Stripe webhooks
- New users automatically get 3 free credits via database trigger
