/**
 * Confirmed SP2036 MVP Kaikoura Shuttle weekly pattern.
 * Product-display copy only — not a timetable, price list, or availability feed.
 */
export interface KaikouraWeeklyPatternDay {
  id: 'friday' | 'sunday';
  day: string;
  arrangement: string;
}

export const KAIKOURA_WEEKLY_PATTERN: readonly KaikouraWeeklyPatternDay[] = [
  {
    id: 'friday',
    day: 'Friday',
    arrangement: 'Christchurch → Kaikoura → Christchurch',
  },
  {
    id: 'sunday',
    day: 'Sunday',
    arrangement: 'Christchurch → Kaikoura → Christchurch',
  },
];
