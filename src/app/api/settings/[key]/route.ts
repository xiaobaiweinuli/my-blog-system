import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
const WORKER_API = `${API_BASE}/api/settings`

export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  const token = req.headers.get('authorization') || ''
  const res = await fetch(`${WORKER_API}/${params.key}`, {
    headers: { Authorization: token }
  })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  const token = req.headers.get('authorization') || ''
  const body = await req.text()
  const res = await fetch(`${WORKER_API}/${params.key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body
  })
  const data = await res.json()
  return NextResponse.json(data)
} 