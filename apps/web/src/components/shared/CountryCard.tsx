import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, GraduationCap } from 'lucide-react';
import Image from 'next/image';

interface CountryCardProps {
  country: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    flag_code: string | null;
    universities: { count: number }[];
  };
}

export function CountryCard({ country }: CountryCardProps) {
  const uniCount = country.universities?.[0]?.count || 0;

  return (
    <Link href={`/destinations/${country.slug}`} className="group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200">
        <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
          {country.image_url ? (
            <Image
              src={country.image_url}
              alt={country.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            {country.flag_code && (
              <div className="h-8 w-12 rounded overflow-hidden shadow-sm">
                <Image
                  src={`https://flagcdn.com/w80/${country.flag_code.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  width={48}
                  height={32}
                  className="object-cover h-full w-full"
                />
              </div>
            )}
            <h2 className="text-2xl font-bold text-white">{country.name}</h2>
          </div>
        </div>
        
        <CardContent className="pt-6">
          <p className="text-slate-600 line-clamp-3 text-sm mb-4">
            {country.description || `Study in the ${country.name} and experience world-class education with rich cultural heritage.`}
          </p>
          
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 w-fit px-3 py-1.5 rounded-full">
            <GraduationCap className="h-4 w-4" />
            <span>
              {uniCount} Partner {uniCount === 1 ? 'University' : 'Universities'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
