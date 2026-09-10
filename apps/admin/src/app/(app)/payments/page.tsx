'use client';

import Link from 'next/link';
import { findBooking, findCustomer, formatNzd, payments } from '../../../lib/mock-data';
import { labelPaymentStatus, toneForPayment } from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

const METHOD_LABEL = {
  STRIPE_CARD: 'Stripe card',
  BANK_TRANSFER: 'Bank transfer',
} as const;

export default function PaymentsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>
            One payment record per booking. Payment date is separate from booking date and departure date. Stripe is
            not connected.
          </p>
        </div>
      </div>
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Payment date</th>
              <th>Booking</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((item) => {
              const booking = findBooking(item.bookingNo);
              const customer = booking ? findCustomer(booking.customerId) : undefined;
              return (
                <tr key={item.id}>
                  <td>{item.paidOn || '—'}</td>
                  <td>
                    {booking ? (
                      <Link href={`/departures/${booking.departureId}`}>{item.bookingNo}</Link>
                    ) : (
                      item.bookingNo
                    )}
                  </td>
                  <td>{customer?.name}</td>
                  <td>{METHOD_LABEL[item.method]}</td>
                  <td>{formatNzd(item.amountNzd)}</td>
                  <td>
                    <StatusBadge tone={toneForPayment(item.status)}>{labelPaymentStatus(item.status)}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
