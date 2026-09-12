'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  departureLoad,
  findDriver,
  findVehicle,
  formatReturnTime,
  labelDirection,
  type MockDeparture,
} from '../lib/mock-data';
import {
  labelDepartureStatus,
  labelInventoryStatus,
  labelServiceType,
  toneForDeparture,
  toneForInventory,
} from '../lib/status';
import { StatusBadge } from './status-badge';

export function DepartureListTable({ rows }: { rows: MockDeparture[] }) {
  const router = useRouter();

  return (
    <section className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Departure ID</th>
            <th>Service type</th>
            <th>Product</th>
            <th>Route</th>
            <th>Date</th>
            <th>Departure time</th>
            <th>Return time</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Capacity</th>
            <th>Booked</th>
            <th>Available</th>
            <th>Status</th>
            <th>Pickup information</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const driver = findDriver(item.driverId);
            const vehicle = findVehicle(item.vehicleId);
            const load = departureLoad(item);
            return (
              <tr
                key={item.id}
                className="selectable"
                onClick={() => router.push(`/departures/${item.id}`)}
              >
                <td>
                  <Link href={`/departures/${item.id}`} onClick={(event) => event.stopPropagation()}>
                    <strong>{item.id}</strong>
                  </Link>
                </td>
                <td>{labelServiceType(item.serviceType)}</td>
                <td>
                  <strong>{item.product}</strong>
                  <div className="muted">{item.name}</div>
                </td>
                <td>{item.route}</td>
                <td>{item.date}</td>
                <td>
                  <strong>{item.time}</strong>
                </td>
                <td>{formatReturnTime(item.returnTime)}</td>
                <td>
                  {vehicle?.name ?? 'Unassigned'}
                  <div className="muted">{vehicle?.plate ?? 'Vehicle not assigned'}</div>
                </td>
                <td>{driver?.name ?? 'Driver not assigned'}</td>
                <td>{load.capacity}</td>
                <td>{load.booked}</td>
                <td>{load.available}</td>
                <td>
                  <StatusBadge tone={toneForInventory(load.inventoryStatus)}>
                    {labelInventoryStatus(load.inventoryStatus)}
                  </StatusBadge>
                  {load.exceeded ? (
                    <div className="muted" style={{ marginTop: 4 }}>
                      CAPACITY EXCEEDED
                    </div>
                  ) : (
                    <div className="muted" style={{ marginTop: 4 }}>
                      {labelDepartureStatus(item.status)}
                    </div>
                  )}
                </td>
                <td>{item.pickup}</td>
                <td>{item.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="card-pad muted">No departures in this view.</p> : null}
    </section>
  );
}

export function TodayOperationsTable({ rows }: { rows: MockDeparture[] }) {
  const router = useRouter();
  if (rows.length === 0) {
    return (
      <section className="card card-pad">
        <p className="muted">No departures scheduled for today.</p>
      </section>
    );
  }
  return (
    <section className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Departure time</th>
            <th>Route</th>
            <th>Outbound / Return</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Passengers</th>
            <th>Capacity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const driver = findDriver(item.driverId);
            const vehicle = findVehicle(item.vehicleId);
            const load = departureLoad(item);
            return (
              <tr
                key={item.id}
                className="selectable"
                onClick={() => router.push(`/departures/${item.id}`)}
              >
                <td>
                  <strong>{item.time}</strong>
                </td>
                <td>
                  <Link href={`/departures/${item.id}`} onClick={(event) => event.stopPropagation()}>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.route}</div>
                  </Link>
                </td>
                <td>{labelDirection(item.direction)}</td>
                <td>{vehicle?.name ?? 'Unassigned'}</td>
                <td>{driver?.name ?? 'Driver not assigned'}</td>
                <td>{load.booked}</td>
                <td>{load.capacity}</td>
                <td>
                  <StatusBadge tone={toneForDeparture(item.status)}>
                    {labelDepartureStatus(item.status)}
                  </StatusBadge>
                  {load.exceeded ? <div className="muted">CAPACITY EXCEEDED</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
