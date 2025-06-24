import { getPublicPosts } from '@/lib/posts';
import PostList from '@/app/blog/PostList';
import { notFound } from 'next/navigation';

interface TagPageProps {
  params: { tag: string };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  // 获取所有带有该标签的文章
  const { posts, total } = await getPublicPosts();
  const filteredPosts = posts.filter(post => post.tags.includes(decodedTag));

  if (filteredPosts.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">标签：{decodedTag}</h1>
        <p className="text-lg text-muted-foreground">共 {filteredPosts.length} 篇文章</p>
      </header>
      <PostList initialPosts={filteredPosts} initialTotal={filteredPosts.length} />
    </div>
  );
} 