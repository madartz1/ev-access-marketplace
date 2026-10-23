import { cookies } from 'next/headers';
import { SignJWT,jwtVerify } from 'jose';
import { db } from './db';
const key=()=>{const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('SESSION_SECRET must contain at least 32 characters');return new TextEncoder().encode(secret)};
export async function currentUser(){
 const token=(await cookies()).get('ev_session')?.value;if(!token||!process.env.SESSION_SECRET)return null;
 try{const {payload}=await jwtVerify(token,key(),{algorithms:['HS256']});if(typeof payload.sub!=='string')return null;
 return await db.user.findUnique({where:{id:payload.sub},select:{id:true,email:true,name:true,role:true}})}catch{return null}
}
export async function setSession(id:string){
 const token=await new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuedAt().setExpirationTime('7d').sign(key());
 (await cookies()).set('ev_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:604800});
}
