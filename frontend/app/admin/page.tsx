"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { admin } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export default function AdminPage() {
  const [postData, setPostData] = useState<PostListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await admin.posts.list(page, 20);
      setPostData(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "記事の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`「${title}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await admin.posts.delete(id);
      toast({
        title: "削除しました",
        description: `「${title}」を削除しました`,
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: "エラー",
        description: "記事の削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">記事管理</h1>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>記事一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {postData?.posts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              記事がありません
            </p>
          ) : (
            <div className="space-y-4">
              {postData?.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{post.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          post.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {post.status === "published" ? "公開中" : "下書き"}
                      </span>
                      <span>
                        更新: {format(new Date(post.updated_at), "yyyy/MM/dd", { locale: ja })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id, post.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {postData && postData.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                前のページ
              </Button>
              <span className="flex items-center px-4">
                {page} / {postData.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === postData.pages}
              >
                次のページ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}