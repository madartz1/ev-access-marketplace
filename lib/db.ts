import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

// Node.js on Netlify uses encrypted WebSockets for Neon transactions.
neonConfig.webSocketConstructor = WebSocket;
const globalDatabase = globalThis as unknown as {db?: PrismaClient};
function createDatabase() {
 const connectionString = process.env.DATABASE_URL;
 if (connectionString && new URL(connectionString).hostname.endsWith('.neon.tech')) {
  const pool = new Pool({connectionString, max: 2, connectionTimeoutMillis: 15000});
  return new PrismaClient({adapter: new PrismaNeon(pool)});
 }
 // Retain native PostgreSQL support for the local Docker development database.
 return new PrismaClient();
}
export const db = globalDatabase.db ?? createDatabase();
if (process.env.NODE_ENV !== 'production') globalDatabase.db = db;
