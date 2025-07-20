import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
    const apiUrl = `${baseUrl}/api/search/advanced`
    const body = await request.text()
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ success: false, message: '高级搜索失败', error: error instanceof Error ? error.message : '未知错误' }, { status: 500 })
  }
} 