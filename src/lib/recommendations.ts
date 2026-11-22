import { supabase } from './supabase';
import { buildCoverUrl, extractOpenLibraryId, getBooksBySubject, type OLSearchResult } from './open-library';
import {
  buildTasteProfile,
  mmrSelect,
  pickExplorationGenre,
  scoreCandidate,
  toSubjectQuery,
  type RecommendationCandidate,
  type TasteSession,
} from './recommendation-core';

export type RecommendedBook = {
  key: string;
  open_library_id: string;
  title: string;
  author: string;
  cover_url: string | null;
};

type SessionRow = {
  book_id: string;
  duration_seconds: number;
  pages_read: number;
  date: string;
  books: { genres: string[] | null; page_count: number | null }[] | null;
};

type QueueRow = {
  books: { open_library_id: string | null }[] | null;
};

function currentWeekKey(now: Date): string {
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  return weekStart.toISOString().slice(0, 10);
}

/**
 * Personalized Home recommendations. Reads the user's own sessions, excludes
 * books already in the queue, and scores Open Library results with the pure core.
 */
export async function getRecommendations(
  userId: string,
  genreWeights: Record<string, number>,
  limit = 8,
): Promise<RecommendedBook[]> {
  const [sessionsResult, queueResult] = await Promise.all([
    supabase
      .from('reading_sessions')
      .select('book_id, duration_seconds, pages_read, date, books(genres, page_count)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(200),
    supabase
      .from('queue_items')
      .select('books(open_library_id)')
      .eq('user_id', userId),
  ]);

  const sessions: TasteSession[] = ((sessionsResult.data ?? []) as unknown as SessionRow[]).map((row) => {
    const book = row.books?.[0] ?? null;
    return {
      genres: book?.genres ?? [],
      durationSeconds: row.duration_seconds ?? 0,
      pagesRead: row.pages_read ?? 0,
      pageCount: book?.page_count ?? null,
      date: row.date,
    };
  });

  const exclude = new Set<string>();
  for (const row of (queueResult.data ?? []) as unknown as QueueRow[]) {
    const olId = row.books?.[0]?.open_library_id;
    if (olId) exclude.add(olId);
  }

  const profile = buildTasteProfile(genreWeights, sessions);
  const topGenres = Object.entries(profile.affinity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
  if (topGenres.length === 0) topGenres.push('fiction');

  const exploration = pickExplorationGenre(profile.readGenres, `${userId}:${currentWeekKey(new Date())}`);
  const queries = [...topGenres, ...(exploration ? [exploration] : [])].map(toSubjectQuery);

  const batches = await Promise.all(
    queries.map((query) => getBooksBySubject(query, 20).catch(() => [] as OLSearchResult[])),
  );

  const seen = new Set<string>();
  const candidates: RecommendationCandidate[] = [];
  for (const batch of batches) {
    for (let index = 0; index < batch.length; index++) {
      const doc = batch[index];
      const openLibraryId = extractOpenLibraryId(doc.key);
      if (!openLibraryId || seen.has(openLibraryId) || exclude.has(openLibraryId)) continue;
      seen.add(openLibraryId);
      candidates.push({
        key: doc.key,
        openLibraryId,
        title: doc.title,
        author: doc.author_name?.[0] ?? '',
        coverUrl: doc.cover_i ? buildCoverUrl(doc.cover_i) : null,
        subjects: doc.subject ?? [],
        pageCount: doc.number_of_pages_median ?? null,
        rankPosition: index,
      });
    }
  }

  const scored = candidates.map((candidate) => ({ ...candidate, score: scoreCandidate(candidate, profile) }));
  return mmrSelect(scored, limit).map((book) => ({
    key: book.key,
    open_library_id: book.openLibraryId,
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl,
  }));
}
