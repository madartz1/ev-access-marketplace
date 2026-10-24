import {z} from 'zod';
import {vehicleFields} from './validation';
export const FLEET_LIMIT=50;
export const fleetColumns=['make','model','year','vin','plate','vehicleType','seats','rangeMiles','dailyRate','city','insuranceExpires','registrationExpires','imageUrl','description','tlcEligible','tlcPlate'] as const;
export type FleetRow=Record<string,string>;
export type FleetIssue={row:number;message:string};
export const ownedPhotoPattern=/^\/api\/vehicle-photos\/([a-zA-Z0-9_-]+)\/([a-f0-9-]{36}\.webp)$/;
export function assertOwnedPhoto(url:string,partnerId:string){if(url.startsWith('/')){const match=ownedPhotoPattern.exec(url);if(!match||match[1]!==partnerId)throw Error('Choose a photo uploaded by your own fleet.')}}
export function parseFleetCSV(input:string):FleetRow[]{
 if(new TextEncoder().encode(input).length>256*1024)throw Error('CSV must be 256 KB or smaller.');
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false,closed=false;
 const pushCell=()=>{row.push(cell);cell='';closed=false};
 const pushRow=()=>{pushCell();if(row.some(v=>v.trim()))rows.push(row);row=[];if(rows.length>FLEET_LIMIT+1)throw Error(`Import up to ${FLEET_LIMIT} vehicles at a time.`)};
 const text=input.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=c;continue}
 if(c==='"'){if(cell||closed)throw Error('Invalid CSV quote. Use the downloadable template.');quoted=true}
 else if(c===',')pushCell();else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;pushRow()}
 else{if(closed&&c.trim())throw Error('Unexpected text after a quoted CSV field.');if(!closed)cell+=c}}
 if(quoted)throw Error('A quoted CSV field is not closed.');if(cell||row.length||closed)pushRow();
 if(rows.length<2)throw Error('Add at least one vehicle below the header row.');
 const headers=rows.shift()!.map(h=>h.trim());
 if(new Set(headers).size!==headers.length)throw Error('CSV column names must be unique.');
 const required=fleetColumns.slice(0,12);for(const h of required)if(!headers.includes(h))throw Error(`Missing column: ${h}`);
 for(const h of headers)if(!fleetColumns.includes(h as typeof fleetColumns[number]))throw Error(`Unknown column: ${h}`);
 return rows.map((values,i)=>{if(values.length!==headers.length)throw Error(`CSV row ${i+2} has ${values.length} fields; expected ${headers.length}.`);return Object.fromEntries(headers.map((h,j)=>[h,values[j].trim()]))});
}
const documentDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Use YYYY-MM-DD dates.').refine(value=>{const date=new Date(value+'T00:00:00Z');return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value&&date>new Date()},'Document must have a valid future expiration date.');
const fleetVehicle=vehicleFields.extend({year:z.coerce.number().int().min(2015).max(2035),vin:z.string().trim().toUpperCase().regex(/^[A-Z0-9]{17}$/,'VIN must contain 17 letters or numbers.'),plate:z.string().trim().min(1).max(300).toUpperCase(),dailyRate:z.coerce.number().positive().max(10000).refine(n=>Math.abs(n*100-Math.round(n*100))<.00001,'Use at most two decimal places.'),insuranceExpires:documentDate,registrationExpires:documentDate,tlcEligible:z.enum(['yes','no']).default('no'),imageUrl:z.union([z.literal(''),z.string().url().startsWith('https://'),z.string().regex(ownedPhotoPattern)]).default(''),description:z.string().max(5000).default(''),tlcPlate:z.string().max(100).default('')});
export function fleetVehicleData(row:FleetRow,partnerId:string){
 const v=fleetVehicle.parse({...row,tlcEligible:row.tlcEligible||'no'});assertOwnedPhoto(v.imageUrl,partnerId);
 return {partnerId,make:v.make,model:v.model,year:v.year,vin:v.vin,plate:v.plate,vehicleType:v.vehicleType,seats:v.seats,rangeMiles:v.rangeMiles,dailyRateCents:Math.round(v.dailyRate*100),city:v.city,imageUrl:v.imageUrl||null,description:v.description||null,tlcEligible:v.tlcEligible==='yes',tlcPlate:v.tlcPlate||null,insuranceExpires:new Date(v.insuranceExpires+'T00:00:00Z'),registrationExpires:new Date(v.registrationExpires+'T00:00:00Z'),status:'PENDING' as const};
}
export function validateFleetRows(rows:FleetRow[],partnerId:string){
 const issues:FleetIssue[]=[],vehicles:ReturnType<typeof fleetVehicleData>[]=[];const vins=new Set<string>(),plates=new Set<string>();
 if(rows.length<1||rows.length>FLEET_LIMIT)return {issues:[{row:0,message:`Choose between 1 and ${FLEET_LIMIT} vehicles.`}],vehicles};
 rows.forEach((row,index)=>{try{const v=fleetVehicleData(row,partnerId);if(vins.has(v.vin)||plates.has(v.plate))issues.push({row:index+2,message:'Duplicate VIN or plate within this file.'});vins.add(v.vin);plates.add(v.plate);vehicles.push(v)}catch(error){issues.push({row:index+2,message:error instanceof z.ZodError?error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '):error instanceof Error?error.message:'Invalid vehicle.'})}});
 return {issues,vehicles};
}
