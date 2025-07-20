import DashboardLayout from '../layout'
import { requireCollaborator } from "@/lib/auth-utils"
import Link from "next/link"
import { Plus, Search, Filter, Edit, Copy, Trash2, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminLayout } from "@/components/admin/admin-layout"
import ArticleDashboardClient from './ArticleDashboardClient'
import ArticleDeleteButton from './ArticleDeleteButton'
interface ArticleManagementPageProps {
  searchParams: {
    page?: string
    search?: string
    category?: string
    status?: string
  }
}

// 在 ArticleManagementPage 顶部添加 Article 类型声明
interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  status: string;
  createdAt?: string;
  publishedAt?: string;
  viewCount?: number;
}

// 适配后端返回的文章数据到前端 Article 类型
function adaptArticle(raw: any): Article {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    content: raw.content,
    author: {
      name: raw.author_username || '未知',
      avatar: raw.author_avatar || '',
    },
    category: raw.category,
    tags: Array.isArray(raw.tags) ? raw.tags : (raw.tags ? JSON.parse(raw.tags) : []),
    status: raw.status,
    createdAt: raw.created_at,
    publishedAt: raw.published_at,
    viewCount: raw.view_count,
  }
}

// 客户端渲染的文章管理组件

export default function ArticleManagementPage() {
  return <ArticleDashboardClient />
} 