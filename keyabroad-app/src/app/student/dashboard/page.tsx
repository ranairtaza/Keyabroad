"use client";
import { useState } from "react";
import { CheckCircle2, Circle, UploadCloud, FileText, Bell, User, Building, Trash2, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function StudentDashboard() {
  const steps = [
    { id: 1, title: "Initial Consultation", description: "Completed on Aug 15", status: "complete" },
    { id: 2, title: "Document Submission", description: "All documents verified", status: "complete" },
    { id: 3, title: "University Application", description: "Applied to University of Melbourne", status: "current" },
    { id: 4, title: "Offer Received", description: "Waiting for university decision", status: "upcoming" },
    { id: 5, title: "Visa Processing", description: "Pending offer letter", status: "upcoming" },
  ];

  const [documents, setDocuments] = useState([
    { id: 1, name: "Passport_Copy.pdf" },
    { id: 2, name: "HighSchool_Transcripts.pdf" }
  ]);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dataDeleted, setDataDeleted] = useState(false);

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleDeleteAllData = () => {
    setDataDeleted(true);
    setShowDeleteModal(false);
    setDocuments([]);
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
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAllData}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors"
              >
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
              JD
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back, John Doe</h1>
              <p className="text-slate-500 flex items-center gap-2">
                <Building size={16} /> Destination: Australia
              </p>
            </div>
          </div>
          <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
            <Bell size={24} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timeline Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Application Timeline</h2>
              
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                {steps.map((step, idx) => (
                  <div key={step.id} className="relative pl-8">
                    <span className="absolute -left-[11px] top-1 bg-white">
                      {step.status === 'complete' && <CheckCircle2 size={24} className="text-green-500 bg-white" />}
                      {step.status === 'current' && (
                        <div className="w-6 h-6 rounded-full border-4 border-primary bg-white shadow-[0_0_0_4px_white]"></div>
                      )}
                      {step.status === 'upcoming' && <Circle size={24} className="text-slate-300 bg-white" />}
                    </span>
                    <h3 className={`font-bold text-lg ${step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{step.description}</p>
                    
                    {step.status === 'current' && (
                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Image src="/destinations/australia-waving-flag.png" alt="Australia" width={24} height={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">University of Melbourne - BSc Computer Science</p>
                          <p className="text-slate-500 text-xs mt-1">Application submitted on Sep 10. Normal processing time is 4-6 weeks.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Counselor Note */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
              <User className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
              <h3 className="font-bold text-lg mb-2 relative z-10">Your Counselor</h3>
              <p className="text-blue-100 text-sm mb-4 relative z-10">
                "Hi John! Your application looks incredibly strong. I'm keeping a close eye on the portal for any updates from Melbourne."
              </p>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  SA
                </div>
                <div>
                  <p className="font-semibold text-sm">Sarah Ahmed</p>
                  <p className="text-xs text-blue-200">Senior Counselor</p>
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Pending Documents</h3>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-primary transition-colors cursor-pointer group">
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-primary transition-colors mb-2" />
                <p className="text-sm font-medium text-slate-700">Upload IELTS Certificate</p>
                <p className="text-xs text-slate-500 mt-1">PDF or JPEG (max 5MB)</p>
              </div>
              
              <h3 className="font-bold text-slate-900 mt-6 mb-3 text-sm">Uploaded</h3>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No documents uploaded.</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <FileText className="text-blue-500" size={16} />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{doc.name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
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
