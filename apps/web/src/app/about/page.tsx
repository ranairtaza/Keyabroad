"use client";

import { Award, ShieldCheck, Globe } from "lucide-react";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import ExperienceSection from "@/components/ExperienceSection";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Header Banner */}
      <section className="relative py-32 bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            We Don't Just Process Visas.<br className="hidden md:block" /> We Launch Futures.
          </h1>
          <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto leading-relaxed">
            For over 15 years, we've been the bridge between ambitious students in Pakistan and the world's most prestigious universities.
          </p>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose-lg md:prose-xl text-center md:text-left mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 leading-snug">
              It started with a simple belief: <br className="hidden md:block" />
              <span className="text-primary">Talent is everywhere, but opportunity is not.</span>
            </h2>

            <p className="text-slate-600 leading-relaxed mb-8">
              Back in 2014, we saw brilliant, hardworking students giving up on their study abroad dreams—not because they weren't capable, but because the process was a maze. The industry was full of agencies treating students like numbers on a spreadsheet, handing out generic advice, and hiding behind confusing fees.
            </p>

            <p className="text-slate-600 leading-relaxed mb-8">
              We knew there had to be a better way. We built <strong>KeyAbroad</strong> to be the mentor we wish we had. We don't just hand you a checklist of documents. We sit down with you, understand your specific career ambitions, your financial realities, and what you actually want out of life.
            </p>

            <div className="my-14 p-10 bg-slate-50 border-l-4 border-primary rounded-r-3xl shadow-sm">
              <p className="text-2xl italic text-slate-800 font-medium leading-relaxed">
                "When you walk into our office, you aren't just an applicant. You are a future global leader, and our job is to make sure your university application reflects exactly that."
              </p>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">
              Today, with official partnerships across the UK, Europe, North America, and Australia, we've helped thousands of students step off a plane in a new country, ready to change their lives. We've prepped them for daunting visa interviews, celebrated their massive scholarship wins, and guided them when the paperwork felt overwhelming.
            </p>

            <p className="text-slate-600 leading-relaxed font-medium text-xl">
              If you have the drive to succeed on a global stage, we have the exact map to get you there. Let's write the next chapter of your story, together.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Expert Guidance with Genuine Care</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Hover3DWrapper>
              <div className="h-full p-8 rounded-2xl bg-white border border-slate-100 shadow-md flex flex-col items-start" style={{ transform: "translateZ(30px)" }}>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary" style={{ transform: "translateZ(20px)" }}>
                  <Award size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ transform: "translateZ(15px)" }}>Experience that Matters</h3>
                <p className="text-slate-600 leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  Navigating international university applications can be overwhelming. Our experienced team breaks down the complexities so you can focus on your future.
                </p>
              </div>
            </Hover3DWrapper>

            <Hover3DWrapper>
              <div className="h-full p-8 rounded-2xl bg-white border border-slate-100 shadow-md flex flex-col items-start" style={{ transform: "translateZ(30px)" }}>
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6 text-secondary" style={{ transform: "translateZ(20px)" }}>
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ transform: "translateZ(15px)" }}>Certified Consultants</h3>
                <p className="text-slate-600 leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  We hold ourselves to the highest international standards. You can trust our team to provide honest, transparent advice with your best interests at heart.
                </p>
              </div>
            </Hover3DWrapper>

            <Hover3DWrapper>
              <div className="h-full p-8 rounded-2xl bg-white border border-slate-100 shadow-md flex flex-col items-start" style={{ transform: "translateZ(30px)" }}>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600" style={{ transform: "translateZ(20px)" }}>
                  <Globe size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ transform: "translateZ(15px)" }}>Global Network</h3>
                <p className="text-slate-600 leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  Through our direct partnerships with prestigious universities around the globe, we open doors to opportunities you won't find anywhere else.
                </p>
              </div>
            </Hover3DWrapper>
          </div>
        </div>
      </section>

      {/* Company History & Timeline */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Journey</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Company History & Milestones</h2>
          </div>

          <div className="relative border-l border-slate-200 ml-4 md:ml-32 space-y-12">
            {/* Timeline Item 1 */}
            <div className="relative pl-8 md:pl-0 md:grid md:grid-cols-12 md:gap-8 items-start">
              <div className="hidden md:block md:col-span-3 text-right font-bold text-primary text-xl -translate-x-12 mt-1">2014</div>
              <div className="absolute left-[-5px] md:left-[24.3%] top-2 w-3.5 h-3.5 bg-primary rounded-full border-4 border-white z-10"></div>
              <div className="md:col-span-9 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="md:hidden font-bold text-primary text-lg block mb-2">2014</span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Foundation of KeyAbroad</h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  KeyAbroad was founded in Faisalabad with one clear mission: to make world-class international education accessible and straightforward for ambitious local students.
                </p>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="relative pl-8 md:pl-0 md:grid md:grid-cols-12 md:gap-8 items-start">
              <div className="hidden md:block md:col-span-3 text-right font-bold text-primary text-xl -translate-x-12 mt-1">2018</div>
              <div className="absolute left-[-5px] md:left-[24.3%] top-2 w-3.5 h-3.5 bg-primary rounded-full border-4 border-white z-10"></div>
              <div className="md:col-span-9 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="md:hidden font-bold text-primary text-lg block mb-2">2018</span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Gained Official UK Partnerships</h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  We established direct, official partnerships with a growing network of reputable UK universities. This allowed us to streamline the admissions process for our students, provide accurate scholarship guidance, and significantly improve visa success rates through trusted channels.
                </p>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="relative pl-8 md:pl-0 md:grid md:grid-cols-12 md:gap-8 items-start">
              <div className="hidden md:block md:col-span-3 text-right font-bold text-primary text-xl -translate-x-12 mt-1">2022</div>
              <div className="absolute left-[-5px] md:left-[24.3%] top-2 w-3.5 h-3.5 bg-primary rounded-full border-4 border-white z-10"></div>
              <div className="md:col-span-9 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="md:hidden font-bold text-primary text-lg block mb-2">2022</span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">European Expansion (Malta, Cyprus, Ireland)</h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  We expanded our horizons across Europe, opening up exciting new pathways for students to study in Schengen countries and English-speaking destinations like Ireland and Malta.
                </p>
              </div>
            </div>

            {/* Timeline Item 4 */}
            <div className="relative pl-8 md:pl-0 md:grid md:grid-cols-12 md:gap-8 items-start">
              <div className="hidden md:block md:col-span-3 text-right font-bold text-primary text-xl -translate-x-12 mt-1">2026</div>
              <div className="absolute left-[-5px] md:left-[24.3%] top-2 w-3.5 h-3.5 bg-primary rounded-full border-4 border-white z-10"></div>
              <div className="md:col-span-9 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <span className="md:hidden font-bold text-primary text-lg block mb-2">2026</span>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Digital Integration & Real-Time Dashboards</h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  We embraced digital innovation by launching our custom portal, ensuring every student's application is tracked and managed with perfect precision from day one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Experience Section */}
      <ExperienceSection />
    </div>
  );
}
