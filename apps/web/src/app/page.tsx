import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ArrowRight, Globe2, GraduationCap, Search, Building2, MapPin, CheckCircle2, ChevronRight, Calculator, Sparkles } from "lucide-react";
import { Button } from "@keyabroad/ui/components/button";
import { Input } from "@keyabroad/ui/components/input";
import { Badge } from "@keyabroad/ui/components/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@keyabroad/ui/components/card";
import dynamic from 'next/dynamic';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';

const DestinationSlider = dynamic(() => import("@/components/DestinationSlider"), { ssr: true });
const Reviews = dynamic(() => import("@/components/Reviews"), { ssr: true });

import { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* 1. HERO SECTION & AI CTA */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-24 pb-32 lg:pt-36 lg:pb-40">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070" 
            alt="University campus" 
            fill 
            sizes="100vw"
            quality={60}
            className="object-cover"
            priority
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center max-w-5xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading mb-6 tracking-tight">
            Your Global Future <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Starts Here</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            KeyAbroad is your premium partner for studying in the UK, USA, Australia, and Canada. 
            From university shortlisting to visa success, we manage it all.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/25" asChild>
              <Link href="/eligibility">
                Check Eligibility <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-white/5 border-white/20 hover:bg-white/10 text-white" asChild>
              <Link href="/ai-advisor">
                <Sparkles className="mr-2 w-5 h-5 text-blue-400" /> Consult AI Advisor
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. UNIVERSITY SEARCH */}
      <section className="relative z-20 -mt-12 container mx-auto px-4">
        <Card className="shadow-2xl border-0 ring-1 ring-slate-200 p-2 md:p-4 bg-white/95 backdrop-blur rounded-2xl max-w-4xl mx-auto">
          <form action="/universities" method="GET" className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                name="search"
                placeholder="Search universities or programs..." 
                className="pl-12 h-14 text-lg bg-slate-50 border-transparent focus-visible:ring-primary/20 rounded-xl"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-xl shrink-0">Search</Button>
          </form>
        </Card>
      </section>

      {/* 3. VERIFIED STATISTICS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            {[
              { label: "Visa Success Rate", value: 98, suffix: "%" },
              { label: "Major Universities", value: 100, suffix: "+" },
              { label: "Students Placed", value: 5000, suffix: "+" },
              { label: "Scholarships Secured", value: 5, prefix: "$", suffix: "M+" },
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 font-heading">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.5 ACCREDITATIONS */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase mb-8">Globally Recognized & Accredited</p>
            <div className="flex justify-center items-center opacity-80 hover:opacity-100 transition-opacity min-h-[160px]">
              <Link href="https://www.icef.com/agency/6902" target="_blank" rel="noopener noreferrer">
                <Image 
                  src="https://icef-api-production.s3.eu-central-1.amazonaws.com/ias_material/001bG0000051BucQAE_badge.png"
                  alt="ICEF Accredited Agency"
                  width={120}
                  height={141}
                  className="w-[120px] h-auto"
                />
              </Link>
            </div>
        </div>
      </section>

      {/* 4. DESTINATIONS */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 mb-4">Top Study Destinations</h2>
              <p className="text-slate-600 text-lg max-w-2xl">Explore opportunities in the world's most prestigious education hubs.</p>
            </div>
            <Button variant="ghost" className="hidden md:flex" asChild>
              <Link href="/destinations">View All <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
          <DestinationSlider />
        </div>
      </section>

      {/* 5. WHY KEYABROAD / APPLICATION PROCESS */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">The KeyAbroad Advantage</Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 mb-6 leading-tight">
                A seamless journey from application to arrival.
              </h2>
              <div className="space-y-8 mt-10">
                {[
                  { title: "Profile Evaluation", desc: "Our AI and human experts analyze your academic history to find the perfect match." },
                  { title: "Application Processing", desc: "We handle the complex paperwork, SOPs, and university communications." },
                  { title: "Visa & Pre-Departure", desc: "Dedicated visa officers ensure your application is flawless, followed by travel support." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-lg">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-400/20 rounded-[3rem] transform rotate-3" />
              <Image 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
                alt="Students studying"
                width={600}
                height={700}
                quality={60}
                sizes="(max-width: 768px) 100vw, 600px"
                className="rounded-[3rem] relative z-10 object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. UTILITIES (Calculator, IELTS) */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-slate-800 border-slate-700 text-white p-6 md:p-8">
              <Calculator className="w-12 h-12 text-blue-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4 font-heading">Cost Calculator</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Estimate your tuition, living expenses, and potential scholarships in less than a minute.
              </p>
              <Button variant="secondary" className="w-full sm:w-auto" asChild>
                <Link href="/cost-calculator">Calculate Costs</Link>
              </Button>
            </Card>
            <Card className="bg-slate-800 border-slate-700 text-white p-6 md:p-8">
              <GraduationCap className="w-12 h-12 text-emerald-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4 font-heading">Test Preparation</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join our certified IELTS and PTE preparation classes to achieve your desired band score.
              </p>
              <Button variant="secondary" className="w-full sm:w-auto" asChild>
                <Link href="/ielts">Explore Classes</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. REVIEWS */}
      <Reviews />

      {/* 8. FINAL CTA */}
      <section className="py-32 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-6">
            Ready to study abroad?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Book a free consultation with our expert counselors or chat with us on WhatsApp for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full" asChild>
              <Link href="/contact">Book Consultation</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20" asChild>
              <a href="https://wa.me/923217777897" target="_blank" rel="noopener noreferrer">
                Talk on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
