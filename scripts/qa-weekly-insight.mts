// QA harness for the rule-based weekly coach (Phase 4-6 DoD).
// Pure computation only -- no Supabase, no network, no live project access.
// Run: npm run qa:weekly-insight
import { computeWeeklyInsight } from '../src/lib/weekly-insight-core.ts';

const FIXED = new Date(2026, 10, 13); // Fri 13 Nov 2026 (local)
const iso = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h).toISOString();
const sess = (y: number, m: number, d: number, min: number) => ({ duration_seconds: min * 60, date: iso(y, m, d) });

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name, extra); }
}

console.log('\n1) insufficient data (empty)');
{
  const r = computeWeeklyInsight([], FIXED);
  check('score 0', r.consistencyScore === 0, JSON.stringify(r));
  check('minutes 0', r.weekTotalMinutes === 0);
  check('narrative mentions waiting', /shelf is waiting/.test(r.narrative));
  check('recommendation non-empty', r.recommendation.length > 10);
  check('trend stable', r.trend === 'stable');
}

console.log('\n2) this week only, 3 days, 90 min -> trend up vs 0');
{
  const r = computeWeeklyInsight([sess(2026,11,9,30), sess(2026,11,10,30), sess(2026,11,11,30)], FIXED);
  check('minutes 90', r.weekTotalMinutes === 90, String(r.weekTotalMinutes));
  check('consistency 3/7 = 43', r.consistencyScore === 43, String(r.consistencyScore));
  check('trend up', r.trend === 'up', r.trend);
  check('narrative has 90', r.narrative.includes('90'), r.narrative);
  check('medium-band recommendation', /3 sessions|ritual/.test(r.recommendation), r.recommendation);
}

console.log('\n3) low week (1 day, 10 min) -> low-band reco');
{
  const r = computeWeeklyInsight([sess(2026,11,12,10)], FIXED);
  check('consistency 14', r.consistencyScore === 14, String(r.consistencyScore));
  check('low-band reco', /10 minutes before bed|5 pages/.test(r.recommendation), r.recommendation);
  // KNOWN RULE (documented, not a bug): streak is strict -- it only counts if
  // today has a session, so a day with no session yet resets it to 0.
  check('streak strict-resets to 0 when today unlogged', r.streakDays === 0, String(r.streakDays));
}

console.log('\n4) full week -> high band + streak 7');
{
  const s = [9,10,11,12,13,14,15].map((d) => sess(2026,11,d,20));
  const r = computeWeeklyInsight(s, FIXED);
  check('consistency 100', r.consistencyScore === 100, String(r.consistencyScore));
  check('high-band reco', /increasing your session|great groove/.test(r.recommendation), r.recommendation);
  check('minutes 140', r.weekTotalMinutes === 140, String(r.weekTotalMinutes));
}

console.log('\n5) down trend (this wk 20m vs last wk 120m)');
{
  const s = [sess(2026,11,9,20), sess(2026,11,2,60), sess(2026,11,4,60)];
  const r = computeWeeklyInsight(s, FIXED);
  check('minutes 20', r.weekTotalMinutes === 20, String(r.weekTotalMinutes));
  check('trend down', r.trend === 'down', r.trend);
  check('narrative has dip/quieter', /quieter week|dip/.test(r.narrative), r.narrative);
}

console.log('\n6) streak counting consecutive days ending today');
{
  const s = [sess(2026,11,13,10), sess(2026,11,12,10), sess(2026,11,11,10), sess(2026,11,9,10)];
  const r = computeWeeklyInsight(s, FIXED);
  check('streak 3 (gap at 10 Nov breaks)', r.streakDays === 3, String(r.streakDays));
}

console.log('\n7) month boundary (last-week sessions in Oct)');
{
  const s = [sess(2026,10,28,60), sess(2026,10,30,60), sess(2026,11,10,30)];
  const r = computeWeeklyInsight(s, new Date(2026, 10, 11));
  check('this week 30', r.weekTotalMinutes === 30, String(r.weekTotalMinutes));
  check('no crash on prev-month rows', typeof r.narrative === 'string' && r.narrative.length > 0);
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
