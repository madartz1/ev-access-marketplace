import {test,expect} from 'vitest';
import {tripDays,vehicleLink} from '../lib/vehicle-view';
import {rentalReturnPath} from '../lib/return-path';
test('rental day estimate uses UTC across daylight saving changes',()=>{expect(tripDays('2027-03-13','2027-03-16')).toBe(3)});
test('estimate rejects impossible dates, reversed trips, and trips longer than 90 days',()=>{expect(tripDays('2027-02-30','2027-03-04')).toBe(0);expect(tripDays('2027-04-10','2027-04-09')).toBe(0);expect(tripDays('2027-01-01','2027-04-02')).toBe(0)});
test('sign in preserves a vehicle and its dates',()=>{const link=vehicleLink('car-123','2027-02-01','2027-02-04');expect(rentalReturnPath(link)).toBe('/vehicles/car-123?pickup=2027-02-01&return=2027-02-04')});
test('authentication return paths reject external URLs and unrelated routes',()=>{for(const path of ['https://example.com','//example.com','/admin','/vehicles/../../admin','/vehicles/car#bad'])expect(rentalReturnPath(path)).toBe('/dashboard');expect(rentalReturnPath('/vehicles/car?unknown=secret')).toBe('/vehicles/car')});
