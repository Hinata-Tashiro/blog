'use client';

import dynamic from 'next/dynamic';

const Sidebar = dynamic(
  () => import('./sidebar').then(mod => ({ default: mod.Sidebar })),
  { 
    ssr: false,
    loading: () => (
      <aside className="space-y-4">
        <div className="p-6 rounded-lg border bg-card">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </aside>
    )
  }
);

export { Sidebar };