// src/app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPostWithAccessCheck, getPublicPostSlugs, type Post } from '@/lib/posts';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import PostPageClient from './PostPageClient';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { NextSeo, ArticleJsonLd } from 'next-seo';
import { siteUrl } from '@/lib/constants';

// Loading component for the client component
function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

// Revalidate the page every hour (3600 seconds)
export const revalidate = 3600;

// Generate static params for all public posts at build time
export async function generateStaticParams() {
  const posts = await getPublicPostSlugs();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Opt out of static generation for dynamic segments not returned by generateStaticParams
export const dynamicParams = true;

interface PostPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  let post = null;
  
  try {
    // Try to get the post without a session first (for public posts)
    post = await getPostWithAccessCheck(slug, null);
  } catch (error) {
    // If not found, try with a session (for private posts)
    try {
      const session = await getServerSession(authOptions);
      if (session) {
        post = await getPostWithAccessCheck(slug, session);
      }
    } catch (e) {
      // Ignore errors here, we'll handle 404 in the page component
    }
  }

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }

  return {
    title: `${post.title} | My Blog`,
    description: post.description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt || '',
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  let session = null;
  let post = null;
  let mdxSource: MDXRemoteSerializeResult | undefined;
  
  try {
    // First try to get the post without a session (for public posts)
    post = await getPostWithAccessCheck(slug, null);
  } catch (error) {
    // If not found, try with a session (for private posts)
    session = await getServerSession(authOptions);
    if (session) {
      post = await getPostWithAccessCheck(slug, session);
    } else {
      notFound();
    }
  }

  if (!post) {
    notFound();
  }

  if (post.ext === '.mdx') {
    mdxSource = await serialize(post.content || '', {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          [rehypePrism, { ignoreMissing: true }],
        ],
        format: 'mdx',
      },
      parseFrontmatter: true,
    });
  }

  const url = `${siteUrl}/blog/${post.slug}`;
  const publishedTime = post.date;
  const modifiedTime = post.updatedAt || post.date;
  const authors = post.author ? [post.author] : [];
  const tags = post.tags || [];

  // 传递 SEO 相关数据给 PostPageClient
  const seoProps = {
    title: `${post.title} | Manus Blog System`,
    description: post.description || post.excerpt || '',
    canonical: url,
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt || '',
      url,
      type: 'article',
      images: post.coverImageUrl ? [
        {
          url: post.coverImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : [],
      article: {
        publishedTime,
        modifiedTime,
        authors,
        tags,
      },
    },
    twitter: {
      cardType: 'summary_large_image',
    },
    articleJsonLd: {
      type: 'Article',
      url,
      title: post.title,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
      datePublished: publishedTime,
      dateModified: modifiedTime,
      authorName: authors,
      description: post.description || post.excerpt || '',
      publisherName: 'Manus Blog System',
      publisherLogo: '/favicon.ico',
      keywords: tags.join(','),
    },
  };

  return (
    <Suspense fallback={<Loading />}>
      <PostPageClient post={post} isAuthor={!!session} mdxSource={mdxSource} seoProps={seoProps} />
    </Suspense>
  );
}
