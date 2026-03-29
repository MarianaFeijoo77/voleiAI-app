// Client-side store using localStorage
// Simulates the full backend flow — swap these out for real API calls later

export type MatchStatus = 'criado' | 'processando' | 'concluido' | 'erro'

export interface Rotacao {
  rotacao: number
  pontos: number
  erros: number
  eficiencia: number
}

export interface Jogador {
  nome: string
  posicao: string
  pontos: number
  erros: number
  eficiencia: number
}

export interface Relatorio {
  totalRallies: number
  totalPontos: number
  rotacoes: Rotacao[]
  jogadores: Jogador[]
}

export interface Match {
  id: string
  status: MatchStatus
  progresso: number
  nomeArquivo: string
  homeTeamNome: string
  awayTeamNome: string
  isDemo?: boolean
  criadoEm: string
  relatorio?: Relatorio
}

const KEY = 'voleiai_matches'

function load(): Record<string, Match> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function save(matches: Record<string, Match>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(matches))
}

export function criarMatch(data: Partial<Match>): Match {
  const matches = load()
  const id = `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const match: Match = {
    id,
    status: 'criado',
    progresso: 0,
    nomeArquivo: data.nomeArquivo || 'video.mp4',
    homeTeamNome: data.homeTeamNome || 'Time A',
    awayTeamNome: data.awayTeamNome || 'Time B',
    isDemo: data.isDemo || false,
    criadoEm: new Date().toISOString(),
  }
  matches[id] = match
  save(matches)
  return match
}

export function buscarMatch(id: string): Match | null {
  return load()[id] || null
}

export function listarMatches(): Match[] {
  return Object.values(load()).sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  )
}

export function atualizarMatch(id: string, updates: Partial<Match>) {
  const matches = load()
  if (matches[id]) {
    matches[id] = { ...matches[id], ...updates }
    save(matches)
  }
}

const RELATORIO_DEMO: Relatorio = {
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

export function simularProcessamento(matchId: string, onUpdate: (m: Match) => void) {
  let progresso = 0
  const interval = setInterval(() => {
    const match = buscarMatch(matchId)
    if (!match) { clearInterval(interval); return }

    progresso += Math.floor(Math.random() * 18) + 8
    if (progresso >= 100) {
      progresso = 100
      const relatorio: Relatorio = match.isDemo ? RELATORIO_DEMO : gerarRelatorioAleatorio()
      atualizarMatch(matchId, { status: 'concluido', progresso: 100, relatorio })
      onUpdate({ ...match, status: 'concluido', progresso: 100, relatorio })
      clearInterval(interval)
    } else {
      atualizarMatch(matchId, { status: 'processando', progresso })
      onUpdate({ ...match, status: 'processando', progresso })
    }
  }, 1200)
  return () => clearInterval(interval)
}

function gerarRelatorioAleatorio(): Relatorio {
  const rotacoes: Rotacao[] = Array.from({ length: 6 }, (_, i) => {
    const pontos = Math.floor(Math.random() * 8) + 2
    const erros = Math.floor(Math.random() * 4) + 1
    return { rotacao: i + 1, pontos, erros, eficiencia: Math.round((pontos / (pontos + erros)) * 100) }
  })
  const nomes = ['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4', 'Jogador 5', 'Jogador 6']
  const posicoes = ['Levantador', 'Oposto', 'Ponteiro', 'Ponteiro', 'Central', 'Central']
  const jogadores: Jogador[] = nomes.map((nome, i) => {
    const pontos = Math.floor(Math.random() * 10) + 1
    const erros = Math.floor(Math.random() * 3) + 1
    return { nome, posicao: posicoes[i], pontos, erros, eficiencia: Math.round((pontos / (pontos + erros)) * 100) }
  })
  return { totalRallies: Math.floor(Math.random() * 20) + 30, totalPontos: jogadores.reduce((s, j) => s + j.pontos, 0), rotacoes, jogadores }
}
