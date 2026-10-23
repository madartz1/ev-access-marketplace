export type VehicleView={
 id:string;name:string;make:string;model:string;year:number;vehicleType:string;seats:number;rangeMiles:number;dailyRateCents:number;city:string;imageUrl:string|null;description:string|null;providerName:string;tlcEligible:boolean;demo:boolean;highlight?:string;features?:string[];
};
export function tripDays(pickup:string,dropoff:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(pickup)||!/^\d{4}-\d{2}-\d{2}$/.test(dropoff))return 0;
 const start=Date.parse(pickup+'T00:00:00Z'),end=Date.parse(dropoff+'T00:00:00Z');
 if(!Number.isFinite(start)||!Number.isFinite(end)||new Date(start).toISOString().slice(0,10)!==pickup||new Date(end).toISOString().slice(0,10)!==dropoff)return 0;
 const days=(end-start)/86400000;
 return Number.isInteger(days)&&days>0&&days<=90?days:0;
}
export const dollars=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:cents%100?2:0}).format(cents/100);
export const isDemoVehicleId=(id:string)=>id.startsWith('demo-');
export function vehicleLink(id:string,pickup='',dropoff=''){
 const params=new URLSearchParams();if(pickup)params.set('pickup',pickup);if(dropoff)params.set('return',dropoff);
 return '/vehicles/'+encodeURIComponent(id)+(params.size?'?'+params:'');
}
