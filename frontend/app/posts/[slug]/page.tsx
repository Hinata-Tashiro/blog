import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/post-detail";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10秒タイムアウト
      });
      return response;
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 指数バックオフ
    }
  }
  throw new Error('All retry attempts failed');
}

async function fetchPost(slug: string) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://nginx/api' 
      : 'http://backend:8000/api';
    
    const response = await fetchWithRetry(`${baseUrl}/posts/${slug}`);
    
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Server-side post fetch error:', error);
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const post = await fetchPost(slug);
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
    post = await fetchPost(slug);
  } catch (error) {
    notFound();
  }

  return <PostDetail post={post} />;
}