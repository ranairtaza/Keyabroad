import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Abroad Cost Calculator | KeyAbroad',
  description: 'Estimate tuition fees, living expenses, and overall budget for studying in the UK, USA, Canada, Australia, and more.',
  alternates: {
    canonical: '/cost-calculator',
  },
};

export default function CostCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
