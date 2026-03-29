import { Redis } from 'ioredis'

export const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
})

redisConnection.on('connect', () => {
  console.log('[redis] Conectado ao Redis')
})

redisConnection.on('error', (err) => {
  console.error('[redis] Erro de conexão:', err.message)
})
