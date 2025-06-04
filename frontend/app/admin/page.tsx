"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { admin } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

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

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await admin.posts.update(id, { status: newStatus });
      toast({
        title: "ステータスを更新しました",
        description: newStatus === "published" ? "記事を公開しました" : "記事を下書きに変更しました",
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: "エラー",
        description: "ステータスの更新に失敗しました",
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
          <div className="flex items-center justify-between">
            <CardTitle>記事一覧</CardTitle>
            {selectedPosts.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedPosts.size}件選択中
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const result = await admin.posts.bulk(Array.from(selectedPosts), 'publish');
                        toast({
                          title: "一括公開完了",
                          description: `${result.success_count}件の記事を公開しました`,
                        });
                        setSelectedPosts(new Set());
                        fetchPosts();
                      } catch (error) {
                        toast({
                          title: "エラー",
                          description: "一部の記事の公開に失敗しました",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    一括公開
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const result = await admin.posts.bulk(Array.from(selectedPosts), 'unpublish');
                        toast({
                          title: "一括下書き化完了",
                          description: `${result.success_count}件の記事を下書きにしました`,
                        });
                        setSelectedPosts(new Set());
                        fetchPosts();
                      } catch (error) {
                        toast({
                          title: "エラー",
                          description: "一部の記事の下書き化に失敗しました",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    一括下書き
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!confirm(`選択した${selectedPosts.size}件の記事を削除してもよろしいですか？`)) {
                        return;
                      }
                      try {
                        const result = await admin.posts.bulk(Array.from(selectedPosts), 'delete');
                        toast({
                          title: "削除完了",
                          description: `${result.success_count}件の記事を削除しました`,
                        });
                        setSelectedPosts(new Set());
                        fetchPosts();
                      } catch (error) {
                        toast({
                          title: "エラー",
                          description: "一部の記事の削除に失敗しました",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    一括削除
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {postData?.posts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              記事がありません
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <Checkbox
                  checked={
                    postData?.posts.length > 0 &&
                    postData.posts.every(post => selectedPosts.has(post.id))
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIds = new Set(postData?.posts.map(p => p.id) || []);
                      setSelectedPosts(allIds);
                    } else {
                      setSelectedPosts(new Set());
                    }
                  }}
                />
                <span className="text-sm font-medium">すべて選択</span>
              </div>
              {postData?.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // チェックボックスやボタンがクリックされた場合は行クリックを無効化
                    if (
                      target.closest('button') ||
                      target.closest('input[type="checkbox"]') ||
                      target.closest('[role="checkbox"]')
                    ) {
                      return;
                    }
                    router.push(`/admin/posts/${post.id}/edit`);
                  }}
                >
                  <Checkbox
                    checked={selectedPosts.has(post.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedPosts);
                      if (checked) {
                        newSelected.add(post.id);
                      } else {
                        newSelected.delete(post.id);
                      }
                      setSelectedPosts(newSelected);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold hover:underline">{post.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 px-2 py-1 text-xs ${
                          post.status === "published"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(post.id, post.status);
                        }}
                      >
                        {post.status === "published" ? "公開中" : "下書き"}
                      </Button>
                      <span>
                        更新: {format(new Date(post.updated_at), "yyyy/MM/dd", { locale: ja })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
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