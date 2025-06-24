// src/components/GiscusComments.tsx
'use client';

import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';

const GiscusComments = () => {
  const { theme } = useTheme();

  const giscusRepo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const giscusRepoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const giscusCategory = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const giscusCategoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  if (!giscusRepo || !giscusRepoId || !giscusCategory || !giscusCategoryId) {
    console.error('Giscus environment variables are not configured. Please check your .env.local file.');
    return <div className="text-center text-red-500">Giscus评论系统未正确配置。</div>;
  }

  return (
    <div className="mt-12">
        <Giscus
          repo={giscusRepo as `${string}/${string}`}
          repoId={giscusRepoId}
          category={giscusCategory}
          categoryId={giscusCategoryId}
          mapping={process.env.NEXT_PUBLIC_GISCUS_MAPPING as 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number' || 'pathname'}
          strict={process.env.NEXT_PUBLIC_GISCUS_STRICT === '1' ? '1' : '0'}
          reactionsEnabled={process.env.NEXT_PUBLIC_GISCUS_REACTIONS_ENABLED === '1' ? '1' : '0'}
          emitMetadata={process.env.NEXT_PUBLIC_GISCUS_EMIT_METADATA === '1' ? '1' : '0'}
          inputPosition={process.env.NEXT_PUBLIC_GISCUS_INPUT_POSITION === 'top' ? 'top' : 'bottom'}
          theme={theme === 'dark' ? 'dark' : 'light'}
          lang={process.env.NEXT_PUBLIC_GISCUS_LANG || 'zh-CN'}
          loading={process.env.NEXT_PUBLIC_GISCUS_LOADING === 'lazy' ? 'lazy' : 'eager'}
        />
    </div>
  );
};

export default GiscusComments;
