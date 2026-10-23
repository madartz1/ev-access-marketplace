import {db} from '../lib/db';
async function main(){await db.$queryRaw`SELECT 1`;await Promise.all([db.user.count(),db.partner.count(),db.vehicle.count(),db.booking.count()]);console.log('Database connection and application tables verified');}
main().catch(()=>{console.error('Database verification failed. Check private connection configuration and migrations.');process.exitCode=1}).finally(()=>db.$disconnect());
