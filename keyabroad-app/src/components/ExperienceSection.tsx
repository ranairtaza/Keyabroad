"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, animate, motion, useMotionValue, useTransform } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import AnimatedSection from "@/components/AnimatedSection";

const AnimatedCounter = ({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (inView) {
      const animation = animate(count, to, { duration: duration, ease: "easeOut" });
      return animation.stop;
    }
  }, [count, to, duration, inView]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

export default function ExperienceSection() {
  return (
    <section className="py-24 bg-[#1e3a6a] relative overflow-hidden">
      {/* Background Curves */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[300px] bg-blue-400/20 rounded-[100%] blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-[200px] left-1/2 -translate-x-1/2 w-[100%] h-[400px] bg-blue-500/40 rounded-[100%] blur-2xl pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection direction="up" className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Experience</h2>
          <p className="text-blue-50 text-lg max-w-2xl mx-auto bg-white/10 px-8 py-3 rounded-full inline-block backdrop-blur-md border border-white/20 shadow-xl">
            We believe education knows no borders, and neither should your dreams.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 items-center pb-12">
          {/* Card 1 */}
          <AnimatedSection delay={0} direction="up" className="md:translate-y-12">
            <Hover3DWrapper intensity="subtle">
              <div className="bg-[#f0f0f0] rounded-2xl p-8 shadow-2xl border border-white/50 text-center flex flex-col items-center h-full" style={{ transform: "translateZ(30px)" }}>
                <h3 className="text-4xl font-bold text-primary mb-4" style={{ transform: "translateZ(20px)" }}>
                  <AnimatedCounter from={0} to={15} />+ <span className="text-xl text-slate-700">Years</span>
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  Over 15 years of trusted experience helping students study abroad.
                </p>
              </div>
            </Hover3DWrapper>
          </AnimatedSection>

          {/* Card 2 */}
          <AnimatedSection delay={0.2} direction="up" className="md:-translate-y-4">
            <Hover3DWrapper intensity="subtle">
              <div className="bg-[#f0f0f0] rounded-2xl p-8 shadow-2xl border border-white/50 text-center flex flex-col items-center h-full" style={{ transform: "translateZ(30px)" }}>
                <h3 className="text-4xl font-bold text-primary mb-4" style={{ transform: "translateZ(20px)" }}>
                  <AnimatedCounter from={0} to={17} />+ <span className="text-xl text-slate-700">Destinations</span>
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  Connecting students with top universities across 17+ incredible countries.
                </p>
              </div>
            </Hover3DWrapper>
          </AnimatedSection>

          {/* Card 3 */}
          <AnimatedSection delay={0.4} direction="up" className="md:translate-y-12">
            <Hover3DWrapper intensity="subtle">
              <div className="bg-[#f0f0f0] rounded-2xl p-8 shadow-2xl border border-white/50 text-center flex flex-col items-center h-full" style={{ transform: "translateZ(30px)" }}>
                <h3 className="text-4xl font-bold text-primary mb-4" style={{ transform: "translateZ(20px)" }}>
                  <AnimatedCounter from={0} to={5000} duration={2.5} />+ <span className="text-xl text-slate-700">Students</span>
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                  Over 5,000 students successfully placed and thriving in their international careers.
                </p>
              </div>
            </Hover3DWrapper>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
