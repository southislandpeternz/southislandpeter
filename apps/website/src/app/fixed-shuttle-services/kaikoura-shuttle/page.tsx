import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../../components/service-category-card';
import { KAIKOURA_WEEKLY_PATTERN } from '../../../lib/kaikoura-shuttle';

export const metadata: Metadata = {
  title: 'Kaikoura Shuttle | SP2036 Website',
  description: 'SP2036 MVP Kaikoura Shuttle weekly pattern.',
};

export default function KaikouraShuttlePage() {
  return (
    <AppShell productName="SP2036 MVP" title="Kaikoura Shuttle" maxWidth={1040}>
      <nav className="site-nav" aria-label="Page">
        <Link href="/fixed-shuttle-services">Fixed Shuttle Services</Link>
      </nav>
      <p className="site-intro">
        SP2036 MVP Kaikoura Shuttle. Confirmed weekly pattern only. Online booking and
        payment are not enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Weekly pattern">
        {KAIKOURA_WEEKLY_PATTERN.map((item) => (
          <ServiceCategoryCard
            key={item.id}
            id={item.id}
            title={item.day}
            summary={item.arrangement}
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
