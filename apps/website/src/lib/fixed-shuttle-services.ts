/**
 * Approved MVP fixed shuttle services for public product display.
 * Names only — not a catalogue feed, timetable, or price list.
 */
export interface FixedShuttleService {
  id: 'mount-cook-shuttle' | 'kaikoura-shuttle' | 'akaroa-shuttle';
  title: string;
  href: string;
}

export const FIXED_SHUTTLE_SERVICES: readonly FixedShuttleService[] = [
  {
    id: 'mount-cook-shuttle',
    title: 'Mount Cook Shuttle',
    href: '/fixed-shuttle-services/mount-cook-shuttle',
  },
  {
    id: 'kaikoura-shuttle',
    title: 'Kaikoura Shuttle',
    href: '/fixed-shuttle-services/kaikoura-shuttle',
  },
  {
    id: 'akaroa-shuttle',
    title: 'Akaroa Shuttle',
    href: '/fixed-shuttle-services/akaroa-shuttle',
  },
];
