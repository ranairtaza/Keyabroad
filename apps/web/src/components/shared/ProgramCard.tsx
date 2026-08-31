import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@keyabroad/ui/components/card';
import { GraduationCap, Clock, Banknote, Building2 } from 'lucide-react';
import { CompareButton } from './CompareButton';

interface ProgramCardProps {
  program: {
    id: string;
    name: string;
    degree_level: string | null;
    duration: string | null;
    tuition_fee: number | null;
    currency: string | null;
    intakes?: string[] | null;
    gpa_requirement?: string | null;
    work_rights?: string | null;
    universities: {
      name: string;
      id: string;
      logo_url: string | null;
      countries?: {
        name: string;
      } | null;
    } | null;
  };
}

export function ProgramCard({ program }: ProgramCardProps) {
  return (
    <Link href={`/programs/${program.universities?.id}/${(program as any).slug || program.id}`} className="group block h-full">
      <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 hover:border-blue-300 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {program.name}
          </CardTitle>
          {program.universities && (
            <div className="flex items-center gap-2 mt-2 text-slate-600 text-sm">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{program.universities.name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="mt-auto pt-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            {program.degree_level && (
              <div className="flex items-center gap-1.5 capitalize">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                {program.degree_level}
              </div>
            )}
            {program.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {program.duration}
              </div>
            )}
            {program.tuition_fee !== null && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <Banknote className="h-4 w-4" />
                {program.tuition_fee} {program.currency}
              </div>
            )}
          </div>
          
          <div onClick={(e) => e.preventDefault()}>
            <CompareButton 
              item={{
                id: program.id,
                name: program.name,
                slug: (program as any).slug,
                university_slug: program.universities?.id,
                type: 'program',
                country: program.universities?.countries?.name,
                tuition_fee: program.tuition_fee || undefined,
                currency: program.currency || undefined,
                degree_level: program.degree_level || undefined,
                duration: program.duration || undefined,
                intakes: program.intakes || undefined,
                gpa_requirement: program.gpa_requirement || undefined,
                work_rights: program.work_rights || undefined,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
