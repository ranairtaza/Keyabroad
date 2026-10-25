import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | KeyAbroad',
  description: "Learn about KeyAbroad's mission, expert education counselors, and proven track record helping students study abroad.",
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
