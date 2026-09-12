'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import {
  findCustomer,
  findDeparture,
  findPayment,
  formatNzd,
  labelDirection,
  listBookings,
  matchesSearch,
} from '../../../lib/mock-data';
import {
  labelBookingStatus,
  labelPassengerStatus,
  labelPaymentStatus,
  labelServiceType,
  toneForBooking,
  toneForPassenger,
  toneForPayment,
} from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

function BookingsBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedNo = searchParams.get('booking');
  const [query, setQuery] = useState('');
  const rows = listBookings();
  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const customer = findCustomer(item.customerId);
        const departure = findDeparture(item.departureId);
        return matchesSearch(query, [
          item.bookingNo,
          item.product,
          item.status,
          item.paymentStatus,
          customer?.name,
          departure?.name,
          departure?.date,
        ]);
      }),
    [query, rows],
  );
  const selected = filtered.find((item) => item.bookingNo === selectedNo) ?? rows.find((item) => item.bookingNo === selectedNo);
  const selectedCustomer = selected ? findCustomer(selected.customerId) : undefined;
  const selectedDeparture = selected ? findDeparture(selected.departureId) : undefined;
  const selectedPayment = selected ? findPayment(selected.bookingNo) : undefined;

  function openBooking(bookingNo: string): void {
    router.replace(`/bookings?booking=${encodeURIComponent(bookingNo)}`, { scroll: false });
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
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Booking date</th>
              <th>Departure date</th>
              <th>Payment date</th>
              <th>Pax</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const customer = findCustomer(item.customerId);
              const departure = findDeparture(item.departureId);
              const payment = findPayment(item.bookingNo);
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
                  </td>
                  <td>
                    {item.product}
                    <div className="muted">{labelServiceType(item.serviceType)}</div>
                  </td>
                  <td>{item.bookedOn}</td>
                  <td>
                    <Link href={`/departures/${item.departureId}`} onClick={(event) => event.stopPropagation()}>
                      {departure?.date} {departure?.time}
                    </Link>
                  </td>
                  <td>{payment?.paidOn ? payment.paidOn : '—'}</td>
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
              <dt>Product</dt>
              <dd>{selected.product}</dd>
            </div>
            <div>
              <dt>Departure</dt>
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
