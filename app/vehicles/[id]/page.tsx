import {db} from '@/lib/db';
import {currentUser} from '@/lib/auth';
import {notFound} from 'next/navigation';
import {demoVehicles} from '@/lib/demo-vehicles';
import {isDemoVehicleId,type VehicleView} from '@/lib/vehicle-view';
import {VehicleDetail} from '@/components/vehicles/detail';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{pickup?:string;return?:string}>}){
 const {id}=await params,query=await searchParams;
 if(isDemoVehicleId(id)){const demo=demoVehicles.find(v=>v.id===id);if(!demo)notFound();return <VehicleDetail vehicle={demo} pickup={query.pickup} dropoff={query.return}/>}
 const v=await db.vehicle.findUnique({where:{id},include:{partner:true}});
 if(!v||v.status!=='APPROVED'||v.partner.status!=='APPROVED'||v.insuranceExpires<=new Date()||v.registrationExpires<=new Date()||v.partner.insuranceExpires<=new Date())notFound();
 const vehicle:VehicleView={id:v.id,name:`${v.make} ${v.model}`,make:v.make,model:v.model,year:v.year,vehicleType:v.vehicleType,seats:v.seats,rangeMiles:v.rangeMiles,dailyRateCents:v.dailyRateCents,city:v.city,imageUrl:v.imageUrl,description:v.description,providerName:v.partner.businessName,tlcEligible:v.tlcEligible,demo:false};
 return <VehicleDetail vehicle={vehicle} pickup={query.pickup} dropoff={query.return} signedIn={Boolean(await currentUser())}/>;
}
