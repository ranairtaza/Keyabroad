import { getPublishedUniversities } from '@/lib/data/universities';
import { AdvancedFilters } from '@/components/shared/AdvancedFilters';
import { UniversityCard } from '@/components/shared/UniversityCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SortControls } from '@/components/shared/SortControls';
import { Button } from '@keyabroad/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Partner Universities | KeyAbroad',
  description: 'Search and browse our global network of verified partner universities.',
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    country?: string;
    city?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function UniversitiesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  const search = resolvedParams.search || '';
  const country = resolvedParams.country || '';
  const city = resolvedParams.city || '';
  const page = parseInt(resolvedParams.page || '1', 10);
  const sort = resolvedParams.sort || 'name-asc';

  const { universities, count, totalPages } = await getPublishedUniversities({
    search,
    country,
    city,
    page,
    sort,
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="relative py-24 bg-[#0a1930] overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Partner Universities</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Browse our global network of esteemed educational institutions.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <AdvancedFilters type="universities" />
          </div>
          
          {/* Results Area */}
          <div className="lg:col-span-3">
            <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900">
                {count} {count === 1 ? 'University' : 'Universities'} Found
              </h2>
              <SortControls
                options={[
                  { value: 'name-asc', label: 'Name (A–Z)' },
                  { value: 'name-desc', label: 'Name (Z–A)' },
                  { value: 'ranking-asc', label: 'Best Ranked' },
                ]}
                defaultValue="name-asc"
              />
            </div>

            {universities.length === 0 ? (
              <EmptyState 
                title={search || country || city ? "No universities match your filters." : "Universities are currently being verified."}
                description={search || country || city ? "Try adjusting your keywords or location." : "We are actively reviewing and publishing our partner directory. Check back soon."}
                iconType="university"
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {universities.map((uni: any) => (
                    <UniversityCard key={uni.id} university={uni} />
                  ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-4">
                    {page > 1 ? (
                      <Link href={`?search=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}&page=${page - 1}`}>
                        <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                      </Link>
                    ) : (
                      <Button variant="outline" disabled><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                    )}
                    
                    <span className="text-sm text-slate-600 font-medium">Page {page} of {totalPages}</span>
                    
                    {page < totalPages ? (
                      <Link href={`?search=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}&page=${page + 1}`}>
                        <Button variant="outline">Next <ChevronRight className="h-4 w-4 ml-2" /></Button>
                      </Link>
                    ) : (
                      <Button variant="outline" disabled>Next <ChevronRight className="h-4 w-4 ml-2" /></Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
