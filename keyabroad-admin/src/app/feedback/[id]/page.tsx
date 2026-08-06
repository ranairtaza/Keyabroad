"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadStudent() {
      if (!params.id) return;
      const { data } = await supabase
        .from('students')
        .select('name')
        .eq('id', params.id)
        .single();
      
      if (data) setStudent(data);
      setLoading(false);
    }
    loadStudent();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setIsSubmitting(true);
    
    const { error } = await supabase.from('student_feedbacks').insert([{
      student_id: params.id,
      rating,
      review_text: reviewText
    }]);

    setIsSubmitting(false);

    if (error) {
      toast.error("Something went wrong, please try again.");
    } else {
      setSubmitted(true);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Link</h1>
          <p className="text-slate-400">We couldn't find your profile. Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-green-500/20 p-4 rounded-full">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Thank You!</h2>
          <p className="text-slate-400">Your feedback has been received. We wish you the best of luck on your journey ahead!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 opacity-50"></div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">KeyAbroad</h1>
          <p className="text-slate-400 text-sm">Congratulations on completing your journey!</p>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">
          Hi {student.name},<br/> How was your experience?
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <label className="text-slate-400 text-sm font-medium">Rate your experience</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    size={36} 
                    className={`transition-colors duration-200 ${
                      star <= (hoverRating || rating) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2">Write a Review</label>
            <textarea 
              rows={4}
              required
              placeholder="Tell us about your experience with our team..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-primary transition-colors resize-none placeholder-slate-600"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
