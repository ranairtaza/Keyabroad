"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function FeesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fees page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-900 border border-red-900/50 rounded-2xl max-w-2xl mx-auto mt-12">
      <AlertTriangle className="text-red-500 mb-4" size={48} />
      <h2 className="text-2xl font-bold text-white mb-2">Payment Ledger Notice</h2>
      <p className="text-slate-400 mb-4 max-w-md">
        An error was encountered while processing the payment data.
      </p>
      {error && (
        <div className="mb-6 p-4 bg-red-950/60 border border-red-800 rounded-lg text-left text-xs font-mono text-red-300 w-full overflow-auto max-h-48">
          <p className="font-bold mb-1">Details: {error.message || "Unknown error"}</p>
          {error.digest && <p className="text-slate-400">Server Digest: {error.digest}</p>}
        </div>
      )}
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-900/20"
      >
        Retry Connection
      </button>
    </div>
  );
}
