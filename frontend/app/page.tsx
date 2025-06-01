import { PostCard } from "@/components/post-card";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { posts, categories as categoriesApi, tags as tagsApi } from "@/lib/api";
import { Suspense } from "react";

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

async function fetchServerData(searchParams: { search?: string; category?: string; tag?: string; page?: string }) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://nginx/api' 
      : 'http://backend:8000/api';
    
    const urls = [
      `${baseUrl}/posts/?page=${page}&per_page=${limit}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.category ? `&category=${searchParams.category}` : ''}${searchParams.tag ? `&tag=${searchParams.tag}` : ''}`,
      `${baseUrl}/categories/`,
      `${baseUrl}/tags/`,
    ];

    const [postsRes, categoriesRes, tagsRes] = await Promise.all([
      fetchWithRetry(urls[0]),
      fetchWithRetry(urls[1]),
      fetchWithRetry(urls[2]),
    ]);

    if (!postsRes.ok || !categoriesRes.ok || !tagsRes.ok) {
      console.error('API request details:', {
        posts: { status: postsRes.status, url: urls[0] },
        categories: { status: categoriesRes.status, url: urls[1] },
        tags: { status: tagsRes.status, url: urls[2] }
      });
      throw new Error(`API request failed - Posts: ${postsRes.status}, Categories: ${categoriesRes.status}, Tags: ${tagsRes.status}`);
    }

    const [postsData, categoriesData, tagsData] = await Promise.all([
      postsRes.json(),
      categoriesRes.json(),
      tagsRes.json(),
    ]);

    return { postsData, categoriesData, tagsData };
  } catch (error) {
    console.error('Server-side API error:', error);
    return {
      postsData: { posts: [], total: 0, total_pages: 0 },
      categoriesData: [],
      tagsData: [],
    };
  }
}

async function HomePage({ searchParams }: { searchParams: Promise<{ search?: string; category?: string; tag?: string; page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { postsData, categoriesData, tagsData } = await fetchServerData(params);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {params.search ? `「${params.search}」の検索結果` : '最新記事'}
              </h1>
              <p className="text-muted-foreground">
                {postsData.total}件の記事が見つかりました
              </p>
            </div>
            
            {/* 記事グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {postsData.posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            
            {/* ページネーション */}
            {postsData.total_pages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: postsData.total_pages }, (_, i) => i + 1).map((pageNum) => (
                  <a
                    key={pageNum}
                    href={`?page=${pageNum}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {pageNum}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          {/* サイドバー */}
          <div className="lg:col-span-1">
            <Sidebar categories={categoriesData} tags={tagsData} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: Promise<{ search?: string; category?: string; tag?: string; page?: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">読み込み中...</div>
        </main>
      </div>
    }>
      <HomePage searchParams={searchParams} />
    </Suspense>
  );
}