'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@keyabroad/auth/client';
import { Card, CardHeader, CardTitle, CardContent } from '@keyabroad/ui/components/card';
import { Button } from '@keyabroad/ui/components/button';
import { FileSearch, CheckCircle, XCircle } from 'lucide-react';
import { getDocumentUrl } from '@keyabroad/database';

export default function DocumentVerificationQueue() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_documents')
      .select(`
        id, 
        file_name, 
        storage_path, 
        verification_status, 
        created_at,
        document_types(name),
        students(full_name, user_id)
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [supabase]);

  const handleVerify = async (docId: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('student_documents')
      .update({ 
        verification_status: status,
        verified_at: new Date().toISOString()
      })
      .eq('id', docId);

    if (!error) {
      fetchDocuments(); // refresh queue
    } else {
      alert('Failed to update document status');
    }
  };

  const handleView = async (storagePath: string) => {
    try {
      const url = await getDocumentUrl(supabase, storagePath);
      window.open(url, '_blank');
    } catch (err) {
      alert('Failed to securely retrieve document');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Document Verification Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and verify student compliance documents.
          </p>
        </div>
        <Button onClick={fetchDocuments} variant="outline">Refresh Queue</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5" />
            Pending Verification ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading queue...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg">
              No pending documents require verification at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm">
                  <div>
                    <h3 className="font-bold text-lg">{doc.document_types?.name}</h3>
                    <p className="text-sm text-slate-500">
                      Student: {doc.students?.full_name} <br/>
                      File: {doc.file_name} <br/>
                      Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleView(doc.storage_path)}>
                      Preview
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleVerify(doc.id, 'verified')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        const reason = window.prompt("Reason for rejection:");
                        if (reason !== null) {
                           // Future enhancement: save reason
                           handleVerify(doc.id, 'rejected');
                        }
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
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
