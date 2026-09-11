"use client";

import { Printer, Download } from "lucide-react";
import { useEffect } from "react";

export default function PrintInvoiceButton() {
  useEffect(() => {
    // If URL has #print, automatically trigger print
    if (typeof window !== "undefined" && window.location.hash === "#print") {
      setTimeout(() => {
        window.print();
      }, 400);
    }
  }, []);

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-all cursor-pointer"
        title="Print invoice or Save as PDF"
      >
        <Printer size={18} />
        <span>Print / Save as PDF</span>
      </button>
    </div>
  );
}
