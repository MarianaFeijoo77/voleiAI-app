'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { buscarMatch, type Match, type TipoAcao } from '@/lib/store'
import ClipPreview from '@/components/ClipPreview'

const ICONES: Record<TipoAcao, string> = {
  saque: '🏐',
  passe: '🤜',
  levantamento: '🙌',
  ataque: '💥',
  bloqueio: '🛡️',
  defesa: '🤸',
}

function EficienciaBadge({ valor }: { valor: number }) {
  const cls = valor >= 78 ? 'text-green-600 bg-green-50' : valor >= 60 ? 'text-yellow-600 bg-yellow-50' : 'text-red-500 bg-red-50'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{valor}%</span>
}

function BarraEficiencia({ valor }: { valor: number }) {
  const cor = valor >= 78 ? 'bg-green-500' : valor >= 60 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${cor}`} style={{ width: `${valor}%` }} />
    </div>
  )
}

export default function Relatorio() {
  const { id } = useParams() as { id: string }
  const [match, setMatch] = useState<Match | null>(null)
  const [erro, setErro] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'equipe' | 'jogadores'>('equipe')
  const [jogadorAtivo, setJogadorAtivo] = useState(0)

  useEffect(() => {
    if (!id) return
    const m = buscarMatch(id)
    if (!m) { setErro('Relatório não encontrado.'); return }
    setMatch(m)
  }, [id])

  if (erro) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-red-500 mb-4">{erro}</p>
        <Link href="/upload" className="text-green-600 font-semibold hover:underline">← Nova análise</Link>
      </div>
    </main>
  )

  if (!match) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Carregando...</div>
    </main>
  )

  if (!match.relatorio) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600 mb-4">Análise ainda em andamento.</p>
        <Link href={`/analise/${id}`} className="text-green-600 font-semibold hover:underline">Ver progresso →</Link>
      </div>
    </main>
  )

  const { relatorio } = match
  const jogador = relatorio.jogadores[jogadorAtivo]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
          <span className="font-bold text-xl text-gray-900">VôleiAI</span>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Início</Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Match header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">✅ Análise concluída</span>
            {match.isDemo && <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">🎮 Demo</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{match.homeTeamNome} vs {match.awayTeamNome}</h1>
          <p className="text-gray-500 text-sm mt-1">{match.nomeArquivo} · {relatorio.totalRallies} rallies · {relatorio.duracaoMin} min</p>
        </div>

        {/* Coach summary */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">📋 Resumo para o treinador</p>
          <p className="text-gray-800 text-sm leading-relaxed">{relatorio.resumo}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setAbaAtiva('equipe')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${abaAtiva === 'equipe' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏐 Movimentos da Equipe
          </button>
          <button
            onClick={() => setAbaAtiva('jogadores')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${abaAtiva === 'jogadores' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            👥 Análise Individual
          </button>
        </div>

        {/* Team movements tab */}
        {abaAtiva === 'equipe' && (
          <div className="space-y-4">
            {relatorio.movimentosEquipe.map((m) => (
              <div key={m.acao} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ICONES[m.acao]}</span>
                    <span className="font-bold text-gray-900">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{m.tentativas} ações</span>
                    <EficienciaBadge valor={m.eficiencia} />
                  </div>
                </div>
                <BarraEficiencia valor={m.eficiencia} />
                <div className="mt-3 bg-yellow-50 rounded-xl p-3">
                  <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide mb-1">💡 Foco coletivo</p>
                  <p className="text-sm text-gray-700">{m.dica}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Individual analysis tab */}
        {abaAtiva === 'jogadores' && (
          <div>
            {/* Player selector */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1">
              {relatorio.jogadores.map((j, i) => (
                <button
                  key={i}
                  onClick={() => setJogadorAtivo(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap
                    ${jogadorAtivo === i ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'}`}
                >
                  #{j.numero} {j.nome.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Player card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{jogador.nome}</h2>
                  <p className="text-gray-500 text-sm">#{jogador.numero} · {jogador.posicao}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-2 justify-end flex-wrap">
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
                      ⚡ Forte: {ICONES[jogador.pontoForte]} {jogador.pontoForte}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-1 rounded-full">
                      🎯 Foco: {ICONES[jogador.pontoMelhoria]} {jogador.pontoMelhoria}
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlight */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
                <p className="text-sm text-blue-800">{jogador.destaque}</p>
              </div>

              {/* Actions breakdown */}
              <div className="space-y-6">
                {jogador.acoes.map((acao) => (
                  <div key={acao.tipo} className="border border-gray-100 rounded-xl p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ICONES[acao.tipo]}</span>
                        <span className="font-bold text-gray-900 text-sm capitalize">{acao.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-green-600 font-semibold">{acao.sucessos}✓</span>
                        <span className="text-red-500 font-semibold">{acao.erros}✗</span>
                        <EficienciaBadge valor={acao.eficiencia} />
                      </div>
                    </div>
                    <BarraEficiencia valor={acao.eficiencia} />

                    {/* 3-layer analysis — only show if there are errors */}
                    {acao.erros > 0 && (
                      <div className="mt-3 space-y-2">
                        <ClipPreview
                          tipo={acao.tipo}
                          timestamp={acao.clipTimestamp}
                          descricao={acao.clipDescricao}
                          isDemo={match.isDemo}
                          nomejogador={jogador.nome}
                        />
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">🔍 Por que está errando</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{acao.causaErros}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">⚙️ Como corrigir a execução</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{acao.correcao}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">🏋️ Exercício de treino</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{acao.exercicio}</p>
                        </div>
                      </div>
                    )}
                    {acao.erros === 0 && (
                      <div className="mt-2 bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-green-700">✅ Sem erros neste fundamento nesta partida.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Link href="/upload" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-center hover:bg-green-700 transition-colors text-sm">
            + Nova Análise
          </Link>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Relatório VôleiAI', url: window.location.href })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copiado!')
              }
            }}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm"
          >
            📤 Compartilhar
          </button>
        </div>
      </div>
    </main>
  )
}
