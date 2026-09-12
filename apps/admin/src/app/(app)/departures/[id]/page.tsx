'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  availableSeats,
  bookedSeats,
  canCancelPassenger,
  canCheckInPassenger,
  canMarkPassengerNoShow,
  canStartTrip,
  cancelPassenger,
  checkInPassenger,
  findCustomer,
  findDeparture,
  findDriver,
  findVehicle,
  labelDirection,
  manifestFor,
  markPassengerNoShow,
  passengerSummary,
  startTrip,
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
  const [, setRevision] = useState(0);

  if (!departure) {
    return (
      <div>
        <h1>Departure not found</h1>
        <p className="muted">This demo record is not in the mock set.</p>
        <Link href="/arrangements">Back to operations board</Link>
      </div>
    );
  }

  const driver = findDriver(departure.driverId);
  const vehicle = findVehicle(departure.vehicleId);
  const manifest = manifestFor(departure.id);
  const booked = bookedSeats(departure.id);
  const available = availableSeats(departure);
  const summary = passengerSummary(departure.id);
  const contactable = manifest.filter(
    (row) => row.passengerStatus === 'CONFIRMED' || row.passengerStatus === 'CHECKED_IN',
  );
  const contactPax = contactable.reduce((sum, row) => sum + row.pax, 0);
  const current = departure;

  function notify(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  function refresh(): void {
    setRevision((value) => value + 1);
  }

  function onStartTrip(): void {
    const result = startTrip(current.id);
    notify(result.message);
    if (result.ok) {
      refresh();
    }
  }

  function onCheckIn(bookingNo: string): void {
    const result = checkInPassenger(bookingNo);
    notify(result.message);
    if (result.ok) {
      refresh();
    }
  }

  function onNoShow(bookingNo: string): void {
    const result = markPassengerNoShow(bookingNo);
    notify(result.message);
    if (result.ok) {
      refresh();
    }
  }

  function onCancel(bookingNo: string): void {
    const result = cancelPassenger(bookingNo);
    notify(result.message);
    if (result.ok) {
      refresh();
    }
  }

  function onNavigate(): void {
    notify(
      `Navigation opened (mock) · ${current.route} · ${current.pickup} → ${current.destination}. Maps are not connected.`,
    );
  }

  function onContact(): void {
    if (contactable.length === 0) {
      notify('No passengers to contact on this departure.');
      return;
    }
    notify(
      `Contact sent (mock) to ${contactable.length} booking(s) · ${contactPax} passengers. Phone/SMS is not connected.`,
    );
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
          <p>
            {departure.date} · {labelDirection(departure.direction)} · {departure.route}
          </p>
          <p className="muted">
            {booked}/{departure.capacity} passengers · {vehicle?.name ?? 'Unassigned'} · {driver?.name ?? 'Unassigned'}
          </p>
        </div>
        <StatusBadge tone={toneForDeparture(departure.status)}>
          {labelDepartureStatus(departure.status)}
        </StatusBadge>
      </div>

      <div className="summary-grid five">
        <div className="summary-stat">
          <div className="label">Total passengers</div>
          <div className="value">{summary.total}</div>
        </div>
        <div className="summary-stat">
          <div className="label">Checked in</div>
          <div className="value">{summary.checkedIn}</div>
        </div>
        <div className="summary-stat">
          <div className="label">No show</div>
          <div className="value">{summary.noShow}</div>
        </div>
        <div className="summary-stat">
          <div className="label">Remaining</div>
          <div className="value">{summary.remaining}</div>
        </div>
        <div className="summary-stat">
          <div className="label">Cancelled</div>
          <div className="value">{summary.cancelled}</div>
        </div>
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
            <dt>Passenger count</dt>
            <dd>
              {booked}/{departure.capacity}
            </dd>
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
            <dt>Departure status</dt>
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
          <h2>Passenger operations</h2>
          <span className="muted">
            {booked}/{departure.capacity} seats · Cancelled {summary.cancelled}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manifest.map((row) => {
                const customer = findCustomer(row.customerId);
                return (
                  <tr key={row.bookingNo}>
                    <td>
                      <Link href={`/customers?customer=${row.customerId}`}>{customer?.name}</Link>
                    </td>
                    <td>
                      <Link href={`/bookings?booking=${row.bookingNo}`}>{row.bookingNo}</Link>
                    </td>
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
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn"
                          type="button"
                          disabled={!canCheckInPassenger(row.passengerStatus)}
                          onClick={() => onCheckIn(row.bookingNo)}
                        >
                          Check-in
                        </button>
                        <button
                          className="btn-ghost"
                          type="button"
                          disabled={!canMarkPassengerNoShow(row.passengerStatus)}
                          onClick={() => onNoShow(row.bookingNo)}
                        >
                          No show
                        </button>
                        <button
                          className="btn-ghost"
                          type="button"
                          disabled={!canCancelPassenger(row.passengerStatus)}
                          onClick={() => onCancel(row.bookingNo)}
                        >
                          Cancel
                        </button>
                      </div>
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
          <button
            className="btn"
            type="button"
            disabled={!canStartTrip(departure.status)}
            onClick={onStartTrip}
          >
            Start trip
          </button>
          <button className="btn-ghost" type="button" onClick={onNavigate}>
            Navigate
          </button>
          <button className="btn-ghost" type="button" onClick={onContact}>
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
