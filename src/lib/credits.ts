import { CookieOptions } from '@supabase/ssr';
import { createSupabaseServerClient } from './supabase';

export interface UserProfile {
  id: string;
  credit_count: number;
  is_subscribed: boolean;
  subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

// Default free credits for new users
export const DEFAULT_FREE_CREDITS = 3;

// Credit system functions
export async function getUserProfile(userId: string, cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
}): Promise<UserProfile | null> {
  const supabase = createSupabaseServerClient(cookies);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function createUserProfile(userId: string, cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
}): Promise<UserProfile | null> {
  const supabase = createSupabaseServerClient(cookies);
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      credit_count: DEFAULT_FREE_CREDITS,
      is_subscribed: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }

  return data;
}

export async function checkUserCredits(userId: string, cookies:{
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
}): Promise<{ hasCredits: boolean; credits: number; isSubscribed: boolean }> {
  let userProfile = await getUserProfile(userId, cookies);
  
  // Create profile record if it doesn't exist
  if (!userProfile) {
    userProfile = await createUserProfile(userId, cookies);
  }

  if (!userProfile) {
    return { hasCredits: false, credits: 0, isSubscribed: false };
  }

  // Subscribed users have unlimited credits
  if (userProfile.is_subscribed) {
    return { hasCredits: true, credits: -1, isSubscribed: true }; // -1 indicates unlimited
  }

  return { 
    hasCredits: userProfile.credit_count > 0, 
    credits: userProfile.credit_count, 
    isSubscribed: false 
  };
}

export async function deductCredit(userId: string, cookies:{
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
}): Promise<boolean> {
  const supabase = createSupabaseServerClient(cookies);
  
  // First check if user has credits
  const creditStatus = await checkUserCredits(userId, cookies);
  
  if (!creditStatus.hasCredits) {
    return false;
  }

  // If subscribed, no need to deduct credits
  if (creditStatus.isSubscribed) {
    return true;
  }

  // Deduct one credit
  const { error } = await supabase
    .from('profiles')
    .update({ 
      credit_count: creditStatus.credits - 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Error deducting credit:', error);
    return false;
  }

  return true;
}

export async function updateSubscriptionStatus(
  userId: string, 
  isSubscribed: boolean, 
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
  },
  subscriptionId?: string
): Promise<boolean> {
  const supabase = createSupabaseServerClient(cookies);
  
  const updateData: {
    is_subscribed: boolean;
    updated_at: string;
    subscription_id?: string;
  } = {
    is_subscribed: isSubscribed,
    updated_at: new Date().toISOString()
  };

  if (subscriptionId) {
    updateData.subscription_id = subscriptionId;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }

  return true;
} 