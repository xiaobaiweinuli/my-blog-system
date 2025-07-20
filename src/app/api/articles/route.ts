import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // 获取所有查询参数
  const search = req.nextUrl.search
  // cloudflare 后端 API 地址
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787'
  const apiUrl = `${baseUrl}/api/articles${search}`
  // 代理请求
  const res = await fetch(apiUrl)
  const data = await res.json()
  return NextResponse.json(data)
} 