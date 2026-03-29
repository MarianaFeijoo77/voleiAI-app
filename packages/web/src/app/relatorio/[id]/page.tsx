'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Relatorio({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<any>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/matches/${params.id}`)
      .then(r => r.json())
      .then(d => setMatch(d.match))
      .catch(() => setErro('Erro ao carregar relatório.'))
  }, [params.id])

  if (erro) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-red-500">{erro}</div>
    </main>
  )

  if (!match) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Carregando relatório...</div>
    </main>
  )

  const relatorio = match.relatorio
  if (!relatorio) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Análise ainda em andamento.</p>
        <Link href={`/analise/${params.id}`} className="text-green-600 font-semibold mt-4 inline-block hover:underline">
          Ver progresso →
        </Link>
      </div>
    </main>
  )

  const melhorRotacao = [...relatorio.rotacoes].sort((a: any, b: any) => b.eficiencia - a.eficiencia)[0]
  const piorRotacao = [...relatorio.rotacoes].sort((a: any, b: any) => a.eficiencia - b.eficiencia)[0]
  const topJogador = [...relatorio.jogadores].sort((a: any, b: any) => b.pontos - a.pontos)[0]

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
          <span className="font-bold text-xl text-gray-900">VôleiAI</span>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Início</Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">✅ Análise concluída</span>
            {match.isDemo && <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">🎮 Demo</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{match.homeTeamNome} vs {match.awayTeamNome}</h1>
          <p className="text-gray-500 text-sm mt-1">{match.nomeArquivo} · {relatorio.totalRallies} rallies · {relatorio.totalPontos} pontos</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{relatorio.totalRallies}</div>
            <div className="text-xs text-gray-500 mt-1">Rallies</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{melhorRotacao.eficiencia}%</div>
            <div className="text-xs text-gray-500 mt-1">Melhor rotação (R{melhorRotacao.rotacao})</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{topJogador.pontos}</div>
            <div className="text-xs text-gray-500 mt-1">Pontos · {topJogador.nome.split(' ')[0]}</div>
          </div>
        </div>

        {/* Rotation analysis */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-1">📊 Análise por Rotação</h2>
          <p className="text-xs text-gray-400 mb-5">
            ⚡ Rotação forte: R{melhorRotacao.rotacao} ({melhorRotacao.eficiencia}% eficiência) &nbsp;·&nbsp;
            ⚠️ Rotação fraca: R{piorRotacao.rotacao} ({piorRotacao.eficiencia}% eficiência)
          </p>
          <div className="space-y-3">
            {relatorio.rotacoes.map((r: any) => (
              <div key={r.rotacao}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Rotação {r.rotacao}</span>
                  <span className="text-gray-500">{r.pontos}pts · {r.erros} erros · <span className={`font-semibold ${r.eficiencia >= 75 ? 'text-green-600' : r.eficiencia >= 55 ? 'text-yellow-600' : 'text-red-500'}`}>{r.eficiencia}%</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${r.eficiencia >= 75 ? 'bg-green-500' : r.eficiencia >= 55 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${r.eficiencia}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player cards */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-5">👥 Desempenho dos Jogadores</h2>
          <div className="grid grid-cols-2 gap-3">
            {relatorio.jogadores.map((j: any, i: number) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="font-semibold text-gray-900 text-sm">{j.nome}</div>
                <div className="text-xs text-gray-400 mb-3">{j.posicao}</div>
                <div className="flex justify-between text-xs">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{j.pontos}</div>
                    <div className="text-gray-400">pontos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-500">{j.erros}</div>
                    <div className="text-gray-400">erros</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${j.eficiencia >= 75 ? 'text-green-600' : j.eficiencia >= 55 ? 'text-yellow-600' : 'text-red-500'}`}>{j.eficiencia}%</div>
                    <div className="text-gray-400">efic.</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/upload" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-center hover:bg-green-700 transition-colors text-sm">
            + Nova Análise
          </Link>
          <button
            onClick={() => {
              const url = window.location.href
              if (navigator.share) {
                navigator.share({ title: 'Relatório VôleiAI', url })
              } else {
                navigator.clipboard.writeText(url)
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
