"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getImageUrl, posts } from "@/lib/api";
import { Calendar, TrendingUp, Tag, FolderOpen } from "lucide-react";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  published_at: string;
  featured_image?: {
    filename: string;
    alt_text?: string;
  };
  categories: Array<{ id: number; name: string; slug: string }>;
}

interface RelatedPostsProps {
  postSlug: string;
}

export function RelatedPosts({ postSlug }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<{
    related_by_category: Post[];
    related_by_tags: Post[];
    popular: Post[];
  }>({
    related_by_category: [],
    related_by_tags: [],
    popular: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        console.log('Fetching related posts for:', postSlug);
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
        const data = await posts.getRelated(postSlug, 5);
        console.log('Related posts data:', data);
        setRelatedPosts(data);
      } catch (error) {
        console.error("Failed to fetch related posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (postSlug) {
      fetchRelatedPosts();
    }
  }, [postSlug]);

  const PostCard = ({ post }: { post: Post }) => (
    <Link href={`/posts/${post.slug}`} className="block group">
      <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
        {post.featured_image ? (
          <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
            <img
              src={getImageUrl(post.featured_image.filename)}
              alt={post.featured_image.alt_text || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-md flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span suppressHydrationWarning>
              {new Date(post.published_at).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {post.categories.length > 0 && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {post.categories[0].name}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">関連記事</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyPosts =
    relatedPosts.related_by_category.length > 0 ||
    relatedPosts.related_by_tags.length > 0 ||
    relatedPosts.popular.length > 0;

  if (!hasAnyPosts) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">関連記事</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden max-h-[60vh] lg:max-h-[65vh]">
        <Tabs defaultValue="category" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="category" className="text-xs">
              <FolderOpen className="w-3 h-3 mr-1" />
              カテゴリ
            </TabsTrigger>
            <TabsTrigger value="tags" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              タグ
            </TabsTrigger>
            <TabsTrigger value="popular" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              人気
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="category" className="mt-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {relatedPosts.related_by_category.length > 0 ? (
              relatedPosts.related_by_category.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                同じカテゴリの記事はありません
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="tags" className="mt-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {relatedPosts.related_by_tags.length > 0 ? (
              relatedPosts.related_by_tags.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                同じタグの記事はありません
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="popular" className="mt-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {relatedPosts.popular.length > 0 ? (
              relatedPosts.popular.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                人気記事はありません
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}