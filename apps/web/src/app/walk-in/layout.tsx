import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Walk-In Registration | KeyAbroad',
  description: 'Visit our office in Kohinoor City, Faisalabad for immediate study abroad guidance and profile evaluation.',
  alternates: {
    canonical: '/walk-in',
  },
};

export default function WalkInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
