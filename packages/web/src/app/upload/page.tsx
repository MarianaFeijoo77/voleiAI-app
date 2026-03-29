'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { criarMatch, simularProcessamento } from '@/lib/store'

export default function UploadDeVideo() {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleEnvio() {
    if (!arquivo) return
    setEnviando(true)
    setErro('')

    const match = criarMatch({ nomeArquivo: arquivo.name, homeTeamNome: 'Time A', awayTeamNome: 'Time B' })

    // Simulate chunked upload progress
    let p = 0
    const uploadInterval = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 10
      if (p >= 100) {
        clearInterval(uploadInterval)
        setProgresso(100)
        router.push(`/analise/${match.id}`)
      } else {
        setProgresso(p)
      }
    }, 300)
  }

  async function handleDemo() {
    setEnviando(true)
    setErro('')
    const match = criarMatch({ nomeArquivo: 'demo.mp4', homeTeamNome: 'Clube A', awayTeamNome: 'Clube B', isDemo: true })
    router.push(`/analise/${match.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-lg shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">V</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analisar Partida</h1>
            <p className="text-gray-400 text-sm">VôleiAI — análise por computador visão</p>
          </div>
        </div>

        <p className="text-gray-500 mb-6 text-sm">Formatos aceitos: MP4, MOV. Tamanho máximo: 2GB.</p>

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-green-400 transition-colors mb-5"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) setArquivo(file)
          }}
        >
          {arquivo ? (
            <div>
              <div className="text-3xl mb-2">🎬</div>
              <p className="font-semibold text-gray-800">{arquivo.name}</p>
              <p className="text-sm text-gray-400">{(arquivo.size / 1024 / 1024).toFixed(1)} MB</p>
              <button onClick={e => { e.stopPropagation(); setArquivo(null) }} className="text-xs text-red-400 mt-2 hover:text-red-600">Remover</button>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-600 font-medium">Clique para selecionar o vídeo</p>
              <p className="text-gray-400 text-sm mt-1">ou arraste e solte aqui</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={e => setArquivo(e.target.files?.[0] || null)} />
        </div>

        {enviando && progresso > 0 && (
          <div className="mb-5">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Enviando vídeo...</span>
              <span>{progresso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{erro}</p>
          </div>
        )}

        <button
          onClick={handleEnvio}
          disabled={!arquivo || enviando}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
        >
          {enviando ? 'Enviando...' : 'Iniciar Análise →'}
        </button>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-3">Quer ver um exemplo sem enviar vídeo?</p>
          <button onClick={handleDemo} disabled={enviando} className="text-green-600 text-sm font-semibold hover:underline disabled:opacity-50">
            🎮 Ver demo com dados simulados →
          </button>
        </div>
      </div>
    </main>
  )
}
