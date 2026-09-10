import type {
  BookingSource,
  BookingStatus,
  DepartureStatus,
  PassengerStatus,
  PaymentStatus,
  ServiceType,
} from './status';

export const DEMO_TODAY = '2026-09-10';

export interface MockVehicle {
  id: string;
  name: string;
  plate: string;
  seats: number;
  notes: string;
}

export interface MockDriver {
  id: string;
  name: string;
  phone: string;
  licence: string;
  notes: string;
}

export interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  source: BookingSource;
}

export type DepartureDirection = 'OUTBOUND' | 'RETURN' | 'DAY_RETURN' | 'ON_DEMAND';

export interface MockBooking {
  id: string;
  bookingNo: string;
  bookedOn: string;
  customerId: string;
  product: string;
  serviceType: ServiceType;
  departureId: string;
  pax: number;
  amountNzd: number;
  status: BookingStatus;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  passengerStatus: PassengerStatus;
  pickup: string;
}

export interface MockPayment {
  id: string;
  bookingNo: string;
  amountNzd: number;
  status: PaymentStatus;
  method: 'STRIPE_CARD' | 'BANK_TRANSFER';
  paidOn: string;
}

export interface MockDeparture {
  id: string;
  time: string;
  date: string;
  name: string;
  route: string;
  pickup: string;
  destination: string;
  serviceType: ServiceType;
  direction: DepartureDirection;
  status: DepartureStatus;
  driverId: string;
  vehicleId: string;
  capacity: number;
  notes: string;
}

export const vehicles: MockVehicle[] = [
  {
    id: 'veh-sprinter',
    name: 'Mercedes-Benz Sprinter',
    plate: 'KMA123',
    seats: 8,
    notes: '8 seats. Assigned per departure, not bound to a product.',
  },
  {
    id: 'veh-hiace',
    name: 'Toyota Hiace',
    plate: 'KMA456',
    seats: 8,
    notes: '8 seats. Assigned per departure, not bound to a product.',
  },
  {
    id: 'veh-airport',
    name: 'Airport transfer van',
    plate: 'KMA789',
    seats: 4,
    notes: '4 seats. Assigned per departure, not bound to a product.',
  },
];

export const drivers: MockDriver[] = [
  {
    id: 'drv-peter',
    name: 'Peter',
    phone: '+64 21 000 1001',
    licence: 'Class 2',
    notes: 'Assigned per departure, not bound to a product.',
  },
  {
    id: 'drv-mei',
    name: 'Mei Chen',
    phone: '+64 21 000 1002',
    licence: 'Class 2',
    notes: 'Assigned per departure, not bound to a product.',
  },
  {
    id: 'drv-james',
    name: 'James Walker',
    phone: '+64 21 000 1003',
    licence: 'Class 2',
    notes: 'Assigned per departure, not bound to a product.',
  },
];

export const customers: MockCustomer[] = [
  {
    id: 'cus-li',
    name: 'Li Wei',
    phone: '+64 21 555 0102',
    email: 'li.wei@example.com',
    country: 'China',
    source: 'XIAOHONGSHU',
  },
  {
    id: 'cus-hana',
    name: 'Hana Suzuki',
    phone: '+81 90 0000 1111',
    email: 'hana.suzuki@example.com',
    country: 'Japan',
    source: 'GOOGLE',
  },
  {
    id: 'cus-john',
    name: 'John Smith',
    phone: '+64 21 555 0101',
    email: 'john.smith@example.com',
    country: 'Australia',
    source: 'WEBSITE',
  },
  {
    id: 'cus-emma',
    name: 'Emma Clarke',
    phone: '+64 27 555 0104',
    email: 'emma.clarke@example.com',
    country: 'New Zealand',
    source: 'PHONE',
  },
  {
    id: 'cus-sarah',
    name: 'Sarah Bell',
    phone: '+64 21 555 0201',
    email: 'sarah.bell@example.com',
    country: 'United Kingdom',
    source: 'WEBSITE',
  },
  {
    id: 'cus-tom',
    name: 'Tom Harris',
    phone: '+64 21 555 0202',
    email: 'tom.harris@example.com',
    country: 'Australia',
    source: 'GOOGLE',
  },
  {
    id: 'cus-olivia',
    name: 'Olivia Reed',
    phone: '+64 21 555 0203',
    email: 'olivia.reed@example.com',
    country: 'United States',
    source: 'WEBSITE',
  },
  {
    id: 'cus-chen',
    name: 'Chen Hao',
    phone: '+64 21 555 0204',
    email: 'chen.hao@example.com',
    country: 'China',
    source: 'XIAOHONGSHU',
  },
  {
    id: 'cus-anna',
    name: 'Anna Brooks',
    phone: '+1 415 555 0108',
    email: 'anna.brooks@example.com',
    country: 'United States',
    source: 'CRUISE',
  },
  {
    id: 'cus-michael',
    name: 'Michael Cole',
    phone: '+1 206 555 0110',
    email: 'michael.cole@example.com',
    country: 'United States',
    source: 'CRUISE',
  },
  {
    id: 'cus-david',
    name: 'David Ng',
    phone: '+64 21 555 0301',
    email: 'david.ng@example.com',
    country: 'Singapore',
    source: 'WEBSITE',
  },
  {
    id: 'cus-grace',
    name: 'Grace Lim',
    phone: '+64 21 555 0401',
    email: 'grace.lim@example.com',
    country: 'Malaysia',
    source: 'WEBSITE',
  },
  {
    id: 'cus-wei',
    name: 'Wei Fang',
    phone: '+64 21 555 0402',
    email: 'wei.fang@example.com',
    country: 'China',
    source: 'XIAOHONGSHU',
  },
  {
    id: 'cus-lisa',
    name: 'Lisa Park',
    phone: '+82 10 5550 2211',
    email: 'lisa.park@example.com',
    country: 'South Korea',
    source: 'CRUISE',
  },
  {
    id: 'cus-ben',
    name: 'Ben Shaw',
    phone: '+44 7700 900123',
    email: 'ben.shaw@example.com',
    country: 'United Kingdom',
    source: 'CRUISE',
  },
  {
    id: 'cus-noah',
    name: 'Noah Patel',
    phone: '+64 21 555 0501',
    email: 'noah.patel@example.com',
    country: 'New Zealand',
    source: 'PHONE',
  },
  {
    id: 'cus-amy',
    name: 'Amy Cole',
    phone: '+64 21 555 0502',
    email: 'amy.cole@example.com',
    country: 'Australia',
    source: 'GOOGLE',
  },
];

const CHC_PICKUP = 'Christchurch Arts Centre / hotel pickup';
const MT_COOK_PICKUP = 'The Hermitage Hotel / YHA Aoraki Mt Cook';
const LYTTELTON_PICKUP = 'Lyttelton Port cruise berth';
const AKAROA_WHARF = 'Akaroa Wharf';
const AIRPORT_PICKUP = 'Christchurch Airport arrivals · NZ512';

export const departures: MockDeparture[] = [
  {
    id: 'dep-mtcook-tue-out',
    time: '07:30',
    date: '2026-09-08',
    name: 'Mount Cook Shuttle · Outbound',
    route: 'Christchurch → Aoraki / Mt Cook',
    pickup: CHC_PICKUP,
    destination: 'Aoraki / Mt Cook',
    serviceType: 'SHUTTLE',
    direction: 'OUTBOUND',
    status: 'COMPLETED',
    driverId: 'drv-peter',
    vehicleId: 'veh-sprinter',
    capacity: 8,
    notes: 'Fixed weekly pattern: Tuesday outbound Christchurch → Mt Cook.',
  },
  {
    id: 'dep-mtcook-wed-out',
    time: '07:30',
    date: '2026-09-09',
    name: 'Mount Cook Shuttle · Outbound',
    route: 'Christchurch → Aoraki / Mt Cook',
    pickup: CHC_PICKUP,
    destination: 'Aoraki / Mt Cook',
    serviceType: 'SHUTTLE',
    direction: 'OUTBOUND',
    status: 'COMPLETED',
    driverId: 'drv-peter',
    vehicleId: 'veh-sprinter',
    capacity: 8,
    notes: 'Fixed weekly pattern: Wednesday outbound Christchurch → Mt Cook, overnight in Lake Tekapo.',
  },
  {
    id: 'dep-mtcook-thu-return',
    time: '09:00',
    date: DEMO_TODAY,
    name: 'Mount Cook Shuttle · Return',
    route: 'Aoraki / Mt Cook → Christchurch',
    pickup: MT_COOK_PICKUP,
    destination: 'Christchurch',
    serviceType: 'SHUTTLE',
    direction: 'RETURN',
    status: 'READY',
    driverId: 'drv-peter',
    vehicleId: 'veh-sprinter',
    capacity: 8,
    notes: 'Fixed weekly pattern: Thursday return Mt Cook → Christchurch.',
  },
  {
    id: 'dep-lyttelton-cruise',
    time: '11:30',
    date: DEMO_TODAY,
    name: 'Lyttelton Cruise Day Tour',
    route: 'Lyttelton Port shore excursion',
    pickup: LYTTELTON_PICKUP,
    destination: 'Christchurch city / return to ship',
    serviceType: 'CRUISE_DAY_TOUR',
    direction: 'ON_DEMAND',
    status: 'RESOURCE_ASSIGNED',
    driverId: 'drv-james',
    vehicleId: 'veh-hiace',
    capacity: 8,
    notes: 'Ad-hoc cruise day tour. Not a fixed weekly shuttle.',
  },
  {
    id: 'dep-airport-nz512',
    time: '16:00',
    date: DEMO_TODAY,
    name: 'Airport Transfer NZ512',
    route: 'Christchurch Airport → city hotels',
    pickup: AIRPORT_PICKUP,
    destination: 'Novotel Christchurch Cathedral Square',
    serviceType: 'AIRPORT_TRANSFER',
    direction: 'ON_DEMAND',
    status: 'PLANNED',
    driverId: 'drv-mei',
    vehicleId: 'veh-airport',
    capacity: 4,
    notes: 'On-demand airport transfer.',
  },
  {
    id: 'dep-kaikoura-fri',
    time: '08:00',
    date: '2026-09-11',
    name: 'Kaikoura Shuttle',
    route: 'Christchurch → Kaikoura → Christchurch',
    pickup: CHC_PICKUP,
    destination: 'Christchurch (same-day return)',
    serviceType: 'SHUTTLE',
    direction: 'DAY_RETURN',
    status: 'PLANNED',
    driverId: 'drv-peter',
    vehicleId: 'veh-sprinter',
    capacity: 8,
    notes: 'Weekly Friday day-return shuttle.',
  },
  {
    id: 'dep-akaroa-sat',
    time: '08:00',
    date: '2026-09-12',
    name: 'Akaroa Shuttle',
    route: 'Christchurch → Akaroa → Christchurch',
    pickup: CHC_PICKUP,
    destination: 'Christchurch (same-day return)',
    serviceType: 'SHUTTLE',
    direction: 'DAY_RETURN',
    status: 'PLANNED',
    driverId: 'drv-peter',
    vehicleId: 'veh-sprinter',
    capacity: 8,
    notes: 'Weekly Saturday day-return shuttle / day tour.',
  },
  {
    id: 'dep-akaroa-cruise',
    time: '09:30',
    date: '2026-09-12',
    name: 'Akaroa Cruise Day Tour',
    route: 'Akaroa Port shore excursion',
    pickup: AKAROA_WHARF,
    destination: 'Akaroa township / return to ship',
    serviceType: 'CRUISE_DAY_TOUR',
    direction: 'ON_DEMAND',
    status: 'PLANNED',
    driverId: 'drv-james',
    vehicleId: 'veh-hiace',
    capacity: 8,
    notes: 'Ad-hoc cruise day tour when a ship is in Akaroa.',
  },
  {
    id: 'dep-kaikoura-sun',
    time: '08:00',
    date: '2026-09-13',
    name: 'Kaikoura Shuttle',
    route: 'Christchurch → Kaikoura → Christchurch',
    pickup: CHC_PICKUP,
    destination: 'Christchurch (same-day return)',
    serviceType: 'SHUTTLE',
    direction: 'DAY_RETURN',
    status: 'PLANNED',
    driverId: 'drv-mei',
    vehicleId: 'veh-sprinter',
    capacity: 8,
    notes: 'Weekly Sunday day-return shuttle.',
  },
];

export const bookings: MockBooking[] = [
  {
    id: 'bk-mc-li-out',
    bookingNo: 'BO-MC-2401',
    bookedOn: '2026-08-28',
    customerId: 'cus-li',
    product: 'Mount Cook Shuttle · Outbound',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-tue-out',
    pax: 2,
    amountNzd: 390,
    status: 'CONFIRMED',
    source: 'XIAOHONGSHU',
    paymentStatus: 'PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-mc-hana-out',
    bookingNo: 'BO-MC-2402',
    bookedOn: '2026-08-30',
    customerId: 'cus-hana',
    product: 'Mount Cook Shuttle · Outbound',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-tue-out',
    pax: 1,
    amountNzd: 195,
    status: 'CONFIRMED',
    source: 'GOOGLE',
    paymentStatus: 'PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-mc-john-out',
    bookingNo: 'BO-MC-2403',
    bookedOn: '2026-09-01',
    customerId: 'cus-john',
    product: 'Mount Cook Shuttle · Outbound',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-wed-out',
    pax: 2,
    amountNzd: 390,
    status: 'CONFIRMED',
    source: 'WEBSITE',
    paymentStatus: 'DEPOSIT_PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-mc-emma-out',
    bookingNo: 'BO-MC-2404',
    bookedOn: '2026-09-03',
    customerId: 'cus-emma',
    product: 'Mount Cook Shuttle · Outbound',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-wed-out',
    pax: 1,
    amountNzd: 195,
    status: 'CONFIRMED',
    source: 'PHONE',
    paymentStatus: 'PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-mc-li-ret',
    bookingNo: 'BO-MC-2411',
    bookedOn: '2026-08-28',
    customerId: 'cus-li',
    product: 'Mount Cook Shuttle · Return',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-thu-return',
    pax: 2,
    amountNzd: 390,
    status: 'CONFIRMED',
    source: 'XIAOHONGSHU',
    paymentStatus: 'PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: MT_COOK_PICKUP,
  },
  {
    id: 'bk-mc-hana-ret',
    bookingNo: 'BO-MC-2412',
    bookedOn: '2026-08-30',
    customerId: 'cus-hana',
    product: 'Mount Cook Shuttle · Return',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-thu-return',
    pax: 1,
    amountNzd: 195,
    status: 'CONFIRMED',
    source: 'GOOGLE',
    paymentStatus: 'PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: MT_COOK_PICKUP,
  },
  {
    id: 'bk-mc-john-ret',
    bookingNo: 'BO-MC-2413',
    bookedOn: '2026-09-01',
    customerId: 'cus-john',
    product: 'Mount Cook Shuttle · Return',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-thu-return',
    pax: 2,
    amountNzd: 390,
    status: 'CONFIRMED',
    source: 'WEBSITE',
    paymentStatus: 'DEPOSIT_PAID',
    passengerStatus: 'CONFIRMED',
    pickup: MT_COOK_PICKUP,
  },
  {
    id: 'bk-mc-emma-ret',
    bookingNo: 'BO-MC-2414',
    bookedOn: '2026-09-03',
    customerId: 'cus-emma',
    product: 'Mount Cook Shuttle · Return',
    serviceType: 'SHUTTLE',
    departureId: 'dep-mtcook-thu-return',
    pax: 1,
    amountNzd: 195,
    status: 'CONFIRMED',
    source: 'PHONE',
    paymentStatus: 'PAID',
    passengerStatus: 'CHECKED_IN',
    pickup: MT_COOK_PICKUP,
  },
  {
    id: 'bk-cr-anna',
    bookingNo: 'BO-CR-2401',
    bookedOn: '2026-09-08',
    customerId: 'cus-anna',
    product: 'Lyttelton Cruise Day Tour',
    serviceType: 'CRUISE_DAY_TOUR',
    departureId: 'dep-lyttelton-cruise',
    pax: 3,
    amountNzd: 540,
    status: 'CONFIRMED',
    source: 'CRUISE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: LYTTELTON_PICKUP,
  },
  {
    id: 'bk-cr-michael',
    bookingNo: 'BO-CR-2402',
    bookedOn: '2026-09-08',
    customerId: 'cus-michael',
    product: 'Lyttelton Cruise Day Tour',
    serviceType: 'CRUISE_DAY_TOUR',
    departureId: 'dep-lyttelton-cruise',
    pax: 3,
    amountNzd: 540,
    status: 'CONFIRMED',
    source: 'CRUISE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: LYTTELTON_PICKUP,
  },
  {
    id: 'bk-at-david',
    bookingNo: 'BO-AT-2401',
    bookedOn: '2026-09-09',
    customerId: 'cus-david',
    product: 'Airport Transfer NZ512',
    serviceType: 'AIRPORT_TRANSFER',
    departureId: 'dep-airport-nz512',
    pax: 2,
    amountNzd: 120,
    status: 'CONFIRMED',
    source: 'WEBSITE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: AIRPORT_PICKUP,
  },
  {
    id: 'bk-kk-sarah',
    bookingNo: 'BO-KK-2401',
    bookedOn: '2026-09-04',
    customerId: 'cus-sarah',
    product: 'Kaikoura Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-kaikoura-fri',
    pax: 2,
    amountNzd: 330,
    status: 'CONFIRMED',
    source: 'WEBSITE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-kk-tom',
    bookingNo: 'BO-KK-2402',
    bookedOn: '2026-09-05',
    customerId: 'cus-tom',
    product: 'Kaikoura Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-kaikoura-fri',
    pax: 2,
    amountNzd: 330,
    status: 'CONFIRMED',
    source: 'GOOGLE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-kk-olivia',
    bookingNo: 'BO-KK-2403',
    bookedOn: '2026-09-06',
    customerId: 'cus-olivia',
    product: 'Kaikoura Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-kaikoura-fri',
    pax: 2,
    amountNzd: 330,
    status: 'CONFIRMED',
    source: 'WEBSITE',
    paymentStatus: 'DEPOSIT_PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-kk-chen',
    bookingNo: 'BO-KK-2404',
    bookedOn: '2026-09-08',
    customerId: 'cus-chen',
    product: 'Kaikoura Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-kaikoura-fri',
    pax: 2,
    amountNzd: 330,
    status: 'PENDING',
    source: 'XIAOHONGSHU',
    paymentStatus: 'PENDING',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-ak-grace',
    bookingNo: 'BO-AK-2401',
    bookedOn: '2026-09-05',
    customerId: 'cus-grace',
    product: 'Akaroa Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-akaroa-sat',
    pax: 3,
    amountNzd: 435,
    status: 'CONFIRMED',
    source: 'WEBSITE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-ak-wei',
    bookingNo: 'BO-AK-2402',
    bookedOn: '2026-09-06',
    customerId: 'cus-wei',
    product: 'Akaroa Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-akaroa-sat',
    pax: 2,
    amountNzd: 290,
    status: 'CONFIRMED',
    source: 'XIAOHONGSHU',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-ak-cancel',
    bookingNo: 'BO-AK-2403',
    bookedOn: '2026-09-06',
    customerId: 'cus-wei',
    product: 'Akaroa Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-akaroa-sat',
    pax: 2,
    amountNzd: 290,
    status: 'CANCELLED',
    source: 'XIAOHONGSHU',
    paymentStatus: 'REFUNDED',
    passengerStatus: 'CANCELLED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-ac-lisa',
    bookingNo: 'BO-AC-2401',
    bookedOn: '2026-09-07',
    customerId: 'cus-lisa',
    product: 'Akaroa Cruise Day Tour',
    serviceType: 'CRUISE_DAY_TOUR',
    departureId: 'dep-akaroa-cruise',
    pax: 4,
    amountNzd: 720,
    status: 'CONFIRMED',
    source: 'CRUISE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: AKAROA_WHARF,
  },
  {
    id: 'bk-ac-ben',
    bookingNo: 'BO-AC-2402',
    bookedOn: '2026-09-07',
    customerId: 'cus-ben',
    product: 'Akaroa Cruise Day Tour',
    serviceType: 'CRUISE_DAY_TOUR',
    departureId: 'dep-akaroa-cruise',
    pax: 2,
    amountNzd: 360,
    status: 'CONFIRMED',
    source: 'CRUISE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: AKAROA_WHARF,
  },
  {
    id: 'bk-ks-noah',
    bookingNo: 'BO-KS-2401',
    bookedOn: '2026-09-08',
    customerId: 'cus-noah',
    product: 'Kaikoura Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-kaikoura-sun',
    pax: 2,
    amountNzd: 330,
    status: 'CONFIRMED',
    source: 'PHONE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
  {
    id: 'bk-ks-amy',
    bookingNo: 'BO-KS-2402',
    bookedOn: '2026-09-09',
    customerId: 'cus-amy',
    product: 'Kaikoura Shuttle',
    serviceType: 'SHUTTLE',
    departureId: 'dep-kaikoura-sun',
    pax: 2,
    amountNzd: 330,
    status: 'CONFIRMED',
    source: 'GOOGLE',
    paymentStatus: 'PAID',
    passengerStatus: 'CONFIRMED',
    pickup: CHC_PICKUP,
  },
];

function nextDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + 1);
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const payments: MockPayment[] = bookings.map((booking, index) => ({
  id: `pay-${index + 1}`,
  bookingNo: booking.bookingNo,
  amountNzd:
    booking.paymentStatus === 'DEPOSIT_PAID' ? Math.round(booking.amountNzd * 0.3) : booking.amountNzd,
  status: booking.paymentStatus,
  method: booking.source === 'CRUISE' ? 'BANK_TRANSFER' : 'STRIPE_CARD',
  paidOn: booking.paymentStatus === 'PENDING' ? '' : nextDay(booking.bookedOn),
}));

export interface MockManifestRow {
  bookingNo: string;
  customerId: string;
  pax: number;
  pickup: string;
  paymentStatus: PaymentStatus;
  passengerStatus: PassengerStatus;
}

export function formatNzd(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function findVehicle(id: string): MockVehicle | undefined {
  return vehicles.find((item) => item.id === id);
}

export function findDriver(id: string): MockDriver | undefined {
  return drivers.find((item) => item.id === id);
}

export function findCustomer(id: string): MockCustomer | undefined {
  return customers.find((item) => item.id === id);
}

export function findDeparture(id: string): MockDeparture | undefined {
  return departures.find((item) => item.id === id);
}

export function findBooking(bookingNo: string): MockBooking | undefined {
  return bookings.find((item) => item.bookingNo === bookingNo);
}

export function findPayment(bookingNo: string): MockPayment | undefined {
  return payments.find((item) => item.bookingNo === bookingNo);
}

export function activeBookingsForDeparture(departureId: string): MockBooking[] {
  return bookings.filter((item) => item.departureId === departureId && item.status === 'CONFIRMED');
}

export function manifestFor(departureId: string): MockManifestRow[] {
  return activeBookingsForDeparture(departureId).map((item) => ({
    bookingNo: item.bookingNo,
    customerId: item.customerId,
    pax: item.pax,
    pickup: item.pickup,
    paymentStatus: item.paymentStatus,
    passengerStatus: item.passengerStatus,
  }));
}

export function bookedSeats(departureId: string): number {
  return manifestFor(departureId).reduce((sum, row) => sum + row.pax, 0);
}

export function availableSeats(departure: MockDeparture): number {
  return departure.capacity - bookedSeats(departure.id);
}

export function todaysDepartures(): MockDeparture[] {
  return departures.filter((item) => item.date === DEMO_TODAY);
}

export function todaysBookings(): MockBooking[] {
  const ids = new Set(todaysDepartures().map((item) => item.id));
  return bookings.filter((item) => ids.has(item.departureId));
}

export function passengersToday(): number {
  return todaysDepartures().reduce((sum, item) => sum + bookedSeats(item.id), 0);
}

export function todaysRevenueNzd(): number {
  const bookingNos = new Set(todaysBookings().map((item) => item.bookingNo));
  return payments
    .filter((item) => bookingNos.has(item.bookingNo) && (item.status === 'PAID' || item.status === 'DEPOSIT_PAID'))
    .reduce((sum, item) => sum + item.amountNzd, 0);
}

export function customerBookingCount(customerId: string): number {
  return bookings.filter((item) => item.customerId === customerId).length;
}

export function customerSpendNzd(customerId: string): number {
  const nos = new Set(bookings.filter((item) => item.customerId === customerId).map((item) => item.bookingNo));
  return payments
    .filter((item) => nos.has(item.bookingNo) && item.status === 'PAID')
    .reduce((sum, item) => sum + item.amountNzd, 0);
}

export function assignmentsToday(kind: 'vehicle' | 'driver', id: string): MockDeparture[] {
  return todaysDepartures().filter((item) => (kind === 'vehicle' ? item.vehicleId === id : item.driverId === id));
}

export function weekDates(): string[] {
  return ['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14'];
}

export function formatDayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function revenueBars(): Array<{ day: string; value: number }> {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = ['2026-09-07', ...weekDates().slice(0, 6)];
  const amounts = dates.map((date) => {
    const depIds = new Set(departures.filter((item) => item.date === date).map((item) => item.id));
    const nos = new Set(
      bookings.filter((item) => depIds.has(item.departureId) && item.status !== 'CANCELLED').map((item) => item.bookingNo),
    );
    return payments
      .filter((item) => nos.has(item.bookingNo) && (item.status === 'PAID' || item.status === 'DEPOSIT_PAID'))
      .reduce((sum, item) => sum + item.amountNzd, 0);
  });
  const max = Math.max(...amounts, 1);
  return labels.map((day, index) => ({
    day,
    value: Math.max(8, Math.round(((amounts[index] ?? 0) / max) * 100)),
  }));
}

export function operationTasks(): Array<{ id: string; label: string; href: string }> {
  return [
    {
      id: 'task-1',
      label: `Confirm remaining balance for BO-MC-2413 · ${bookedSeats('dep-mtcook-thu-return')} passengers on Mount Cook return`,
      href: '/departures/dep-mtcook-thu-return',
    },
    {
      id: 'task-2',
      label: 'Follow up pending booking BO-KK-2404 Chen Hao · Friday Kaikoura Shuttle',
      href: '/bookings',
    },
    {
      id: 'task-3',
      label: 'Assign final briefing for Lyttelton Cruise Day Tour · 6 passengers',
      href: '/departures/dep-lyttelton-cruise',
    },
    {
      id: 'task-4',
      label: 'Airport Transfer NZ512 at 16:00 · 2 passengers · Novotel',
      href: '/departures/dep-airport-nz512',
    },
  ];
}

export function operationNotifications(): string[] {
  const mtCook = bookedSeats('dep-mtcook-thu-return');
  return [
    `Today’s Mount Cook Shuttle · Return is READY · ${mtCook}/8 passengers`,
    'Payment deposit only · BO-MC-2413 John Smith',
    'Pending booking · BO-KK-2404 Friday Kaikoura Shuttle',
    `Lyttelton Cruise Day Tour · ${bookedSeats('dep-lyttelton-cruise')}/8 · resource assigned`,
  ];
}

export function labelDirection(direction: DepartureDirection): string {
  if (direction === 'OUTBOUND') {
    return 'Outbound';
  }
  if (direction === 'RETURN') {
    return 'Return';
  }
  if (direction === 'DAY_RETURN') {
    return 'Day return';
  }
  return 'On demand';
}
