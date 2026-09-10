/**
 * Confirmed SP2036 MVP Mount Cook Shuttle weekly pattern.
 * Product-display copy only — not a timetable, price list, or availability feed.
 */
export interface MountCookWeeklyPatternDay {
  id: 'tuesday' | 'wednesday' | 'thursday';
  day: string;
  arrangement: string;
}

export const MOUNT_COOK_WEEKLY_PATTERN: readonly MountCookWeeklyPatternDay[] = [
  {
    id: 'tuesday',
    day: 'Tuesday',
    arrangement: 'Christchurch → Mount Cook',
  },
  {
    id: 'wednesday',
    day: 'Wednesday',
    arrangement: 'Mount Cook area / Lake Tekapo overnight arrangement',
  },
  {
    id: 'thursday',
    day: 'Thursday',
    arrangement: 'return to Christchurch',
  },
];
