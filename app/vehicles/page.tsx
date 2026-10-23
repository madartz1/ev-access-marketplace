import {db} from '@/lib/db';
import {demoVehicles} from '@/lib/demo-vehicles';
import type {VehicleView} from '@/lib/vehicle-view';
import {VehicleExplorer} from '@/components/vehicles/explorer';
export const dynamic='force-dynamic';
export const metadata={title:'Explore electric vehicles | EV Access'};
export default async function Page({searchParams}:{searchParams:Promise<{demo?:string}>}){
 const {demo}=await searchParams;
 let vehicles:VehicleView[]=[],liveUnavailable=false;
 if(demo!=='1')try{
  const cars=await db.vehicle.findMany({where:{status:'APPROVED',partner:{status:'APPROVED',insuranceExpires:{gt:new Date()}},insuranceExpires:{gt:new Date()},registrationExpires:{gt:new Date()}},include:{partner:{select:{businessName:true}}},orderBy:{createdAt:'desc'},take:60});
  vehicles=cars.map(v=>({id:v.id,name:`${v.make} ${v.model}`,make:v.make,model:v.model,year:v.year,vehicleType:v.vehicleType,seats:v.seats,rangeMiles:v.rangeMiles,dailyRateCents:v.dailyRateCents,city:v.city,imageUrl:v.imageUrl,description:v.description,providerName:v.partner.businessName,tlcEligible:v.tlcEligible,demo:false}));
 }catch{liveUnavailable=true;console.error('Vehicle catalog temporarily unavailable');}
 const demoMode=demo==='1'||vehicles.length===0;
 return <VehicleExplorer vehicles={demoMode?demoVehicles:vehicles} demoMode={demoMode} liveUnavailable={liveUnavailable}/>;
}
