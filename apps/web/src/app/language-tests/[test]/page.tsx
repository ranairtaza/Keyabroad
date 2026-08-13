"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { languageTests } from "@/data/languageTests";
import { CheckCircle2, ArrowRight, User, Phone, Mail, BookOpen, Clock, Target } from "lucide-react";
import Link from "next/link";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { supabase } from "@keyabroad/auth/legacy";

interface Props {
  params: Promise<{ test: string }>;
}

export default function LanguageTestDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const testId = resolvedParams.test;
  const testData = languageTests.find((t) => t.id === testId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!testData) {
    notFound();
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const studentName = formData.get("studentName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const targetScore = formData.get("targetScore") as string;

    const { error } = await supabase.from("registrations").insert([
      {
        student_name: studentName,
        phone,
        email,
        test: testData.name,
        target_score: targetScore,
        status: "pending"
      }
    ]);

    setIsSubmitting(false);
    if (error) {
      console.error(error);
      alert("Failed to submit registration. Please try again.");
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/language-tests" className="inline-flex items-center text-blue-200 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="mr-2" size={16} /> Back to Test Preparation
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{testData.name} Preparation</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {testData.description}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left side: Information */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <BookOpen className="text-primary" size={28} /> About {testData.name}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-12">
                  {testData.about}
                </p>
                <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <Target className="text-primary" size={28} /> Why Choose KeyAbroad for {testData.name}?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  KeyAbroad is Faisalabad's leading language testing prep center. We guide students strategically by analyzing their individual weak modules, ensuring they meet the required band scores.
                </p>
                </div>
                <div className="grid md:grid-cols-1 gap-4">
                  {testData.whyChooseUs.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="text-green-500 shrink-0 mt-1" size={24} />
                      <p className="text-slate-700 font-medium">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Registration Form */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 sticky top-28">
                {isSuccess ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 mx-auto">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Registration Complete!</h3>
                    <p className="text-slate-600">
                      Thank you for registering for our {testData.name} prep classes. Our admissions coordinator will contact you shortly to schedule your diagnostic test and classes.
                    </p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="mt-6 px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Register Another Student
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Register for {testData.name} Prep</h3>
                    <p className="text-sm text-slate-500 mb-6">Fill in your details below to reserve a seat in our upcoming batches.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" name="studentName" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="John Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="tel" name="phone" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="+92 300 1234567" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="email" name="email" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="john@example.com" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Target Score / Band</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" name="targetScore" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="e.g. 7.5 Band or 120" />
                        </div>
                      </div>

                      <Hover3DWrapper intensity="subtle" className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                          {isSubmitting ? "Submitting..." : (
                            <>Register for {testData.name} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                          )}
                        </button>
                      </Hover3DWrapper>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

// ArrowLeft lucide-react icon is missing from import, let's fix it by importing
import { ArrowLeft } from "lucide-react";
