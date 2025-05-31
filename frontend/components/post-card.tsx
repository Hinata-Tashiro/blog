'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  published_at: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  user: { username: string };
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="p-6 space-y-4">
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
              <User className="h-3 w-3" />
              <span>{post.user.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <time dateTime={post.published_at}>
                {format(new Date(post.published_at), 'yyyy年MM月dd日', { locale: ja })}
              </time>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}