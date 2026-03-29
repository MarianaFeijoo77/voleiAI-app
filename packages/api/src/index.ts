import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { uploadRoutes } from './routes/upload.js'
import { matchRoutes } from './routes/matches.js'
import { reportRoutes } from './routes/reports.js'
import { webhookRoutes } from './routes/webhooks.js'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

async function main() {
  // Plugins
  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.WEB_BASE_URL || 'https://app.voleiAI.com.br']
      : true,
    credentials: true,
  })

  await server.register(jwt, {
    secret: process.env.JWT_SECRET!,
  })

  await server.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024 * 1024, // 2GB
      files: 1,
    },
  })

  // Routes
  await server.register(uploadRoutes, { prefix: '/api/upload' })
  await server.register(matchRoutes, { prefix: '/api/matches' })
  await server.register(reportRoutes, { prefix: '/api/reports' })
  await server.register(webhookRoutes, { prefix: '/api/webhooks' })

  // Health check
  server.get('/health', async () => ({
    status: 'ok',
    service: 'voleiAI-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }))

  // Graceful shutdown
  const shutdown = async () => {
    server.log.info('Desligando servidor...')
    await server.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  // Start
  try {
    await server.listen({
      port: Number(process.env.PORT) || 3001,
      host: '0.0.0.0',
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
