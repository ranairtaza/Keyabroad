"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import { Button } from '@keyabroad/ui/components/button';
import { Input } from '@keyabroad/ui/components/input';
import { Label } from '@keyabroad/ui/components/label';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface AdvancedFiltersProps {
  type: 'universities' | 'programs' | 'scholarships';
}

export function AdvancedFilters({ type }: AdvancedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Local state for filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    country: searchParams.get('country') || '',
    city: searchParams.get('city') || '',
    degree: searchParams.get('degree') || '',
    field: searchParams.get('field') || '',
    tuitionMax: searchParams.get('tuitionMax') || '',
    ielts: searchParams.get('ielts') || '',
    pte: searchParams.get('pte') || '',
    intake: searchParams.get('intake') || '',
    amountMin: searchParams.get('amountMin') || '',
    amountMax: searchParams.get('amountMax') || '',
  });

  // Sync state if URL changes
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      country: searchParams.get('country') || '',
      city: searchParams.get('city') || '',
      degree: searchParams.get('degree') || '',
      field: searchParams.get('field') || '',
      tuitionMax: searchParams.get('tuitionMax') || '',
      ielts: searchParams.get('ielts') || '',
      pte: searchParams.get('pte') || '',
      intake: searchParams.get('intake') || '',
      amountMin: searchParams.get('amountMin') || '',
      amountMax: searchParams.get('amountMax') || '',
    });
  }, [searchParams]);

  const updateFilters = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    params.delete('page'); // Reset to page 1

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push('?');
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </h3>
        {Array.from(searchParams.keys()).length > 0 && (
          <button onClick={clearFilters} className="text-sm text-red-600 hover:underline flex items-center gap-1">
            <X className="h-4 w-4" /> Clear All
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Keyword Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="e.g. Oxford, Business..." 
              className="pl-9"
              value={filters.search}
              onChange={(e) => updateFilters('search', e.target.value)}
            />
          </div>
        </div>

        {/* Location Filters */}
        {(type === 'universities' || type === 'programs') && (
          <div className="space-y-2">
            <Label>Country</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.country}
              onChange={(e) => updateFilters('country', e.target.value)}
            >
              <option value="">Any Country</option>
              <option value="united-kingdom">United Kingdom</option>
              <option value="usa">United States</option>
              <option value="australia">Australia</option>
              <option value="canada">Canada</option>
            </select>
          </div>
        )}

        {/* Program Specific Filters */}
        {type === 'programs' && (
          <>
            <div className="space-y-2">
              <Label>Degree Level</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.degree}
                onChange={(e) => updateFilters('degree', e.target.value)}
              >
                <option value="">Any Level</option>
                <option value="bachelors">Bachelors</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Max Tuition Fee ($/yr)</Label>
              <Input 
                type="number"
                placeholder="e.g. 20000"
                value={filters.tuitionMax}
                onChange={(e) => updateFilters('tuitionMax', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min IELTS</Label>
                <Input 
                  type="number" step="0.5" placeholder="6.0"
                  value={filters.ielts}
                  onChange={(e) => updateFilters('ielts', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Min PTE</Label>
                <Input 
                  type="number" placeholder="58"
                  value={filters.pte}
                  onChange={(e) => updateFilters('pte', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Intake Month</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.intake}
                onChange={(e) => updateFilters('intake', e.target.value)}
              >
                <option value="">Any Intake</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="September">September</option>
                <option value="October">October</option>
              </select>
            </div>
          </>
        )}

        {/* Scholarship Specific Filters */}
        {type === 'scholarships' && (
          <>
            <div className="space-y-2">
              <Label>Country</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.country}
                onChange={(e) => updateFilters('country', e.target.value)}
              >
                <option value="">Any Country</option>
                <option value="united-kingdom">United Kingdom</option>
                <option value="usa">United States</option>
                <option value="australia">Australia</option>
                <option value="canada">Canada</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={filters.amountMin}
                  onChange={(e) => updateFilters('amountMin', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={filters.amountMax}
                  onChange={(e) => updateFilters('amountMax', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
          onClick={applyFilters}
          disabled={isPending}
        >
          {isPending ? 'Applying...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
}
