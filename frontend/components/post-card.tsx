'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Image as ImageIcon, BookOpen } from 'lucide-react';
import { getThumbnailUrl } from '@/lib/config';
import { useEffect, useState } from 'react';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time';

interface Post {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  published_at: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  user: { username: string };
  featured_image?: {
    id: number;
    filename: string;
    alt_text?: string;
    width?: number;
    height?: number;
  };
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(
      new Date(post.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    );
  }, [post.published_at]);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
      <Link href={`/posts/${post.slug}`} className="block h-full">
        <div className="flex flex-col h-full">
          {/* アイキャッチ画像 */}
          <div className="aspect-video relative bg-muted overflow-hidden">
            {post.featured_image ? (
              <img
                src={getThumbnailUrl(post.featured_image.filename, 'medium')}
                alt={post.featured_image.alt_text || post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" suppressHydrationWarning />
              </div>
            )}
            {/* カテゴリバッジをオーバーレイ */}
            {post.categories.length > 0 && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm">
                  {post.categories[0].name}
                </Badge>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4 flex-1 flex flex-col">
          {/* カテゴリバッジ */}
          {post.categories.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {post.categories[0].name}
              </Badge>
            </div>
          )}
          
          {/* タイトル */}
          <h2 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          
          {/* 概要 */}
          {post.excerpt && (
            <p className="text-muted-foreground line-clamp-3 text-sm">
              {post.excerpt}
            </p>
          )}
          
          {/* タグ */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          
          {/* メタ情報 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" suppressHydrationWarning />
              <span>{post.user.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" suppressHydrationWarning />
              <time dateTime={post.published_at} suppressHydrationWarning>
                {formattedDate}
              </time>
            </div>
            {post.content && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" suppressHydrationWarning />
                <span>{formatReadingTime(calculateReadingTime(post.content))}</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </Link>
    </Card>
  );
}