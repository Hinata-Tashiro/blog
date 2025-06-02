"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableOfContents } from "@/components/table-of-contents";
import { RelatedPosts } from "@/components/related-posts";

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

interface User {
  username: string;
}

interface PostSidebarProps {
  post: {
    id: number;
    title: string;
    slug: string;
    content: string;
    published_at: string;
    categories: Category[];
    tags: Tag[];
    user: User;
  };
}

export function PostSidebar({ post }: PostSidebarProps) {

  const [isSticky, setIsSticky] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState({ left: 0, width: 0 });
  const [isResizing, setIsResizing] = useState(false);

  // スクロール監視で固定化の切り替え
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    // サイドバーの位置を計算（PC以外では実行しない）
    const calculateSidebarPosition = () => {
      // PC以外（lg未満）では実行しない
      if (window.innerWidth < 1024) return;
      
      const sidebarElement = document.querySelector('.lg\\:col-span-4');
      if (sidebarElement) {
        const rect = sidebarElement.getBoundingClientRect();
        setSidebarPosition({
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    const handleScrollWithCheck = () => {
      // リサイズ中またはPC以外では固定化しない
      if (isResizing || window.innerWidth < 1024) {
        setIsSticky(false);
        return;
      }
      
      // 目次コンテナの現在位置とヘッダーの距離を計算
      const tocContainer = document.querySelector('.lg\\:col-span-4 .toc-container');
      const authorCard = document.querySelector('.lg\\:col-span-4 .card-author');
      
      if (tocContainer && authorCard) {
        const tocRect = tocContainer.getBoundingClientRect();
        const authorRect = authorCard.getBoundingClientRect();
        
        // 執筆者カードが画面内に見えている場合は固定化しない
        if (authorRect.bottom > 80) {
          setIsSticky(false);
        } else {
          // 目次コンテナの上端がヘッダー下部+マージン（80px）に達したら固定化
          setIsSticky(tocRect.top <= 80);
        }
      } else {
        // 要素が見つからない場合はデフォルト値を使用
        setIsSticky(window.scrollY > 300);
      }
    };

    const handleResize = () => {
      // リサイズ開始時に固定化を無効にする
      setIsResizing(true);
      setIsSticky(false);
      
      // デバウンス処理でリサイズ終了を検知
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setIsResizing(false);
        calculateSidebarPosition();
        // リサイズ終了後にスクロール状態をチェック
        if (window.innerWidth >= 1024) {
          const scrollThreshold = 400;
          setIsSticky(window.scrollY > scrollThreshold);
        }
      }, 150);
    };

    calculateSidebarPosition();
    window.addEventListener('scroll', handleScrollWithCheck);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScrollWithCheck);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isResizing]);

  return (
    <>
      {/* 執筆者情報 */}
      <Card className="mb-4 card-author">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">執筆者</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{post.user.username}</h3>
              <p className="text-xs text-muted-foreground">技術ブログ執筆者</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* 目次と関連記事 - 条件付き固定化 */}
      <div 
        className={`transition-all duration-300 toc-container ${
          isSticky 
            ? 'fixed top-20 z-40 h-[calc(100vh-5rem)] overflow-hidden'
            : 'space-y-4'
        }`}
        style={isSticky ? {
          left: `${sidebarPosition.left}px`,
          width: `${sidebarPosition.width}px`
        } : undefined}
      >
        <div className={`space-y-4 ${isSticky ? 'h-full flex flex-col' : ''}`}>
          <div className={isSticky ? 'flex-shrink-0' : ''}>
            <TableOfContents content={post.content} />
          </div>
          <div className={isSticky ? 'flex-1 min-h-0' : ''}>
            <RelatedPosts postSlug={post.slug} />
          </div>
        </div>
      </div>
    </>
  );
}