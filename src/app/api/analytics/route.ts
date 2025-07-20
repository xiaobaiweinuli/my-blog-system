import { NextRequest, NextResponse } from 'next/server'

// 模拟分析数据
const generateMockAnalyticsData = (from: string, to: string) => {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 生成流量数据
  const traffic = Array.from({ length: daysDiff }).map((_, i) => {
    const date = new Date(fromDate)
    date.setDate(fromDate.getDate() + i)
    
    // 随机生成数据，但保持一定的趋势
    const baseViews = 1000 + Math.floor(Math.random() * 500)
    const baseVisitors = 700 + Math.floor(Math.random() * 300)
    const baseSessions = 800 + Math.floor(Math.random() * 400)
    
    // 添加周末效应（周末流量略低）
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.8 : 1
    
    // 添加增长趋势
    const growthFactor = 1 + (i / daysDiff) * 0.2
    
    return {
      date: date.toISOString(),
      views: Math.floor(baseViews * weekendFactor * growthFactor),
      visitors: Math.floor(baseVisitors * weekendFactor * growthFactor),
      sessions: Math.floor(baseSessions * weekendFactor * growthFactor)
    }
  })
  
  // 计算总计和变化率
  const totalViews = traffic.reduce((sum, day) => sum + day.views, 0)
  const totalVisitors = traffic.reduce((sum, day) => sum + day.visitors, 0)
  const uniqueVisitors = Math.floor(totalVisitors * 0.85) // 独立访客通常比总访客少
  const avgSessionDuration = 180 + Math.floor(Math.random() * 120)
  const bounceRate = 25 + Math.floor(Math.random() * 15)
  
  // 计算与上一时期的变化
  const viewsChange = Math.floor((Math.random() * 20) - 5)
  const visitorsChange = Math.floor((Math.random() * 25) - 5)
  const durationChange = Math.floor((Math.random() * 15) - 5)
  const bounceRateChange = Math.floor((Math.random() * 10) - 5)
  
  // 流量来源
  const sources = [
    { source: 'Google', visitors: Math.floor(totalVisitors * 0.45), percentage: 45, color: '#4285F4' },
    { source: 'Direct', visitors: Math.floor(totalVisitors * 0.25), percentage: 25, color: '#34A853' },
    { source: 'Social', visitors: Math.floor(totalVisitors * 0.15), percentage: 15, color: '#FBBC05' },
    { source: 'Referral', visitors: Math.floor(totalVisitors * 0.1), percentage: 10, color: '#EA4335' },
    { source: 'Other', visitors: Math.floor(totalVisitors * 0.05), percentage: 5, color: '#673AB7' }
  ]
  
  // 设备类型
  const devices = [
    { device: 'Mobile', visitors: Math.floor(totalVisitors * 0.55), percentage: 55 },
    { device: 'Desktop', visitors: Math.floor(totalVisitors * 0.4), percentage: 40 },
    { device: 'Tablet', visitors: Math.floor(totalVisitors * 0.05), percentage: 5 }
  ]
  
  // 热门页面
  const topPages = [
    {
      path: '/articles/nextjs-guide',
      title: 'Next.js 完整指南',
      views: Math.floor(totalViews * 0.12),
      uniqueViews: Math.floor(totalViews * 0.1),
      avgTime: 240,
      bounceRate: 28.5
    },
    {
      path: '/articles/react-hooks',
      title: 'React Hooks 深度解析',
      views: Math.floor(totalViews * 0.09),
      uniqueViews: Math.floor(totalViews * 0.08),
      avgTime: 210,
      bounceRate: 32.1
    },
    {
      path: '/articles/typescript-tips',
      title: 'TypeScript 实用技巧',
      views: Math.floor(totalViews * 0.08),
      uniqueViews: Math.floor(totalViews * 0.07),
      avgTime: 195,
      bounceRate: 35.8
    },
    {
      path: '/articles/cloudflare-workers',
      title: 'Cloudflare Workers 入门指南',
      views: Math.floor(totalViews * 0.07),
      uniqueViews: Math.floor(totalViews * 0.06),
      avgTime: 220,
      bounceRate: 30.2
    },
    {
      path: '/articles/tailwind-css',
      title: 'Tailwind CSS 实战教程',
      views: Math.floor(totalViews * 0.06),
      uniqueViews: Math.floor(totalViews * 0.05),
      avgTime: 180,
      bounceRate: 38.5
    }
  ]
  
  // 地理分布
  const geography = [
    { country: '中国', visitors: Math.floor(totalVisitors * 0.4), percentage: 40 },
    { country: '美国', visitors: Math.floor(totalVisitors * 0.2), percentage: 20 },
    { country: '日本', visitors: Math.floor(totalVisitors * 0.1), percentage: 10 },
    { country: '英国', visitors: Math.floor(totalVisitors * 0.08), percentage: 8 },
    { country: '德国', visitors: Math.floor(totalVisitors * 0.07), percentage: 7 },
    { country: '加拿大', visitors: Math.floor(totalVisitors * 0.05), percentage: 5 },
    { country: '其他', visitors: Math.floor(totalVisitors * 0.1), percentage: 10 }
  ]
  
  // 实时数据
  const activeUsers = 10 + Math.floor(Math.random() * 50)
  const recentEvents = [
    {
      timestamp: new Date().toISOString(),
      event: 'Page View',
      page: '/articles/nextjs-guide',
      user: 'anonymous'
    },
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      event: 'Click',
      page: '/articles/react-hooks',
      user: 'user123'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      event: 'Search',
      page: '/search?q=typescript',
      user: 'user456'
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      event: 'Login',
      page: '/auth/login',
      user: 'user789'
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      event: 'Comment',
      page: '/articles/cloudflare-workers',
      user: 'user234'
    }
  ]
  
  return {
    overview: {
      totalViews,
      uniqueVisitors,
      avgSessionDuration,
      bounceRate,
      viewsChange,
      visitorsChange,
      durationChange,
      bounceRateChange
    },
    traffic,
    sources,
    devices,
    topPages,
    geography,
    realtime: {
      activeUsers,
      topPages: topPages.slice(0, 3).map(p => p.path),
      recentEvents
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()
    
    // 在实际应用中，这里应该从数据库中查询分析数据
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    // 目前使用模拟数据
    const analyticsData = generateMockAnalyticsData(from, to)
    
    return NextResponse.json({
      success: true,
      data: analyticsData
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 这里可以实现接收和存储分析事件的逻辑
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = await request.json()
    
    // 在实际应用中，这里应该将事件数据存储到数据库中
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    // await db.prepare('INSERT INTO analytics_events (...)').bind(...).run()
    
    return NextResponse.json({
      success: true,
      message: 'Event recorded successfully'
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record analytics event' },
      { status: 500 }
    )
  }
}

// 导出分析数据
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()
    const format = searchParams.get('format') || 'json'
    
    // 获取分析数据
    const analyticsData = generateMockAnalyticsData(from, to)
    
    // 根据请求的格式返回数据
    if (format === 'csv') {
      // 将数据转换为CSV格式
      const csvData = 'Date,Views,Visitors,Sessions\n' + 
        analyticsData.traffic.map(day => 
          `${day.date.split('T')[0]},${day.views},${day.visitors},${day.sessions}`
        ).join('\n')
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${from.split('T')[0]}-${to.split('T')[0]}.csv"`
        }
      })
    } else {
      // 返回JSON格式
      return NextResponse.json(analyticsData, {
        headers: {
          'Content-Disposition': `attachment; filename="analytics-${from.split('T')[0]}-${to.split('T')[0]}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}