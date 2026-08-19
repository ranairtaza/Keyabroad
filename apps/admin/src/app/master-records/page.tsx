"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/auth/legacy";
import { motion } from "framer-motion";
import { Table, Search, Download, FileSpreadsheet, Edit3, Trash2, Upload, TrendingUp, TrendingDown, Globe, BookOpen, Calendar } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import StudentProfileModal from "@/components/StudentProfileModal";

export default function MasterRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { role, currentUser } = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Follow ups cache mapping student_id -> next follow up string
  const [followUps, setFollowUps] = useState<Record<string, string>>({});

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const customColumns = useMemo(() => {
    const cols = new Set<string>();
    records.forEach(r => {
      if (r.custom_fields && typeof r.custom_fields === 'object') {
        Object.keys(r.custom_fields).forEach(k => cols.add(k));
      }
    });
    return Array.from(cols);
  }, [records]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach(r => {
      const d = new Date(r.created_at || r.date);
      if (!isNaN(d.getTime())) {
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    const sorted = Array.from(months).sort((a, b) => b.localeCompare(a));
    return sorted.length > 0 ? sorted : [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`];
  }, [records]);

  const [selectedStatsMonth, setSelectedStatsMonth] = useState<string>("");

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedStatsMonth) {
      setSelectedStatsMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedStatsMonth]);

  const analyticsStats = useMemo(() => {
    let targetYear = new Date().getFullYear();
    let targetMonth = new Date().getMonth();
    
    if (selectedStatsMonth) {
       const [y, m] = selectedStatsMonth.split('-');
       targetYear = parseInt(y, 10);
       targetMonth = parseInt(m, 10) - 1;
    }

    const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
    const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;

    let currentTotal = 0;
    let currentStudyAbroad = 0;
    let currentLanguage = 0;
    let prevTotal = 0;

    records.forEach(r => {
      const date = new Date(r.created_at || r.date);
      const isCurrent = date.getMonth() === targetMonth && date.getFullYear() === targetYear;
      const isPrev = date.getMonth() === prevMonth && date.getFullYear() === prevYear;

      if (isCurrent) {
        currentTotal++;
        const pType = (r.pipeline_type || r.target_destination || r.qualifications || '').toLowerCase();
        if (pType.includes('language') || pType.includes('ielts') || pType.includes('pte')) {
          currentLanguage++;
        } else {
          currentStudyAbroad++;
        }
      }
      if (isPrev) {
        prevTotal++;
      }
    });

    const growth = prevTotal === 0 ? 100 : Math.round(((currentTotal - prevTotal) / prevTotal) * 100);

    return { currentTotal, currentStudyAbroad, currentLanguage, prevTotal, growth };
  }, [records, selectedStatsMonth]);

  const canDelete = ["owner", "admin"].includes(role || "") || !!currentUser?.designation?.toLowerCase().includes("ceo");

  useEffect(() => {
    fetchRecords();

    // Auto-refresh polling every 15 seconds
    const intervalId = setInterval(() => {
      fetchRecords();
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  async function fetchRecords() {
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
    else { toast.success("Record deleted"); fetchRecords();    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedRows.length} records?`)) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', selectedRows);
      if (error) throw error;
      toast.success(`Successfully deleted ${selectedRows.length} records`);
      setSelectedRows([]);
      fetchRecords();
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(filteredRecords.map(r => r.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const exportExcel = () => {
    const formattedData = filteredRecords.map((r, index) => {
      const baseObj: any = {
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
      };

      if (r.custom_fields && typeof r.custom_fields === 'object') {
        Object.keys(r.custom_fields).forEach(k => {
          baseObj[k] = r.custom_fields[k] || '';
        });
      }
      return baseObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Master Records");
    XLSX.writeFile(workbook, "Master_Records.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const formattedStudents = jsonData
        .filter((row: any) => {
          const nameKey = Object.keys(row).find(k => {
            const lowerK = k.toLowerCase();
            return lowerK.includes('name') || lowerK.includes('student') || lowerK.includes('applicant') || lowerK.includes('client');
          });
          const actualNameKey = nameKey || Object.keys(row).find(k => !k.toLowerCase().includes('date') && !k.startsWith("__EMPTY"));
          
          if (!actualNameKey || !row[actualNameKey]) return false;
          const nameVal = String(row[actualNameKey]).trim();
          return nameVal !== "" && nameVal.toLowerCase() !== "unknown";
        })
        .map((row: any, index: number) => {
          let parsedDate = undefined;
          const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date'));
          if (dateKey && row[dateKey]) {
            const dateVal = row[dateKey];
            if (typeof dateVal === 'number') {
              // Excel date to JS Date
              parsedDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000)).toISOString();
            } else if (typeof dateVal === 'string') {
              // Try native JS parsing first
              const d = new Date(dateVal);
              if (!isNaN(d.getTime())) {
                parsedDate = d.toISOString();
              } else {
                // Check if DD/MM/YYYY or DD-MM-YYYY
                const parts = dateVal.split(/[-/]/);
                if (parts.length === 3) {
                  const p1 = parseInt(parts[0], 10);
                  const p2 = parseInt(parts[1], 10);
                  const p3 = parseInt(parts[2], 10);
                  if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                    let manualDate: Date;
                    if (p1 > 31) manualDate = new Date(p1, p2 - 1, p3); // YYYY-MM-DD
                    else if (p2 > 12 || p1 > 12) manualDate = new Date(p3, p2 - 1, p1); // DD-MM-YYYY
                    else manualDate = new Date(p3, p1 - 1, p2); // MM-DD-YYYY default
                    
                    if (!isNaN(manualDate.getTime())) parsedDate = manualDate.toISOString();
                  }
                }
              }
            }
          }

          const nameKey = Object.keys(row).find(k => {
            const lowerK = k.toLowerCase();
            return lowerK.includes('name') || lowerK.includes('student') || lowerK.includes('applicant') || lowerK.includes('client');
          });
          const fallbackKey = Object.keys(row).find(k => !k.startsWith("__EMPTY"));
          const actualNameKey = nameKey || fallbackKey;
          
          const standardKeys = ["sr.", "v-date", "date", "name", "student", "contact number", "e-mail", "destination", "purpose", "profile", "budget", "dealing person", "status"];
          const customFields: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            const lowerK = k.toLowerCase();
            const isStandard = standardKeys.some(sk => lowerK.includes(sk));
            if (!isStandard && !k.startsWith("__EMPTY")) {
              customFields[k] = row[k];
            }
          });

          return {
            ticket_number: row["Sr."] ? String(row["Sr."]) : `IMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${index}`,
            name: actualNameKey ? row[actualNameKey] : "Unknown",
            phone: row["Contact Number"] || "",
            email: row["E-Mail"] || "",
            target_destination: row["Destination"] || "",
            pipeline_type: row["Purpose"] || "Visa",
            qualifications: row["Profile"] || "",
            budget: row["Budget"] || "",
            counselor: row["Dealing person"] || "",
            created_at: parsedDate,
            custom_fields: customFields
          };
        });

      if (formattedStudents.length > 0) {
        const { error } = await supabase.from('students').insert(formattedStudents);
        if (error) throw error;
        toast.success(`Successfully imported ${formattedStudents.length} records!`);
        fetchRecords();
      } else {
        toast.error("No valid data found in file.");
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.phone?.includes(searchTerm) ||
      r.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const rDate = new Date(r.created_at || r.date);
    const matchesStart = startDate ? rDate >= new Date(startDate) : true;
    
    // Add 1 day to endDate to make it inclusive of the entire end date
    const endDatePlusOne = endDate ? new Date(endDate) : null;
    if (endDatePlusOne) endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
    
    const matchesEnd = endDatePlusOne ? rDate <= endDatePlusOne : true;

    return matchesSearch && matchesStart && matchesEnd;
  });

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" /> Master Records
          </h2>
          <p className="text-slate-400">Google Sheets style layout for complete record management.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">From:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">To:</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-64 text-slate-900 dark:text-white"
            />
          </div>
          
          <button 
            onClick={() => window.location.href = '/database'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" /> Add Record
          </button>
          
          {selectedRows.length > 0 && canDelete && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
            >
              <Trash2 className="w-5 h-5" /> Delete Selected ({selectedRows.length})
            </button>
          )}
          
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            <Download className="w-5 h-5" /> Export
          </button>
          
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            <Upload className="w-5 h-5" /> Import
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between shrink-0 px-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Monthly Performance Snapshot</h3>
        <select 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer"
          value={selectedStatsMonth}
          onChange={e => setSelectedStatsMonth(e.target.value)}
        >
          {availableMonths.map(m => {
            const [y, mo] = m.split('-');
            const date = new Date(parseInt(y, 10), parseInt(mo, 10) - 1);
            return <option key={m} value={m}>{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>;
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Selected Month Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsStats.currentTotal}</p>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${analyticsStats.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {analyticsStats.growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(analyticsStats.growth)}%
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Study Abroad (Month)</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{analyticsStats.currentStudyAbroad}</p>
          </div>
          <Globe className="text-indigo-200 w-8 h-8" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Languages (Month)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analyticsStats.currentLanguage}</p>
          </div>
          <BookOpen className="text-amber-200 dark:text-amber-500/20 w-8 h-8" />
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Previous Month</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{analyticsStats.prevTotal}</p>
          </div>
          <Calendar className="text-slate-200 dark:text-slate-700 w-8 h-8" />
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    checked={filteredRecords.length > 0 && selectedRows.length === filteredRecords.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
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
                {customColumns.map(c => (
                  <th key={c} className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={16 + customColumns.length} className="text-center py-8 text-slate-500">Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={16 + customColumns.length} className="text-center py-8 text-slate-500">No records found.</td></tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const vDate = new Date(r.created_at || r.date);
                  const isOdd = idx % 2 === 1;
                  return (
                    <tr key={r.id} className={`hover:bg-emerald-50/50 transition-colors ${isOdd ? 'bg-slate-50/30' : ''} ${selectedRows.includes(r.id) ? 'bg-emerald-50' : ''}`}>
                      <td className="px-4 py-2 whitespace-nowrap border-r border-slate-100">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(r.id)}
                          onChange={() => handleSelectRow(r.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {r.status || r.pipeline_type || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">
                        {followUps[r.name] ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {followUps[r.name]}
                          </span>
                        ) : '-'}
                      </td>
                      {customColumns.map(c => (
                        <td key={c} className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 border-r border-slate-100">
                          {r.custom_fields?.[c] || '-'}
                        </td>
                      ))}
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
