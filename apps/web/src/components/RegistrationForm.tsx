"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { destinations } from "@/data/destinations";
import { supabase } from "@keyabroad/auth/legacy";

export default function RegistrationForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('mobile') as string;
    const test = formData.get('languageTest') as string;

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          test
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
    } catch (error) {
      console.error(error);
      alert("Error submitting registration. Please try again.");
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl p-8 md:p-12 shadow-2xl border border-slate-100 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-4">Registration Successful!</h3>
        <p className="text-slate-600 text-lg mb-8">
          Thank you for registering. Our expert counsellors will get in touch with you shortly.
        </p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="text-primary font-medium hover:underline"
        >
          Submit another registration
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 md:p-8 shadow-2xl border-t-4 border-t-primary border-x border-b border-slate-100 relative">
      <div className="mb-6 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2 uppercase tracking-wide">Get Free Consultation</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Row 1: First Name, Last Name */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label htmlFor="firstName" className="text-sm font-medium text-slate-600">First Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="firstName"
              id="firstName" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-800"
            />
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="lastName" className="text-sm font-medium text-slate-600">Last Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="lastName"
              id="lastName" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Row 2: Email, Mobile Number */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              name="email"
              id="email" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-800"
            />
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="mobile" className="text-sm font-medium text-slate-600">Mobile Number <span className="text-red-500">*</span></label>
            <input 
              type="tel" 
              name="mobile"
              id="mobile" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Row 3: Last Qualification, Preferred Country */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label htmlFor="qualification" className="text-sm font-medium text-slate-600">Select Last Qualification <span className="text-red-500">*</span></label>
            <select 
              id="qualification" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-700"
            >
              <option value="">Select</option>
              <option value="high-school">High School (O-Levels / Matric)</option>
              <option value="intermediate">Intermediate (A-Levels / FA / FSc)</option>
              <option value="bachelors">Bachelors</option>
              <option value="masters">Masters</option>
              <option value="phd">PhD</option>
              <option value="diploma">Diploma</option>
            </select>
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="country" className="text-sm font-medium text-slate-600">Select Preferred Country <span className="text-red-500">*</span></label>
            <select 
              id="country" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-700"
            >
              <option value="">Select</option>
              {destinations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Field of Interest, Language Test */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label htmlFor="interest" className="text-sm font-medium text-slate-600">Select Field of Interest</label>
            <select 
              id="interest" 
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-700"
            >
              <option value="">Select</option>
              <option value="business">Business & Management</option>
              <option value="engineering">Engineering & Technology</option>
              <option value="medicine">Medicine & Healthcare</option>
              <option value="it">Computer Science & IT</option>
              <option value="arts">Arts & Humanities</option>
              <option value="science">Science & Mathematics</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="languageTest" className="text-sm font-medium text-slate-600">Language Test <span className="text-red-500">*</span></label>
            <select 
              name="languageTest"
              id="languageTest" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-700"
            >
              <option value="">Select</option>
              <option value="ielts">IELTS</option>
              <option value="toefl">TOEFL</option>
              <option value="pte">PTE</option>
              <option value="duolingo">Duolingo</option>
              <option value="none">Not Taken Yet</option>
            </select>
          </div>
        </div>

        {/* Row 5: Mode of Counselling, Mode of Funding */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1 text-left">
            <label htmlFor="counselling" className="text-sm font-medium text-slate-600">Mode of Counselling <span className="text-red-500">*</span></label>
            <select 
              id="counselling" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-700"
            >
              <option value="">Select</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online/Virtual</option>
            </select>
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="funding" className="text-sm font-medium text-slate-600">Mode of Funding <span className="text-red-500">*</span></label>
            <select 
              id="funding" 
              required
              className="w-full px-4 py-2.5 rounded border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white text-slate-700"
            >
              <option value="">Select</option>
              <option value="self">Self-Funded</option>
              <option value="scholarship">Scholarship</option>
              <option value="loan">Bank Loan</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2 text-sm text-slate-600">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" required className="mt-1 rounded text-primary focus:ring-primary border-slate-300" />
            <span>I agree to KeyAbroad Terms and privacy policy <span className="text-red-500">*</span></span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded text-primary focus:ring-primary border-slate-300" />
            <span>Please contact me by phone, email or SMS to assist with my enquiry</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded text-primary focus:ring-primary border-slate-300" />
            <span>I would like to receive updates and offers from KeyAbroad</span>
          </label>
        </div>

        <Hover3DWrapper intensity="subtle" className="pt-4">
          <button 
            type="submit"
            className="w-full py-3.5 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            Submit Request
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </Hover3DWrapper>
      </form>
    </div>
  );
}
