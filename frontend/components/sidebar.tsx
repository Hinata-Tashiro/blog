'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Tag, Folder } from 'lucide-react';

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
}

export function Sidebar({ categories, tags }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* トレンドセクション */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" suppressHydrationWarning />
          <h3 className="font-semibold">トレンド</h3>
        </div>
        <div className="space-y-3">
          <Link href="/" className="block text-sm hover:text-primary transition-colors">
            最新の記事
          </Link>
          <Link href="/?sort=popular" className="block text-sm hover:text-primary transition-colors">
            人気の記事
          </Link>
        </div>
      </Card>

      {/* カテゴリセクション */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="h-5 w-5 text-primary" suppressHydrationWarning />
          <h3 className="font-semibold">カテゴリ</h3>
        </div>
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.slug}`}
              className="block"
            >
              <Badge variant="outline" className="w-full justify-start hover:bg-secondary">
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>

      {/* タグセクション */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5 text-primary" suppressHydrationWarning />
          <h3 className="font-semibold">タグ</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${tag.slug}`}
            >
              <Badge variant="secondary" className="hover:bg-secondary/80">
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </aside>
  );
}