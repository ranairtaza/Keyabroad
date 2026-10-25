import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | KeyAbroad',
  description: 'Get in touch with KeyAbroad for expert study abroad counseling, university admissions, and visa advice.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
