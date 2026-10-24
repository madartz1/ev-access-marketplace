import {photoStore} from '@/lib/vehicle-photos';
import {ownedPhotoPattern} from '@/lib/fleet-import';
import {currentUser} from '@/lib/auth';
import {db} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{partnerId:string;photoId:string}>}){
 const {partnerId,photoId}=await params,url='/api/vehicle-photos/'+partnerId+'/'+photoId;
 if(!ownedPhotoPattern.test(url))return new Response('Not found',{status:404});
 const now=new Date();const published=await db.vehicle.findFirst({where:{partnerId,imageUrl:url,status:'APPROVED',insuranceExpires:{gt:now},registrationExpires:{gt:now},partner:{status:'APPROVED',insuranceExpires:{gt:now}}},select:{id:true}});
 if(!published){const user=await currentUser();if(!user)return new Response('Not found',{status:404});if(user.role!=='ADMIN'){const owner=await db.partner.findUnique({where:{id:partnerId},select:{userId:true}});if(owner?.userId!==user.id)return new Response('Not found',{status:404})}}
 try{const image=await photoStore().get(partnerId+'/'+photoId,{type:'arrayBuffer'});if(!image)return new Response('Not found',{status:404});return new Response(image,{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}})}catch{console.error('Vehicle photo read unavailable');return new Response('Photo temporarily unavailable',{status:503})}
}
