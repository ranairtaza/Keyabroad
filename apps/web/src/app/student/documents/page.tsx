'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@keyabroad/auth/client';
import { uploadStudentDocument } from '@keyabroad/database';
import { Card, CardHeader, CardTitle, CardContent } from '@keyabroad/ui/components/card';
import { Button } from '@keyabroad/ui/components/button';
import { FileUp, File, AlertCircle, CheckCircle2, Trash2, Loader2, FileText } from 'lucide-react';

export default function StudentDocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [docTypeId, setDocTypeId] = useState('');
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const supabase = createClient();

  const fetchMyDocuments = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();
      
    if (studentData) {
      const { data } = await supabase
        .from('student_documents')
        .select(`
          id,
          file_name,
          file_type,
          file_size,
          status,
          created_at,
          document_types (name)
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });
        
      if (data) setMyDocuments(data);
    }
    setLoadingDocs(false);
  };

  useEffect(() => {
    const fetchDocTypes = async () => {
      const { data } = await supabase.from('document_types').select('*').eq('active', true);
      if (data) {
        setDocumentTypes(data);
        if (data.length > 0) setDocTypeId(data[0].id);
      }
    };
    fetchDocTypes();
    fetchMyDocuments();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file || !docTypeId) return;

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Not authenticated');

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();
        
      if (studentError || !studentData) throw new Error('Student account not found');

      await uploadStudentDocument(supabase, studentData.id, file, docTypeId);
      
      setMessage('Document uploaded successfully. It is now pending verification.');
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh documents list
      await fetchMyDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) return;
    
    setDeleteError('');
    // Deleting from DB will typically also mean you should delete from Storage, 
    // assuming triggers or this route do so, but for now we delete from the DB.
    const { error: delError } = await supabase.from('student_documents').delete().eq('id', id);
    
    if (delError) {
      setDeleteError("Failed to delete document.");
    } else {
      setMyDocuments(myDocuments.filter(d => d.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">My Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your required compliance documents securely.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Upload New Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {message && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <select 
                value={docTypeId}
                onChange={(e) => setDocTypeId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                disabled={documentTypes.length === 0}
              >
                {documentTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>{dt.name} - {dt.category}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select File (Max 5MB)</label>
              <input 
                id="file-upload"
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="w-full p-1.5 border rounded-md"
              />
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!file || !docTypeId || uploading}
            className="w-full md:w-auto mt-4"
          >
            {uploading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Uploading securely...</span>
            ) : 'Upload Document'}
          </Button>
          
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deleteError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {deleteError}
            </div>
          )}
          {loadingDocs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : myDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
              You haven't uploaded any documents yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-slate-700 truncate">{doc.file_name}</span>
                      <span className="text-xs text-slate-500">
                        {doc.document_types?.name} • {doc.status} • {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
