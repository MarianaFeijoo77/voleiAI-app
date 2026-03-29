import { NextResponse } from 'next/server'

// In-memory store (resets on cold start — fine for demo/MVP)
const matches: Record<string, any> = {}

export async function POST(req: Request) {
  const body = await req.json()
  const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  matches[matchId] = {
    id: matchId,
    status: 'criado',
    progresso: 0,
    nomeArquivo: body.nomeArquivo || 'video.mp4',
    homeTeamNome: body.homeTeamNome || 'Time A',
    awayTeamNome: body.awayTeamNome || 'Time B',
    criadoEm: new Date().toISOString(),
  }
  // Store globally so other routes can access
  ;(globalThis as any).__matches = matches
  return NextResponse.json({ matchId, match: matches[matchId] })
}

export async function GET() {
  const store = (globalThis as any).__matches || {}
  return NextResponse.json({ matches: Object.values(store) })
}
