import {getStore} from '@netlify/blobs';
import sharp from 'sharp';
export const PHOTO_MAX=3*1024*1024;
export function photoStore(){return getStore({name:'ev-vehicle-photos-'+(process.env.EV_PHOTO_SCOPE||'local'),consistency:'strong'})}
export async function prepareVehiclePhoto(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPEG, PNG, or WebP photo. On iPhone, export HEIC photos as JPEG first.');
 if(!file.size||file.size>PHOTO_MAX)throw Error('Each photo must be between 1 byte and 3 MB.');
 const input=Buffer.from(await file.arrayBuffer());
 const image=sharp(input,{limitInputPixels:25_000_000,failOn:'warning'});const meta=await image.metadata();
 if(!['jpeg','png','webp'].includes(meta.format||'')||(meta.pages||1)>1)throw Error('Use a still JPEG, PNG, or WebP image.');
 // Decode and re-encode to discard uploaded metadata and normalize orientation.
 const output=await image.rotate().resize({width:1600,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
 return new Uint8Array(output).buffer;
}
