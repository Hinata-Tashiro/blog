"use client";

import Link from "next/link";
import { Search, BookOpen, Github, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-6 w-6 text-primary" suppressHydrationWarning />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tech Blog
          </span>
        </Link>
        
        <nav className="hidden md:flex ml-8 space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            記事
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
            About
          </Link>
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="記事を検索..."
              className="w-[200px] md:w-[300px] pr-10 bg-secondary/50 border-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
    </header>
  );
}