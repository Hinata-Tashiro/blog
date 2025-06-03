'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { likes } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PostActionBarProps {
  slug: string;
  title: string;
  initialCount?: number;
}

export function PostActionBar({ slug, title, initialCount = 0 }: PostActionBarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check localStorage for liked status
  useEffect(() => {
    const likedPosts = localStorage.getItem('likedPosts');
    if (likedPosts) {
      const posts = JSON.parse(likedPosts);
      setIsLiked(posts.includes(slug));
    }
  }, [slug]);

  // Listen for localStorage changes to sync between PC and mobile views
  useEffect(() => {
    const handleStorageChange = () => {
      const likedPosts = localStorage.getItem('likedPosts');
      if (likedPosts) {
        const posts = JSON.parse(likedPosts);
        setIsLiked(posts.includes(slug));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-page updates
    window.addEventListener('likedPostsChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('likedPostsChanged', handleStorageChange);
    };
  }, [slug]);

  const updateLocalStorage = (slug: string, liked: boolean) => {
    const likedPosts = localStorage.getItem('likedPosts');
    const posts = likedPosts ? JSON.parse(likedPosts) : [];
    
    if (liked && !posts.includes(slug)) {
      posts.push(slug);
    } else if (!liked && posts.includes(slug)) {
      const index = posts.indexOf(slug);
      posts.splice(index, 1);
    }
    
    localStorage.setItem('likedPosts', JSON.stringify(posts));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('likedPostsChanged', { detail: { slug, liked } }));
  };

  const handleLike = async () => {
    if (isLoading) return;

    // Check if already liked
    if (isLiked) {
      toast({
        title: '既にいいね済みです',
        description: 'この記事は既にいいねしています。',
      });
      return;
    }

    // Generate or get session ID
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('sessionId', sessionId);
    }

    setIsLoading(true);
    try {
      const response = await likes.toggle(slug, sessionId);
      setLikesCount(response.likes_count);
      
      // Update localStorage and notify other components
      updateLocalStorage(slug, true);
      setIsLiked(true);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'いいねの処理に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [shareUrl, setShareUrl] = useState('');
  
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback for browsers that don't support native share
      toast({
        title: '共有機能が利用できません',
        description: 'お使いのブラウザでは共有機能がサポートされていません。',
      });
    }
  };

  if (isMobile) {
    // Mobile floating action button style
    return (
      <div className="flex items-center gap-2 p-2 bg-card rounded-full shadow-lg border">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={cn(
            "relative group flex items-center gap-2 px-4 py-2 rounded-full transition-all",
            isLiked 
              ? "bg-purple-700/10 text-purple-700 hover:bg-purple-700/20" 
              : "hover:bg-secondary text-muted-foreground hover:text-purple-700"
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              isLiked && "fill-purple-700",
              "group-hover:scale-110"
            )}
          />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

        <div className="w-px h-6 bg-border" />

        {/* Native Share Button */}
        {shareUrl && (
          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center pl-2 pr-4 py-2 rounded-full hover:bg-secondary transition-colors"
            title="共有"
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  // Desktop vertical style (Zenn-like)
  return (
    <div className="sticky top-32 flex flex-col items-center space-y-3 z-40">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={cn(
          "relative group flex flex-col items-center gap-1 p-3 rounded-full transition-all",
          isLiked 
            ? "bg-purple-700/10 text-purple-700 hover:bg-purple-700/20" 
            : "hover:bg-secondary text-muted-foreground hover:text-purple-700"
        )}
      >
        <Heart
          className={cn(
            "h-6 w-6 transition-all",
            isLiked && "fill-purple-700",
            "group-hover:scale-110"
          )}
        />
        <span className="text-sm font-medium">{likesCount}</span>
      </button>

      {shareUrl && (
        <>
          {/* X (Twitter) */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full hover:bg-secondary transition-colors"
            title="Xでシェア"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full hover:bg-secondary transition-colors"
            title="Facebookでシェア"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          {/* Hatena Bookmark */}
          <a
            href={`https://b.hatena.ne.jp/entry/s/${shareUrl.replace(/^https?:\/\//, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full hover:bg-secondary transition-colors"
            title="はてなブックマークに追加"
          >
            <svg className="h-6 w-6" viewBox="0 0 27 28" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.4999 0.729736H21.5001C24.5376 0.729736 27 3.19213 27 6.22964V22.2298C27 25.2673 24.5376 27.7297 21.5001 27.7297H5.4999C2.46239 27.7297 0 25.2673 0 22.2298V6.22964C0 3.19213 2.46239 0.729736 5.4999 0.729736ZM12.98 13.7472C13.8521 13.8136 14.5319 14.1209 15.0212 14.6673V14.6679C15.512 15.2127 15.7572 15.9444 15.7572 16.8543C15.7572 17.5126 15.62 18.0877 15.3436 18.5867C15.0692 19.084 14.6756 19.4712 14.1604 19.7433C13.7441 19.9658 13.2289 20.1278 12.6155 20.2245C12.001 20.3179 10.9966 20.3665 9.6039 20.3665H6.13656V8.09392H9.50184C10.8859 8.09392 11.8503 8.13875 12.4016 8.22623C12.9503 8.31695 13.4206 8.4703 13.8164 8.68792C14.269 8.93902 14.6129 9.27437 14.8527 9.69341C15.0865 10.1151 15.2069 10.6028 15.2069 11.1546C15.2069 11.8512 15.0309 12.4053 14.6761 12.813C14.3197 13.2261 13.756 13.5355 12.98 13.7472ZM9.96192 10.8144H9.24372H9.24318V13.2768H9.91116C10.7352 13.2768 11.2984 13.1856 11.6073 13.0058C11.9124 12.8227 12.0663 12.5273 12.0663 12.0667C12.0663 11.6061 11.9216 11.2821 11.6375 11.0947C11.3497 10.9084 10.7919 10.8144 9.96192 10.8144ZM10.4128 18.1514C11.2028 18.1514 11.7661 18.0531 12.0928 17.8523V17.8528C12.4227 17.653 12.5863 17.3209 12.5863 16.8581C12.5863 16.3408 12.4367 15.9806 12.1338 15.7765C11.8357 15.5724 11.2747 15.4703 10.463 15.4703H9.24372V18.1514H10.4128ZM19.3093 17.257C18.4502 17.257 17.7547 17.9525 17.7547 18.8111C17.7547 19.6697 18.4507 20.3658 19.3093 20.3658C20.1679 20.3658 20.8634 19.6697 20.8634 18.8111C20.8634 17.9525 20.1668 17.257 19.3093 17.257ZM17.9593 8.09318H20.6593V16.2753H17.9593V8.09318Z" fill="currentColor"/>
            </svg>
          </a>
        </>
      )}
    </div>
  );
}