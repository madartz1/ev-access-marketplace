import Link from 'next/link';
import {rentalReturnPath} from '@/lib/return-path';
import {login} from '@/lib/actions';
export default async function Page({searchParams}:{searchParams:Promise<{ownerSetup?:string;returnTo?:string}>}){
 const {ownerSetup,returnTo}=await searchParams;const next=rentalReturnPath(returnTo);
 return <div className="formwrap card"><h1>Welcome back</h1>{ownerSetup==='complete'&&<p role="status">Your administrator account is ready. Log in with the password you just chose.</p>}<form action={login}><input type="hidden" name="returnTo" value={next}/><label>Email<input type="email" name="email" required autoComplete="username"/></label><label>Password<input type="password" name="password" required autoComplete="current-password"/></label><button>Log in</button></form><p className="muted">New to EV Access? <Link href={'/register?returnTo='+encodeURIComponent(next)}>Create an account</Link></p></div>;
}
