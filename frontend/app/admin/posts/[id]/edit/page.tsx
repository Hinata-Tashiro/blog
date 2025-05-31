"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostEditor } from "@/components/post-editor";
import { admin, posts } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await admin.posts.get(parseInt(id));
        setPost(postData);
      } catch (error) {
        toast({
          title: "エラー",
          description: "記事の取得に失敗しました",
          variant: "destructive",
        });
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, router, toast]);

  const handleSave = async (data: any, isPublish?: boolean) => {
    try {
      await admin.posts.update(parseInt(id), data);
      toast({
        title: isPublish ? "公開しました" : "更新しました",
        description: isPublish ? "記事を公開しました" : "記事を更新しました",
      });
      router.push("/admin");
    } catch (error) {
      toast({
        title: "エラー",
        description: "記事の更新に失敗しました",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (!post) {
    return <div className="text-center py-8">記事が見つかりません</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">記事編集</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>記事を編集</CardTitle>
        </CardHeader>
        <CardContent>
          <PostEditor post={post} onSave={handleSave} />
        </CardContent>
      </Card>
    </div>
  );
}