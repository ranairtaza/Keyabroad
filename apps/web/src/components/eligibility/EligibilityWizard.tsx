"use client";

import React, { useState } from 'react';
import { Button } from '@keyabroad/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@keyabroad/ui/components/card';
import { Input } from '@keyabroad/ui/components/input';
import { Label } from '@keyabroad/ui/components/label';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@keyabroad/auth/legacy';
import Link from 'next/link';

interface EligibilitySubmission {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cgpa: number;
  ieltsScore: number;
  studyGapYears: number;
  budget: number;
  preferredCountryId: string;
}

interface EligibilityResult {
  status: 'eligible' | 'likely_eligible' | 'needs_review' | 'not_met';
  matchedPrograms: number;
  suggestions: string[];
}

export function EligibilityWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const [formData, setFormData] = useState<EligibilitySubmission>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cgpa: 0,
    ieltsScore: 0,
    studyGapYears: 0,
    budget: 0,
    preferredCountryId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Submit lead securely via RPC (matching test suite signature)
      const { data: leadId, error } = await supabase.rpc('submit_public_lead', {
        p_first_name: formData.firstName,
        p_last_name: formData.lastName,
        p_email: formData.email,
        p_phone: formData.phone || null,
        p_cgpa: formData.cgpa,
        p_ielts_score: formData.ieltsScore,
        p_study_gap_years: formData.studyGapYears,
        p_budget: formData.budget, // Matches the INT budget signature
        p_preferred_country_id: formData.preferredCountryId || null,
      });

      if (error) {
        console.error("Failed to submit lead:", error);
      }

      // 2. Business Logic: Query actual programs to find matches
      // Simple heuristic based on real data schema (tuition_fee, minimum_cgpa, minimum_toefl etc)
      const { count } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .lte('tuition_fee', formData.budget)
        .lte('minimum_cgpa', formData.cgpa);

      const matchedCount = count || 0;
      let status: 'eligible' | 'likely_eligible' | 'needs_review' | 'not_met' = 'needs_review';
      const suggestions: string[] = [];

      if (matchedCount > 10) {
        status = 'eligible';
        suggestions.push("You have an extremely strong profile for your budget.");
      } else if (matchedCount > 0) {
        status = 'likely_eligible';
        suggestions.push(`We found ${matchedCount} programs that perfectly fit your academic and financial profile.`);
      } else {
        status = 'not_met';
        suggestions.push("We recommend increasing your budget or considering alternative destinations like Germany.");
      }

      if (formData.cgpa < 2.5) {
        status = 'needs_review';
        suggestions.push("Your CGPA may require you to consider pathway or foundation programs.");
      }

      setResult({
        status,
        matchedPrograms: matchedCount,
        suggestions
      });
      setStep(5);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Personal Info' },
    { id: 2, title: 'Academic Profile' },
    { id: 3, title: 'Test Scores' },
    { id: 4, title: 'Preferences' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Check Your Eligibility
        </h1>
        <p className="text-lg text-slate-600">
          Answer a few quick questions to discover your likelihood of admission to top universities globally.
        </p>
      </div>

      {/* Progress Bar */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((s) => (
              <span
                key={s.id}
                className={`text-xs font-medium uppercase tracking-wider ${
                  step >= s.id ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {s.title}
              </span>
            ))}
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Forms */}
      <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">Let's start with your details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">Your Academic Profile</h2>
              <div className="space-y-2">
                <Label htmlFor="cgpa">Latest Degree CGPA (out of 4.0) *</Label>
                <Input id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="4.0" value={formData.cgpa || ''} onChange={handleChange} required />
                <p className="text-xs text-slate-500">Enter your equivalent GPA if grading is different.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studyGapYears">Study Gap (in years)</Label>
                <Input id="studyGapYears" name="studyGapYears" type="number" min="0" value={formData.studyGapYears || ''} onChange={handleChange} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">English Proficiency</h2>
              <div className="space-y-2">
                <Label htmlFor="ieltsScore">IELTS Band Score</Label>
                <Input id="ieltsScore" name="ieltsScore" type="number" step="0.5" min="0" max="9.0" value={formData.ieltsScore || ''} onChange={handleChange} />
                <p className="text-xs text-slate-500">Leave blank if you haven't taken it yet or plan to take PTE/TOEFL.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">Budget & Preferences</h2>
              <div className="space-y-2">
                <Label htmlFor="budget">Annual Budget (in USD) *</Label>
                <Input id="budget" name="budget" type="number" min="0" value={formData.budget || ''} onChange={handleChange} required />
                <p className="text-xs text-slate-500">Includes tuition and estimated living expenses.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredCountryId">Preferred Destination</Label>
                <select
                  id="preferredCountryId"
                  name="preferredCountryId"
                  value={formData.preferredCountryId}
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Destination</option>
                  <option value="98f12a32-1234-5678-90ab-cdef12345678">United Kingdom</option>
                  <option value="98f12a32-1234-5678-90ab-cdef12345679">United States</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && result && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-8">
              <div className="flex justify-center">
                {result.status === 'eligible' ? (
                  <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                ) : result.status === 'likely_eligible' ? (
                  <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Sparkles className="h-12 w-12" />
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {result.status === 'eligible' && 'Great News!'}
                  {result.status === 'likely_eligible' && 'Good Prospects!'}
                  {result.status === 'needs_review' && 'Profile Review Needed'}
                  {result.status === 'not_met' && 'Alternative Pathways Available'}
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  Based on your profile, you match with <span className="font-bold text-slate-900">{result.matchedPrograms} programs</span> in our database.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left space-y-4">
                <h3 className="font-semibold text-slate-900">Counselor Insights:</h3>
                <ul className="space-y-3">
                  {result.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <div className="mt-1 h-2 w-2 bg-blue-600 rounded-full shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <Link href="/programs">
                  <Button size="lg" className="w-full sm:w-auto">Browse Programs</Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Book Free Consultation</Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        {step < 5 && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 flex items-center justify-between rounded-b-xl">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={step === 1 || isSubmitting}
              className="text-slate-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assessing...
                  </>
                ) : (
                  'See Results'
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
