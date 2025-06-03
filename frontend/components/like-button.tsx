'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { likes } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  slug: string;
  initialCount?: number;
  className?: string;
}

export function LikeButton({ slug, initialCount = 0, className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check localStorage for liked status
  useEffect(() => {
    const likedPosts = localStorage.getItem('likedPosts');
    if (likedPosts) {
      const posts = JSON.parse(likedPosts);
      setIsLiked(posts.includes(slug));
    }
  }, [slug]);

  useEffect(() => {
    setLikesCount(initialCount);
  }, [initialCount]);

  // Listen for localStorage changes to sync state
  useEffect(() => {
    const handleStorageChange = () => {
      const likedPosts = localStorage.getItem('likedPosts');
      if (likedPosts) {
        const posts = JSON.parse(likedPosts);
        setIsLiked(posts.includes(slug));
      }
    };

    window.addEventListener('storage', handleStorageChange);
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

  return (
    <Button
      variant={isLiked ? 'default' : 'outline'}
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 transition-all',
        isLiked && 'bg-purple-700 hover:bg-purple-700/90 text-white border-purple-700',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all',
          isLiked && 'fill-current'
        )}
      />
      <span>{likesCount}</span>
    </Button>
  );
}