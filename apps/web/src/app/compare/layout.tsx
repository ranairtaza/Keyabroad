import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Universities | KeyAbroad',
  description: 'Compare universities, tuition fees, rankings, and requirements side-by-side to make the best choice for your studies abroad.',
  alternates: {
    canonical: '/compare',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
