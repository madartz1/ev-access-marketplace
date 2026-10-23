// Keep authentication redirects on an internal vehicle detail page.
export function rentalReturnPath(value:unknown){
 if(typeof value!=='string'||!/^\/vehicles\/[a-zA-Z0-9_-]+(?:\?[^#]*)?$/.test(value))return '/dashboard';
 const url=new URL(value,'https://ev-access.invalid');
 const query=new URLSearchParams();
 for(const key of ['pickup','return']){const date=url.searchParams.get(key);if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date))query.set(key,date)}
 return url.pathname+(query.size?'?'+query:'');
}
