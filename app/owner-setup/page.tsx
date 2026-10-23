import {ownerSetupEnabled} from '@/lib/owner-setup';
import {setupOwner} from '@/lib/owner-actions';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Owner setup | EV Access',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 if(!ownerSetupEnabled())return <div className="card formwrap"><h1>Owner setup is closed</h1><p>Use your administrator account to sign in. Initial setup must be enabled privately by the project owner.</p><Link className="button" href="/login">Log in</Link></div>;
 const errors:Record<string,string>={authorization:'Setup authorization was not accepted.',details:'Enter a valid email, name, and a password of 12–72 characters.',closed:'Setup cannot create this account. Sign in if you already have an administrator account.',unavailable:'Setup could not finish. Please try again later.'};
 return <div className="card formwrap"><h1>Set up EV Access</h1><p>Create the first administrator account using your private setup key.</p>{error&&<p role="alert">{errors[error]||'Unable to complete setup.'}</p>}<form action={setupOwner}><label>Private setup key<input name="setupToken" type="password" required autoComplete="off"/></label><label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name"/></label><label>Administrator email<input name="email" type="email" required maxLength={254} autoComplete="username"/></label><label>Password<input name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password"/></label><button>Create administrator account</button></form><p className="muted">Use a unique password. Keep your setup key private.</p></div>;
}
