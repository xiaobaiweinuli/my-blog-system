import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search
  const baseUrl = process.env.API_URL?.trim() || 'http://127.0.0.1:8787'
  const apiUrl = `${baseUrl}/api/sitemap/config${search}`
  const res = await fetch(apiUrl)
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    // 代理到 cloudflare 后端
    const baseUrl = process.env.API_URL?.trim() || 'http://127.0.0.1:8787'
    const apiUrl = `${baseUrl}/api/sitemap/config`
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update sitemap configuration' },
      { status: 500 }
    )
  }
}
