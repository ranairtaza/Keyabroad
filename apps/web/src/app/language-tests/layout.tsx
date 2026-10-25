import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Language Proficiency Tests (IELTS & PTE) | KeyAbroad',
  description: 'Prepare for IELTS, PTE, and Duolingo English tests with KeyAbroad expert coaching and study materials.',
  alternates: {
    canonical: '/language-tests',
  },
};

export default function LanguageTestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
