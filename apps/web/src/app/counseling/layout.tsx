import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Counseling Session | KeyAbroad',
  description: 'Book a 1-on-1 personalized study abroad counseling session with certified education advisors.',
  alternates: {
    canonical: '/counseling',
  },
};

export default function CounselingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
