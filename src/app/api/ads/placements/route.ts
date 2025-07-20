import { NextRequest, NextResponse } from 'next/server'

// 模拟广告位数据
const mockPlacements = [
  {
    id: 'placement-1',
    name: 'Header Banner',
    type: 'banner',
    position: 'header',
    size: {
      width: 728,
      height: 90,
      responsive: true
    },
    targeting: {
      pages: ['home', 'articles'],
      devices: ['desktop', 'mobile'],
      userTypes: ['all']
    },
    active: true,
    impressions: 45000,
    clicks: 900,
    revenue: 225.50,
    fillRate: 85.2,
    createdAt: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-15T10:30:00Z'
  },
  {
    id: 'placement-2',
    name: 'Sidebar Rectangle',
    type: 'sidebar',
    position: 'sidebar-right',
    size: {
      width: 300,
      height: 250,
      responsive: false
    },
    targeting: {
      pages: ['articles', 'archive'],
      devices: ['desktop'],
      userTypes: ['registered']
    },
    active: true,
    impressions: 28000,
    clicks: 560,
    revenue: 140.75,
    fillRate: 92.1,
    createdAt: '2024-01-05T00:00:00Z',
    lastUpdated: '2024-01-20T14:20:00Z'
  },
  {
    id: 'placement-3',
    name: 'Mobile Sticky',
    type: 'sticky',
    position: 'content-bottom',
    size: {
      width: 320,
      height: 50,
      responsive: true
    },
    targeting: {
      pages: ['all'],
      devices: ['mobile'],
      userTypes: ['all']
    },
    active: false,
    impressions: 15000,
    clicks: 225,
    revenue: 67.50,
    fillRate: 78.5,
    createdAt: '2024-01-10T00:00:00Z',
    lastUpdated: '2024-01-18T09:15:00Z'
  }
]

export async function GET(_request: NextRequest) {
  try {
    // 在实际应用中，这里应该从数据库中获取广告位
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    // const placements = await db.prepare(`
    //   SELECT * FROM ad_placements 
    //   WHERE deleted_at IS NULL
    //   ORDER BY created_at DESC
    // `).all()
    
    return NextResponse.json({
      success: true,
      data: {
        placements: mockPlacements
      }
    })
  } catch (error) {
    console.error('Get placements error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load placements' },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest) {
  try {
    const { 
      name, 
      type, 
      position, 
      size, 
      targeting, 
      active 
    } = await request.json()
    
    // 验证必填字段
    if (!name || !type || !position || !size) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // 验证尺寸
    if (!size.width || !size.height || size.width <= 0 || size.height <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid size dimensions' },
        { status: 400 }
      )
    }
    
    // 在实际应用中，这里应该保存到数据库
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    const placementId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // await db.prepare(`
    //   INSERT INTO ad_placements (
    //     id, name, type, position, size, targeting, active, impressions, clicks,
    //     revenue, fill_rate, created_at, updated_at
    //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `).bind(
    //   placementId,
    //   name,
    //   type,
    //   position,
    //   JSON.stringify(size),
    //   JSON.stringify(targeting),
    //   active !== false,
    //   0, // impressions
    //   0, // clicks
    //   0, // revenue
    //   0, // fill_rate
    //   now,
    //   now
    // ).run()
    
    const newPlacement = {
      id: placementId,
      name,
      type,
      position,
      size,
      targeting: targeting || {
        pages: [],
        devices: [],
        userTypes: []
      },
      active: active !== false,
      impressions: 0,
      clicks: 0,
      revenue: 0,
      fillRate: 0,
      createdAt: now,
      lastUpdated: now
    }
    
    return NextResponse.json({
      success: true,
      message: 'Placement created successfully',
      data: {
        placement: newPlacement
      }
    })
  } catch (error) {
    console.error('Create placement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create placement' },
      { status: 500 }
    )
  }
}