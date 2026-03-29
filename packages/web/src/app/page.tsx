import Link from 'next/link'

export default function Inicio() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
          <span className="font-bold text-xl text-gray-900">VôleiAI</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/upload" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
            Analisar Partida
          </Link>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, Treinador 👋</h1>
        <p className="text-gray-500 mb-10">Transforme filmagens em relatórios táticos em menos de 45 minutos.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard titulo="Partidas Analisadas" valor="0" icone="🏐" />
          <StatCard titulo="Jogadores Cadastrados" valor="0" icone="👥" />
          <StatCard titulo="Relatórios Gerados" valor="0" icone="📊" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma partida ainda</h2>
          <p className="text-gray-500 mb-6">Faça o upload de um vídeo para começar sua primeira análise.</p>
          <Link href="/upload" className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
            Enviar Primeiro Vídeo →
          </Link>
        </div>
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
