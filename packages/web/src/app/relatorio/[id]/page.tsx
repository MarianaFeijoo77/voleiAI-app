'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { pt } from '@/lib/i18n'

interface Evento {
  timestamp_ms: number
  set: number
  rally: number
  player_id: string
  action: string
  confidence: number
  court_position: { x: number; y: number }
  outcome: string
}

interface Rotacao {
  rally: number
  set: number
  timestamp_ms: number
  time_a: Array<{ posicao_rotacao: string; player_id: string }>
  time_b: Array<{ posicao_rotacao: string; player_id: string }>
}

interface RelatorioData {
  matchId: string
  timeA: string
  timeB: string
  data: string
  confiancaMedia: number
  totalEventos: number
  duracaoSegundos: number
  shareToken: string
  cvOutput: {
    events: Evento[]
    rotations: Rotacao[]
  }
}

const ACAO_CORES: Record<string, string> = {
  saque: 'bg-blue-100 text-blue-800',
  recepcao: 'bg-yellow-100 text-yellow-800',
  levantamento: 'bg-purple-100 text-purple-800',
  ataque: 'bg-red-100 text-red-800',
  bloqueio: 'bg-orange-100 text-orange-800',
  defesa: 'bg-green-100 text-green-800',
  bola_livre: 'bg-gray-100 text-gray-700',
}

export default function RelatorioPartida() {
  const { id } = useParams()
  const [dados, setDados] = useState<RelatorioData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'rotacoes' | 'jogadores' | 'eventos'>('rotacoes')

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(d => { setDados(d); setCarregando(false) })
      .catch(() => { setErro(true); setCarregando(false) })
  }, [id])

  if (carregando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-500 font-medium">Carregando relatório...</p>
      </div>
    </div>
  )

  if (erro || !dados) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-red-500 font-medium">Relatório não encontrado.</p>
        <a href="/" className="text-green-600 text-sm mt-2 block hover:underline">← Voltar ao início</a>
      </div>
    </div>
  )

  const eventos = dados.cvOutput?.events || []
  const rotacoes = dados.cvOutput?.rotations || []

  // Analytics
  const eventsByAction = eventos.reduce((acc: Record<string, number>, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1
    return acc
  }, {})

  const eventsByPlayer = eventos.reduce((acc: Record<string, number>, e) => {
    acc[e.player_id] = (acc[e.player_id] || 0) + 1
    return acc
  }, {})

  const attackEfficiency = (() => {
    const ataques = eventos.filter(e => e.action === 'ataque')
    const pontos = ataques.filter(e => e.outcome === 'ponto').length
    const erros = ataques.filter(e => e.outcome === 'erro').length
    return ataques.length ? ((pontos - erros) / ataques.length * 100).toFixed(1) : '—'
  })()

  // Pontos por rotação (primeiras 6 rotações = 1 set completo)
  const pontosPorRotacao = rotacoes.slice(0, 6).map((rot, i) => ({
    rotacao: `R${i + 1}`,
    set: rot.set,
    eventos: eventos.filter(e => e.rally === rot.rally).length,
    pontos: eventos.filter(e => e.rally === rot.rally && e.outcome === 'ponto').length,
  }))

  const duracaoMin = Math.floor((dados.duracaoSegundos || 0) / 60)
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/relatorio/${id}` : ''
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`📊 Relatório VôleiAI — ${dados.timeA} vs ${dados.timeB}: ${shareUrl}`)}`

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">V</div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{dados.timeA} vs {dados.timeB}</p>
            <p className="text-xs text-gray-400">{new Date(dados.data).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 flex items-center gap-1 flex-shrink-0"
        >
          📱 Compartilhar
        </a>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard titulo="Eventos" valor={String(dados.totalEventos || eventos.length || 0)} icone="⚡" />
          <MetricCard
            titulo="Confiança IA"
            valor={`${((dados.confiancaMedia || 0) * 100).toFixed(0)}%`}
            icone="🎯"
            cor={(dados.confiancaMedia || 0) > 0.75 ? 'green' : 'yellow'}
          />
          <MetricCard titulo="Efic. Ataque" valor={`${attackEfficiency}%`} icone="🏐" />
          <MetricCard titulo="Duração" valor={`${duracaoMin}min`} icone="⏱️" />
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {(['rotacoes', 'jogadores', 'eventos'] as const).map(aba => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                abaAtiva === aba
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {aba === 'rotacoes' ? '🔄 Rotações' : aba === 'jogadores' ? '👥 Jogadores' : '📋 Eventos'}
            </button>
          ))}
        </div>

        {/* Tab: Rotações */}
        {abaAtiva === 'rotacoes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Desempenho por Rotação</h2>
              {pontosPorRotacao.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhuma rotação detectada.</p>
              ) : (
                <div className="space-y-3">
                  {pontosPorRotacao.map((rot, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {rot.rotacao}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Set {rot.set}</span>
                          <span className="font-semibold text-gray-700">{rot.eventos} eventos · {rot.pontos} pts</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (rot.eventos / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formação inicial */}
            {rotacoes[0] && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4">Formação Inicial — Rally 1, Set 1</h2>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-xs text-green-700 font-semibold mb-3">🟢 Time A (casa)</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {rotacoes[0].time_a.slice(0, 6).map((p, i) => (
                      <div key={i} className="bg-green-600 text-white rounded-lg p-2 text-center">
                        <p className="text-xs font-bold">{p.posicao_rotacao}</p>
                        <p className="text-xs opacity-80">{p.player_id}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 border-green-300 my-2" />
                  <p className="text-xs text-blue-700 font-semibold mb-3 mt-2">🔵 Time B (visitante)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {rotacoes[0].time_b.slice(0, 6).map((p, i) => (
                      <div key={i} className="bg-blue-600 text-white rounded-lg p-2 text-center">
                        <p className="text-xs font-bold">{p.posicao_rotacao}</p>
                        <p className="text-xs opacity-80">{p.player_id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Jogadores */}
        {abaAtiva === 'jogadores' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">Desempenho Individual</h2>
            {Object.keys(eventsByPlayer).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum dado de jogador disponível.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(eventsByPlayer)
                  .sort(([, a], [, b]) => b - a)
                  .map(([pid, total]) => {
                    const pEventos = eventos.filter(e => e.player_id === pid)
                    const ataques = pEventos.filter(e => e.action === 'ataque').length
                    const pontos = pEventos.filter(e => e.outcome === 'ponto').length
                    const confMedia = pEventos.reduce((s, e) => s + e.confidence, 0) / pEventos.length

                    return (
                      <div key={pid} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {pid.replace('J', '')}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Jogador {pid}</p>
                            <p className="text-xs text-gray-400">{total} toques totais</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-gray-900">{ataques}</p>
                            <p className="text-xs text-gray-400">Ataques</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-600">{pontos}</p>
                            <p className="text-xs text-gray-400">Pontos</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">{(confMedia * 100).toFixed(0)}%</p>
                            <p className="text-xs text-gray-400">Conf. IA</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Eventos */}
        {abaAtiva === 'eventos' && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-3">Linha do Tempo de Eventos</h2>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(eventsByAction)
                  .sort(([, a], [, b]) => b - a)
                  .map(([acao, count]) => (
                    <span
                      key={acao}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${ACAO_CORES[acao] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {pt.acoes[acao as keyof typeof pt.acoes] || acao}: {count}
                    </span>
                  ))}
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {eventos.slice(0, 100).map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${ACAO_CORES[e.action] || 'bg-gray-100 text-gray-700'}`}>
                    {pt.acoes[e.action as keyof typeof pt.acoes] || e.action}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 truncate min-w-0">
                    {e.player_id} · S{e.set} R{e.rally}
                  </span>
                  <span className={`text-xs font-semibold flex-shrink-0 ${
                    e.outcome === 'ponto' ? 'text-green-600'
                    : e.outcome === 'erro' ? 'text-red-500'
                    : 'text-gray-400'
                  }`}>
                    {e.outcome === 'ponto' ? '✓' : e.outcome === 'erro' ? '✗' : '→'}
                  </span>
                  <span className="text-xs text-gray-300 flex-shrink-0">{(e.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
              {eventos.length > 100 && (
                <div className="px-5 py-4 text-center text-xs text-gray-400">
                  Mostrando 100 de {eventos.length} eventos
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <a href="/" className="text-gray-400 text-xs hover:text-gray-600">← Voltar ao início</a>
          <p className="text-gray-300 text-xs mt-2">VôleiAI · Análise por IA 🏐</p>
        </div>
      </div>
    </main>
  )
}

function MetricCard({
  titulo,
  valor,
  icone,
  cor = 'gray',
}: {
  titulo: string
  valor: string
  icone: string
  cor?: 'green' | 'yellow' | 'gray'
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <div className="text-2xl mb-1">{icone}</div>
      <div className={`text-xl font-bold ${
        cor === 'green' ? 'text-green-600'
        : cor === 'yellow' ? 'text-yellow-600'
        : 'text-gray-900'
      }`}>
        {valor}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{titulo}</div>
    </div>
  )
}
