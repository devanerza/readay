import { supabase } from './supabase';
import {
  getBookDetails,
  getAuthorNames,
  getWorkPageCount,
  buildCoverUrl,
} from './open-library';

export async function cacheBookFromDetail(olId: string): Promise<string> {
  const detail = await getBookDetails(olId);
  const [authorNames, pageCount] = await Promise.all([
    getAuthorNames(detail.authors),
    getWorkPageCount(olId),
  ]);
  const { data, error } = await supabase
    .from('books')
    .upsert({
      open_library_id: olId,
      title: detail.title ?? 'Unknown',
      author: authorNames[0] ?? null,
      cover_url: detail.covers?.[0] ? buildCoverUrl(detail.covers[0]) : null,
      genres: detail.subjects ?? [],
      description: typeof detail.description === 'string' ? detail.description : detail.description?.value ?? '',
      published_date: detail.first_publish_date ?? '',
      page_count: pageCount,
    }, { onConflict: 'open_library_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data!.id;
}
