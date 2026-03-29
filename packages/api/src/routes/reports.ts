import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db/prisma.js'
import { gerarUrlAssinada } from '../lib/r2.js'

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/reports/:matchId
   * Retorna dados completos do relatório de uma partida.
   * Este é o endpoint usado pela tela de relatório no web app.
   */
  fastify.get('/:matchId', async (req, reply) => {
    const { matchId } = req.params as { matchId: string }

    const [report, analysis, match] = await Promise.all([
      prisma.report.findFirst({ where: { matchId } }),
      prisma.matchAnalysis.findUnique({ where: { matchId } }),
      prisma.match.findUnique({
        where: { id: matchId },
        include: { homeTeam: true, awayTeam: true },
      }),
    ])

    if (!match) {
      return reply.status(404).send({ erro: 'Partida não encontrada' })
    }

    if (!analysis) {
      return reply.status(404).send({ erro: 'Análise não encontrada' })
    }

    return {
      matchId,
      timeA: match.homeTeam.nome,
      timeB: match.awayTeam.nome,
      data: match.data,
      confiancaMedia: analysis.confiancaMedia,
      totalEventos: analysis.totalEventos,
      duracaoSegundos: analysis.duracaoSegundos,
      shareToken: report?.shareToken,
      cvOutput: analysis.cvOutputJson,
    }
  })

  /**
   * GET /api/reports/share/:token
   * Acesso público via share token — para links compartilhados no WhatsApp.
   */
  fastify.get('/share/:token', async (req, reply) => {
    const { token } = req.params as { token: string }

    const report = await prisma.report.findUnique({
      where: { shareToken: token },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            analysis: true,
          },
        },
      },
    })

    if (!report) {
      return reply.status(404).send({ erro: 'Relatório não encontrado' })
    }

    // Incrementar visualizações
    await prisma.report.update({
      where: { shareToken: token },
      data: { visualizacoes: { increment: 1 } },
    })

    // URL assinada para PDF se existir
    let pdfUrlAssinada: string | null = null
    if (report.pdfUrl) {
      pdfUrlAssinada = await gerarUrlAssinada(report.pdfUrl, 3600).catch(() => null)
    }

    return {
      ...report,
      pdfUrl: pdfUrlAssinada,
    }
  })

  /**
   * GET /api/reports/compartilhado/:shareToken
   * Alias do endpoint anterior (mantém compatibilidade).
   */
  fastify.get('/compartilhado/:shareToken', async (req, reply) => {
    const { shareToken } = req.params as { shareToken: string }

    const report = await prisma.report.findUnique({
      where: { shareToken },
      include: {
        match: {
          include: {
            homeTeam: { include: { players: { select: { nome: true, numeroJersey: true, posicao: true } } } },
            awayTeam: { include: { players: { select: { nome: true, numeroJersey: true, posicao: true } } } },
            analysis: {
              select: {
                status: true,
                cvOutputJson: true,
                confiancaMedia: true,
                totalEventos: true,
                duracaoSegundos: true,
              },
            },
          },
        },
      },
    })

    if (!report) {
      return reply.status(404).send({ erro: 'Relatório não encontrado' })
    }

    await prisma.report.update({
      where: { shareToken },
      data: { visualizacoes: { increment: 1 } },
    })

    let pdfUrlAssinada: string | null = null
    if (report.pdfUrl) {
      pdfUrlAssinada = await gerarUrlAssinada(report.pdfUrl, 3600).catch(() => null)
    }

    return { ...report, pdfUrl: pdfUrlAssinada }
  })

  /**
   * POST /api/reports/:matchId/compartilhar
   * Gera ou retorna o share token de um relatório.
   */
  fastify.post('/:matchId/compartilhar', async (req, reply) => {
    const { matchId } = req.params as { matchId: string }

    let report = await prisma.report.findFirst({ where: { matchId, tipo: 'completo' } })

    if (!report) {
      report = await prisma.report.create({
        data: { matchId, tipo: 'completo' },
      })
    }

    const shareUrl = `${process.env.WEB_BASE_URL || 'https://volei-ai.vercel.app'}/relatorio/${matchId}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`📊 Relatório VôleiAI: ${shareUrl}`)}`

    return { shareToken: report.shareToken, shareUrl, whatsappUrl }
  })
}
