'use client';

import { useEffect, useState } from 'react';
import {
  KeyRound,
  Users,
  Crown,
  Ticket,
  ShieldCheck,
  Server,
  Settings as SettingsIcon,
  LockKeyhole,
  Layers,
  PlusCircle,
  Wand2,
  Copy,
  Check,
  Trash2,
  Ban,
  CircleCheck,
  Wallet,
  AlertCircle,
  Loader2,
  Monitor,
  Coins,
  Activity,
  LayoutDashboard,
} from 'lucide-react';

const prices = {
  '2H': 10,
  '1D': 80,
  '3D': 150,
  '7D': 250,
  '15D': 350,
  '30D': 500,
  '60D': 900,
};

const INDIGO = 'bg-[#eef0fe] text-[#5b57eb]';
const CYAN = 'bg-[#e6f6fe] text-[#0284c7]';
const GREEN = 'bg-[#e7f6ec] text-[#15a34a]';
const AMBER = 'bg-[#fdf3e3] text-[#c2740a]';
const PINK = 'bg-[#fdeef6] text-[#d43f8d]';

const statMeta = {
  total_admins: { label: 'Total Admins', icon: Crown, tint: INDIGO },
  total_resellers: { label: 'Total Resellers', icon: Users, tint: CYAN },
  total_keys: { label: 'Total Keys', icon: KeyRound, tint: GREEN },
  admin_keys: { label: 'Admin Keys', icon: KeyRound, tint: AMBER },
  reseller_keys: { label: 'Reseller Keys', icon: KeyRound, tint: PINK },
  my_resellers: { label: 'My Resellers', icon: Users, tint: CYAN },
  my_keys: { label: 'My Keys', icon: KeyRound, tint: INDIGO },
  my_reseller_keys: { label: 'Reseller Keys', icon: KeyRound, tint: PINK },
  my_active_keys: { label: 'Active Keys', icon: Activity, tint: GREEN },
};

function fmtDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function useData(view) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setD(null);
    setErr('');
    fetch('/api/data?view=' + view)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error);
        setD(j);
      })
      .catch((e) => setErr(e.message));
  }, [view]);

  return [d, err];
}

function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-start gap-3.5">
      {Icon && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] text-[var(--primary)]">
          <Icon size={20} />
        </span>
      )}
      <div>
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}

function Box({ title, desc, icon: Icon, children, actions }) {
  return (
    <section className="card overflow-hidden">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-3)] text-[var(--primary)]">
                <Icon size={18} />
              </span>
            )}
            <div>
              <h2 className="font-bold leading-tight">{title}</h2>
              {desc && <p className="text-xs text-[var(--muted)]">{desc}</p>}
            </div>
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function Btn({ children, onClick, kind = 'primary', size = 'sm' }) {
  return (
    <button onClick={onClick} className={`btn btn-${kind} ${size === 'sm' ? 'btn-sm' : ''}`}>
      {children}
    </button>
  );
}

function StatusBadge({ blocked, activeLabel = 'Active', blockedLabel = 'Blocked' }) {
  return (
    <span className={`badge ${blocked ? 'badge-danger' : 'badge-success'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${blocked ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'}`} />
      {blocked ? blockedLabel : activeLabel}
    </span>
  );
}

function Empty({ children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center text-[var(--muted)]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-3)]">
        <Layers size={22} />
      </span>
      <p className="text-sm">{children}</p>
    </div>
  );
}

export default function Screens({ view }) {
  const [d, err] = useData(view);

  if (err)
    return (
      <div className="card flex items-center gap-3 border-[rgba(248,113,113,0.3)] p-5 text-[var(--danger)]">
        <AlertCircle size={20} />
        <span className="font-medium">{err}</span>
      </div>
    );

  if (!d)
    return (
      <div className="flex items-center gap-2 py-20 text-[var(--muted)]">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );

  if (view === 'dashboard') return <Dashboard stats={d.stats || {}} />;
  if (view === 'generate') return <Generate me={d.me} />;
  if (view === 'keys') return <Keys rows={d.rows} />;
  if (view === 'users') return <UsersView rows={d.rows} me={d.me} />;
  if (view === 'admins') return <Admins rows={d.rows} />;
  if (view === 'referral') return <Referral rows={d.rows} me={d.me} />;
  if (view === 'permissions') return <Permissions rows={d.rows} />;
  if (view === 'server') return <ServerView data={d} />;
  if (view === 'settings') return <Settings data={d} />;
  if (view === 'aes') return <AES data={d} />;
  if (view === 'create-panel') return <Panels rows={d.rows} />;
}

function post(body) {
  return fetch('/api/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const j = await r.json();
    if (!r.ok) throw Error(j.error);
    return j;
  });
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ stats }) {
  const entries = Object.entries(stats);
  return (
    <>
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="A live overview of your panel activity." />
      {entries.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {entries.map(([k, v]) => {
            const meta = statMeta[k] || { label: k.replaceAll('_', ' '), icon: Activity, tint: INDIGO };
            const Icon = meta.icon;
            return (
              <div className="card group p-5" key={k}>
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${meta.tint}`}
                  >
                    <Icon size={20} />
                  </span>
                </div>
                <div className="mt-4 text-3xl font-black tracking-tight">{v}</div>
                <div className="mt-1 text-sm capitalize text-[var(--muted)]">{meta.label}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty>No statistics available yet.</Empty>
      )}
    </>
  );
}

/* ---------------- Generate ---------------- */
function Generate({ me }) {
  const [f, setF] = useState({ duration: '2H', device_limit: 1, amount: 1, custom_key: '' });
  const [out, setOut] = useState('');
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const cost = (prices[f.duration] || 10) * Math.max(1, +f.device_limit || 1) * Math.max(1, +f.amount || 1);
  const unlimited = me.role === 'OWNER';

  const copy = () => {
    navigator.clipboard?.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <PageHeader icon={PlusCircle} title="Generate Keys" subtitle="Create new access keys for your users." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Box title="Configuration" desc="Set duration, devices and quantity" icon={Wand2}>
            {e && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-3 py-2.5 text-sm text-[var(--danger)]">
                <AlertCircle size={16} /> {e}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Key name</span>
                <input
                  className="input"
                  placeholder="Custom key (optional)"
                  value={f.custom_key}
                  onChange={(e) => setF({ ...f, custom_key: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Duration</span>
                <select className="select" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })}>
                  {Object.keys(prices).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Device limit</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={f.device_limit}
                  onChange={(e) => setF({ ...f, device_limit: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Keys count</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={f.amount}
                  onChange={(e) => setF({ ...f, amount: e.target.value })}
                />
              </label>
            </div>

            <button
              className="btn btn-primary mt-5 w-full sm:w-auto"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setE('');
                post({ action: 'generate_keys', ...f })
                  .then((j) => setOut(j.keys.join('\n')))
                  .catch((x) => setE(x.message))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {busy ? 'Generating…' : 'Generate keys'}
            </button>
          </Box>

          {out && (
            <div className="mt-5">
              <Box
                title="Generated keys"
                icon={KeyRound}
                actions={
                  <Btn kind="secondary" onClick={copy}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? 'Copied' : 'Copy all'}
                  </Btn>
                }
              >
                <textarea className="textarea h-44 font-mono text-sm" readOnly value={out} />
              </Box>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Wallet size={16} /> Balance
            </div>
            <div className="mt-2 text-2xl font-black">{unlimited ? 'Unlimited' : `${me.balance} Rs`}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Coins size={16} /> Estimated cost
            </div>
            <div className="mt-2 text-2xl font-black text-[var(--primary)]">{cost} Rs</div>
            <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
              <Row label="Unit price" value={`${prices[f.duration] || 10} Rs`} />
              <Row label="Devices" value={`× ${Math.max(1, +f.device_limit || 1)}`} />
              <Row label="Quantity" value={`× ${Math.max(1, +f.amount || 1)}`} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold text-[var(--text)]">{value}</span>
    </div>
  );
}

/* ---------------- Keys ---------------- */
function Keys({ rows }) {
  return (
    <>
      <PageHeader icon={KeyRound} title="Key List" subtitle="Manage all generated access keys." />
      <Box title="Keys" desc={`${rows.length} total`} icon={KeyRound}>
        <Table
          cols={['Key', 'Duration', 'Devices', 'Uses', 'Expires', 'Status', 'Actions']}
          rows={rows.map((x) => [
            <span className="font-mono text-[var(--primary)]" key="k">
              {x.key_value}
            </span>,
            <span className="badge badge-muted" key="d">
              {x.duration}
            </span>,
            <span className="inline-flex items-center gap-1.5" key="dev">
              <Monitor size={14} className="text-[var(--faint)]" />
              {x.current_devices}/{x.device_limit}
            </span>,
            x.uses,
            <span className="text-[var(--muted)]" key="e">
              {fmtDate(x.expires_at) || 'Not started'}
            </span>,
            <StatusBadge blocked={x.is_blocked} key="s" />,
            <div className="flex gap-2" key={x.id}>
              <Btn
                kind={x.is_blocked ? 'success' : 'secondary'}
                onClick={() => post({ action: 'toggle_key', key_id: x.id }).then(() => location.reload())}
              >
                {x.is_blocked ? <CircleCheck size={14} /> : <Ban size={14} />}
                {x.is_blocked ? 'Unblock' : 'Block'}
              </Btn>
              <Btn kind="danger" onClick={() => post({ action: 'delete_key', key_id: x.id }).then(() => location.reload())}>
                <Trash2 size={14} />
              </Btn>
            </div>,
          ])}
          empty="No keys generated yet."
        />
      </Box>
    </>
  );
}

/* ---------------- Users ---------------- */
function UsersView({ rows, me }) {
  return (
    <>
      <PageHeader icon={Users} title="User Management" subtitle="Manage balances and access for your users." />
      <Box title="Users" desc={`${rows.length} total`} icon={Users}>
        <Table
          cols={['User', 'Role', 'Balance', 'Validity', 'Status', 'Actions']}
          rows={rows.map((x) => [
            <div key="u">
              <div className="font-semibold">{x.username}</div>
              <div className="text-xs text-[var(--faint)]">#{x.id}</div>
            </div>,
            <span className="badge badge-primary" key="r">
              {x.role}
            </span>,
            <span className="font-semibold" key="b">
              {x.balance}
            </span>,
            <span className="text-[var(--muted)]" key="v">
              {x.validity || 'Lifetime'}
            </span>,
            <StatusBadge blocked={x.is_blocked} key="s" />,
            <div className="flex flex-wrap gap-2" key={x.id}>
              <Btn
                kind="success"
                onClick={() =>
                  post({ action: 'add_balance', target_id: x.id, amount: prompt('Amount') }).then(() => location.reload())
                }
              >
                + Balance
              </Btn>
              <Btn
                kind="secondary"
                onClick={() =>
                  post({ action: 'deduct_balance', target_id: x.id, amount: prompt('Amount') }).then(() =>
                    location.reload()
                  )
                }
              >
                − Balance
              </Btn>
              {x.id !== me.id && (
                <Btn
                  kind={x.is_blocked ? 'success' : 'danger'}
                  onClick={() => post({ action: 'toggle_user', target_id: x.id }).then(() => location.reload())}
                >
                  {x.is_blocked ? 'Unblock' : 'Block'}
                </Btn>
              )}
            </div>,
          ])}
          empty="No users found."
        />
      </Box>
    </>
  );
}

/* ---------------- Admins ---------------- */
function Admins({ rows }) {
  return (
    <>
      <PageHeader icon={Crown} title="Admin Manager" subtitle="Oversee admins and resellers on your panel." />
      <Box title="Team" desc={`${rows.length} members`} icon={Crown}>
        <Table
          cols={['User', 'Role', 'Balance', 'Status', 'Keys', 'Action']}
          rows={rows.map((x) => [
            <span className="font-semibold" key="u">
              {x.username}
            </span>,
            <span className="badge badge-primary" key="r">
              {x.role}
            </span>,
            x.balance,
            <StatusBadge blocked={x.is_blocked} key="s" />,
            <span className="font-semibold" key="k">
              {x.total_keys}
            </span>,
            <a key={x.id} className="btn btn-secondary btn-sm" href={'/admins?view_keys=' + x.id}>
              <KeyRound size={14} /> View keys
            </a>,
          ])}
          empty="No admins or resellers yet."
        />
      </Box>
    </>
  );
}

/* ---------------- Referral ---------------- */
function Referral({ rows }) {
  const [f, setF] = useState({ role: 'RESELLER', duration: 30, balance: 0 });

  return (
    <>
      <PageHeader icon={Ticket} title="Referrals" subtitle="Generate invite codes for new team members." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Box title="New referral" icon={PlusCircle}>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Role</span>
                <select className="select" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                  <option>RESELLER</option>
                  <option>ADMIN</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Duration (days)</span>
                <input
                  className="input"
                  type="number"
                  value={f.duration}
                  onChange={(e) => setF({ ...f, duration: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Balance</span>
                <input
                  className="input"
                  type="number"
                  value={f.balance}
                  onChange={(e) => setF({ ...f, balance: e.target.value })}
                />
              </label>
              <button
                className="btn btn-primary w-full"
                onClick={() =>
                  post({ action: 'generate_referral', ...f })
                    .then((j) => alert(j.code))
                    .catch((e) => alert(e.message))
                }
              >
                <Ticket size={16} /> Generate code
              </button>
            </div>
          </Box>
        </div>

        <div className="lg:col-span-2">
          <Box title="Active referrals" desc={`${rows.length} total`} icon={Ticket}>
            <Table
              cols={['Code', 'Role', 'Duration', 'Balance', 'Used', 'Creator', 'Action']}
              rows={rows.map((x) => [
                <span className="font-mono text-[var(--primary)]" key="c">
                  {x.code}
                </span>,
                <span className="badge badge-primary" key="r">
                  {x.role}
                </span>,
                `${x.duration} days`,
                x.balance,
                <span className={`badge ${x.used ? 'badge-danger' : 'badge-success'}`} key="u">
                  {x.used ? 'Used' : 'Available'}
                </span>,
                <span className="text-[var(--muted)]" key="cr">
                  {x.creator_name}
                </span>,
                <Btn
                  key={x.code}
                  kind="danger"
                  onClick={() => post({ action: 'delete_referral', code: x.code }).then(() => location.reload())}
                >
                  <Trash2 size={14} />
                </Btn>,
              ])}
              empty="No referral codes yet."
            />
          </Box>
        </div>
      </div>
    </>
  );
}

/* ---------------- Permissions ---------------- */
function Permissions({ rows }) {
  return (
    <>
      <PageHeader icon={ShieldCheck} title="Permissions" subtitle="Control referral permissions and limits." />
      <Box title="Access control" desc={`${rows.length} members`} icon={ShieldCheck}>
        <Table
          cols={['User', 'Role', 'Referral permission', 'Limit', 'Actions']}
          rows={rows.map((x) => [
            <span className="font-semibold" key="u">
              {x.username}
            </span>,
            <span className="badge badge-primary" key="r">
              {x.role}
            </span>,
            <span className={`badge ${x.can_generate_referral ? 'badge-success' : 'badge-muted'}`} key="p">
              {x.can_generate_referral ? 'Enabled' : 'Disabled'}
            </span>,
            <span className="font-semibold" key="l">
              {x.referral_limit}
            </span>,
            <div className="flex gap-2" key={x.id}>
              <Btn
                kind="secondary"
                onClick={() =>
                  post({ action: 'toggle_referral_permission', target_id: x.id }).then(() => location.reload())
                }
              >
                Toggle
              </Btn>
              <Btn
                kind="secondary"
                onClick={() =>
                  post({ action: 'set_referral_limit', target_id: x.id, limit: prompt('Limit', x.referral_limit) }).then(
                    () => location.reload()
                  )
                }
              >
                Set limit
              </Btn>
            </div>,
          ])}
          empty="No members to manage."
        />
      </Box>
    </>
  );
}

/* ---------------- Server ---------------- */
function ServerView({ data }) {
  const [f, setF] = useState(data.settings);
  const toggles = ['ESP', 'Item', 'AIM', 'SilentAim', 'BulletTrack', 'Floating', 'Memory', 'Setting'];

  return (
    <>
      <PageHeader icon={Server} title="Server & Mod" subtitle="Configure mod features and maintenance." />

      <div className="space-y-5">
        <Box title="Mod details" icon={SettingsIcon}>
          <div className="grid gap-4 md:grid-cols-3">
            {['modname', 'mod_status', 'credit'].map((k) => (
              <label className="block" key={k}>
                <span className="mb-2 block text-sm font-medium capitalize">{k.replace('_', ' ')}</span>
                <input
                  className="input"
                  value={f[k] || ''}
                  placeholder={k}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </Box>

        <Box title="Features" desc="Toggle mod capabilities" icon={ShieldCheck}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {toggles.map((k) => {
              const on = f[k] === 'on';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setF({ ...f, [k]: on ? 'off' : 'on' })}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-sm font-medium transition ${
                    on
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-3)] text-[var(--muted)]'
                  }`}
                >
                  {k}
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                      on ? 'bg-[var(--primary)]' : 'bg-[var(--border-strong)]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                        on ? 'left-[1.15rem]' : 'left-0.5'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </Box>

        <Box title="Maintenance" desc="Take the server offline with a message" icon={AlertCircle}>
          <textarea
            className="textarea"
            placeholder="Maintenance reason"
            value={f.maintenance_reason ?? data.maintenance?.reason ?? ''}
            onChange={(e) => setF({ ...f, maintenance_reason: e.target.value })}
          />
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              defaultChecked={data.maintenance?.is_active === 1}
              onChange={(e) => setF({ ...f, maintenance_mode: e.target.checked })}
            />
            Enable maintenance mode
          </label>
          <button
            className="btn btn-primary mt-5"
            onClick={() => post({ action: 'save_server', ...f }).then(() => location.reload())}
          >
            <Check size={16} /> Save changes
          </button>
        </Box>
      </div>
    </>
  );
}

/* ---------------- Settings ---------------- */
function Settings({ data }) {
  const [f, setF] = useState({ panel_name: data.panel_name || '' });
  const [copied, setCopied] = useState(false);

  return (
    <>
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Manage your panel and account." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Box title="Connect token" desc="Use this token to link your app" icon={LockKeyhole}>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-3">
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-[var(--primary)]">{data.connect_token}</code>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(data.connect_token || '');
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </Box>

        <Box title="Panel name" icon={SettingsIcon}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Display name</span>
            <input
              className="input"
              value={f.panel_name}
              onChange={(e) => setF({ ...f, panel_name: e.target.value })}
              placeholder="Panel name"
            />
          </label>
          <button
            className="btn btn-primary mt-4"
            onClick={() => post({ action: 'panel_name', panel_name: f.panel_name }).then(() => location.reload())}
          >
            <Check size={16} /> Save name
          </button>
        </Box>

        <Box title="Change password" icon={LockKeyhole}>
          <div className="space-y-3">
            <input id="cp" className="input" type="password" placeholder="Current password" autoComplete="current-password" />
            <input id="np" className="input" type="password" placeholder="New password" autoComplete="new-password" />
            <button
              className="btn btn-primary"
              onClick={() =>
                post({
                  action: 'change_password',
                  current_password: document.getElementById('cp').value,
                  new_password: document.getElementById('np').value,
                })
                  .then(() => alert('Password changed'))
                  .catch((e) => alert(e.message))
              }
            >
              Update password
            </button>
          </div>
        </Box>
      </div>
    </>
  );
}

/* ---------------- AES ---------------- */
function AES({ data }) {
  const [f, setF] = useState(data);

  return (
    <>
      <PageHeader icon={LockKeyhole} title="AES Settings" subtitle="Configure encryption key and IV." />
      <div className="max-w-2xl">
        <Box title="Encryption" icon={LockKeyhole}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">AES key</span>
              <input
                className="input font-mono"
                value={f.aes_key || ''}
                onChange={(e) => setF({ ...f, aes_key: e.target.value })}
                placeholder="AES key"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">AES IV</span>
              <input
                className="input font-mono"
                value={f.aes_iv || ''}
                onChange={(e) => setF({ ...f, aes_iv: e.target.value })}
                placeholder="AES IV"
              />
            </label>
            <button
              className="btn btn-primary"
              onClick={() =>
                post({ action: 'save_aes', aes_key: f.aes_key, aes_iv: f.aes_iv }).then(() => location.reload())
              }
            >
              <Check size={16} /> Save
            </button>
          </div>
        </Box>
      </div>
    </>
  );
}

/* ---------------- Panels ---------------- */
function Panels({ rows }) {
  return (
    <>
      <PageHeader icon={Layers} title="Panel Manager" subtitle="Create and manage sub-panels." />

      <Box title="Create panel" icon={PlusCircle}>
        <div className="grid gap-3 md:grid-cols-3">
          <input id="pn" className="input" placeholder="Panel name" />
          <input id="pd" className="input" type="number" defaultValue="30" placeholder="Duration days" />
          <button
            className="btn btn-primary"
            onClick={() =>
              post({
                action: 'create_panel',
                panel_name: document.getElementById('pn').value,
                duration: document.getElementById('pd').value,
              }).then(() => location.reload())
            }
          >
            <PlusCircle size={16} /> Create
          </button>
        </div>
      </Box>

      <div className="h-5" />

      <Box title="Panels" desc={`${rows.length} total`} icon={Layers}>
        <Table
          cols={['Panel', 'Token', 'Expires', 'Users', 'Keys', 'Status', 'Actions']}
          rows={rows.map((x) => [
            <span className="font-mono font-semibold" key="p">
              {x.panel_code}
            </span>,
            <span className="font-mono text-xs text-[var(--muted)]" key="t">
              {x.connect_token}
            </span>,
            <span className="text-[var(--muted)]" key="e">
              {fmtDate(x.expires_at) || 'Lifetime'}
            </span>,
            x.total_users,
            x.total_keys,
            <span className={`badge ${x.is_active ? 'badge-success' : 'badge-danger'}`} key="s">
              {x.is_active ? 'Active' : 'Disabled'}
            </span>,
            <div className="flex gap-2" key={x.panel_code}>
              <Btn
                kind="secondary"
                onClick={() => post({ action: 'toggle_panel', panel_code: x.panel_code }).then(() => location.reload())}
              >
                Toggle
              </Btn>
              {x.panel_code !== 'YUVI_001' && (
                <Btn
                  kind="danger"
                  onClick={() =>
                    post({ action: 'delete_panel', panel_code: x.panel_code }).then(() => location.reload())
                  }
                >
                  <Trash2 size={14} />
                </Btn>
              )}
            </div>,
          ])}
          empty="No panels yet."
        />
      </Box>
    </>
  );
}

/* ---------------- Table ---------------- */
function Table({ cols, rows, empty = 'No records found.' }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="-mx-5 -mb-5 overflow-x-auto">
      <table className="table min-w-[720px]">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
