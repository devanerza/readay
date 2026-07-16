import { supabase } from './supabase';

export type QueueItem = {
  id: string;
  user_id: string;
  book_id: string;
  rank: number;
  reason_text: string;
  status: 'want_to_read' | 'reading' | 'finished';
  created_at: string;
};

export type QueueItemWithBook = QueueItem & {
  books: {
    id: string;
    open_library_id: string;
    title: string;
    author: string;
    cover_url: string;
    page_count: number;
    genres: string[];
  } | null;
};

export async function getQueueItems(userId: string, status?: string): Promise<QueueItemWithBook[]> {
  let query = supabase
    .from('queue_items')
    .select('*, books(*)')
    .eq('user_id', userId)
    .order('rank', { ascending: true });

  if (status) query = query.eq('status', status);

  const { data } = await query;
  return data ?? [];
}

export async function getNextRead(userId: string): Promise<QueueItemWithBook | null> {
  const { data } = await supabase
    .from('queue_items')
    .select('*, books(*)')
    .eq('user_id', userId)
    .eq('status', 'want_to_read')
    .order('rank', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getCurrentlyReading(userId: string): Promise<QueueItemWithBook | null> {
  const { data } = await supabase
    .from('queue_items')
    .select('*, books(*)')
    .eq('user_id', userId)
    .eq('status', 'reading')
    .limit(1)
    .maybeSingle();

  return data;
}

export async function addToQueue(item: {
  user_id: string;
  book_id: string;
  reason_text?: string;
}) {
  const { data: maxRank } = await supabase
    .from('queue_items')
    .select('rank')
    .eq('user_id', item.user_id)
    .order('rank', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextRank = (maxRank?.rank ?? 0) + 1;
  const { error } = await supabase.from('queue_items').insert({
    user_id: item.user_id,
    book_id: item.book_id,
    rank: nextRank,
    reason_text: item.reason_text ?? '',
    status: 'want_to_read',
  });
  if (error) throw error;
}

export async function updateQueueItemStatus(id: string, status: 'reading' | 'finished' | 'want_to_read') {
  const { error } = await supabase.from('queue_items').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteQueueItem(id: string) {
  const { error } = await supabase.from('queue_items').delete().eq('id', id);
  if (error) throw error;
}
