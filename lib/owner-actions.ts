'use server';
import {db} from './db';
import {hash} from 'bcryptjs';
import {redirect} from 'next/navigation';
import {ownerDetails,verifyOwnerSetupToken} from './owner-setup';
export async function setupOwner(form:FormData){
 if(!verifyOwnerSetupToken(String(form.get('setupToken')||'')))redirect('/owner-setup?error=authorization');
 const parsed=ownerDetails.safeParse({email:form.get('email'),name:form.get('name'),password:form.get('password')});
 if(!parsed.success)redirect('/owner-setup?error=details');
 const {email,name,password}=parsed.data;
 const passwordHash=await hash(password,12);
 let completed=false;
 try {
  completed=await db.$transaction(async tx=>{
   if(await tx.user.count({where:{role:'ADMIN'}}))return false;
   // Never promote an account registered through the public signup page.
   if(await tx.user.findUnique({where:{email}}))return false;
   await tx.user.create({data:{email,name,passwordHash,role:'ADMIN'}});
   return true;
  },{isolationLevel:'Serializable'});
 } catch {redirect('/owner-setup?error=unavailable');}
 if(!completed)redirect('/owner-setup?error=closed');
 redirect('/login?ownerSetup=complete');
}
