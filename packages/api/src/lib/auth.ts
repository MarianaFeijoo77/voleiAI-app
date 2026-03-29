import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../db/prisma.js'

export interface AuthenticatedUser {
  id: string
  email: string
  sub: string
}

/**
 * Middleware de autenticação JWT para rotas protegidas.
 * Valida o JWT do Supabase e injeta o usuário na requisição.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({
      erro: 'Não autenticado',
      mensagem: 'Token de acesso inválido ou expirado. Faça login novamente.',
    })
  }
}

/**
 * Extrai o coach autenticado do banco de dados.
 * Use após requireAuth.
 */
export async function getCoachAutenticado(request: FastifyRequest) {
  const user = request.user as AuthenticatedUser
  
  const coach = await prisma.coach.findUnique({
    where: { email: user.email },
    include: { club: true },
  })

  if (!coach) {
    throw new Error('Treinador não encontrado. Cadastro necessário.')
  }

  return coach
}

/**
 * Verifica se o coach tem acesso à partida solicitada.
 */
export async function verificarAcessoPartida(
  coachId: string,
  matchId: string
): Promise<boolean> {
  const match = await prisma.match.findFirst({
    where: { id: matchId, coachId },
  })
  return match !== null
}
