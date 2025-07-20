import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search
  const baseUrl = process.env.API_URL?.trim() || 'http://127.0.0.1:8787'
  const apiUrl = `${baseUrl}/api/tags${search}`
  const res = await fetch(apiUrl)
  const data = await res.json()
  return NextResponse.json(data)
} 