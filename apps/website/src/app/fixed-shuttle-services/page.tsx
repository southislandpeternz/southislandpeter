import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../../components/service-category-card';
import { FIXED_SHUTTLE_SERVICES } from '../../lib/fixed-shuttle-services';

export const metadata: Metadata = {
  title: 'Fixed Shuttle Services | SP2036 Website',
  description: 'Mount Cook Shuttle, Kaikoura Shuttle, and Akaroa Shuttle.',
};

export default function FixedShuttleServicesPage() {
  return (
    <AppShell productName="SP2036 MVP" title="Fixed Shuttle Services" maxWidth={1040}>
      <nav className="site-nav" aria-label="Page">
        <Link href="/">Home</Link>
      </nav>
      <p className="site-intro">
        The three approved MVP fixed shuttle services. Online booking and payment are not
        enabled yet.
      </p>
      <section className="site-service-grid" aria-label="Fixed shuttle services">
        {FIXED_SHUTTLE_SERVICES.map((service) => (
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
