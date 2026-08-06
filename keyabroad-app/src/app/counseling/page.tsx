"use client";

import { motion } from "framer-motion";
import { ArrowRight, Target, Map, BookOpen, CheckCircle, GraduationCap, Globe, Clock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CounselingPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const steps = [
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "1. Deep-Dive Profile Evaluation",
      description: "We analyze your academic background, career goals, and budget to identify the countries and universities where you have the absolute highest chance of acceptance and success."
    },
    {
      icon: <Map className="w-8 h-8 text-primary" />,
      title: "2. Strategic University Shortlisting",
      description: "No generic lists. We handpick institutions that align with your specific ambitions, ensuring you apply to the right mix of reach, target, and safe-bet universities."
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: "3. Application & Essay Mastery",
      description: "We guide you through crafting compelling personal statements and resumes that capture admission officers' attention and make your application stand out from thousands of others."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary" />,
      title: "4. End-to-End Submission Tracking",
      description: "We handle the heavy lifting. From organizing your transcripts to ensuring every single form is submitted perfectly before the deadline, we leave absolutely zero room for error."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={fadeIn}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                <GraduationCap size={18} />
                <span>Expert Educational Counseling</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Turn Your Study Abroad Dream Into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Admission Letter.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                Stop guessing and start packing. Get expert, step-by-step guidance to secure your spot at a top global university—without the stress, confusion, or fear of rejection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#consultation" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1">
                  Book My Free Consultation <ArrowRight size={20} />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block h-[600px] w-full rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <Image 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                alt="Student celebrating admission"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Agitation Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Applying overseas shouldn't feel like a guessing game.
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-slate-600 leading-relaxed mb-6">
              You have the grades, the ambition, and the drive to succeed internationally. But let's face it: the application process is overwhelming. 
            </p>
            <p className="text-lg text-slate-500 leading-relaxed">
              Between decoding university requirements, writing the perfect personal statement, and navigating complex visa regulations, it is easy to feel lost. One missing document, a weak essay, or a single missed deadline can cost you an entire academic year. <strong>You don't have to figure this out alone.</strong>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Value/Solution Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your Complete Blueprint to Global Education.</h2>
            <p className="text-lg text-slate-600">
              At KeyAbroad, we don't just hand you a list of universities and wish you luck. Our expert educational counsellors partner with you to build a bulletproof application strategy tailored to your unique profile. Here is exactly how we get you accepted:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Why Students Choose KeyAbroad</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                    <Globe className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Proven Track Record</h4>
                    <p className="text-slate-400">Hundreds of our students are currently thriving at prestigious universities across the UK, Australia, USA, and Europe.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                    <ShieldCheck className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Unbiased Advice</h4>
                    <p className="text-slate-400">We work for <em>you</em>, not the universities. Our recommendations are 100% based on what is best for your career.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Zero Hidden Fees</h4>
                    <p className="text-slate-400">Complete transparency from day one. You'll know exactly what you are paying for and the value you are receiving.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                alt="Counseling session"
                fill
                className="object-cover opacity-80 hover:opacity-100 transition-opacity duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="consultation" className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Let’s map out your future, together.</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              The journey to your dream university begins with a single conversation. In our initial session, we’ll review your academic history, discuss your goals, and give you a clear, honest assessment of your best options—no pressure, no commitment required.
            </p>
            <div className="flex flex-col items-center justify-center">
              <a href="https://wa.me/923217777897" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-primary font-bold text-lg rounded-full hover:bg-slate-50 transition-all shadow-2xl hover:shadow-xl hover:-translate-y-1 mb-4">
                Schedule My Free Strategy Session
              </a>
              <p className="text-sm text-blue-200 flex items-center gap-2">
                <Clock size={14} /> Usually takes less than 30 seconds to book via WhatsApp
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
