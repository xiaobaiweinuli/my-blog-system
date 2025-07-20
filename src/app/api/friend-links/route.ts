import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
const WORKER_API = `${API_BASE}/api/friend-links`

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization') || ''
  const res = await fetch(WORKER_API, {
    headers: { Authorization: token }
  })
  const data = await res.json()
  return NextResponse.json(data)
} 