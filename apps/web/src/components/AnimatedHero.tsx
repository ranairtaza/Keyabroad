"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Globe, Users } from "lucide-react";

export default function AnimatedHero() {
  return (
    <section className="relative w-full min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/40 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/30 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        
        {/* Left Column - Text Content */}
        <div 
          className="w-full text-center lg:text-left mt-16 lg:mt-0"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-slate-800 border border-slate-700 backdrop-blur-md mb-6 shadow-xl">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-blue-50 tracking-wide pr-2">🏆 &nbsp; Proven Excellence &nbsp;|&nbsp; Fall 2026 Intakes Open</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Your Dream University. <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Zero Stress.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            We don't just process applications; we engineer success. Join thousands of students who have secured admissions and massive scholarships at top global universities.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start w-full px-4 sm:px-0 mt-8 gap-4">
            <div className="w-full sm:w-auto">
              <Link 
                href="#contact" 
                className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-blue-600 transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center group text-lg"
              >
                Start Your Journey 
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </div>
            <div className="w-full sm:w-auto">
              <Link 
                href="/services" 
                className="w-full px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-105 border border-white/20 flex items-center justify-center text-lg"
              >
                Explore Programs
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Floating Metrics */}
        <div className="relative h-[500px] w-full hidden lg:block">
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Card 1 */}
            <div 
              className="animate-float absolute top-4 left-4 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl w-64"
            >
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Trusted
              </h3>
              <p className="text-blue-200 text-sm">By Students Worldwide</p>
            </div>

            {/* Card 2 */}
            <div 
              className="animate-float-delay-1 absolute bottom-4 left-16 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl w-64"
            >
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-400">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Global
              </h3>
              <p className="text-blue-200 text-sm">Destinations Covered</p>
            </div>

            {/* Card 3 */}
            <div 
              className="animate-float-delay-2 absolute top-1/2 right-4 -translate-y-1/2 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl w-56 z-20"
            >
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Expert
              </h3>
              <p className="text-blue-200 text-sm">Visa Assistance</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
