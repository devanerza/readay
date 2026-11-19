import { startOfWeek, format } from 'date-fns';
import { supabase } from './supabase';
import { computeWeeklyInsight, type WeeklyInsight } from './weekly-insight-core';

export type { WeeklyInsight, SessionRow } from './weekly-insight-core';

export async function generateWeeklyInsight(userId: string): Promise<WeeklyInsight> {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const { data: sessions } = await supabase
    .from('reading_sessions')
    .select('duration_seconds, date')
    .eq('user_id', userId)
    .gte('date', lastWeekStart.toISOString())
    .order('date', { ascending: true });

  return computeWeeklyInsight(sessions ?? [], today);
}

/**
 * Get weekly insight with caching.
 * Reads from weekly_insights table first, falls back to generation if cache miss.
 */
export async function getWeeklyInsight(userId: string): Promise<WeeklyInsight> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');

  // Try cache first
  const { data: cached } = await supabase
    .from('weekly_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekKey)
    .maybeSingle();

  if (cached) {
    // Return cached insight (narrative/recommendation only; recompute stats on-the-fly for now)
    const freshStats = await generateWeeklyInsight(userId);
    return {
      ...freshStats,
      narrative: cached.summary_text,
      recommendation: cached.recommendation_text,
    };
  }

  // Cache miss — generate and persist
  const insight = await generateWeeklyInsight(userId);
  await cacheWeeklyInsight(userId, weekKey, insight);
  return insight;
}

/**
 * Cache weekly insight to DB.
 */
async function cacheWeeklyInsight(userId: string, weekStart: string, insight: WeeklyInsight): Promise<void> {
  await supabase.from('weekly_insights').upsert({
    user_id: userId,
    week_start: weekStart,
    summary_text: insight.narrative,
    recommendation_text: insight.recommendation,
  }, { onConflict: 'user_id,week_start' });
}

/**
 * Invalidate cached insight for current week (call after new session logged).
 */
export async function invalidateWeeklyInsight(userId: string): Promise<void> {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  await supabase
    .from('weekly_insights')
    .delete()
    .eq('user_id', userId)
    .eq('week_start', weekStart);
}
