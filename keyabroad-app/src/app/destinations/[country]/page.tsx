import { getPublishedCountryBySlug } from '@/lib/data/countries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, CheckCircle2, Building2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Metadata } from 'next';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const country = await getPublishedCountryBySlug(resolvedParams.country);
  
  if (!country) return { title: 'Destination Not Found' };

  return {
    title: `Study in ${country.name} | KeyAbroad`,
    description: country.description || `Discover excellent academic opportunities and vibrant culture in ${country.name}.`,
  };
}

export default async function CountryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.country;
  
  const country = await getPublishedCountryBySlug(slug);

  if (!country) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 pb-16">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full bg-[#0a1930] flex items-center">
        {country.image_url && (
          <Image
            src={country.image_url}
            alt={country.name}
            fill
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1930] via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {country.flag_code && (
              <div className="h-16 w-24 md:h-24 md:w-36 rounded-lg overflow-hidden shadow-2xl border-4 border-white/10 shrink-0">
                <Image
                  src={`https://flagcdn.com/w160/${country.flag_code.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  width={144}
                  height={96}
                  className="object-cover h-full w-full"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Study in {country.name}
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                {country.description || `Discover excellent academic opportunities and vibrant culture in ${country.name}.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col lg:flex-row gap-12">
        
        {/* Left Column (Why Choose) */}
        <div className="lg:w-1/3">
          <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
              Why Choose {country.name}?
            </h2>
            
            {country.country_features && country.country_features.length > 0 ? (
              <ul className="space-y-4">
                {country.country_features.map((item: any, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-slate-700">{item.feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">
                A world-class education destination with globally recognized degrees.
              </p>
            )}
            
            <Button size="lg" className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              Check Eligibility
            </Button>
          </div>
        </div>

        {/* Right Column (Universities) */}
        <div className="lg:w-2/3">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Partner Universities</h2>
            <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">
              <Building2 className="h-4 w-4 mr-2" />
              {country.universities?.length || 0} Institutions
            </Badge>
          </div>
          
          {country.universities && country.universities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {country.universities.map((uni: any) => (
                <Link key={uni.id} href={`/universities/${uni.slug}`}>
                  <Card className="h-full transition-colors hover:border-blue-300 hover:bg-blue-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                        {uni.logo_url ? (
                          <img src={uni.logo_url} alt={uni.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <GraduationCap className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">{uni.name}</h3>
                        <p className="text-sm text-slate-500">View Programs &rarr;</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="Universities are being verified"
              description={`We are actively adding our partner institutions in ${country.name}. Check back soon!`}
              iconType="university"
            />
          )}
        </div>

      </section>
    </div>
  );
}
