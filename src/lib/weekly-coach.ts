import { subDays, startOfWeek, differenceInDays, format } from 'date-fns';
import { supabase } from './supabase';

export type WeeklyInsight = {
  narrative: string;
  consistencyScore: number;
  streakDays: number;
  recommendation: string;
  weekTotalMinutes: number;
  trend: 'up' | 'down' | 'stable';
};

type CachedInsight = {
  id: string;
  user_id: string;
  week_start: string;
  summary_text: string;
  recommendation_text: string;
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export async function generateWeeklyInsight(userId: string): Promise<WeeklyInsight> {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subDays(weekStart, 7);

  const { data: sessions } = await supabase
    .from('reading_sessions')
    .select('duration_seconds, date')
    .eq('user_id', userId)
    .gte('date', lastWeekStart.toISOString())
    .order('date', { ascending: true });

  if (!sessions || sessions.length === 0) {
    return {
      narrative: 'No reading sessions logged this week yet. Your shelf is waiting — even 10 minutes counts.',
      consistencyScore: 0,
      streakDays: 0,
      recommendation: 'Try starting with a short 10-minute session tonight.',
      weekTotalMinutes: 0,
      trend: 'stable',
    };
  }

  const thisWeekSessions = sessions.filter((s) => new Date(s.date) >= weekStart);
  const lastWeekSessions = sessions.filter((s) => new Date(s.date) < weekStart && new Date(s.date) >= lastWeekStart);

  const thisWeekMinutes = Math.round(thisWeekSessions.reduce((s, r) => s + r.duration_seconds, 0) / 60);
  const lastWeekMinutes = Math.round(lastWeekSessions.reduce((s, r) => s + r.duration_seconds, 0) / 60);

  const daysInWeek = 7;
  const daysReadThisWeek = new Set(thisWeekSessions.map((s) => s.date.slice(0, 10))).size;
  const consistencyScore = Math.round((daysReadThisWeek / daysInWeek) * 100);

  const allDates = sessions.map((s) => s.date.slice(0, 10));
  const uniqueDays = [...new Set(allDates)].sort().reverse();

  let streakDays = 0;
  for (const day of uniqueDays) {
    const [y, m, d] = day.split('-').map(Number);
    const localDay = new Date(y, m - 1, d);
    const expected = subDays(today, streakDays);
    if (differenceInDays(expected, localDay) === 0) streakDays++;
    else break;
  }

  const trend = thisWeekMinutes > lastWeekMinutes ? 'up' : thisWeekMinutes < lastWeekMinutes ? 'down' : 'stable';

  const narrativeTemplates = {
    up: [
      `You're building momentum — ${thisWeekMinutes} minutes this week, up from ${lastWeekMinutes} last week. ${consistencyScore >= 50 ? 'Consistency is growing.' : 'Keep showing up.'}`,
      `Solid progress: ${thisWeekMinutes} minutes across ${daysReadThisWeek} days. That's ${thisWeekMinutes - lastWeekMinutes} more minutes than last week.`,
    ],
    down: [
      `A quieter week at ${thisWeekMinutes} minutes. Last week you managed ${lastWeekMinutes}. Even a single short session can rebuild the rhythm.`,
      `${thisWeekMinutes} minutes this week — a dip from ${lastWeekMinutes} last week. No pressure, just pick up where you left off.`,
    ],
    stable: [
      `Steady at ${thisWeekMinutes} minutes this week, similar to last week (${lastWeekMinutes}). Consistency is the foundation.`,
      `Another ${thisWeekMinutes}-minute week. Reliable as ever. Small increments add up over time.`,
    ],
  };

  const recommendationTemplates = {
    high: [
      'Try increasing your session by 5 minutes this week to build endurance.',
      'You\'re in a great groove — consider tackling a longer chapter or a denser book.',
    ],
    medium: [
      'Aim for 3 sessions this week to build a habit loop.',
      'Try pairing reading with a daily ritual like coffee or winding down for bed.',
    ],
    low: [
      'Start with 10 minutes before bed for 3 days this week.',
      'Set a tiny goal: read just 5 pages. Once you start, you\'ll likely read more.',
    ],
  };

  const seed = consistencyScore + weekStart.getDate();

  const recommendation = consistencyScore >= 70
    ? pick(recommendationTemplates.high, seed)
    : consistencyScore >= 40
    ? pick(recommendationTemplates.medium, seed)
    : pick(recommendationTemplates.low, seed);

  return {
    narrative: pick(narrativeTemplates[trend], seed),
    consistencyScore,
    streakDays,
    recommendation,
    weekTotalMinutes: thisWeekMinutes,
    trend,
  };
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
