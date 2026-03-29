import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db/prisma.js'

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/webhooks/cv-complete
   * Callback do worker/CV pipeline quando análise é concluída.
   * Também aceita o endpoint legado /cv-completo para compatibilidade.
   */
  const cvCompleteHandler = async (req: any, reply: any) => {
    const body = req.body as {
      matchId: string
      status?: 'concluido' | 'erro'
      cvOutput?: any
      erro?: string
      erroMensagem?: string
      webhookSecret?: string
    }

    // Validar secret em produção
    const secret = req.headers['x-webhook-secret'] || body.webhookSecret
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return reply.status(401).send({ erro: 'Webhook não autorizado' })
    }

    const { matchId, cvOutput, erro, erroMensagem } = body
    const hasError = erro || erroMensagem || body.status === 'erro'

    if (hasError) {
      await prisma.matchAnalysis.update({
        where: { matchId },
        data: {
          status: 'erro',
          erroMensagem: erro || erroMensagem || 'Erro desconhecido no pipeline CV',
        },
      })
      await prisma.match.update({ where: { id: matchId }, data: { videoStatus: 'erro' } })
      fastify.log.error({ matchId, erro }, 'Falha no pipeline CV')
      return { recebido: true }
    }

    if (!cvOutput) {
      return reply.status(400).send({ erro: 'cvOutput é obrigatório quando não há erro' })
    }

    // Calcular confiança média a partir dos eventos
    const eventos = cvOutput.events || []
    const confiancas = eventos.map((e: any) => e.confidence).filter(Boolean)
    const confiancaMedia =
      cvOutput.confianca_media ||
      (confiancas.length
        ? confiancas.reduce((a: number, b: number) => a + b, 0) / confiancas.length
        : 0)

    await prisma.matchAnalysis.update({
      where: { matchId },
      data: {
        status: 'concluido',
        cvOutputJson: cvOutput,
        confiancaMedia,
        totalEventos: eventos.length,
        duracaoSegundos: cvOutput.duration_seconds,
        concluidoEm: new Date(),
      },
    })

    await prisma.match.update({ where: { id: matchId }, data: { videoStatus: 'concluido' } })

    // Criar registro de relatório (idempotente)
    const existente = await prisma.report.findFirst({ where: { matchId } })
    if (!existente) {
      await prisma.report.create({ data: { matchId, tipo: 'completo' } })
    }

    fastify.log.info({ matchId, totalEventos: eventos.length }, 'Análise CV concluída')
    return { recebido: true }
  }

  fastify.post('/cv-complete', cvCompleteHandler)
  fastify.post('/cv-completo', cvCompleteHandler)

  /**
   * POST /api/webhooks/mercadopago
   */
  fastify.post('/mercadopago', async (req, reply) => {
    const body = req.body as { type: string; data: { id: string } }
    fastify.log.info({ type: body.type, id: body.data?.id }, 'Webhook MercadoPago recebido')
    // TODO: implementar lógica de pagamento
    return { recebido: true }
  })

  /**
   * POST /api/webhooks/stripe
   */
  fastify.post('/stripe', async (req, reply) => {
    const signature = req.headers['stripe-signature']
    fastify.log.info({ signature }, 'Webhook Stripe recebido')
    // TODO: verificar assinatura + processar evento
    return { recebido: true }
  })
}
