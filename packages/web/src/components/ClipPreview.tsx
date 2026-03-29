'use client'
import { useState } from 'react'
import { type TipoAcao } from '@/lib/store'

// YouTube tutorial links per action type (used in demo mode)
// In production these are replaced by clips extracted from the uploaded match video
const TUTORIAIS: Record<TipoAcao, { query: string; label: string }> = {
  saque:        { query: 'volleyball serve technique common mistakes correction', label: 'Tutorial: Técnica de Saque' },
  passe:        { query: 'volleyball passing platform technique mistakes fix', label: 'Tutorial: Passe e Recepção' },
  levantamento: { query: 'volleyball setting technique mistakes correction', label: 'Tutorial: Levantamento' },
  ataque:       { query: 'volleyball spike approach arm swing mistakes', label: 'Tutorial: Técnica de Ataque' },
  bloqueio:     { query: 'volleyball blocking timing technique mistakes', label: 'Tutorial: Bloqueio' },
  defesa:       { query: 'volleyball defensive dig technique reading attacker', label: 'Tutorial: Defesa e Leitura' },
}

const CORES: Record<TipoAcao, string> = {
  saque:        'from-orange-900 to-orange-700',
  passe:        'from-blue-900 to-blue-700',
  levantamento: 'from-purple-900 to-purple-700',
  ataque:       'from-red-900 to-red-700',
  bloqueio:     'from-teal-900 to-teal-700',
  defesa:       'from-green-900 to-green-700',
}

const ICONES: Record<TipoAcao, string> = {
  saque: '🏐', passe: '🤜', levantamento: '🙌', ataque: '💥', bloqueio: '🛡️', defesa: '🤸',
}

interface Props {
  tipo: TipoAcao
  timestamp: string   // e.g. "12:34"
  descricao: string   // short description of what's shown
  isDemo?: boolean
  nomejogador?: string
}

export default function ClipPreview({ tipo, timestamp, descricao, isDemo, nomejogador }: Props) {
  const [modalAberto, setModalAberto] = useState(false)
  const tutorial = TUTORIAIS[tipo]
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(tutorial.query)}`

  return (
    <>
      {/* Clip card */}
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => setModalAberto(true)}
      >
        {/* Simulated video frame */}
        <div className={`bg-gradient-to-br ${CORES[tipo]} aspect-video flex items-center justify-center relative`}>

          {/* Fake court lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 320 180">
            <rect x="40" y="20" width="240" height="140" fill="none" stroke="white" strokeWidth="1.5"/>
            <line x1="160" y1="20" x2="160" y2="160" stroke="white" strokeWidth="2"/>
            <line x1="40" y1="90" x2="320" y2="90" stroke="white" strokeWidth="1"/>
          </svg>

          {/* Animated detection boxes — simulating CV overlay */}
          <div className="absolute inset-0">
            {/* Player 1 box */}
            <div className="absolute border-2 border-yellow-400 rounded"
              style={{ left: '22%', top: '35%', width: '12%', height: '40%', animation: 'pulse 2s infinite' }}>
              <span className="absolute -top-4 left-0 text-yellow-400 text-xs font-bold whitespace-nowrap bg-black/60 px-1 rounded">
                {nomejogador?.split(' ')[0] || 'Jogador'}
              </span>
            </div>
            {/* Player 2 box */}
            <div className="absolute border-2 border-green-400 rounded opacity-60"
              style={{ left: '55%', top: '40%', width: '10%', height: '35%' }}>
            </div>
            {/* Ball */}
            <div className="absolute w-4 h-4 bg-white rounded-full opacity-90 shadow-lg"
              style={{ left: '42%', top: '28%', animation: 'bounce 1s infinite' }}>
            </div>
            {/* Error highlight */}
            <div className="absolute border-2 border-red-500 rounded-full opacity-75"
              style={{ left: '20%', top: '33%', width: '16%', height: '44%', animation: 'pulse 1.5s infinite' }}>
            </div>
          </div>

          {/* Timestamp badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded">
            ⏱ {timestamp}
          </div>

          {/* Demo badge */}
          {isDemo && (
            <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded">
              🎮 Demo
            </div>
          )}

          {/* Play button */}
          <div className="relative z-10 w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all group-hover:scale-110 border-2 border-white/50">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>

          {/* Error label at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
            <div className="flex items-center gap-1.5">
              <span className="text-red-400 text-xs font-bold uppercase tracking-wide">⚠ Erro detectado</span>
              <span className="text-white/60 text-xs">·</span>
              <span className="text-white text-xs">{ICONES[tipo]} {descricao}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setModalAberto(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">{ICONES[tipo]} Análise do Erro</h3>
                <p className="text-xs text-gray-400">{nomejogador} · {timestamp}</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            {/* Clip (same preview, bigger) */}
            <div className={`bg-gradient-to-br ${CORES[tipo]} aspect-video flex items-center justify-center relative overflow-hidden`}>
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 320 180">
                <rect x="40" y="20" width="240" height="140" fill="none" stroke="white" strokeWidth="1.5"/>
                <line x1="160" y1="20" x2="160" y2="160" stroke="white" strokeWidth="2"/>
              </svg>
              <div className="absolute inset-0">
                <div className="absolute border-2 border-yellow-400 rounded" style={{ left: '22%', top: '35%', width: '12%', height: '40%' }}>
                  <span className="absolute -top-5 left-0 text-yellow-400 text-xs font-bold bg-black/70 px-1 rounded whitespace-nowrap">{nomejogador?.split(' ')[0] || 'Jogador'}</span>
                </div>
                <div className="absolute w-4 h-4 bg-white rounded-full" style={{ left: '42%', top: '28%' }}/>
                <div className="absolute border-2 border-red-500 rounded-full" style={{ left: '20%', top: '33%', width: '16%', height: '44%' }}>
                  <div className="absolute -bottom-6 left-0 text-red-400 text-xs font-bold bg-black/70 px-1 rounded whitespace-nowrap">⚠ {descricao}</div>
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded">⏱ {timestamp}</div>
            </div>

            {/* Content */}
            <div className="p-5">
              {isDemo ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-xs text-blue-700 font-semibold mb-1">📹 Sobre este clipe</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Em análises reais, este clipe é extraído automaticamente do seu vídeo no momento exato do erro. O sistema de visão computacional detecta o movimento, isola os frames relevantes e gera este destaque automaticamente.
                  </p>
                </div>
              ) : null}

              <p className="text-sm text-gray-700 font-medium mb-4">{descricao}</p>

              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">▶️</span>
                <div>
                  <p className="text-sm font-bold text-red-700">{tutorial.label}</p>
                  <p className="text-xs text-red-500">Ver tutoriais de correção no YouTube →</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
