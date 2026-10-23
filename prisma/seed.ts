import {db} from '../lib/db';
import {hash} from 'bcryptjs';
async function main(){
 const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();
 const password=process.env.ADMIN_PASSWORD;
 if(!email||!password||password.length<12)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters)');
 const existing=await db.user.findUnique({where:{email}});
 if(existing&&existing.role!=='ADMIN')throw Error('Refusing to promote an existing non-admin account; verify the owner identity first');
 await db.user.upsert({where:{email},update:{passwordHash:await hash(password,12)},create:{email,name:'EV Access Administrator',role:'ADMIN',passwordHash:await hash(password,12)}});
 console.log('Admin provisioned');
}
main().catch(()=>{console.error('Admin provisioning failed. Check private settings and owner account status.');process.exitCode=1}).finally(()=>db.$disconnect());
