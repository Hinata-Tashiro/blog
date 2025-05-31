import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";
import { posts } from "@/lib/api";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const post = await posts.get(slug);
    return {
      title: `${post.title} | Tech Blog`,
      description: post.excerpt || post.title,
    };
  } catch (error) {
    return {
      title: "記事が見つかりません | Tech Blog",
    };
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  
  let post;
  try {
    post = await posts.get(slug);
  } catch (error) {
    notFound();
  }

  return <PostDetail post={post} />;
}