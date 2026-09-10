'use client';

import Link from 'next/link';
import { assignmentsToday, vehicles } from '../../../lib/mock-data';

export default function VehiclesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Vehicles</h1>
          <p>Assigned to a Departure from today’s operations board, not bound to a product.</p>
        </div>
      </div>
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Plate</th>
              <th>Seats</th>
              <th>Today’s assignment</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((item) => {
              const assigned = assignmentsToday('vehicle', item.id);
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.plate}</td>
                  <td>{item.seats}</td>
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
