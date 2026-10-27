import Fastify from 'fastify';
import { prismaPlugin } from './src/infra/database/prisma/prisma.plugin';

const fastify = Fastify({
  logger: true
})

fastify.register(prismaPlugin);

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})