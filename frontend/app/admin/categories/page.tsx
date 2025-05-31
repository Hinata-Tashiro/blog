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
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
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

const categorySchema = z.object({
  name: z.string().min(1, "カテゴリ名を入力してください").max(50, "カテゴリ名は50文字以下で入力してください"),
  slug: z.string().min(1, "スラッグを入力してください").max(50, "スラッグは50文字以下で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは英数字とハイフンのみ使用できます"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const editForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
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
    if (watchEditName && editingCategory) {
      const slug = generateSlug(watchEditName);
      editForm.setValue("slug", slug);
    }
  }, [watchEditName, editForm, editingCategory]);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await admin.categories.list();
      setCategories(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "カテゴリの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create category
  const onCreateSubmit = async (data: CategoryFormData) => {
    try {
      await admin.categories.create(data);
      toast({
        title: "作成完了",
        description: "カテゴリが作成されました",
      });
      createForm.reset();
      setIsCreateDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "カテゴリの作成に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Edit category
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      slug: category.slug,
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      await admin.categories.update(editingCategory.id, data);
      toast({
        title: "更新完了",
        description: "カテゴリが更新されました",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "カテゴリの更新に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Delete category
  const handleDelete = async (id: number) => {
    try {
      await admin.categories.delete(id);
      toast({
        title: "削除完了",
        description: "カテゴリが削除されました",
      });
      fetchCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "カテゴリの削除に失敗しました";
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
              <FolderOpen className="h-8 w-8" />
              カテゴリ管理
            </h1>
            <p className="text-muted-foreground">
              記事のカテゴリを管理します
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
                <DialogTitle>新しいカテゴリ</DialogTitle>
                <DialogDescription>
                  新しいカテゴリを作成します
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">カテゴリ名</Label>
                    <Input
                      id="create-name"
                      {...createForm.register("name")}
                      placeholder="カテゴリ名を入力"
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
                      placeholder="category-slug"
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
          <CardTitle>カテゴリ一覧</CardTitle>
          <CardDescription>
            {categories.length}個のカテゴリが登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">カテゴリが登録されていません</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                最初のカテゴリを作成
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      スラッグ: {category.slug}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      作成日: {new Date(category.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{category.name}」を削除します。この操作は取り消せません。
                            このカテゴリが記事で使用されている場合は削除できません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)}>
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
            <DialogTitle>カテゴリを編集</DialogTitle>
            <DialogDescription>
              カテゴリの情報を変更します
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">カテゴリ名</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name")}
                  placeholder="カテゴリ名を入力"
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
                  placeholder="category-slug"
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