'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  availableSeats,
  bookedSeats,
  findCustomer,
  findDeparture,
  findDriver,
  findVehicle,
  labelDirection,
  manifestFor,
} from '../../../../lib/mock-data';
import {
  labelDepartureStatus,
  labelPassengerStatus,
  labelPaymentStatus,
  labelServiceType,
  toneForDeparture,
  toneForPassenger,
  toneForPayment,
} from '../../../../lib/status';
import { StatusBadge } from '../../../../components/status-badge';

export default function DepartureDetailPage() {
  const params = useParams<{ id: string }>();
  const departure = findDeparture(params.id);
  const [toast, setToast] = useState<string | null>(null);

  if (!departure) {
    return (
      <div>
        <h1>Departure not found</h1>
        <p className="muted">This demo record is not in the mock set.</p>
        <Link href="/departures">Back to departures</Link>
      </div>
    );
  }

  const driver = findDriver(departure.driverId);
  const vehicle = findVehicle(departure.vehicleId);
  const manifest = manifestFor(departure.id);
  const booked = bookedSeats(departure.id);
  const available = availableSeats(departure);

  function demo(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="muted">
            <Link href="/arrangements">Operations board</Link>
            {' / '}
            <Link href="/departures">Departures</Link> / {departure.name}
          </p>
          <h1>
            {departure.time} · {departure.name}
          </h1>
          <p>{departure.route}</p>
        </div>
        <StatusBadge tone={toneForDeparture(departure.status)}>
          {labelDepartureStatus(departure.status)}
        </StatusBadge>
      </div>

      <section className="card card-pad" style={{ marginBottom: 16 }}>
        <h2>Departure information</h2>
        <dl className="info-grid">
          <div>
            <dt>Service type</dt>
            <dd>{labelServiceType(departure.serviceType)}</dd>
          </div>
          <div>
            <dt>Direction</dt>
            <dd>{labelDirection(departure.direction)}</dd>
          </div>
          <div>
            <dt>Departure date</dt>
            <dd>{departure.date}</dd>
          </div>
          <div>
            <dt>Departure time</dt>
            <dd>{departure.time}</dd>
          </div>
          <div>
            <dt>Route</dt>
            <dd>{departure.route}</dd>
          </div>
          <div>
            <dt>Pickup location</dt>
            <dd>{departure.pickup}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>{departure.destination}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>
              {vehicle?.name} · {vehicle?.plate}
            </dd>
          </div>
          <div>
            <dt>Driver</dt>
            <dd>{driver?.name}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd>{departure.capacity}</dd>
          </div>
          <div>
            <dt>Booked seats</dt>
            <dd>{booked}</dd>
          </div>
          <div>
            <dt>Available seats</dt>
            <dd>{available}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge tone={toneForDeparture(departure.status)}>
                {labelDepartureStatus(departure.status)}
              </StatusBadge>
            </dd>
          </div>
        </dl>
        {departure.notes ? <p className="muted">{departure.notes}</p> : null}
      </section>

      <section className="card table-wrap" style={{ marginBottom: 16 }}>
        <div className="card-pad section-title">
          <h2>Passenger manifest</h2>
          <span className="muted">
            {booked}/{departure.capacity} seats
          </span>
        </div>
        {manifest.length === 0 ? (
          <p className="card-pad muted">No confirmed passengers on this departure.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Booking number</th>
                <th>Passengers</th>
                <th>Pickup</th>
                <th>Payment status</th>
                <th>Passenger status</th>
              </tr>
            </thead>
            <tbody>
              {manifest.map((row) => {
                const customer = findCustomer(row.customerId);
                return (
                  <tr key={row.bookingNo}>
                    <td>
                      <Link href="/customers">{customer?.name}</Link>
                    </td>
                    <td>{row.bookingNo}</td>
                    <td>{row.pax}</td>
                    <td>{row.pickup}</td>
                    <td>
                      <StatusBadge tone={toneForPayment(row.paymentStatus)}>
                        {labelPaymentStatus(row.paymentStatus)}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge tone={toneForPassenger(row.passengerStatus)}>
                        {labelPassengerStatus(row.passengerStatus)}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="card card-pad">
        <h2>Operations</h2>
        <p className="muted">Vehicle and driver are assigned to this Departure, not bound to the product.</p>
        <dl className="info-grid">
          <div>
            <dt>Vehicle</dt>
            <dd>
              {vehicle?.name} · {vehicle?.seats} seats
            </dd>
          </div>
          <div>
            <dt>Driver</dt>
            <dd>
              {driver?.name} · {driver?.phone}
            </dd>
          </div>
          <div>
            <dt>Departure status</dt>
            <dd>
              <StatusBadge tone={toneForDeparture(departure.status)}>
                {labelDepartureStatus(departure.status)}
              </StatusBadge>
            </dd>
          </div>
        </dl>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="btn" type="button" onClick={() => demo('Start trip is UI-only in this prototype.')}>
            Start trip
          </button>
          <button className="btn-ghost" type="button" onClick={() => demo('Navigation is UI-only in this prototype.')}>
            Navigate
          </button>
          <button className="btn-ghost" type="button" onClick={() => demo('Contact passengers is UI-only.')}>
            Contact passengers
          </button>
          <button className="btn-ghost" type="button" onClick={() => window.print()}>
            Print list
          </button>
        </div>
      </section>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
