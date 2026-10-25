import { getPublishedScholarships } from '@/lib/data/scholarships';
import { AdvancedFilters } from '@/components/shared/AdvancedFilters';
import { ScholarshipCard } from '@/components/shared/ScholarshipCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SortControls } from '@/components/shared/SortControls';
import { Button } from '@keyabroad/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Scholarships & Funding | KeyAbroad',
  description: 'Search for scholarships, grants, and financial aid options for international students.',
  alternates: {
    canonical: '/scholarships',
  },
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    country?: string;
    amountMin?: string;
    amountMax?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ScholarshipsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const search = resolvedParams.search || '';
  const country = resolvedParams.country || '';
  const amountMin = resolvedParams.amountMin ? Number(resolvedParams.amountMin) : undefined;
  const amountMax = resolvedParams.amountMax ? Number(resolvedParams.amountMax) : undefined;
  const sort = resolvedParams.sort || 'name-asc';
  const page = parseInt(resolvedParams.page || '1', 10);

  const { scholarships, count, totalPages } = await getPublishedScholarships({
    search,
    country,
    amountMin,
    amountMax,
    sort,
    page,
  });

  const buildPageUrl = (p: number) =>
    `?search=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}&sort=${encodeURIComponent(sort)}&page=${p}`;

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="relative py-24 bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Scholarships & Funding</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Discover financial aid opportunities to fund your global education journey.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <AdvancedFilters type="scholarships" />
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3">
            <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900">
                {count} {count === 1 ? 'Scholarship' : 'Scholarships'} Found
              </h2>
              <SortControls
                options={[
                  { value: 'name-asc', label: 'Name (A–Z)' },
                  { value: 'name-desc', label: 'Name (Z–A)' },
                  { value: 'amount-desc', label: 'Highest Value' },
                  { value: 'amount-asc', label: 'Lowest Value' },
                  { value: 'deadline-asc', label: 'Deadline (Soonest)' },
                ]}
                defaultValue="name-asc"
              />
            </div>

            {scholarships.length === 0 ? (
              <EmptyState
                title={search || country ? 'No scholarships match your filters.' : 'Scholarships are currently being verified.'}
                description={search || country ? 'Try adjusting your keywords or filters.' : 'We are actively reviewing and publishing our scholarship database. Check back soon.'}
                iconType="scholarship"
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scholarships.map((scholarship: any) => (
                    <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-4">
                    {page > 1 ? (
                      <Link href={buildPageUrl(page - 1)}>
                        <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                      </Link>
                    ) : (
                      <Button variant="outline" disabled><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                    )}

                    <span className="text-sm text-slate-600 font-medium">Page {page} of {totalPages}</span>

                    {page < totalPages ? (
                      <Link href={buildPageUrl(page + 1)}>
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
