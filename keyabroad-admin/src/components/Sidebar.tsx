"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleContext";
import { useSidebar } from "./SidebarContext";
import { LayoutDashboard, Users, Kanban, CheckSquare, Settings, LogOut, BarChart3, MessageSquare, Network, Database, Globe, Clock, Receipt, Star, GraduationCap, CalendarDays, ShieldCheck, TabletSmartphone, Library, Plane, FileText, Megaphone, Zap, Cable, ShieldAlert, Activity, FileSpreadsheet, X } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, role, currentUser } = useRole();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  const isAccountant = currentUser?.designation?.toLowerCase().includes("accountant");
  const isIntern = currentUser?.designation?.toLowerCase().includes("intern");
  const canViewFees = role === "owner" || isAccountant;
  const canManageBlogs = !isIntern;
  const canViewLogs = role === "owner";
  const isManager = currentUser?.designation?.toLowerCase().includes("manager");
  const canViewHROps = role === "owner" || isManager;

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Student Database", href: "/database", icon: Database },
    { name: "Master Records", href: "/master-records", icon: FileSpreadsheet },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Pipeline", href: "/pipeline", icon: Kanban },
    { name: "Visa Processing", href: "/visas", icon: Plane },
    { name: "Appointments", href: "/appointments", icon: CalendarDays },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Automations", href: "/automations", icon: Zap },
    ...(canViewFees ? [{ name: "Fees & Revenue", href: "/fees", icon: Receipt }] : []),
    ...(canViewFees ? [{ name: "Invoices", href: "/invoices", icon: FileText }] : []),
    { name: "Reviews & Feedback", href: "/reviews", icon: Star },
    ...(canManageBlogs ? [{ name: "Blogs", href: "/blogs", icon: Globe }] : []),
    { name: "Daily Operations", href: "/operations", icon: CheckSquare },
    ...(canViewHROps ? [{ name: "HR Operations", href: "/hr-operations", icon: Activity }] : []),
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Attendance", href: "/attendance", icon: Clock },
    { name: "Team Directory", href: "/team", icon: Network },
    { name: "Integrations", href: "/integrations", icon: Cable },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 w-64 md:w-20 lg:w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col z-50 shadow-2xl md:shadow-xl transition-transform duration-300 ease-in-out`}>
        <div className="h-20 flex items-center justify-between md:justify-center lg:justify-start px-4 lg:px-8 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className="inline-flex items-center text-3xl font-extrabold tracking-tighter text-[#222222] dark:text-white transition-colors duration-300">
            <span className="md:hidden lg:inline">KeyAbr</span>
            <Globe className="w-7 h-7 text-[#0090ff] fill-[#65ba74] mx-[2px] mt-1" strokeWidth={1} />
            <span className="md:hidden lg:inline">ad</span>
          </Link>
          <button 
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
      <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center justify-start md:justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title={link.name}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="md:hidden lg:inline">{link.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300 flex flex-col gap-2">
        <button 
          onClick={logout}
          className="flex items-center justify-start md:justify-center lg:justify-start gap-3 px-4 py-3 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all font-medium"
          title="Sign Out"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="md:hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </div>
    </>
  );
}
