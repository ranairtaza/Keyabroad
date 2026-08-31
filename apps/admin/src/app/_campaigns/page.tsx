"use client";
import { useState } from "react";
import { Megaphone, Mail, MessageCircle, Send, Users, Filter, BarChart2, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/components/RoleContext";

export default function CampaignsPage() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    toast.success(`${activeTab === 'email' ? 'Email' : 'WhatsApp'} campaign simulated successfully!`);
    setSubject("");
    setMessage("");
    setSenderEmail("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Marketing Campaigns</h1>
          <p className="text-slate-500">Send bulk emails or WhatsApp messages to your leads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'email' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Mail size={18} /> Email Campaign
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'whatsapp' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <MessageCircle size={18} /> WhatsApp Blast
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white">
                  <option>All Active Leads</option>
                  <option>Students interested in UK</option>
                  <option>Students who haven't applied yet</option>
                  <option>Offer Received - Pending Visa</option>
                </select>
              </div>

              {activeTab === 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sender (Office Email)</label>
                    <input
                      type="email"
                      required
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="e.g., info@keyabroad.com"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white mb-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Line</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Exciting News About UK Intakes!"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {activeTab === 'whatsapp' && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm flex gap-3 items-center border border-green-200 dark:border-green-800/50">
                  <Phone size={18} className="flex-shrink-0" />
                  <div>
                    <p className="font-semibold">WhatsApp Business Integration</p>
                    <p>Campaign will be sent from your registered office number: <strong className="font-bold bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded">{currentUser?.phone || 'Not configured in profile'}</strong></p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeTab === 'email' ? "Type your email content here..." : "Type your WhatsApp message here..."}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-colors ${activeTab === 'whatsapp' ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500' : 'bg-primary hover:bg-blue-600 focus:ring-primary'} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  <Send size={18} /> Send Campaign
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="text-primary" /> Recent Campaigns
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Fall 2026 UK Intake</h4>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Email</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Sent to: 450</span>
                  <span>Opened: 68%</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Canada Visa Updates</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">WhatsApp</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Sent to: 120</span>
                  <span>Read: 95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
