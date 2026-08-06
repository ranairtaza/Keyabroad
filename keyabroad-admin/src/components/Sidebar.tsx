"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleContext";
import { LayoutDashboard, Users, Kanban, CheckSquare, Settings, LogOut, BarChart3, MessageSquare, Network, Database, Globe, Clock, Receipt, Star, GraduationCap, CalendarDays, ShieldCheck, TabletSmartphone, Library, Plane, FileText, Megaphone, Zap, Cable, ShieldAlert } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, role, currentUser } = useRole();

  const isAccountant = currentUser?.designation?.toLowerCase().includes("accountant");
  const isIntern = currentUser?.designation?.toLowerCase().includes("intern");
  const canViewFees = role === "owner" || isAccountant;
  const canManageBlogs = !isIntern;
  const canViewLogs = role === "owner";

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Student Database", href: "/database", icon: Database },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Pipeline", href: "/pipeline", icon: Kanban },
    { name: "Visa Processing", href: "/visas", icon: Plane },
    { name: "Appointments", href: "/appointments", icon: CalendarDays },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Automations", href: "/automations", icon: Zap },
    { name: "Document Vault", href: "/documents", icon: ShieldCheck },
    ...(canViewFees ? [{ name: "Fees & Revenue", href: "/fees", icon: Receipt }] : []),
    ...(canViewFees ? [{ name: "Invoices", href: "/invoices", icon: FileText }] : []),
    { name: "Reviews & Feedback", href: "/reviews", icon: Star },
    ...(canManageBlogs ? [{ name: "Blogs", href: "/blogs", icon: Globe }] : []),
    { name: "Daily Operations", href: "/operations", icon: CheckSquare },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Attendance", href: "/attendance", icon: Clock },
    { name: "Team Directory", href: "/team", icon: Network },
    { name: "Integrations", href: "/integrations", icon: Cable },
    ...(canViewLogs ? [{ name: "Audit Logs", href: "/logs", icon: ShieldAlert }] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-20 md:w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col z-10 relative shadow-xl transition-all duration-300">
      <div className="h-20 flex items-center justify-center md:justify-start px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <Link href="/" className="inline-flex items-center text-3xl font-extrabold tracking-tighter text-[#222222] dark:text-white transition-colors duration-300">
          <span className="hidden md:inline">KeyAbr</span>
          <Globe className="w-7 h-7 text-[#0090ff] fill-[#65ba74] mx-[2px] md:mt-1" strokeWidth={1} />
          <span className="hidden md:inline">ad</span>
        </Link>
      </div>
      <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center justify-center md:justify-start gap-3 px-0 md:px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title={link.name}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="hidden md:inline">{link.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300 flex flex-col gap-2">
        <button 
          onClick={logout}
          className="flex items-center justify-center md:justify-start gap-3 px-0 md:px-4 py-3 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all font-medium"
          title="Sign Out"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
