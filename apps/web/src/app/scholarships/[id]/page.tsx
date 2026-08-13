import { getPublishedScholarshipById } from '@/lib/data/scholarships';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@keyabroad/ui/components/button';
import { Banknote, Building2, MapPin, CalendarClock, Globe } from 'lucide-react';
import { Metadata } from 'next';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const scholarship = await getPublishedScholarshipById(resolvedParams.id);
  
  if (!scholarship) return { title: 'Scholarship Not Found' };

  return {
    title: `${scholarship.name} | KeyAbroad`,
    description: scholarship.description || `Learn about the ${scholarship.name} financial aid opportunity.`,
  };
}

export default async function ScholarshipPage({ params }: PageProps) {
  const resolvedParams = await params;
  const scholarship = await getPublishedScholarshipById(resolvedParams.id);

  if (!scholarship) {
    notFound();
  }

  const uni = Array.isArray(scholarship.universities) ? (scholarship.universities[0] as any) : (scholarship.universities as any);
  const country = Array.isArray(scholarship.countries) ? (scholarship.countries[0] as any) : (scholarship.countries as any);

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <section className="bg-emerald-900 border-b border-emerald-800 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-2 text-sm text-emerald-300/80 mb-6 font-medium">
            <Link href="/scholarships" className="hover:text-emerald-100">Scholarships</Link>
            <span>/</span>
            {uni ? (
              <Link href={`/universities/${uni.slug}`} className="hover:text-emerald-100">
                {uni.name}
              </Link>
            ) : country ? (
              <Link href={`/destinations/${country.slug}`} className="hover:text-emerald-100">
                {country.name}
              </Link>
            ) : (
              <span>Details</span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">{scholarship.name}</h1>
          
          <div className="flex flex-wrap items-center gap-6">
            {scholarship.amount && (
              <div className="flex items-center gap-2 text-2xl font-bold text-emerald-300">
                <Banknote className="h-6 w-6" />
                {scholarship.amount} {scholarship.currency}
              </div>
            )}
            {scholarship.deadline && (
              <div className="flex items-center gap-2 text-emerald-200">
                <CalendarClock className="h-5 w-5" />
                Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column (Details) */}
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">About this Scholarship</h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {scholarship.description || "Detailed eligibility requirements and application instructions for this scholarship are currently being updated. Please speak with a counselor for immediate assistance."}
              </p>
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar CTA) */}
        <div className="md:col-span-1">
          <div className="sticky top-24 flex flex-col gap-6">
            
            {/* Institution Context */}
            {(uni || country) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Applicable For</h3>
                
                {uni && (
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                      {uni.logo_url ? (
                        <img src={uni.logo_url} alt={uni.name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <Building2 className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 block">{uni.name}</span>
                      <Link href={`/universities/${uni.slug}`} className="text-xs text-blue-600 hover:underline">
                        View University &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                {country && (
                  <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                    <div className="h-10 w-10 rounded overflow-hidden shrink-0 mt-1">
                      {country.flag_code ? (
                        <img src={`https://flagcdn.com/w80/${country.flag_code.toLowerCase()}.png`} alt={country.name} className="h-full w-full object-cover" />
                      ) : (
                        <MapPin className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 block">{country.name}</span>
                      <Link href={`/destinations/${country.slug}`} className="text-xs text-blue-600 hover:underline">
                        View Destination &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-slate-900 text-lg">Interested in this funding?</h3>
              <p className="text-sm text-slate-600">
                Speak with a KeyAbroad counselor to verify your eligibility and secure your scholarship.
              </p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">Check Eligibility</Button>
              <Button className="w-full" variant="outline" size="lg">Book Consultation</Button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
