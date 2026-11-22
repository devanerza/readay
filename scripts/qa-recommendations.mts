// QA harness for the Home recommendation scorer.
// Pure computation only -- no Supabase, no network.
// Run: npm run qa:recommendations
import {
  buildTasteProfile,
  mmrSelect,
  normalizeGenre,
  pickExplorationGenre,
  scoreCandidate,
  toSubjectQuery,
  type RecommendationCandidate,
  type TasteSession,
} from '../src/lib/recommendation-core.ts';

let pass = 0;
let fail = 0;

function check(name: string, condition: boolean, extra = '') {
  if (condition) {
    pass++;
    console.log('  PASS', name);
  } else {
    fail++;
    console.log('  FAIL', name, extra);
  }
}

const NOW = new Date(2026, 10, 22);
const iso = (y: number, m: number, d: number) => new Date(y, m - 1, d, 9).toISOString();

function candidate(overrides: Partial<RecommendationCandidate> = {}): RecommendationCandidate {
  return {
    key: '/works/OL1W',
    openLibraryId: 'OL1W',
    title: 'A Book',
    author: 'An Author',
    coverUrl: null,
    subjects: ['Fiction'],
    pageCount: 300,
    rankPosition: 0,
    ...overrides,
  };
}

console.log('\n1) genre normalization + subject query mapping');
{
  check('sci-fi -> science fiction', normalizeGenre('Sci-Fi') === 'science fiction');
  check('food & cooking -> cooking', normalizeGenre('Food & Cooking') === 'cooking');
  check('OL mystery phrase -> mystery', normalizeGenre('Mystery and detective fiction') === 'mystery');
  check('subject query uses OL underscore', toSubjectQuery('Sci-Fi') === 'science_fiction');
}

console.log('\n2) cold start uses onboarding weights only');
{
  const profile = buildTasteProfile({ Mystery: 0.8, Fantasy: 0.2 }, [], NOW);
  check('no behavior', profile.hasBehavior === false);
  check('top affinity is mystery', Object.entries(profile.affinity).sort((a, b) => b[1] - a[1])[0][0] === 'mystery');
  check('default 20-minute session', profile.sessionMinutes === 20);
  check('no speed estimate', profile.readingSpeed === 0);
}

console.log('\n3) behavior shifts affinity + derives speed and session length');
{
  const sessions: TasteSession[] = [
    { genres: ['Fantasy'], durationSeconds: 3600, pagesRead: 300, pageCount: 300, date: iso(2026, 11, 20) },
    { genres: ['Fantasy'], durationSeconds: 3600, pagesRead: 300, pageCount: 300, date: iso(2026, 11, 21) },
  ];
  const profile = buildTasteProfile({ Mystery: 0.8, Fantasy: 0.2 }, sessions, NOW);
  check('has behavior', profile.hasBehavior === true);
  check('behavior dominates: fantasy is top', Object.entries(profile.affinity).sort((a, b) => b[1] - a[1])[0][0] === 'fantasy');
  check('reading speed = 300 pages/hour', profile.readingSpeed === 300);
  check('session length = 60 min', profile.sessionMinutes === 60);
  check('fantasy marked as read', profile.readGenres.has('fantasy'));
}

console.log('\n4) length fit penalizes a book that cannot fit the session budget');
{
  const profile = buildTasteProfile({ Fantasy: 1 }, [
    { genres: ['Fantasy'], durationSeconds: 1200, pagesRead: 50, pageCount: 400, date: iso(2026, 11, 21) },
  ], NOW);
  const short = scoreCandidate(candidate({ subjects: ['Fantasy'], pageCount: 80 }), profile);
  const long = scoreCandidate(candidate({ subjects: ['Fantasy'], pageCount: 1600, rankPosition: 0 }), profile);
  check('short book scores higher than 1600-page book', short > long, `${short} vs ${long}`);
}

console.log('\n5) rank position affects quality signal');
{
  const profile = buildTasteProfile({ Fantasy: 1 }, [], NOW);
  const top = scoreCandidate(candidate({ rankPosition: 0 }), profile);
  const bottom = scoreCandidate(candidate({ rankPosition: 19 }), profile);
  check('higher-ranked OL result scores higher', top > bottom, `${top} vs ${bottom}`);
}

console.log('\n6) MMR diversifies an all-same-genre result set');
{
  type Item = RecommendationCandidate & { score: number };
  const items: Item[] = [
    { ...candidate({ key: 'a', openLibraryId: 'a', subjects: ['Fantasy'] }), score: 0.9 },
    { ...candidate({ key: 'b', openLibraryId: 'b', subjects: ['Fantasy'] }), score: 0.88 },
    { ...candidate({ key: 'c', openLibraryId: 'c', subjects: ['History'] }), score: 0.6 },
  ];
  const picked = mmrSelect(items, 2, 0.7);
  check('second pick is the different genre', picked[1].openLibraryId === 'c', picked.map((p) => p.openLibraryId).join(','));
}

console.log('\n7) exploration pick is deterministic and avoids read genres');
{
  const readGenres = new Set(['mystery', 'fantasy', 'history', 'philosophy', 'psychology', 'travel', 'poetry', 'science']);
  const first = pickExplorationGenre(readGenres, 'user-1:2026-11-16');
  const second = pickExplorationGenre(readGenres, 'user-1:2026-11-16');
  check('same seed gives same genre', first === second);
  check('returns null when every option is read', first === null);
  check('unread genres yield a pick', pickExplorationGenre(new Set(['mystery']), 'user-1:2026-11-16') !== null);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
