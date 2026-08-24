"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tasks page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-900 border border-red-900/50 rounded-2xl max-w-2xl mx-auto mt-12">
      <AlertTriangle className="text-red-500 mb-4" size={48} />
      <h2 className="text-2xl font-bold text-white mb-2">Unable to load tasks</h2>
      <p className="text-slate-400 mb-6 max-w-md">
        We encountered a problem while retrieving the task data from the database. 
        Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-900/20"
      >
        Retry Connection
      </button>
    </div>
  );
}
