import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services | KeyAbroad',
  description: 'Comprehensive study abroad services including admissions guidance, visa consulting, scholarship assistance, and pre-departure briefings.',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
