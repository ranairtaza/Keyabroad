import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import dynamic from 'next/dynamic';
import { ArrowRight, BadgeCheck } from "lucide-react";
import AnimatedHero from "@/components/AnimatedHero";

// Lazy load heavy components that are below the fold to boost mobile FCP/LCP
const DestinationSlider = dynamic(() => import("@/components/DestinationSlider"), { ssr: true });
const ExperienceSection = dynamic(() => import("@/components/ExperienceSection"), { ssr: true });
const EnquiryFormWizard = dynamic(() => import("@/components/EnquiryFormWizard"));
const Reviews = dynamic(() => import("@/components/Reviews"), { ssr: true });

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <AnimatedHero />

      {/* Destination Slider */}
      <DestinationSlider />

      {/* Experience Section */}
      <ExperienceSection />

      {/* Registration Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <span className="text-secondary font-semibold uppercase tracking-wider text-sm mb-2 block">Take the First Step</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Start Your Assessment</h2>
            <p className="text-slate-600 text-lg">Provide your details to our expert counsellors for a personalized roadmap.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="relative z-10 w-full flex flex-col h-full">
              <div className="mb-8 hidden lg:block">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Submit Your Details</h3>
                <p className="text-slate-600">
                  Fill out our comprehensive wizard to let us know your study abroad preferences.
                </p>
              </div>
              <EnquiryFormWizard />
            </div>

            <div className="flex flex-col h-full">
              <div className="mb-8 hidden lg:block">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Or Visit Our Office</h3>
                <p className="text-slate-600">
                  Come by our Faisalabad branch to speak with our educational experts in person.
                </p>
              </div>
              
              {/* Map Embed */}
              <div className="flex-grow w-full min-h-[400px] lg:min-h-[600px] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200">
                <iframe 
                  src="https://maps.google.com/maps?q=KeyAbroad,+Canal+Road,+Faisalabad&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="KeyAbroad Office Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICEF Certificate Section */}
      <section className="py-20 bg-slate-50 flex flex-col items-center justify-center text-center relative z-10 border-t border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-10 flex flex-wrap items-center justify-center gap-2 md:gap-3 leading-tight">
            <span>
              KeyAbroad Recognized <br className="hidden md:block" />
              with Esteemed ICEF Agency Status
            </span>
            <BadgeCheck className="text-blue-500 w-8 h-8 md:w-10 md:h-10 shrink-0 inline-block fill-blue-50 -mt-2" />
          </h2>
          
          <div className="flex justify-center mb-16 md:mb-24 transform scale-125 md:scale-150 origin-top">
            <a href="https://accreditations.icef.com/certificate?id=8ec6706d-0b31-450a-b41c-5d0916227cf3" target="_blank" rel="noopener noreferrer">
              <div className="relative h-[120px] w-[300px] cursor-pointer drop-shadow-md hover:drop-shadow-xl transition-all">
                <Image 
                  src="https://icef-api-production.s3.eu-central-1.amazonaws.com/ias_material/001bG0000051BucQAE_badge.png" 
                  alt="ICEF Agency Status" 
                  fill
                  className="object-contain"
                  unoptimized={false}
                />
              </div>
            </a>
          </div>

          <p className="text-slate-500 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-medium mb-10">
            Recognized globally as a hallmark of excellence and superior professional standards, the ICEF 
            Agency Status (IAS) awarded to KeyAbroad is a testament to our <br className="hidden md:block" />
            dedication, approach and position within the international education industry.
          </p>

          {/* ICEF Logo Representation */}
          <div className="flex items-center justify-center gap-2">
            <div className="grid grid-cols-2 gap-1 text-[#5babb2]">
              <div className="w-4 h-4 bg-current rounded-tl-full"></div>
              <div className="w-4 h-4 bg-current rounded-tr-full"></div>
              <div className="w-4 h-4 bg-current rounded-bl-full"></div>
              <div className="w-4 h-4 bg-current rounded-br-full"></div>
            </div>
            <span className="text-3xl font-semibold text-[#183253] tracking-tighter">icef</span>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews />

      {/* Contact Banner */}
      <section id="contact" className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start your journey?</h2>
          <p className="text-blue-100 text-lg mb-10">
            Get in touch with our expert counsellors today and take the first step towards your international education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a href="https://wa.me/923217777897" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-slate-50 transition-colors shadow-lg flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              Chat on WhatsApp
            </a>
            <a href="mailto:admissions@keyabroad.com" className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-colors border-2 border-white/20">
              Email Admissions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
