'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/api';
import { PageViewData } from '@/lib/types/analytics';

// セッションIDを生成・管理
const generateSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

interface UseAnalyticsProps {
  path: string;
  postId?: number;
  enabled?: boolean;
}

export function useAnalytics({ path, postId, enabled = true }: UseAnalyticsProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || hasTracked.current || typeof window === 'undefined') {
      return;
    }

    // ページロード時にトラッキング
    const trackPageView = async () => {
      try {
        const sessionId = generateSessionId();
        const referrer = document.referrer || undefined;

        const pageViewData: PageViewData = {
          url_path: path,
          post_id: postId,
          referrer,
          session_id: sessionId,
        };

        await analytics.track(pageViewData);
        hasTracked.current = true;
      } catch (error) {
        // エラーは無視（アナリティクスが失敗してもページ表示に影響しない）
        console.warn('Failed to track page view:', error);
      }
    };

    // 少し遅延させてページが安定してからトラッキング
    const timer = setTimeout(trackPageView, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [path, postId, enabled]);

  return {
    // 必要に応じて手動でイベントトラッキングを行う関数
    trackEvent: async (eventData: Partial<PageViewData>) => {
      if (!enabled) return;
      
      try {
        const sessionId = generateSessionId();
        await analytics.track({
          url_path: path,
          session_id: sessionId,
          ...eventData,
        });
      } catch (error) {
        console.warn('Failed to track event:', error);
      }
    },
  };
}

// ページビュートラッキング用のコンポーネント
interface AnalyticsTrackerProps {
  path: string;
  postId?: number;
  enabled?: boolean;
}

export function AnalyticsTracker({ path, postId, enabled = true }: AnalyticsTrackerProps) {
  useAnalytics({ path, postId, enabled });
  return null; // 何もレンダリングしない
}