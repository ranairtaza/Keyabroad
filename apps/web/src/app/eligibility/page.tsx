import { Metadata } from 'next';
import { EligibilityWizard } from '@/components/eligibility/EligibilityWizard';

export const metadata: Metadata = {
  title: 'Check Your Eligibility | KeyAbroad',
  description: 'Find out which universities and programs you qualify for based on your academic profile, English scores, and budget.',
};

export default function EligibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <EligibilityWizard />
    </div>
  );
}
