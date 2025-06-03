"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { PostSidebar } from "@/components/post-sidebar";
import { TableOfContents } from "@/components/table-of-contents";
import { RelatedPosts } from "@/components/related-posts";
import { getImageUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { usePathname } from "next/navigation";
import { ReadingProgressBar } from "@/components/reading-progress-bar";
import { calculateReadingTime, formatReadingTime } from "@/lib/utils/reading-time";
import { PostActionBar } from "@/components/post-action-bar";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  user: { username: string };
  featured_image?: {
    id: number;
    filename: string;
    alt_text?: string;
    caption?: string;
    width?: number;
    height?: number;
  };
  likes_count?: number;
  is_liked?: boolean;
}

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const pathname = usePathname();
  const readingTime = calculateReadingTime(post.content);
  
  // アナリティクストラッキング
  useAnalytics({
    path: pathname,
    postId: post.id,
    enabled: true
  });

  useEffect(() => {
    setFormattedDate(
      new Date(post.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    );
  }, [post.published_at]);

  return (
    <div className="min-h-screen bg-background">
      <ReadingProgressBar />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            asChild
            className="mb-8 hover:bg-secondary/80"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" suppressHydrationWarning />
              記事一覧に戻る
            </Link>
          </Button>

          <div className="flex gap-4">
            {/* アクションバー（PC表示時のみ、左側） */}
            <div className="hidden lg:block w-16 flex-shrink-0">
              <PostActionBar
                slug={post.slug}
                title={post.title}
                initialCount={post.likes_count || 0}
              />
            </div>

            {/* メインコンテンツとサイドバーのコンテナ */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* メインコンテンツ */}
              <div className="lg:col-span-8">
              <article className="bg-card rounded-lg shadow-sm border overflow-hidden">
                {/* アイキャッチ画像 */}
                {post.featured_image && (
                  <div className="aspect-video relative bg-muted">
                    <img
                      src={getImageUrl(post.featured_image.filename)}
                      alt={post.featured_image.alt_text || post.title}
                      className="w-full h-full object-cover"
                    />
                    {post.featured_image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm">{post.featured_image.caption}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ヘッダー部分 */}
                <header className="p-8 border-b bg-gradient-to-r from-background to-secondary/20">
                  {/* カテゴリバッジ */}
                  {post.categories.length > 0 && (
                    <div className="mb-4">
                      <Link
                        href={`/?category=${post.categories[0].slug}`}
                        className="inline-block"
                      >
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                          {post.categories[0].name}
                        </span>
                      </Link>
                    </div>
                  )}
                  
                  <h1 className="text-4xl font-bold mb-6 leading-tight">{post.title}</h1>
                  
                  {/* 執筆者情報と日付 */}
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">
                          {post.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{post.user.username}</span>
                    </div>
                    <time dateTime={post.published_at} className="text-sm" suppressHydrationWarning>
                      {formattedDate}
                    </time>
                  </div>

                  {/* 記事情報（全デバイス共通） */}
                  <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">読了時間:</span>
                        <span className="font-medium">{formatReadingTime(readingTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">文字数:</span>
                        <span className="font-medium">{post.content.trim().split(/\s+/).length.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* タグ */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/?tag=${tag.slug}`}
                          className="text-sm bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </header>

                {/* 記事本文 */}
                <div className="p-8">
                  {/* モバイル・タブレット用の目次（アコーディオン） */}
                  <div className="lg:hidden mb-8">
                    <TableOfContents content={post.content} />
                  </div>
                  
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <MarkdownRenderer content={post.content} />
                  </div>
                </div>
              </article>

              {/* モバイル・タブレット用の関連記事 */}
              <div className="lg:hidden mt-8">
                <RelatedPosts postSlug={post.slug} />
              </div>
            </div>

              {/* サイドバー（PC表示時のみ） */}
              <div className="hidden lg:block lg:col-span-4 relative">
                <PostSidebar post={post} />
              </div>
            </div>
          </div>

          {/* モバイル用フローティングアクションボタン */}
          <div className="fixed bottom-6 right-6 lg:hidden z-50">
            <PostActionBar
              slug={post.slug}
              title={post.title}
              initialCount={post.likes_count || 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
}