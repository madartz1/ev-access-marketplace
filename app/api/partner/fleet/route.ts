import {z} from 'zod';
import {approvedFleet,limitedBody,sameOrigin} from '@/lib/fleet-access';
import {validateFleetRows,FLEET_LIMIT} from '@/lib/fleet-import';
import {db} from '@/lib/db';
import {revalidatePath} from 'next/cache';
export const runtime='nodejs';
const payload=z.object({rows:z.array(z.record(z.string(),z.string().max(5000))).min(1).max(FLEET_LIMIT),commit:z.boolean().default(false)});
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Open this form from EV Access.'},{status:403});
 const access=await approvedFleet();if(!access)return Response.json({error:'An approved fleet account with current insurance is required.'},{status:403});
 let input:z.infer<typeof payload>;
 try{input=payload.parse(JSON.parse((await limitedBody(request,512*1024)).toString('utf8')))}catch{return Response.json({error:'Choose a valid fleet file with 1–50 vehicles (maximum 256 KB CSV).'}, {status:400})}
 const {vehicles,issues}=validateFleetRows(input.rows,access.partner.id);if(issues.length)return Response.json({issues},{status:422});
 const existing=await db.vehicle.findMany({where:{OR:[{vin:{in:vehicles.map(v=>v.vin)}},{plate:{in:vehicles.map(v=>v.plate)}}]},select:{vin:true,plate:true}});
 const conflicts=vehicles.flatMap((v,i)=>existing.some(e=>e.vin===v.vin||e.plate===v.plate)?[{row:i+2,message:'VIN or plate is already listed. No changes were saved.'}]:[]);
 if(conflicts.length)return Response.json({issues:conflicts},{status:409});
 if(!input.commit)return Response.json({valid:true,count:vehicles.length});
 try{const count=await db.$transaction(async tx=>{const partner=await tx.partner.findUnique({where:{id:access.partner.id}});if(partner?.status!=='APPROVED'||partner.insuranceExpires<=new Date())throw Error('Fleet approval and current insurance required.');return (await tx.vehicle.createMany({data:vehicles})).count},{isolationLevel:'Serializable'});revalidatePath('/dashboard');revalidatePath('/admin');return Response.json({count,status:'PENDING'},{status:201})}catch{return Response.json({error:'No vehicles were saved. Your fleet status may have changed, or a VIN/plate was just submitted. Review the file and try again.'},{status:409})}
}
