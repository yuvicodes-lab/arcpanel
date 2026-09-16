import {getSession} from '../lib/auth';import {redirect} from 'next/navigation';import Panel from './Panel';
export default async function Protected({view,children}){const s=await getSession();if(!s)redirect('/login');return <Panel view={view}>{children}</Panel>}
