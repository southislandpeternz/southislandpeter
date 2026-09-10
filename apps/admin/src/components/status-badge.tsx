import type { ReactNode } from 'react';

export function StatusBadge({
  tone,
  children,
}: {
  tone: 'ok' | 'warn' | 'danger' | 'neutral' | 'info';
  children: ReactNode;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
