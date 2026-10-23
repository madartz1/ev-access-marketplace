import {randomBytes,randomUUID} from 'node:crypto';
import {beforeAll,afterAll,test,expect,vi} from 'vitest';
const cookies=vi.hoisted(()=>new Map<string,string>());
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>cookies.has(key)?{value:cookies.get(key)}:undefined,set:(key:string,value:string)=>cookies.set(key,value),delete:(key:string)=>cookies.delete(key)})}));
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw Error('REDIRECT '+path)}}));
vi.mock('next/cache',()=>({revalidatePath:()=>{}}));

let db:typeof import('../lib/db').db;
let actions:typeof import('../lib/actions');
let auth:typeof import('../lib/auth');
const form=(data:Record<string,string>)=>{const f=new FormData();Object.entries(data).forEach(([key,value])=>f.set(key,value));return f;};
async function redirected(call:Promise<unknown>,path='/dashboard'){await expect(call).rejects.toThrow('REDIRECT '+path);}
beforeAll(async()=>{
 const url=process.env.TEST_DATABASE_URL;
 const expectedHost=process.env.TEST_DATABASE_HOST;
 if(process.env.RUN_ISOLATED_DATABASE_TESTS!=='yes'||!url||!expectedHost)throw Error('Set TEST_DATABASE_URL, TEST_DATABASE_HOST and RUN_ISOLATED_DATABASE_TESTS=yes for an isolated database branch.');
 const host=new URL(url).hostname.replace('-pooler.','.');
 if(host!==expectedHost.replace('-pooler.','.'))throw Error('Test database host does not match the confirmed isolated endpoint.');
 if(process.env.DATABASE_URL&&new URL(process.env.DATABASE_URL).hostname.replace('-pooler.','.')===host)throw Error('Refusing to test against the configured application database.');
 process.env.DATABASE_URL=url;
 process.env.SESSION_SECRET=randomBytes(48).toString('base64url');
 ({db}=await import('../lib/db'));
 actions=await import('../lib/actions');auth=await import('../lib/auth');
 await db.$queryRaw`SELECT 1`;
});
afterAll(async()=>{if(db)await db.$disconnect();});

test('real account, admin, fleet, listing and concurrent booking flow',async()=>{
 const run=randomUUID().replaceAll('-','');
 const password=randomBytes(24).toString('base64url');
 const customerEmail=`customer-${run}@ev-access-test.invalid`;
 await redirected(actions.register(form({email:customerEmail,name:'Live Test Customer',password})));
 const customer=await auth.currentUser();expect(customer?.role).toBe('CUSTOMER');
 const customerToken=cookies.get('ev_session')!;
 await redirected(actions.logout(),'/');expect(await auth.currentUser()).toBe(null);
 await redirected(actions.login(form({email:customerEmail,password})));expect((await auth.currentUser())?.id).toBe(customer!.id);
 await expect(actions.reviewPartner(form({id:'absent',status:'APPROVED'}))).rejects.toThrow('Unauthorized');
 await redirected(actions.register(form({email:`fleet-${run}@ev-access-test.invalid`,name:'Live Test Fleet',password})));
 const fleetUser=await auth.currentUser();const fleetToken=cookies.get('ev_session')!;
 const future=new Date();future.setUTCFullYear(future.getUTCFullYear()+2);const expires=future.toISOString().slice(0,10);
 await redirected(actions.applyPartner(form({businessName:'Live Test Fleet',kind:'Rental fleet',contactName:'Test Contact',phone:'0000000000',address:'Test-only branch',website:'',registrationNumber:run,insuranceCarrier:'Test Insurer',insurancePolicy:run,insuranceExpires:expires,tlcFleetLicense:''})));
 const partner=await db.partner.findUniqueOrThrow({where:{userId:fleetUser!.id}});expect(partner.status).toBe('PENDING');
 await expect(actions.addVehicle(form({}))).rejects.toThrow('Approved partner');
 const admin=await db.user.create({data:{name:'Isolated Test Admin',email:`admin-${run}@ev-access-test.invalid`,passwordHash:'disabled-test-password',role:'ADMIN'}});
 await auth.setSession(admin.id);const adminToken=cookies.get('ev_session')!;
 await actions.reviewPartner(form({id:partner.id,status:'APPROVED'}));
 cookies.set('ev_session',fleetToken);
 await redirected(actions.addVehicle(form({make:'Test',model:'EV',year:'2026',vin:('TEST'+run).slice(0,17).toUpperCase(),plate:run.slice(0,12),vehicleType:'Car',seats:'5',rangeMiles:'250',dailyRate:'90',city:'Queens',imageUrl:'',description:'Isolated integration test only',tlcEligible:'no',tlcPlate:'',insuranceExpires:expires,registrationExpires:expires})));
 const vehicle=await db.vehicle.findFirstOrThrow({where:{partnerId:partner.id}});expect(vehicle.status).toBe('PENDING');
 cookies.set('ev_session',adminToken);await actions.reviewVehicle(form({id:vehicle.id,status:'APPROVED'}));
 cookies.set('ev_session',customerToken);
 const start=new Date();start.setUTCDate(start.getUTCDate()+10);const end=new Date(start);end.setUTCDate(end.getUTCDate()+3);
 const request=()=>actions.requestBooking(form({vehicleId:vehicle.id,startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10),useType:'Personal use'}));
 const results=await Promise.allSettled([request(),request()]);
 expect(results.filter(r=>r.status==='rejected'&&String(r.reason).includes('REDIRECT /dashboard'))).toHaveLength(1);
 expect(await db.booking.count({where:{vehicleId:vehicle.id}})).toBe(1);
 const booking=await db.booking.findFirstOrThrow({where:{vehicleId:vehicle.id}});expect(booking.estimatedTotalCents).toBe(27000);
 await expect(actions.reviewBooking(form({id:booking.id,status:'ACCEPTED'}))).rejects.toThrow('Unauthorized');
 cookies.set('ev_session',fleetToken);await actions.reviewBooking(form({id:booking.id,status:'ACCEPTED'}));
 expect((await db.booking.findUniqueOrThrow({where:{id:booking.id}})).status).toBe('ACCEPTED');
 // Data remains only in the isolated branch. Use a short-lived branch for each run.
});
