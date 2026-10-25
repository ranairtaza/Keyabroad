import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team | KeyAbroad',
  description: 'Meet the experienced international education consultants and visa advisors at KeyAbroad.',
  alternates: {
    canonical: '/teams',
  },
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
