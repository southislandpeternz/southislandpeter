'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  bookedSeats,
  findDriver,
  findVehicle,
  labelDirection,
  type MockDeparture,
} from '../lib/mock-data';
import { labelDepartureStatus, toneForDeparture } from '../lib/status';
import { StatusBadge } from './status-badge';

export function DepartureListTable({ rows }: { rows: MockDeparture[] }) {
  const router = useRouter();

  return (
    <section className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Date</th>
            <th>Route</th>
            <th>Direction</th>
            <th>Departure time</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Passengers</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const driver = findDriver(item.driverId);
            const vehicle = findVehicle(item.vehicleId);
            return (
              <tr
                key={item.id}
                className="selectable"
                onClick={() => router.push(`/departures/${item.id}`)}
              >
                <td>{item.date}</td>
                <td>
                  <Link href={`/departures/${item.id}`} onClick={(event) => event.stopPropagation()}>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.route}</div>
                  </Link>
                </td>
                <td>{labelDirection(item.direction)}</td>
                <td>
                  <strong>{item.time}</strong>
                </td>
                <td>
                  {vehicle?.name ?? 'Unassigned'}
                  <div className="muted">{vehicle?.plate}</div>
                </td>
                <td>{driver?.name ?? 'Unassigned'}</td>
                <td>
                  {bookedSeats(item.id)}/{item.capacity}
                </td>
                <td>
                  <StatusBadge tone={toneForDeparture(item.status)}>
                    {labelDepartureStatus(item.status)}
                  </StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="card-pad muted">No departures in this view.</p> : null}
    </section>
  );
}
