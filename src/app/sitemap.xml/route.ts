import { NextResponse } from 'next/server';
import { getPublicPosts } from '@/lib/posts';
import { siteUrl } from '@/lib/constants';

export async function GET() {
  const { posts } = await getPublicPosts({ page: 1, limit: 1000 });
  const urls = [
    '',
    'blog',
  ];
  const postUrls = posts.map(post => `blog/${post.slug}`);
  const allUrls = [...urls, ...postUrls];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
    .map(
      (path) => `  <url><loc>${siteUrl}/${path}</loc></url>`
    )
    .join('\n')}
</urlset>`;
  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 