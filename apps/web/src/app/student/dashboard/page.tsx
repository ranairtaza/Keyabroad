"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, UploadCloud, FileText, Bell, User, Building, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@keyabroad/auth/client";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataDeleted, setDataDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        router.push("/student");
        return;
      }

      // Fetch profile for name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
        
      if (profileData) setProfile(profileData);

      // Fetch student record
      const { data: studentData } = await supabase
        .from('students')
        .select('*, assigned_counselor:profiles!students_assigned_counselor_id_fkey(first_name, last_name)')
        .eq('user_id', userData.user.id)
        .single();
        
      if (studentData) {
        setStudent(studentData);
        
        // Fetch applications
        const { data: appsData } = await supabase
          .from('student_applications')
          .select(`
            id,
            status,
            visa_status,
            created_at,
            universities(name, country),
            programs(name)
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(1); // Latest application for dashboard timeline
          
        if (appsData) setApplications(appsData);

        // Fetch documents
        const { data: docsData } = await supabase
          .from('student_documents')
          .select('id, file_name, status')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false });
          
        if (docsData) setDocuments(docsData);
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase, router]);

  const handleDeleteDocument = async (id: number) => {
    const { error } = await supabase.from('student_documents').delete().eq('id', id);
    if (!error) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch("/api/student/delete", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error("Failed to delete account");
      
      await supabase.auth.signOut();
      setDataDeleted(true);
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      setDeleteError("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (dataDeleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-slate-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Data Deleted</h2>
          <p className="text-slate-500">Your account data and all uploaded files have been permanently removed from our servers.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading your portal...</p>
        </div>
      </div>
    );
  }

  const activeApp = applications.length > 0 ? applications[0] : null;
  const firstName = profile?.first_name || "Student";
  const initials = firstName.charAt(0).toUpperCase();

  const counselorName = student?.assigned_counselor 
    ? `${student.assigned_counselor.first_name} ${student.assigned_counselor.last_name}` 
    : "KeyAbroad Counselor";
  const counselorInitials = counselorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-red-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete all your data?</h3>
            <p className="text-slate-500 text-sm mb-6">
              This action is irreversible. All your submitted applications, uploaded documents, and personal information will be permanently deleted.
            </p>
            {deleteError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, delete my data
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
              <p className="text-slate-500 flex items-center gap-2">
                <Building size={16} /> Destination: {activeApp?.universities?.country || 'Undecided'}
              </p>
            </div>
          </div>
          <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
            <Bell size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timeline Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Application Timeline</h2>
              
              {!activeApp ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                  <p>You have no active applications.</p>
                  <button onClick={() => router.push('/student/applications')} className="mt-4 text-primary font-medium hover:underline">
                    View Applications Page
                  </button>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                  <div className="relative pl-8">
                    <span className="absolute -left-[11px] top-1 bg-white">
                      <CheckCircle2 size={24} className="text-green-500 bg-white" />
                    </span>
                    <h3 className="font-bold text-lg text-slate-900">Application Started</h3>
                    <p className="text-slate-500 text-sm mt-1">Submitted on {new Date(activeApp.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="relative pl-8">
                    <span className="absolute -left-[11px] top-1 bg-white">
                      {activeApp.status === 'accepted' || activeApp.status === 'rejected' ? (
                        <CheckCircle2 size={24} className="text-green-500 bg-white" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-4 border-primary bg-white shadow-[0_0_0_4px_white]"></div>
                      )}
                    </span>
                    <h3 className={`font-bold text-lg ${activeApp.status === 'accepted' || activeApp.status === 'rejected' ? 'text-slate-900' : 'text-primary'}`}>
                      University Decision
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Status: {activeApp.status.replace('_', ' ')}</p>
                    
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Building className="text-blue-500" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{activeApp.universities?.name}</p>
                        <p className="text-slate-500 text-xs mt-1">{activeApp.programs?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative pl-8">
                    <span className="absolute -left-[11px] top-1 bg-white">
                      {activeApp.visa_status === 'approved' ? (
                        <CheckCircle2 size={24} className="text-green-500 bg-white" />
                      ) : activeApp.status === 'accepted' ? (
                         <div className="w-6 h-6 rounded-full border-4 border-primary bg-white shadow-[0_0_0_4px_white]"></div>
                      ) : (
                        <Circle size={24} className="text-slate-300 bg-white" />
                      )}
                    </span>
                    <h3 className={`font-bold text-lg ${activeApp.visa_status === 'approved' ? 'text-slate-900' : activeApp.status === 'accepted' ? 'text-primary' : 'text-slate-400'}`}>
                      Visa Processing
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Status: {activeApp.visa_status ? activeApp.visa_status.replace('_', ' ') : 'Pending University Acceptance'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Counselor Note */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
              <User className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
              <h3 className="font-bold text-lg mb-2 relative z-10">Your Counselor</h3>
              <p className="text-blue-100 text-sm mb-4 relative z-10">
                If you have any questions or need to submit additional documents, please reach out via messages.
              </p>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  {counselorInitials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{counselorName}</p>
                  <p className="text-xs text-blue-200">Counselor</p>
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Documents</h3>
              <button onClick={() => router.push('/student/documents')} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-primary transition-colors cursor-pointer group">
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-primary transition-colors mb-2" />
                <p className="text-sm font-medium text-slate-700">Go to Document Uploads</p>
              </button>
              
              <h3 className="font-bold text-slate-900 mt-6 mb-3 text-sm">Recent Uploads</h3>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No documents uploaded.</p>
                ) : (
                  documents.slice(0, 3).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="text-blue-500 shrink-0" size={16} />
                        <span className="text-sm font-medium text-slate-700 truncate">{doc.file_name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors shrink-0"
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Privacy / Delete Data */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
              <h3 className="font-bold text-red-600 mb-2">Privacy & Data</h3>
              <p className="text-xs text-slate-500 mb-4">You have the right to request the deletion of all your personal data and uploaded documents.</p>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg border border-red-200 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete My Data
              </button>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}
