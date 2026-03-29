import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

/**
 * Normaliza o vídeo para o formato esperado pelo pipeline CV.
 * Em dev (MODAL_ENABLED !== 'true'), retorna a chave sem processar.
 * Em produção, baixa do R2, roda FFmpeg, e retorna caminho local normalizado.
 */
export async function normalizeVideo(videoChave: string): Promise<string> {
  if (process.env.MODAL_ENABLED !== 'true') {
    console.log('[normalize] Dev mode — pulando normalização FFmpeg')
    return videoChave
  }

  // === Produção: baixar + normalizar ===
  const tmpDir = path.join(os.tmpdir(), 'volei-ai')
  await fs.mkdir(tmpDir, { recursive: true })

  const fileName = path.basename(videoChave)
  const rawPath = path.join(tmpDir, `raw-${fileName}`)
  const normalizedPath = path.join(tmpDir, `norm-${fileName}`)

  try {
    console.log(`[normalize] Baixando vídeo do R2: ${videoChave}`)
    const cmd = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: videoChave,
    })
    const resp = await r2.send(cmd)

    if (!resp.Body) throw new Error('R2 retornou body vazio')

    const writeStream = createWriteStream(rawPath)
    await pipeline(resp.Body as Readable, writeStream)
    console.log(`[normalize] Vídeo baixado: ${rawPath}`)

    // Normalização via FFmpeg (requer ffmpeg instalado no container)
    // ffmpeg -i input.mp4 -vf fps=30,scale=-2:720 -c:v libx264 -preset fast output.mp4
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    await execAsync(
      `ffmpeg -i "${rawPath}" -vf "fps=30,scale=-2:720" -c:v libx264 -preset fast -y "${normalizedPath}"`,
      { timeout: 30 * 60 * 1000 }
    )

    await fs.unlink(rawPath).catch(() => {})
    console.log(`[normalize] Vídeo normalizado: ${normalizedPath}`)
    return normalizedPath

  } catch (err) {
    await fs.unlink(rawPath).catch(() => {})
    await fs.unlink(normalizedPath).catch(() => {})
    throw err
  }
}
