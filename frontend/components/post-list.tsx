"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { posts } from "@/lib/api";
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
        <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
          {post.featured_image && (
            <div className="aspect-video relative bg-muted">
              <img
                src={`/uploads/images/${post.featured_image.filename}`}
                alt={post.featured_image.alt_text || post.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle>
              <Link 
                href={`/posts/${post.slug}`}
                className="hover:text-primary transition-colors"
              >
                {post.title}
              </Link>
            </CardTitle>
            <CardDescription>
              {format(new Date(post.published_at), "yyyy年MM月dd日", { locale: ja })}
              {post.categories.length > 0 && (
                <span className="ml-4">
                  カテゴリ: {post.categories.map(cat => cat.name).join(", ")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/?tag=${tag.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
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