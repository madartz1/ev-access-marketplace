import {currentUser} from './auth';
import {db} from './db';
export async function approvedFleet(){
 const user=await currentUser();if(!user)return null;
 const partner=await db.partner.findUnique({where:{userId:user.id}});
 return partner?.status==='APPROVED'&&partner.insuranceExpires>new Date()?{user,partner}:null;
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return Boolean(origin&&origin===new URL(request.url).origin)}
export async function limitedBody(request:Request,maxBytes:number){
 if(Number(request.headers.get('content-length'))>maxBytes)throw Error('Request is too large.');
 const reader=request.body?.getReader();if(!reader)throw Error('Request body is required.');
 const parts:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('Request is too large.')}parts.push(value)}}finally{reader.releaseLock()}
 return Buffer.concat(parts);
}
