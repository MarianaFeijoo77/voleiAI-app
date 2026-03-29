import { FastifyPluginAsync } from 'fastify'
import {
  iniciarMultipartUpload,
  uploadParte,
  concluirMultipartUpload,
  cancelarMultipartUpload,
} from '../lib/r2.js'
import { prisma } from '../db/prisma.js'
import { addVideoProcessingJob } from '../queue/jobs.js'

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/upload/iniciar
   * Inicia o upload multipart no Cloudflare R2.
   * Retorna uploadId e chave do objeto.
   */
  fastify.post('/iniciar', async (req, reply) => {
    const body = req.body as {
      matchId: string
      nomeArquivo: string
      tipoConteudo?: string
    }

    const { matchId, nomeArquivo, tipoConteudo = 'video/mp4' } = body

    if (!matchId || !nomeArquivo) {
      return reply.status(400).send({
        erro: 'matchId e nomeArquivo são obrigatórios',
      })
    }

    // Sanitizar nome do arquivo
    const nomeSanitizado = nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_')
    const chave = `matches/${matchId}/${Date.now()}-${nomeSanitizado}`

    const resp = await iniciarMultipartUpload(chave, tipoConteudo)

    await prisma.match.update({
      where: { id: matchId },
      data: { videoStatus: 'enviando', videoUrl: chave },
    })

    fastify.log.info({ matchId, chave, uploadId: resp.UploadId }, 'Upload multipart iniciado')

    return { uploadId: resp.UploadId, chave }
  })

  /**
   * PUT /api/upload/parte
   * Faz upload de uma parte do arquivo.
   * Query params: uploadId, chave, numeroParte
   */
  fastify.put('/parte', async (req, reply) => {
    const { uploadId, chave, numeroParte } = req.query as {
      uploadId: string
      chave: string
      numeroParte: string
    }

    if (!uploadId || !chave || !numeroParte) {
      return reply.status(400).send({
        erro: 'uploadId, chave e numeroParte são obrigatórios',
      })
    }

    const numParte = Number(numeroParte)
    if (numParte < 1 || numParte > 10_000) {
      return reply.status(400).send({
        erro: 'numeroParte deve ser entre 1 e 10.000',
      })
    }

    const data = await req.file()
    if (!data) {
      return reply.status(400).send({ erro: 'Nenhum arquivo enviado' })
    }

    const buffer = await data.toBuffer()
    const resp = await uploadParte(chave, uploadId, numParte, buffer)

    return { etag: resp.ETag, numeroParte: numParte }
  })

  /**
   * POST /api/upload/concluir
   * Finaliza o upload multipart e enfileira o job de processamento.
   */
  fastify.post('/concluir', async (req, reply) => {
    const body = req.body as {
      uploadId: string
      chave: string
      partes: Array<{ PartNumber: number; ETag: string }>
      matchId: string
    }

    const { uploadId, chave, partes, matchId } = body

    if (!uploadId || !chave || !partes || !matchId) {
      return reply.status(400).send({
        erro: 'uploadId, chave, partes e matchId são obrigatórios',
      })
    }

    // Ordenar partes por número (S3/R2 exige ordem)
    const partesOrdenadas = [...partes].sort((a, b) => a.PartNumber - b.PartNumber)

    await concluirMultipartUpload(chave, uploadId, partesOrdenadas)

    await prisma.match.update({
      where: { id: matchId },
      data: { videoStatus: 'processando' },
    })

    // Criar registro de análise
    await prisma.matchAnalysis.create({
      data: {
        matchId,
        status: 'na_fila',
      },
    })

    // Enfileirar job de processamento
    const job = await addVideoProcessingJob({
      matchId,
      videoChave: chave,
    })

    fastify.log.info({ matchId, jobId: job.id }, 'Vídeo recebido e job enfileirado')

    return {
      sucesso: true,
      jobId: job.id,
      mensagem: 'Vídeo enviado com sucesso. A análise começará em instantes.',
    }
  })

  /**
   * POST /api/upload/demo
   * Cria um job de processamento com vídeo fictício (mock).
   * Usado para demonstração sem upload real.
   */
  fastify.post('/demo', async (req, reply) => {
    const { matchId } = req.body as { matchId: string }

    if (!matchId) {
      return reply.status(400).send({ erro: 'matchId é obrigatório' })
    }

    // Criar análise se não existir
    const existente = await prisma.matchAnalysis.findUnique({ where: { matchId } })
    if (!existente) {
      await prisma.matchAnalysis.create({
        data: { matchId, status: 'na_fila' },
      })
    } else {
      await prisma.matchAnalysis.update({
        where: { matchId },
        data: { status: 'na_fila' },
      })
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { videoStatus: 'processando', videoUrl: 'demo/mock-video.mp4' },
    })

    const job = await addVideoProcessingJob({
      matchId,
      videoChave: 'demo/mock-video.mp4',
    })

    fastify.log.info({ matchId, jobId: job.id }, 'Demo job enfileirado')

    return { sucesso: true, jobId: job.id, mensagem: 'Demo iniciado! Processando dados simulados...' }
  })

  /**
   * POST /api/upload/cancelar
   * Cancela um upload multipart em andamento.
   */
  fastify.post('/cancelar', async (req, reply) => {
    const { uploadId, chave, matchId } = req.body as {
      uploadId: string
      chave: string
      matchId: string
    }

    await cancelarMultipartUpload(chave, uploadId)

    await prisma.match.update({
      where: { id: matchId },
      data: { videoStatus: 'erro', videoUrl: null },
    })

    return { sucesso: true, mensagem: 'Upload cancelado.' }
  })
}
