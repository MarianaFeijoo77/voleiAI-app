import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  // Mock multipart upload initiation
  const uploadId = `upload_${Date.now()}`
  const chave = `videos/${body.matchId}/${body.nomeArquivo}`
  return NextResponse.json({ uploadId, chave })
}
