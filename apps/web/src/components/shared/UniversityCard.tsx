import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@keyabroad/ui/components/card';
import { Badge } from '@keyabroad/ui/components/badge';
import { MapPin, GraduationCap, Trophy, Calendar } from 'lucide-react';
import { CompareButton } from './CompareButton';

interface UniversityCardProps {
  university: {
    id: string;
    name: string;
    logo_url: string | null;
    city?: string | null;
    ranking?: number | null;
    intake_months?: string[] | null;
    intakes?: string[] | null;
    gpa_requirement?: string | null;
    work_rights?: string | null;
    countries?: {
      name: string;
      slug: string;
    } | null;
  };
}

export function UniversityCard({ university }: UniversityCardProps) {
  return (
    <Link href={`/universities/${(university as any).slug}`} className="group h-full block">
      <Card className="relative h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200 hover:border-blue-300 flex flex-col">
        <CardHeader className="pb-3 items-center text-center">
          {/* Ranking badge */}
          {university.ranking && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                #{university.ranking}
              </Badge>
            </div>
          )}
          <div className="h-20 w-20 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 overflow-hidden p-2">
            {university.logo_url ? (
              <img src={university.logo_url} alt={university.name} className="h-full w-full object-contain" />
            ) : (
              <GraduationCap className="h-10 w-10 text-slate-300" />
            )}
          </div>
          <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {university.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto pt-0 pb-6 flex flex-col items-center gap-2">
          {/* Country + City */}
          <div className="flex flex-wrap gap-2 justify-center">
            {university.countries && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1.5 px-3 py-1">
                <MapPin className="h-3.5 w-3.5" />
                {university.city
                  ? `${university.city}, ${university.countries.name}`
                  : university.countries.name}
              </Badge>
            )}
          </div>

          {/* Intake months */}
          {university.intake_months && university.intake_months.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>{university.intake_months.slice(0, 3).join(' · ')}</span>
            </div>
          )}

          <div className="w-full px-4 mt-4" onClick={(e) => e.preventDefault()}>
            <CompareButton
              item={{
                id: university.id,
                name: university.name,
                type: 'university',
                country: university.countries?.name,
                logo_url: university.logo_url || undefined,
                intakes: university.intakes || university.intake_months || undefined,
                gpa_requirement: university.gpa_requirement || undefined,
                work_rights: university.work_rights || undefined,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
