import {NextResponse} from 'next/server';
import {query} from '../../../lib/db';
import {getSession} from '../../../lib/auth';

export async function GET(req){
  const s = await getSession();
  if(!s) return NextResponse.json({error:'Unauthorized'},{status:401});
  const view = new URL(req.url).searchParams.get('view')||'dashboard';
  const pc = s.panel_code, id = s.id, role = s.role;
  try {
    if(view==='me'){
      const u = (await query('SELECT id,full_name,username,role,balance,panel_code,is_blocked FROM users WHERE id=?',[id]))[0];
      return NextResponse.json(u);
    }
    if(view==='dashboard'){
      let stats;
      if(role==='OWNER') {
        stats = (await query(`SELECT (SELECT COUNT(*) FROM users WHERE panel_code=? AND role='ADMIN') total_admins,(SELECT COUNT(*) FROM users WHERE panel_code=? AND role='RESELLER') total_resellers,(SELECT COUNT(*) FROM api_keys WHERE panel_code=?) total_keys,(SELECT COUNT(*) FROM api_keys k JOIN users u ON k.created_by=u.id WHERE k.panel_code=? AND u.role='ADMIN') admin_keys,(SELECT COUNT(*) FROM api_keys k JOIN users u ON k.created_by=u.id WHERE k.panel_code=? AND u.role='RESELLER') reseller_keys`,[pc,pc,pc,pc,pc]))[0];
      } else if(role==='ADMIN') {
        stats = (await query(`SELECT (SELECT COUNT(*) FROM users WHERE panel_code=? AND role='RESELLER' AND invited_by=?) my_resellers,(SELECT COUNT(*) FROM api_keys WHERE panel_code=? AND created_by=?) my_keys,(SELECT COUNT(*) FROM api_keys k JOIN users u ON k.created_by=u.id WHERE k.panel_code=? AND u.role='RESELLER' AND u.invited_by=?) my_reseller_keys`,[pc,id,pc,id,pc,id]))[0];
      } else {
        stats = (await query(`SELECT (SELECT COUNT(*) FROM api_keys WHERE panel_code=? AND created_by=?) my_keys,(SELECT COUNT(*) FROM api_keys WHERE panel_code=? AND created_by=? AND is_blocked=0) my_active_keys`,[pc,id,pc,id]))[0];
      }
      return NextResponse.json({stats});
    }
    if(view==='keys'){
      let sql = `SELECT k.id,k.key_value,k.duration,k.device_limit,k.uses,k.expires_at,k.is_blocked,(SELECT COUNT(*) FROM key_devices kd WHERE kd.key_id=k.id) current_devices,u.username creator_name,u.role creator_role FROM api_keys k LEFT JOIN users u ON k.created_by=u.id WHERE k.panel_code=?`;
      let ps = [pc];
      if(role==='ADMIN'){
        sql += ' AND (k.created_by=? OR u.invited_by=?)';
        ps.push(id, id);
      } else if(role==='RESELLER'){
        sql += ' AND k.created_by=?';
        ps.push(id);
      }
      sql += ' ORDER BY k.id DESC LIMIT 200';
      return NextResponse.json({rows: await query(sql, ps)});
    }
    if(view==='users'){
      let sql = `SELECT u.id,u.full_name,u.username,u.role,u.balance,u.validity,u.is_blocked,inv.username invited_by_name FROM users u LEFT JOIN users inv ON u.invited_by=inv.id WHERE u.panel_code=?`;
      let ps = [pc];
      if(role==='ADMIN') {
        sql += ` AND (u.id=? OR (u.role='RESELLER' AND u.invited_by=?))`;
        ps.push(id, id);
      } else if(role==='RESELLER') {
        sql += ` AND u.id=?`;
        ps.push(id);
      }
      sql += ` ORDER BY u.id DESC`;
      return NextResponse.json({rows: await query(sql, ps), me:{id, role}});
    }
    if(view==='admins'){
      if(role!=='OWNER') return NextResponse.json({error:'Access denied'},{status:403});
      const rows = await query(`SELECT u.id,u.full_name,u.username,u.role,u.balance,u.is_blocked,(SELECT COUNT(*) FROM api_keys k WHERE k.created_by=u.id AND k.panel_code=u.panel_code) total_keys FROM users u WHERE u.panel_code=? AND u.id!=? AND u.role IN ('ADMIN','RESELLER') ORDER BY u.role ASC,u.id DESC`,[pc, id]);
      return NextResponse.json({rows});
    }
    if(view==='referral'){
      let sql = `SELECT r.*,u.username creator_name FROM referrals r LEFT JOIN users u ON r.created_by=u.id WHERE r.panel_code=?`;
      let ps = [pc];
      if(role!=='OWNER') {
        sql += ` AND r.created_by=?`;
        ps.push(id);
      }
      sql += ` ORDER BY r.used ASC,r.code DESC`;
      return NextResponse.json({rows: await query(sql, ps), me:{id, role}});
    }
    if(view==='permissions'){
      if(!['OWNER','ADMIN'].includes(role)) return NextResponse.json({error:'Access denied'},{status:403});
      const rows = await query(`SELECT id,full_name,username,role,referral_limit,can_generate_referral FROM users WHERE panel_code=? AND id!=? AND role IN ('ADMIN','RESELLER') ORDER BY role ASC,id DESC`,[pc, id]);
      return NextResponse.json({rows});
    }
    if(view==='server'){
      if(!['OWNER','ADMIN'].includes(role)) return NextResponse.json({error:'Access denied'},{status:403});
      const m = (await query('SELECT is_active,reason FROM mod_maintenance WHERE panel_code=?',[pc]))[0]||{};
      const a = await query('SELECT setting_name,setting_value FROM mod_settings WHERE panel_code=?',[pc]);
      const settings = Object.fromEntries(a.map(x=>[x.setting_name, x.setting_value]));
      return NextResponse.json({maintenance: m, settings});
    }
    if(view==='settings'){
      const p = (await query('SELECT connect_token FROM panels WHERE panel_code=?',[pc]))[0]||{};
      const a = (await query(`SELECT setting_name,setting_value FROM mod_settings WHERE panel_code=? AND setting_name='panel_name'`,[pc]))[0];
      return NextResponse.json({connect_token: p.connect_token, panel_name: a?.setting_value||''});
    }
    if(view==='aes'){
      if(!['OWNER','ADMIN'].includes(role)) return NextResponse.json({error:'Access denied'},{status:403});
      const a = await query(`SELECT setting_name,setting_value FROM mod_settings WHERE panel_code=? AND setting_name IN ('aes_key','aes_iv')`,[pc]);
      return NextResponse.json(Object.fromEntries(a.map(x=>[x.setting_name, x.setting_value])));
    }
    if(view==='create-panel'){
      if(id!==1 || role!=='OWNER') return NextResponse.json({error:'Access denied'},{status:403});
      const rows = await query(`SELECT p.*,(SELECT COUNT(*) FROM users u WHERE u.panel_code=p.panel_code) total_users,(SELECT COUNT(*) FROM api_keys k WHERE k.panel_code=p.panel_code) total_keys FROM panels p ORDER BY p.is_active DESC,p.panel_code ASC`);
      return NextResponse.json({rows});
    }
    return NextResponse.json({error:'Unknown view'},{status:404});
  } catch(e) {
    console.error(e);
    return NextResponse.json({error:'Database error'},{status:500});
  }
}
