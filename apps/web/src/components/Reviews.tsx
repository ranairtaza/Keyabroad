import AnimatedSection from "./AnimatedSection";

export default function Reviews() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection direction="up" className="text-center mb-12">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm mb-2 block">Real Student Success Stories</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Hear From Our Students</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Hear from students who successfully achieved their study abroad dreams with our help.
          </p>
        </AnimatedSection>

        <AnimatedSection direction="up" delay={0.2}>
          <div className="w-full flex justify-center">
            <iframe 
              src="https://admin.keyabroad.com/embed/reviews" 
              className="w-full max-w-3xl h-[450px] md:h-[350px] border-none bg-transparent"
              title="Student Reviews"
              loading="lazy"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
