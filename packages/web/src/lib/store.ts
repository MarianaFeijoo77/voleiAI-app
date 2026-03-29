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
  dica: string // improvement tip
  causaErros: string   // WHY the mistakes are happening (root cause)
  correcao: string     // HOW to fix the execution of the movement
  exercicio: string    // specific drill to practise the correction
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

interface AnaliseAcao {
  dica: string
  causaErros: string
  correcao: string
  exercicio: string
}

const ANALISES: Record<TipoAcao, AnaliseAcao[]> = {
  saque: [
    {
      dica: 'Aumentar variação de saque para desorganizar a recepção adversária.',
      causaErros: 'Lançamento da bola inconsistente — a bola sobe levemente para o lado, forçando compensação no balanço do braço e causando desvio na trajetória.',
      correcao: 'Lançar a bola sempre à frente do ombro de ataque, a ~30cm acima da cabeça. Congelar o braço livre após o lançamento antes de bater.',
      exercicio: 'Treino de lançamento sem bater: repetir o gesto de lançamento 20x consecutivas, focando em altura e direção consistentes antes de adicionar o golpe.',
    },
    {
      dica: 'Trabalhar saque flutuante como variação tática.',
      causaErros: 'Contato com a mão fechada no centro da bola gera rotação excessiva — bola perde efeito flutuante e fica previsível para a recepção.',
      correcao: 'No saque flutuante, bater com a palma rígida e parar o movimento do braço imediatamente após o contato. Sem follow-through.',
      exercicio: 'Séries de 10 saques flutuantes com foco em parar o braço: um parceiro avalia se a bola apresenta movimento oscilante na trajetória.',
    },
    {
      dica: 'Melhorar consistência no saque potente — erros laterais recorrentes.',
      causaErros: 'Pé de apoio posicionado paralelo à linha de fundo, em vez de levemente apontado para o alvo — corpo gira cedo demais e desvia a direção do golpe.',
      correcao: 'Posicionar o pé esquerdo apontando para o alvo antes do lançamento. A rotação do quadril deve seguir o pé, não preceder.',
      exercicio: 'Marcar fita no chão indicando a direção do alvo. Treinar 15 saques verificando alinhamento dos pés antes de cada execução.',
    },
  ],
  passe: [
    {
      dica: 'Melhorar o controle do passe em bolas de saque potente.',
      causaErros: 'Centro de gravidade alto no momento do contato — o jogador está em pé em vez de agachado, reduzindo o controle e a absorção de impacto da bola.',
      correcao: 'Dobrar os joelhos antes da bola chegar, não durante. A plataforma (antebraços unidos) deve estar formada 0,5s antes do contato.',
      exercicio: 'Treino de posição base: pular e pousar em posição baixa (joelhos dobrados, plataforma formada) antes de o parceiro lançar a bola. Repetir 20x.',
    },
    {
      dica: 'Ajustar ângulo de plataforma para passes mais direcionados.',
      causaErros: 'Braços elevados acima da linha do peito — a plataforma fica quase vertical, redirecionando a bola para cima em vez de para o levantador.',
      correcao: 'A plataforma deve fazer ~45° com o chão. Cotovelos esticados e travados, contato com a parte interna dos antebraços, não com os pulsos.',
      exercicio: 'Treino em dupla a curta distância (3m): rebater a bola apenas com a plataforma correta, sem deixar a bola subir acima de 2m. Foco no ângulo, não na força.',
    },
    {
      dica: 'Trabalhar leitura do saque para melhorar o tempo de chegada.',
      causaErros: 'Reação iniciada após a bola cruzar a rede — o jogador lê a trajetória tarde e chega ao ponto de contato em desequilíbrio ou em movimento.',
      correcao: 'Observar o gesto do sacador (posição do ombro, ângulo do braço) antes da bola ser lançada. Mover os pés durante o voo da bola, não depois.',
      exercicio: 'Treinador saca de diferentes zonas sem avisar — jogador deve verbalizar "zona 1", "zona 6", "zona 5" durante o voo da bola, antes do contato.',
    },
  ],
  levantamento: [
    {
      dica: 'Aumentar variação de levantamento para zonas menos usadas.',
      causaErros: 'Posição dos ombros durante o levantamento aponta consistentemente para zona 2 — atacantes e bloqueadores adversários leem a intenção antes do contato.',
      correcao: 'Manter a posição corporal neutra (ombros perpendiculares à rede) independente do destino do levantamento. A decisão deve estar nos pulsos, não nos ombros.',
      exercicio: 'Treino de engano: levantar 10x para zona 4, 10x para zona 2 — mantendo exatamente o mesmo gesto corporal até o momento do contato com a bola.',
    },
    {
      dica: 'Desenvolver levantamento em suspensão como arma tática.',
      causaErros: 'O levantamento em suspensão está sendo executado com salto muito vertical — a bola fica suspensa enquanto o jogador ainda sobe, reduzindo potência e ângulo.',
      correcao: 'Saltar levemente à frente (não só para cima) e contatar a bola no ponto mais alto do salto, não durante a subida.',
      exercicio: 'Marcar um cone à frente da posição de levantamento: o levantador deve pousar à frente do cone após cada levantamento em suspensão.',
    },
    {
      dica: 'Melhorar firmeza dos dedos para levantamentos com rotação limpa.',
      causaErros: 'Dedos sem tensão suficiente no contato — bola sai com rotação irregular (dedão puxa mais que indicador), gerando trajetória imprevisível para o atacante.',
      correcao: 'Todos os dedos com tensão igual, contato simultâneo dos dois polegares. O impulso deve vir da extensão dos pulsos, não dos dedos individualmente.',
      exercicio: 'Levantamento contra a parede em séries de 30: observar se a rotação da bola é limpa e uniforme. Parar e corrigir a cada erro de rotação.',
    },
  ],
  ataque: [
    {
      dica: 'Trabalhar impulsão vertical para aumentar ângulo de ataque.',
      causaErros: 'Passada de ataque muito curta — o último passo (o mais longo) está sendo dado a menos de 60cm do pé anterior, reduzindo a conversão de velocidade horizontal em vertical.',
      correcao: 'O penúltimo passo deve ser longo e agressivo, com o calcanhar tocando o chão primeiro. O último passo fecha o gesto, freando o corpo e convertendo em salto.',
      exercicio: 'Marcadores no chão indicando a posição ideal de cada passo. Treinar apenas a passada (sem bola) 30x, verificando que cada pé toca o marcador correto.',
    },
    {
      dica: 'Diversificar zonas de ataque para reduzir previsibilidade.',
      causaErros: 'Braço de ataque com trajetória sempre na mesma direção — o movimento do cotovelo aponta o destino, entregando a intenção ao bloqueio adversário com antecedência.',
      correcao: 'Decidir a zona de ataque apenas no momento em que o braço passa pela orelha (ponto de aceleração final). Antes disso, manter gesto neutro.',
      exercicio: 'Treinador segura uma plaquinha (zona 1 / zona 5 / linha) visível apenas quando o atacante está no ar — forçar decisão tardia de direção.',
    },
    {
      dica: 'Corrigir erro no ataque diagonal — maior zona de erro da equipe.',
      causaErros: 'No ataque diagonal, o contato está sendo feito atrás da linha do ombro — o pulso não tem ângulo suficiente para redirecionar a bola diagonalmente com precisão.',
      correcao: 'Contatar a bola levemente à frente e acima do ombro de ataque. Girar o pulso para fora (pronação) durante o golpe para direcionar a bola diagonalmente.',
      exercicio: 'Treino de ataque diagonal apenas, com bolas lançadas pelo treinador. Foco exclusivo na posição do contato: à frente do ombro + pronação do pulso.',
    },
  ],
  bloqueio: [
    {
      dica: 'Corrigir timing de salto para maximizar eficiência do bloqueio.',
      causaErros: 'Salto iniciado quando o atacante ainda está subindo — em vez de esperar o ponto de ataque, o bloqueador está no ar cedo demais e começa a descer quando a bola chega.',
      correcao: 'Saltar quando o braço de ataque do adversário passa pela orelha — não quando ele salta. Para atacantes mais rápidos, adicionar ~0,2s de atraso.',
      exercicio: 'Treino de leitura: observar vídeos de ataques e bater palma no momento correto do salto. Transferir para quadra com bloqueio apenas de timing, sem penetrar na rede.',
    },
    {
      dica: 'Eliminar toques na rede — infração recorrente identificada.',
      causaErros: 'Mãos penetram a rede no momento de queda do salto — o bloqueador mantém os braços estendidos para frente mesmo após o contato com a bola.',
      correcao: 'Após o contato (ou tentativa), recolher as mãos para o próprio lado imediatamente — puxar os cotovelos para trás antes de iniciar a queda.',
      exercicio: 'Treino com elástico na borda da rede: bloqueador deve cruzar os braços sem tocar o elástico. Repetir 20x com velocidade crescente.',
    },
    {
      dica: 'Melhorar posicionamento lateral antes do salto.',
      causaErros: 'Passo de deslocamento lateral insuficiente — bloqueador chega ao ponto de salto com o corpo fora da linha do atacante, gerando bloqueio de ângulo em vez de direto.',
      correcao: 'Usar passo cruzado para deslocamentos maiores que um passo simples. O ombro externo deve estar alinhado com o ombro de ataque adversário antes do salto.',
      exercicio: 'Treino de deslocamento: treinador aponta zona de ataque e bloqueador executa apenas o deslocamento lateral e posicionamento — sem saltar. Foco na velocidade do passo cruzado.',
    },
  ],
  defesa: [
    {
      dica: 'Melhorar leitura do atacante para antecipar a direção da bola.',
      causaErros: 'Defensor reage à bola após o contato — em vez de ler os gestos do atacante (rotação do ombro, ângulo do cotovelo) para predizer a direção.',
      correcao: 'Focar nos ombros do atacante durante a abordagem, não na bola. O ângulo do ombro de ataque revela a direção 0,3s antes do contato.',
      exercicio: 'Treino de leitura sem bola: atacante simula diferentes gestos de ataque e defensor se lança na direção correta antes de o "ataque" ser executado.',
    },
    {
      dica: 'Baixar centro de gravidade para posição defensiva eficiente.',
      causaErros: 'Posição base com joelhos quase estendidos — quando a bola vem rápida, o jogador não tem tempo de agachar antes do contato, resultando em defesa de braços sem corpo.',
      correcao: 'Posição de espera com quadril abaixo dos joelhos, peso na frente do pé (calcanhar levemente levantado). Pronto para explodir em qualquer direção.',
      exercicio: 'Treino isométrico: manter posição base correta por 30s, depois explodir lateralmente 3 passos. Repetir 10x. O objetivo é que a posição baixa se torne natural.',
    },
    {
      dica: 'Aumentar eficiência nas defesas de bola cortada na linha.',
      causaErros: 'Defensor se posiciona muito próximo à linha lateral — quando o ataque é cortado, precisa se mover para dentro do campo, mas a bola chega antes do reposicionamento.',
      correcao: 'Para ataques abertos (ponteira na diagonal), o defensor de linha deve se posicionar a 1,5–2m da linha, cobrindo tanto a linha quanto o corte. Ajustar posição conforme a posição do atacante.',
      exercicio: 'Marcadores de posição no chão para diferentes situações de ataque. Treinador indica a posição do atacante antes do rally e defensor ajusta antes da bola ser batida.',
    },
  ],
}

function analiseAleatoria(tipo: TipoAcao): AnaliseAcao {
  const lista = ANALISES[tipo]
  return lista[Math.floor(Math.random() * lista.length)]
}

function gerarAcaoStats(tipo: TipoAcao, tentativas: number): AcaoStats {
  const sucessos = Math.floor(tentativas * (0.5 + Math.random() * 0.45))
  const erros = tentativas - sucessos
  const analise = analiseAleatoria(tipo)
  return {
    tipo,
    tentativas,
    sucessos,
    erros,
    eficiencia: Math.round((sucessos / tentativas) * 100),
    ...analise,
  }
}

const A = ANALISES // shorthand

const JOGADORES_DEMO: JogadorRelatorio[] = [
  {
    nome: 'Ana Lima', posicao: 'Levantadora', numero: 1,
    acoes: [
      { tipo: 'levantamento', tentativas: 42, sucessos: 36, erros: 6, eficiencia: 86, ...A.levantamento[0] },
      { tipo: 'saque', tentativas: 18, sucessos: 14, erros: 4, eficiencia: 78, ...A.saque[1] },
      { tipo: 'passe', tentativas: 12, sucessos: 8, erros: 4, eficiencia: 67, ...A.passe[2] },
    ],
    pontoForte: 'levantamento', pontoMelhoria: 'passe',
    destaque: 'Levantamento consistente — variação de zona pode surpreender mais o bloqueio adversário',
  },
  {
    nome: 'Carol Santos', posicao: 'Oposta', numero: 7,
    acoes: [
      { tipo: 'ataque', tentativas: 28, sucessos: 19, erros: 9, eficiencia: 68, ...A.ataque[1] },
      { tipo: 'saque', tentativas: 20, sucessos: 17, erros: 3, eficiencia: 85, ...A.saque[0] },
      { tipo: 'bloqueio', tentativas: 14, sucessos: 8, erros: 6, eficiencia: 57, ...A.bloqueio[0] },
    ],
    pontoForte: 'saque', pontoMelhoria: 'bloqueio',
    destaque: 'Saque mais eficiente do time — variar zonas de ataque vai aumentar pontuação',
  },
  {
    nome: 'Beatriz Rocha', posicao: 'Ponteira', numero: 10,
    acoes: [
      { tipo: 'ataque', tentativas: 22, sucessos: 14, erros: 8, eficiencia: 64, ...A.ataque[0] },
      { tipo: 'passe', tentativas: 24, sucessos: 18, erros: 6, eficiencia: 75, ...A.passe[0] },
      { tipo: 'defesa', tentativas: 16, sucessos: 10, erros: 6, eficiencia: 63, ...A.defesa[0] },
    ],
    pontoForte: 'passe', pontoMelhoria: 'ataque',
    destaque: 'Boa recepção — impulsão de ataque abaixo do potencial, prioridade de treino',
  },
  {
    nome: 'Fernanda Melo', posicao: 'Ponteira', numero: 4,
    acoes: [
      { tipo: 'ataque', tentativas: 19, sucessos: 14, erros: 5, eficiencia: 74, ...A.ataque[2] },
      { tipo: 'passe', tentativas: 20, sucessos: 16, erros: 4, eficiencia: 80, ...A.passe[1] },
      { tipo: 'defesa', tentativas: 18, sucessos: 13, erros: 5, eficiencia: 72, ...A.defesa[2] },
    ],
    pontoForte: 'passe', pontoMelhoria: 'defesa',
    destaque: 'Ataque diagonal precisa melhorar — atualmente zona de maior erro',
  },
  {
    nome: 'Juliana Costa', posicao: 'Central', numero: 3,
    acoes: [
      { tipo: 'bloqueio', tentativas: 20, sucessos: 15, erros: 5, eficiencia: 75, ...A.bloqueio[2] },
      { tipo: 'ataque', tentativas: 14, sucessos: 10, erros: 4, eficiencia: 71, ...A.ataque[2] },
      { tipo: 'defesa', tentativas: 10, sucessos: 6, erros: 4, eficiencia: 60, ...A.defesa[1] },
    ],
    pontoForte: 'bloqueio', pontoMelhoria: 'defesa',
    destaque: 'Melhor bloqueadora do time — timing de salto pode ser refinado',
  },
  {
    nome: 'Patrícia Alves', posicao: 'Central', numero: 6,
    acoes: [
      { tipo: 'bloqueio', tentativas: 18, sucessos: 10, erros: 8, eficiencia: 56, ...A.bloqueio[1] },
      { tipo: 'ataque', tentativas: 12, sucessos: 8, erros: 4, eficiencia: 67, ...A.ataque[0] },
      { tipo: 'passe', tentativas: 8, sucessos: 5, erros: 3, eficiencia: 63, ...A.passe[2] },
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
