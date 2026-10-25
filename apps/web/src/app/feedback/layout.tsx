import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Feedback | KeyAbroad',
  description: 'Share your experience with KeyAbroad and read feedback from our international students.',
  alternates: {
    canonical: '/feedback',
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
