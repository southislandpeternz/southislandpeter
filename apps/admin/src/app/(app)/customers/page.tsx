'use client';

import { customerBookingCount, customerSpendNzd, customers, formatNzd } from '../../../lib/mock-data';

export default function CustomersPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Guest records behind bookings. Spend is summed from paid payments in the same demo set.</p>
        </div>
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
            {customers.map((item) => (
              <tr key={item.id}>
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
      </section>
    </div>
  );
}
