import { getPublishedPrograms } from '@/lib/data/programs';
import { AdvancedFilters } from '@/components/shared/AdvancedFilters';
import { ProgramCard } from '@/components/shared/ProgramCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SortControls } from '@/components/shared/SortControls';
import { Button } from '@keyabroad/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const hasFilters = Object.keys(resolvedParams).filter(k => k !== 'page' && resolvedParams[k as keyof typeof resolvedParams]).length > 0;

  return {
    title: 'Find Programs | KeyAbroad',
    description: 'Search and compare university programs from our global network of verified institutions.',
    alternates: {
      canonical: '/programs',
    },
    robots: {
      index: !hasFilters,
      follow: true,
    }
  };
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    country?: string;
    degree?: string;
    tuitionMax?: string;
    ielts?: string;
    pte?: string;
    intake?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function ProgramsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  const search = resolvedParams.search || '';
  const country = resolvedParams.country || '';
  const degree = resolvedParams.degree || '';
  const tuitionMax = resolvedParams.tuitionMax || '';
  const ielts = resolvedParams.ielts || '';
  const pte = resolvedParams.pte || '';
  const intake = resolvedParams.intake || '';
  const page = parseInt(resolvedParams.page || '1', 10);
  const sort = resolvedParams.sort || 'name-asc';

  const { programs, count, totalPages } = await getPublishedPrograms({
    search,
    country,
    degree,
    tuitionMax: tuitionMax ? Number(tuitionMax) : undefined,
    ielts: ielts ? Number(ielts) : undefined,
    pte: pte ? Number(pte) : undefined,
    intake,
    page,
    sort,
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="relative py-24 bg-[#0a1930] overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Find Your Program</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Explore thousands of degrees and courses to launch your global career.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <AdvancedFilters type="programs" />
          </div>
          
          {/* Results Area */}
          <div className="lg:col-span-3">
            <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900">
                {count} {count === 1 ? 'Program' : 'Programs'} Found
              </h2>
              <SortControls
                options={[
                  { value: 'name-asc', label: 'Name (A–Z)' },
                  { value: 'name-desc', label: 'Name (Z–A)' },
                  { value: 'tuition-asc', label: 'Lowest Tuition' },
                  { value: 'tuition-desc', label: 'Highest Tuition' },
                ]}
                defaultValue="name-asc"
              />
            </div>

            {programs.length === 0 ? (
              <EmptyState 
                title={search || country || degree ? "No programs match your filters." : "Programs are currently being verified."}
                description={search || country || degree ? "Try adjusting your keywords or filters." : "We are actively reviewing and publishing our course catalog. Check back soon."}
                iconType="program"
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {programs.map((program: any) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-4">
                    {page > 1 ? (
                      <Link href={`?search=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}&degree=${encodeURIComponent(degree)}&tuitionMax=${encodeURIComponent(tuitionMax)}&page=${page - 1}`}>
                        <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                      </Link>
                    ) : (
                      <Button variant="outline" disabled><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                    )}
                    
                    <span className="text-sm text-slate-600 font-medium">Page {page} of {totalPages}</span>
                    
                    {page < totalPages ? (
                      <Link href={`?search=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}&degree=${encodeURIComponent(degree)}&tuitionMax=${encodeURIComponent(tuitionMax)}&page=${page + 1}`}>
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
