"use client";

import { useState } from "react";
import { BookOpen, Mic, PenTool, CheckCircle, ArrowRight, User, Mail, Phone, Book } from "lucide-react";
import Feature3DCard from "@/components/Feature3DCard";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { supabase } from "@keyabroad/auth/legacy";

export default function LanguageTestsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const studentName = formData.get("studentName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const test = formData.get("test") as string;
    const targetScore = formData.get("targetScore") as string;

    const { error } = await supabase.from("registrations").insert([
      {
        student_name: studentName,
        phone,
        email,
        test,
        target_score: targetScore,
        status: "pending"
      }
    ]);

    setIsSubmitting(false);
    if (error) {
      console.error(error);
      alert("Failed to submit registration. Please check your internet connection.");
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Header Banner */}
      <section className="relative py-24 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Master Your Language Tests</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Don't let a language barrier stand between you and your dream university. Achieve your target score with our expert, tailored coaching.
          </p>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <Feature3DCard 
              title="IELTS" 
              description="Master Reading, Writing, Listening, and Speaking with our highly structured intensive course."
              icon={<BookOpen className="w-8 h-8" />}
              href="/language-tests/ielts"
            />
            <Feature3DCard 
              title="PTE Academic" 
              description="Get expert coaching for this computer-based test, focusing on real-life academic skills."
              icon={<Mic className="w-8 h-8" />}
              href="/language-tests/pte"
            />
            <Feature3DCard 
              title="Duolingo" 
              description="Prepare quickly and efficiently for the fast, convenient, and widely accepted Duolingo English Test."
              icon={<PenTool className="w-8 h-8" />}
              href="/language-tests/duolingo"
            />
            <Feature3DCard 
              title="Other Tests" 
              description="We offer tailored, one-on-one guidance for the TOEFL, GRE, and GMAT."
              icon={<CheckCircle className="w-8 h-8" />}
              href="/language-tests/other"
            />
          </div>

          {/* Registration Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
            <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Book Your Class Today</h3>
                <p className="text-slate-300 mb-8">
                  Take the first step toward a flawless application by registering for our expert-led language classes.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3"><CheckCircle size={20} className="text-secondary" /> Expert Instructors</li>
                  <li className="flex items-center gap-3"><CheckCircle size={20} className="text-secondary" /> Mock Tests</li>
                  <li className="flex items-center gap-3"><CheckCircle size={20} className="text-secondary" /> Flexible Timings</li>
                </ul>
              </div>
            </div>

            <div className="md:w-7/12 p-10 bg-white">
              {isSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">You're All Set!</h3>
                  <p className="text-slate-600">
                    Thanks for reaching out! One of our language experts will contact you shortly to confirm your schedule and get you started.
                  </p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Register Another Student
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Your Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" name="studentName" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="John Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Your Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="tel" name="phone" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="+92 300 1234567" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Your Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="email" name="email" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="john@example.com" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Which test are you preparing for?</label>
                      <div className="relative">
                        <Book className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select name="test" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none">
                          <option value="">Select a test</option>
                          <option value="IELTS">IELTS</option>
                          <option value="PTE">PTE Academic</option>
                          <option value="Duolingo">Duolingo</option>
                          <option value="TOEFL">TOEFL</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">What is your target score?</label>
                      <input type="text" name="targetScore" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="e.g. 7.5 Band or 120" />
                    </div>
                  </div>

                  <Hover3DWrapper intensity="subtle">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                      {isSubmitting ? "Submitting..." : (
                        <span className="flex items-center gap-2">Secure Your Spot <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                      )}
                    </button>
                  </Hover3DWrapper>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
