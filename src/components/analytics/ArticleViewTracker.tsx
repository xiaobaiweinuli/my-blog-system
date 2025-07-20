"use client";
import { useEffect } from "react";

function getOrCreateVisitorId() {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    if (window.crypto?.randomUUID) {
      visitorId = window.crypto.randomUUID();
    } else {
      visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

export default function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (!articleId) return;
    const visitorId = getOrCreateVisitorId();
    const API_URL = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/article-view`
      : "/api/analytics/article-view";
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, visitorId })
    });
  }, [articleId]);
  return null;
} 