import React from 'react';
import { supabase } from '@keyabroad/auth/legacy';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@keyabroad/ui/components/card';
import { Calendar, User, BookOpen, FileText } from 'lucide-react';

export const metadata = {
  title: 'Study Abroad Blog & Insights | KeyAbroad',
  description: 'Read the latest tips, guides, and news about studying abroad in the UK, USA, Australia, and Canada.',
};

export default async function BlogPage() {
  const { data: posts, error } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, created_at, author_id, featured_image_url, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blogs:', error);
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="relative py-24 bg-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Latest Insights & News</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Stay updated with the latest trends, guides, and tips for studying abroad.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(!posts || posts.length === 0) ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700">Check back soon!</h3>
              <p className="text-slate-500">We are currently writing new content.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {posts.map((blog) => (
                <div key={blog.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-shadow flex flex-col h-full group">
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {blog.featured_image_url ? (
                      <img 
                        src={blog.featured_image_url} 
                        alt={blog.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <FileText size={48} className="text-slate-300" />
                    )}
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(blog.created_at).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                        {blog.title}
                      </h3>
                    </Link>
                    <p className="text-slate-600 mb-6 flex-grow">
                      {blog.excerpt}
                    </p>
                    <Link href={`/blog/${blog.slug}`} className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all mt-auto w-max">
                      <BookOpen size={18} /> Read More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
