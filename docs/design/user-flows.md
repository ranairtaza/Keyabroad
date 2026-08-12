# User Flows

## Flow 1: Lead Capture to Student Conversion
1. User lands on Public Homepage.
2. Clicks "Apply Now" CTA.
3. Completes multi-step Enquiry Wizard (captures academic background, desired destination).
4. System creates record in `enquiries` and sends notification to Admin.
5. Counselor reviews enquiry and triggers "Invite to Portal".
6. User receives email with magic link.
7. User clicks link, lands on `/student/register` to set password.
8. User is redirected to `/student/dashboard` as a fully registered Student.

## Flow 2: Document Submission & Verification
1. Student logs into Portal, sees action required: "Upload Passport".
2. Navigates to `/student/documents`.
3. Uploads PDF (Securely stored in Supabase private bucket).
4. Document status changes to `pending`.
5. Counselor sees notification in Admin Portal.
6. Counselor views document via signed URL.
7. Counselor clicks "Verify" or "Reject" (with reason).
8. Student is notified of the status change.

## Flow 3: AI Eligibility Check
1. User navigates to `/eligibility` (Public or Student).
2. User inputs grades, budget, and desired course via a conversational UI.
3. System hits internal AI endpoint (`packages/ai`).
4. AI queries pgvector database of valid `programs`.
5. UI streams back a highly-formatted, trustworthy list of recommended programs.
6. User clicks "Shortlist" on a program (requires login, triggers Flow 1 if unauthenticated).
