import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../../components/service-category-card';
import { MOUNT_COOK_WEEKLY_PATTERN } from '../../../lib/mount-cook-shuttle';

export const metadata: Metadata = {
  title: 'Mount Cook Shuttle | SP2036 Website',
  description: 'SP2036 MVP Mount Cook Shuttle weekly pattern.',
};

export default function MountCookShuttlePage() {
  return (
    <AppShell productName="SP2036 MVP" title="Mount Cook Shuttle" maxWidth={1040}>
      <nav className="site-nav" aria-label="Page">
        <Link href="/fixed-shuttle-services">Fixed Shuttle Services</Link>
      </nav>
      <p className="site-intro">
        SP2036 MVP Mount Cook Shuttle. Confirmed weekly pattern only. Online booking and
        payment are not enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Weekly pattern">
        {MOUNT_COOK_WEEKLY_PATTERN.map((item) => (
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
