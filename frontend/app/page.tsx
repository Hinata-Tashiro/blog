import { PostCard } from "@/components/post-card";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { posts, categories as categoriesApi, tags as tagsApi } from "@/lib/api";
import { Suspense } from "react";

async function HomePage({ searchParams }: { searchParams: { search?: string; category?: string; tag?: string; page?: string } }) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  
  const [postsData, categoriesData, tagsData] = await Promise.all([
    posts.list({
      page,
      per_page: limit,
      search: searchParams.search,
      category: searchParams.category,
      tag: searchParams.tag,
    }),
    categoriesApi.list(),
    tagsApi.list(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {searchParams.search ? `「${searchParams.search}」の検索結果` : '最新記事'}
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

export default function Home({ searchParams }: { searchParams: { search?: string; category?: string; tag?: string; page?: string } }) {
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