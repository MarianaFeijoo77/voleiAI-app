import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db/prisma.js'

export const matchRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/matches
   * Cria uma nova partida. Em MVP, cria club/coach/teams demo automaticamente.
   */
  fastify.post('/', async (req, reply) => {
    const { data, nomeArquivo, homeTeamNome, awayTeamNome, competicao, local } = req.body as any

    // MVP: upsert demo club
    await prisma.club.upsert({
      where: { id: 'demo-club' },
      update: {},
      create: { id: 'demo-club', nome: 'Clube Demo', cidade: 'São Paulo', estado: 'SP' },
    })

    // MVP: upsert demo coach
    await prisma.coach.upsert({
      where: { email: 'demo@volei.ai' },
      update: {},
      create: { id: 'demo-coach', email: 'demo@volei.ai', nome: 'Treinador Demo', clubId: 'demo-club' },
    })

    // Create teams for this match
    const homeTeam = await prisma.team.create({
      data: {
        nome: homeTeamNome || 'Time A',
        categoriaIdade: 'adulto',
        genero: 'masculino',
        clubId: 'demo-club',
      },
    })
    const awayTeam = await prisma.team.create({
      data: {
        nome: awayTeamNome || 'Time B',
        categoriaIdade: 'adulto',
        genero: 'masculino',
        clubId: 'demo-club',
      },
    })

    const match = await prisma.match.create({
      data: {
        data: new Date(data || Date.now()),
        competicao,
        local,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        coachId: 'demo-coach',
        videoStatus: 'pendente',
      },
    })

    return reply.status(201).send({
      matchId: match.id,
      status: match.videoStatus,
      criadoEm: match.criadoEm,
    })
  })

  /**
   * GET /api/matches
   * Lista partidas do treinador autenticado.
   */
  fastify.get('/', async (req, reply) => {
    const { coachId, limit = '20', offset = '0' } = req.query as {
      coachId?: string
      limit?: string
      offset?: string
    }

    const matches = await prisma.match.findMany({
      where: coachId ? { coachId } : undefined,
      include: {
        homeTeam: { select: { nome: true } },
        awayTeam: { select: { nome: true } },
        analysis: {
          select: { status: true, confiancaMedia: true, totalEventos: true },
        },
        reports: {
          select: { id: true, tipo: true, shareToken: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    })

    return { matches, total: matches.length }
  })

  /**
   * GET /api/matches/:id/status
   * Polling de status — usado pela tela de análise em progresso.
   */
  fastify.get('/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string }

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        videoStatus: true,
        analysis: {
          select: {
            status: true,
            confiancaMedia: true,
            totalEventos: true,
            erroMensagem: true,
            iniciadoEm: true,
            concluidoEm: true,
          },
        },
      },
    })

    if (!match) {
      return reply.status(404).send({ erro: 'Partida não encontrada' })
    }

    const status = match.analysis?.status || match.videoStatus
    const progresso =
      status === 'concluido' ? 100
      : status === 'processando' ? 50
      : status === 'na_fila' ? 10
      : 0

    return {
      matchId: id,
      status,
      progresso,
      videoStatus: match.videoStatus,
      analise: match.analysis,
    }
  })

  /**
   * GET /api/matches/:id
   * Detalhes completos de uma partida.
   */
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
        coach: { select: { nome: true, email: true } },
        analysis: true,
        reports: {
          select: { id: true, tipo: true, shareToken: true, criadoEm: true },
        },
      },
    })

    if (!match) {
      return reply.status(404).send({ erro: 'Partida não encontrada' })
    }

    return match
  })

  /**
   * DELETE /api/matches/:id
   */
  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const match = await prisma.match.findUnique({ where: { id }, select: { videoUrl: true } })
    if (!match) return reply.status(404).send({ erro: 'Partida não encontrada' })

    // TODO: deletar vídeo do R2 se existir
    await prisma.match.delete({ where: { id } })
    return { sucesso: true, mensagem: 'Partida removida.' }
  })
}
