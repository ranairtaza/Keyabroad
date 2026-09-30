"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, CheckCircle2, Ticket, ChevronRight, ChevronLeft, Calendar, MapPin, Mail, Briefcase, GraduationCap, Globe, ShieldAlert, FileCheck } from "lucide-react";
import Hover3DWrapper from "@/components/Hover3DWrapper";

const destinationsList = ["UK", "USA", "Canada", "Australia", "Germany", "Ireland", "Italy", "France", "Cyprus", "Malta", "Turkey", "UAE (Dubai)", "Malaysia", "New Zealand"];
const subjectsList = ["Business & Management", "Accounting & Finance", "Marketing", "Sports", "Information Technology", "Artificial Intelligence", "Data Science", "Engineering", "Education", "Law", "Social Sciences", "Medical & Health Sciences", "Hospitality & Tourism", "Media & Communication"];
const documentsList = ["Passport", "CNIC", "Academic Certificates", "Transcripts", "Experience Letter", "IELTS/PTE result", "CV/Resume", "Statement of Purpose"];

export default function EnquiryFormWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedCounselor, setAssignedCounselor] = useState<{name: string, email?: string} | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    mobile: "",
    email: "",
    city: "",
    passport_available: false,

    language_test: "",
    language_other: "",
    reading_score: "",
    listening_score: "",
    writing_score: "",
    speaking_score: "",

    education_history: [
      { level: "Masters", subject: "", marks: "", year: "", board: "" },
      { level: "Bachelors", subject: "", marks: "", year: "", board: "" },
      { level: "Intermediate", subject: "", marks: "", year: "", board: "" },
      { level: "Matric", subject: "", marks: "", year: "", board: "" }
    ],

    has_work_experience: false,
    work_duration: "",
    job_title: "",
    company_name: "",

    destinations: [] as string[],
    destination_other: "",
    preferred_subjects: [] as string[],
    subject_other: "",
    total_budget_pkr: "",

    applied_for_visa: false,
    visa_country: "",
    visa_type: "",
    visa_status: "",
    visa_refusal_reason: "",

    documents: [] as string[],
    documents_other: ""
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEdu = [...formData.education_history];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setFormData({ ...formData, education_history: newEdu });
  };

  const toggleArrayItem = (field: 'destinations' | 'preferred_subjects' | 'documents', item: string) => {
    const arr = formData[field];
    if (arr.includes(item)) {
      setFormData({ ...formData, [field]: arr.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...arr, item] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.mobile || !formData.email) {
      alert("Please fill out your Name, Mobile number, and Email address.");
      setStep(1);
      return;
    }

    setIsSubmitting(true);

    // 1. Mandatory Field Standardization: Construct inquiry_type dynamically
    const inquiry_type = formData.destinations.length > 0
      ? `Study in ${(formData.destination_other ? [...formData.destinations, formData.destination_other] : formData.destinations).join(', ')}`
      : formData.language_test && formData.language_test !== 'Other'
      ? `${formData.language_test} Prep`
      : formData.language_other
      ? `${formData.language_other} Prep`
      : 'General Consultation';

    // 2. Automated Lead Assignment is now handled securely on the backend

    // Construct final payload
    const payload = {
      full_name: formData.full_name,
      dob: formData.dob,
      phone_number: formData.mobile, // Storing as phone_number to standardize!
      email: formData.email,
      city: formData.city,
      inquiry_type: inquiry_type,
      status: 'pending',
      source: 'online',
      
      passport_available: formData.passport_available,
      language_test: formData.language_test === 'Other' ? formData.language_other : formData.language_test,
      reading_score: formData.reading_score,
      listening_score: formData.listening_score,
      writing_score: formData.writing_score,
      speaking_score: formData.speaking_score,
      education_history: formData.education_history.filter(e => e.subject || e.marks || e.year || e.board),
      has_work_experience: formData.has_work_experience,
      work_duration: formData.work_duration,
      job_title: formData.job_title,
      company_name: formData.company_name,
      destinations: formData.destination_other ? [...formData.destinations, formData.destination_other] : formData.destinations,
      preferred_subjects: formData.subject_other ? [...formData.preferred_subjects, formData.subject_other] : formData.preferred_subjects,
      total_budget_pkr: formData.total_budget_pkr,
      applied_for_visa: formData.applied_for_visa,
      visa_country: formData.visa_country,
      visa_type: formData.visa_type,
      visa_status: formData.visa_status,
      visa_refusal_reason: formData.visa_refusal_reason,
      documents: formData.documents_other ? [...formData.documents, formData.documents_other] : formData.documents,
    };

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      
      setTicketNumber(data.ticket_number);
      if (data.counselor_name) {
        setAssignedCounselor({ name: data.counselor_name });
      }
      setIsSubmitted(true);
      
      // Send confirmation email to the student
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: formData.email,
          subject: 'KeyAbroad: Inquiry Received',
          message: `Dear ${formData.full_name},<br/><br/>Thank you for reaching out to KeyAbroad! We have received your inquiry.<br/><br/>Your Ticket Number is: <b>${data.ticket_number}</b><br/><br/>${data.counselor_name ? `Your dedicated counselor, <b>${data.counselor_name}</b>, is already reviewing your profile and will be in touch shortly.` : 'One of our expert counselors is reviewing your profile.'}<br/><br/>Don't want to wait? You can <a href="https://www.keyabroad.com/book-appointment">book a quick consultation right now</a>.<br/><br/>Best,<br/>The KeyAbroad Team`
        })
      }).catch(e => console.log('Failed to send confirmation email', e));
    } catch (error: any) {
      console.error("Error submitting form:", error);
      alert(`Error submitting form: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Hover3DWrapper intensity="subtle">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden relative min-h-[600px] w-full">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* Progress Bar */}
              <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Step {step} of 7</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'w-4 md:w-8 bg-blue-500' : 'w-2 bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[70vh] min-h-[400px]">
                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6 text-blue-600">
                      <User size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                        <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="Ali Khan" aria-label="Full Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} aria-label="Date of Birth" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile / WhatsApp *</label>
                        <input type="tel" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="0300 1234567" aria-label="Mobile Number" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input type="email" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="ali@example.com" aria-label="Email Address" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                        <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Lahore" aria-label="City" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Passport Available?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                            <input type="radio" checked={formData.passport_available} onChange={() => setFormData({ ...formData, passport_available: true })} className="w-5 h-5 text-blue-600" /> Yes
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                            <input type="radio" checked={!formData.passport_available} onChange={() => setFormData({ ...formData, passport_available: false })} className="w-5 h-5 text-slate-400" /> No
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Language */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6 text-green-600">
                      <Globe size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Language Proficiency</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                      {['IELTS', 'PTE', 'Duolingo', 'TOEFL', 'Other'].map(test => (
                        <label key={test} className={`p-3 border rounded-xl cursor-pointer transition-all text-sm ${formData.language_test === test ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                          <input type="radio" name="lang" className="hidden" checked={formData.language_test === test} onChange={() => setFormData({ ...formData, language_test: test })} />
                          {test}
                        </label>
                      ))}
                    </div>
                    {formData.language_test === 'Other' && (
                      <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 mb-6 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Please specify..." value={formData.language_other} onChange={e => setFormData({ ...formData, language_other: e.target.value })} />
                    )}

                    <h4 className="font-semibold text-slate-700 mb-3">Results (if applicable)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Reading', 'Listening', 'Writing', 'Speaking'].map(skill => (
                        <div key={skill}>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{skill}</label>
                          <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={formData[`${skill.toLowerCase()}_score` as keyof typeof formData] as string} onChange={e => setFormData({ ...formData, [`${skill.toLowerCase()}_score`]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Education */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6 text-purple-600">
                      <GraduationCap size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Education History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-left text-sm text-slate-600">
                            <th className="p-3 rounded-tl-lg">Level</th>
                            <th className="p-3">Subject</th>
                            <th className="p-3">Marks/CGPA</th>
                            <th className="p-3">Year</th>
                            <th className="p-3 rounded-tr-lg">Board/Uni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.education_history.map((edu, idx) => (
                            <tr key={edu.level} className="border-b border-slate-100">
                              <td className="p-3 font-semibold text-slate-700 text-sm">{edu.level}</td>
                              <td className="p-2"><input type="text" className="w-full text-slate-900 placeholder:text-slate-400 p-2 border rounded-md text-sm" value={edu.subject} onChange={e => handleEducationChange(idx, 'subject', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-full text-slate-900 placeholder:text-slate-400 p-2 border rounded-md text-sm" value={edu.marks} onChange={e => handleEducationChange(idx, 'marks', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-full text-slate-900 placeholder:text-slate-400 p-2 border rounded-md text-sm" value={edu.year} onChange={e => handleEducationChange(idx, 'year', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-full text-slate-900 placeholder:text-slate-400 p-2 border rounded-md text-sm" value={edu.board} onChange={e => handleEducationChange(idx, 'board', e.target.value)} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Step 4: Work Experience */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6 text-orange-600">
                      <Briefcase size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Work Experience</h3>
                    </div>

                    <label className="block text-sm font-semibold text-slate-700 mb-3">Do you have any work experience?</label>
                    <div className="flex gap-4 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                        <input type="radio" checked={formData.has_work_experience} onChange={() => setFormData({ ...formData, has_work_experience: true })} className="w-5 h-5 text-orange-600" /> Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                        <input type="radio" checked={!formData.has_work_experience} onChange={() => setFormData({ ...formData, has_work_experience: false })} className="w-5 h-5 text-slate-400" /> No
                      </label>
                    </div>

                    {formData.has_work_experience && (
                      <div className="grid md:grid-cols-2 gap-6 p-6 bg-orange-50/50 border border-orange-100 rounded-2xl">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (e.g., 2 years)</label>
                          <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={formData.work_duration} onChange={e => setFormData({ ...formData, work_duration: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title</label>
                          <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                          <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: Destinations & Subjects */}
                {step === 5 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Target Destinations</h3>
                      <div className="flex flex-wrap gap-2">
                        {destinationsList.map(dest => (
                          <button key={dest} onClick={() => toggleArrayItem('destinations', dest)} className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.destinations.includes(dest) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                            {dest}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Preferred Subjects</h3>
                      <div className="flex flex-wrap gap-2">
                        {subjectsList.map(sub => (
                          <button key={sub} onClick={() => toggleArrayItem('preferred_subjects', sub)} className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.preferred_subjects.includes(sub) ? 'bg-[#8dc63f] border-[#8dc63f] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#8dc63f]'}`}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Total Budget (PKR)</label>
                      <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 max-w-md px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.total_budget_pkr} onChange={e => setFormData({ ...formData, total_budget_pkr: e.target.value })} placeholder="e.g. 5,000,000" />
                    </div>
                  </div>
                )}

                {/* Step 6: Immigration History */}
                {step === 6 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6 text-red-600">
                      <ShieldAlert size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Immigration History</h3>
                    </div>

                    <label className="block text-sm font-semibold text-slate-700 mb-3">Have you ever applied for any visa?</label>
                    <div className="flex gap-4 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                        <input type="radio" checked={formData.applied_for_visa} onChange={() => setFormData({ ...formData, applied_for_visa: true })} className="w-5 h-5 text-red-600" /> Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                        <input type="radio" checked={!formData.applied_for_visa} onChange={() => setFormData({ ...formData, applied_for_visa: false })} className="w-5 h-5 text-slate-400" /> No
                      </label>
                    </div>

                    {formData.applied_for_visa && (
                      <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                          <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" value={formData.visa_country} onChange={e => setFormData({ ...formData, visa_country: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Visa Type</label>
                          <input type="text" className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" value={formData.visa_type} onChange={e => setFormData({ ...formData, visa_type: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Status</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                              <input type="radio" name="status" checked={formData.visa_status === 'Approved'} onChange={() => setFormData({ ...formData, visa_status: 'Approved' })} className="w-5 h-5 text-green-600" /> Approved
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                              <input type="radio" name="status" checked={formData.visa_status === 'Refused'} onChange={() => setFormData({ ...formData, visa_status: 'Refused' })} className="w-5 h-5 text-red-600" /> Refused
                            </label>
                          </div>
                        </div>
                        {formData.visa_status === 'Refused' && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Reason (if refused)</label>
                            <textarea className="w-full text-slate-900 placeholder:text-slate-400 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]" value={formData.visa_refusal_reason} onChange={e => setFormData({ ...formData, visa_refusal_reason: e.target.value })} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 7: Documents */}
                {step === 7 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6 text-slate-700">
                      <FileCheck size={24} />
                      <h3 className="text-xl font-bold text-slate-800">Documents Checklist</h3>
                    </div>
                    <p className="text-slate-500 mb-4">Select the documents you have available right now:</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {documentsList.map(doc => (
                        <label key={doc} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" checked={formData.documents.includes(doc)} onChange={() => toggleArrayItem('documents', doc)} />
                          <span className="font-medium text-slate-700 text-sm">{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Navigation */}
              <div className="p-6 md:p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-[2rem]">
                <button
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-3 md:py-4 font-bold rounded-xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                >
                  <ChevronLeft size={20} /> <span className="hidden sm:inline">Back</span>
                </button>

                {step < 7 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center justify-center gap-1 md:gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-[#8dc63f] text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(141,198,63,0.3)] hover:-translate-y-0.5 transition-all"
                  >
                    Continue <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-6 md:px-10 py-3 md:py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="p-10 md:p-16 text-center flex flex-col items-center justify-center space-y-8 h-full min-h-[500px] relative z-10"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-[#8dc63f] rounded-full flex items-center justify-center mb-2 shadow-[0_10px_30px_rgba(141,198,63,0.4)] border-4 border-white"
              >
                <CheckCircle2 size={48} className="text-white" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">You've Taken the First Step!</h3>
                <p className="text-slate-600">Thank you, <span className="font-bold text-slate-900">{formData.full_name}</span>.</p>
                {assignedCounselor ? (
                  <p className="text-slate-600">Your dedicated counselor, <span className="font-bold text-blue-600">{assignedCounselor.name}</span>, is already reviewing your profile. We've sent a confirmation email and they will be in touch shortly to map out your next steps.</p>
                ) : (
                  <p className="text-slate-600">Our expert counsellors are already reviewing your profile. We've sent a confirmation email and we'll be in touch shortly to map out your next steps.</p>
                )}
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 w-full max-w-sm relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 left-0 w-4 h-full flex flex-col justify-between py-2 -ml-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-4 h-4 bg-slate-50 rounded-full shadow-inner" />)}
                </div>
                <div className="absolute top-0 right-0 w-4 h-full flex flex-col justify-between py-2 -mr-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-4 h-4 bg-slate-50 rounded-full shadow-inner" />)}
                </div>

                <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                  <Ticket size={16} /> Your Reference Number
                </p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#8dc63f] tracking-tighter">
                  {ticketNumber}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Hover3DWrapper>
  );
}

