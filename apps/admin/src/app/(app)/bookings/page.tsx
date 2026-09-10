'use client';

import Link from 'next/link';
import { bookings, findCustomer, findDeparture, findPayment, formatNzd } from '../../../lib/mock-data';
import {
  labelBookingStatus,
  labelPaymentStatus,
  labelServiceType,
  toneForBooking,
  toneForPayment,
} from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

export default function BookingsPage() {
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
            {bookings.map((item) => {
              const customer = findCustomer(item.customerId);
              const departure = findDeparture(item.departureId);
              const payment = findPayment(item.bookingNo);
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.bookingNo}</strong>
                  </td>
                  <td>
                    <Link href="/customers">{customer?.name}</Link>
                  </td>
                  <td>
                    {item.product}
                    <div className="muted">{labelServiceType(item.serviceType)}</div>
                  </td>
                  <td>{item.bookedOn}</td>
                  <td>
                    <Link href={`/departures/${item.departureId}`}>
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
      </section>
    </div>
  );
}
