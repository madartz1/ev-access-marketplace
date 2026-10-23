import {test,expect} from 'vitest';
import {rentalPeriod,vehicleFields,partnerFields} from '../lib/validation';
const now=new Date('2026-10-23T12:00:00Z');
test('rental totals use whole days and allow adjacent returns',()=>{expect(rentalPeriod('2026-10-23','2026-10-25',now).days).toBe(2)});
test.each([['2026-10-22','2026-10-24'],['2026-10-23','2026-10-23'],['2026-10-25','2026-10-24'],['invalid','2026-10-25'],['2026-10-23','2027-03-01'],['2027-02-30','2027-03-04']])('rejects invalid rental dates %s %s',(a,b)=>expect(()=>rentalPeriod(a,b,now)).toThrow());
test('rejects empty business applications',()=>expect(partnerFields.safeParse({}).success).toBe(false));
const vehicle={make:'Kia',model:'EV6',plate:'TEST',city:'Queens',vehicleType:'Car',seats:5,rangeMiles:250,imageUrl:'https://example.com/car.jpg',description:'',tlcPlate:''};
test('valid vehicle passes',()=>expect(vehicleFields.safeParse(vehicle).success).toBe(true));
test('rejects unsafe image URL and invalid seats',()=>{expect(vehicleFields.safeParse({...vehicle,imageUrl:'javascript:alert(1)'}).success).toBe(false);expect(vehicleFields.safeParse({...vehicle,seats:-1}).success).toBe(false)});
