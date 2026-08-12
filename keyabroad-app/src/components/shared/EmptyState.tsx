import { GraduationCap, MapPin, Building2, AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

type IconType = 'destination' | 'university' | 'program' | 'scholarship' | 'default';

interface EmptyStateProps {
  title: string;
  description: string;
  iconType?: IconType;
  action?: ReactNode;
}

export function EmptyState({ title, description, iconType = 'default', action }: EmptyStateProps) {
  const Icon = () => {
    switch (iconType) {
      case 'destination': return <MapPin className="h-12 w-12 text-slate-300" />;
      case 'university': return <Building2 className="h-12 w-12 text-slate-300" />;
      case 'program': return <GraduationCap className="h-12 w-12 text-slate-300" />;
      case 'scholarship': return <AlertCircle className="h-12 w-12 text-slate-300" />;
      default: return <AlertCircle className="h-12 w-12 text-slate-300" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <Icon />
      </div>
      <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-md">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
