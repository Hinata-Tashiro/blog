"use client";

import Link from "next/link";
import { Search, BookOpen, Github, X, Clock, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";

function SearchBox() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // URL検索パラメータから検索クエリを初期化
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // 検索履歴をローカルストレージから読み込み
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // 外部クリックでサジェスト閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // リアルタイム検索サジェスト
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSearchSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // クライアントサイドなので、ブラウザから直接アクセス可能なURLを使用
        const response = await fetch(`/api/posts/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (response.ok) {
          const posts = await response.json();
          const suggestions = posts.map((post: any) => post.title);
          setSearchSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Search suggestions error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const saveSearchHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleSearch = (e: React.FormEvent, query?: string) => {
    e.preventDefault();
    const searchTerm = query || searchQuery.trim();
    if (searchTerm) {
      saveSearchHistory(searchTerm);
      setShowSuggestions(false);
      router.push(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(new Event('submit') as any, suggestion);
  };

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSearch}>
        <Input
          ref={inputRef}
          type="search"
          placeholder="記事を検索..."
          className="w-[200px] md:w-[300px] pr-10 bg-secondary/50 border-secondary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
        </Button>
      </form>

      {/* 検索サジェスト */}
      {showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0 || searchQuery.length >= 2) && (
        <Card className="absolute top-full mt-1 w-full z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {/* 検索履歴 */}
            {searchHistory.length > 0 && searchQuery.length < 2 && (
              <>
                <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    最近の検索
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={clearSearchHistory}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {searchHistory.map((historyItem, index) => (
                  <div
                    key={index}
                    className="px-2 py-2 text-sm cursor-pointer hover:bg-secondary rounded-sm"
                    onClick={() => handleSuggestionClick(historyItem)}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {historyItem}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* 検索サジェスト */}
            {searchSuggestions.length > 0 && (
              <>
                {searchHistory.length > 0 && searchQuery.length < 2 && (
                  <div className="border-t my-2" />
                )}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  検索候補
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-2 py-2 text-sm cursor-pointer hover:bg-secondary rounded-sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-3 w-3 text-muted-foreground" />
                      {suggestion}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ローディング表示 */}
            {isLoading && (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                検索中...
              </div>
            )}

            {/* 結果なし */}
            {searchQuery.length >= 2 && !isLoading && searchSuggestions.length === 0 && (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                該当する記事が見つかりませんでした
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-6 w-6 text-primary" suppressHydrationWarning />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tech Blog
          </span>
        </Link>
        
        
        <div className="ml-auto flex items-center space-x-4">
          <Suspense fallback={
            <div className="w-[200px] md:w-[300px] h-10 bg-secondary/50 rounded-md animate-pulse" />
          }>
            <SearchBox />
          </Suspense>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" suppressHydrationWarning />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <X className="h-4 w-4" suppressHydrationWarning />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}