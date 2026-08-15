import { SupabaseClient } from '@supabase/supabase-js';

// Re-usable storage utility for client or server
export async function uploadStudentDocument(
  supabase: any,
  studentId: string, // UUID from students table
  file: File,
  documentTypeId: string // UUID from document_types table
) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File exceeds 5MB limit');
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, JPG, PNG, and WebP are allowed.');
  }

  // Pre-insert metadata to get a unique document ID
  const { data: dbData, error: dbError } = await supabase
    .from('student_documents')
    .insert({
      student_id: studentId,
      document_type_id: documentTypeId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: 'pending', // Temporary, will update after upload
      verification_status: 'pending'
    })
    .select('id')
    .single();

  if (dbError || !dbData) {
    throw new Error('Failed to initialize document tracking');
  }

  const documentId = dbData.id;
  
  // Extract extension safely
  const extMatch = file.name.match(/\\.[0-9a-z]+$/i);
  const ext = extMatch ? extMatch[0] : '';
  
  // Generate strict private path: students/{student_id}/documents/{document_id}/file.ext
  const storagePath = `students/${studentId}/documents/${documentId}/file${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    // Cleanup the database record if upload fails
    await supabase.from('student_documents').delete().eq('id', documentId);
    throw uploadError;
  }

  // Update tracking with actual path
  const { error: updateError } = await supabase
    .from('student_documents')
    .update({ storage_path: storagePath })
    .eq('id', documentId);

  if (updateError) {
    throw updateError;
  }

  return documentId;
}

export async function getDocumentUrl(
  supabase: any,
  filePath: string
) {
  const { data, error } = await supabase.storage
    .from('student-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw error;
  }
  return data.signedUrl;
}
