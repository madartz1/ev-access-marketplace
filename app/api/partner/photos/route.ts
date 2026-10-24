import {approvedFleet,limitedBody,sameOrigin} from '@/lib/fleet-access';
import {photoStore,prepareVehiclePhoto,PHOTO_MAX} from '@/lib/vehicle-photos';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Open this form from EV Access.'},{status:403});
 const access=await approvedFleet();if(!access)return Response.json({error:'An approved fleet account with current insurance is required.'},{status:403});
 let bytes:ArrayBuffer;
 try{const body=await limitedBody(request,PHOTO_MAX+128*1024);const form=await new Response(body,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();const file=form.get('photo');if(!(file instanceof File))throw Error('Choose a vehicle photo.');bytes=await prepareVehiclePhoto(file)}catch(e){return Response.json({error:e instanceof Error?e.message:'Photo could not be read.'},{status:400})}
 const id=randomUUID()+'.webp',key=access.partner.id+'/'+id;
 try{await photoStore().set(key,bytes,{onlyIfNew:true,metadata:{partnerId:access.partner.id,contentType:'image/webp',uploadedAt:new Date().toISOString()}})}catch{console.error('Vehicle photo storage unavailable');return Response.json({error:'Photo storage is temporarily unavailable. Please try again.'},{status:503})}
 return Response.json({url:'/api/vehicle-photos/'+key},{status:201});
}
