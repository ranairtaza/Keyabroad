"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, User, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SingleBlogPage() {
  const params = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      if (!params.slug) return;
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", params.slug)
        .single();
        
      if (data) setBlog(data);
      setLoading(false);
    }
    fetchBlog();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Article Not Found</h2>
        <Link href="/blog" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/blog" className="text-primary hover:text-blue-700 font-medium flex items-center gap-2 mb-8 transition-colors w-max">
          <ArrowLeft size={18} /> Back to all articles
        </Link>

        <article className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="relative h-64 md:h-96 w-full bg-slate-100 flex items-center justify-center">
            {blog.image_url ? (
              <img 
                src={blog.image_url} 
                alt={blog.title} 
                className="object-cover w-full h-full"
              />
            ) : (
              <FileText size={64} className="text-slate-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{blog.title}</h1>
              <div className="flex items-center gap-6 text-sm font-medium text-slate-200">
                <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="flex items-center gap-2"><User size={16} /> {blog.author}</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:p-12">
            {blog.excerpt && (
              <p className="text-xl text-slate-600 font-medium mb-10 italic border-l-4 border-primary pl-6 py-2">
                {blog.excerpt}
              </p>
            )}
            
            <div className="prose prose-lg max-w-none text-slate-700">
              {/* Splitting by newlines to render simple paragraphs */}
              {blog.content.split('\\n').map((paragraph: string, idx: number) => {
                if (!paragraph.trim()) return <br key={idx} />;
                return <p key={idx} className="mb-6 leading-relaxed">{paragraph}</p>;
              })}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
