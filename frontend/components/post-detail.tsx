"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface Post {
  id: number;
  title: string;
  content: string;
  published_at: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  user: { username: string };
}

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            asChild
            className="mb-8 hover:bg-secondary/80"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              記事一覧に戻る
            </Link>
          </Button>

          <article className="bg-card rounded-lg shadow-sm border overflow-hidden">
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
              
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium text-sm">
                      {post.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{post.user.username}</span>
                </div>
                <time dateTime={post.published_at} className="text-sm">
                  {format(new Date(post.published_at), "yyyy年MM月dd日", { locale: ja })}
                </time>
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
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <MarkdownRenderer content={post.content} />
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}