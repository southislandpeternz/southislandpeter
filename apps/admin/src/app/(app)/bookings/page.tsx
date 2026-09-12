'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import {
  findCustomer,
  findDeparture,
  findDriver,
  findPayment,
  findVehicle,
  formatNzd,
  isOutstandingPayment,
  labelDirection,
  listBookings,
  matchesSearch,
  vehicleType,
} from '../../../lib/mock-data';
import {
  labelBookingStatus,
  labelDepartureStatus,
  labelPassengerStatus,
  labelPaymentStatus,
  labelServiceType,
  toneForBooking,
  toneForDeparture,
  toneForPassenger,
  toneForPayment,
  type BookingStatus,
  type PaymentStatus,
} from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

const STATUS_FILTERS: Array<{ id: 'ALL' | BookingStatus; label: string }> = [
  { id: 'ALL', label: 'All bookings' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_FILTERS: Array<{ id: 'ALL' | 'OUTSTANDING' | PaymentStatus; label: string }> = [
  { id: 'ALL', label: 'All payments' },
  { id: 'OUTSTANDING', label: 'Pending payment' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'DEPOSIT_PAID', label: 'Deposit paid' },
  { id: 'PAID', label: 'Paid' },
  { id: 'REFUNDED', label: 'Refunded' },
];

type PaymentFilter = (typeof PAYMENT_FILTERS)[number]['id'];

function parseStatusFilter(raw: string | null): 'ALL' | BookingStatus {
  const value = raw?.toUpperCase();
  if (value === 'PENDING' || value === 'CONFIRMED' || value === 'CANCELLED') {
    return value;
  }
  return 'ALL';
}

function parsePaymentFilter(raw: string | null): PaymentFilter {
  const value = raw?.toUpperCase().replace('-', '_');
  if (value === 'OUTSTANDING' || value === 'PENDING' || value === 'DEPOSIT_PAID' || value === 'PAID' || value === 'REFUNDED') {
    return value;
  }
  return 'ALL';
}

function BookingsBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedNo = searchParams.get('booking');
  const [query, setQuery] = useState('');
  const statusFilter = parseStatusFilter(searchParams.get('status'));
  const paymentFilter = parsePaymentFilter(searchParams.get('payment'));
  const rows = listBookings();
  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false;
        }
        if (paymentFilter === 'OUTSTANDING' && !isOutstandingPayment(item.paymentStatus)) {
          return false;
        }
        if (
          paymentFilter !== 'ALL' &&
          paymentFilter !== 'OUTSTANDING' &&
          item.paymentStatus !== paymentFilter
        ) {
          return false;
        }
        const customer = findCustomer(item.customerId);
        const departure = findDeparture(item.departureId);
        return matchesSearch(query, [
          item.bookingNo,
          item.product,
          item.status,
          item.paymentStatus,
          customer?.name,
          customer?.email,
          departure?.name,
          departure?.route,
          departure?.date,
          labelServiceType(item.serviceType),
        ]);
      }),
    [paymentFilter, query, rows, statusFilter],
  );
  const selected =
    filtered.find((item) => item.bookingNo === selectedNo) ?? rows.find((item) => item.bookingNo === selectedNo);
  const selectedCustomer = selected ? findCustomer(selected.customerId) : undefined;
  const selectedDeparture = selected ? findDeparture(selected.departureId) : undefined;
  const selectedPayment = selected ? findPayment(selected.bookingNo) : undefined;
  const selectedVehicle = selectedDeparture ? findVehicle(selectedDeparture.vehicleId) : undefined;
  const selectedDriver = selectedDeparture ? findDriver(selectedDeparture.driverId) : undefined;

  function replaceQuery(patch: Record<string, string | null>): void {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const queryString = params.toString();
    router.replace(queryString ? `/bookings?${queryString}` : '/bookings', { scroll: false });
  }

  function openBooking(bookingNo: string): void {
    replaceQuery({ booking: bookingNo });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p>
            Guest purchase records. Booking date, departure date, and payment date are separate. Each confirmed
            booking sits on a Departure from the operations board.
          </p>
        </div>
        <input
          className="page-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search booking, customer, departure…"
        />
      </div>
      <div className="filters">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={statusFilter === item.id ? 'chip active' : 'chip'}
            onClick={() => replaceQuery({ status: item.id === 'ALL' ? null : item.id.toLowerCase() })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="filters">
        {PAYMENT_FILTERS.map((item) => (
          <button
            key={`pay-${item.id}`}
            type="button"
            className={paymentFilter === item.id ? 'chip active' : 'chip'}
            onClick={() => replaceQuery({ payment: item.id === 'ALL' ? null : item.id.toLowerCase() })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th>Service / Departure</th>
              <th>Booking date</th>
              <th>Passengers</th>
              <th>Amount</th>
              <th>Payment status</th>
              <th>Booking status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const customer = findCustomer(item.customerId);
              const departure = findDeparture(item.departureId);
              return (
                <tr
                  key={item.id}
                  className={item.bookingNo === selectedNo ? 'selectable selected' : 'selectable'}
                  onClick={() => openBooking(item.bookingNo)}
                >
                  <td>
                    <strong>{item.bookingNo}</strong>
                  </td>
                  <td>
                    <Link href={`/customers?customer=${item.customerId}`} onClick={(event) => event.stopPropagation()}>
                      {customer?.name}
                    </Link>
                    <div className="muted">{customer?.email}</div>
                  </td>
                  <td>
                    {item.product}
                    <div className="muted">{labelServiceType(item.serviceType)}</div>
                    <Link href={`/departures/${item.departureId}`} onClick={(event) => event.stopPropagation()}>
                      {departure?.name} · {departure?.date} {departure?.time}
                    </Link>
                  </td>
                  <td>{item.bookedOn}</td>
                  <td>{item.pax}</td>
                  <td>{formatNzd(item.amountNzd)}</td>
                  <td>
                    <StatusBadge tone={toneForPayment(item.paymentStatus)}>
                      {labelPaymentStatus(item.paymentStatus)}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={toneForBooking(item.status)}>{labelBookingStatus(item.status)}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="card-pad muted">No bookings match this search.</p> : null}
      </section>

      {selected ? (
        <section className="card card-pad detail-panel">
          <div className="section-title">
            <h2>Booking detail</h2>
            <span className="muted">{selected.bookingNo}</span>
          </div>
          <dl className="info-grid">
            <div>
              <dt>Booking number</dt>
              <dd>{selected.bookingNo}</dd>
            </div>
            <div>
              <dt>Booking date</dt>
              <dd>{selected.bookedOn}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>
                <Link href={`/customers?customer=${selected.customerId}`}>{selectedCustomer?.name}</Link>
              </dd>
            </div>
            <div>
              <dt>Contact information</dt>
              <dd>
                {selectedCustomer?.email}
                <div className="muted">{selectedCustomer?.phone}</div>
              </dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{selectedCustomer?.country ?? '—'}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>
                {selected.product}
                <div className="muted">{labelServiceType(selected.serviceType)}</div>
              </dd>
            </div>
            <div>
              <dt>Related Departure</dt>
              <dd>
                <Link href={`/departures/${selected.departureId}`}>
                  {selectedDeparture?.name} · {selectedDeparture?.date} {selectedDeparture?.time}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Direction</dt>
              <dd>{selectedDeparture ? labelDirection(selectedDeparture.direction) : '—'}</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>{selectedDeparture?.route ?? '—'}</dd>
            </div>
            <div>
              <dt>Departure status</dt>
              <dd>
                {selectedDeparture ? (
                  <StatusBadge tone={toneForDeparture(selectedDeparture.status)}>
                    {labelDepartureStatus(selectedDeparture.status)}
                  </StatusBadge>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>
                {selectedVehicle ? (
                  <>
                    {selectedVehicle.name}
                    <div className="muted">
                      {vehicleType(selectedVehicle)} · {selectedVehicle.seats} seats
                    </div>
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Driver</dt>
              <dd>
                {selectedDriver ? (
                  <>
                    {selectedDriver.name}
                    <div className="muted">{selectedDriver.phone}</div>
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Passenger count</dt>
              <dd>{selected.pax}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{selected.pickup}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatNzd(selected.amountNzd)}</dd>
            </div>
            <div>
              <dt>Booking status</dt>
              <dd>
                <StatusBadge tone={toneForBooking(selected.status)}>{labelBookingStatus(selected.status)}</StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>
                <StatusBadge tone={toneForPayment(selected.paymentStatus)}>
                  {labelPaymentStatus(selected.paymentStatus)}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Payment date</dt>
              <dd>{selectedPayment?.paidOn ? selectedPayment.paidOn : '—'}</dd>
            </div>
            <div>
              <dt>Passenger status</dt>
              <dd>
                <StatusBadge tone={toneForPassenger(selected.passengerStatus)}>
                  {labelPassengerStatus(selected.passengerStatus)}
                </StatusBadge>
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="muted" style={{ marginTop: 16 }}>
          Select a booking to view detail.
        </p>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="content">Loading bookings…</div>}>
      <BookingsBoard />
    </Suspense>
  );
}
