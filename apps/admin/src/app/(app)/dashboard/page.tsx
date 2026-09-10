'use client';

import Link from 'next/link';
import {
  bookedSeats,
  findDeparture,
  formatNzd,
  operationTasks,
  passengersToday,
  revenueBars,
  todaysBookings,
  todaysDepartures,
  todaysRevenueNzd,
} from '../../../lib/mock-data';
import { labelBookingStatus, labelDepartureStatus, toneForBooking, toneForDeparture } from '../../../lib/status';
import { StatusBadge } from '../../../components/status-badge';

export default function DashboardPage() {
  const departures = todaysDepartures();
  const todayBookings = todaysBookings();
  const passengerCount = passengersToday();
  const departureCount = departures.length;
  const bookingCount = todayBookings.length;
  const revenue = todaysRevenueNzd();
  const bars = revenueBars();
  const tasks = operationTasks();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Today’s operations · Thursday 10 Sep 2026 · from Unified Service Arrangement</p>
        </div>
        <Link className="btn" href="/arrangements">
          Open operations board
        </Link>
      </div>

      <div className="kpi-grid">
        <Link className="card kpi clickable" href="/bookings">
          <div className="label">Today’s bookings</div>
          <div className="value">{bookingCount}</div>
        </Link>
        <Link className="card kpi clickable" href="/departures">
          <div className="label">Today’s departures</div>
          <div className="value">{departureCount}</div>
        </Link>
        <Link className="card kpi clickable" href="/departures">
          <div className="label">Passengers today</div>
          <div className="value">{passengerCount}</div>
        </Link>
        <Link className="card kpi clickable" href="/payments">
          <div className="label">Today’s received</div>
          <div className="value">{formatNzd(revenue)}</div>
        </Link>
      </div>

      <div className="grid-2">
        <section className="card card-pad">
          <div className="section-title">
            <h2>Today’s operations</h2>
            <Link className="muted" href="/arrangements">
              Operations board
            </Link>
          </div>
          {departures.map((item) => (
            <Link key={item.id} href={`/departures/${item.id}`} className="row">
              <span className="time">{item.time}</span>
              <span>
                <strong>{item.name}</strong>
                <div className="muted">{item.route}</div>
              </span>
              <span className="muted">
                {bookedSeats(item.id)}/{item.capacity}
              </span>
              <StatusBadge tone={toneForDeparture(item.status)}>{labelDepartureStatus(item.status)}</StatusBadge>
            </Link>
          ))}
        </section>

        <section className="card card-pad">
          <div className="section-title">
            <h2>Today’s bookings</h2>
            <Link className="muted" href="/bookings">
              View all
            </Link>
          </div>
          {todayBookings.map((item) => (
            <Link key={item.id} href={`/departures/${item.departureId}`} className="row">
              <span className="time">{findDeparture(item.departureId)?.time}</span>
              <span>
                <strong>{item.bookingNo}</strong>
                <div className="muted">{item.product}</div>
              </span>
              <span className="muted">{item.pax} pax</span>
              <StatusBadge tone={toneForBooking(item.status)}>{labelBookingStatus(item.status)}</StatusBadge>
            </Link>
          ))}
        </section>
      </div>

      <div className="grid-3">
        <section className="card card-pad ai-card">
          <h2>AI assistant</h2>
          <p>
            Morning Peter. Today’s operations board has {departureCount} departures and {passengerCount} passengers.
            Received so far: {formatNzd(revenue)}.
          </p>
          <p>
            Mount Cook Shuttle · Return (Aoraki / Mt Cook → Christchurch) is READY with{' '}
            {bookedSeats('dep-mtcook-thu-return')}/8 seats. Lyttelton Cruise Day Tour has{' '}
            {bookedSeats('dep-lyttelton-cruise')} passengers assigned.
          </p>
          <p className="muted">Placeholder copy only. AI is not connected in this UI drop.</p>
        </section>

        <section className="card card-pad">
          <h2>Task list</h2>
          {tasks.map((task) => (
            <Link key={task.id} href={task.href} className="task">
              <input type="checkbox" disabled />
              {task.label}
            </Link>
          ))}
        </section>

        <section className="card card-pad">
          <h2>Revenue</h2>
          <div className="bars">
            {bars.map((bar) => (
              <div key={bar.day} style={{ flex: 1 }}>
                <div className="bar" style={{ height: `${bar.value}%` }} />
                <div className="bar-label">{bar.day}</div>
              </div>
            ))}
          </div>
          <div className="status-list" style={{ marginTop: 18 }}>
            <h2>System status</h2>
            {['API', 'Database', 'AI', 'Stripe', 'Email', 'Website'].map((name) => (
              <div key={name} className="status-item">
                <span>
                  <span className="dot" />
                  {name}
                </span>
                <span className="muted">Demo · not connected</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
