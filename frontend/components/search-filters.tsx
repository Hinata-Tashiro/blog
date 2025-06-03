'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface SearchFiltersProps {
  searchQuery?: string;
  selectedCategories?: Category[];
  selectedTags?: Tag[];
  sortBy?: string;
}

export function SearchFilters({ searchQuery, selectedCategories = [], selectedTags = [], sortBy }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasFilters = searchQuery || selectedCategories.length > 0 || selectedTags.length > 0 || sortBy;

  if (!hasFilters) {
    return null;
  }

  const removeFilter = (filterType: 'search' | 'categories' | 'tags' | 'sort') => {
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    params.delete('page'); // ページをリセット
    router.push(`/?${params.toString()}`);
  };

  const removeSpecificCategory = (categorySlugToRemove: string) => {
    const params = new URLSearchParams(searchParams);
    // 現在のカテゴリスラッグ一覧を取得（削除前に）
    const currentCategories = params.getAll('categories') || [];
    params.delete('categories');
    // 残りのカテゴリを再追加
    const remainingCategories = currentCategories.filter(cat => cat !== categorySlugToRemove);
    remainingCategories.forEach(cat => params.append('categories', cat));
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const removeSpecificTag = (tagSlugToRemove: string) => {
    const params = new URLSearchParams(searchParams);
    // 現在のタグスラッグ一覧を取得（削除前に）
    const currentTags = params.getAll('tags') || [];
    params.delete('tags');
    // 残りのタグを再追加
    const remainingTags = currentTags.filter(tag => tag !== tagSlugToRemove);
    remainingTags.forEach(tag => params.append('tags', tag));
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/');
  };

  return (
    <div className="mb-6 p-4 bg-secondary/10 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">絞り込み条件:</span>
          
          {searchQuery && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="text-sm font-medium">検索</span>
              <span className="text-sm text-muted-foreground">&quot;{searchQuery}&quot;</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent ml-1"
                onClick={() => removeFilter('search')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {sortBy && sortBy !== 'latest' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-full">
              <span className="text-sm font-medium">並び順</span>
              <span className="text-sm text-muted-foreground">{sortBy === 'popular' ? '人気順' : sortBy}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent ml-1"
                onClick={() => removeFilter('sort')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {selectedCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full">
              <span className="text-sm font-medium">カテゴリ</span>
              <span className="text-sm text-muted-foreground">{category.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent ml-1"
                onClick={() => removeSpecificCategory(category.slug)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {selectedTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full">
              <span className="text-sm font-medium">タグ</span>
              <span className="text-sm text-muted-foreground">#{tag.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent ml-1"
                onClick={() => removeSpecificTag(tag.slug)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="ml-4 text-xs"
        >
          すべてクリア
        </Button>
      </div>
    </div>
  );
}