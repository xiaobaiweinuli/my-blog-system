import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data/settings.json');

export async function GET() {
  try {
    const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    // 文件不存在时返回默认设置
    return NextResponse.json({
      siteTitle: '我的博客',
      siteDescription: '这是一个使用Next.js构建的博客系统',
      footerText: '© 2023 我的博客. 保留所有权利.',
      socialLinks: { twitter: '', github: '', linkedin: '' },
      avatarUrl: '',
      keywords: '',
      ogImage: '',
      favicon: '',
      robots: '',
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(body, null, 2), 'utf-8');
  return NextResponse.json({ success: true });
} 