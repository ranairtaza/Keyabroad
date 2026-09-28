"use client";

import { useState } from "react";
import { GraduationCap, ExternalLink, FileCheck, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@keyabroad/ui/components/card";
import { Button } from "@keyabroad/ui/components/button";
import { Badge } from "@keyabroad/ui/components/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function UniversityAccordionList({ universities, currencyCode }: { universities: any[], currencyCode: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {universities.map((uni: any) => {
        const isExpanded = expandedId === uni.id;
        
        return (
          <Card key={uni.id} className="overflow-hidden transition-all duration-300 hover:border-blue-300 bg-white shadow-sm">
            <div 
              onClick={() => toggleExpand(uni.id)}
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                  {uni.logo_url ? (
                    <img src={uni.logo_url} alt={uni.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <GraduationCap className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{uni.name}</h3>
                  <p className="text-sm text-slate-500">Click to view details</p>
                </div>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
              />
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-slate-100 bg-slate-50/50"
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          Average Tuition Fees
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-sm font-medium text-slate-600">Bachelors</span>
                            <span className="font-bold text-slate-900">{uni.avg_bachelors_tuition ? `${currencyCode || '$'}${new Intl.NumberFormat().format(uni.avg_bachelors_tuition)}/yr` : 'Varies'}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-sm font-medium text-slate-600">Masters</span>
                            <span className="font-bold text-slate-900">{uni.avg_masters_tuition ? `${currencyCode || '$'}${new Intl.NumberFormat().format(uni.avg_masters_tuition)}/yr` : 'Varies'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-blue-600" />
                          Required Documents
                        </h4>
                        {uni.required_documents && uni.required_documents.length > 0 ? (
                          <ul className="grid grid-cols-1 gap-2">
                            {uni.required_documents.map((doc: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No specific documents listed.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                      <Link href={`/cost-calculator`} className="flex-1 md:flex-none">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Calculate Total Cost
                        </Button>
                      </Link>
                      {uni.url && (
                        <a href={uni.url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
                          <Button variant="outline" className="w-full gap-2">
                            Official Website <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}
