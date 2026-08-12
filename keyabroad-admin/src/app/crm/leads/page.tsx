"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLUMNS = ['New', 'Contacted', 'Qualified', 'Consultation', 'Interested'];

export default function LeadsKanbanPage() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*');
      if (data) setLeads(data);
      if (error) console.error(error);
    }
    fetchLeads();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Leads Kanban Board</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col} className="min-w-[300px] flex flex-col gap-4">
            <h2 className="font-semibold text-lg bg-slate-100 p-2 rounded">{col}</h2>
            {leads.filter(l => l.pipeline_status === col).map(lead => (
              <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{lead.first_name} {lead.last_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{lead.email}</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">Result: {lead.result_status || 'Pending'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
