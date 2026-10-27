import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client/extension';
import fp from 'fastify-plugin';

const connectionString = process.env.DATABASE_URL;

export const prismaPlugin = fp(async (server) => {
  if(!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    adapter,
  });

  await prisma.$connect();

  server
    .decorate('prisma', prisma)
    .addHook('onClose', async () => {
      await prisma.$disconnect();
    });
});