import { Star, Quote } from "lucide-react";
import Hover3DWrapper from "./Hover3DWrapper";
import AnimatedSection from "./AnimatedSection";

const reviews = [
  {
    name: "Muqaddas",
    date: "2 months ago",
    content: "My experience with KeyAbroad was very good. The staff was professional, polite, and cooperative, and they guided me in a clear and organized way. Their assistance made everything easy to understand.",
    rating: 5,
  },
  {
    name: "Zona Zona",
    date: "10 months ago",
    content: "I had an amazing experience with KeyAbroad throughout my visa process. The consultants were extremely supportive, professional, and always available to guide me at every step. They patiently answered all my questions.",
    rating: 5,
  },
  {
    name: "Anza Javed",
    date: "a year ago",
    content: "I had a great experience with KeyAbroad for my IELTS preparation. The instructors were highly knowledgeable, focusing on test strategies and improving overall language skills. The classes were perfectly structured.",
    rating: 5,
  }
];

export default function Reviews() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection direction="up" className="text-center mb-16">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm mb-2 block">Real Student Success Stories</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Hear From Our Students</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Hear from students who successfully achieved their study abroad dreams with our help.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <AnimatedSection key={index} delay={index * 0.2} direction="up">
              <Hover3DWrapper intensity="subtle" className="h-full block">
                <div className="bg-slate-50 rounded-2xl p-8 h-full border border-slate-200 relative">
                  <Quote className="absolute top-6 right-6 text-slate-200" size={48} />
                  <div className="flex items-center gap-1 mb-4 text-orange-400 relative z-10">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-8 relative z-10 italic leading-relaxed">
                    "{review.content}"
                  </p>
                  <div className="flex items-center justify-between mt-auto border-t border-slate-200 pt-4 relative z-10">
                    <div className="font-bold text-slate-900">{review.name}</div>
                    <div className="text-xs text-slate-500">{review.date}</div>
                  </div>
                </div>
              </Hover3DWrapper>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
