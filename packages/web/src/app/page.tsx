'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { listarMatches, type Match } from '@/lib/store'

export default function Inicio() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    setMatches(listarMatches())
  }, [])

  const concluidas = matches.filter(m => m.status === 'concluido').length

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
          <span className="font-bold text-xl text-gray-900">VôleiAI</span>
        </div>
        <Link href="/upload" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
          Analisar Partida
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, Treinador 👋</h1>
        <p className="text-gray-500 mb-10">Transforme filmagens em relatórios táticos em menos de 45 minutos.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard titulo="Partidas Analisadas" valor={String(concluidas)} icone="🏐" />
          <StatCard titulo="Total de Partidas" valor={String(matches.length)} icone="🎬" />
          <StatCard titulo="Relatórios Gerados" valor={String(concluidas)} icone="📊" />
        </div>

        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma partida ainda</h2>
            <p className="text-gray-500 mb-6">Faça o upload de um vídeo para começar sua primeira análise.</p>
            <Link href="/upload" className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
              Enviar Primeiro Vídeo →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Partidas Recentes</h2>
              <Link href="/upload" className="text-sm text-green-600 font-semibold hover:underline">+ Nova análise</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {matches.slice(0, 10).map(m => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{m.homeTeamNome} vs {m.awayTeamNome}</p>
                    <p className="text-xs text-gray-400">{m.nomeArquivo} · {new Date(m.criadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={m.status} />
                    {m.status === 'concluido' && (
                      <Link href={`/relatorio/${m.id}`} className="text-xs text-green-600 font-semibold hover:underline">Ver relatório →</Link>
                    )}
                    {m.status === 'processando' && (
                      <Link href={`/analise/${m.id}`} className="text-xs text-gray-500 hover:underline">Ver progresso →</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({ titulo, valor, icone }: { titulo: string; valor: string; icone: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-3xl mb-3">{icone}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{valor}</div>
      <div className="text-sm text-gray-500">{titulo}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    criado: { label: 'Criado', cls: 'bg-gray-100 text-gray-600' },
    processando: { label: 'Processando...', cls: 'bg-yellow-100 text-yellow-700' },
    concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
    erro: { label: 'Erro', cls: 'bg-red-100 text-red-600' },
  }
  const s = map[status] || map.criado
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}
