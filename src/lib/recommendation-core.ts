/**
 * Pure scoring core for Home recommendations.
 * No Supabase, no network — see scripts/qa-recommendations.mts for the harness.
 */

const ALIASES: Record<string, string> = {
  "sci-fi": "science fiction",
  "sci fi": "science fiction",
  "scifi": "science fiction",
  "science_fiction": "science fiction",
  "science fiction": "science fiction",
  "classic lit": "classic literature",
  "classic literature": "classic literature",
  "classics": "classic literature",
  "contemporary": "contemporary fiction",
  "self-help": "self help",
  "self help": "self help",
  "food & cooking": "cooking",
  "food and cooking": "cooking",
  "cooking": "cooking",
  "memoir": "biography",
  "memoirs": "biography",
  "biography & autobiography": "biography",
  "biography and autobiography": "biography",
  "mystery and detective fiction": "mystery",
  "detective and mystery stories": "mystery",
  "fantasy fiction": "fantasy",
  "young adult fiction": "young adult",
  "graphic novel": "comics",
  "true crime": "crime",
  "suspense": "thriller",
  "religion and spirituality": "religion",
};

const SUBJECT_QUERY: Record<string, string> = {
  "science fiction": "science_fiction",
  "classic literature": "classic",
  "contemporary fiction": "contemporary",
  "short stories": "short_stories",
  "young adult": "young_adult",
  "self help": "self_help",
  "comics": "graphic_novels",
  "crime": "crime",
};

const EXPLORE_GENRES = [
  "Mystery", "Fantasy", "History", "Philosophy",
  "Psychology", "Travel", "Poetry", "Science",
];

export function normalizeGenre(raw: string): string {
  if (!raw) return "";
  const key = raw
    .toLowerCase()
    .replace(/[_/]/g, " ")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[-\s]+/g, " ")
    .trim();
  return ALIASES[key] ?? key;
}

export function toSubjectQuery(genre: string): string {
  const canonical = normalizeGenre(genre);
  return SUBJECT_QUERY[canonical] ?? canonical.replace(/\s+/g, "_");
}

export type TasteSession = {
  genres: string[];
  durationSeconds: number;
  pagesRead: number;
  pageCount: number | null;
  date: string;
};

export type TasteProfile = {
  affinity: Record<string, number>;
  readingSpeed: number;
  sessionMinutes: number;
  readGenres: Set<string>;
  hasBehavior: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeMap(source: Record<string, number>): Record<string, number> {
  const total = Object.values(source).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(source)) result[key] = value / total;
  return result;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Onboarding genres + time-decayed reading behavior, all normalized to 0..1. */
export function buildTasteProfile(
  onboardingWeights: Record<string, number>,
  sessions: TasteSession[],
  now: Date = new Date(),
): TasteProfile {
  const onboarding: Record<string, number> = {};
  for (const [raw, weight] of Object.entries(onboardingWeights ?? {})) {
    if (!Number.isFinite(weight) || weight <= 0) continue;
    const genre = normalizeGenre(raw);
    if (genre) onboarding[genre] = Math.max(onboarding[genre] ?? 0, weight);
  }

  const readGenres = new Set(Object.keys(onboarding));
  const behavioral: Record<string, number> = {};
  const days = new Set<string>();
  const durations: number[] = [];
  let totalSeconds = 0;
  let totalPages = 0;

  for (const session of sessions) {
    if (!session || !Number.isFinite(session.durationSeconds) || session.durationSeconds <= 0) continue;
    totalSeconds += session.durationSeconds;
    durations.push(session.durationSeconds / 60);
    days.add(session.date.slice(0, 10));

    const outcome = session.pageCount && session.pageCount > 0
      ? clamp(session.pagesRead / session.pageCount, 0.2, 1)
      : 0.6;
    const ageDays = Math.max(0, (now.getTime() - new Date(session.date).getTime()) / 86_400_000);
    const decay = Math.pow(0.5, ageDays / 30);

    const seen = new Set<string>();
    for (const raw of session.genres ?? []) {
      const genre = normalizeGenre(raw);
      if (!genre || seen.has(genre)) continue;
      seen.add(genre);
      readGenres.add(genre);
      behavioral[genre] = (behavioral[genre] ?? 0) + outcome * decay;
    }
    if (session.pagesRead > 0) totalPages += session.pagesRead;
  }

  const hasBehavior = sessions.length > 0;
  const behaviorWeight = hasBehavior ? (days.size >= 2 ? 0.6 : 0.4) : 0;
  const normalizedOnboarding = normalizeMap(onboarding);
  const normalizedBehavior = normalizeMap(behavioral);
  const affinity: Record<string, number> = {};
  for (const [genre, weight] of Object.entries(normalizedOnboarding)) {
    affinity[genre] = weight * (1 - behaviorWeight);
  }
  for (const [genre, weight] of Object.entries(normalizedBehavior)) {
    affinity[genre] = (affinity[genre] ?? 0) + weight * behaviorWeight;
  }
  const finalAffinity = normalizeMap(affinity);

  const readingSpeed = totalSeconds > 0 && totalPages > 0
    ? Math.round((totalPages / (totalSeconds / 3600)) * 10) / 10
    : 0;

  return {
    affinity: finalAffinity,
    readingSpeed,
    sessionMinutes: durations.length > 0 ? Math.round(median(durations)) : 20,
    readGenres,
    hasBehavior,
  };
}

export type RecommendationCandidate = {
  key: string;
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  subjects: string[];
  pageCount: number | null;
  rankPosition: number;
};

/** Weighted sum of five simple signals. Result is in 0..1. */
export function scoreCandidate(candidate: RecommendationCandidate, profile: TasteProfile): number {
  const subjects = (candidate.subjects ?? []).slice(0, 8).map(normalizeGenre).filter(Boolean);
  const weights = subjects.map((subject) => profile.affinity[subject] ?? 0).sort((a, b) => b - a);
  const genreMatch = weights.length > 0
    ? Math.min(1, (weights[0] ?? 0) + 0.35 * (weights[1] ?? 0))
    : 0;

  const estimatedMinutes = candidate.pageCount && candidate.pageCount > 0 && profile.readingSpeed > 0
    ? (candidate.pageCount / profile.readingSpeed) * 60
    : null;
  const target = profile.sessionMinutes;
  const lengthFit = estimatedMinutes === null
    ? 0.5
    : Math.exp(-Math.pow((estimatedMinutes - target) / (target * 0.75 + 5), 2));

  const effortFit = candidate.pageCount && candidate.pageCount > 0
    ? clamp(1 - Math.max(0, candidate.pageCount - 500) / 700, 0, 1)
    : 0.5;

  const quality = clamp(1 - candidate.rankPosition / 20, 0, 1);
  const novelty = profile.hasBehavior && subjects.length > 0
    ? (subjects.some((subject) => !profile.readGenres.has(subject)) ? 0.7 : 0)
    : 0.5;

  const score = 0.40 * genreMatch
    + 0.20 * lengthFit
    + 0.15 * effortFit
    + 0.15 * quality
    + 0.10 * novelty;
  return Math.round(score * 1000) / 1000;
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set((a ?? []).slice(0, 8).map(normalizeGenre).filter(Boolean));
  const setB = new Set((b ?? []).slice(0, 8).map(normalizeGenre).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const value of setA) if (setB.has(value)) shared++;
  return shared / (setA.size + setB.size - shared);
}

/** Maximal Marginal Relevance — keeps the carousel from becoming one genre. */
export function mmrSelect<T extends RecommendationCandidate & { score: number }>(
  items: T[],
  limit: number,
  lambda = 0.7,
): T[] {
  const pool = [...items].sort((a, b) => b.score - a.score);
  const selected: T[] = [];
  while (selected.length < limit && pool.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      let maxSimilarity = 0;
      for (const chosen of selected) {
        maxSimilarity = Math.max(maxSimilarity, jaccard(candidate.subjects, chosen.subjects));
      }
      const value = lambda * candidate.score - (1 - lambda) * maxSimilarity;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = i;
      }
    }
    selected.push(pool.splice(bestIndex, 1)[0]);
  }
  return selected;
}

/** One deterministic "outside the bubble" genre per refresh cycle. */
export function pickExplorationGenre(readGenres: Set<string>, seed: string): string | null {
  const pool = EXPLORE_GENRES.map(normalizeGenre).filter((genre) => !readGenres.has(genre));
  if (pool.length === 0) return null;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return pool[Math.abs(hash) % pool.length];
}
