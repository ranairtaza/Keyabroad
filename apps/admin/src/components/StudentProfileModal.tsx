import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock, User, MessageSquare } from 'lucide-react';
import { createClient } from '@keyabroad/auth/client';
import toast from 'react-hot-toast';
import { useRole } from './RoleContext';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onUpdate: () => void;
}

export default function StudentProfileModal({ isOpen, onClose, student, onUpdate }: StudentProfileModalProps) {
  const { currentUser } = useRole();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Timeline State
  const [activities, setActivities] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [followupReason, setFollowupReason] = useState("");
  const [nextCallDate, setNextCallDate] = useState("");
  const [nextCallTime, setNextCallTime] = useState("");
  const [teamMembers, setTeamMembers] = useState<{id: string, name: string}[]>([]);
  const [contactedBy, setContactedBy] = useState("");

  useEffect(() => {
    if (student) {
      setFormData(student);
      fetchActivities();
    }
    
    if (currentUser?.name && !contactedBy) {
      setContactedBy(currentUser.name);
    }
    
    const fetchTeam = async () => {
      const { data } = await supabase.from('team_members').select('id, name').eq('status', 'active');
      if (data) setTeamMembers(data);
    };
    fetchTeam();
  }, [student, currentUser]);

  async function fetchActivities() {
    if (!student?.id) return;
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });
    if (data) setActivities(data);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const filesArray = Array.from(e.target.files);
      let newUrls: string[] = [...(formData.file_urls || [])];
      
      for (const file of filesArray) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${formData.ticket_number}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student_files')
          .upload(fileName, file);
          
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('student_files')
          .getPublicUrl(fileName);
          
        newUrls.push(publicUrlData.publicUrl);
      }
      
      setFormData({ ...formData, file_urls: newUrls });
      toast.success("Files uploaded! Click Save Changes to keep them.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          target_destination: formData.target_destination,
          admissions_stage: formData.admissions_stage,
          language_stage: formData.language_stage,
          subagent_name: formData.subagent_name
        })
        .eq('id', student.id);

      if (error) throw error;
      
      // Log the update
      await supabase.from('activity_logs').insert([{
        action_type: 'STATUS_CHANGE',
        description: 'Updated student profile details or status.',
        student_id: student.id,
        employee_name: currentUser?.name || 'Admin'
      }]);

      toast.success("Profile updated!");
      onUpdate();
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('activity_logs').insert([{
        action_type: 'COMMENT',
        description: newComment,
        student_id: student.id,
        employee_name: contactedBy || currentUser?.name || 'Admin',
        followup_reason: followupReason
      }]);

      if (error) throw error;
      
      // If a next call is scheduled, add to follow_ups
      if (nextCallDate) {
        await supabase.from('follow_ups').insert([{
          student_name: student.name,
          phone: student.phone,
          email: student.email,
          counselor_name: contactedBy || currentUser?.name || 'Admin',
          follow_up_date: `${nextCallDate}${nextCallTime ? 'T' + nextCallTime : ''}`,
          notes: `[Auto-scheduled] ${followupReason || 'Follow up'} - ${newComment}`,
          status: 'pending'
        }]);
        toast.success("Next follow-up scheduled!");
      }

      toast.success("Comment added!");
      setNewComment("");
      setFollowupReason("");
      setNextCallDate("");
      setNextCallTime("");
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-white">{student.name}</h2>
              <div className="flex items-center gap-3">
                <p className="text-slate-400 text-sm">Ticket: {student.ticket_number}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://admin.keyabroad.com/feedback`);
                      toast.success("Universal Feedback link copied to clipboard!");
                    }}
                  className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <MessageSquare size={12} /> Copy Feedback Link
                </button>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700/50 px-6 pt-4 space-x-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'timeline' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Clock className="w-4 h-4" /> Timeline & Comments
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'details' ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                    <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Target Destination</label>
                    <input type="text" value={formData.target_destination || ''} onChange={e => setFormData({...formData, target_destination: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                  
                  {/* Statuses */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Admissions Stage</label>
                    <select value={formData.admissions_stage || 'New'} onChange={e => setFormData({...formData, admissions_stage: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Submitted">Submitted</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Closed Application">Closed Application</option>
                      <option value="Visa Approved">Visa Approved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sub-Agent Name (Optional)</label>
                    <input type="text" value={formData.subagent_name || ''} onChange={e => setFormData({...formData, subagent_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. Ali Partners" />
                  </div>
                  <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-700/50">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Attached Documents / Files</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.file_urls && formData.file_urls.length > 0 ? (
                        formData.file_urls.map((url: string, idx: number) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="bg-slate-900 border border-slate-700 text-indigo-400 text-xs px-3 py-1.5 rounded-lg hover:border-indigo-500 transition-colors">
                            View File {idx + 1}
                          </a>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No files attached yet.</span>
                      )}
                    </div>
                    <label className="flex items-center justify-center w-full bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl px-4 py-6 cursor-pointer hover:border-indigo-500 transition-colors">
                      <span className="text-sm font-medium text-slate-400">
                        {isUploading ? "Uploading..." : "+ Click to attach more files"}
                      </span>
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-700">
                  <button type="submit" disabled={isSaving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col h-full space-y-6">
                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Follow-up Reason</label>
                      <input type="text" placeholder="e.g., Interested, Payment Pending, Call Back" value={followupReason} onChange={e => setFollowupReason(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Contacted By</label>
                      <select 
                        value={contactedBy || currentUser?.name || 'Admin'}
                        onChange={e => setContactedBy(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value={currentUser?.name || 'Admin'}>{currentUser?.name || 'Admin'} (You)</option>
                        {teamMembers.map(member => {
                           if (member.name === currentUser?.name) return null;
                           return <option key={member.id} value={member.name}>{member.name}</option>
                        })}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Next Call Date (Optional)</label>
                      <input type="date" min={new Date().toISOString().split('T')[0]} value={nextCallDate} onChange={e => setNextCallDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Next Call Time (Optional)</label>
                      <input type="time" value={nextCallTime} onChange={e => setNextCallTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm [color-scheme:dark]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Comment / Notes</label>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} placeholder="Add follow-up details..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm" required />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" /> Add Note
                    </button>
                  </div>
                </form>

                {/* Timeline Feed */}
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {activity.action_type === 'COMMENT' ? <MessageSquare className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-xl">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-indigo-400 text-sm">{activity.employee_name}</span>
                          <time className="text-xs text-slate-500">{new Date(activity.created_at).toLocaleString()}</time>
                        </div>
                        {activity.followup_reason && (
                          <div className="inline-block px-2 py-1 bg-slate-700/50 rounded text-xs font-medium text-slate-300 mb-2">
                            Reason: {activity.followup_reason}
                          </div>
                        )}
                        <p className="text-slate-300 text-sm">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {activities.length === 0 && (
                    <div className="text-center text-slate-500 py-8 relative z-10">
                      No activity recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
