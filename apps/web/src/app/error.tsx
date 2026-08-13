'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@keyabroad/ui/components/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@keyabroad/ui/components/alert';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Alert variant="destructive" className="max-w-md text-left mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          We encountered an unexpected error while loading this page.
        </AlertDescription>
      </Alert>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
