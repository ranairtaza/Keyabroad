import React from 'react';
import { supabase } from '@keyabroad/auth/legacy';
import { Calendar, User, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
export async function generateStaticParams() {
  const { data, error } = await supabase.from('blogs').select('slug').eq('status', 'published');
  if (error) {
    console.error("Error fetching blog slugs:", error);
    throw error;
  }
  return (data || []).filter((b: any) => b.slug).map((b: any) => ({ slug: String(b.slug) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, excerpt, meta_title, meta_description, image_url')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!blog) notFound();
  
  return {
    title: blog.meta_title || `${blog.title} | KeyAbroad Blog`,
    description: blog.meta_description || blog.excerpt,
    openGraph: {
      images: blog.image_url ? [blog.image_url] : [],
    }
  };
}

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/blog" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-8 transition-colors w-max">
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
                <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:p-12">
            {blog.excerpt && (
              <p className="text-xl text-slate-600 font-medium mb-10 italic border-l-4 border-blue-600 pl-6 py-2">
                {blog.excerpt}
              </p>
            )}
            
            <div 
              className="prose prose-lg max-w-none text-slate-700" 
              dangerouslySetInnerHTML={{ __html: blog.content }} 
            />
          </div>
        </article>
      </div>
    </div>
  );
}
