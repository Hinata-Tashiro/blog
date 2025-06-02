'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {

  return (
    <>
      <ReactMarkdown
        className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
        code: ({ node, inline, className, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={`${className} block overflow-x-auto p-4 bg-[#282c34] text-gray-100 rounded-lg`}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => {
          return (
            <pre className="p-0 bg-transparent overflow-visible" {...props}>
              {children}
            </pre>
          );
        },
        img: ({ src, alt, ...props }: ComponentPropsWithoutRef<'img'>) => {
          if (!src) return null;
          
          // 相対パスの場合、APIのベースURLを追加
          const imageSrc = src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}${src}`;
          
          return (
            <span className="block my-8">
              <img
                src={imageSrc}
                alt={alt || ''}
                className="rounded-lg shadow-lg mx-auto hover:shadow-xl transition-shadow duration-200"
                style={{ height: 'auto', maxWidth: '100%' }}
                loading="lazy"
              />
            </span>
          );
        },
        a: ({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) => {
          const isExternal = href?.startsWith('http');
          
          if (isExternal) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          }
          
          return (
            <Link 
              href={href || '#'} 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              {...props}
            >
              {children}
            </Link>
          );
        },
        h1: ({ children, ...props }: ComponentPropsWithoutRef<'h1'>) => (
          <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => (
          <h2 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => (
          <h3 className="text-xl font-bold mt-6 mb-3" {...props}>
            {children}
          </h3>
        ),
        blockquote: ({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4" {...props}>
            {children}
          </blockquote>
        ),
        ul: ({ children, ...props }: ComponentPropsWithoutRef<'ul'>) => (
          <ul className="list-disc list-inside my-4 space-y-2" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }: ComponentPropsWithoutRef<'ol'>) => (
          <ol className="list-decimal list-inside my-4 space-y-2" {...props}>
            {children}
          </ol>
        ),
        table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }: ComponentPropsWithoutRef<'thead'>) => (
          <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
          <td className="px-6 py-4 whitespace-nowrap text-sm" {...props}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </>
  );
}