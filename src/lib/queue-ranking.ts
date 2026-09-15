import { supabase } from './supabase';
import type { QueueItemWithBook } from './queue-items';

/**
 * Calculate weighted genre match score for a book against user's genre weights.
 * Higher score = better match to user's current reading preferences.
 */
function calculateGenreScore(bookGenres: string[], genreWeights: Record<string, number>): number {
  if (!bookGenres || bookGenres.length === 0) return 0;
  
  let totalWeight = 0;
  let matchCount = 0;
  
  for (const genre of bookGenres) {
    const weight = genreWeights[genre.toLowerCase()];
    if (weight !== undefined) {
      totalWeight += weight;
      matchCount++;
    }
  }
  
  return matchCount > 0 ? totalWeight / matchCount : 0;
}

/**
 * Re-rank queue items by genre match score (client-side sort).
 * Called after genre weights change or on queue load.
 * Returns sorted items (does NOT mutate DB rank column).
 */
export function reRankQueue(
  items: QueueItemWithBook[],
  genreWeights: Record<string, number>
): QueueItemWithBook[] {
  return [...items].sort((a, b) => {
    const scoreA = calculateGenreScore(a.books?.genres ?? [], genreWeights);
    const scoreB = calculateGenreScore(b.books?.genres ?? [], genreWeights);
    
    // Higher score = higher priority (descending)
    if (scoreB !== scoreA) return scoreB - scoreA;
    
    // Tie-breaker: preserve original rank
    return a.rank - b.rank;
  });
}

/**
 * Persist new ranks to DB after client-side re-sort.
 * Updates queue_items.rank for all items in batch.
 */
export async function persistQueueRanks(rankedItems: QueueItemWithBook[]): Promise<void> {
  const updates = rankedItems.map((item, index) => ({
    id: item.id,
    rank: index + 1,
  }));
  
  // Batch update all ranks
  for (const update of updates) {
    await supabase
      .from('queue_items')
      .update({ rank: update.rank })
      .eq('id', update.id);
  }
}
