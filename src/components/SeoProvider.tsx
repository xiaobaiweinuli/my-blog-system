'use client';
import { DefaultSeo } from 'next-seo';
import { useEffect, useState } from 'react';

export default function SeoProvider() {
  const [seo, setSeo] = useState({
    title: 'Manus Blog System',
    description: 'A powerful blog system powered by Next.js and GitHub Pages.',
    ogImage: '/og-default.jpg',
    keywords: '',
    favicon: '',
    robots: '',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSeo({
        title: data.siteTitle || 'Manus Blog System',
        description: data.siteDescription || '',
        ogImage: data.ogImage || '/og-default.jpg',
        keywords: data.keywords || '',
        favicon: data.favicon || '',
        robots: data.robots || '',
      }));
  }, []);

  useEffect(() => {
    if (seo.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = seo.favicon;
    }
  }, [seo.favicon]);

  return (
    <>
      <DefaultSeo
        title={seo.title}
        description={seo.description}
        openGraph={{
          type: 'website',
          locale: 'zh_CN',
          url: 'http://localhost:3000',
          site_name: seo.title,
          images: [
            {
              url: seo.ogImage,
              width: 1200,
              height: 630,
              alt: seo.title,
            },
          ],
        }}
        twitter={{
          cardType: 'summary_large_image',
        }}
        additionalMetaTags={[
          ...(seo.keywords ? [{ name: 'keywords', content: seo.keywords }] : []),
          ...(seo.robots ? [{ name: 'robots', content: seo.robots }] : []),
        ]}
      />
    </>
  );
} 