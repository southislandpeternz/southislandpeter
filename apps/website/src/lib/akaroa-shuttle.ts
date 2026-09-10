/**
 * Confirmed SP2036 MVP Akaroa Shuttle weekly pattern.
 * Product-display copy only — not a timetable, price list, or availability feed.
 */
export interface AkaroaWeeklyPatternDay {
  id: 'saturday';
  day: string;
  arrangement: string;
}

export const AKAROA_WEEKLY_PATTERN: readonly AkaroaWeeklyPatternDay[] = [
  {
    id: 'saturday',
    day: 'Saturday',
    arrangement: 'Christchurch → Akaroa → Christchurch',
  },
];
