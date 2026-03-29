import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const store = (globalThis as any).__matches || {}

  if (store[body.matchId]) {
    store[body.matchId].status = 'processando'
    store[body.matchId].progresso = 0

    // Simulate processing progress over time
    let progresso = 0
    const interval = setInterval(() => {
      progresso += Math.floor(Math.random() * 15) + 5
      if (progresso >= 100) {
        progresso = 100
        store[body.matchId].status = 'concluido'
        store[body.matchId].progresso = 100
        store[body.matchId].relatorio = gerarRelatorioDemo()
        clearInterval(interval)
      } else {
        store[body.matchId].progresso = progresso
      }
    }, 2000)
  }

  return NextResponse.json({ sucesso: true, matchId: body.matchId })
}

function gerarRelatorioDemo() {
  return {
    totalRallies: 42,
    totalPontos: 38,
    rotacoes: [
      { rotacao: 1, pontos: 8, erros: 2, eficiencia: 80 },
      { rotacao: 2, pontos: 6, erros: 3, eficiencia: 67 },
      { rotacao: 3, pontos: 7, erros: 1, eficiencia: 88 },
      { rotacao: 4, pontos: 5, erros: 4, eficiencia: 56 },
      { rotacao: 5, pontos: 7, erros: 2, eficiencia: 78 },
      { rotacao: 6, pontos: 5, erros: 3, eficiencia: 63 },
    ],
    jogadores: [
      { nome: 'Jogador 1', posicao: 'Levantador', pontos: 4, erros: 1, eficiencia: 80 },
      { nome: 'Jogador 2', posicao: 'Oposto', pontos: 12, erros: 3, eficiencia: 80 },
      { nome: 'Jogador 3', posicao: 'Ponteiro', pontos: 8, erros: 2, eficiencia: 80 },
      { nome: 'Jogador 4', posicao: 'Ponteiro', pontos: 7, erros: 2, eficiencia: 78 },
      { nome: 'Jogador 5', posicao: 'Central', pontos: 5, erros: 1, eficiencia: 83 },
      { nome: 'Jogador 6', posicao: 'Central', pontos: 2, erros: 1, eficiencia: 67 },
    ],
  }
}
