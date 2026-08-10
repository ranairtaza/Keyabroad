"use client";
import { useState, useEffect } from "react";
import { FileText, Plus, Search, Filter, Download, Banknote, CheckCircle2, Clock, FileSpreadsheet, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { createClient } from "@/utils/supabase/client";

type Invoice = {
  id: string;
  invoice_number: string;
  student: string;
  date: string;
  amount: number;
  type: string;
  status: string;
  course?: string;
  payment_method?: string;
  paid_amount?: number;
  remaining_amount?: number;
  course_ending?: string;
  deadline?: string;
  received_by?: string;
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    student: "",
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: "",
    type: "Processing Fee",
    status: "Unpaid",
    course: "IELTS",
    payment_method: "Cash",
    paid_amount: "",
    remaining_amount: "",
    course_ending: "",
    deadline: "",
    received_by: ""
  });

  const supabase = createClient();

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newInvoice,
      amount: parseFloat(newInvoice.amount) || 0,
      paid_amount: parseFloat(newInvoice.paid_amount) || 0,
      remaining_amount: parseFloat(newInvoice.remaining_amount) || 0,
    };
    
    const { data, error } = await supabase.from('invoices').insert([payload]).select();
    if (error) {
      toast.error("Failed to generate invoice");
    } else if (data) {
      toast.success("Invoice generated successfully!");
      setInvoices([data[0], ...invoices]);
      setIsModalOpen(false);
      setNewInvoice({
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        student: "",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: "",
        type: "Processing Fee",
        status: "Unpaid",
        course: "IELTS",
        payment_method: "Cash",
        paid_amount: "",
        remaining_amount: "",
        course_ending: "",
        deadline: "",
        received_by: ""
      });
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.student.toLowerCase().includes(search.toLowerCase()) || 
    inv.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = invoices.reduce((acc, curr) => {
    if (curr.paid_amount) {
      return acc + curr.paid_amount;
    }
    return curr.status === "Paid" ? acc + curr.amount : acc;
  }, 0);

  const totalPending = invoices.reduce((acc, curr) => {
    if (curr.remaining_amount) {
      return acc + curr.remaining_amount;
    }
    return curr.status === "Unpaid" ? acc + curr.amount : acc;
  }, 0);

  const handleGenerate = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    const drawReceipt = (baseY: number) => {
      // Logo and Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59);
      doc.text("KeyAbroad", 105, baseY + 20, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Open the door to success", 105, baseY + 26, { align: "center" });
      
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.text("Receipt", 105, baseY + 38, { align: "center" });

      // Body text settings
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      const leftX = 20;
      const rightX = 115;
      
      // Left Column
      doc.text("Date: ", leftX, baseY + 55);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.date, leftX + 11, baseY + 55);
      
      doc.setFont("helvetica", "normal");
      doc.text("Received From: ", leftX, baseY + 65);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.student, leftX + 29, baseY + 65);
      
      doc.setFont("helvetica", "normal");
      doc.text("Course: ", leftX, baseY + 72);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.course || "N/A", leftX + 16, baseY + 72);
      
      doc.setFont("helvetica", "normal");
      doc.text("Received by: ", leftX, baseY + 79);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.received_by || "N/A", leftX + 24, baseY + 79);
      
      doc.setFont("helvetica", "normal");
      doc.text("Course Ending: ", leftX, baseY + 92);
      doc.text(invoice.course_ending || "N/A", leftX + 29, baseY + 92);
      
      doc.text("Signature: _______________________", leftX, baseY + 115);
      
      // Right Column
      doc.setFont("helvetica", "normal");
      doc.text("Total Amount: ", rightX, baseY + 55);
      doc.setFont("helvetica", "bold");
      doc.text(`${invoice.amount.toLocaleString()} Payment`, rightX + 26, baseY + 55);
      
      doc.setFont("helvetica", "normal");
      doc.text("Method: ", rightX, baseY + 65);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.payment_method || "N/A", rightX + 16, baseY + 65);
      
      doc.setFont("helvetica", "normal");
      doc.text("Paid Amount: ", rightX, baseY + 72);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.paid_amount ? invoice.paid_amount.toLocaleString() : "N/A", rightX + 25, baseY + 72);
      
      doc.setFont("helvetica", "normal");
      doc.text("Remaining Amount: ", rightX, baseY + 79);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.remaining_amount ? invoice.remaining_amount.toLocaleString() : "Nil", rightX + 35, baseY + 79);
      
      doc.setFont("helvetica", "normal");
      doc.text("Deadline: ", rightX, baseY + 92);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.deadline || "Nil", rightX + 18, baseY + 92);
      
      // Footer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Thank you for choosing KeyAbroad!", 105, baseY + 130, { align: "center" });
    };

    // Draw first receipt
    drawReceipt(0);
    
    // Draw separator line
    doc.setLineDashPattern([2, 2], 0);
    doc.line(10, 145, 200, 145);
    doc.setLineDashPattern([], 0); // reset
    
    // Draw second receipt
    drawReceipt(145);

    doc.save(`${invoice.invoice_number}.pdf`);
    toast.success("Downloaded PDF Invoice");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) {
        toast.error("Failed to delete invoice");
      } else {
        toast.success("Invoice deleted successfully");
        setInvoices(invoices.filter(inv => inv.id !== id));
      }
    }
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(invoices);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "Invoices_Report.xlsx");
    toast.success("Downloaded Excel Report");
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-7xl mx-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Invoices & Revenue</h1>
          <p className="text-slate-500">Manage student processing fees and track expected university commissions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus size={18} /> Generate Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center">
            <Banknote size={28} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Collected (Paid)</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">Rs {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Payments</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">Rs {totalPending.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Invoices</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{invoices.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by student or invoice ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading invoices...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Invoice ID</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Student</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">{invoice.invoice_number}</td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{invoice.student}</td>
                    <td className="py-4 px-6 text-slate-500">{invoice.date}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{invoice.type}</td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">Rs {invoice.amount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        invoice.status === 'Paid' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {invoice.status === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleGenerate(invoice)}
                        className="text-primary hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(invoice.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors inline-flex items-center gap-1 ml-1"
                        title="Delete Invoice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={48} className="text-slate-300 mb-4" />
                        <p>No invoices found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generate Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice Number</label>
                  <input type="text" readOnly value={newInvoice.invoice_number} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
                  <input required type="text" value={newInvoice.student} onChange={e => setNewInvoice({...newInvoice, student: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course</label>
                  <input type="text" value={newInvoice.course} onChange={e => setNewInvoice({...newInvoice, course: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. IELTS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                  <select value={newInvoice.payment_method} onChange={e => setNewInvoice({...newInvoice, payment_method: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary">
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Amount (Rs)</label>
                  <input required type="number" min="0" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. 50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paid Amount (Rs)</label>
                  <input type="number" min="0" value={newInvoice.paid_amount} onChange={e => setNewInvoice({...newInvoice, paid_amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. 10000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remaining Amount (Rs)</label>
                  <input type="number" min="0" value={newInvoice.remaining_amount} onChange={e => setNewInvoice({...newInvoice, remaining_amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. 0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Received By</label>
                  <input type="text" value={newInvoice.received_by} onChange={e => setNewInvoice({...newInvoice, received_by: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. Ramsha" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Ending</label>
                  <input type="text" value={newInvoice.course_ending} onChange={e => setNewInvoice({...newInvoice, course_ending: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. 17-Aug-2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                  <input type="text" value={newInvoice.deadline} onChange={e => setNewInvoice({...newInvoice, deadline: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. Nil" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fee Type</label>
                  <select value={newInvoice.type} onChange={e => setNewInvoice({...newInvoice, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary">
                    <option value="Processing Fee">Processing Fee</option>
                    <option value="Visa Consultation">Visa Consultation</option>
                    <option value="University Deposit">University Deposit</option>
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Language Course">Language Course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary">
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-primary/20 transition-colors">
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
