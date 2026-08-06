"use client";

import { Globe, GraduationCap, Award, ShieldCheck, BookOpen, Mic, PenTool, CheckCircle } from "lucide-react";
import Feature3DCard from "@/components/Feature3DCard";

export default function ServicesPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* Services Section */}
      <section className="pt-32 pb-24 bg-slate-900 relative overflow-hidden flex-grow">
        <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-[300px] -left-[300px] w-[600px] h-[600px] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-6">Premium Services for Ambitious Students</h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">
              From your first consultation to your first day on campus, our expert team provides seamless, end-to-end support tailored specifically to your goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Feature3DCard 
              title="Expert Counselling" 
              description="Personalized guidance to help you choose the perfect career path and the right university to get you there."
              icon={<Globe className="w-8 h-8" />}
            />
            <Feature3DCard 
              title="Admission Strategy" 
              description="We strategically highlight your strengths to craft a compelling application that stands out to admissions officers."
              icon={<GraduationCap className="w-8 h-8" />}
            />
            <Feature3DCard 
              title="University Matching" 
              description="We carefully evaluate your profile to match you with prestigious universities where you are most likely to succeed."
              icon={<Award className="w-8 h-8" />}
            />
            <Feature3DCard 
              title="Visa Assistance" 
              description="We handle the complex paperwork and guide you through the entire visa application process with zero stress."
              icon={<ShieldCheck className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* Language Test Preparation Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Language Excellence</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-6">Master Your Language Tests</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Don't let a language test hold you back. Our intensive preparation programs are designed by experts to help you confidently achieve your required band score on the first try.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Feature3DCard 
              title="IELTS" 
              description="Master Reading, Writing, Listening, and Speaking with our highly structured, result-oriented intensive course."
              icon={<BookOpen className="w-8 h-8" />}
              href="/language-tests"
            />
            <Feature3DCard 
              title="PTE Academic" 
              description="Get expert coaching for this computer-based test, focusing on the real-life academic skills universities demand."
              icon={<Mic className="w-8 h-8" />}
              href="/language-tests"
            />
            <Feature3DCard 
              title="Duolingo" 
              description="Prepare quickly and efficiently for the fast, convenient, and widely accepted Duolingo English Test."
              icon={<PenTool className="w-8 h-8" />}
              href="/language-tests"
            />
            <Feature3DCard 
              title="Other Tests" 
              description="We also offer tailored, one-on-one guidance for the TOEFL, GRE, and GMAT to meet any university requirement."
              icon={<CheckCircle className="w-8 h-8" />}
              href="/language-tests"
            />
          </div>
        </div>
      </section>

    </div>
  );
}
