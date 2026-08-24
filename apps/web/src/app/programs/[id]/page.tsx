import { getPublishedProgramById } from '@/lib/data/programs';
import { notFound, permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LegacyProgramRedirectPage({ params }: PageProps) {
  const { id } = await params;
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const program = await getPublishedProgramById(id);

  if (!program) {
    notFound();
  }

  const uni = Array.isArray(program.universities) 
    ? (program.universities[0] as any) 
    : (program.universities as any);

  if (!uni) {
    notFound();
  }

  const programSlug = (program as any).slug || program.id;
  
  // Permanent redirect to the new SEO-friendly canonical URL (HTTP 308)
  permanentRedirect(`/programs/${uni.slug}/${programSlug}`);
}
