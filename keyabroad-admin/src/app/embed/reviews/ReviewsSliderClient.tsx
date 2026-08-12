"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Quote } from "lucide-react";

export default function ReviewsSliderClient({ feedbacks }: { feedbacks: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [feedbacks.length]);

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-100 p-8 min-h-[300px] flex items-center justify-center">
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-50 rounded-tr-full -z-10 opacity-50"></div>
      
      <Quote className="absolute top-6 left-6 text-slate-100 w-16 h-16 -z-10" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full text-center flex flex-col items-center"
        >
          {/* Stars */}
          <div className="flex items-center gap-1 mb-6">
            {Array(5).fill(0).map((_, i) => (
              <Star 
                key={i} 
                size={24} 
                className={i < feedbacks[currentIndex].rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200 fill-slate-200"} 
              />
            ))}
          </div>

          {/* Review Text */}
          <p className="text-slate-700 text-lg md:text-xl italic font-medium leading-relaxed mb-8 px-4">
            "{feedbacks[currentIndex].review_text}"
          </p>

          {/* Student Info */}
          <div className="flex flex-col items-center">
            <h4 className="font-bold text-slate-900 text-lg">{feedbacks[currentIndex].students?.name || "Student"}</h4>
            
            {(feedbacks[currentIndex].students?.target_destination || feedbacks[currentIndex].students?.university_applied) && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                <MapPin size={14} className="text-blue-500" />
                <span>
                  {feedbacks[currentIndex].students?.target_destination} 
                  {feedbacks[currentIndex].students?.university_applied && ` • ${feedbacks[currentIndex].students?.university_applied}`}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {feedbacks.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "bg-blue-600 w-6" : "bg-slate-200 hover:bg-slate-300"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
