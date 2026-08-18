"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@keyabroad/auth/legacy";
import { Star, Send, CheckCircle2, Search } from "lucide-react";

function FeedbackForm() {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("id");

  const [step, setStep] = useState<"lookup" | "form" | "success">(studentIdParam ? "form" : "lookup");
  const [identifier, setIdentifier] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .or(`ticket_number.eq.${identifier},email.eq.${identifier}`)
      .single();

    setLoading(false);

    if (error || !data) {
      setErrorMessage("We couldn't find your profile. Please check your Ticket Number or Email and try again.");
      setStatus("error");
    } else {
      setStudent(data);
      setStep("form");
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a star rating.");
      setStatus("error");
      return;
    }
    if (reviewText.trim().length < 10) {
      setErrorMessage("Please write a bit more about your experience (at least 10 characters).");
      setStatus("error");
      return;
    }

    setStatus("submitting");

    const payload = {
      student_id: studentIdParam || student?.id || null,
      rating: rating,
      review_text: reviewText,
    };

    const { error } = await supabase.from("student_feedbacks").insert([payload]);

    if (error) {
      setErrorMessage(error.message || "Failed to submit feedback. Please try again.");
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  if (status === "success" || step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center transform scale-105 transition-all">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Thank You!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Your feedback means the world to us. We are so happy to have been a part of your journey!
          </p>
          <a href="/" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-blue-600 transition-colors shadow-lg">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">How was your experience?</h1>
          <p className="text-slate-600 text-lg">
            Congratulations on your visa! Please take a moment to review KeyAbroad.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100">
          {step === "lookup" && (
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Find Your Profile</h2>
                <p className="text-slate-600 text-sm">
                  Please enter your registered Email Address or Ticket Number to leave a review.
                </p>
              </div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Email or Ticket Number"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800"
                />
              </div>
              {status === "error" && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold text-lg py-4 rounded-full hover:bg-blue-600 transition-all shadow-xl shadow-primary/30 flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {loading ? "Searching..." : <><Search size={20} /> Continue</>}
              </button>
            </form>
          )}

          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Hi {student?.name || "Student"}</h2>
                <p className="text-slate-600 text-sm">How was your experience?</p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <label className="text-slate-700 font-bold mb-2 text-lg">Rate our service</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-12 h-12 transition-colors duration-200 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-transparent text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-3 text-lg">Your Review</label>
                <textarea
                  required
                  rows={5}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about your experience with our counsellors..."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-slate-800"
                />
              </div>

              {status === "error" && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-primary text-white font-bold text-lg py-4 rounded-full hover:bg-blue-600 transition-all shadow-xl shadow-primary/30 flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {status === "submitting" ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send size={20} /> Submit Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <FeedbackForm />
    </Suspense>
  );
}
