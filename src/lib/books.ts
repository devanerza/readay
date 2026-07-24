import { supabase } from './supabase';

export type Book = {
  id: string;
  open_library_id: string;
  title: string;
  author: string;
  cover_url: string;
  genre: string;
  genres: string[];
  page_count: number;
  description: string;
  isbn: string;
  publisher: string;
  published_date: string;
  rating: number;
  rating_count: number;
  estimated_read_minutes: number;
  mood_tags: string[];
  available_formats: string[];
};

export async function getBook(bookId: string): Promise<Book | null> {
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();
  return data;
}

export async function getBookByOlId(olId: string): Promise<Book | null> {
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('open_library_id', olId)
    .maybeSingle();
  return data;
}
