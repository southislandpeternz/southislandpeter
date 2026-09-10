import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../components/service-category-card';
import { CHRISTCHURCH_AIRPORT_TRANSFERS } from '../../lib/christchurch-airport-transfers';

export const metadata: Metadata = {
  title: 'Christchurch Airport Transfers | SP2036 Website',
  description: 'SP2036 MVP Christchurch Airport Transfers.',
};

export default function ChristchurchAirportTransfersPage() {
  return (
    <AppShell
      productName="SP2036 MVP"
      title="Christchurch Airport Transfers"
      maxWidth={1040}
    >
      <nav className="site-nav" aria-label="Page">
        <Link href="/">Home</Link>
      </nav>
      <p className="site-intro">
        SP2036 MVP Christchurch Airport Transfers. Ad-hoc point-to-point transfers to and
        from Christchurch Airport. Online booking and payment are not enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Service">
        <ServiceCategoryCard
          id={CHRISTCHURCH_AIRPORT_TRANSFERS.id}
          title={CHRISTCHURCH_AIRPORT_TRANSFERS.title}
          summary={CHRISTCHURCH_AIRPORT_TRANSFERS.summary}
        />
      </section>
      <p className="site-note">
        Catalogue prices, departure times, and seat availability are not shown on this
        page.
      </p>
    </AppShell>
  );
}
