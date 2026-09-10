'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DEMO_TODAY, bookedSeats, departures, formatDayLabel, weekDates } from '../../../lib/mock-data';
import { labelDepartureStatus, labelServiceType, type ServiceType } from '../../../lib/status';

const LANES: ServiceType[] = ['SHUTTLE', 'CRUISE_DAY_TOUR', 'AIRPORT_TRANSFER'];

export default function ArrangementsPage() {
  const [view, setView] = useState<'lanes' | 'week'>('lanes');
  const today = useMemo(() => departures.filter((item) => item.date === DEMO_TODAY), []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Unified service arrangement</h1>
          <p>
            Operations control board. Shuttle, cruise day tour, and airport transfer are scheduled here as
            Departure records. This is not a booking module.
          </p>
          <p className="muted">
            Mount Cook weekly pattern: Tuesday Christchurch → Mt Cook · Wednesday Christchurch → Mt Cook with overnight
            in Lake Tekapo · Thursday Mt Cook → Christchurch.
          </p>
        </div>
        <div className="actions">
          <button className={view === 'lanes' ? 'btn' : 'btn-ghost'} type="button" onClick={() => setView('lanes')}>
            Today by service
          </button>
          <button className={view === 'week' ? 'btn' : 'btn-ghost'} type="button" onClick={() => setView('week')}>
            Week board
          </button>
        </div>
      </div>

      {view === 'lanes' ? (
        <div className="lanes">
          {LANES.map((lane) => (
            <section key={lane} className="card card-pad lane">
              <h2>{labelServiceType(lane)}</h2>
              <p className="muted">Thursday 10 Sep 2026</p>
              {today
                .filter((item) => item.serviceType === lane)
                .map((item) => (
                  <Link key={item.id} href={`/departures/${item.id}`} className="dep-card">
                    <strong>
                      {item.time} · {item.name}
                    </strong>
                    <div className="muted">{item.route}</div>
                    <div className="muted" style={{ marginTop: 8 }}>
                      {bookedSeats(item.id)}/{item.capacity} · {labelDepartureStatus(item.status)}
                    </div>
                  </Link>
                ))}
              {today.filter((item) => item.serviceType === lane).length === 0 ? (
                <p className="muted">No departure in this lane today.</p>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <div className="week">
          {weekDates().map((date) => (
            <section key={date} className={date === DEMO_TODAY ? 'day-col today' : 'day-col'}>
              <strong>{formatDayLabel(date)}</strong>
              {departures
                .filter((item) => item.date === date)
                .map((item) => (
                  <Link key={item.id} href={`/departures/${item.id}`} className="pill">
                    {item.time} {labelServiceType(item.serviceType)}
                    <div>
                      {item.name} · {bookedSeats(item.id)}/{item.capacity}
                    </div>
                  </Link>
                ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
