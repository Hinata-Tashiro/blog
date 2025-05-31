"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { admin } from "@/lib/api";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tagSchema = z.object({
  name: z.string().min(1, "タグ名を入力してください").max(50, "タグ名は50文字以下で入力してください"),
  slug: z.string().min(1, "スラッグを入力してください").max(50, "スラッグは50文字以下で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは英数字とハイフンのみ使用できます"),
});

type TagFormData = z.infer<typeof tagSchema>;

interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export default function TagsPage() {
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
  });

  const editForm = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Watch name field to auto-generate slug
  const watchCreateName = createForm.watch("name");
  const watchEditName = editForm.watch("name");

  useEffect(() => {
    if (watchCreateName) {
      const slug = generateSlug(watchCreateName);
      createForm.setValue("slug", slug);
    }
  }, [watchCreateName, createForm]);

  useEffect(() => {
    if (watchEditName && editingTag) {
      const slug = generateSlug(watchEditName);
      editForm.setValue("slug", slug);
    }
  }, [watchEditName, editForm, editingTag]);

  // Fetch tags
  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const data = await admin.tags.list();
      setTags(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "タグの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Create tag
  const onCreateSubmit = async (data: TagFormData) => {
    try {
      await admin.tags.create(data);
      toast({
        title: "作成完了",
        description: "タグが作成されました",
      });
      createForm.reset();
      setIsCreateDialogOpen(false);
      fetchTags();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "タグの作成に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Edit tag
  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    editForm.reset({
      name: tag.name,
      slug: tag.slug,
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: TagFormData) => {
    if (!editingTag) return;

    try {
      await admin.tags.update(editingTag.id, data);
      toast({
        title: "更新完了",
        description: "タグが更新されました",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingTag(null);
      fetchTags();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "タグの更新に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Delete tag
  const handleDelete = async (id: number) => {
    try {
      await admin.tags.delete(id);
      toast({
        title: "削除完了",
        description: "タグが削除されました",
      });
      fetchTags();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "タグの削除に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Tags className="h-8 w-8" />
              タグ管理
            </h1>
            <p className="text-muted-foreground">
              記事のタグを管理します
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいタグ</DialogTitle>
                <DialogDescription>
                  新しいタグを作成します
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">タグ名</Label>
                    <Input
                      id="create-name"
                      {...createForm.register("name")}
                      placeholder="タグ名を入力"
                    />
                    {createForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="create-slug">スラッグ</Label>
                    <Input
                      id="create-slug"
                      {...createForm.register("slug")}
                      placeholder="tag-slug"
                    />
                    {createForm.formState.errors.slug && (
                      <p className="text-sm text-destructive">{createForm.formState.errors.slug.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">
                    作成
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>タグ一覧</CardTitle>
          <CardDescription>
            {tags.length}個のタグが登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8">
              <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">タグが登録されていません</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                最初のタグを作成
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <div key={tag.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{tag.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tag.slug}
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>タグを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              「{tag.name}」を削除します。この操作は取り消せません。
                              このタグが記事で使用されている場合は削除できません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tag.id)}>
                              削除する
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    作成日: {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを編集</DialogTitle>
            <DialogDescription>
              タグの情報を変更します
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">タグ名</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name")}
                  placeholder="タグ名を入力"
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-slug">スラッグ</Label>
                <Input
                  id="edit-slug"
                  {...editForm.register("slug")}
                  placeholder="tag-slug"
                />
                {editForm.formState.errors.slug && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.slug.message}</p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">
                更新
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}