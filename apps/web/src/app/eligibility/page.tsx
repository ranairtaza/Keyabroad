import { Metadata } from 'next';
import { EligibilityWizard } from '@/components/eligibility/EligibilityWizard';

export const metadata: Metadata = {
  title: 'Check Your Eligibility | KeyAbroad',
  description: 'Find out which universities and programs you qualify for based on your academic profile, English scores, and budget.',
  alternates: {
    canonical: '/eligibility',
  },
};

export default function EligibilityPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col justify-center">
      {/* Premium ambient background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-emerald-500/20 dark:bg-emerald-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-72 h-72 rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 py-12 md:py-20">
        <EligibilityWizard />
      </div>
    </div>
  );
}
