/**
 * Mock CV pipeline — retorna dados realistas de uma partida de vôlei.
 * Usado quando MODAL_ENABLED=false (desenvolvimento, demo MVP).
 * Substituir pela chamada real ao Modal.com em produção.
 */

export function gerarAnalyseMock(matchId: string): any {
  const duracaoSegundos = 3600 // 1 hora de partida simulada
  const fps = 30
  const eventos: any[] = []
  const rotacoes: any[] = []

  const acoes = ['saque', 'recepcao', 'levantamento', 'ataque', 'bloqueio', 'defesa']
  const jogadores = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6']
  const jogadoresB = ['J7', 'J8', 'J9', 'J10', 'J11', 'J12']

  let timestamp = 5000
  let rally = 0

  for (let set = 1; set <= 3; set++) {
    // 30 rallies por set (sets 1-2), 20 no set 3
    const nRallies = set < 3 ? 30 : 20

    for (let r = 0; r < nRallies; r++) {
      rally++
      const rallyStart = timestamp

      // Snapshot de rotação no início de cada rally
      rotacoes.push({
        rally,
        set,
        timestamp_ms: rallyStart,
        time_a: jogadores.map((pid, i) => ({
          posicao_rotacao: `P${i + 1}`,
          player_id: pid,
          cx: 300 + (i % 3) * 200,
          cy: 300 + Math.floor(i / 3) * 200,
          cor_time: 'verde',
        })),
        time_b: jogadoresB.map((pid, i) => ({
          posicao_rotacao: `P${i + 1}`,
          player_id: pid,
          cx: 1100 + (i % 3) * 200,
          cy: 300 + Math.floor(i / 3) * 200,
          cor_time: 'azul',
        })),
      })

      // 4-8 eventos por rally
      const nEventos = 4 + Math.floor(Math.random() * 5)
      for (let e = 0; e < nEventos; e++) {
        const acao =
          e === 0 ? 'saque'
          : e === 1 ? 'recepcao'
          : e === 2 ? 'levantamento'
          : acoes[Math.floor(Math.random() * acoes.length)]

        const jogador = jogadores[Math.floor(Math.random() * jogadores.length)]
        const rand = Math.random()
        const outcome = rand > 0.85 ? 'ponto' : rand > 0.75 ? 'erro' : 'continuacao'

        eventos.push({
          timestamp_ms: timestamp,
          frame_idx: Math.floor((timestamp / 1000) * fps),
          set,
          rally,
          team: 'A',
          player_id: jogador,
          action: acao,
          confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(3)),
          court_position: {
            x: parseFloat(Math.random().toFixed(3)),
            y: parseFloat(Math.random().toFixed(3)),
          },
          outcome,
        })

        timestamp += 1500 + Math.floor(Math.random() * 3000)
      }

      timestamp += 5000 // intervalo entre rallies
    }
  }

  const confiancas = eventos.map(e => e.confidence)
  const confiancaMedia = confiancas.reduce((a, b) => a + b, 0) / confiancas.length

  return {
    match_id: matchId,
    duration_seconds: duracaoSegundos,
    confianca_media: parseFloat(confiancaMedia.toFixed(3)),
    fps,
    events: eventos,
    rotations: rotacoes,
  }
}
