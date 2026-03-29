'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnaliseEmAndamento({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<any>(null)
  const [erro, setErro] = useState('')
  const router = useRouter()

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/matches/${params.id}`)
        if (!res.ok) {
          setErro('Partida não encontrada.')
          return
        }
        const data = await res.json()
        setMatch(data.match)

        if (data.match.status === 'concluido') {
          router.push(`/relatorio/${params.id}`)
        }
      } catch {
        setErro('Erro ao verificar status.')
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [params.id, router])

  const etapas = [
    { label: 'Vídeo recebido', minimo: 0 },
    { label: 'Detectando jogadores', minimo: 20 },
    { label: 'Rastreando bola', minimo: 40 },
    { label: 'Identificando rotações', minimo: 60 },
    { label: 'Gerando relatório', minimo: 80 },
    { label: 'Análise concluída', minimo: 100 },
  ]

  const progresso = match?.progresso || 0
  const etapaAtual = [...etapas].reverse().find(e => progresso >= e.minimo) || etapas[0]

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-lg shadow-sm text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">V</div>
          <span className="font-bold text-xl text-gray-900">VôleiAI</span>
        </div>

        {erro ? (
          <div className="text-red-500">{erro}</div>
        ) : !match ? (
          <div className="text-gray-400">Carregando...</div>
        ) : (
          <>
            <div className="text-5xl mb-4">
              {progresso < 100 ? '⚙️' : '✅'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {progresso < 100 ? 'Analisando partida...' : 'Análise concluída!'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">{etapaAtual.label}</p>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-green-600 mb-6">{progresso}%</p>

            {/* Steps */}
            <div className="text-left space-y-3">
              {etapas.map((etapa, i) => {
                const concluida = progresso > etapa.minimo
                const ativa = etapaAtual.label === etapa.label && progresso < 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${concluida ? 'bg-green-500 text-white' : ativa ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                      {concluida ? '✓' : i + 1}
                    </div>
                    <span className={`text-sm ${concluida ? 'text-gray-700 font-medium' : ativa ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      {etapa.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {match.isDemo && (
              <p className="mt-6 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                🎮 Modo demo — dados simulados para demonstração
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
