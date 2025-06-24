import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/constants';

export async function GET() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml`;
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 