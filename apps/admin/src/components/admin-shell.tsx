'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEMO_OPERATOR, isDemoSignedIn, signOutDemo } from '../lib/demo-session';
import { operationNotifications, searchAdmin } from '../lib/mock-data';

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

const SEARCH_KIND = {
  booking: 'Booking',
  customer: 'Customer',
  departure: 'Departure',
} as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [menu, setMenu] = useState<'none' | 'quick' | 'notice' | 'user'>('none');
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const hits = useMemo(() => searchAdmin(search), [search]);

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
    setSearch('');
  }, [pathname]);

  function demoAction(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function go(href: string): void {
    setSearch('');
    setMenu('none');
    router.push(href);
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
        <div className="sidebar-foot">Admin UI V1.4 · mock data only. Authentication and APIs are not connected.</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-btn mobile-toggle" type="button" onClick={() => setSidebarOpen((open) => !open)}>
            Menu
          </button>
          <div className="search-wrap">
            <input
              className="search"
              value={search}
              placeholder="Search booking, customer, departure, route…"
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setMenu('none')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && hits[0]) {
                  go(hits[0].href);
                }
              }}
            />
            {search.trim().length > 0 ? (
              <div className="search-results">
                {hits.length === 0 ? (
                  <div className="search-empty">No matching booking, customer, or departure.</div>
                ) : (
                  hits.map((hit) => (
                    <button key={`${hit.kind}-${hit.href}`} type="button" className="search-hit" onClick={() => go(hit.href)}>
                      <span className="search-kind">{SEARCH_KIND[hit.kind]}</span>
                      <strong>{hit.title}</strong>
                      <span className="muted">{hit.detail}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
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
            <button type="button" onClick={() => go('/arrangements')}>
              View today’s departures
            </button>
            <button type="button" onClick={() => go('/bookings')}>
              View today’s bookings
            </button>
            <button type="button" onClick={() => go('/bookings?payment=outstanding')}>
              View pending payments
            </button>
            <button type="button" onClick={() => demoAction('New Booking is UI-only in Admin UI V1.')}>
              New Booking
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
          SP2036 Admin UI V1.4 · operations board · unified mock data · not DP01
        </div>
        <main className="content">{children}</main>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
