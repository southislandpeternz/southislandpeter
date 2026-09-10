import Link from 'next/link';
import { AppShell } from '@sp2036/ui';
import { ServiceCategoryCard } from '../components/service-category-card';
import { MVP_SERVICE_CATEGORIES } from '../lib/mvp-service-categories';

export default function HomePage() {
  return (
    <AppShell
      productName="SP2036 MVP"
      title="South Island boutique tours"
      maxWidth={1040}
    >
      <p className="site-intro">
        Official website for scheduled tours, cruise day tours, and Christchurch airport
        transfers. Online booking and payment are not enabled yet.
      </p>
      <nav className="site-nav" aria-label="MVP services">
        {MVP_SERVICE_CATEGORIES.map((category) => (
          <Link key={category.id} href={category.href}>
            {category.title}
          </Link>
        ))}
      </nav>
      <section className="site-service-grid" aria-label="Service categories">
        {MVP_SERVICE_CATEGORIES.map((category) => (
          <ServiceCategoryCard
            key={category.id}
            id={category.id}
            title={category.title}
            summary={category.summary}
            href={category.href}
          />
        ))}
      </section>
      <p className="site-note">
        Catalogue prices, departure times, and seat availability are not shown on this
        page. Those details belong to later booking and catalogue packages.
      </p>
    </AppShell>
  );
}
