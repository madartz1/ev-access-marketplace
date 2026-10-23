import {z} from 'zod';
export const requiredText=z.string().trim().min(1).max(300);
export const futureDate=z.coerce.date().refine(d=>d>new Date(),'Document must be current');
export const purpose=z.enum(['Personal use','Business use','Rideshare (subject to TLC and platform approval)']);
export const partnerFields=z.object({businessName:requiredText,kind:z.enum(['Rental fleet','Car dealership','EV manufacturer','Fleet operator']),contactName:requiredText,phone:requiredText,address:requiredText,website:z.union([z.literal(''),z.string().url().startsWith('https://')]),registrationNumber:requiredText,insuranceCarrier:requiredText,insurancePolicy:requiredText,tlcFleetLicense:z.string().max(100)});
export const vehicleFields=z.object({make:requiredText,model:requiredText,plate:requiredText,city:requiredText,vehicleType:z.enum(['Car','SUV','Truck','Van']),seats:z.coerce.number().int().min(1).max(15),rangeMiles:z.coerce.number().int().min(1).max(2000),imageUrl:z.union([z.literal(''),z.string().url().startsWith('https://')]),description:z.string().max(5000),tlcPlate:z.string().max(100)});
export function rentalPeriod(startInput:string,endInput:string,now=new Date()){
 const start=new Date(startInput+'T00:00:00Z'),end=new Date(endInput+'T00:00:00Z');
 const days=(end.getTime()-start.getTime())/86400000;
 const today=new Date(now.toISOString().slice(0,10)+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startInput)||!/^\d{4}-\d{2}-\d{2}$/.test(endInput)||!Number.isInteger(days)||days<1||days>90||start<today||start.toISOString().slice(0,10)!==startInput||end.toISOString().slice(0,10)!==endInput)throw Error('Invalid rental dates');
 return {start,end,days};
}
