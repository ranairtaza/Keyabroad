"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { supabase } from "@/lib/supabaseClient";
import { useRole } from "@/components/RoleContext";
import toast from "react-hot-toast";
import { DollarSign, AlertCircle, Calendar, Plus, X, Search, TrendingUp, Download, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import RevenueChart from "@/components/RevenueChart";

export default function FeesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [feeLogs, setFeeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "statements">("overview");
  
  // Payment Form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [monthsCovered, setMonthsCovered] = useState("1");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineDate, setDeadlineDate] = useState("");

  const { role, currentUser } = useRole();
  const isAccountant = currentUser?.designation?.toLowerCase().includes("accountant");
  const canViewFees = role === "owner" || isAccountant;
  


  const fetchData = async () => {
    setLoading(true);
    // Fetch students
    const { data: stdData } = await supabase.from('students').select('*').order('name');
    if (stdData) setStudents(stdData);
    
    // Fetch logs
    const { data: logData } = await supabase
      .from('fee_logs')
      .select('*, students(name, ticket_number)')
      .order('payment_date', { ascending: false });
    if (logData) setFeeLogs(logData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedStudentId) throw new Error("Please select a student");
      
      const pDate = new Date(paymentDate);
      const nextDue = deadlineDate ? new Date(deadlineDate) : new Date(pDate);
      if (!deadlineDate) {
        nextDue.setMonth(nextDue.getMonth() + parseInt(monthsCovered));
      }

      const { error } = await supabase.from('fee_logs').insert([{
        student_id: selectedStudentId,
        amount_paid: parseFloat(amountPaid),
        months_covered: parseInt(monthsCovered),
        payment_date: pDate.toISOString(),
        next_due_date: nextDue.toISOString()
      }]);

      if (error) throw error;
      
      toast.success("Payment recorded successfully!");
      setIsModalOpen(false);
      
      // Reset form
      setSelectedStudentId("");
      setAmountPaid("");
      setMonthsCovered("1");
      setDeadlineDate("");
      
      fetchData(); // refresh
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (role !== "owner") {
      toast.error("Access Denied: Only Admin or Owner can delete fee records.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this payment log?")) return;
    const { error } = await supabase.from('fee_logs').delete().eq('id', id);
    if (error) toast.error(`Error deleting: ${error.message}`);
    else { toast.success("Payment record deleted"); fetchData(); }
  };

  // Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthRevenue = feeLogs.filter(log => {
    const d = new Date(log.payment_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, log) => sum + Number(log.amount_paid), 0);

  // Get most recent next_due_date per student to find upcoming deadlines
  const latestDueDates = new Map();
  feeLogs.forEach(log => {
    if (!latestDueDates.has(log.student_id) || new Date(log.payment_date) > new Date(latestDueDates.get(log.student_id).payment_date)) {
      latestDueDates.set(log.student_id, log);
    }
  });

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const upcomingDeadlines = Array.from(latestDueDates.values()).filter(log => {
    const due = new Date(log.next_due_date);
    return due >= now && due <= sevenDaysFromNow;
  });

  const overdue = Array.from(latestDueDates.values()).filter(log => {
    const due = new Date(log.next_due_date);
    return due < now;
  });

  // Group fees by month for the statements tab
  const groupedStatements = feeLogs.reduce((acc, log) => {
    const date = new Date(log.payment_date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = { total: 0, logs: [] };
    acc[monthYear].total += Number(log.amount_paid) || 0;
    acc[monthYear].logs.push(log);
    return acc;
  }, {} as Record<string, { total: number, logs: any[] }>);

  const statementMonths = Object.keys(groupedStatements).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const generatePDFStatement = (monthStr: string, monthData: { total: number, logs: any[] }) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text("KEYABROAD", 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(`Monthly Financial Statement: ${monthStr}`, 14, 32);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text(`Total Revenue: Rs ${monthData.total.toLocaleString()}`, 14, 48);

    // Table
    const tableColumn = ["Date", "Student Name", "Ticket No.", "Months", "Amount Paid"];
    const tableRows = monthData.logs.map(log => [
      new Date(log.payment_date).toLocaleDateString(),
      log.students?.name || 'Unknown',
      log.students?.ticket_number || 'N/A',
      log.months_covered,
      `Rs ${log.amount_paid.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Slate-900
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [241, 245, 249] } // Slate-100
    });

    const finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("This is an automatically generated system document.", 14, finalY + 10);
    doc.text("Authorized by Keyabroad Admin System.", 14, finalY + 15);

    doc.save(`Keyabroad_Statement_${monthStr.replace(' ', '_')}.pdf`);
    toast.success(`Statement for ${monthStr} downloaded successfully!`);
  };

  if (!canViewFees) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <AlertCircle size={64} className="text-red-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-center max-w-md">
          This page contains sensitive financial information. It is restricted to the System Admin and Accountants only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Fees & Revenue</h2>
          <p className="text-slate-400">Track student payments and upcoming deadlines.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex space-x-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-max border border-slate-300 dark:border-slate-700">
            <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "overview" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Overview</button>
            <button onClick={() => setActiveTab("statements")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "statements" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Monthly Statements</button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow transition-all"
          >
            <Plus size={18} /> Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Hover3DWrapper intensity="subtle">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500"><DollarSign size={80} /></div>
            <span className="text-slate-400 font-medium mb-1 z-10">Revenue This Month</span>
            <span className="text-4xl font-bold text-white z-10">Rs {thisMonthRevenue.toLocaleString()}</span>
          </div>
        </Hover3DWrapper>
        <Hover3DWrapper intensity="subtle">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500"><AlertCircle size={80} /></div>
            <span className="text-slate-400 font-medium mb-1 z-10">Upcoming Deadlines (7 Days)</span>
            <span className="text-4xl font-bold text-yellow-500 z-10">{upcomingDeadlines.length} Students</span>
          </div>
        </Hover3DWrapper>
        <Hover3DWrapper intensity="subtle">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><Calendar size={80} /></div>
            <span className="text-slate-400 font-medium mb-1 z-10">Overdue Payments</span>
            <span className="text-4xl font-bold text-red-500 z-10">{overdue.length} Students</span>
          </div>
        </Hover3DWrapper>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Revenue Chart Section */}
          <Hover3DWrapper intensity="subtle">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-green-500" size={24} />
                <h3 className="text-xl font-bold text-white">7-Day Revenue Trend</h3>
              </div>
              <RevenueChart />
            </div>
          </Hover3DWrapper>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment History Log */}
          <Hover3DWrapper intensity="subtle" className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 bg-slate-950 font-bold text-white">Payment Log</div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Amount Paid</th>
                    <th className="p-4 font-semibold">Months</th>
                    <th className="p-4 font-semibold">Payment Date</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading records...</td></tr>
                  ) : feeLogs.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No payment records found.</td></tr>
                  ) : feeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{log.students?.name}</div>
                        <div className="text-xs text-slate-500">{log.students?.ticket_number}</div>
                      </td>
                      <td className="p-4 font-bold text-green-400">Rs {log.amount_paid.toLocaleString()}</td>
                      <td className="p-4 text-slate-300">{log.months_covered} Month(s)</td>
                      <td className="p-4 text-slate-400">{new Date(log.payment_date).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.open(`/receipt/${log.id}`, '_blank')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-medium border border-slate-700 transition-colors"
                          >
                            Generate Slip
                          </button>
                          <button 
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-red-500/50 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </Hover3DWrapper>

          {/* Notifications / Alerts Panel */}
          <Hover3DWrapper intensity="subtle">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
             <div className="p-4 border-b border-slate-800 bg-slate-950 font-bold text-white flex items-center gap-2">
               <AlertCircle className="text-yellow-500" size={18}/> Needs Attention
             </div>
             <div className="p-4 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar">
               {overdue.map(log => (
                 <div key={log.id} className="bg-red-900/20 border border-red-900/50 rounded-xl p-3 flex flex-col gap-1">
                   <div className="flex justify-between items-start">
                     <span className="font-bold text-white">{log.students?.name}</span>
                     <span className="text-xs bg-red-900 text-red-300 px-2 rounded-full py-0.5">Overdue</span>
                   </div>
                   <span className="text-sm text-slate-400">Due: {new Date(log.next_due_date).toLocaleDateString()}</span>
                 </div>
               ))}
               {upcomingDeadlines.map(log => (
                 <div key={log.id} className="bg-yellow-900/20 border border-yellow-900/50 rounded-xl p-3 flex flex-col gap-1">
                   <div className="flex justify-between items-start">
                     <span className="font-bold text-white">{log.students?.name}</span>
                     <span className="text-xs bg-yellow-900 text-yellow-300 px-2 rounded-full py-0.5">Upcoming</span>
                   </div>
                   <span className="text-sm text-slate-400">Due: {new Date(log.next_due_date).toLocaleDateString()}</span>
                 </div>
               ))}
               {overdue.length === 0 && upcomingDeadlines.length === 0 && (
                 <div className="text-center text-slate-500 py-6">All clear! No pending payments.</div>
               )}
             </div>
            </div>
          </Hover3DWrapper>
        </div>
      </div>
      )}

      {activeTab === "statements" && (
        <div className="space-y-8">
          {statementMonths.length === 0 && (
            <div className="text-center text-slate-500 py-12 bg-slate-900 rounded-2xl border border-slate-800">
              No financial statements available yet.
            </div>
          )}
          {statementMonths.map(month => (
            <div key={month} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <h3 className="font-bold text-white text-xl">{month} Statement</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Total Revenue:</span>
                    <span className="text-2xl font-bold text-green-400">Rs {groupedStatements[month].total.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => generatePDFStatement(month, groupedStatements[month])}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Student</th>
                      <th className="p-4 font-semibold">Amount</th>
                      <th className="p-4 font-semibold text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {groupedStatements[month].logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 text-slate-400">{new Date(log.payment_date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{log.students?.name}</div>
                          <div className="text-xs text-slate-500">{log.students?.ticket_number}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-300">Rs {log.amount_paid.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => window.open(`/receipt/${log.id}`, '_blank')}
                              className="text-primary hover:underline font-medium"
                            >
                              View Slip
                            </button>
                            <button onClick={() => handleDeleteLog(log.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-4">Record Payment</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Student</label>
                <select 
                  required
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ticket_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Amount Paid (Rs)</label>
                <input 
                  type="number" required min="0" step="0.01"
                  value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Payment Date</label>
                  <input 
                    type="date" required
                    value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Next Deadline Date</label>
                  <input 
                    type="date" required
                    value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full flex items-center justify-center">
                  {isSubmitting ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
