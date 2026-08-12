"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortControlsProps {
  options: SortOption[];
  defaultValue?: string;
}

export function SortControls({ options, defaultValue = '' }: SortControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentSort = searchParams.get('sort') || defaultValue;

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    params.delete('page');
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />
      <select
        className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-colors hover:border-slate-300"
        value={currentSort}
        onChange={(e) => handleSort(e.target.value)}
        disabled={isPending}
        aria-label="Sort results"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
