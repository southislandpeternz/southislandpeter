'use client';

import Link from 'next/link';
import { assignmentsToday, drivers } from '../../../lib/mock-data';

export default function DriversPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Drivers</h1>
          <p>Assigned to a Departure from today’s operations board, not bound to a product.</p>
        </div>
      </div>
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Phone</th>
              <th>Licence</th>
              <th>Today’s departure</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((item) => {
              const assigned = assignmentsToday('driver', item.id);
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.phone}</td>
                  <td>{item.licence}</td>
                  <td>
                    {assigned.length === 0 ? (
                      <span className="muted">Not assigned today</span>
                    ) : (
                      assigned.map((dep) => (
                        <div key={dep.id}>
                          <Link href={`/departures/${dep.id}`}>
                            {dep.time} {dep.name}
                          </Link>
                        </div>
                      ))
                    )}
                  </td>
                  <td className="muted">{item.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
