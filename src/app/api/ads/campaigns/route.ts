import { NextRequest, NextResponse } from 'next/server'

// 模拟广告活动数据
const mockCampaigns = [
  {
    id: 'campaign-1',
    name: 'Tech Blog Promotion',
    type: 'banner',
    status: 'active',
    advertiser: 'TechCorp Inc.',
    budget: 5000,
    spent: 3200,
    impressions: 125000,
    clicks: 2500,
    ctr: 2.0,
    cpm: 25.6,
    revenue: 640,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
    targeting: {
      countries: ['US', 'CA', 'UK'],
      devices: ['desktop', 'mobile'],
      interests: ['technology', 'programming'],
      ageRange: [25, 45]
    },
    creative: {
      title: 'Learn Modern Web Development',
      description: 'Master React, Next.js, and TypeScript with our comprehensive course',
      imageUrl: 'https://picsum.photos/728/90?random=1',
      ctaText: 'Start Learning',
      landingUrl: 'https://example.com/course'
    },
    placement: {
      positions: ['header', 'sidebar'],
      pages: ['home', 'articles'],
      frequency: 3
    }
  },
  {
    id: 'campaign-2',
    name: 'SaaS Product Launch',
    type: 'native',
    status: 'active',
    advertiser: 'StartupXYZ',
    budget: 3000,
    spent: 1800,
    impressions: 85000,
    clicks: 1700,
    ctr: 2.0,
    cpm: 21.2,
    revenue: 425,
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-02-15T23:59:59Z',
    targeting: {
      countries: ['US', 'EU'],
      devices: ['desktop'],
      interests: ['business', 'productivity'],
      ageRange: [30, 55]
    },
    creative: {
      title: 'Boost Your Productivity',
      description: 'Revolutionary project management tool for modern teams',
      ctaText: 'Try Free',
      landingUrl: 'https://example.com/saas'
    },
    placement: {
      positions: ['content-top', 'content-bottom'],
      pages: ['articles', 'archive'],
      frequency: 2
    }
  },
  {
    id: 'campaign-3',
    name: 'E-commerce Holiday Sale',
    type: 'video',
    status: 'paused',
    advertiser: 'ShopMart',
    budget: 8000,
    spent: 4500,
    impressions: 200000,
    clicks: 3000,
    ctr: 1.5,
    cpm: 22.5,
    revenue: 750,
    startDate: '2023-12-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    targeting: {
      countries: ['US', 'CA'],
      devices: ['mobile', 'tablet'],
      interests: ['shopping', 'fashion'],
      ageRange: [18, 65]
    },
    creative: {
      title: 'Holiday Sale - Up to 70% Off',
      description: 'Biggest sale of the year on fashion, electronics, and more',
      videoUrl: 'https://example.com/video.mp4',
      ctaText: 'Shop Now',
      landingUrl: 'https://example.com/sale'
    },
    placement: {
      positions: ['popup', 'sticky'],
      pages: ['home'],
      frequency: 1
    }
  }
]

export async function GET() {
  try {
    // 在实际应用中，这里应该从数据库中获取广告活动
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    // const campaigns = await db.prepare(`
    //   SELECT * FROM ad_campaigns 
    //   WHERE deleted_at IS NULL
    //   ORDER BY created_at DESC
    // `).all()
    
    return NextResponse.json({
      success: true,
      data: {
        campaigns: mockCampaigns
      }
    })
  } catch (error) {
    console.error('Get campaigns error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      type, 
      advertiser, 
      budget, 
      targeting, 
      creative, 
      placement,
      startDate,
      endDate
    } = await request.json()
    
    // 验证必填字段
    if (!name || !type || !advertiser || !budget) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // 在实际应用中，这里应该保存到数据库
    // const { env } = getRequestContext()
    // const db = env.DB as D1Database
    
    const campaignId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // await db.prepare(`
    //   INSERT INTO ad_campaigns (
    //     id, name, type, status, advertiser, budget, spent, impressions, clicks,
    //     ctr, cpm, revenue, start_date, end_date, targeting, creative, placement,
    //     created_at, updated_at
    //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `).bind(
    //   campaignId,
    //   name,
    //   type,
    //   'draft',
    //   advertiser,
    //   budget,
    //   0, // spent
    //   0, // impressions
    //   0, // clicks
    //   0, // ctr
    //   0, // cpm
    //   0, // revenue
    //   startDate,
    //   endDate,
    //   JSON.stringify(targeting),
    //   JSON.stringify(creative),
    //   JSON.stringify(placement),
    //   now,
    //   now
    // ).run()
    
    const newCampaign = {
      id: campaignId,
      name,
      type,
      status: 'draft',
      advertiser,
      budget,
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpm: 0,
      revenue: 0,
      startDate: startDate || now,
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      targeting: targeting || {
        countries: [],
        devices: [],
        interests: [],
        ageRange: [18, 65]
      },
      creative: creative || {
        title: '',
        description: '',
        ctaText: '',
        landingUrl: ''
      },
      placement: placement || {
        positions: [],
        pages: [],
        frequency: 3
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        campaign: newCampaign
      }
    })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}