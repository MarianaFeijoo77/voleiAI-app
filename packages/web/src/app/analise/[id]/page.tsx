'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const DICAS = [
  'O VôleiAI analisa cada toque de bola usando visão computacional avançada.',
  'O relatório de rotações mostra qual formação gera mais pontos para o seu time.',
  'Você receberá uma notificação quando a análise estiver pronta.',
  'Dica: filme de lado, na altura de 2-3 metros para melhores resultados.',
  'O sistema identifica automaticamente saques, recepções, levantamentos e ataques.',
]

export default function AnaliseEmProgresso() {
  const { id } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState('processando')
  const [dicaIdx, setDicaIdx] = useState(0)

  useEffect(() => {
    const dicas = setInterval(() => setDicaIdx(i => (i + 1) % DICAS.length), 5000)
    return () => clearInterval(dicas)
  }, [])

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const resp = await fetch(`/api/matches/${id}/status`)
        const data = await resp.json()
        if (data.status === 'concluido') {
          clearInterval(poll)
          router.push(`/relatorio/${id}`)
        } else if (data.status === 'erro') {
          clearInterval(poll)
          setStatus('erro')
        }
      } catch (e) {
        console.error('Erro ao verificar status:', e)
      }
    }, 3000) // Poll a cada 3s — rápido para demo/mock (5-10s de processamento)
    return () => clearInterval(poll)
  }, [id, router])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 w-full max-w-md text-center">
        <div className="text-6xl mb-6 animate-bounce">⚙️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analisando Partida</h1>
        <p className="text-gray-500 mb-8 text-sm">Tempo estimado: 20–45 minutos para uma partida completa.</p>

        <div className="w-full bg-gray-100 rounded-full h-3 mb-8">
          <div className="bg-green-500 h-3 rounded-full animate-pulse" style={{ width: '45%' }} />
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
          <p className="text-green-800 text-sm font-medium">💡 {DICAS[dicaIdx]}</p>
        </div>

        {status === 'erro' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">Erro ao processar o vídeo. Entre em contato com o suporte.</p>
          </div>
        )}
      </div>
    </main>
  )
}
