"use client";

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';

export function ServerSearchBar({ initialSearch = '' }: { initialSearch?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Sync state if URL changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Debounced navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm === (searchParams.get('search') || '')) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      params.delete('page'); // Reset to page 1 on search

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, router]);

  return (
    <div className="relative w-full max-w-md">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isPending ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
      <input
        type="text"
        placeholder="Search universities..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
      />
    </div>
  );
}
