import crypto from 'crypto';
import {cookies} from 'next/headers';
const secret=()=>process.env.SESSION_SECRET||'development-secret';
function sign(v){return crypto.createHmac('sha256',secret()).update(v).digest('hex')}
export async function setSession(user){const value=Buffer.from(JSON.stringify(user)).toString('base64url');(await cookies()).set('yuvi_session',value+'.'+sign(value),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30})}
export async function getSession(){const c=(await cookies()).get('yuvi_session')?.value;if(!c)return null;const [v,s]=c.split('.');if(!v||!s||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(sign(v))))return null;try{return JSON.parse(Buffer.from(v,'base64url').toString())}catch{return null}}
export async function clearSession(){(await cookies()).delete('yuvi_session')}
export function csrf(){return crypto.randomBytes(24).toString('hex')}
export function randomKey(n=12){return crypto.randomBytes(n).toString('hex').toUpperCase().slice(0,12)}
