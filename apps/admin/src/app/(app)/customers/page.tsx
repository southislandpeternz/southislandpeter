'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import {
  bookingsForCustomer,
  customerBookingCount,
  customerSpendNzd,
  customers,
  findDeparture,
  formatNzd,
  matchesSearch,
} from '../../../lib/mock-data';
import { labelBookingStatus, labelPaymentStatus, toneForBooking, toneForPayment } from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

function CustomersBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('customer');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      customers.filter((item) =>
        matchesSearch(query, [item.name, item.email, item.phone, item.country, item.source]),
      ),
    [query],
  );
  const selected = customers.find((item) => item.id === selectedId);
  const related = selected ? bookingsForCustomer(selected.id) : [];

  function openCustomer(id: string): void {
    router.replace(`/customers?customer=${encodeURIComponent(id)}`, { scroll: false });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Guest records behind bookings. Spend is summed from paid payments in the same demo set.</p>
        </div>
        <input
          className="page-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customer, email, phone…"
        />
      </div>
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Source</th>
              <th>Bookings</th>
              <th>Paid spend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={item.id === selectedId ? 'selectable selected' : 'selectable'}
                onClick={() => openCustomer(item.id)}
              >
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>
                  {item.email}
                  <div className="muted">{item.phone}</div>
                </td>
                <td>{item.country}</td>
                <td>{item.source.replaceAll('_', ' ')}</td>
                <td>{customerBookingCount(item.id)}</td>
                <td>{formatNzd(customerSpendNzd(item.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="card-pad muted">No customers match this search.</p> : null}
      </section>

      {selected ? (
        <section className="card card-pad detail-panel">
          <div className="section-title">
            <h2>Customer detail</h2>
            <span className="muted">{selected.country}</span>
          </div>
          <dl className="info-grid">
            <div>
              <dt>Name</dt>
              <dd>{selected.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{selected.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{selected.phone}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{selected.country}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{selected.source.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Booking count</dt>
              <dd>{customerBookingCount(selected.id)}</dd>
            </div>
            <div>
              <dt>Paid spend</dt>
              <dd>{formatNzd(customerSpendNzd(selected.id))}</dd>
            </div>
          </dl>
          <h2 style={{ marginTop: 20 }}>Related bookings</h2>
          {related.length === 0 ? (
            <p className="muted">No bookings for this customer.</p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Product</th>
                  <th>Departure</th>
                  <th>Pax</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {related.map((item) => {
                  const departure = findDeparture(item.departureId);
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/bookings?booking=${item.bookingNo}`}>{item.bookingNo}</Link>
                      </td>
                      <td>{item.product}</td>
                      <td>
                        <Link href={`/departures/${item.departureId}`}>
                          {departure?.date} {departure?.time}
                        </Link>
                      </td>
                      <td>{item.pax}</td>
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
          )}
        </section>
      ) : (
        <p className="muted" style={{ marginTop: 16 }}>
          Select a customer to view detail and related bookings.
        </p>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="content">Loading customers…</div>}>
      <CustomersBoard />
    </Suspense>
  );
}
