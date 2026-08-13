import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@keyabroad/ui/components/card';
import { Badge } from '@keyabroad/ui/components/badge';
import { Banknote, Building2, MapPin, CalendarClock } from 'lucide-react';

interface ScholarshipCardProps {
  scholarship: {
    id: string;
    name: string;
    amount: number | null;
    currency: string | null;
    deadline: string | null;
    description: string | null;
    universities: {
      name: string;
      slug: string;
    } | null;
    countries: {
      name: string;
      slug: string;
    } | null;
  };
}

export function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  return (
    <Link href={`/scholarships/${scholarship.id}`} className="group block h-full">
      <Card className="h-full bg-emerald-50/20 border-emerald-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4 mb-2">
            <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
              {scholarship.name}
            </CardTitle>
            {scholarship.amount && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 shrink-0 font-bold whitespace-nowrap">
                {scholarship.amount} {scholarship.currency}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mt-2 text-slate-600 text-sm">
            {scholarship.universities && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{scholarship.universities.name}</span>
              </div>
            )}
            {scholarship.countries && !scholarship.universities && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{scholarship.countries.name}</span>
              </div>
            )}
            {scholarship.deadline && (
              <div className="flex items-center gap-2 text-amber-600">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span className="truncate">Deadline: {new Date(scholarship.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-auto pt-4">
          <p className="text-sm text-slate-500 line-clamp-3">
            {scholarship.description || "Learn more about eligibility and application requirements for this financial aid."}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
