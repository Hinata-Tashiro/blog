'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Tag, Folder, ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  horizontal?: boolean;
}

export function Sidebar({ categories, tags, selectedCategories = [], selectedTags = [], sortBy, horizontal = false }: SidebarProps) {
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

  const handleDateRangeChange = (dateFrom: string, dateTo: string) => {
    const params = new URLSearchParams(searchParams);
    if (dateFrom) {
      params.set('date_from', dateFrom);
    } else {
      params.delete('date_from');
    }
    if (dateTo) {
      params.set('date_to', dateTo);
    } else {
      params.delete('date_to');
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const handleLengthRangeChange = (minLength: string, maxLength: string) => {
    const params = new URLSearchParams(searchParams);
    if (minLength) {
      params.set('min_length', minLength);
    } else {
      params.delete('min_length');
    }
    if (maxLength) {
      params.set('max_length', maxLength);
    } else {
      params.delete('max_length');
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    // 検索以外のパラメータをクリア
    params.delete('categories');
    params.delete('tags');
    params.delete('sort');
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0;

  if (horizontal) {
    return (
      <div className="flex items-center gap-3" suppressHydrationWarning>
        {/* ソートセレクト */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {!sortBy || sortBy === 'latest' ? 'Latest' : sortBy === 'popular' ? 'Popular' : 'Oldest'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            <div className="p-1">
              <button
                onClick={() => handleSortChange('latest')}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${
                  !sortBy || sortBy === 'latest' ? 'bg-accent' : ''
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => handleSortChange('popular')}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${
                  sortBy === 'popular' ? 'bg-accent' : ''
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => handleSortChange('oldest')}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${
                  sortBy === 'oldest' ? 'bg-accent' : ''
                }`}
              >
                Oldest
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* フィルターボタン */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 relative">
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* アクティブフィルター表示 */}
              {hasActiveFilters && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Filters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((categorySlug) => {
                      const category = categories.find(cat => cat.slug === categorySlug);
                      return category ? (
                        <Badge
                          key={category.id}
                          variant="default"
                          className="text-xs h-6 cursor-pointer"
                          onClick={() => toggleCategory(category.slug)}
                        >
                          {category.name}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ) : null;
                    })}
                    {selectedTags.map((tagSlug) => {
                      const tag = tags.find(t => t.slug === tagSlug);
                      return tag ? (
                        <Badge
                          key={tag.id}
                          variant="default"
                          className="text-xs h-6 cursor-pointer"
                          onClick={() => toggleTag(tag.slug)}
                        >
                          #{tag.name}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <Separator />
                </div>
              )}

              {/* カテゴリフィルター */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Folder className="h-4 w-4" />
                    Categories
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category.slug);
                      return (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.slug)}
                          className={`text-left px-2 py-1.5 text-xs rounded-sm transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-accent'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* タグフィルター */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Tags
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.slug);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.slug)}
                          className={`text-left px-2 py-1.5 text-xs rounded-sm transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-accent'
                          }`}
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

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
            <span suppressHydrationWarning><ArrowUpDown className="h-4 w-4 text-primary" /></span>
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
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === 'oldest'}
                  onChange={() => handleSortChange('oldest')}
                  className="text-primary focus:ring-primary"
                />
                古い順
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