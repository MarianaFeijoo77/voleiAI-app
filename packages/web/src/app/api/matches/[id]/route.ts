import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const store = (globalThis as any).__matches || {}
  const match = store[params.id]
  if (!match) {
    return NextResponse.json({ erro: 'Partida não encontrada' }, { status: 404 })
  }
  return NextResponse.json({ match })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = (globalThis as any).__matches || {}
  if (!store[params.id]) {
    return NextResponse.json({ erro: 'Partida não encontrada' }, { status: 404 })
  }
  const body = await req.json()
  store[params.id] = { ...store[params.id], ...body }
  return NextResponse.json({ match: store[params.id] })
}
