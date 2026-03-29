import { exec } from 'child_process'
import { promisify } from 'util'
import { gerarAnalyseMock } from './mock-cv.js'

const execAsync = promisify(exec)

export interface CVOutput {
  match_id: string
  duration_seconds: number
  confianca_media: number
  fps: number
  events: CVEvent[]
  rotations: CVRotation[]
}

export interface CVEvent {
  timestamp_ms: number
  frame_idx: number
  set?: number
  rally?: number
  team?: string
  player_id: string
  action: string
  confidence: number
  court_position: { x: number; y: number }
  outcome: string
}

export interface CVRotation {
  set?: number
  set_number?: number
  rally?: number
  rotation_number?: number
  timestamp_ms?: number
  time_a?: any[]
  time_b?: any[]
  posicoes?: Record<string, { x: number; y: number }>
  pontos_ganhos?: number
  pontos_perdidos?: number
  eficiencia?: number
}

/**
 * Executa o pipeline CV.
 * Se MODAL_ENABLED !== 'true', usa dados mock (sem GPU/Modal.com).
 * Em produção, chama Modal.com via CLI ou HTTP endpoint.
 */
export async function runCVPipeline(
  videoChave: string,
  matchId: string
): Promise<CVOutput> {
  if (process.env.MODAL_ENABLED !== 'true') {
    console.log(`[cv] MODAL_ENABLED=false — usando pipeline mock para partida ${matchId}`)

    // Simular tempo de processamento (5-10s em dev)
    const delay = 5000 + Math.random() * 5000
    await new Promise(resolve => setTimeout(resolve, delay))

    const mockOutput = gerarAnalyseMock(matchId)
    console.log(
      `[cv] Mock gerado: ${mockOutput.events.length} eventos, ` +
      `confiança média ${(mockOutput.confianca_media * 100).toFixed(1)}%`
    )
    return mockOutput
  }

  // === Produção: chamada real ao Modal.com ===
  console.log(`[modal] Enviando para pipeline CV: matchId=${matchId}, video=${videoChave}`)

  const cmd = [
    'python', '-m', 'modal', 'run',
    'packages/cv-pipeline/modal_app.py::analisar_partida',
    '--video-url', videoChave,
    '--match-id', matchId,
  ].join(' ')

  try {
    const { stdout } = await execAsync(cmd, {
      timeout: 50 * 60 * 1000, // 50 minutos
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        MODAL_TOKEN_ID: process.env.MODAL_TOKEN_ID!,
        MODAL_TOKEN_SECRET: process.env.MODAL_TOKEN_SECRET!,
      },
    })

    const jsonMatch = stdout.match(/\{[\s\S]*"match_id"[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Output do Modal não contém JSON válido')
    }

    const cvOutput: CVOutput = JSON.parse(jsonMatch[0])
    console.log(
      `[modal] ✅ Pipeline concluído: ${cvOutput.events.length} eventos, ` +
      `confiança ${(cvOutput.confianca_media * 100).toFixed(1)}%`
    )

    return cvOutput

  } catch (err: unknown) {
    const error = err as { message: string; killed?: boolean }
    if (error.killed) {
      throw new Error('Pipeline CV excedeu tempo limite de 50 minutos')
    }
    throw new Error(`Falha no pipeline CV: ${error.message}`)
  }
}

/**
 * Versão HTTP do Modal — para quando o endpoint Modal está em `modal serve`.
 */
export async function runCVPipelineHTTP(
  videoChave: string,
  matchId: string,
  callbackUrl: string
): Promise<{ jobId: string }> {
  const modalEndpoint = process.env.MODAL_ENDPOINT_URL
  if (!modalEndpoint) throw new Error('MODAL_ENDPOINT_URL não configurada')

  const resp = await fetch(`${modalEndpoint}/analisar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MODAL_API_KEY}`,
    },
    body: JSON.stringify({ video_url: videoChave, match_id: matchId, callback_url: callbackUrl }),
  })

  if (!resp.ok) {
    throw new Error(`Modal HTTP error: ${resp.status} ${await resp.text()}`)
  }

  return resp.json()
}
