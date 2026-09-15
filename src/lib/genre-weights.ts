import { supabase } from './supabase';

/**
 * Trigger genre weight recalculation for a user.
 * Called after a reading session is completed.
 * DB-side: Devan provisions Edge Function or trigger that reads recent sessions
 * and updates profiles.genre_weights based on book genres + session frequency.
 */
export async function recalculateGenreWeights(userId: string): Promise<void> {
  // ponytail: Edge Function endpoint not provisioned yet — Devan owns DB-side.
  // For now, call a placeholder RPC that Devan will implement.
  // Expected shape: `rpc('recalculate_genre_weights', { user_id: userId })`
  
  try {
    const { error } = await supabase.rpc('recalculate_genre_weights', { user_id: userId });
    if (error) throw error;
  } catch (e) {
    // Fail silently — genre weight shift is enhancement, not critical path
    console.warn('Genre weight recalculation failed:', e);
  }
}
