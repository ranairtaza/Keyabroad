import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, MapPin, CheckCircle2, BookOpen } from "lucide-react";
import { destinations } from "@/data/destinations";

import fs from 'fs';
import path from 'path';

export default async function DestinationPage({ params }: { params: Promise<{ country: string }> }) {
  const resolvedParams = await params;
  const destination = destinations.find(d => d.id === resolvedParams.country);

  if (!destination) {
    notFound();
  }

  // Check if custom waving flag exists
  let flagImgName = `${destination.id}-waving-flag.png`;
  if (destination.id === 'new-zealand' || destination.id === 'turkey') {
    flagImgName = `${destination.id}-transparent.png`;
  }
  
  const publicDir = path.join(process.cwd(), 'public', 'destinations');
  const hasCustomFlag = fs.existsSync(path.join(publicDir, flagImgName));

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">
      {/* Banner */}
      <div className="relative w-full h-[450px] md:h-[550px] bg-slate-900">
        <Image
          src={destination.image}
          alt={`Study in ${destination.name}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/#destinations" className="inline-flex items-center text-white/80 hover:text-white mb-6 w-fit transition-colors">
            <ArrowLeft className="mr-2" size={20} />
            Back to Destinations
          </Link>
          <div className="flex items-center text-primary mb-4">
            <MapPin className="mr-2" />
            <span className="font-semibold uppercase tracking-wider">Destination Guide</span>
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-20">
            {destination.flagCode && (
              <img 
                src={`https://flagcdn.com/w80/${destination.flagCode.toLowerCase()}.png`} 
                srcSet={`https://flagcdn.com/w160/${destination.flagCode.toLowerCase()}.png 2x`}
                width="64" 
                alt={`${destination.name} flag`}
                className="rounded-md shadow-lg"
              />
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Study in {destination.name}
            </h1>
          </div>
        </div>

        {/* Waving Flag or Fallback */}
        <div className={`absolute top-0 left-0 w-[250px] h-[180px] md:w-[450px] md:h-[350px] opacity-90 z-0 pointer-events-none drop-shadow-2xl ${destination.wavingFlagStyle || ''}`}>
          {hasCustomFlag ? (
            <img 
              src={`/destinations/${flagImgName}`}
              alt={`${destination.name} waving flag`}
              className="w-full h-full object-contain object-left-top"
            />
          ) : (
            destination.flagCode && (
              <div className="w-[120px] h-[80px] md:w-[200px] md:h-[130px] opacity-60">
                <img 
                  src={`https://flagcdn.com/w320/${destination.flagCode.toLowerCase()}.png`}
                  alt={`${destination.name} corner flag`}
                  className="w-full h-full object-cover rounded-br-[40px] shadow-[10px_10px_30px_rgba(0,0,0,0.5)] border-b-2 border-r-2 border-white/20"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
                About Studying in {destination.name}
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                {destination.about}
              </p>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                <GraduationCap className="text-primary mr-3" size={28} />
                <h2 className="text-2xl font-bold text-slate-900">
                  Top Universities in {destination.name}
                </h2>
              </div>
              <ul className="grid sm:grid-cols-2 gap-4">
                {destination.universities.map((uni, idx) => (
                  <li key={idx} className="flex items-start p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary/30 transition-colors group">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <a href={uni.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 mt-1 hover:text-primary transition-colors flex items-center gap-1">
                      {uni.name}
                      {uni.url !== "#" && (
                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                <BookOpen className="text-primary mr-3" size={28} />
                <h2 className="text-2xl font-bold text-slate-900">
                  Available Courses
                </h2>
              </div>
              <ul className="flex flex-wrap gap-3">
                {destination.courses?.map((course, idx) => (
                  <li key={idx} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full font-medium text-sm">
                    {course}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                <CheckCircle2 className="text-primary mr-3" size={28} />
                <h2 className="text-2xl font-bold text-slate-900">
                  Why choose {destination.name}?
                </h2>
              </div>
              <ul className="space-y-4">
                {destination.whyChoose?.map((reason, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="text-green-500 mr-3 shrink-0 mt-0.5" size={20} />
                    <span className="text-slate-700 font-medium">{reason}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Why Choose KeyAbroad Section */}
            <section className="bg-primary/5 p-8 rounded-2xl shadow-sm border border-primary/20">
              <div className="flex items-center mb-6 border-b border-primary/20 pb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Why apply through KeyAbroad?
                </h2>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed font-medium">
                We don't just process applications; we craft success stories. Choosing KeyAbroad means having a dedicated team of experts holding your hand from the first consultation to your first day on campus.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3 shadow-sm">
                  <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="block text-slate-800 text-sm mb-1">High Visa Success Rate</strong>
                    <span className="text-slate-500 text-xs">Our meticulous process ensures maximum approval chances.</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3 shadow-sm">
                  <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="block text-slate-800 text-sm mb-1">Direct University Tie-ups</strong>
                    <span className="text-slate-500 text-xs">We hold official partnerships with top institutions.</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3 shadow-sm">
                  <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="block text-slate-800 text-sm mb-1">Scholarship Assistance</strong>
                    <span className="text-slate-500 text-xs">We help you secure partial to full scholarships.</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3 shadow-sm">
                  <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="block text-slate-800 text-sm mb-1">End-to-End Support</strong>
                    <span className="text-slate-500 text-xs">From IELTS prep to post-arrival assistance.</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-primary text-white p-8 rounded-2xl shadow-lg text-center sticky top-28">
              <h3 className="text-2xl font-bold mb-4">Start Your Application</h3>
              <p className="text-blue-100 mb-8">
                Ready to study in {destination.name}? Our expert counselors will guide you through the entire process.
              </p>
              <Link
                href="/#contact"
                className="inline-block w-full py-4 bg-white text-primary font-bold rounded-full hover:bg-slate-50 transition-colors shadow-md"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
