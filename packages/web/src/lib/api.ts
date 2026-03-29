const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export async function criarPartida(dados: { data: string; nomeArquivo: string }) {
  const resp = await fetch(`${API_BASE}/api/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
  if (!resp.ok) throw new Error('Falha ao criar partida')
  return resp.json()
}

export async function buscarStatusPartida(matchId: string) {
  const resp = await fetch(`${API_BASE}/api/matches/${matchId}/status`)
  if (!resp.ok) throw new Error('Falha ao buscar status')
  return resp.json()
}

export async function buscarRelatorio(matchId: string) {
  const resp = await fetch(`${API_BASE}/api/reports/${matchId}`)
  if (!resp.ok) throw new Error('Relatório não encontrado')
  return resp.json()
}
