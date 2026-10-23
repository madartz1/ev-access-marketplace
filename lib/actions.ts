'use server';
import {db} from './db';
import {currentUser,setSession} from './auth';
import {hash,compare} from 'bcryptjs';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {partnerFields,vehicleFields,futureDate,purpose,rentalPeriod} from './validation';
const s=(f:FormData,k:string)=>String(f.get(k)||'').trim();
function fail(m:string):never{throw new Error(m)}
export async function register(f:FormData){
 const email=z.string().email().parse(s(f,'email').toLowerCase());
 const password=z.string().min(10).parse(s(f,'password'));
 const name=z.string().min(2).parse(s(f,'name'));
 if(await db.user.findUnique({where:{email}}))fail('Email already registered');
 const u=await db.user.create({data:{email,name,passwordHash:await hash(password,12)}});await setSession(u.id);redirect('/dashboard');
}
export async function login(f:FormData){
 const u=await db.user.findUnique({where:{email:s(f,'email').toLowerCase()}});
 if(!u||!(await compare(s(f,'password'),u.passwordHash)))fail('Invalid credentials');
 await setSession(u.id);redirect('/dashboard');
}
export async function logout(){const {cookies}=await import('next/headers');(await cookies()).delete('ev_session');redirect('/')}
export async function applyPartner(f:FormData){
 const u=await currentUser();if(!u)redirect('/login');
 if(await db.partner.findUnique({where:{userId:u.id}}))fail('Application already exists');
 partnerFields.parse(Object.fromEntries(['businessName','kind','contactName','phone','address','website','registrationNumber','insuranceCarrier','insurancePolicy','tlcFleetLicense'].map(k=>[k,s(f,k)])));
 const expires=futureDate.parse(s(f,'insuranceExpires'));
 await db.partner.create({data:{userId:u.id,businessName:s(f,'businessName'),kind:s(f,'kind'),contactName:s(f,'contactName'),phone:s(f,'phone'),address:s(f,'address'),website:s(f,'website')||null,registrationNumber:s(f,'registrationNumber'),insuranceCarrier:s(f,'insuranceCarrier'),insurancePolicy:s(f,'insurancePolicy'),insuranceExpires:expires,tlcFleetLicense:s(f,'tlcFleetLicense')||null}});
 redirect('/dashboard');
}
export async function addVehicle(f:FormData){
 const u=await currentUser();if(!u)redirect('/login');
 const p=await db.partner.findUnique({where:{userId:u.id}});
 if(!p||p.status!=='APPROVED')fail('Approved partner account required');
 vehicleFields.parse(Object.fromEntries(['make','model','plate','city','vehicleType','seats','rangeMiles','imageUrl','description','tlcPlate'].map(k=>[k,s(f,k)])));
 const insuranceExpires=futureDate.parse(s(f,'insuranceExpires')),registrationExpires=futureDate.parse(s(f,'registrationExpires'));
 if(p.insuranceExpires<=new Date())fail('Partner insurance has expired');
 if(!(insuranceExpires>new Date())||!(registrationExpires>new Date()))fail('Documents must be current');
 const year=z.coerce.number().int().min(2015).max(2035).parse(s(f,'year'));
 const rate=z.coerce.number().positive().max(10000).parse(s(f,'dailyRate'));
 await db.vehicle.create({data:{partnerId:p.id,make:s(f,'make'),model:s(f,'model'),year,vin:z.string().length(17).parse(s(f,'vin').toUpperCase()),plate:s(f,'plate'),vehicleType:s(f,'vehicleType'),seats:Number(s(f,'seats')),rangeMiles:Number(s(f,'rangeMiles')),dailyRateCents:Math.round(rate*100),city:s(f,'city'),imageUrl:s(f,'imageUrl')||null,description:s(f,'description')||null,tlcEligible:s(f,'tlcEligible')==='yes',tlcPlate:s(f,'tlcPlate')||null,insuranceExpires,registrationExpires}});
 revalidatePath('/vehicles');redirect('/dashboard');
}
export async function requestBooking(f:FormData){
 const u=await currentUser();if(!u)redirect('/login');
 const {start,end,days}=rentalPeriod(s(f,'startDate'),s(f,'endDate'));
 const useType=purpose.parse(s(f,'useType'));
 await db.$transaction(async tx=>{
 const v=await tx.vehicle.findUnique({where:{id:s(f,'vehicleId')},include:{partner:true}});
 if(!v||v.status!=='APPROVED'||v.partner.status!=='APPROVED')fail('Vehicle not available');
 if(v.insuranceExpires<end||v.registrationExpires<end||v.partner.insuranceExpires<end)fail('Documents must cover the rental period');
 if(useType.startsWith('Rideshare')&&(!v.tlcEligible||!v.tlcPlate||!v.partner.tlcFleetLicense))fail('TLC verification required');
 if(v.partner.userId===u.id)fail('Cannot rent your own vehicle');
 const overlap=await tx.booking.count({where:{vehicleId:v.id,status:{in:['REQUESTED','ACCEPTED']},startDate:{lt:end},endDate:{gt:start}}});
 if(overlap)fail('Vehicle has an overlapping request');
 await tx.booking.create({data:{customerId:u.id,vehicleId:v.id,startDate:start,endDate:end,estimatedTotalCents:days*v.dailyRateCents,useType}});
 },{isolationLevel:'Serializable'});
 redirect('/dashboard');
}
export async function reviewPartner(f:FormData){
 const u=await currentUser();if(u?.role!=='ADMIN')fail('Unauthorized');
 const id=s(f,'id'),status=z.enum(['APPROVED','REJECTED']).parse(s(f,'status'));
 if(status==='APPROVED'){const p=await db.partner.findUniqueOrThrow({where:{id}});if(p.insuranceExpires<=new Date())fail('Insurance has expired');}
 await db.partner.update({where:{id},data:{status}});revalidatePath('/admin');
}
export async function reviewVehicle(f:FormData){
 const u=await currentUser();if(u?.role!=='ADMIN')fail('Unauthorized');
 const id=s(f,'id'),status=z.enum(['APPROVED','REJECTED']).parse(s(f,'status'));
 if(status==='APPROVED'){const v=await db.vehicle.findUniqueOrThrow({where:{id},include:{partner:true}});if(v.partner.status!=='APPROVED'||v.partner.insuranceExpires<=new Date()||v.insuranceExpires<=new Date()||v.registrationExpires<=new Date())fail('Partner and current documents required');}
 await db.vehicle.update({where:{id},data:{status}});revalidatePath('/admin');revalidatePath('/vehicles');
}
export async function reviewBooking(f:FormData){
 const u=await currentUser();if(!u)fail('Unauthorized');
 const id=s(f,'id'),status=z.enum(['ACCEPTED','DECLINED']).parse(s(f,'status'));
 const b=await db.booking.findUnique({where:{id},include:{vehicle:{include:{partner:true}}}});
 if(!b||b.vehicle.partner.userId!==u.id||b.status!=='REQUESTED')fail('Unauthorized');
 if(status==='ACCEPTED'&&(b.vehicle.status!=='APPROVED'||b.vehicle.partner.status!=='APPROVED'||b.vehicle.insuranceExpires<b.endDate||b.vehicle.registrationExpires<b.endDate||b.vehicle.partner.insuranceExpires<b.endDate))fail('Approval and documents must remain current');
 const changed=await db.booking.updateMany({where:{id,status:'REQUESTED'},data:{status}});if(changed.count!==1)fail('Request was already reviewed');revalidatePath('/dashboard');
}
