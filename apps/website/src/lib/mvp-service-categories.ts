/**
 * Public homepage categories for the approved SP2036 MVP service lines.
 * This is product-display copy only. It is not a catalogue, price list, or
 * availability feed — those modules are not in this drop.
 */
export interface MvpServiceCategory {
  id:
    'fixed-shuttle-services' | 'cruise-ship-day-tours' | 'christchurch-airport-transfers';
  title: string;
  summary: string;
  href: string;
}

export const MVP_SERVICE_CATEGORIES: readonly MvpServiceCategory[] = [
  {
    id: 'fixed-shuttle-services',
    title: 'Fixed Shuttle Services',
    href: '/fixed-shuttle-services',
    summary:
      'Scheduled South Island shuttle services for day-return travel between approved routes.',
  },
  {
    id: 'cruise-ship-day-tours',
    title: 'Cruise Ship Day Tours',
    href: '/cruise-ship-day-tours',
    summary:
      'Day tours for cruise ship passengers when a ship is in port on the South Island.',
  },
  {
    id: 'christchurch-airport-transfers',
    title: 'Christchurch Airport Transfers',
    href: '/christchurch-airport-transfers',
    summary: 'Point-to-point transfers to and from Christchurch Airport.',
  },
];
