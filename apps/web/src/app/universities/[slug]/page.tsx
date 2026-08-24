import { getPublishedUniversityBySlug } from '@/lib/data/universities';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Building2, MapPin, Globe, GraduationCap, Banknote, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@keyabroad/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@keyabroad/ui/components/card';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const university = await getPublishedUniversityBySlug(slug);
  
  if (!university) {
    return { title: 'University Not Found' };
  }

  const country = Array.isArray(university.countries)
    ? (university.countries[0] as any)
    : (university.countries as any);

  return {
    title: `${university.name} - Admissions, Fees & Programs 2026 | KeyAbroad`,
    description: `Discover programs, scholarships, and admissions requirements for ${university.name} in ${country?.name}. Apply now for 2026 intakes.`,
    openGraph: {
      title: `${university.name} | Study in ${country?.name}`,
      description: `Explore programs, tuition fees, and scholarships at ${university.name}. Start your application with KeyAbroad.`,
      url: `https://keyabroad.com/universities/${university.slug}`,
      siteName: 'KeyAbroad',
      images: [
        {
          url: university.logo_url || 'https://keyabroad.com/icon.png',
          width: 800,
          height: 600,
          alt: `${university.name} logo`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${university.name} - Study in ${country?.name}`,
      description: `Explore programs and scholarships at ${university.name}.`,
      images: [university.logo_url || 'https://keyabroad.com/icon.png'],
    }
  };
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const university = await getPublishedUniversityBySlug(slug);

  if (!university) {
    notFound();
  }

  // Cast Supabase relation arrays to single objects
  const uniCountry = Array.isArray(university.countries)
    ? (university.countries[0] as any)
    : (university.countries as any);
  const uniPrograms: any[] = Array.isArray(university.programs) ? university.programs : [];
  const uniScholarships: any[] = Array.isArray(university.scholarships) ? university.scholarships : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://keyabroad.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Universities',
            item: 'https://keyabroad.com/universities',
          },
          ...(uniCountry ? [{
            '@type': 'ListItem',
            position: 3,
            name: uniCountry.name,
            item: `https://keyabroad.com/destinations/${uniCountry.slug}`,
          }] : []),
          {
            '@type': 'ListItem',
            position: uniCountry ? 4 : 3,
            name: university.name,
          },
        ],
      },
      {
        '@type': 'EducationalOrganization',
        name: university.name,
        url: `https://keyabroad.com/universities/${university.slug}`,
        logo: university.logo_url || 'https://keyabroad.com/icon.png',
        address: {
          '@type': 'PostalAddress',
          addressCountry: uniCountry?.name || '',
        },
      }
    ]
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="h-32 w-32 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-center overflow-hidden shadow-sm">
              {university.logo_url ? (
                <img src={university.logo_url} alt={`${university.name} logo`} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-16 w-16 text-slate-300" />
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{university.name}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-600">
                {uniCountry && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <Link href={`/destinations/${uniCountry.slug}`} className="hover:text-blue-600 font-medium">
                      {uniCountry.name}
                    </Link>
                  </div>
                )}
                {university.url && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-5 w-5 text-slate-400" />
                    <a href={university.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      Official Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Programs Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Available Programs</h2>
              </div>
              
              {university.programs && university.programs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {university.programs.map((program: any) => (
                    <Link key={program.id} href={`/programs/${university.slug}/${program.slug || program.id}`}>
                      <Card className="h-full hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600">
                            {program.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col gap-2 text-sm text-slate-600 mt-2">
                            {program.degree_level && (
                              <div className="flex items-center gap-1.5 capitalize">
                                <GraduationCap className="h-4 w-4 text-slate-400" />
                                {program.degree_level}
                              </div>
                            )}
                            {program.tuition_fee && (
                              <div className="flex items-center gap-1.5 font-medium text-emerald-600">
                                <Banknote className="h-4 w-4" />
                                {program.tuition_fee} {program.currency}/yr
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                  No programs verified yet. Check back soon.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scholarships</CardTitle>
              </CardHeader>
              <CardContent>
                {university.scholarships && university.scholarships.length > 0 ? (
                  <div className="space-y-4">
                    {university.scholarships.map((scholarship: any) => (
                      <div key={scholarship.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                        <h4 className="font-bold text-slate-900 mb-1">{scholarship.name}</h4>
                        <div className="text-emerald-600 font-medium text-sm mb-2">
                          {scholarship.amount} {scholarship.currency}
                        </div>
                        {scholarship.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                          </div>
                        )}
                        <p className="text-sm text-slate-600 line-clamp-3">{scholarship.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No scholarships currently listed.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-slate-900 mb-2">Interested in {university.name}?</h3>
                <p className="text-slate-600 text-sm mb-6">Connect with our counselors to check your eligibility and start your application.</p>
                <Link href="/eligibility">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Check Eligibility</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>
    </div>
  );
}
