'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DepartureListTable } from '../../../components/departure-table';
import { StatusBadge } from '../../../components/status-badge';
import {
  DEMO_TODAY,
  bookedSeats,
  departureRoutes,
  findDriver,
  findVehicle,
  formatDayLabel,
  labelDirection,
  listDepartures,
  weekDates,
} from '../../../lib/mock-data';
import {
  BOARD_LANES,
  boardLane,
  labelDepartureStatus,
  labelServiceType,
  toneForDeparture,
  type BoardLane,
  type ServiceType,
} from '../../../lib/status';

const LANES: ServiceType[] = ['SHUTTLE', 'CRUISE_DAY_TOUR', 'AIRPORT_TRANSFER'];

export default function ArrangementsPage() {
  const [view, setView] = useState<'board' | 'list' | 'lanes' | 'week'>('board');
  const [dateFilter, setDateFilter] = useState<string>(DEMO_TODAY);
  const [statusFilter, setStatusFilter] = useState<'ALL' | BoardLane>('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const allDepartures = listDepartures();
  const routes = departureRoutes();
  const filtered = useMemo(
    () =>
      allDepartures.filter((item) => {
        if (dateFilter !== 'ALL' && item.date !== dateFilter) {
          return false;
        }
        if (statusFilter !== 'ALL' && boardLane(item.status) !== statusFilter) {
          return false;
        }
        if (routeFilter !== 'ALL' && item.route !== routeFilter) {
          return false;
        }
        return true;
      }),
    [allDepartures, dateFilter, routeFilter, statusFilter],
  );
  const today = useMemo(() => allDepartures.filter((item) => item.date === DEMO_TODAY), [allDepartures]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Departure board</h1>
          <p>
            Daily operations board. Shuttle, cruise day tour, and airport transfer are scheduled here as Departure
            records.
          </p>
          <p className="muted">
            Mount Cook weekly pattern: Tuesday Christchurch → Mt Cook · Wednesday Christchurch → Mt Cook with overnight
            in Lake Tekapo · Thursday Mt Cook → Christchurch.
          </p>
        </div>
        <div className="actions">
          <button className={view === 'board' ? 'btn' : 'btn-ghost'} type="button" onClick={() => setView('board')}>
            Status board
          </button>
          <button className={view === 'list' ? 'btn' : 'btn-ghost'} type="button" onClick={() => setView('list')}>
            Departure list
          </button>
          <button className={view === 'lanes' ? 'btn' : 'btn-ghost'} type="button" onClick={() => setView('lanes')}>
            Today by service
          </button>
          <button className={view === 'week' ? 'btn' : 'btn-ghost'} type="button" onClick={() => setView('week')}>
            Week board
          </button>
        </div>
      </div>

      {view === 'board' || view === 'list' ? (
        <div className="filters">
          <button
            type="button"
            className={dateFilter === 'ALL' ? 'chip active' : 'chip'}
            onClick={() => setDateFilter('ALL')}
          >
            All dates
          </button>
          {weekDates().map((date) => (
            <button
              key={date}
              type="button"
              className={dateFilter === date ? 'chip active' : 'chip'}
              onClick={() => setDateFilter(date)}
            >
              {formatDayLabel(date)}
            </button>
          ))}
        </div>
      ) : null}

      {view === 'board' || view === 'list' ? (
        <div className="filters">
          <button
            type="button"
            className={statusFilter === 'ALL' ? 'chip active' : 'chip'}
            onClick={() => setStatusFilter('ALL')}
          >
            All status
          </button>
          {BOARD_LANES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={statusFilter === item.id ? 'chip active' : 'chip'}
              onClick={() => setStatusFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {view === 'board' || view === 'list' ? (
        <div className="filters">
          <button
            type="button"
            className={routeFilter === 'ALL' ? 'chip active' : 'chip'}
            onClick={() => setRouteFilter('ALL')}
          >
            All routes
          </button>
          {routes.map((route) => (
            <button
              key={route}
              type="button"
              className={routeFilter === route ? 'chip active' : 'chip'}
              onClick={() => setRouteFilter(route)}
            >
              {route}
            </button>
          ))}
        </div>
      ) : null}

      {view === 'board' ? (
        <div className="board-lanes">
          {BOARD_LANES.map((lane) => {
            const items = filtered.filter((item) => boardLane(item.status) === lane.id);
            return (
              <section key={lane.id} className="card card-pad lane">
                <h2>{lane.label}</h2>
                <p className="muted">{items.length} departure(s)</p>
                {items.map((item) => {
                  const driver = findDriver(item.driverId);
                  const vehicle = findVehicle(item.vehicleId);
                  return (
                    <Link key={item.id} href={`/departures/${item.id}`} className="dep-card">
                      <strong>
                        {item.time} · {item.name}
                      </strong>
                      <div className="muted">
                        {item.date} · {labelDirection(item.direction)}
                      </div>
                      <div className="muted">{item.route}</div>
                      <div className="muted" style={{ marginTop: 8 }}>
                        {vehicle?.name ?? 'Unassigned'} · {driver?.name ?? 'Unassigned'}
                      </div>
                      <div className="dep-card-foot">
                        <span>
                          {bookedSeats(item.id)}/{item.capacity}
                        </span>
                        <StatusBadge tone={toneForDeparture(item.status)}>
                          {labelDepartureStatus(item.status)}
                        </StatusBadge>
                      </div>
                    </Link>
                  );
                })}
                {items.length === 0 ? <p className="muted">No departure in this status.</p> : null}
              </section>
            );
          })}
        </div>
      ) : null}

      {view === 'list' ? <DepartureListTable rows={filtered} /> : null}

      {view === 'lanes' ? (
        <div className="lanes">
          {LANES.map((lane) => (
            <section key={lane} className="card card-pad lane">
              <h2>{labelServiceType(lane)}</h2>
              <p className="muted">Thursday 10 Sep 2026</p>
              {today
                .filter((item) => item.serviceType === lane)
                .map((item) => {
                  const driver = findDriver(item.driverId);
                  const vehicle = findVehicle(item.vehicleId);
                  return (
                    <Link key={item.id} href={`/departures/${item.id}`} className="dep-card">
                      <strong>
                        {item.time} · {item.name}
                      </strong>
                      <div className="muted">
                        {item.date} · {labelDirection(item.direction)}
                      </div>
                      <div className="muted">{item.route}</div>
                      <div className="muted" style={{ marginTop: 8 }}>
                        {vehicle?.name ?? 'Unassigned'} · {driver?.name ?? 'Unassigned'}
                      </div>
                      <div className="dep-card-foot">
                        <span>
                          {bookedSeats(item.id)}/{item.capacity} passengers
                        </span>
                        <StatusBadge tone={toneForDeparture(item.status)}>
                          {labelDepartureStatus(item.status)}
                        </StatusBadge>
                      </div>
                    </Link>
                  );
                })}
              {today.filter((item) => item.serviceType === lane).length === 0 ? (
                <p className="muted">No departure in this lane today.</p>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}

      {view === 'week' ? (
        <div className="week">
          {weekDates().map((date) => (
            <section key={date} className={date === DEMO_TODAY ? 'day-col today' : 'day-col'}>
              <strong>{formatDayLabel(date)}</strong>
              {allDepartures
                .filter((item) => item.date === date)
                .map((item) => {
                  const driver = findDriver(item.driverId);
                  const vehicle = findVehicle(item.vehicleId);
                  return (
                    <Link key={item.id} href={`/departures/${item.id}`} className="pill">
                      {item.time} · {labelDirection(item.direction)}
                      <div>{item.name}</div>
                      <div className="muted">{item.route}</div>
                      <div className="muted">
                        {vehicle?.name ?? 'Unassigned'} · {driver?.name ?? 'Unassigned'}
                      </div>
                      <div>
                        {bookedSeats(item.id)}/{item.capacity} · {labelDepartureStatus(item.status)}
                      </div>
                    </Link>
                  );
                })}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
