"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Table, Search, Download, FileSpreadsheet, Edit3, Trash2 } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import StudentProfileModal from "@/components/StudentProfileModal";

export default function MasterRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { role, currentUser } = useRole();
  
  // Follow ups cache mapping student_id -> next follow up string
  const [followUps, setFollowUps] = useState<Record<string, string>>({});

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const canDelete = ["owner", "admin"].includes(role || "") || !!currentUser?.designation?.toLowerCase().includes("admission officer") || !!currentUser?.designation?.toLowerCase().includes("ceo");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data: studentsData, error: stuErr } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (stuErr) throw stuErr;

      // Fetch pending follow ups
      const { data: fuData, error: fuErr } = await supabase
        .from('follow_ups')
        .select('student_name, follow_up_date')
        .eq('status', 'pending');
        
      if (!fuErr && fuData) {
        const fuMap: Record<string, string> = {};
        // Ideally we would join on student_id, but follow_ups currently uses student_name
        fuData.forEach(fu => {
          fuMap[fu.student_name] = new Date(fu.follow_up_date).toLocaleDateString();
        });
        setFollowUps(fuMap);
      }

      setRecords(studentsData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error("Access Denied: Only Admin, CEO, or Admission Officer can delete records.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) toast.error(`Error deleting: ${error.message}`);
    else { toast.success("Record deleted"); fetchRecords(); }
  };

  const exportExcel = () => {
    const formattedData = filteredRecords.map((r, index) => ({
      "Sr.": r.ticket_number || index + 1,
      "V-Date": new Date(r.created_at || r.date).toLocaleDateString(),
      "Day": new Date(r.created_at || r.date).toLocaleDateString('en-US', { weekday: 'long' }),
      "Name": r.name,
      "Contact Number": r.phone,
      "Source": r.subagent_name || r.referred_by_subagent || 'Direct',
      "Purpose": r.pipeline_type || 'Visa',
      "Destination": r.target_destination || r.countries || '-',
      "Dealing person": r.counselor,
      "Profile": r.qualifications,
      "Budget": r.budget || '',
      "E-Mail": r.email || '',
      "Status": r.status || r.pipeline_type || 'Pending',
      "Follow Up": followUps[r.name] || 'None'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Master Records");
    XLSX.writeFile(workbook, "Master_Records.xlsx");
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone?.includes(searchTerm) ||
    r.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" /> Master Records
          </h2>
          <p className="text-slate-400">Google Sheets style layout for complete record management.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-64"
            />
          </div>
          
          <button 
            onClick={() => window.location.href = '/database'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" /> Add Record
          </button>
          
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            <Download className="w-5 h-5" /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Edit</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Sr.</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">V-Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Day</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Contact Number</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Purpose</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Destination</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Dealing person</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[200px]">Profile</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Budget</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">E-Mail</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Follow Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={14} className="text-center py-8 text-slate-500">Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-8 text-slate-500">No records found.</td></tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const vDate = new Date(r.created_at || r.date);
                  const isOdd = idx % 2 === 1;
                  return (
                    <tr key={r.id} className={`hover:bg-emerald-50/50 transition-colors ${isOdd ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-4 py-2 whitespace-nowrap border-r border-slate-100 flex items-center gap-2">
                        <button onClick={() => setSelectedStudent(r)} className="text-slate-400 hover:text-emerald-600 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 font-medium border-r border-slate-100">{r.ticket_number || idx + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{vDate.toLocaleDateString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{vDate.toLocaleDateString('en-US', { weekday: 'short' })}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-slate-900 border-r border-slate-100">{r.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.phone}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.subagent_name || r.referred_by_subagent || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.pipeline_type || 'Visa'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.target_destination || r.countries || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.counselor || '-'}</td>
                      <td className="px-4 py-2 text-sm text-slate-600 border-r border-slate-100 max-w-[300px] truncate" title={r.qualifications}>{r.qualifications || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.budget || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">{r.email || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-slate-100">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium uppercase">{r.status || r.pipeline_type || 'Pending'}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-amber-600">
                        {followUps[r.name] || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <StudentProfileModal 
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
          onUpdate={fetchRecords}
        />
      )}
    </div>
  );
}
