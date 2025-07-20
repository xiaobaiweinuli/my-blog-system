import { NextRequest, NextResponse } from 'next/server'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@/lib/cloudflare'

// 模拟Webhook数据
const mockWebhooks = [
  {
    id: 'webhook-1',
    name: 'Article Notifications',
    url: 'https://api.example.com/webhooks/articles',
    events: ['article.created', 'article.updated', 'article.published'],
    active: true,
    secret: 'webhook_secret_123',
    headers: {
      'Authorization': 'Bearer token123',
      'Content-Type': 'application/json'
    },
    retryCount: 3,
    timeout: 30,
    createdAt: '2024-01-01T00:00:00Z',
    lastTriggered: '2024-01-15T10:30:00Z',
    successCount: 45,
    failureCount: 2
  },
  {
    id: 'webhook-2',
    name: 'User Activity Tracker',
    url: 'https://analytics.example.com/webhooks/users',
    events: ['user.registered', 'user.updated'],
    active: true,
    retryCount: 5,
    timeout: 60,
    createdAt: '2024-01-05T00:00:00Z',
    lastTriggered: '2024-01-14T15:20:00Z',
    successCount: 23,
    failureCount: 0
  },
  {
    id: 'webhook-3',
    name: 'Comment Moderation',
    url: 'https://moderation.example.com/webhooks/comments',
    events: ['comment.created'],
    active: false,
    retryCount: 2,
    timeout: 15,
    createdAt: '2024-01-10T00:00:00Z',
    successCount: 12,
    failureCount: 5
  }
]

export async function GET(request: NextRequest) {
  try {
    // 在实际应用中，这里应该从数据库中获取Webhook
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    // const webhooks = await db.prepare(`
    //   SELECT * FROM webhooks 
    //   ORDER BY created_at DESC
    // `).all()
    
    return NextResponse.json({
      success: true,
      data: {
        webhooks: mockWebhooks
      }
    })
  } catch (error) {
    console.error('Get webhooks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, url, events, active, secret, headers, retryCount, timeout } = await request.json()
    
    // 验证必填字段
    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // 验证URL格式
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    // 在实际应用中，这里应该保存到数据库
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    const webhookId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // await db.prepare(`
    //   INSERT INTO webhooks (
    //     id, name, url, events, active, secret, headers, 
    //     retry_count, timeout, created_at, success_count, failure_count
    //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `).bind(
    //   webhookId,
    //   name,
    //   url,
    //   JSON.stringify(events),
    //   active,
    //   secret,
    //   JSON.stringify(headers || {}),
    //   retryCount || 3,
    //   timeout || 30,
    //   now,
    //   0,
    //   0
    // ).run()
    
    const newWebhook = {
      id: webhookId,
      name,
      url,
      events,
      active: active !== false,
      secret,
      headers: headers || {},
      retryCount: retryCount || 3,
      timeout: timeout || 30,
      createdAt: now,
      successCount: 0,
      failureCount: 0
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook created successfully',
      data: {
        webhook: newWebhook
      }
    })
  } catch (error) {
    console.error('Create webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
