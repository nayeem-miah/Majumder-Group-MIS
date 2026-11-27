'use client';

import {
  Building2,
  Clock3,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  ShieldCheck,
  Shirt,
  Truck,
  UploadCloud,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui';

type NavLink = { name: string; href: string; icon: LucideIcon };

const links: NavLink[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Style Management', href: '/dashboard/styles', icon: Shirt },
  { name: 'Production Management', href: '/dashboard/production', icon: Factory },
  { name: 'Hourly Production', href: '/dashboard/hourly-production', icon: Clock3 },
  { name: 'Vehicle Management', href: '/dashboard/vehicles', icon: Truck },
  { name: 'Trip & Dispatch', href: '/dashboard/trips', icon: Route },
  { name: 'Bulk CSV Upload', href: '/dashboard/csv-upload', icon: UploadCloud },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const current = links.find((link) => link.href === pathname) ?? links[0];

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // The local session is cleared even if the server is unreachable.
    } finally {
      sessionStorage.removeItem('MajumderGroup_token');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy px-3 py-5 text-white transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-blue-200 ring-1 ring-white/15">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight">
                Majumder Group
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                GarmentFlow MIS
              </span>
            </span>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-7 grid gap-1">
          {links.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    active ? 'text-blue-300' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                {name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-[11px] text-slate-300 ring-1 ring-white/10">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            Secure admin workspace
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink hover:bg-slate-50 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <b className="block truncate text-sm font-semibold text-navy">
                {current.name}
              </b>
              <span className="hidden text-[11px] text-muted sm:block">
                Operations command center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-muted md:block">
              {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(
                new Date(),
              )}
            </span>
            <span className="hidden h-8 w-8 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand sm:grid">
              MG
            </span>
            <Button variant="secondary" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1550px] p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
