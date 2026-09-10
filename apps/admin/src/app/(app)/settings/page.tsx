'use client';

export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Placeholder for company and operator preferences. No auth or RBAC in this drop.</p>
        </div>
      </div>
      <div className="grid-2">
        <section className="card card-pad">
          <h2>Company</h2>
          <p>South Island Peter</p>
          <p className="muted">Christchurch, New Zealand · boutique shuttle operations</p>
          <p className="muted">
            MVP services: Mount Cook / Kaikoura / Akaroa shuttle, Lyttelton and Akaroa cruise day tours, Christchurch
            airport transfer.
          </p>
        </section>
        <section className="card card-pad">
          <h2>This UI drop</h2>
          <p>Admin UI V1.1 is a clickable frontend prototype with unified demo data.</p>
          <p className="muted">Not connected to NestJS, Prisma, JWT, or Stripe.</p>
          <p className="muted">DP01 Authentication is intentionally not started.</p>
        </section>
      </div>
    </div>
  );
}
