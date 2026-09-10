import Link from 'next/link';

export interface ServiceCategoryCardProps {
  id: string;
  title: string;
  summary?: string;
  href?: string;
}

export function ServiceCategoryCard({
  id,
  title,
  summary,
  href,
}: ServiceCategoryCardProps) {
  return (
    <article id={id} className="site-service-card">
      <h2>{title}</h2>
      {summary ? <p>{summary}</p> : null}
      {href ? (
        <p className="site-card-link">
          <Link href={href}>View services</Link>
        </p>
      ) : null}
    </article>
  );
}
