// 默认数据和工具函数
import { Article, User, Category, Tag, FriendLink } from "@/types"

// 默认用户数据（用于开发环境或API不可用时）
export const defaultUsers: User[] = [
  {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    role: "admin",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "2", 
    name: "李四",
    email: "lisi@example.com",
    avatar: "https://avatars.githubusercontent.com/u/2?v=4",
    role: "collaborator",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
]

// 默认标签数据
export const defaultTags: Tag[] = [
  { id: "1", name: "Next.js", slug: "nextjs", color: "#000000", articleCount: 5 },
  { id: "2", name: "React", slug: "react", color: "#61dafb", articleCount: 6 },
  { id: "3", name: "TypeScript", slug: "typescript", color: "#3178c6", articleCount: 4 },
  { id: "4", name: "Tailwind CSS", slug: "tailwindcss", color: "#06b6d4", articleCount: 3 },
  { id: "5", name: "JavaScript", slug: "javascript", color: "#f7df1e", articleCount: 7 },
  { id: "6", name: "CSS", slug: "css", color: "#1572b6", articleCount: 2 },
  { id: "7", name: "HTML", slug: "html", color: "#e34f26", articleCount: 2 },
  { id: "8", name: "Node.js", slug: "nodejs", color: "#339933", articleCount: 3 },
]

// 默认文章数据
export const defaultArticles: Article[] = [
  {
    id: "1",
    title: "Next.js 14 完整指南：从入门到精通",
    slug: "nextjs-14-complete-guide",
    content: `# Next.js 14 完整指南

Next.js 14 是一个强大的 React 框架，提供了许多开箱即用的功能...

## 主要特性

- App Router
- Server Components  
- Streaming
- 内置优化

## 安装和设置

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

这是一个非常详细的教程，涵盖了 Next.js 14 的所有重要概念。`,
    excerpt: "深入了解 Next.js 14 的新特性和最佳实践，从基础概念到高级应用。",
    summary: "本文全面介绍了 Next.js 14 框架的核心特性，包括 App Router、Server Components 等新功能，适合想要学习现代 React 开发的开发者。",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
    tags: ["Next.js", "React", "TypeScript"],
    category: "技术",
    status: "published",
    authorId: "1",
    author: defaultUsers[0],
    publishedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
    viewCount: 1234,
    likeCount: 89,
  },
  {
    id: "2",
    title: "现代化 CSS 布局技巧",
    slug: "modern-css-layout-techniques",
    content: `# 现代化 CSS 布局技巧

CSS 布局已经发生了巨大的变化...

## Grid 布局

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
\`\`\`

## Flexbox 布局

\`\`\`css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\``,
    excerpt: "探索现代 CSS 布局技术，包括 Grid、Flexbox 和容器查询。",
    summary: "介绍了现代 CSS 布局的最佳实践，重点讲解 Grid 和 Flexbox 的使用场景和技巧。",
    coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
    tags: ["CSS", "HTML"],
    category: "技术",
    status: "published",
    authorId: "1",
    author: defaultUsers[0],
    publishedAt: new Date("2024-01-12"),
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-12"),
    viewCount: 856,
    likeCount: 67,
  },
]

// 默认友情链接数据
export const defaultFriendLinks: FriendLink[] = [
  {
    id: "1",
    name: "Next.js",
    url: "https://nextjs.org",
    description: "React 框架，用于构建现代化 Web 应用",
    avatar: "https://nextjs.org/favicon.ico",
    category: "框架",
    status: "active",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
    order: 1,
  },
  {
    id: "2",
    name: "React",
    url: "https://reactjs.org",
    description: "用于构建用户界面的 JavaScript 库",
    avatar: "https://reactjs.org/favicon.ico",
    category: "框架",
    status: "active",
    createdAt: new Date("2023-01-02"),
    updatedAt: new Date("2023-01-02"),
    order: 2,
  },
  {
    id: "3",
    name: "TypeScript",
    url: "https://www.typescriptlang.org",
    description: "JavaScript 的超集，添加了类型系统",
    avatar: "https://www.typescriptlang.org/favicon.ico",
    category: "语言",
    status: "active",
    createdAt: new Date("2023-01-03"),
    updatedAt: new Date("2023-01-03"),
    order: 3,
  },
]

/**
 * 获取默认数据的工具函数
 * 当API不可用时，返回默认数据
 */
export function getDefaultData() {
  return {
    users: defaultUsers,
    categories: [],
    tags: defaultTags,
    articles: defaultArticles,
    friendLinks: defaultFriendLinks,
  }
}

/**
 * 检查API是否可用
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://loushi.dpdns.org'
    const response = await fetch(`${baseUrl}/api/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 智能数据获取函数
 * 优先使用真实API，失败时回退到默认数据
 */
export async function getSmartData<T>(
  apiCall: () => Promise<T>,
  defaultData: T,
  fallbackEnabled: boolean = true
): Promise<T> {
  if (!fallbackEnabled) {
    return await apiCall()
  }

  try {
    return await apiCall()
  } catch (error) {
    console.warn('API call failed, using default data:', error)
    return defaultData
  }
}
