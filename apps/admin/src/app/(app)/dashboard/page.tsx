'use client';

import Link from 'next/link';
import { TodayOperationsTable } from '../../../components/departure-table';
import { StatusBadge } from '../../../components/status-badge';
import {
  bookedSeats,
  findDeparture,
  formatNzd,
  operationalAlerts,
  passengersToday,
  pendingPaymentCount,
  revenueBars,
  todaysBookings,
  todaysDepartures,
  todaysPassengerSummary,
  todaysRevenueNzd,
} from '../../../lib/mock-data';
import { labelBookingStatus, labelDepartureStatus, toneForBooking } from '../../../lib/status';

export default function DashboardPage() {
  const departures = todaysDepartures();
  const todayBookings = todaysBookings();
  const passengerCount = passengersToday();
  const departureCount = departures.length;
  const bookingCount = todayBookings.length;
  const revenue = todaysRevenueNzd();
  const bars = revenueBars();
  const passengerOps = todaysPassengerSummary();
  const pendingPayments = pendingPaymentCount();
  const mtCook = findDeparture('dep-mtcook-thu-return');
  const alerts = operationalAlerts();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Today’s operations · Thursday 10 Sep 2026 · daily operations workbench</p>
        </div>
        <Link className="btn" href="/arrangements">
          Open departure board
        </Link>
      </div>

      <div className="kpi-grid ops">
        <Link className="card kpi clickable" href="/arrangements">
          <div className="label">Today’s departures</div>
          <div className="value">{departureCount}</div>
        </Link>
        <Link className="card kpi clickable" href="/arrangements">
          <div className="label">Today’s passengers</div>
          <div className="value">{passengerCount}</div>
        </Link>
        <Link className="card kpi clickable" href="/bookings">
          <div className="label">Today’s bookings</div>
          <div className="value">{bookingCount}</div>
        </Link>
        <Link className="card kpi clickable" href="/arrangements">
          <div className="label">Checked-in</div>
          <div className="value">{passengerOps.checkedIn}</div>
        </Link>
        <Link className="card kpi clickable" href="/arrangements">
          <div className="label">No-show</div>
          <div className="value">{passengerOps.noShow}</div>
        </Link>
        <Link className="card kpi clickable" href="/bookings?payment=outstanding">
          <div className="label">Pending payment</div>
          <div className="value">{pendingPayments}</div>
        </Link>
      </div>

      <section className="card card-pad" id="ops-alerts" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="section-title">
          <h2>Operational alerts</h2>
          <span className="muted">{alerts.length === 0 ? 'Clear' : `${alerts.length} item(s)`}</span>
        </div>
        {alerts.length === 0 ? (
          <p className="muted">All operations look good.</p>
        ) : (
          <div className="alert-list">
            {alerts.map((alert) => (
              <Link key={alert.id} href={alert.href} className="alert-row">
                <strong>{alert.reason}</strong>
                <span className="muted">{alert.related}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="section-title" style={{ marginBottom: 12 }}>
        <h2>Today’s operations</h2>
        <Link className="muted" href="/arrangements">
          Departure board
        </Link>
      </div>
      <TodayOperationsTable rows={departures} />

      <div className="grid-2">
        <section className="card card-pad">
          <div className="section-title">
            <h2>Today’s bookings</h2>
            <Link className="muted" href="/bookings">
              View all
            </Link>
          </div>
          {todayBookings.length === 0 ? (
            <p className="muted">No bookings for today’s departures.</p>
          ) : (
            todayBookings.map((item) => (
              <Link key={item.id} href={`/bookings?booking=${item.bookingNo}`} className="row">
                <span className="time">{findDeparture(item.departureId)?.time}</span>
                <span>
                  <strong>{item.bookingNo}</strong>
                  <div className="muted">{item.product}</div>
                </span>
                <span className="muted">{item.pax} pax</span>
                <StatusBadge tone={toneForBooking(item.status)}>{labelBookingStatus(item.status)}</StatusBadge>
              </Link>
            ))
          )}
        </section>

        <section className="card card-pad ai-card">
          <h2>AI assistant</h2>
          <p>
            Morning Peter. Today’s board has {departureCount} departures and {passengerCount} passengers. Checked in:{' '}
            {passengerOps.checkedIn}. No show: {passengerOps.noShow}. Alerts: {alerts.length}. Received so far:{' '}
            {formatNzd(revenue)}.
          </p>
          <p>
            Mount Cook Shuttle · Return is {mtCook ? labelDepartureStatus(mtCook.status) : 'unknown'} with{' '}
            {bookedSeats('dep-mtcook-thu-return')}/8 seats.
          </p>
          <p className="muted">Placeholder copy only. AI is not connected in this UI drop.</p>
          <div className="bars" style={{ marginTop: 16 }}>
            {bars.map((bar) => (
              <div key={bar.day} style={{ flex: 1 }}>
                <div className="bar" style={{ height: `${bar.value}%` }} />
                <div className="bar-label">{bar.day}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
