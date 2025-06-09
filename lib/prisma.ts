import { PrismaClient } from '@prisma/client';

// Declare the global type for PrismaClient in the Node.js global object
declare global {
  // This is necessary to avoid TypeScript issues with the global object
  var db: PrismaClient | undefined;
}


// Use the global object to store the PrismaClient instance
const db = globalThis.db || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.db = db; // Only assign the client to the global object in non-production environments
}

export default db;
