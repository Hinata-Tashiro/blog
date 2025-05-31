"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { posts } from "@/lib/api";
import { getThumbnailUrl } from "@/lib/config";
import { useSearchParams } from "next/navigation";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  featured_image?: {
    id: number;
    filename: string;
    alt_text?: string;
    width?: number;
    height?: number;
  };
}

interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

function PostListContent() {
  const searchParams = useSearchParams();
  const [postData, setPostData] = useState<PostListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || undefined;
  const tag = searchParams.get("tag") || undefined;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await posts.list({ page, category, tag });
        setPostData(data);
      } catch (err) {
        setError("記事の取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, category, tag]);

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!postData || postData.posts.length === 0) {
    return <div className="text-center py-8">記事がありません</div>;
  }

  return (
    <div className="space-y-6">
      {postData.posts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <Link href={`/posts/${post.slug}`} className="block">
            <div className="grid md:grid-cols-3 gap-0">
              {/* アイキャッチ画像セクション */}
              <div className="md:col-span-1 relative bg-muted">
                {post.featured_image ? (
                  <div className="aspect-video md:aspect-square h-full relative overflow-hidden">
                    <img
                      src={getThumbnailUrl(post.featured_image.filename, 'large')}
                      alt={post.featured_image.alt_text || post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video md:aspect-square h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary/60">
                          {post.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">No Image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* コンテンツセクション */}
              <div className="md:col-span-2 p-6 flex flex-col">
                <div className="flex-1">
                  {/* カテゴリ */}
                  {post.categories.length > 0 && (
                    <div className="mb-2">
                      <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                        {post.categories[0].name}
                      </span>
                    </div>
                  )}

                  {/* タイトル */}
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* 日付と著者 */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <time dateTime={post.published_at}>
                      {format(new Date(post.published_at), "yyyy年MM月dd日", { locale: ja })}
                    </time>
                  </div>

                  {/* 概要 */}
                  <p className="text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                </div>

                {/* タグ */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-secondary/50 hover:bg-secondary px-2 py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/?tag=${tag.slug}`;
                        }}
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </Card>
      ))}

      {postData.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button
              variant="outline"
              onClick={() => window.location.href = `?page=${page - 1}`}
            >
              前のページ
            </Button>
          )}
          <span className="flex items-center px-4">
            {page} / {postData.pages}
          </span>
          {page < postData.pages && (
            <Button
              variant="outline"
              onClick={() => window.location.href = `?page=${page + 1}`}
            >
              次のページ
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function PostList() {
  return (
    <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
      <PostListContent />
    </Suspense>
  );
}