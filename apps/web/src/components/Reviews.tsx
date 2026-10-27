"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import AnimatedSection from "./AnimatedSection";

interface StudentReview {
  id: string;
  name: string;
  university?: string | null;
  destination?: string | null;
  rating: number;
  review: string;
}

// Only authentic, verified student reviews from project records are included.
// Unverified / invented placeholder testimonials are strictly omitted.
const VERIFIED_REVIEWS: StudentReview[] = [
  {
    id: "43ca4157-8dd9-4640-bf01-7313441c52e2",
    name: "Haidar Ali",
    university: "Language Center",
    destination: "Visa Processing",
    rating: 5,
    review:
      "Excellent experience; well taught and helped me to secure the Bands I required. Special thanks to Sir Junaid. Much Recommended platform for Visa processing and language center.",
  },
];

export default function Reviews() {
  const [reviews, setReviews] = useState<StudentReview[]>(VERIFIED_REVIEWS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const fetchLiveReviews = async () => {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          // Query verified feedbacks adhering strictly to the actual database schema:
          // columns: id, student_id, rating, review_text, created_at
          const { data, error } = await supabase
            .from("student_feedbacks")
            .select("id, rating, review_text, created_at, students(name, university_applied, target_destination)")
            .gte("rating", 4)
            .order("created_at", { ascending: false })
            .limit(6);

          if (!error && data && data.length > 0) {
            const liveReviews: StudentReview[] = data.map((item: any) => ({
              id: item.id,
              name: item.students?.name || "Student",
              university: item.students?.university_applied || null,
              destination: item.students?.target_destination || null,
              rating: item.rating || 5,
              review: item.review_text,
            }));

            setReviews(liveReviews);
          }
        } catch {
          // Keep verified default reviews on network/fetch errors
        }
      };

      fetchLiveReviews();
    }
  }, []);

  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, reviews.length]);

  const handlePrev = () => {
    if (reviews.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    if (reviews.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const currentReview = reviews[currentIndex] || VERIFIED_REVIEWS[0];

  return (
    <section className="py-24 bg-slate-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection direction="up" className="text-center mb-12">
          <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-2 block">
            Real Student Success Stories
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Hear From Our Students
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Hear from students who successfully achieved their study abroad dreams with our help.
          </p>
        </AnimatedSection>

        <AnimatedSection direction="up" delay={0.2}>
          <div 
            className="w-full max-w-3xl mx-auto relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Card Container */}
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 min-h-[340px] flex flex-col justify-between">
              {/* Decorative Accents */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full -z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-tr-full -z-10 pointer-events-none" />
              <Quote className="absolute top-6 left-6 text-slate-100 w-16 h-16 -z-10 pointer-events-none" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentReview.id}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full flex flex-col items-center text-center my-auto"
                >
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={22}
                        className={
                          i < currentReview.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 fill-slate-200"
                        }
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-slate-700 text-lg md:text-xl italic font-medium leading-relaxed mb-8 max-w-2xl">
                    &ldquo;{currentReview.review}&rdquo;
                  </p>

                  {/* Student Info */}
                  <div className="flex flex-col items-center">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {currentReview.name}
                    </h3>

                    {(currentReview.destination || currentReview.university) && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-2 bg-slate-50 px-3.5 py-1 rounded-full border border-slate-100">
                        <MapPin size={14} className="text-primary shrink-0" />
                        <span>
                          {currentReview.destination}
                          {currentReview.destination && currentReview.university && " • "}
                          {currentReview.university}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls (rendered only when multiple reviews exist) */}
              {reviews.length > 1 && (
                <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2">
                    {reviews.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDirection(idx > currentIndex ? 1 : -1);
                          setCurrentIndex(idx);
                        }}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          idx === currentIndex
                            ? "bg-primary w-7"
                            : "bg-slate-200 hover:bg-slate-300 w-2.5"
                        }`}
                        aria-label={`Go to review ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    aria-label="Next review"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
