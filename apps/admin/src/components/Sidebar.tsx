"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleContext";
import { useSidebar } from "./SidebarContext";
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  CheckSquare, 
  Settings, 
  LogOut, 
  BarChart3, 
  Network, 
  Database, 
  Globe, 
  Clock, 
  Receipt, 
  Star, 
  Plane, 
  FileText, 
  Cable, 
  Activity, 
  FileSpreadsheet, 
  X, 
  Calculator, 
  ChevronDown, 
  ChevronRight, 
  Banknote, 
  GraduationCap, 
  Briefcase, 
  Fingerprint,
  LucideIcon
} from "lucide-react";
import { useState, startTransition } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, role, currentUser } = useRole();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const [analyticsOpen, setAnalyticsOpen] = useState(pathname?.startsWith("/analytics") || false);
  const [hrOpen, setHrOpen] = useState(pathname?.startsWith("/hr-operations") || false);

  if (pathname.startsWith("/login") || pathname.startsWith("/feedback") || pathname.startsWith("/receipt") || pathname.startsWith("/embed")) {
    return null;
  }

  const isAccountant = currentUser?.designation?.toLowerCase().includes("accountant");
  const isIntern = currentUser?.designation?.toLowerCase().includes("intern");
  const canViewFees = role === "owner" || isAccountant;
  const canManageBlogs = !isIntern;
  const isManager = currentUser?.designation?.toLowerCase().includes("manager");
  const canViewHROps = role === "owner" || isManager;
  const isAdminOrOwner = role === "owner" || 
    Boolean(currentUser?.designation?.toLowerCase().includes("admin")) ||
    Boolean(currentUser?.designation?.toLowerCase().includes("ceo")) ||
    Boolean(currentUser?.designation?.toLowerCase().includes("founder")) ||
    Boolean(currentUser?.designation?.toLowerCase().includes("project head"));

  const analyticsSubLinks = [
    { name: "Overview", href: "/analytics" },
    { name: "Leads", href: "/analytics/leads" },
    { name: "Applications", href: "/analytics/applications" },
    { name: "Revenue", href: "/analytics/revenue" },
    { name: "Team", href: "/analytics/team" },
  ];

  // Grouped Navigation for Modern High-Contrast Clean Light layout
  const navGroups: NavGroup[] = [
    {
      category: "Core CRM & Admissions",
      items: [
        { 
          name: "Student Database", 
          href: "/database", 
          icon: Database,
          badgeBg: "bg-indigo-50 dark:bg-indigo-950/50",
          badgeText: "text-indigo-600 dark:text-indigo-400"
        },
        { 
          name: "Master Records", 
          href: "/master-records", 
          icon: FileSpreadsheet,
          badgeBg: "bg-cyan-50 dark:bg-cyan-950/50",
          badgeText: "text-cyan-600 dark:text-cyan-400"
        },
        { 
          name: "Programs", 
          href: "/programs", 
          icon: GraduationCap,
          badgeBg: "bg-blue-50 dark:bg-blue-950/50",
          badgeText: "text-blue-600 dark:text-blue-400"
        },
        { 
          name: "Leads", 
          href: "/leads", 
          icon: Users,
          badgeBg: "bg-emerald-50 dark:bg-emerald-950/50",
          badgeText: "text-emerald-600 dark:text-emerald-400"
        },
        { 
          name: "Pipeline", 
          href: "/pipeline", 
          icon: Kanban,
          badgeBg: "bg-amber-50 dark:bg-amber-950/50",
          badgeText: "text-amber-600 dark:text-amber-400"
        },
        { 
          name: "Visa Processing", 
          href: "/visas", 
          icon: Plane,
          badgeBg: "bg-rose-50 dark:bg-rose-950/50",
          badgeText: "text-rose-600 dark:text-rose-400"
        },
        { 
          name: "Appointments", 
          href: "/appointments", 
          icon: Clock,
          badgeBg: "bg-teal-50 dark:bg-teal-950/50",
          badgeText: "text-teal-600 dark:text-teal-400"
        },
      ]
    },
    ...(canViewFees || true ? [{
      category: "Finance & Funding",
      items: [
        ...(canViewFees ? [
          { 
            name: "Fees & Revenue", 
            href: "/fees", 
            icon: Receipt,
            badgeBg: "bg-emerald-50 dark:bg-emerald-950/50",
            badgeText: "text-emerald-600 dark:text-emerald-400"
          },
          { 
            name: "Invoices", 
            href: "/invoices", 
            icon: FileText,
            badgeBg: "bg-slate-100 dark:bg-slate-800",
            badgeText: "text-slate-700 dark:text-slate-300"
          },
        ] : []),
        { 
          name: "Scholarships", 
          href: "/scholarships", 
          icon: Banknote,
          badgeBg: "bg-amber-50 dark:bg-amber-950/50",
          badgeText: "text-amber-600 dark:text-amber-400"
        },
        { 
          name: "Cost Config", 
          href: "/cost-calculator-config", 
          icon: Calculator,
          badgeBg: "bg-violet-50 dark:bg-violet-950/50",
          badgeText: "text-violet-600 dark:text-violet-400"
        },
      ]
    }] : []),
    {
      category: "Operations & Workforce",
      items: [
        { 
          name: "Daily Operations", 
          href: "/operations", 
          icon: CheckSquare,
          badgeBg: "bg-sky-50 dark:bg-sky-950/50",
          badgeText: "text-sky-600 dark:text-sky-400"
        },
        { 
          name: "Tasks", 
          href: "/tasks", 
          icon: CheckSquare,
          badgeBg: "bg-blue-50 dark:bg-blue-950/50",
          badgeText: "text-blue-600 dark:text-blue-400"
        },
        { 
          name: "Attendance", 
          href: "/attendance", 
          icon: Clock,
          badgeBg: "bg-orange-50 dark:bg-orange-950/50",
          badgeText: "text-orange-600 dark:text-orange-400"
        },
        ...(isAdminOrOwner ? [{ 
          name: "Biometrics", 
          href: "/biometrics", 
          icon: Fingerprint,
          badgeBg: "bg-indigo-50 dark:bg-indigo-950/50",
          badgeText: "text-indigo-600 dark:text-indigo-400"
        }] : []),
        { 
          name: "Reviews & Feedback", 
          href: "/reviews", 
          icon: Star,
          badgeBg: "bg-amber-50 dark:bg-amber-950/50",
          badgeText: "text-amber-600 dark:text-amber-400"
        },
        { 
          name: "Careers & Hiring", 
          href: "/jobs", 
          icon: Briefcase,
          badgeBg: "bg-slate-100 dark:bg-slate-800",
          badgeText: "text-slate-700 dark:text-slate-300"
        },
        ...(canManageBlogs ? [{ 
          name: "Blogs", 
          href: "/blogs", 
          icon: Globe,
          badgeBg: "bg-teal-50 dark:bg-teal-950/50",
          badgeText: "text-teal-600 dark:text-teal-400"
        }] : []),
      ]
    },
    {
      category: "System & Management",
      items: [
        { 
          name: "Team Directory", 
          href: "/team", 
          icon: Network,
          badgeBg: "bg-purple-50 dark:bg-purple-950/50",
          badgeText: "text-purple-600 dark:text-purple-400"
        },
        { 
          name: "Integrations", 
          href: "/integrations", 
          icon: Cable,
          badgeBg: "bg-zinc-100 dark:bg-zinc-800",
          badgeText: "text-zinc-700 dark:text-zinc-300"
        },
        { 
          name: "Settings", 
          href: "/settings", 
          icon: Settings,
          badgeBg: "bg-slate-100 dark:bg-slate-800",
          badgeText: "text-slate-700 dark:text-slate-300"
        },
      ]
    }
  ];

  const getLinkClasses = (href: string, exact = true) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return `group relative flex items-center justify-start md:justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 font-medium text-sm ${
      isActive
        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-sm border border-slate-200/90 dark:border-slate-700 ring-1 ring-slate-900/5 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-600 before:rounded-r-full"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
    }`;
  };

  const getUserInitials = () => {
    if (!currentUser?.name) return "KA";
    const parts = currentUser.name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => startTransition(() => setIsSidebarOpen(false))}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside className={`fixed inset-y-0 left-0 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 w-64 md:w-20 lg:w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-r border-slate-200/90 dark:border-slate-800 h-full flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:shadow-none transition-transform duration-300 ease-in-out`}>

        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between md:justify-center lg:justify-start px-4 lg:px-6 border-b border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <Link 
            href="/" 
            onClick={() => startTransition(() => setIsSidebarOpen(false))} 
            className="inline-flex items-center gap-2.5 w-full justify-center lg:justify-start"
          >
            <img src="/keyabroad.png" alt="KeyAbroad" className="h-7 object-contain dark:hidden md:hidden lg:block" />
            <img src="/keyabroad-white.png" alt="KeyAbroad" className="h-7 object-contain hidden dark:block dark:md:hidden dark:lg:block" />
            <Globe className="w-7 h-7 text-blue-600 fill-emerald-500 hidden md:block lg:hidden" strokeWidth={1.5} />
            <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
              Admin
            </span>
          </Link>
          <button 
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800" 
            onClick={() => startTransition(() => setIsSidebarOpen(false))}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">

          {/* Section: OVERVIEW */}
          <div>
            <div className="hidden lg:block px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Overview
            </div>

            <div className="space-y-1">
              {/* Dashboard */}
              <Link 
                href="/" 
                onClick={() => startTransition(() => setIsSidebarOpen(false))} 
                className={getLinkClasses("/")} 
                title="Dashboard"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/50 group-hover:scale-105 transition-transform">
                  <LayoutDashboard size={18} />
                </div>
                <span className="md:hidden lg:inline">Dashboard</span>
              </Link>

              {/* Analytics Collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setAnalyticsOpen(!analyticsOpen)}
                  className={`w-full ${getLinkClasses("/analytics", false)} justify-between`}
                  title="Analytics"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border border-violet-100/80 dark:border-violet-900/50 group-hover:scale-105 transition-transform">
                      <BarChart3 size={18} />
                    </div>
                    <span className="md:hidden lg:inline">Analytics</span>
                  </div>
                  <span className="md:hidden lg:inline flex-shrink-0 text-slate-400">
                    {analyticsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>

                {analyticsOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-1 md:hidden lg:flex">
                    {analyticsSubLinks.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => startTransition(() => setIsSidebarOpen(false))}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors font-medium ${
                          pathname === sub.href
                            ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold"
                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Categorized Navigation Groups */}
          {navGroups.map((group) => {
            if (group.items.length === 0) return null;

            return (
              <div key={group.category} className="pt-1">
                <div className="hidden lg:block px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {group.category}
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    // Special case for HR Operations with sub-links
                    if (item.name === "HR Operations") {
                      return (
                        <div key={item.href}>
                          <button
                            type="button"
                            onClick={() => setHrOpen(!hrOpen)}
                            className={`w-full ${getLinkClasses("/hr-operations", false)} justify-between`}
                            title="HR Operations"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.badgeBg} ${item.badgeText} border border-slate-200/60 dark:border-slate-800 group-hover:scale-105 transition-transform`}>
                                <Activity size={18} />
                              </div>
                              <span className="md:hidden lg:inline">HR Operations</span>
                            </div>
                            <span className="md:hidden lg:inline flex-shrink-0 text-slate-400">
                              {hrOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          </button>

                          {hrOpen && (
                            <div className="mt-1 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-1 md:hidden lg:flex">
                              <Link href="/hr-operations" onClick={() => startTransition(() => setIsSidebarOpen(false))} className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors font-medium ${pathname === '/hr-operations' ? "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 font-semibold" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50"}`}>Dashboard</Link>
                              <Link href="/hr-operations/workforce" onClick={() => startTransition(() => setIsSidebarOpen(false))} className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors font-medium ${pathname === '/hr-operations/workforce' ? "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 font-semibold" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50"}`}>Workforce</Link>
                              <Link href="/hr-operations/leaves" onClick={() => startTransition(() => setIsSidebarOpen(false))} className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors font-medium ${pathname === '/hr-operations/leaves' ? "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 font-semibold" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50"}`}>Leaves</Link>
                              <Link href="/hr-operations/shifts" onClick={() => startTransition(() => setIsSidebarOpen(false))} className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors font-medium ${pathname === '/hr-operations/shifts' ? "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 font-semibold" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50"}`}>Shifts</Link>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => startTransition(() => setIsSidebarOpen(false))}
                        className={getLinkClasses(item.href)}
                        title={item.name}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.badgeBg} ${item.badgeText} border border-slate-200/60 dark:border-slate-800 group-hover:scale-105 transition-transform`}>
                          <Icon size={18} />
                        </div>
                        <span className="md:hidden lg:inline truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card & Sign Out Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-xs mb-2 md:hidden lg:flex">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                {getUserInitials()}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {currentUser?.name || "Team Member"}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                  {currentUser?.designation || role || "Staff"}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-start md:justify-center lg:justify-start gap-3 px-3 py-2 w-full rounded-xl text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900/50 border border-transparent transition-all font-medium text-xs"
            title="Sign Out"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
              <LogOut size={16} />
            </div>
            <span className="md:hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
