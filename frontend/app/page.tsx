import { PostCard } from "@/components/post-card";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar-wrapper";
import { PageTracker } from "@/components/page-tracker";
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

async function fetchServerData(searchParams: { 
  search?: string; 
  categories?: string | string[]; 
  tags?: string | string[]; 
  page?: string; 
  sort?: string; 
  date_from?: string; 
  date_to?: string; 
  min_length?: string; 
  max_length?: string; 
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://nginx/api' 
      : 'http://backend:8000/api';
    
    // URLパラメータを構築
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('per_page', limit.toString());
    
    if (searchParams.search) {
      params.set('search', searchParams.search);
    }
    
    if (searchParams.sort) {
      params.set('sort', searchParams.sort);
    }
    
    // 複数カテゴリ対応
    if (searchParams.categories) {
      const categories = Array.isArray(searchParams.categories) ? searchParams.categories : [searchParams.categories];
      categories.forEach(cat => params.append('categories', cat));
    }
    
    // 複数タグ対応
    if (searchParams.tags) {
      const tags = Array.isArray(searchParams.tags) ? searchParams.tags : [searchParams.tags];
      tags.forEach(tag => params.append('tags', tag));
    }

    // 日付範囲フィルター
    if (searchParams.date_from) {
      params.set('date_from', searchParams.date_from);
    }
    
    if (searchParams.date_to) {
      params.set('date_to', searchParams.date_to);
    }

    // 文字数範囲フィルター
    if (searchParams.min_length) {
      params.set('min_length', searchParams.min_length);
    }
    
    if (searchParams.max_length) {
      params.set('max_length', searchParams.max_length);
    }
    
    const urls = [
      `${baseUrl}/posts/?${params.toString()}`,
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

async function HomePage({ searchParams }: { searchParams: Promise<{ 
  search?: string; 
  categories?: string | string[]; 
  tags?: string | string[]; 
  page?: string; 
  sort?: string; 
  date_from?: string; 
  date_to?: string; 
  min_length?: string; 
  max_length?: string; 
}> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { postsData, categoriesData, tagsData } = await fetchServerData(params);

  // 現在の絞り込み条件のデータを取得
  const selectedCategorySlugs = params.categories 
    ? (Array.isArray(params.categories) ? params.categories : [params.categories])
    : [];
  const selectedTagSlugs = params.tags 
    ? (Array.isArray(params.tags) ? params.tags : [params.tags])
    : [];
  
  const selectedCategories = selectedCategorySlugs.map(slug => 
    categoriesData.find((cat: any) => cat.slug === slug)
  ).filter(Boolean);
  
  const selectedTags = selectedTagSlugs.map(slug => 
    tagsData.find((tag: any) => tag.slug === slug)
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <PageTracker />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* フィルターセクション */}
          <div className="mb-4">
            <div className="flex items-center justify-end">
              <Sidebar 
                categories={categoriesData} 
                tags={tagsData}
                selectedCategories={selectedCategorySlugs}
                selectedTags={selectedTagSlugs}
                sortBy={params.sort}
                horizontal={true}
              />
            </div>
          </div>
          
          {/* 記事グリッド - 2カラムレイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {postsData.posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          
          {/* ページネーション */}
          {postsData.total_pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: postsData.total_pages }, (_, i) => i + 1).map((pageNum) => {
                const paginationParams = new URLSearchParams();
                if (params.search) paginationParams.set('search', params.search);
                if (params.sort) paginationParams.set('sort', params.sort);
                
                // 複数カテゴリ・タグ対応
                selectedCategorySlugs.forEach(cat => paginationParams.append('categories', cat));
                selectedTagSlugs.forEach(tag => paginationParams.append('tags', tag));
                
                paginationParams.set('page', pageNum.toString());
                
                return (
                  <a
                    key={pageNum}
                    href={`?${paginationParams.toString()}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {pageNum}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: Promise<{ 
  search?: string; 
  categories?: string | string[]; 
  tags?: string | string[]; 
  page?: string; 
  sort?: string; 
  date_from?: string; 
  date_to?: string; 
  min_length?: string; 
  max_length?: string; 
}> }) {
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