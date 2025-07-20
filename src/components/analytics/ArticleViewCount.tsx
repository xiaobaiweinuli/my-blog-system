"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/article-stats`
  : "/api/analytics/article-stats";

async function getToken() {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user?.token || null;
}

export default function ArticleViewCount({ articleId }: { articleId: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    if (!articleId) return;
    (async () => {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(API_URL, { headers });
      const data = await res.json();
      const arr = data?.data?.top_articles ?? [];
      const found = arr.find((item: any) => item.id === articleId);
      setViews(found ? found.views : 0);
    })();
  }, [articleId]);

  return <span>{views !== null ? views : "--"}</span>;
} 