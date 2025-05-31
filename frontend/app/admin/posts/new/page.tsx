"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostEditor } from "@/components/post-editor";
import { admin } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (data: any, isPublish?: boolean) => {
    try {
      await admin.posts.create(data);
      toast({
        title: isPublish ? "公開しました" : "保存しました",
        description: isPublish ? "記事を公開しました" : "記事を下書き保存しました",
      });
      router.push("/admin");
    } catch (error) {
      toast({
        title: "エラー",
        description: "記事の保存に失敗しました",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">新規記事作成</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>記事を作成</CardTitle>
        </CardHeader>
        <CardContent>
          <PostEditor onSave={handleSave} />
        </CardContent>
      </Card>
    </div>
  );
}