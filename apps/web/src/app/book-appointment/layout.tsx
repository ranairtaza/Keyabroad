import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book an Appointment | KeyAbroad',
  description: 'Schedule an in-person or virtual consultation with our senior education consultants.',
  alternates: {
    canonical: '/book-appointment',
  },
};

export default function BookAppointmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
