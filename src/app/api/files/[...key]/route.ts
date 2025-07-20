import { NextRequest } from 'next/server'

const API_BASE = process.env.API_URL || 'http://127.0.0.1:8787'

export async function GET(req: NextRequest, context: any) {
  const params = await context.params;
  const keyArr = params?.key || [];
  let url = ''
  if (!keyArr || keyArr.length === 0) {
    // 代理 /api/files（文件列表）
    url = `${API_BASE}/api/files${req.nextUrl.search || ''}`
  } else {
    // 代理 /api/files/xxx
    url = `${API_BASE}/api/files/${keyArr.join('/')}${req.nextUrl.search || ''}`
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': req.headers.get('authorization') || '',
    },
  })
  const headers = new Headers(res.headers)
  headers.delete('content-encoding')
  return new Response(res.body, {
    status: res.status,
    headers,
  })
}

export async function DELETE(req: NextRequest, context: any) {
  const params = await context.params;
  const keyArr = params?.key || [];
  if (!keyArr || keyArr.length === 0) {
    return new Response(JSON.stringify({ success: false, error: 'Only id access is allowed' }), { status: 400 })
  }
  const url = `${API_BASE}/api/files/${keyArr.join('/')}${req.nextUrl.search || ''}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': req.headers.get('authorization') || '',
      'Content-Type': req.headers.get('content-type') || '',
    },
    body: req.body ? req.body : undefined,
  })
  const headers = new Headers(res.headers)
  headers.delete('content-encoding')
  return new Response(res.body, {
    status: res.status,
    headers,
  })
} 