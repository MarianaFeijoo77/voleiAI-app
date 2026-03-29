// Client-side store using localStorage
// Swap these out for real API calls when backend is ready

export type MatchStatus = 'criado' | 'processando' | 'concluido' | 'erro'

export type TipoAcao = 'saque' | 'passe' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa'

export interface AcaoStats {
  tipo: TipoAcao
  tentativas: number
  sucessos: number
  erros: number
  eficiencia: number // 0-100
  dica: string // specific improvement tip
}

export interface JogadorRelatorio {
  nome: string
  posicao: string
  numero: number
  acoes: AcaoStats[]
  pontoForte: TipoAcao
  pontoMelhoria: TipoAcao
  destaque: string // one-line highlight e.g. "Melhor atacante em série"
}

export interface MovimentoEquipe {
  acao: TipoAcao
  label: string
  tentativas: number
  eficiencia: number
  dica: string
}

export interface Relatorio {
  totalRallies: number
  duracaoMin: number
  movimentosEquipe: MovimentoEquipe[]
  jogadores: JogadorRelatorio[]
  resumo: string // coach-level summary
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
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
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

// ─── Demo data ────────────────────────────────────────────────────────────────

const ACOES_LABELS: Record<TipoAcao, string> = {
  saque: 'Saque',
  passe: 'Passe',
  levantamento: 'Levantamento',
  ataque: 'Ataque',
  bloqueio: 'Bloqueio',
  defesa: 'Defesa',
}

const DICAS: Record<TipoAcao, string[]> = {
  saque: [
    'Posicionar o pé de apoio mais à frente para maior estabilidade no saque potente.',
    'Trabalhar a variação de saque flutuante × potente para desorganizar a recepção adversária.',
    'Melhorar a consistência do saque: 3 de cada 5 saques estão saindo pela linha lateral.',
  ],
  passe: [
    'Baixar o centro de gravidade antes do contato para melhorar o controle do passe.',
    'O passe está sendo feito com os braços muito altos — ajustar ângulo de plataforma.',
    'Melhorar a leitura do saque adversário: chegada atrasada ao ponto de contato.',
  ],
  levantamento: [
    'Levantar com mais consistência para a zona 4 — atualmente 70% dos levantamentos vão para zona 2.',
    'Trabalhar o levantamento em suspensão para aumentar imprevisibilidade.',
    'Dedos mais firmes no contato: algumas bolas estão saindo com rotação irregular.',
  ],
  ataque: [
    'Melhorar a impulsão vertical: média de 48cm — potencial de chegar a 55cm com treino específico.',
    'Diversificar as zonas de ataque: 80% dos ataques estão indo para o mesmo setor.',
    'Trabalhar o ataque diagonal com maior precisão — erro de 40% nessa linha.',
  ],
  bloqueio: [
    'Timing de salto adiantado em relação ao atacante — saltar 0,3s mais tarde.',
    'Afastar as mãos da rede para evitar infrações — 3 toques na rede identificados.',
    'Melhorar o posicionamento lateral antes do salto de bloqueio.',
  ],
  defesa: [
    'Antecipação de movimento: reage após o contato do atacante — trabalhar leitura de gestos.',
    'Melhorar a posição defensiva base — centro de gravidade ainda muito alto.',
    'Defesas de bolas cortadas na linha: taxa de sucesso de apenas 35%.',
  ],
}

function dicaAleatoria(tipo: TipoAcao): string {
  const dicas = DICAS[tipo]
  return dicas[Math.floor(Math.random() * dicas.length)]
}

function gerarAcaoStats(tipo: TipoAcao, tentativas: number): AcaoStats {
  const sucessos = Math.floor(tentativas * (0.5 + Math.random() * 0.45))
  const erros = tentativas - sucessos
  return {
    tipo,
    tentativas,
    sucessos,
    erros,
    eficiencia: Math.round((sucessos / tentativas) * 100),
    dica: dicaAleatoria(tipo),
  }
}

const JOGADORES_DEMO: JogadorRelatorio[] = [
  {
    nome: 'Ana Lima', posicao: 'Levantadora', numero: 1,
    acoes: [
      { tipo: 'levantamento', tentativas: 42, sucessos: 36, erros: 6, eficiencia: 86, dica: DICAS.levantamento[0] },
      { tipo: 'saque', tentativas: 18, sucessos: 14, erros: 4, eficiencia: 78, dica: DICAS.saque[1] },
      { tipo: 'passe', tentativas: 12, sucessos: 8, erros: 4, eficiencia: 67, dica: DICAS.passe[2] },
    ],
    pontoForte: 'levantamento', pontoMelhoria: 'passe',
    destaque: 'Levantamento consistente — variação de zona pode surpreender mais o bloqueio adversário',
  },
  {
    nome: 'Carol Santos', posicao: 'Oposta', numero: 7,
    acoes: [
      { tipo: 'ataque', tentativas: 28, sucessos: 19, erros: 9, eficiencia: 68, dica: DICAS.ataque[1] },
      { tipo: 'saque', tentativas: 20, sucessos: 17, erros: 3, eficiencia: 85, dica: DICAS.saque[0] },
      { tipo: 'bloqueio', tentativas: 14, sucessos: 8, erros: 6, eficiencia: 57, dica: DICAS.bloqueio[0] },
    ],
    pontoForte: 'saque', pontoMelhoria: 'bloqueio',
    destaque: 'Saque mais eficiente do time — variar zonas de ataque vai aumentar pontuação',
  },
  {
    nome: 'Beatriz Rocha', posicao: 'Ponteira', numero: 10,
    acoes: [
      { tipo: 'ataque', tentativas: 22, sucessos: 14, erros: 8, eficiencia: 64, dica: DICAS.ataque[0] },
      { tipo: 'passe', tentativas: 24, sucessos: 18, erros: 6, eficiencia: 75, dica: DICAS.passe[0] },
      { tipo: 'defesa', tentativas: 16, sucessos: 10, erros: 6, eficiencia: 63, dica: DICAS.defesa[0] },
    ],
    pontoForte: 'passe', pontoMelhoria: 'ataque',
    destaque: 'Boa recepção — impulsão de ataque abaixo do potencial, prioridade de treino',
  },
  {
    nome: 'Fernanda Melo', posicao: 'Ponteira', numero: 4,
    acoes: [
      { tipo: 'ataque', tentativas: 19, sucessos: 14, erros: 5, eficiencia: 74, dica: DICAS.ataque[2] },
      { tipo: 'passe', tentativas: 20, sucessos: 16, erros: 4, eficiencia: 80, dica: DICAS.passe[1] },
      { tipo: 'defesa', tentativas: 18, sucessos: 13, erros: 5, eficiencia: 72, dica: DICAS.defesa[2] },
    ],
    pontoForte: 'passe', pontoMelhoria: 'defesa',
    destaque: 'Ataque diagonal precisa melhorar — atualmente zona de maior erro',
  },
  {
    nome: 'Juliana Costa', posicao: 'Central', numero: 3,
    acoes: [
      { tipo: 'bloqueio', tentativas: 20, sucessos: 15, erros: 5, eficiencia: 75, dica: DICAS.bloqueio[2] },
      { tipo: 'ataque', tentativas: 14, sucessos: 10, erros: 4, eficiencia: 71, dica: DICAS.ataque[2] },
      { tipo: 'defesa', tentativas: 10, sucessos: 6, erros: 4, eficiencia: 60, dica: DICAS.defesa[1] },
    ],
    pontoForte: 'bloqueio', pontoMelhoria: 'defesa',
    destaque: 'Melhor bloqueadora do time — timing de salto pode ser refinado',
  },
  {
    nome: 'Patrícia Alves', posicao: 'Central', numero: 6,
    acoes: [
      { tipo: 'bloqueio', tentativas: 18, sucessos: 10, erros: 8, eficiencia: 56, dica: DICAS.bloqueio[1] },
      { tipo: 'ataque', tentativas: 12, sucessos: 8, erros: 4, eficiencia: 67, dica: DICAS.ataque[0] },
      { tipo: 'passe', tentativas: 8, sucessos: 5, erros: 3, eficiencia: 63, dica: DICAS.passe[2] },
    ],
    pontoForte: 'ataque', pontoMelhoria: 'bloqueio',
    destaque: 'Toques na rede no bloqueio comprometem o resultado — foco prioritário',
  },
]

const RELATORIO_DEMO: Relatorio = {
  totalRallies: 38,
  duracaoMin: 62,
  movimentosEquipe: [
    { acao: 'saque', label: 'Saque', tentativas: 38, eficiencia: 79, dica: 'Time executa bem o saque potente mas precisa variar mais o saque flutuante.' },
    { acao: 'passe', label: 'Passe / Recepção', tentativas: 64, eficiencia: 73, dica: 'Recepção desorganiza quando o saque vai para zona 1 — trabalhar cobertura de zona.' },
    { acao: 'levantamento', label: 'Levantamento', tentativas: 42, eficiencia: 86, dica: 'Levantamento é o ponto mais forte do time — manter e explorar mais tempo a zona 4.' },
    { acao: 'ataque', label: 'Ataque', tentativas: 83, eficiencia: 69, dica: 'Ataque diagonal é o calcanhar de Aquiles — 40% de erro nessa linha.' },
    { acao: 'bloqueio', label: 'Bloqueio', tentativas: 52, eficiencia: 63, dica: 'Bloqueio perde eficiência no 3º set — possivelmente fadiga ou queda de concentração.' },
    { acao: 'defesa', label: 'Defesa', tentativas: 44, eficiencia: 65, dica: 'Defesas de bola cortada na linha precisam de atenção — leitura do atacante adversário.' },
  ],
  jogadores: JOGADORES_DEMO,
  resumo: 'Time tecnicamente competente com levantamento como maior força. Os principais pontos de melhoria são o ataque diagonal e o bloqueio no 3º set. Individualmente, Beatriz precisa de trabalho específico de impulsão e Patrícia deve eliminar os toques na rede.',
}

export function simularProcessamento(matchId: string, onUpdate: (m: Match) => void) {
  let progresso = 0
  const interval = setInterval(() => {
    const match = buscarMatch(matchId)
    if (!match) { clearInterval(interval); return }

    progresso += Math.floor(Math.random() * 18) + 8
    if (progresso >= 100) {
      progresso = 100
      const relatorio = match.isDemo ? RELATORIO_DEMO : gerarRelatorioAleatorio()
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
  const acoes: TipoAcao[] = ['saque', 'passe', 'levantamento', 'ataque', 'bloqueio', 'defesa']
  const movimentosEquipe: MovimentoEquipe[] = acoes.map(acao => {
    const tentativas = Math.floor(Math.random() * 40) + 20
    const eficiencia = Math.floor(Math.random() * 40) + 55
    return { acao, label: ACOES_LABELS[acao], tentativas, eficiencia, dica: dicaAleatoria(acao) }
  })

  const nomes = ['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4', 'Jogador 5', 'Jogador 6']
  const posicoes: string[] = ['Levantador', 'Oposto', 'Ponteiro', 'Ponteiro', 'Central', 'Central']
  const acoesPorPosicao: TipoAcao[][] = [
    ['levantamento', 'saque', 'passe'],
    ['ataque', 'saque', 'bloqueio'],
    ['ataque', 'passe', 'defesa'],
    ['ataque', 'passe', 'defesa'],
    ['bloqueio', 'ataque', 'defesa'],
    ['bloqueio', 'ataque', 'passe'],
  ]

  const jogadores: JogadorRelatorio[] = nomes.map((nome, i) => {
    const acoesList = acoesPorPosicao[i].map(tipo => gerarAcaoStats(tipo, Math.floor(Math.random() * 20) + 10))
    const sorted = [...acoesList].sort((a, b) => b.eficiencia - a.eficiencia)
    return {
      nome, posicao: posicoes[i], numero: i + 1,
      acoes: acoesList,
      pontoForte: sorted[0].tipo,
      pontoMelhoria: sorted[sorted.length - 1].tipo,
      destaque: `Ponto forte: ${ACOES_LABELS[sorted[0].tipo]} (${sorted[0].eficiencia}%)`,
    }
  })

  return {
    totalRallies: Math.floor(Math.random() * 20) + 30,
    duracaoMin: Math.floor(Math.random() * 30) + 50,
    movimentosEquipe,
    jogadores,
    resumo: 'Análise concluída. Confira os pontos de melhoria individuais e coletivos abaixo.',
  }
}
