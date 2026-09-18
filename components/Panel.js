'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  KeyRound,
  Users,
  Settings,
  Server,
  Crown,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
  LockKeyhole,
  Ticket,
  Layers,
  ChevronRight,
} from 'lucide-react';

const groups = [
  {
    label: 'Overview',
    items: [['/dashboard', 'Dashboard', LayoutDashboard]],
  },
  {
    label: 'Keys',
    items: [
      ['/generate', 'Generate Keys', PlusCircle],
      ['/keys', 'Key List', KeyRound],
    ],
  },
  {
    label: 'Network',
    items: [
      ['/referral', 'Referrals', Ticket],
      ['/users', 'Users', Users],
      ['/admins', 'Admins', Crown],
      ['/permissions', 'Permissions', ShieldCheck],
    ],
  },
  {
    label: 'System',
    items: [
      ['/server', 'Server', Server],
      ['/settings', 'Settings', Settings],
      ['/aes', 'AES', LockKeyhole],
    ],
  },
];

const roleBadge = {
  OWNER: 'badge-primary',
  ADMIN: 'badge-accent',
  RESELLER: 'badge-muted',
};

export default function Panel({ view = 'dashboard', children }) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch('/api/data?view=me')
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, []);

  const allowed = (p) => {
    if (p === '/admins' || p === '/create-panel') return me?.role === 'OWNER';
    if (p === '/server' || p === '/permissions') return ['OWNER', 'ADMIN'].includes(me?.role);
    return true;
  };

  const initials = (me?.full_name || me?.username || 'YU')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const SidebarContent = (
    <>
      <div className="flex items-center justify-between px-2 mb-8">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#5b8cff] font-black text-white shadow-[0_10px_24px_-12px_rgba(124,92,255,0.9)]">
            Y
          </span>
          <span className="font-black text-lg tracking-tight">
            YUVI <span className="text-gradient">PANEL</span>
          </span>
        </Link>
        <button className="lg:hidden text-[var(--muted)] hover:text-white" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {groups.map((group) => {
          const items = group.items.filter((x) => allowed(x[0]));
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <div className="px-2 mb-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--faint)]">
                {group.label}
              </div>
              <div className="space-y-1">
                {items.map(([href, label, Icon]) => (
                  <Link
                    onClick={() => setOpen(false)}
                    className={`sidebar-link ${view === href.slice(1) ? 'active' : ''}`}
                    href={href}
                    key={href}
                  >
                    <Icon size={18} strokeWidth={2} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {me?.role === 'OWNER' && (
          <div>
            <div className="px-2 mb-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--faint)]">
              Owner
            </div>
            <Link
              className={`sidebar-link ${view === 'create-panel' ? 'active' : ''}`}
              href="/create-panel"
              onClick={() => setOpen(false)}
            >
              <Layers size={18} strokeWidth={2} />
              Create Panel
            </Link>
          </div>
        )}
      </nav>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#5b8cff] font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{me?.full_name || me?.username || 'Loading…'}</div>
            <div className="mt-0.5">
              <span className={`badge ${roleBadge[me?.role] || 'badge-muted'}`}>{me?.role || '—'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth', { method: 'DELETE' });
            location.href = '/login';
          }}
          className="btn btn-secondary btn-sm mt-3 w-full"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`glass fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[var(--border)] p-4 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Main */}
      <div className="lg:ml-[270px]">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[var(--border)] px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="btn btn-secondary btn-sm lg:hidden !px-2.5"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight">{me?.full_name || 'Workspace'}</div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span>{me?.role || '—'}</span>
                <ChevronRight size={12} />
                <span className="font-mono text-[var(--faint)]">{me?.panel_code || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {me?.role !== 'OWNER' && me && (
              <span className="badge badge-success hidden sm:inline-flex">
                {me?.balance} Rs
              </span>
            )}
            <span className={`badge ${roleBadge[me?.role] || 'badge-muted'}`}>{me?.role || '—'}</span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-8 animate-in">{children}</main>
      </div>
    </div>
  );
}
