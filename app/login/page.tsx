import {login} from '@/lib/actions';
export default async function Page({searchParams}:{searchParams:Promise<{ownerSetup?:string}>}){
 const {ownerSetup}=await searchParams;
 return <div className="formwrap card"><h1>Welcome back</h1>{ownerSetup==='complete'&&<p role="status">Your administrator account is ready. Log in with the password you just chose.</p>}<form action={login}><label>Email<input type="email" name="email" required autoComplete="username"/></label><label>Password<input type="password" name="password" required autoComplete="current-password"/></label><button>Log in</button></form></div>;
}
