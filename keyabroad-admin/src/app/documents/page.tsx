"use client";

import { useState, useEffect } from "react";
import { Folder, FileText, Search, Download, ExternalLink, ShieldCheck, Bot, ScanText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

interface StudentDoc {
  id: string;
  name: string;
  ticket_number: string;
  file_urls: string[];
}

export default function DocumentVaultPage() {
  const [studentsWithDocs, setStudentsWithDocs] = useState<StudentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState<string | null>(null);

  const handleScan = async (url: string) => {
    setScanning(url);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="font-bold text-sm">OCR Results</span>
            <span className="text-xs">{data.text}</span>
          </div>, 
          { duration: 5000 }
        );
      } else {
        toast.error(`OCR Failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Network error during OCR scan.");
    }
    setScanning(null);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('enquiries')
      .select('id, name');
      
    if (data && !error) {
      // Mock documents
      const withDocs = data.map(s => ({
        ...s,
        ticket_number: `T-${Math.floor(Math.random() * 900) + 100}`,
        file_urls: [
          'https://example.com/mock_passport.pdf',
          'https://example.com/mock_ielts.pdf'
        ]
      }));
      setStudentsWithDocs(withDocs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filtered = studentsWithDocs.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.ticket_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} /> 
            Secure Document Vault
          </h2>
          <p className="text-slate-400">Centralized storage for all student passports, transcripts, and IELTS scores.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search student..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 animate-pulse">Scanning Vault...</div>
          ) : filtered.length > 0 ? (
            filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors shadow-sm"
              >
                <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Folder size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{student.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{student.ticket_number}</span>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col gap-2 bg-slate-900/50">
                  <div className="text-xs font-semibold text-slate-500 mb-1">{student.file_urls.length} Documents Stored</div>
                  {student.file_urls.map((url, idx) => {
                    const fileName = url.split('/').pop()?.substring(0, 20) + '...';
                    return (
                      <a 
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-primary/50 group transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-blue-400" />
                          <span className="text-sm text-slate-300 font-medium group-hover:text-primary transition-colors">
                            Document {idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.preventDefault(); handleScan(url); }}
                            disabled={scanning === url}
                            className="p-2 rounded-lg bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 hover:text-purple-300 transition-colors disabled:opacity-50"
                            title="AI Scan Document (OCR)"
                          >
                            {scanning === url ? <Bot size={16} className="animate-pulse" /> : <ScanText size={16} />}
                          </button>
                          <ExternalLink size={14} className="text-slate-600 group-hover:text-primary transition-colors" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-xl">
              <Folder size={32} className="mx-auto text-slate-600 mb-4" />
              <h4 className="text-lg font-bold text-slate-400 mb-1">Vault is Empty</h4>
              <p className="text-sm text-slate-500">Upload documents via the Student Database to see them here.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
