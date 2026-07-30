import { supabase } from './supabase';
import {
  getBookDetails,
  getWorkPageCount,
  buildCoverUrl,
  type OLSearchResult,
} from './open-library';

export async function cacheBookFromSearch(doc: OLSearchResult): Promise<string> {
  const olId = doc.key.replace('/works/', '');
  const { data, error } = await supabase
    .from('books')
    .upsert({
      open_library_id: olId,
      title: doc.title ?? 'Unknown',
      author: doc.author_name?.[0] ?? 'Unknown',
      cover_url: doc.cover_i ? buildCoverUrl(doc.cover_i) : null,
      genres: doc.subject ?? [],
      isbn: doc.isbn?.[0] ?? '',
      published_date: doc.first_publish_year?.toString() ?? '',
      page_count: doc.number_of_pages_median ?? null,
    }, { onConflict: 'open_library_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data!.id;
}

export async function cacheBookFromDetail(olId: string): Promise<string> {
  const detail = await getBookDetails(olId);
  const pageCount = await getWorkPageCount(olId);
  const { data, error } = await supabase
    .from('books')
    .upsert({
      open_library_id: olId,
      title: detail.title ?? 'Unknown',
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
