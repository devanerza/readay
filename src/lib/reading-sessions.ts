import { supabase } from './supabase';
import { startOfWeek, startOfYear, eachDayOfInterval, subDays } from 'date-fns';

export type ReadingSession = {
  id: string;
  user_id: string;
  book_id: string;
  duration_seconds: number;
  pages_read: number;
  date: string;
  created_at: string;
};

export type ReadingStats = {
  totalMinutes: number;
  totalPages: number;
  sessionsCount: number;
  thisWeekMinutes: number;
  streakDays: number;
  booksCompleted: number;
};

export async function getReadingStats(userId: string): Promise<ReadingStats> {
  const { data: sessions } = await supabase
    .from('reading_sessions')
    .select('duration_seconds, pages_read, date')
    .eq('user_id', userId);

  if (!sessions || sessions.length === 0) {
    return { totalMinutes: 0, totalPages: 0, sessionsCount: 0, thisWeekMinutes: 0, streakDays: 0, booksCompleted: 0 };
  }

  const totalMinutes = Math.round(sessions.reduce((s, r) => s + r.duration_seconds, 0) / 60);
  const totalPages = sessions.reduce((s, r) => s + (r.pages_read ?? 0), 0);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekSessions = sessions.filter((s) => new Date(s.date) >= weekStart);
  const thisWeekMinutes = Math.round(thisWeekSessions.reduce((s, r) => s + r.duration_seconds, 0) / 60);

  const daysWithSessions = new Set(sessions.map((s) => s.date.slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = subDays(today, i);
    const key = d.toISOString().slice(0, 10);
    if (daysWithSessions.has(key)) streak++;
    else break;
  }

  const { count: booksCompleted } = await supabase
    .from('reading_sessions')
    .select('book_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('pages_read', 1);

  return {
    totalMinutes,
    totalPages,
    sessionsCount: sessions.length,
    thisWeekMinutes,
    streakDays: streak,
    booksCompleted: booksCompleted ?? 0,
  };
}

export async function getWeeklySessionDays(userId: string, weeksBack: number = 4): Promise<{ date: string; minutes: number }[]> {
  const start = subDays(new Date(), weeksBack * 7);
  const { data } = await supabase
    .from('reading_sessions')
    .select('date, duration_seconds')
    .eq('user_id', userId)
    .gte('date', start.toISOString())
    .order('date', { ascending: true });

  if (!data) return [];

  const dayMap = new Map<string, number>();
  data.forEach((s) => {
    const key = s.date.slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + s.duration_seconds);
  });
  return Array.from(dayMap.entries()).map(([date, seconds]) => ({
    date,
    minutes: Math.round(seconds / 60),
  }));
}

export async function createReadingSession(session: {
  user_id: string;
  book_id: string;
  duration_seconds: number;
  pages_read: number;
  date: string;
}) {
  const { error } = await supabase.from('reading_sessions').insert(session);
  if (error) throw error;
}
