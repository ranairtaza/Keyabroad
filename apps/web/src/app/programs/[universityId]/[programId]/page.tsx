import { getPublishedProgramById } from '@/lib/data/programs';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Building2, MapPin, GraduationCap, Banknote, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@keyabroad/ui/components/button';
import { Card, CardContent } from '@keyabroad/ui/components/card';
import { Badge } from '@keyabroad/ui/components/badge';

interface PageProps {
  params: Promise<{
    universityId: string;
    programId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { universityId, programId } = await params;
  const program = await getPublishedProgramById(programId);
  
  if (!program) {
    return { title: 'Program Not Found' };
  }

  const uni = Array.isArray(program.universities)
    ? (program.universities[0] as any)
    : (program.universities as any);

  if (uni?.id !== universityId) {
    return { title: 'Program Not Found' };
  }

  return {
    alternates: {
      canonical: `/programs/${universityId}/${program.id}`,
    },
    title: `${program.name} at ${uni?.name} - Admissions 2026 | KeyAbroad`,
    description: `Get full details on the ${program.name} at ${uni?.name}. View tuition fees (${program.tuition_fee} ${program.currency}), duration, and start your application today.`,
    openGraph: {
      title: `${program.name} at ${uni?.name}`,
      description: `Study ${program.name} at ${uni?.name}. View requirements, fees, and apply through KeyAbroad.`,
      url: `https://keyabroad.com/programs/${universityId}/${programId}`,
      siteName: 'KeyAbroad',
      images: [
        {
          url: uni?.logo_url || 'https://keyabroad.com/icon.png',
          width: 800,
          height: 600,
          alt: `${program.name} at ${uni?.name}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${program.name} at ${uni?.name}`,
      description: `Study ${program.name} at ${uni?.name}.`,
      images: [uni?.logo_url || 'https://keyabroad.com/icon.png'],
    }
  };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { universityId, programId } = await params;
  const program = await getPublishedProgramById(programId);

  if (!program) {
    notFound();
  }

  const uni = Array.isArray(program.universities) 
    ? (program.universities[0] as any) 
    : (program.universities as any);

  if (uni?.id !== universityId) {
    notFound();
  }

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
          ...(uni ? [{
            '@type': 'ListItem',
            position: 3,
            name: uni.name,
            item: `https://keyabroad.com/universities/${uni.id}`,
          }] : []),
          {
            '@type': 'ListItem',
            position: uni ? 4 : 3,
            name: program.name,
          },
        ],
      },
      {
        '@type': 'Course',
        name: program.name,
        description: `Study ${program.name} at ${uni?.name}.`,
        provider: {
          '@type': 'EducationalOrganization',
          name: uni?.name,
          sameAs: uni?.url || `https://keyabroad.com/universities/${uni?.id}`,
        },
        hasCourseInstance: [
          {
            '@type': 'CourseInstance',
            courseMode: 'Onsite',
            duration: program.duration || 'P1Y',
          }
        ]
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
      <section className="bg-[#0a1930] text-white pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-6 flex flex-wrap gap-2">
            {program.degree_level && (
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none capitalize">
                {program.degree_level}
              </Badge>
            )}
            {uni?.countries && (
              <Badge variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700">
                <MapPin className="w-3 h-3 mr-1" />
                {uni.countries.name}
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {program.name}
          </h1>
          
          {uni && (
            <div className="flex items-center gap-4 text-slate-300">
              {uni.logo_url && (
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1 shrink-0">
                  <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <div className="text-lg font-medium text-white">{uni.name}</div>
                <Link href={`/universities/${uni.id}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1">
                  View University <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Key Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-slate-500 font-medium mb-1">Duration</div>
                  <div className="text-lg font-bold text-slate-900">{program.duration || 'Varies'}</div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-slate-500 font-medium mb-1">Tuition Fee (Per Year)</div>
                  <div className="text-lg font-bold text-slate-900">
                    {program.tuition_fee ? `${program.tuition_fee} ${program.currency}` : 'Contact Us'}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-slate-500 font-medium mb-1">Degree Level</div>
                  <div className="text-lg font-bold text-slate-900 capitalize">{program.degree_level || 'N/A'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Placeholder for future detailed requirements like IELTS/PTE from DB */}
            <Card className="shadow-sm mt-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Program Requirements</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600">
                    Detailed requirements including IELTS, PTE, and academic scores are currently being synced with the university database. 
                    Please use the Eligibility Engine to see if your current profile matches this program's requirements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar CTA */}
          <div className="space-y-6">
            <Card className="shadow-lg border-blue-100 sticky top-24">
              <CardContent className="p-8 text-center bg-gradient-to-b from-blue-50 to-white">
                <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Apply for this Program</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Ready to take the next step? Our expert counselors will guide you through the application and visa process.
                </p>
                
                <div className="space-y-3">
                  <Link href="/eligibility" className="block w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">
                      Check My Eligibility
                    </Button>
                  </Link>
                  <Link href="/contact" className="block w-full">
                    <Button variant="outline" className="w-full py-6">
                      Talk to an Expert
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>
    </div>
  );
}
