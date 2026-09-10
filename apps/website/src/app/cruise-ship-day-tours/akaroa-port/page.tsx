import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../../components/service-category-card';
import { AKAROA_PORT_CRUISE_DAY_TOUR } from '../../../lib/cruise-ship-day-tours';

export const metadata: Metadata = {
  title: 'Akaroa Port | SP2036 Website',
  description: 'SP2036 MVP Akaroa Port cruise ship day tours.',
};

export default function AkaroaPortCruiseDayTourPage() {
  return (
    <AppShell productName="SP2036 MVP" title="Akaroa Port" maxWidth={1040}>
      <nav className="site-nav" aria-label="Page">
        <Link href="/cruise-ship-day-tours">Cruise Ship Day Tours</Link>
      </nav>
      <p className="site-intro">
        SP2036 MVP Akaroa Port cruise ship day tours. Day tours for cruise ship passengers
        when a ship is in port. Online booking and payment are not enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Service">
        <ServiceCategoryCard
          id={AKAROA_PORT_CRUISE_DAY_TOUR.id}
          title={AKAROA_PORT_CRUISE_DAY_TOUR.title}
          summary="Cruise ship day tours when a ship is in port."
        />
      </section>
      <p className="site-note">
        Catalogue prices, departure times, and seat availability are not shown on this
        page.
      </p>
    </AppShell>
  );
}
