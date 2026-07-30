const OPEN_LIBRARY_BASE = 'https://openlibrary.org';

export type OLSearchResult = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  number_of_pages_median?: number;
};

export type OLSearchResponse = {
  numFound: number;
  docs: OLSearchResult[];
};

export type OLWorkDetail = {
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  authors?: { author: { key: string } }[];
  covers?: number[];
  first_publish_date?: string;
};

export type OLEdition = {
  number_of_pages?: number;
  title?: string;
};

export type OLEditionsResponse = {
  entries: OLEdition[];
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library API error: ${res.status}`);
  return res.json();
}

export function buildCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'L'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function searchBooks(query: string, limit = 20): Promise<OLSearchResult[]> {
  const data = await fetchJSON<OLSearchResponse>(
    `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.docs ?? [];
}

export async function getBookDetails(olKey: string): Promise<OLWorkDetail> {
  const key = olKey.startsWith('/works/') ? olKey : `/works/${olKey}`;
  return fetchJSON<OLWorkDetail>(`${OPEN_LIBRARY_BASE}${key}.json`);
}

export async function getBooksBySubject(subject: string, limit = 20): Promise<OLSearchResult[]> {
  const data = await fetchJSON<OLSearchResponse>(
    `${OPEN_LIBRARY_BASE}/search.json?q=subject:${encodeURIComponent(subject)}&limit=${limit}&sort=rating`
  );
  return data.docs ?? [];
}

export function extractOpenLibraryId(key: string): string {
  return key.replace('/works/', '');
}

export async function getWorkPageCount(olKey: string): Promise<number | null> {
  const key = olKey.startsWith('/works/') ? olKey : `/works/${olKey}`;
  try {
    const data = await fetchJSON<OLEditionsResponse>(`${OPEN_LIBRARY_BASE}${key}/editions.json?limit=10`);
    for (const entry of data.entries ?? []) {
      if (entry.number_of_pages) return entry.number_of_pages;
    }
  } catch {}
  return null;
}
