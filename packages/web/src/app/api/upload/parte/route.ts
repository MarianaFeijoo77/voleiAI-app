import { NextResponse } from 'next/server'

export async function PUT(req: Request) {
  // Mock: accept the chunk and return a fake ETag
  const etag = `etag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  return NextResponse.json({ etag })
}
