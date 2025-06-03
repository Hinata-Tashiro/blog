'use client';

import dynamic from 'next/dynamic';

const Sidebar = dynamic(
  () => import('./sidebar').then(mod => ({ default: mod.Sidebar })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
    )
  }
);

export { Sidebar };