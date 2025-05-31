"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { FileText, Tags, FolderOpen, LogOut } from "lucide-react";

export function AdminHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center space-x-2">
            <span className="text-xl font-bold">管理画面</span>
          </Link>
          
          <nav className="flex items-center space-x-2 ml-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <FileText className="mr-2 h-4 w-4" />
                記事管理
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/categories">
                <FolderOpen className="mr-2 h-4 w-4" />
                カテゴリ
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/tags">
                <Tags className="mr-2 h-4 w-4" />
                タグ
              </Link>
            </Button>
          </nav>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.username}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}