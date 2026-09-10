import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../../components/service-category-card';
import { AKAROA_WEEKLY_PATTERN } from '../../../lib/akaroa-shuttle';

export const metadata: Metadata = {
  title: 'Akaroa Shuttle | SP2036 Website',
  description: 'SP2036 MVP Akaroa Shuttle weekly pattern.',
};

export default function AkaroaShuttlePage() {
  return (
    <AppShell productName="SP2036 MVP" title="Akaroa Shuttle" maxWidth={1040}>
      <nav className="site-nav" aria-label="Page">
        <Link href="/fixed-shuttle-services">Fixed Shuttle Services</Link>
      </nav>
      <p className="site-intro">
        SP2036 MVP Akaroa Shuttle. Confirmed weekly pattern only. Online booking and
        payment are not enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Weekly pattern">
        {AKAROA_WEEKLY_PATTERN.map((item) => (
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
