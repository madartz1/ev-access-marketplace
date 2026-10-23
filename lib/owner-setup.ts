import {timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
export function ownerSetupEnabled(){return typeof process.env.OWNER_SETUP_TOKEN==='string'&&process.env.OWNER_SETUP_TOKEN.length>=32;}
export function verifyOwnerSetupToken(candidate:string){
 if(!ownerSetupEnabled())return false;
 const expected=Buffer.from(process.env.OWNER_SETUP_TOKEN!);
 const supplied=Buffer.from(candidate);
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
export const ownerDetails=z.object({
 email:z.string().trim().email().max(254).transform(s=>s.toLowerCase()),
 name:z.string().trim().min(2).max(100),
 password:z.string().min(12).max(72),
});
