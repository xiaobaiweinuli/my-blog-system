import { NextRequest, NextResponse } from 'next/server'

// 主题预设数据
const themePresets = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern default theme',
    preview: 'https://picsum.photos/400/300?random=1',
    config: {
      name: 'Default Theme',
      colors: {
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#3b82f6',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        border: '#e2e8f0'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        mono: 'Menlo'
      },
      spacing: {
        containerWidth: 1200,
        gapSmall: 8,
        gapMedium: 16,
        gapLarge: 24
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12
      },
      shadows: {
        small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      animations: {
        enabled: true,
        duration: 200
      }
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Elegant dark theme for night reading',
    preview: 'https://picsum.photos/400/300?random=2',
    config: {
      name: 'Dark Theme',
      colors: {
        primary: '#ffffff',
        secondary: '#f1f5f9',
        accent: '#60a5fa',
        background: '#0f172a',
        foreground: '#f8fafc',
        muted: '#1e293b',
        mutedForeground: '#94a3b8',
        border: '#334155'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        mono: 'Menlo'
      },
      spacing: {
        containerWidth: 1200,
        gapSmall: 8,
        gapMedium: 16,
        gapLarge: 24
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12
      },
      shadows: {
        small: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        large: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)'
      },
      animations: {
        enabled: true,
        duration: 200
      }
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and minimal design with focus on content',
    preview: 'https://picsum.photos/400/300?random=3',
    config: {
      name: 'Minimal Theme',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#0066cc',
        background: '#ffffff',
        foreground: '#000000',
        muted: '#f5f5f5',
        mutedForeground: '#666666',
        border: '#e0e0e0'
      },
      fonts: {
        heading: 'Georgia',
        body: 'Georgia',
        mono: 'Courier New'
      },
      spacing: {
        containerWidth: 800,
        gapSmall: 4,
        gapMedium: 12,
        gapLarge: 20
      },
      borderRadius: {
        small: 0,
        medium: 0,
        large: 0
      },
      shadows: {
        small: 'none',
        medium: 'none',
        large: 'none'
      },
      animations: {
        enabled: false,
        duration: 0
      }
    }
  },
  {
    id: 'colorful',
    name: 'Colorful',
    description: 'Vibrant and energetic theme with bold colors',
    preview: 'https://picsum.photos/400/300?random=4',
    config: {
      name: 'Colorful Theme',
      colors: {
        primary: '#7c3aed',
        secondary: '#ec4899',
        accent: '#f59e0b',
        background: '#fefefe',
        foreground: '#1f2937',
        muted: '#f3f4f6',
        mutedForeground: '#6b7280',
        border: '#d1d5db'
      },
      fonts: {
        heading: 'Poppins',
        body: 'Open Sans',
        mono: 'Menlo'
      },
      spacing: {
        containerWidth: 1400,
        gapSmall: 12,
        gapMedium: 20,
        gapLarge: 32
      },
      borderRadius: {
        small: 8,
        medium: 16,
        large: 24
      },
      shadows: {
        small: '0 2px 4px 0 rgba(124, 58, 237, 0.1)',
        medium: '0 8px 16px -4px rgba(124, 58, 237, 0.2), 0 4px 8px -2px rgba(124, 58, 237, 0.1)',
        large: '0 20px 32px -8px rgba(124, 58, 237, 0.3), 0 8px 16px -4px rgba(124, 58, 237, 0.2)'
      },
      animations: {
        enabled: true,
        duration: 300
      }
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        presets: themePresets
      }
    })
  } catch (error) {
    console.error('Get theme presets error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load theme presets' },
      { status: 500 }
    )
  }
}
