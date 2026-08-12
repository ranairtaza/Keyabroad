import { createClient } from "@supabase/supabase-js";
import { Star } from "lucide-react";
import ReviewsSliderClient from "./ReviewsSliderClient";

export const dynamic = 'force-dynamic';

export default async function ReviewsEmbedPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: feedbacks } = await supabase
    .from("student_feedbacks")
    .select("*, students(name, target_destination, university_applied)")
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!feedbacks || feedbacks.length === 0) {
    return <div className="p-4 text-center text-slate-500 font-sans">No reviews available yet.</div>;
  }

  return (
    <div className="w-full bg-transparent p-4 font-sans">
      <ReviewsSliderClient feedbacks={feedbacks} />
    </div>
  );
}
