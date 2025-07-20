import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
const WORKER_API = `${API_BASE}/api/settings`

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url)
  const key = pathname.split('/').filter(Boolean).pop()
  const token = req.headers.get('authorization') || ''
  let url = WORKER_API
  if (key && key !== 'settings') {
    url = `${WORKER_API}/${key}`
  }
  const res = await fetch(url, {
    headers: { Authorization: token }
  })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: any) {
  const key = params?.key
  if (!key) return NextResponse.json({ success: false, error: '缺少 key' }, { status: 400 })
  const token = req.headers.get('authorization') || ''
  const body = await req.text()
  const res = await fetch(`${WORKER_API}/${key}`, {
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

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization') || ''
  const body = await req.text()
  let data
  try {
    data = JSON.parse(body)
  } catch {
    return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 })
  }
  // 新增单个
  if (data.key) {
    const res = await fetch(WORKER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify(data)
    })
    const result = await res.json()
    return NextResponse.json(result)
  }
  // 批量
  if (Array.isArray(data)) {
    const res = await fetch(WORKER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify(data)
    })
    const result = await res.json()
    return NextResponse.json(result)
  }
  return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 })
} 