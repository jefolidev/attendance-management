import 'dotenv/config';
import Fastify from 'fastify';
import prismaPlugin from './src/infra/database/prisma/prisma.plugin.ts';

const fastify = Fastify({
})

fastify.register(prismaPlugin);

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})