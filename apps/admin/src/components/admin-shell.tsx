'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { DEMO_OPERATOR, isDemoSignedIn, signOutDemo } from '../lib/demo-session';
import { operationNotifications } from '../lib/mock-data';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/departures', label: 'Departures', icon: '🚌' },
  { href: '/arrangements', label: 'Service arrangement', icon: '▦' },
  { href: '/bookings', label: 'Bookings', icon: '▤' },
  { href: '/customers', label: 'Customers', icon: '☺' },
  { href: '/payments', label: 'Payments', icon: '$' },
  { href: '/vehicles', label: 'Vehicles', icon: '▣' },
  { href: '/drivers', label: 'Drivers', icon: '●' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [menu, setMenu] = useState<'none' | 'quick' | 'notice' | 'user'>('none');
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ok = isDemoSignedIn();
    setSignedIn(ok);
    setReady(true);
    if (!ok) {
      router.replace('/login');
    }
  }, [router, pathname]);

  useEffect(() => {
    setMenu('none');
    setSidebarOpen(false);
  }, [pathname]);

  function demoAction(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  if (!ready || !signedIn) {
    return <div className="content">Loading admin UI…</div>;
  }

  return (
    <div className="admin-shell">
      <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div>
            <small>SP2036 MVP</small>
            <strong>South Island ops</strong>
          </div>
        </div>
        <nav className="nav-group">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={active ? 'nav-link active' : 'nav-link'}>
                <span className="nav-ico">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">Admin UI V1.1 · mock data only. Authentication and APIs are not connected.</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-btn mobile-toggle" type="button" onClick={() => setSidebarOpen((open) => !open)}>
            Menu
          </button>
          <input
            className="search"
            placeholder="Search booking, customer, departure, driver…"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                const value = event.currentTarget.value.trim().toUpperCase();
                if (value.startsWith('BO')) {
                  router.push('/bookings');
                  return;
                }
                demoAction('Demo search only. No API is connected.');
              }
            }}
          />
          <div className="top-actions">
            <button className="btn" type="button" onClick={() => setMenu(menu === 'quick' ? 'none' : 'quick')}>
              + Quick action
            </button>
            <button className="icon-btn" type="button" onClick={() => setMenu(menu === 'notice' ? 'none' : 'notice')}>
              Alerts
            </button>
            <button className="user-chip" type="button" onClick={() => setMenu(menu === 'user' ? 'none' : 'user')}>
              <span className="avatar">P</span>
              {DEMO_OPERATOR.name}
            </button>
          </div>
        </header>
        {menu === 'quick' ? (
          <div className="menu">
            <button type="button" onClick={() => demoAction('New Booking is UI-only in Admin UI V1.')}>
              New Booking
            </button>
            <button type="button" onClick={() => demoAction('New Customer is UI-only in Admin UI V1.')}>
              New Customer
            </button>
            <button type="button" onClick={() => demoAction('New Departure is UI-only in Admin UI V1.')}>
              New Departure
            </button>
          </div>
        ) : null}
        {menu === 'notice' ? (
          <div className="menu">
            {operationNotifications().map((item) => (
              <div key={item} style={{ padding: 10, fontSize: 13 }}>
                {item}
              </div>
            ))}
          </div>
        ) : null}
        {menu === 'user' ? (
          <div className="menu">
            <Link href="/settings">Profile</Link>
            <Link href="/settings">Preferences</Link>
            <button
              type="button"
              onClick={() => {
                signOutDemo();
                router.replace('/login');
              }}
            >
              Logout
            </button>
          </div>
        ) : null}
        <div className="demo-banner">
          SP2036 Admin UI V1.1 · operations board · unified mock data · not DP01
        </div>
        <main className="content">{children}</main>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
