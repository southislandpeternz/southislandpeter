/**
 * Approved MVP cruise ship day tours for public product display.
 * Port names only — not a catalogue feed, timetable, or price list.
 */
export interface CruiseShipDayTourService {
  id: 'lyttelton-port' | 'akaroa-port';
  title: string;
  href: string;
}

export const LYTTELTON_PORT_CRUISE_DAY_TOUR: CruiseShipDayTourService = {
  id: 'lyttelton-port',
  title: 'Lyttelton Port',
  href: '/cruise-ship-day-tours/lyttelton-port',
};

export const AKAROA_PORT_CRUISE_DAY_TOUR: CruiseShipDayTourService = {
  id: 'akaroa-port',
  title: 'Akaroa Port',
  href: '/cruise-ship-day-tours/akaroa-port',
};

export const CRUISE_SHIP_DAY_TOURS: readonly CruiseShipDayTourService[] = [
  LYTTELTON_PORT_CRUISE_DAY_TOUR,
  AKAROA_PORT_CRUISE_DAY_TOUR,
];
