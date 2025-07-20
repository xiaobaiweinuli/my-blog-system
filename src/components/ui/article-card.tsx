import React from 'react';
import Link from "next/link"
import { Calendar, Clock, Eye, Heart, Tag } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { formatDate, formatRelativeTime, truncateText } from "@/lib/utils"
import type { Article } from "@/types"
import Image from 'next/image';

interface ArticleCardProps {
  article: Article
  showAuthor?: boolean
  showStats?: boolean
  variant?: "default" | "compact" | "featured"
}

export const ArticleCard = React.memo(function ArticleCard({ 
  article, 
  showAuthor = true, 
  showStats = true,
  variant = "default" 
}: ArticleCardProps) {
  const isCompact = variant === "compact"
  const isFeatured = variant === "featured"

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 h-full flex flex-col ${
      isFeatured ? "border-primary/20 bg-gradient-to-br from-background to-muted/20" : ""
    }`}>
      {/* 封面图片 */}
      {article.coverImage && !isCompact && (
        <div className="relative overflow-hidden rounded-lg flex justify-center items-center bg-black/5" style={{height: '200px'}}>
          <Link href={`/articles/${article.slug}`}>
            <Image
              src={article.coverImage}
              alt={article.title}
              width={400}
              height={200}
              placeholder="blur"
              blurDataURL="/placeholder.png"
              className="object-cover object-center h-full w-auto max-w-full max-h-full mx-auto rounded-lg"
              priority={isFeatured}
            />
          </Link>
          {isFeatured && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
              <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
                精选
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className={`${isCompact ? "pb-2" : ""} flex-none`}>
        {/* 分类和标签 */}
        <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {article.category}
          </Badge>
          {Array.isArray(article.tags) && article.tags.slice(0, isCompact ? 1 : 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* 标题 */}
        <Link href={`/articles/${article.slug}`}>
          <h3 className={`font-semibold line-clamp-2 hover:text-primary transition-colors ${
            isFeatured ? "text-lg sm:text-xl" : isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"
          }`}>
            {article.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className={`${isCompact ? "py-2" : ""} flex-1`}>
        {/* 摘要 */}
        {(article.excerpt || article.summary) && !isCompact && (
          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 mb-4">
            {truncateText(article.excerpt || article.summary || "", isCompact ? 80 : 120)}
          </p>
        )}

        {/* AI 摘要标识 */}
        {article.summary && !isCompact && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <span className="hidden sm:inline">AI 智能摘要</span>
            <span className="sm:hidden">AI</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        {/* 作者信息 */}
        {showAuthor && (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              {article.author?.avatar ? (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                  placeholder="blur"
                  blurDataURL="/placeholder.png"
                />
              ) : (
                <AvatarFallback className="text-xs">
                  {article.author?.name?.charAt(0) || "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {article.author?.name || "匿名"}
            </span>
          </div>
        )}

        {/* 发布时间 */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <time dateTime={article.publishedAt?.toISOString()}>
            {article.publishedAt ? formatRelativeTime(article.publishedAt) : formatRelativeTime(article.createdAt)}
          </time>
        </div>
      </CardFooter>

      {/* 统计信息 */}
      {showStats && !isCompact && (
        <CardFooter className="pt-0 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground w-full">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {article.likeCount}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {article.content && typeof article.content === 'string' ? Math.ceil(article.content.length / 500) : 1} 分钟阅读
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
});
