import { NextRequest } from 'next/server';
import { createSupabaseServerClientDirect } from './supabase';

export interface AuthResult {
  userId: string;
  userEmail: string;
  isFallback: boolean;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  // First try to get user from middleware headers
  let userId = request.headers.get('x-user-id');
  let userEmail = request.headers.get('x-user-email');
  let isFallback = false;

  // If middleware didn't set headers, try fallback authentication
  if (!userId || !userEmail) {
    console.log('[Auth Utils] No middleware headers found, trying fallback authentication');
    isFallback = true;
    
    try {
      const supabase = createSupabaseServerClientDirect();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error(error?.message || 'No user found');
      }
      
      userId = user.id;
      userEmail = user.email || '';
      console.log('[Auth Utils] Fallback auth successful for user:', userId);
    } catch (error) {
      console.error('[Auth Utils] Fallback auth error:', error);
      throw new Error('Authentication failed');
    }
  }

  if (!userId) {
    throw new Error('User ID not found');
  }

  return {
    userId,
    userEmail: userEmail || '',
    isFallback
  };
}