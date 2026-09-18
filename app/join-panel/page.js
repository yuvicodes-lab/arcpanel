'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, IdCard, User, Lock, AlertCircle, Loader2, ArrowLeft, KeyRound } from 'lucide-react';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
      <input className="input !pl-10" {...props} />
    </div>
  );
}

export default function Page() {
  const [f, setF] = useState({});
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);

  async function s(x) {
    x.preventDefault();
    setBusy(true);
    setE('');
    const r = await fetch('/api/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'join_panel', ...f }),
    });
    const j = await r.json();
    if (!r.ok) {
      setE(j.error);
      setBusy(false);
    } else location.href = '/login';
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.1),transparent_70%)] blur-2xl" />

      <div className="card glass relative w-full max-w-md p-7 md:p-8 animate-in">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent)] text-white shadow-sm">
          <Layers size={22} />
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight">Claim Panel</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Use your panel code to create the panel owner account.</p>

        {e && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-3 py-2.5 text-sm text-[var(--danger)]">
            <AlertCircle size={16} /> {e}
          </div>
        )}

        <form onSubmit={s} className="mt-6 space-y-3.5">
          <Field
            icon={KeyRound}
            required
            placeholder="Panel code"
            className="input !pl-10 uppercase"
            onChange={(e) => setF({ ...f, panel_code: e.target.value })}
          />
          <Field icon={IdCard} required placeholder="Full name" onChange={(e) => setF({ ...f, full_name: e.target.value })} />
          <Field icon={User} required placeholder="Username" onChange={(e) => setF({ ...f, username: e.target.value })} />
          <Field
            icon={Lock}
            required
            type="password"
            placeholder="Password"
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
          <button disabled={busy} className="btn btn-primary w-full !py-3">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
            {busy ? 'Claiming…' : 'Claim panel'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]" href="/login">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
