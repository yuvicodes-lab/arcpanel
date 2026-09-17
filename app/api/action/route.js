import { NextResponse } from 'next/server';
import { query, db } from '../../../lib/db';
import { getSession, randomKey } from '../../../lib/auth';
import { clean } from '../../../lib/security';
import bcrypt from 'bcryptjs';

const pricing = {
  '2': 10,
  '2H': 10,
  '1D': 80,
  '3D': 150,
  '7D': 250,
  '15D': 350,
  '30D': 500,
  '60D': 900,
};

async function session() {
  const s = await getSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}

export async function POST(req) {
  try {
    const s = await session();
    const b = await req.json();
    const a = b.action;
    const pc = s.panel_code;
    const id = s.id;
    const role = s.role;

    if (a === 'generate_keys') {
      const duration = clean(b.duration);
      const limit = Math.max(1, Number(b.device_limit) || 1);
      const amount = Math.max(1, Number(b.amount) || 1);
      const unitCost = pricing[duration] || 10;
      const totalCost = unitCost * limit * amount;

      if (!pricing[duration]) {
        return NextResponse.json({ error: 'Invalid duration.' }, { status: 400 });
      }

      const c = await db().getConnection();
      const keys = [];

      try {
        await c.beginTransaction();

        if (role !== 'OWNER') {
          const result = await c.execute(
            'UPDATE users SET balance=balance-? WHERE id=? AND panel_code=? AND balance>=? AND is_blocked=0',
            [totalCost, id, pc, totalCost]
          );
          if (result.rowCount !== 1) throw new Error('Insufficient balance.');
        }

        for (let i = 0; i < amount; i++) {
          const custom = clean(b.custom_key || '').toUpperCase();
          const key = custom && amount === 1 ? custom : duration + '-' + randomKey();

          try {
            await c.execute(
              'INSERT INTO api_keys (key_value,duration,device_limit,panel_code,created_by) VALUES (?,?,?,?,?)',
              [key, duration, limit, pc, id]
            );
            keys.push(key);
          } catch (e) {
            if (custom && amount === 1) throw new Error('Custom key already exists.');
            throw e;
          }
        }

        await c.commit();
      } catch (e) {
        await c.rollback();
        throw e;
      } finally {
        c.release();
      }

      return NextResponse.json({ keys });
    }

    if (a === 'toggle_key' || a === 'delete_key' || a === 'reset_device') {
      const k = (
        await query(
          'SELECT k.*,u.invited_by FROM api_keys k LEFT JOIN users u ON k.created_by=u.id WHERE k.id=? AND k.panel_code=?',
          [Number(b.key_id), pc]
        )
      )[0];

      if (!k) return NextResponse.json({ error: 'Key not found.' }, { status: 404 });

      if (
        !(
          role === 'OWNER' ||
          k.created_by === id ||
          (role === 'ADMIN' && k.invited_by === id)
        )
      ) {
        return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
      }

      if (a === 'toggle_key') {
        await query(
          'UPDATE api_keys SET is_blocked=CASE WHEN is_blocked=1 THEN 0 ELSE 1 END WHERE id=?',
          [k.id]
        );
      }
      if (a === 'delete_key') {
        await query('DELETE FROM api_keys WHERE id=?', [k.id]);
      }
      if (a === 'reset_device') {
        await query('DELETE FROM key_devices WHERE key_id=? AND panel_code=?', [k.id, pc]);
      }

      return NextResponse.json({ ok: true });
    }

    if (['toggle_user', 'add_balance', 'deduct_balance'].includes(a)) {
      const t = (
        await query(
          'SELECT id,role,balance,invited_by,username FROM users WHERE id=? AND panel_code=?',
          [Number(b.target_id), pc]
        )
      )[0];

      if (!t) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

      const can =
        role === 'OWNER' ||
        (role === 'ADMIN' && t.role === 'RESELLER' && t.invited_by === id);

      if (!can) return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });

      if (a === 'toggle_user' && t.id !== id) {
        await query(
          'UPDATE users SET is_blocked=CASE WHEN is_blocked=1 THEN 0 ELSE 1 END WHERE id=?',
          [t.id]
        );
      }
      if (a === 'add_balance') {
        await query('UPDATE users SET balance=balance+? WHERE id=?', [
          Math.max(1, Number(b.amount)),
          t.id,
        ]);
      }
      if (a === 'deduct_balance') {
        const amt = Math.max(1, Number(b.amount));
        if (Number(t.balance) < amt) {
          return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
        }
        await query('UPDATE users SET balance=balance-? WHERE id=?', [amt, t.id]);
      }

      return NextResponse.json({ ok: true });
    }

    if (a === 'generate_referral') {
      const target = clean(b.role).toUpperCase();
      const duration = Math.max(1, Number(b.duration) || 1);
      const balance = Math.max(0, Number(b.balance) || 0);

      if (!['ADMIN', 'RESELLER'].includes(target)) {
        return NextResponse.json({ error: 'Invalid referral role.' }, { status: 400 });
      }

      if (role !== 'OWNER' && target !== 'RESELLER') {
        return NextResponse.json({ error: 'Unauthorized role assignment.' }, { status: 403 });
      }

      if (role !== 'OWNER') {
        const u = (
          await query('SELECT can_generate_referral,referral_limit FROM users WHERE id=?', [id])
        )[0];

        if (!u?.can_generate_referral) {
          return NextResponse.json(
            { error: 'Referral generation access blocked.' },
            { status: 403 }
          );
        }

        const countResult = await query(
          'SELECT COUNT(*) c FROM referrals WHERE created_by=? AND panel_code=?',
          [id, pc]
        );

        if (
          Number(u.referral_limit) > 0 &&
          Number(countResult[0].c) >= Number(u.referral_limit)
        ) {
          return NextResponse.json({ error: 'Referral limit reached.' }, { status: 400 });
        }
      }

      const code = 'REF-' + randomKey(4);
      await query(
        'INSERT INTO referrals (code,role,duration,balance,panel_code,created_by) VALUES (?,?,?,?,?,?)',
        [code, target, duration, balance, pc, id]
      );

      return NextResponse.json({ code });
    }

    if (a === 'delete_referral') {
      const where =
        role === 'OWNER'
          ? 'DELETE FROM referrals WHERE code=? AND panel_code=?'
          : 'DELETE FROM referrals WHERE code=? AND panel_code=? AND created_by=?';

      await query(
        where,
        role === 'OWNER' ? [clean(b.code), pc] : [clean(b.code), pc, id]
      );

      return NextResponse.json({ ok: true });
    }

    if (a === 'toggle_referral_permission' || a === 'set_referral_limit') {
      if (!['OWNER', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const t = (
        await query(
          'SELECT role FROM users WHERE id=? AND panel_code=? AND id!=?',
          [Number(b.target_id), pc, id]
        )
      )[0];

      if (!t) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

      if (a === 'toggle_referral_permission') {
        await query(
          'UPDATE users SET can_generate_referral=CASE WHEN can_generate_referral=1 THEN 0 ELSE 1 END WHERE id=?',
          [Number(b.target_id)]
        );
      } else {
        await query('UPDATE users SET referral_limit=? WHERE id=?', [
          Math.max(0, Number(b.limit) || 0),
          Number(b.target_id),
        ]);
      }

      return NextResponse.json({ ok: true });
    }

    if (a === 'save_server') {
      if (!['OWNER', 'ADMIN'].includes(role)) throw new Error('Access denied');

      await query(
        'INSERT INTO mod_maintenance (panel_code,is_active,reason) VALUES (?,?,?) ON CONFLICT (panel_code) DO UPDATE SET is_active=EXCLUDED.is_active,reason=EXCLUDED.reason',
        [pc, b.maintenance_mode ? 1 : 0, clean(b.maintenance_reason || '')]
      );

      const modKeys = [
        'modname',
        'mod_status',
        'credit',
        'ESP',
        'Item',
        'AIM',
        'SilentAim',
        'BulletTrack',
        'Floating',
        'Memory',
        'Setting',
      ];

      for (const k of modKeys) {
        await query(
          'INSERT INTO mod_settings (setting_name,setting_value,panel_code) VALUES (?,?,?) ON CONFLICT (setting_name,panel_code) DO UPDATE SET setting_value=EXCLUDED.setting_value',
          [k, clean(b[k] ?? 'off'), pc]
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (a === 'save_aes') {
      if (!['OWNER', 'ADMIN'].includes(role)) throw new Error('Access denied');

      for (const [k, v] of [
        ['aes_key', b.aes_key],
        ['aes_iv', b.aes_iv],
      ]) {
        await query(
          'INSERT INTO mod_settings (setting_name,setting_value,panel_code) VALUES (?,?,?) ON CONFLICT (setting_name,panel_code) DO UPDATE SET setting_value=EXCLUDED.setting_value',
          [k, clean(v || ''), pc]
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (a === 'panel_name') {
      await query(
        'INSERT INTO mod_settings (setting_name,setting_value,panel_code) VALUES (?,?,?) ON CONFLICT (setting_name,panel_code) DO UPDATE SET setting_value=EXCLUDED.setting_value',
        ['panel_name', clean(b.panel_name || ''), pc]
      );

      return NextResponse.json({ ok: true });
    }

    if (a === 'change_password') {
      const u = (await query('SELECT password FROM users WHERE id=?', [id]))[0];

      if (!u || !(await bcrypt.compare(String(b.current_password || ''), u.password))) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }

      await query('UPDATE users SET password=? WHERE id=?', [
        await bcrypt.hash(String(b.new_password || ''), 12),
        id,
      ]);

      return NextResponse.json({ ok: true });
    }

    if (a === 'create_panel') {
      if (id !== 1 || role !== 'OWNER') throw new Error('Access denied');

      const prefix =
        clean(b.panel_name || 'PNL')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8) || 'PNL';

      const panel = prefix + '_' + randomKey(3);
      const token = 'YV' + randomKey(3).slice(0, 6);
      const duration = Math.max(1, Number(b.duration) || 30);

      await query(
        'INSERT INTO panels (panel_code,connect_token,duration,expires_at) VALUES (?,?,?,?)',
        [panel, token, duration, new Date(Date.now() + duration * 86400000)]
      );

      return NextResponse.json({ panel_code: panel, connect_token: token });
    }

    if (a === 'toggle_panel') {
      if (id !== 1 || role !== 'OWNER') throw new Error('Access denied');

      await query(
        "UPDATE panels SET is_active=NOT is_active WHERE panel_code=? AND panel_code!='YUVI_001'",
        [clean(b.panel_code)]
      );

      return NextResponse.json({ ok: true });
    }

    if (a === 'delete_panel') {
      if (id !== 1 || role !== 'OWNER') throw new Error('Access denied');

      const p = clean(b.panel_code);
      if (p === 'YUVI_001') throw new Error('Protected panel');

      const c = await db().getConnection();
      try {
        await c.beginTransaction();

        for (const t of ['key_devices', 'api_keys', 'users']) {
          await c.execute(`DELETE FROM ${t} WHERE panel_code=?`, [p]);
        }

        await c.execute('DELETE FROM panels WHERE panel_code=?', [p]);
        await c.commit();
      } catch (e) {
        await c.rollback();
        throw e;
      } finally {
        c.release();
      }

      return NextResponse.json({ ok: true });
    }

    if (a === 'join_panel') {
      const p = clean(b.panel_code);
      const panel = (
        await query('SELECT * FROM panels WHERE panel_code=? AND is_active=1', [p])
      )[0];

      if (!panel) return NextResponse.json({ error: 'Invalid panel code.' }, { status: 400 });

      if (
        (
          await query("SELECT id FROM users WHERE panel_code=? AND role='OWNER'", [p])
        )[0]
      ) {
        return NextResponse.json({ error: 'Panel already claimed.' }, { status: 400 });
      }

      if (
        (
          await query('SELECT id FROM users WHERE username=?', [clean(b.username)])
        )[0]
      ) {
        return NextResponse.json({ error: 'Username already exists globally.' }, { status: 400 });
      }

      await query(
        "INSERT INTO users (full_name,username,password,role,balance,validity,panel_code) VALUES (?,?,?,'OWNER',999999,?,?)",
        [
          clean(b.full_name),
          clean(b.username),
          await bcrypt.hash(String(b.password || ''), 12),
          panel.expires_at,
          p,
        ]
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 400 });
  }
}
