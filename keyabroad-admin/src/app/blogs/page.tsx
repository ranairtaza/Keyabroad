"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit, Trash2, Globe, FileText, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/components/RoleContext";

export default function BlogManager() {
  const { currentUser, role } = useRole();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const isIntern = currentUser?.designation?.toLowerCase().includes("intern");

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setBlogs(data);
    setLoading(false);
  }

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async function handleSubmit(e: React.FormEvent, publishStatus: boolean) {
    e.preventDefault();
    if (!title || !content) return toast.error("Title and Content are required");

    const slug = generateSlug(title);
    const authorName = currentUser?.name || "KeyAbroad Staff";

    const blogData = {
      title,
      slug,
      excerpt,
      content,
      author: authorName,
      image_url: imageUrl,
      published: publishStatus
    };

    if (editingBlog) {
      // Update
      const { error } = await supabase.from('blogs').update(blogData).eq('id', editingBlog.id);
      if (error) return toast.error("Failed to update blog");
      toast.success("Blog updated successfully!");
    } else {
      // Insert
      const { error } = await supabase.from('blogs').insert(blogData);
      if (error) {
        if (error.code === '23505') return toast.error("A blog with this title already exists.");
        return toast.error("Failed to create blog");
      }
      toast.success(publishStatus ? "Blog Published Live!" : "Draft Saved!");
    }

    closeEditor();
    fetchBlogs();
  }

  async function togglePublish(blog: any) {
    const { error } = await supabase.from('blogs').update({ published: !blog.published }).eq('id', blog.id);
    if (error) return toast.error("Failed to update status");
    toast.success(blog.published ? "Blog un-published." : "Blog published live!");
    fetchBlogs();
  }

  async function deleteBlog(id: string) {
    if (!confirm("Are you sure you want to delete this blog? This cannot be undone.")) return;
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) return toast.error("Failed to delete blog");
    toast.success("Blog deleted");
    fetchBlogs();
  }

  function openEditor(blog: any = null) {
    if (blog) {
      setEditingBlog(blog);
      setTitle(blog.title);
      setExcerpt(blog.excerpt || "");
      setContent(blog.content);
      setImageUrl(blog.image_url || "");
    } else {
      setEditingBlog(null);
      setTitle("");
      setExcerpt("");
      setContent("");
      setImageUrl("");
    }
    setIsEditing(true);
  }

  function closeEditor() {
    setIsEditing(false);
    setEditingBlog(null);
  }

  if (isIntern) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">Interns do not have permission to manage website blogs. Please contact an Administrator if you need to publish content.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {!isEditing ? (
        <>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="text-primary" /> Blog Manager
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Write and publish articles directly to the KeyAbroad website.</p>
            </div>
            <button 
              onClick={() => openEditor()}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow transition-all"
            >
              <Plus size={18} /> New Blog
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && <p className="text-slate-500 col-span-full">Loading blogs...</p>}
            {!loading && blogs.length === 0 && (
              <div className="col-span-full text-center py-12 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No blogs yet</h3>
                <p className="text-slate-500">Click 'New Blog' to write your first article.</p>
              </div>
            )}
            {blogs.map(blog => (
              <div key={blog.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col group relative">
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm ${blog.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {blog.published ? <CheckCircle size={12}/> : <FileText size={12}/>}
                  {blog.published ? 'Published' : 'Draft'}
                </div>

                {blog.image_url ? (
                  <img src={blog.image_url} alt={blog.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">No Image</div>
                )}
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 mb-2">{blog.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1">{blog.excerpt}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">By {blog.author}</p>
                    
                    <div className="flex gap-2">
                      <button onClick={() => togglePublish(blog)} className="text-slate-400 hover:text-primary transition-colors p-1" title={blog.published ? "Unpublish" : "Publish Live"}>
                        <Globe size={18} />
                      </button>
                      <button onClick={() => openEditor(blog)} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => deleteBlog(blog.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingBlog ? 'Edit Blog' : 'Write New Blog'}</h2>
            <button onClick={closeEditor} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Cancel</button>
          </div>
          
          <form className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Blog Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-lg"
                placeholder="e.g. Top 5 Reasons to Study in the UK"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Short Excerpt (Shows on home page)</label>
              <textarea 
                value={excerpt} 
                onChange={(e) => setExcerpt(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary h-24"
                placeholder="A brief 1-2 sentence summary of the article..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cover Image URL</label>
              <input 
                type="text" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/image.jpg (Optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Content *</label>
              <p className="text-xs text-slate-500 mb-2">Tip: Press Enter twice to create new paragraphs.</p>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary h-96 font-serif leading-relaxed"
                placeholder="Write your article here..."
                required
              />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="px-6 py-3 rounded-lg font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Save as Draft
              </button>
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-6 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 shadow-md transition-colors flex items-center gap-2"
              >
                <Globe size={18} /> Publish to Website
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
