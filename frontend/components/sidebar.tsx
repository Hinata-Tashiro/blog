'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Tag, Folder, ChevronDown, ChevronRight, Filter } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface TagType {
  id: number;
  name: string;
  slug: string;
}

interface SidebarProps {
  categories: Category[];
  tags: TagType[];
  selectedCategories?: string[];
  selectedTags?: string[];
  sortBy?: string;
}

export function Sidebar({ categories, tags, selectedCategories = [], selectedTags = [], sortBy }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // アコーディオンの開閉状態
  const [isGenreExpanded, setIsGenreExpanded] = useState(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);

  const toggleCategory = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams);
    const currentCategories = params.getAll('categories');
    
    params.delete('categories');
    
    if (currentCategories.includes(categorySlug)) {
      // カテゴリを削除
      const newCategories = currentCategories.filter(cat => cat !== categorySlug);
      newCategories.forEach(cat => params.append('categories', cat));
    } else {
      // カテゴリを追加
      [...currentCategories, categorySlug].forEach(cat => params.append('categories', cat));
    }
    
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const toggleTag = (tagSlug: string) => {
    const params = new URLSearchParams(searchParams);
    const currentTags = params.getAll('tags');
    
    params.delete('tags');
    
    if (currentTags.includes(tagSlug)) {
      // タグを削除
      const newTags = currentTags.filter(tag => tag !== tagSlug);
      newTags.forEach(tag => params.append('tags', tag));
    } else {
      // タグを追加
      [...currentTags, tagSlug].forEach(tag => params.append('tags', tag));
    }
    
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === 'latest') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <aside className="space-y-4" suppressHydrationWarning>
      {/* フィルター・並び替えカード */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span suppressHydrationWarning><Filter className="h-5 w-5 text-primary" /></span>
          <h3 className="font-semibold">フィルター・並び替え</h3>
        </div>
        
        {/* 並び替えセクション */}
        <div className="mb-4">
          <button
            className="flex items-center gap-2 w-full text-left text-sm font-medium mb-3"
            onClick={() => setIsGenreExpanded(!isGenreExpanded)}
          >
            {isGenreExpanded ? 
              <span suppressHydrationWarning><ChevronDown className="h-4 w-4" /></span> : 
              <span suppressHydrationWarning><ChevronRight className="h-4 w-4" /></span>
            }
            <span suppressHydrationWarning><TrendingUp className="h-4 w-4 text-primary" /></span>
            並び替え
          </button>
          
          {isGenreExpanded && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  checked={!sortBy || sortBy === 'latest'}
                  onChange={() => handleSortChange('latest')}
                  className="text-primary focus:ring-primary"
                />
                最新順
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === 'popular'}
                  onChange={() => handleSortChange('popular')}
                  className="text-primary focus:ring-primary"
                />
                人気順
              </label>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />

        {/* カテゴリセクション */}
        <div className="mb-4">
          <button
            className="flex items-center gap-2 w-full text-left text-sm font-medium mb-3"
            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          >
            {isCategoriesExpanded ? 
              <span suppressHydrationWarning><ChevronDown className="h-4 w-4" /></span> : 
              <span suppressHydrationWarning><ChevronRight className="h-4 w-4" /></span>
            }
            <span suppressHydrationWarning><Folder className="h-4 w-4 text-primary" /></span>
            カテゴリ ({selectedCategories.length}/{categories.length}選択中)
          </button>
          
          {isCategoriesExpanded && (
            <div className="ml-6 space-y-2">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.slug);
                return (
                  <label key={category.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(category.slug)}
                      className="text-primary focus:ring-primary"
                    />
                    {category.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        
        <Separator className="my-4" />

        {/* タグセクション */}
        <div className="mb-4">
          <button
            className="flex items-center gap-2 w-full text-left text-sm font-medium mb-3"
            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
          >
            {isTagsExpanded ? 
              <span suppressHydrationWarning><ChevronDown className="h-4 w-4" /></span> : 
              <span suppressHydrationWarning><ChevronRight className="h-4 w-4" /></span>
            }
            <span suppressHydrationWarning><Tag className="h-4 w-4 text-primary" /></span>
            タグ ({selectedTags.length}/{tags.length}選択中)
          </button>
          
          {isTagsExpanded && (
            <div className="ml-6 space-y-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.slug);
                return (
                  <label key={tag.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTag(tag.slug)}
                      className="text-primary focus:ring-primary"
                    />
                    #{tag.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </aside>
  );
}