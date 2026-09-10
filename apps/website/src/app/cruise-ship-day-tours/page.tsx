import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../components/service-category-card';
import { CRUISE_SHIP_DAY_TOURS } from '../../lib/cruise-ship-day-tours';

export const metadata: Metadata = {
  title: 'Cruise Ship Day Tours | SP2036 Website',
  description: 'Lyttelton Port and Akaroa Port cruise ship day tours.',
};

export default function CruiseShipDayToursPage() {
  return (
    <AppShell productName="SP2036 MVP" title="Cruise Ship Day Tours" maxWidth={1040}>
      <nav className="site-nav" aria-label="Page">
        <Link href="/">Home</Link>
      </nav>
      <p className="site-intro">
        The two approved MVP cruise ship day tours. Online booking and payment are not
        enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Cruise ship day tours">
        {CRUISE_SHIP_DAY_TOURS.map((service) => (
          <ServiceCategoryCard
            key={service.id}
            id={service.id}
            title={service.title}
            href={service.href}
          />
        ))}
      </section>
      <p className="site-note">
        Catalogue prices, departure times, and seat availability are not shown on this
        page.
      </p>
    </AppShell>
  );
}
