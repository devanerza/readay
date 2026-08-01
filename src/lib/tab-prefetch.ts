import type { QueryClient } from '@tanstack/react-query';
import { getProfile } from './profiles';
import { getReadingStats, getWeeklySessionDays, getTargetPerformance } from './reading-sessions';
import { getAllCurrentlyReading, getQueueItems } from './queue-items';
import { getScheduleBlocks } from './schedule-blocks';
import { generateWeeklyInsight } from './weekly-coach';
import { getBooksBySubject } from './open-library';

export function prefetchTabs(queryClient: QueryClient, userId: string) {
  void queryClient.prefetchQuery({ queryKey: ['profile', userId], queryFn: () => getProfile(userId) });
  void queryClient.prefetchQuery({ queryKey: ['reading-stats', userId], queryFn: () => getReadingStats(userId) });
  void queryClient.prefetchQuery({ queryKey: ['all-reading', userId], queryFn: () => getAllCurrentlyReading(userId) });
  void queryClient.prefetchQuery({ queryKey: ['want-to-read', userId], queryFn: () => getQueueItems(userId, 'want_to_read') });
  void queryClient.prefetchQuery({ queryKey: ['finished-books', userId], queryFn: () => getQueueItems(userId, 'finished') });
  void queryClient.prefetchQuery({ queryKey: ['schedule-blocks', userId], queryFn: () => getScheduleBlocks(userId) });
  void queryClient.prefetchQuery({ queryKey: ['queue-items', userId, 'want_to_read'], queryFn: () => getQueueItems(userId) });
  void queryClient.prefetchQuery({ queryKey: ['queue-count', userId], queryFn: () => getQueueItems(userId) });
  void queryClient.prefetchQuery({ queryKey: ['weekly-session-days', userId], queryFn: () => getWeeklySessionDays(userId, 2) });
  void queryClient.prefetchQuery({ queryKey: ['weekly-insight', userId], queryFn: () => generateWeeklyInsight(userId) });
  void queryClient.prefetchQuery({ queryKey: ['target-performance', userId], queryFn: () => getTargetPerformance(userId) });
  void queryClient.prefetchQuery({ queryKey: ['ol-subject', 'All Curated'], queryFn: () => getBooksBySubject('fiction', 20) });
}
