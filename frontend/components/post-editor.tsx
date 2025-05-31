"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Multiselect, MultiselectOption } from "@/components/ui/multiselect";
import { FeaturedImageSelector } from "@/components/featured-image-selector";
import { admin, categories as categoriesApi, tags as tagsApi } from "@/lib/api";
import { Save, Eye, Upload, ImagePlus } from "lucide-react";

const postSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  slug: z.string().min(1, "スラッグを入力してください").regex(/^[a-z0-9-]+$/, "スラッグは英数字とハイフンのみ使用できます"),
  content: z.string().min(1, "本文を入力してください"),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published"]),
  category_ids: z.array(z.number()),
  tag_ids: z.array(z.number()),
  featured_image_id: z.number().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostEditorProps {
  post?: {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: "draft" | "published";
    categories: Array<{ id: number }>;
    tags: Array<{ id: number }>;
    featured_image_id?: number;
  };
  onSave: (data: PostFormData, isPublish?: boolean) => Promise<void>;
}

export function PostEditor({ post, onSave }: PostEditorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedTab, setSelectedTab] = useState("editor");
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      status: post?.status || "draft",
      category_ids: post?.categories.map(c => c.id) || [],
      tag_ids: post?.tags.map(t => t.id) || [],
      featured_image_id: post?.featured_image_id,
    },
  });

  // Debug log for post data
  useEffect(() => {
    if (post) {
      console.log("Post data loaded:", post);
      console.log("Featured image ID from post:", post.featured_image_id);
      console.log("Featured image object:", post.featured_image);
    }
  }, [post]);

  const content = watch("content");
  const title = watch("title");

  useEffect(() => {
    // Generate slug from title
    if (!post && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  }, [title, setValue, post]);

  useEffect(() => {
    // Fetch categories and tags
    const fetchData = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          categoriesApi.list(),
          tagsApi.list(),
        ]);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (error) {
        toast({
          title: "エラー",
          description: "カテゴリとタグの取得に失敗しました",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [toast]);

  const onSubmit = async (data: PostFormData, isPublish: boolean = false) => {
    setIsLoading(true);
    try {
      if (isPublish) {
        data.status = "published";
      }
      console.log("Submitting post data:", data);
      console.log("Featured image ID:", data.featured_image_id);
      await onSave(data, isPublish);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImageToContent(file);
  };

  const uploadImageToContent = async (file: File) => {
    try {
      // Generate alt text from filename
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const result = await admin.images.upload(file, altText);
      const imageUrl = result.url;
      const currentContent = watch("content");
      setValue("content", `${currentContent}\n\n![${altText}](${imageUrl})\n`);
      toast({
        title: "アップロード完了",
        description: "画像をアップロードしました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if leaving the editor container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: "エラー",
        description: "画像ファイルのみドロップできます",
        variant: "destructive",
      });
      return;
    }

    // Upload all images
    for (const file of imageFiles) {
      await uploadImageToContent(file);
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="記事のタイトル"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">スラッグ</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="article-slug"
              disabled={isLoading}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">概要</Label>
          <Textarea
            id="excerpt"
            {...register("excerpt")}
            placeholder="記事の概要（省略可）"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categories">カテゴリ</Label>
            <Select
              value={watch("category_ids")[0]?.toString()}
              onValueChange={(value) => setValue("category_ids", [parseInt(value)])}
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">タグ</Label>
            <Multiselect
              options={tags.map((tag): MultiselectOption => ({
                label: tag.name,
                value: tag.id.toString()
              }))}
              value={watch("tag_ids").map(id => id.toString())}
              onChange={(values) => setValue("tag_ids", values.map(v => parseInt(v)))}
              placeholder="タグを選択"
              disabled={isLoading}
            />
          </div>
        </div>

        <FeaturedImageSelector
          selectedImageId={watch("featured_image_id")}
          onImageSelect={(imageId) => setValue("featured_image_id", imageId || undefined)}
          disabled={isLoading}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>本文</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                画像
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">エディタ</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <div 
                className="relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Textarea
                  {...register("content")}
                  placeholder="Markdownで記事を書く...（画像をドラッグ&ドロップで追加できます）"
                  rows={20}
                  disabled={isLoading}
                  className={`font-mono ${isDragging ? 'border-primary border-2 bg-primary/5' : ''}`}
                />
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-md pointer-events-none">
                    <div className="text-center">
                      <ImagePlus className="h-12 w-12 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-primary">画像をドロップして追加</p>
                    </div>
                  </div>
                )}
              </div>
              {errors.content && (
                <p className="text-sm text-destructive mt-2">{errors.content.message}</p>
              )}
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[500px] border rounded-md p-8 bg-background">
                {content ? (
                  <article className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">{title || "タイトル未設定"}</h1>
                    <MarkdownRenderer content={content} />
                  </article>
                ) : (
                  <p className="text-muted-foreground text-center">プレビューする内容がありません</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            下書き保存
          </Button>
          <Button
            type="button"
            onClick={handleSubmit((data: PostFormData) => onSubmit(data, true))}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4 mr-2" />
            公開
          </Button>
        </div>
      </div>
    </form>
  );
}