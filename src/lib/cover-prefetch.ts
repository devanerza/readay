import { Image } from "expo-image";

const prefetched = new Set<string>();

export function prefetchCovers(urls: (string | null | undefined)[], limit = 6): void {
  let queued = 0;
  for (const url of urls) {
    if (!url || prefetched.has(url)) continue;
    prefetched.add(url);
    Image.prefetch(url).catch(() => {});
    if (++queued >= limit) break;
  }
}
