import { Worker, Job } from 'bullmq'
import { redisConnection } from './lib/redis.js'
import { normalizeVideo } from './stages/normalize.js'
import { runCVPipeline } from './stages/upload-to-modal.js'
import { generateReport } from './stages/generate-report.js'
import { prisma } from './lib/prisma.js'

interface VideoProcessingJobData {
  matchId: string
  videoChave: string
}

const worker = new Worker<VideoProcessingJobData>(
  'video-processing',
  async (job: Job<VideoProcessingJobData>) => {
    const { matchId, videoChave } = job.data

    console.log(`[worker] Iniciando processamento da partida ${matchId}`)

    await prisma.matchAnalysis.update({
      where: { matchId },
      data: {
        status: 'processando',
        iniciadoEm: new Date(),
      },
    })

    try {
      // Stage 1: Normalizar vídeo com FFmpeg
      await job.updateProgress(10)
      console.log(`[worker] Stage 1/3: Normalizando vídeo...`)
      const normalizedPath = await normalizeVideo(videoChave)

      // Stage 2: Executar pipeline CV no Modal.com
      await job.updateProgress(25)
      console.log(`[worker] Stage 2/3: Executando pipeline CV (GPU)...`)
      const cvOutput = await runCVPipeline(normalizedPath, matchId)

      // Stage 3: Gerar relatório a partir do output CV
      await job.updateProgress(85)
      console.log(`[worker] Stage 3/3: Gerando relatório...`)
      await generateReport(matchId, cvOutput)

      // Atualizar análise como concluída
      await prisma.matchAnalysis.update({
        where: { matchId },
        data: {
          status: 'concluido',
          cvOutputJson: cvOutput as any,
          confiancaMedia: cvOutput.confianca_media,
          duracaoSegundos: cvOutput.duration_seconds,
          totalEventos: cvOutput.events?.length || 0,
          concluidoEm: new Date(),
        },
      })

      await prisma.match.update({
        where: { id: matchId },
        data: { videoStatus: 'concluido' },
      })

      await job.updateProgress(100)
      console.log(`[worker] ✅ Partida ${matchId} processada com sucesso`)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error(`[worker] ❌ Erro ao processar partida ${matchId}:`, errorMessage)

      await prisma.matchAnalysis.update({
        where: { matchId },
        data: {
          status: 'erro',
          erroMensagem: errorMessage,
        },
      })

      await prisma.match.update({
        where: { id: matchId },
        data: { videoStatus: 'erro' },
      })

      throw err // Re-throw para BullMQ fazer retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60_000, // Max 10 jobs por minuto (controle de custo GPU)
    },
  }
)

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} concluído — partida ${job.data.matchId}`)
})

worker.on('failed', (job, err) => {
  console.error(
    `[worker] Job ${job?.id} falhou após ${job?.attemptsMade} tentativas:`,
    err.message
  )
})

worker.on('progress', (job, progress) => {
  console.log(`[worker] Job ${job.id} — ${progress}% concluído`)
})

console.log('[worker] 🏐 VôleiAI worker iniciado, aguardando jobs...')

// Graceful shutdown
const shutdown = async () => {
  console.log('[worker] Desligando worker...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
