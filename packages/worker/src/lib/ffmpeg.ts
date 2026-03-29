import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export interface FFmpegOptions {
  width?: number
  height?: number
  fps?: number
  videoBitrate?: string
  audioBitrate?: string
}

/**
 * Normaliza um vídeo para as especificações do pipeline CV:
 * - Resolução mínima: 1280x720 (720p)
 * - FPS: 30 (interpolado se necessário)
 * - Codec: H.264 (compatível com OpenCV)
 */
export async function normalizeVideoFile(
  inputPath: string,
  outputPath: string,
  opts: FFmpegOptions = {}
): Promise<void> {
  const {
    width = 1280,
    height = 720,
    fps = 30,
    videoBitrate = '3M',
  } = opts

  if (!existsSync(inputPath)) {
    throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`)
  }

  // FFmpeg: redimensiona mantendo aspect ratio, força 30fps, H.264
  const cmd = [
    'ffmpeg',
    '-i', `"${inputPath}"`,
    '-vf', `"scale=${width}:${height}:force_original_aspect_ratio=decrease,fps=${fps}"`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-b:v', videoBitrate,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y', // Sobrescrever se existir
    `"${outputPath}"`,
  ].join(' ')

  console.log(`[ffmpeg] Normalizando: ${path.basename(inputPath)} → ${path.basename(outputPath)}`)

  try {
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 100 * 1024 * 1024 })
    if (stderr) console.log('[ffmpeg]', stderr.split('\n').slice(-3).join('\n'))
    console.log(`[ffmpeg] ✅ Normalização concluída: ${outputPath}`)
  } catch (err: unknown) {
    const error = err as { message: string; stderr?: string }
    throw new Error(`FFmpeg falhou: ${error.message}\n${error.stderr || ''}`)
  }
}

/**
 * Extrai metadados do vídeo (duração, resolução, FPS).
 */
export async function getVideoMetadata(inputPath: string): Promise<{
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
}> {
  const cmd = [
    'ffprobe',
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_streams',
    '-show_format',
    `"${inputPath}"`,
  ].join(' ')

  const { stdout } = await execAsync(cmd)
  const info = JSON.parse(stdout)

  const videoStream = info.streams?.find((s: any) => s.codec_type === 'video')
  const format = info.format

  if (!videoStream) {
    throw new Error('Nenhuma stream de vídeo encontrada')
  }

  const [fpsNum, fpsDen] = (videoStream.r_frame_rate || '30/1').split('/')
  const fps = Number(fpsNum) / Number(fpsDen)

  return {
    duration: Number(format.duration || 0),
    width: videoStream.width || 0,
    height: videoStream.height || 0,
    fps,
    bitrate: Number(format.bit_rate || 0),
  }
}
