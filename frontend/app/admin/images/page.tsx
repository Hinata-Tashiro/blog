"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { admin, getImageUrl } from "@/lib/api";
import { Plus, Upload, Edit, Trash2, Image as ImageIcon, Copy, Search } from "lucide-react";
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

const imageUploadSchema = z.object({
  alt_text: z.string().optional(),
  caption: z.string().optional(),
});

const imageUpdateSchema = z.object({
  alt_text: z.string().max(500, "Alt属性は500文字以下で入力してください").optional(),
  caption: z.string().max(1000, "キャプションは1000文字以下で入力してください").optional(),
});

type ImageUploadFormData = z.infer<typeof imageUploadSchema>;
type ImageUpdateFormData = z.infer<typeof imageUpdateSchema>;

interface Image {
  id: number;
  filename: string;
  original_name: string;
  alt_text?: string;
  caption?: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export default function ImagesPage() {
  const { toast } = useToast();
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const uploadForm = useForm<ImageUploadFormData>({
    resolver: zodResolver(imageUploadSchema),
  });

  const editForm = useForm<ImageUpdateFormData>({
    resolver: zodResolver(imageUpdateSchema),
  });

  // Fetch images
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const data = await admin.images.list();
      setImages(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: "画像の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Filter images based on search query
  const filteredImages = images.filter(image =>
    image.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  // Upload images
  const onUploadSubmit = async (data: ImageUploadFormData) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "エラー",
        description: "画像ファイルを選択してください",
        variant: "destructive",
      });
      return;
    }

    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      try {
        return await admin.images.upload(file, data.alt_text, data.caption);
      } catch (error: any) {
        throw new Error(`${file.name}: ${error.response?.data?.detail || "アップロード失敗"}`);
      }
    });

    try {
      await Promise.all(uploadPromises);
      toast({
        title: "アップロード完了",
        description: `${selectedFiles.length}個の画像をアップロードしました`,
      });
      uploadForm.reset();
      setSelectedFiles(null);
      setIsUploadDialogOpen(false);
      fetchImages();
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "画像のアップロードに失敗しました",
        variant: "destructive",
      });
    }
  };

  // Edit image
  const handleEdit = (image: Image) => {
    setEditingImage(image);
    editForm.reset({
      alt_text: image.alt_text || "",
      caption: image.caption || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: ImageUpdateFormData) => {
    if (!editingImage) return;

    try {
      await admin.images.update(editingImage.id, data);
      toast({
        title: "更新完了",
        description: "画像情報が更新されました",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingImage(null);
      fetchImages();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "画像情報の更新に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Delete image
  const handleDelete = async (id: number) => {
    try {
      await admin.images.delete(id);
      toast({
        title: "削除完了",
        description: "画像が削除されました",
      });
      fetchImages();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "画像の削除に失敗しました";
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Copy URL to clipboard
  const copyUrl = useCallback(async (filename: string) => {
    const url = `${window.location.protocol}//${window.location.host}/uploads/images/${filename}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "コピー完了",
        description: "画像URLをクリップボードにコピーしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "クリップボードにコピーできませんでした",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "不明";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <ImageIcon className="h-8 w-8" />
              画像管理
            </h1>
            <p className="text-muted-foreground">
              ブログで使用する画像を管理します
            </p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                画像をアップロード
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>画像をアップロード</DialogTitle>
                <DialogDescription>
                  画像ファイルを選択してアップロードします（複数選択可）
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="files">画像ファイル</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP, GIF形式に対応（最大5MB）
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alt_text">Alt属性（省略可）</Label>
                    <Input
                      id="alt_text"
                      {...uploadForm.register("alt_text")}
                      placeholder="画像の説明文"
                    />
                    <p className="text-xs text-muted-foreground">
                      指定しない場合、ファイル名から自動生成されます
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="caption">キャプション（省略可）</Label>
                    <Textarea
                      id="caption"
                      {...uploadForm.register("caption")}
                      placeholder="画像の詳細説明"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">
                    <Upload className="h-4 w-4 mr-2" />
                    アップロード
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="画像を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredImages.length}個の画像
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "検索条件に一致する画像が見つかりません" : "画像が登録されていません"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              最初の画像をアップロード
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <img
                  src={getImageUrl(image.filename)}
                  alt={image.alt_text || image.original_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 truncate" title={image.original_name}>
                  {image.original_name}
                </h3>
                
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  {image.width && image.height && (
                    <p>{image.width} × {image.height}px</p>
                  )}
                  <p>{formatFileSize(image.file_size)}</p>
                  <p>{new Date(image.created_at).toLocaleDateString('ja-JP')}</p>
                </div>

                {image.alt_text && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    Alt: {image.alt_text}
                  </p>
                )}

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(image.filename)}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(image)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>画像を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{image.original_name}」を削除します。この操作は取り消せません。
                          この画像がアイキャッチ画像として使用されている場合は削除できません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(image.id)}>
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>画像情報を編集</DialogTitle>
            <DialogDescription>
              画像のAlt属性とキャプションを変更できます
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-alt_text">Alt属性</Label>
                <Input
                  id="edit-alt_text"
                  {...editForm.register("alt_text")}
                  placeholder="画像の説明文"
                />
                {editForm.formState.errors.alt_text && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.alt_text.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-caption">キャプション</Label>
                <Textarea
                  id="edit-caption"
                  {...editForm.register("caption")}
                  placeholder="画像の詳細説明"
                  rows={3}
                />
                {editForm.formState.errors.caption && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.caption.message}</p>
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