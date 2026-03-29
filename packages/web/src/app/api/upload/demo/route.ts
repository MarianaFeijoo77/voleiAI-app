import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const store = (globalThis as any).__matches || {}

  if (store[body.matchId]) {
    store[body.matchId].status = 'processando'
    store[body.matchId].progresso = 0
    store[body.matchId].isDemo = true

    // Simulate faster processing for demo
    let progresso = 0
    const interval = setInterval(() => {
      progresso += Math.floor(Math.random() * 20) + 10
      if (progresso >= 100) {
        progresso = 100
        store[body.matchId].status = 'concluido'
        store[body.matchId].progresso = 100
        store[body.matchId].relatorio = {
          totalRallies: 38,
          totalPontos: 25,
          rotacoes: [
            { rotacao: 1, pontos: 6, erros: 1, eficiencia: 86 },
            { rotacao: 2, pontos: 4, erros: 3, eficiencia: 57 },
            { rotacao: 3, pontos: 5, erros: 1, eficiencia: 83 },
            { rotacao: 4, pontos: 3, erros: 4, eficiencia: 43 },
            { rotacao: 5, pontos: 5, erros: 2, eficiencia: 71 },
            { rotacao: 6, pontos: 2, erros: 3, eficiencia: 40 },
          ],
          jogadores: [
            { nome: 'Ana Lima', posicao: 'Levantadora', pontos: 3, erros: 0, eficiencia: 100 },
            { nome: 'Carol Santos', posicao: 'Oposta', pontos: 9, erros: 2, eficiencia: 82 },
            { nome: 'Beatriz Rocha', posicao: 'Ponteira', pontos: 6, erros: 2, eficiencia: 75 },
            { nome: 'Fernanda Melo', posicao: 'Ponteira', pontos: 4, erros: 2, eficiencia: 67 },
            { nome: 'Juliana Costa', posicao: 'Central', pontos: 2, erros: 1, eficiencia: 67 },
            { nome: 'Patrícia Alves', posicao: 'Central', pontos: 1, erros: 1, eficiencia: 50 },
          ],
        }
        clearInterval(interval)
      } else {
        store[body.matchId].progresso = progresso
      }
    }, 1000)
  }

  return NextResponse.json({ sucesso: true, matchId: body.matchId })
}
