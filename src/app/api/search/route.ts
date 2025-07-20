import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const page = searchParams.get('page') || ''
    const limit = searchParams.get('limit') || ''
    // 构造后端 API 地址
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
    const apiUrl = `${baseUrl}/api/search?q=${encodeURIComponent(q)}${page ? `&page=${page}` : ''}${limit ? `&limit=${limit}` : ''}`
    const res = await fetch(apiUrl, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ success: false, message: '搜索失败', error: error instanceof Error ? error.message : '未知错误' }, { status: 500 })
  }
}