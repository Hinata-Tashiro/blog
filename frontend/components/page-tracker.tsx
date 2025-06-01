'use client';

import { useAnalytics } from '@/lib/hooks/use-analytics';
import { usePathname, useSearchParams } from 'next/navigation';

interface PageTrackerProps {
  postId?: number;
}

export function PageTracker({ postId }: PageTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // クエリパラメータを含むフルパスを作成
  const fullPath = searchParams.toString() 
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  useAnalytics({
    path: fullPath,
    postId,
    enabled: true
  });

  return null; // 何もレンダリングしない
}