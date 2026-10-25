import type { Metadata } from 'next';
import { languageTests } from '@/data/languageTests';

interface Props {
  params: Promise<{ test: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const testData = languageTests.find((t) => t.id === resolvedParams.test);
  if (!testData) return {};

  return {
    title: `${testData.name} Preparation & Registration | KeyAbroad`,
    description: `Complete guide and preparation for ${testData.name}. Expert coaching, practice tests, and registration assistance with KeyAbroad.`,
    alternates: {
      canonical: `/language-tests/${resolvedParams.test}`,
    },
  };
}

export default function LanguageTestDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
