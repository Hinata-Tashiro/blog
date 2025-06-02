"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // モバイルでは初期状態を折りたたみに、PCでは展開
      setIsExpanded(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // コンテンツから見出しを抽出
  useEffect(() => {
    // Markdownコンテンツから見出しを抽出
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;
    let index = 0;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length; // #の数 = レベル
      const text = match[2].trim();
      const id = `heading-${index}`;
      
      if (level === 2 || level === 3) { // h2とh3のみ
        items.push({ id, text, level });
        index++;
      }
    }
    
    setTocItems(items);
  }, [content]);

  // 実際のDOM要素にIDを付与し、スクロール監視を設定
  useEffect(() => {
    // 記事本文の見出しにIDを付与
    const articleContent = document.querySelector(".prose");
    if (!articleContent) return;

    const headings = articleContent.querySelectorAll("h2, h3");
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });

    // Intersection Observerの設定（ヘッダーの高さを考慮）
    const observerOptions = {
      rootMargin: "-80px 0px -70% 0px", // ヘッダー(64px) + マージン(16px)
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // 見出しを監視
    headings.forEach((heading) => {
      if (observerRef.current) {
        observerRef.current.observe(heading);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [tocItems]);


  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // ヘッダーの高さ(64px) + マージン(16px)
      const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  // 表示する項目数を制限（長い目次の場合）
  const MAX_ITEMS_COLLAPSED = 5;
  const shouldLimitItems = tocItems.length > 8;
  const displayItems = !isExpanded && shouldLimitItems 
    ? tocItems.slice(0, MAX_ITEMS_COLLAPSED) 
    : tocItems;

  return (
    <Card>
        <CardHeader className={cn("pb-3", isMobile && !isExpanded && "pb-4")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-lg">目次</CardTitle>
            </div>
            {/* PC表示時はアコーディオンボタンを非表示 */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    !isExpanded && "-rotate-90"
                  )}
                />
              </Button>
            )}
          </div>
        </CardHeader>
        {/* PC表示時は常に表示、モバイル時はアコーディオン */}
        {(!isMobile || isExpanded) && (
          <CardContent className="pt-0">
            <nav className="space-y-1 max-h-[25vh] lg:max-h-[20vh] overflow-y-auto custom-scrollbar">
              {displayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    "block w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors",
                    "hover:bg-secondary/50",
                    item.level === 3 && "pl-6",
                    activeId === item.id
                      ? "bg-secondary text-secondary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.text}
                </button>
              ))}
              {!isExpanded && shouldLimitItems && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  他{tocItems.length - MAX_ITEMS_COLLAPSED}項目
                </div>
              )}
            </nav>
          </CardContent>
        )}
      </Card>
  );
}