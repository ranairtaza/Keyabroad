'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@keyabroad/auth/client';
import { uploadStudentDocument } from '@keyabroad/database';
import { Card, CardHeader, CardTitle, CardContent } from '@keyabroad/ui/components/card';
import { Button } from '@keyabroad/ui/components/button';
import { FileUp, File, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentDocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [docTypeId, setDocTypeId] = useState('');
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchDocTypes = async () => {
      const { data } = await supabase.from('document_types').select('*').eq('active', true);
      if (data) {
        setDocumentTypes(data);
        if (data.length > 0) setDocTypeId(data[0].id);
      }
    };
    fetchDocTypes();
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

      // Get internal student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();
        
      if (studentError || !studentData) throw new Error('Student account not found');

      await uploadStudentDocument(supabase, studentData.id, file, docTypeId);
      
      setMessage('Document uploaded successfully. It is now pending verification.');
      setFile(null);
      // Reset input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
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
            {uploading ? 'Uploading securely...' : 'Upload Document'}
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
          <div className="text-center py-8 text-muted-foreground">
            {/* We will fetch and display documents here in a complete implementation */}
            Documents list will appear here once you upload them.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

