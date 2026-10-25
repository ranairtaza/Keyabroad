import { Metadata } from 'next';
import { EligibilityWizard } from '@/components/eligibility/EligibilityWizard';

export const metadata: Metadata = {
  title: 'AI University Matcher | KeyAbroad',
  description: 'Find out which universities and programs you qualify for using our AI Matcher.',
  alternates: {
    canonical: '/ai-advisor',
  },
};

export default function AIAdvisorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <EligibilityWizard />
    </div>
  );
}
