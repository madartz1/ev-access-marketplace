'use client';
import {useState} from 'react';
import {Icon} from './icons';
export function VehiclePhoto({src,name,priority=false,className=''}:{src:string|null;name:string;priority?:boolean;className?:string}){
 const [failed,setFailed]=useState(false);
 return src&&!failed?<img className={'ev-photo '+className} src={src} alt={name} loading={priority?'eager':'lazy'} decoding="async" onError={()=>setFailed(true)}/>:<div className="ev-photo-fallback"><Icon name="car"/><span>Vehicle photo pending</span></div>;
}
