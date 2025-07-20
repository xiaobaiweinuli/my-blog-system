import { NextRequest, NextResponse } from 'next/server'

// 模拟插件数据
const mockPlugins = [
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Advanced SEO optimization tools with automatic meta tag generation, sitemap management, and search engine integration.',
    version: '2.1.0',
    author: 'SEO Tools Inc.',
    category: 'seo',
    status: 'inactive',
    installed: false,
    enabled: false,
    rating: 4.8,
    downloads: 15420,
    lastUpdated: '2024-01-15T10:30:00Z',
    homepage: 'https://example.com/seo-optimizer',
    repository: 'https://github.com/example/seo-optimizer',
    documentation: 'https://docs.example.com/seo-optimizer',
    screenshots: [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2'
    ],
    dependencies: ['react', 'next'],
    permissions: ['read', 'write', 'api'],
    config: {
      autoGenerate: true,
      includeImages: false,
      updateFrequency: 'daily'
    }
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive analytics dashboard with real-time visitor tracking, conversion metrics, and detailed reporting.',
    version: '1.5.2',
    author: 'Analytics Pro',
    category: 'analytics',
    status: 'inactive',
    installed: false,
    enabled: false,
    rating: 4.6,
    downloads: 8930,
    lastUpdated: '2024-01-10T14:20:00Z',
    homepage: 'https://example.com/analytics-dashboard',
    repository: 'https://github.com/example/analytics-dashboard',
    documentation: 'https://docs.example.com/analytics-dashboard',
    dependencies: ['chart.js', 'date-fns'],
    permissions: ['read', 'api'],
    config: {
      trackingEnabled: true,
      realTimeUpdates: true,
      dataRetention: 365
    }
  },
  {
    id: 'social-share-pro',
    name: 'Social Share Pro',
    description: 'Enhanced social media sharing with custom buttons, auto-posting, and engagement tracking across all major platforms.',
    version: '3.0.1',
    author: 'Social Media Tools',
    category: 'social',
    status: 'inactive',
    installed: false,
    enabled: false,
    rating: 4.9,
    downloads: 22150,
    lastUpdated: '2024-01-12T09:15:00Z',
    homepage: 'https://example.com/social-share-pro',
    repository: 'https://github.com/example/social-share-pro',
    documentation: 'https://docs.example.com/social-share-pro',
    dependencies: ['react-share'],
    permissions: ['read', 'write', 'api'],
    config: {
      platforms: ['twitter', 'facebook', 'linkedin'],
      autoPost: false,
      trackClicks: true
    }
  },
  {
    id: 'content-editor-plus',
    name: 'Content Editor Plus',
    description: 'Advanced content editor with markdown support, live preview, collaborative editing, and version control.',
    version: '4.2.0',
    author: 'Editor Solutions',
    category: 'content',
    status: 'inactive',
    installed: false,
    enabled: false,
    rating: 4.7,
    downloads: 18760,
    lastUpdated: '2024-01-08T16:45:00Z',
    homepage: 'https://example.com/content-editor-plus',
    repository: 'https://github.com/example/content-editor-plus',
    documentation: 'https://docs.example.com/content-editor-plus',
    dependencies: ['monaco-editor', 'markdown-it'],
    permissions: ['read', 'write'],
    config: {
      enableMarkdown: true,
      livePreview: true,
      autoSave: true,
      collaborativeMode: false
    }
  },
  {
    id: 'ui-theme-builder',
    name: 'UI Theme Builder',
    description: 'Visual theme builder with drag-and-drop interface, custom CSS generation, and responsive design tools.',
    version: '2.8.0',
    author: 'Theme Creators',
    category: 'ui',
    status: 'inactive',
    installed: false,
    enabled: false,
    rating: 4.5,
    downloads: 12340,
    lastUpdated: '2024-01-14T11:30:00Z',
    homepage: 'https://example.com/ui-theme-builder',
    repository: 'https://github.com/example/ui-theme-builder',
    documentation: 'https://docs.example.com/ui-theme-builder',
    dependencies: ['styled-components', 'color'],
    permissions: ['read', 'write'],
    config: {
      enableDragDrop: true,
      generateCSS: true,
      responsiveMode: true
    }
  },
  {
    id: 'backup-manager',
    name: 'Backup Manager',
    description: 'Automated backup solution with cloud storage integration, scheduled backups, and one-click restore functionality.',
    version: '1.9.0',
    author: 'Backup Solutions',
    category: 'utility',
    status: 'inactive',
    installed: false,
    enabled: false,
    rating: 4.4,
    downloads: 9870,
    lastUpdated: '2024-01-11T13:20:00Z',
    homepage: 'https://example.com/backup-manager',
    repository: 'https://github.com/example/backup-manager',
    documentation: 'https://docs.example.com/backup-manager',
    dependencies: ['aws-sdk'],
    permissions: ['read', 'write', 'admin'],
    config: {
      autoBackup: true,
      backupFrequency: 'daily',
      cloudProvider: 'aws',
      retentionDays: 30
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    let filteredPlugins = [...mockPlugins]
    
    // 按分类过滤
    if (category && category !== 'all') {
      filteredPlugins = filteredPlugins.filter(plugin => plugin.category === category)
    }
    
    // 按搜索关键词过滤
    if (search) {
      const searchLower = search.toLowerCase()
      filteredPlugins = filteredPlugins.filter(plugin =>
        plugin.name.toLowerCase().includes(searchLower) ||
        plugin.description.toLowerCase().includes(searchLower) ||
        plugin.author.toLowerCase().includes(searchLower)
      )
    }
    
    // 按状态过滤
    if (status && status !== 'all') {
      if (status === 'installed') {
        filteredPlugins = filteredPlugins.filter(plugin => plugin.installed)
      } else if (status === 'not-installed') {
        filteredPlugins = filteredPlugins.filter(plugin => !plugin.installed)
      }
    }
    
    // 按下载量排序
    filteredPlugins.sort((a, b) => b.downloads - a.downloads)
    
    return NextResponse.json({
      success: true,
      data: {
        plugins: filteredPlugins,
        total: filteredPlugins.length,
        categories: ['content', 'ui', 'analytics', 'social', 'seo', 'utility']
      }
    })
  } catch (error) {
    console.error('Plugin marketplace error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load plugins' },
      { status: 500 }
    )
  }
}
