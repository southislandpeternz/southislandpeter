import type { ReactNode } from 'react';

export interface AppShellProps {
  productName: string;
  title: string;
  children: ReactNode;
}

export function AppShell({ productName, title, children }: AppShellProps) {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 720,
        margin: '64px auto',
        padding: '0 24px',
        color: '#12202b',
      }}
    >
      <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>
        {productName}
      </p>
      <h1 style={{ fontSize: 32, margin: '8px 0 16px' }}>{title}</h1>
      {children}
    </main>
  );
}
