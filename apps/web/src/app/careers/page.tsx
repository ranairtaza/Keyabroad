import { Metadata } from 'next';
import { Button } from '@keyabroad/ui/components/button';
import { Card, CardContent } from '@keyabroad/ui/components/card';
import { Briefcase, Globe, Heart, Rocket, Target, Users, Mail, MapPin, Building } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';
import { createClient } from '@keyabroad/auth/server';

export const metadata: Metadata = {
  title: 'Careers | KeyAbroad',
  description: 'Join KeyAbroad and build the future of global education. Explore our open positions and career opportunities.',
};

export default async function CareersPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase.from('jobs').select('*').eq('status', 'published').order('created_at', { ascending: false });

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 pb-16">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#0a1930] overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Build the Future of Global Education
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            At KeyAbroad, we help students discover international education opportunities and build technology to connect the world.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold" asChild>
              <a href="#open-positions">View Open Positions</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white" asChild>
              <a href="#why-keyabroad">Why KeyAbroad?</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Why KeyAbroad Section */}
      <section id="why-keyabroad" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Work With Us?</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We are a mission-driven team dedicated to making global education accessible. Here is what makes KeyAbroad a great place to work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                <Target size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Meaningful Impact</h3>
              <p className="text-slate-600">
                Every line of code you write and every student you help directly changes lives by opening doors to international education.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-success">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Global Opportunities</h3>
              <p className="text-slate-600">
                Work with international universities, diverse teams, and a truly global student base every single day.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                <Rocket size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Technology & Innovation</h3>
              <p className="text-slate-600">
                We build cutting-edge platforms using modern tech stacks to streamline the complex study-abroad process.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Culture</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                At KeyAbroad, our culture is defined by our core principles. We believe in taking ownership, communicating clearly, and always putting the student first. 
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success">
                    <Heart size={16} />
                  </div>
                  <span className="text-slate-800 font-medium">Student First Approach</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Users size={16} />
                  </div>
                  <span className="text-slate-800 font-medium">Collaborative Environment</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                    <Briefcase size={16} />
                  </div>
                  <span className="text-slate-800 font-medium">Own the Outcome</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 bg-slate-100 rounded-3xl h-80 flex items-center justify-center border border-slate-200 p-8 text-center">
              <p className="text-2xl font-semibold text-slate-400 italic">"We are building a team of passionate problem solvers."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="open-positions" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Open Positions</h2>
          <p className="text-lg text-slate-600">
            Explore our current vacancies across all departments.
          </p>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12">
            <EmptyState 
              title="No open positions right now"
              description="We are not actively hiring at this moment, but we are always looking for great talent. Send us your CV and tell us where you think you can contribute!"
              iconType="university"
            />
            <div className="mt-8 flex justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-md" asChild>
                <a href="mailto:careers@keyabroad.com">
                  <Mail className="mr-2 h-4 w-4" /> Send us your CV
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <Card key={job.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-slate-600 mb-4">
                      <div className="flex items-center gap-1.5"><Building size={16}/> {job.department}</div>
                      <div className="flex items-center gap-1.5"><MapPin size={16}/> {job.location}</div>
                      <div className="flex items-center gap-1.5"><Briefcase size={16}/> {job.employment_type}</div>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-md w-full md:w-auto" asChild>
                      <a href={`mailto:careers@keyabroad.com?subject=Application for ${encodeURIComponent(job.title)}`}>
                        Apply Now <Mail className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Can I submit a general application?</h3>
              <p className="text-slate-600">Yes! If you don't see a role that fits your profile, you can always send your resume to our careers email address. We review all applications and will keep you in mind for future openings.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Are remote opportunities available?</h3>
              <p className="text-slate-600">Depending on the position, we do offer flexible and remote working arrangements. Check the specific job description for location requirements when positions are posted.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Can students or interns apply?</h3>
              <p className="text-slate-600">Absolutely. We occasionally offer internship programs in our engineering, marketing, and student success departments.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
