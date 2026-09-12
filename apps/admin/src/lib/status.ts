export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type DepartureStatus =
  | 'PLANNED'
  | 'RESOURCE_ASSIGNED'
  | 'READY'
  | 'DEPARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'DEPOSIT_PAID' | 'PAID' | 'REFUNDED';

export type PassengerStatus = 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';

export type ServiceType = 'FIXED_SHUTTLE' | 'CRUISE_DAY_TOUR' | 'AIRPORT_TRANSFER';

export type InventoryStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export type BookingSource =
  | 'WEBSITE'
  | 'GOOGLE'
  | 'XIAOHONGSHU'
  | 'PHONE'
  | 'CRUISE';

const bookingLabels: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

const departureLabels: Record<DepartureStatus, string> = {
  PLANNED: 'Scheduled',
  RESOURCE_ASSIGNED: 'Scheduled',
  READY: 'Boarding / Ready',
  DEPARTED: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const paymentLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  DEPOSIT_PAID: 'Deposit paid',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
};

const passengerLabels: Record<PassengerStatus, string> = {
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  NO_SHOW: 'No show',
  CANCELLED: 'Cancelled',
};

const serviceLabels: Record<ServiceType, string> = {
  FIXED_SHUTTLE: 'Fixed shuttle',
  CRUISE_DAY_TOUR: 'Cruise day tour',
  AIRPORT_TRANSFER: 'Airport transfer',
};

const inventoryLabels: Record<InventoryStatus, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  FULL: 'Full',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function labelBookingStatus(status: BookingStatus): string {
  return bookingLabels[status];
}

export function labelDepartureStatus(status: DepartureStatus): string {
  return departureLabels[status];
}

export function labelPaymentStatus(status: PaymentStatus): string {
  return paymentLabels[status];
}

export function labelPassengerStatus(status: PassengerStatus): string {
  return passengerLabels[status];
}

export function labelServiceType(type: ServiceType): string {
  return serviceLabels[type];
}

export function labelInventoryStatus(status: InventoryStatus): string {
  return inventoryLabels[status];
}

export function toneForDeparture(status: DepartureStatus): 'ok' | 'warn' | 'danger' | 'neutral' | 'info' {
  if (status === 'COMPLETED' || status === 'READY') {
    return 'ok';
  }
  if (status === 'PLANNED') {
    return 'warn';
  }
  if (status === 'CANCELLED') {
    return 'danger';
  }
  if (status === 'DEPARTED' || status === 'RESOURCE_ASSIGNED') {
    return 'info';
  }
  return 'neutral';
}

export function toneForBooking(status: BookingStatus): 'ok' | 'warn' | 'danger' | 'neutral' | 'info' {
  if (status === 'CONFIRMED') {
    return 'ok';
  }
  if (status === 'PENDING') {
    return 'warn';
  }
  return 'danger';
}

export function toneForPayment(status: PaymentStatus): 'ok' | 'warn' | 'danger' | 'neutral' | 'info' {
  if (status === 'PAID') {
    return 'ok';
  }
  if (status === 'PENDING' || status === 'DEPOSIT_PAID') {
    return 'warn';
  }
  return 'danger';
}

export function toneForInventory(status: InventoryStatus): 'ok' | 'warn' | 'danger' | 'neutral' | 'info' {
  if (status === 'OPEN' || status === 'COMPLETED') {
    return 'ok';
  }
  if (status === 'FULL' || status === 'DRAFT') {
    return 'warn';
  }
  if (status === 'CANCELLED') {
    return 'danger';
  }
  return 'neutral';
}

export function toneForPassenger(status: PassengerStatus): 'ok' | 'warn' | 'danger' | 'neutral' | 'info' {
  if (status === 'CHECKED_IN' || status === 'CONFIRMED') {
    return 'ok';
  }
  if (status === 'NO_SHOW' || status === 'CANCELLED') {
    return 'danger';
  }
  return 'neutral';
}

export type BoardLane = 'SCHEDULED' | 'BOARDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const BOARD_LANES: Array<{ id: BoardLane; label: string }> = [
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'BOARDING', label: 'Ready / Boarding' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export function boardLane(status: DepartureStatus): BoardLane {
  if (status === 'READY') {
    return 'BOARDING';
  }
  if (status === 'DEPARTED') {
    return 'IN_PROGRESS';
  }
  if (status === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }
  return 'SCHEDULED';
}
