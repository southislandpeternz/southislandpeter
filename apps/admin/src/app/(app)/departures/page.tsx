'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { bookedSeats, departures, findDriver, findVehicle, labelDirection } from '../../../lib/mock-data';
import {
  labelDepartureStatus,
  labelServiceType,
  toneForDeparture,
  type ServiceType,
} from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

const FILTERS: Array<{ id: 'ALL' | ServiceType; label: string }> = [
  { id: 'ALL', label: 'All services' },
  { id: 'SHUTTLE', label: 'Shuttle' },
  { id: 'CRUISE_DAY_TOUR', label: 'Cruise day tour' },
  { id: 'AIRPORT_TRANSFER', label: 'Airport transfer' },
];

export default function DeparturesPage() {
  const [filter, setFilter] = useState<'ALL' | ServiceType>('ALL');
  const rows = useMemo(
    () => departures.filter((item) => (filter === 'ALL' ? true : item.serviceType === filter)),
    [filter],
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Departures</h1>
          <p>Every service becomes a Departure. Booking is the guest purchase record, not the operations core.</p>
        </div>
        <Link className="btn" href="/arrangements">
          Unified service arrangement
        </Link>
      </div>
      <div className="filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? 'chip active' : 'chip'}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Time</th>
              <th>Departure</th>
              <th>Service</th>
              <th>Driver / vehicle</th>
              <th>Load</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const driver = findDriver(item.driverId);
              const vehicle = findVehicle(item.vehicleId);
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.time}</strong>
                    <div className="muted">{item.date}</div>
                  </td>
                  <td>
                    <Link href={`/departures/${item.id}`}>
                      <strong>{item.name}</strong>
                      <div className="muted">
                        {labelDirection(item.direction)} · {item.route}
                      </div>
                    </Link>
                  </td>
                  <td>{labelServiceType(item.serviceType)}</td>
                  <td>
                    {driver?.name}
                    <div className="muted">{vehicle?.name}</div>
                  </td>
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
      </section>
    </div>
  );
}
