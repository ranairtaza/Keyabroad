import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <Compass className="h-24 w-24 text-primary/20 mb-8" />
      <h2 className="font-heading text-4xl font-bold text-slate-900 mb-4">Page Not Found</h2>
      <p className="text-lg text-slate-600 mb-8 max-w-md">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/destinations">Explore Destinations</Link>
        </Button>
      </div>
    </div>
  );
}
