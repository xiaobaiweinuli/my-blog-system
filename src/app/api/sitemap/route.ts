import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search
  const baseUrl = process.env.API_URL?.trim() || 'http://127.0.0.1:8787'
  const apiUrl = `${baseUrl}/api/sitemap${search}`
  const res = await fetch(apiUrl)
  const xml = await res.text()
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
