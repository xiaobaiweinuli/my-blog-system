'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Footer() {
  const [site, setSite] = useState({
    footerText: '',
    avatarUrl: '',
    socialLinks: { twitter: '', github: '', linkedin: '' },
  });
  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => setSite(data));
  }, []);
  return (
    <footer className="w-full py-8 text-gray-400 text-sm text-center border-t bg-white/80 dark:bg-gray-900/80 mt-12">
      <div className="flex flex-col items-center gap-2">
        {site.avatarUrl && (
          <Image src={site.avatarUrl} alt="网站头像" width={40} height={40} className="rounded-full border" />
        )}
        <div>{site.footerText || `© ${new Date().getFullYear()} 我的博客系统 | 由 Next.js & Tailwind CSS 强力驱动`}</div>
        <div className="flex gap-4 mt-2">
          {site.socialLinks?.twitter && <a href={`https://twitter.com/${site.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">Twitter</a>}
          {site.socialLinks?.github && <a href={`https://github.com/${site.socialLinks.github}`} target="_blank" rel="noopener noreferrer">GitHub</a>}
          {site.socialLinks?.linkedin && <a href={`https://linkedin.com/in/${site.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
        </div>
      </div>
    </footer>
  );
} 