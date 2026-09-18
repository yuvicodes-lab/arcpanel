'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Lock, IdCard, Ticket, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
      <input className="input !pl-10" {...props} />
    </div>
  );
}

export default function AuthForm({ mode }) {
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(f),
    });
    const j = await r.json();
    if (!r.ok) setErr(j.error || 'Request failed');
    else location.href = j.redirect || '/dashboard';
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,87,235,0.1),transparent_70%)] blur-2xl" />

      <div className="card glass relative w-full max-w-md p-7 md:p-8 animate-in">
        <div className="mb-7">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary)] text-xl font-black text-white shadow-sm">
            Y
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight">
            YUVI <span className="text-gradient">PANEL</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {register ? 'Create your account to get started.' : 'Sign in to your workspace.'}
          </p>
        </div>

        {err && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-3 py-2.5 text-sm text-[var(--danger)]">
            <AlertCircle size={16} /> {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          {register && (
            <Field
              icon={IdCard}
              required
              placeholder="Full name"
              onChange={(e) => setF({ ...f, full_name: e.target.value })}
            />
          )}
          <Field
            icon={User}
            required
            placeholder="Username"
            autoComplete="username"
            onChange={(e) => setF({ ...f, username: e.target.value })}
          />
          <Field
            icon={Lock}
            required
            type="password"
            placeholder="Password"
            autoComplete={register ? 'new-password' : 'current-password'}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
          {register && (
            <Field
              icon={Ticket}
              required
              placeholder="Invite code"
              className="input !pl-10 uppercase"
              onChange={(e) => setF({ ...f, referral_code: e.target.value })}
            />
          )}
          <button disabled={busy} className="btn btn-primary w-full !py-3">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--muted)]">
          {register ? 'Already have an account? ' : 'Need an account? '}
          <Link className="font-bold text-[var(--primary)] hover:underline" href={register ? '/login' : '/register'}>
            {register ? 'Sign in' : 'Register'}
          </Link>
        </div>

        {!register && (
          <div className="mt-2 text-center">
            <Link className="text-sm font-semibold text-[var(--primary)] hover:underline" href="/join-panel">
              Claim Panel Code
            </Link>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[var(--faint)]">
          <ShieldCheck size={13} /> Secured workspace access
        </div>
      </div>
    </main>
  );
}
