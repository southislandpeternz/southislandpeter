'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DepartureListTable } from '../../../components/departure-table';
import { listDepartures } from '../../../lib/mock-data';
import { type ServiceType } from '../../../lib/status';

const FILTERS: Array<{ id: 'ALL' | ServiceType; label: string }> = [
  { id: 'ALL', label: 'All services' },
  { id: 'SHUTTLE', label: 'Shuttle' },
  { id: 'CRUISE_DAY_TOUR', label: 'Cruise day tour' },
  { id: 'AIRPORT_TRANSFER', label: 'Airport transfer' },
];

export default function DeparturesPage() {
  const [filter, setFilter] = useState<'ALL' | ServiceType>('ALL');
  const rows = useMemo(
    () => listDepartures().filter((item) => (filter === 'ALL' ? true : item.serviceType === filter)),
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
      <DepartureListTable rows={rows} />
    </div>
  );
}
