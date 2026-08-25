"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleContext";
import { useSidebar } from "./SidebarContext";
import { LayoutDashboard, Users, Kanban, CheckSquare, Settings, LogOut, BarChart3, Network, Database, Globe, Clock, Receipt, Star, Plane, FileText, Megaphone, Zap, Cable, Activity, FileSpreadsheet, X, Building, Calculator, ChevronDown, ChevronRight, Banknote } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, role, currentUser } = useRole();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const [analyticsOpen, setAnalyticsOpen] = useState(pathname.startsWith("/analytics"));

  if (pathname.startsWith("/login") || pathname.startsWith("/feedback") || pathname.startsWith("/receipt") || pathname.startsWith("/embed")) return null;

  const isAccountant = currentUser?.designation?.toLowerCase().includes("accountant");
  const isIntern = currentUser?.designation?.toLowerCase().includes("intern");
  const canViewFees = role === "owner" || isAccountant;
  const canManageBlogs = !isIntern;
  const isManager = currentUser?.designation?.toLowerCase().includes("manager");
  const canViewHROps = role === "owner" || isManager;

  const analyticsSubLinks = [
    { name: "Overview", href: "/analytics" },
    { name: "Leads", href: "/analytics/leads" },
    { name: "Applications", href: "/analytics/applications" },
    { name: "Revenue", href: "/analytics/revenue" },
    { name: "Team", href: "/analytics/team" },
  ];

  const links = [
    { name: "Student Database", href: "/database", icon: Database },
    { name: "Master Records", href: "/master-records", icon: FileSpreadsheet },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Pipeline", href: "/pipeline", icon: Kanban },
    { name: "Visa Processing", href: "/visas", icon: Plane },
    { name: "Appointments", href: "/appointments", icon: Clock },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Automations", href: "/automations", icon: Zap },
    ...(canViewFees ? [{ name: "Fees & Revenue", href: "/fees", icon: Receipt }] : []),
    ...(canViewFees ? [{ name: "Invoices", href: "/invoices", icon: FileText }] : []),
    ...(canViewFees ? [{ name: "Commissions", href: "/commissions", icon: Building }] : []),
    { name: "Reviews & Feedback", href: "/reviews", icon: Star },
    ...(canManageBlogs ? [{ name: "Blogs", href: "/blogs", icon: Globe }] : []),
    { name: "Daily Operations", href: "/operations", icon: CheckSquare },
    { name: "Scholarships & Funding", href: "/scholarships", icon: Banknote },
    { name: "Cost Config", href: "/cost-calculator-config", icon: Calculator },
    ...(canViewHROps ? [{ name: "HR Operations", href: "/hr-operations", icon: Activity }] : []),
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Attendance", href: "/attendance", icon: Clock },
    { name: "Team Directory", href: "/team", icon: Network },
    { name: "Integrations", href: "/integrations", icon: Cable },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const linkClass = (href: string, exact = true) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return `flex items-center justify-start md:justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
      isActive
        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50"
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
    }`;
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 w-64 md:w-20 lg:w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col z-50 shadow-2xl md:shadow-xl transition-transform duration-300 ease-in-out`}>

        <div className="h-20 flex items-center justify-between md:justify-center lg:justify-start px-4 lg:px-8 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className="inline-flex items-center w-full justify-center lg:justify-start">
            <img src="/keyabroad.png" alt="KeyAbroad" className="h-7 lg:h-8 object-contain dark:hidden md:hidden lg:block" />
            <img src="/keyabroad-white.png" alt="KeyAbroad" className="h-7 lg:h-8 object-contain hidden dark:block dark:md:hidden dark:lg:block" />
            <Globe className="w-8 h-8 text-[#0090ff] fill-[#65ba74] hidden md:block lg:hidden" strokeWidth={1} />
          </Link>
          <button className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">

          <Link href="/" onClick={() => setIsSidebarOpen(false)} className={linkClass("/")} title="Dashboard">
            <LayoutDashboard size={20} className="flex-shrink-0" />
            <span className="md:hidden lg:inline">Dashboard</span>
          </Link>

          <div>
            <button
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                pathname.startsWith("/analytics")
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Analytics"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="flex-shrink-0" />
                <span className="md:hidden lg:inline">Analytics</span>
              </div>
              <span className="md:hidden lg:inline flex-shrink-0">
                {analyticsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </span>
            </button>

            {analyticsOpen && (
              <div className="mt-1 ml-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 flex flex-col gap-0.5 md:hidden lg:flex">
                {analyticsSubLinks.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-medium ${
                      pathname === sub.href
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={linkClass(link.href)}
                title={link.name}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="md:hidden lg:inline">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
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
