"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Star, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      const { error } = await supabase.from('student_feedbacks').delete().eq('id', id);
      if (error) {
        toast.error("Failed to delete review");
      } else {
        toast.success("Review deleted successfully");
        fetchFeedbacks();
      }
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_feedbacks')
      .select('*, students(name, ticket_number, target_destination)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeedbacks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-700"} 
      />
    ));
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 h-full flex flex-col max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Student Reviews & Feedback</h2>
          <p className="text-slate-400">Read what your completed students are saying.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Hover3DWrapper intensity="subtle">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col relative overflow-hidden h-full items-center justify-center text-center">
             <span className="text-slate-400 font-medium mb-2">Average Rating</span>
             <div className="flex items-center gap-2 mb-2">
               <span className="text-5xl font-bold text-white">{averageRating}</span>
               <Star size={40} className="fill-yellow-400 text-yellow-400" />
             </div>
             <span className="text-sm text-slate-500">Based on {feedbacks.length} reviews</span>
          </div>
        </Hover3DWrapper>
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col justify-center">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2"><MessageSquare size={18} /> How it works</h3>
          <p className="text-slate-400 text-sm">
            You can now share a single, universal feedback link with all your students!
            Send them this link: <code className="bg-slate-950 px-2 py-1 rounded text-primary font-mono select-all">admin.keyabroad.com/feedback</code>.
            When they visit the link, they will be asked to enter their registered <strong>Email Address</strong> or <strong>Ticket Number</strong> to securely link their review to their profile.
            Once they submit their 5-star review, it will automatically appear here!
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-12">Loading reviews...</div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500">
          No reviews yet. Share feedback links with your completed students!
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {feedbacks.map(f => (
            <motion.div key={f.id} variants={item}>
              <Hover3DWrapper intensity="strong">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-white text-lg">{f.students?.name}</h4>
                      <span className="text-xs text-slate-500">{f.students?.ticket_number} • {f.students?.target_destination}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        {renderStars(f.rating)}
                      </div>
                      <button 
                        onClick={() => handleDelete(f.id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm italic flex-1">
                    "{f.review_text}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 text-right">
                    {new Date(f.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Hover3DWrapper>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
