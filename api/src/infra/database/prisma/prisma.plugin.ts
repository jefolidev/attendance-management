import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { PrismaClient } from '../../../../generated/prisma/client.ts';

export async function prismaPlugin(server: FastifyInstance): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

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
}

export default fastifyPlugin(prismaPlugin, {
  name: 'prisma-plugin',
})