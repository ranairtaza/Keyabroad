"use client";

import { useRole } from "./RoleContext";
import { useSidebar } from "./SidebarContext";
import { UserCircle, Settings, User, LogOut, Bell, Check, Menu } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@keyabroad/auth/client";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { currentUser, logout } = useRole();
  const { toggleSidebar } = useSidebar();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    // Request desktop notification permissions
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "denied" && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async (showToast = false) => {
      try {
        const recipients = [currentUser.name, 'Admin'];
        const res = await fetch('/api/notify/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipients })
        });
        const { notifications: data } = await res.json();
        
        if (data) {
          setNotifications(prev => {
            if (showToast && data.length > 0) {
              const newNotifs = data.filter((n: any) => !prev.find(p => p.id === n.id));
              newNotifs.forEach((newNotif: any) => {
                toast.success(newNotif.message, { duration: 5000, icon: '🔔' });
                try {
                  const audio = new Audio('/ping.mp3');
                  audio.play().catch(() => {});
                } catch (e) {}
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                  const notification = new Notification("KeyAbroad Task Update", { 
                    body: newNotif.message,
                    icon: '/icon.png',
                    requireInteraction: true
                  });
                  notification.onclick = function() {
                    window.focus();
                    this.close();
                  };
                }
              });
            }
            return data;
          });
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    
    // Initial fetch
    fetchNotifications(false);

    // Poll every 10 seconds to bypass RLS realtime limitations
    const interval = setInterval(() => fetchNotifications(true), 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    await fetch('/api/notify/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (pathname.startsWith("/login") || pathname.startsWith("/feedback") || pathname.startsWith("/receipt") || pathname.startsWith("/embed")) return null;
  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="flex justify-between md:justify-end items-center gap-2 sm:gap-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg mb-6 z-40 relative transition-colors duration-300">
      
      {/* Mobile Menu Toggle */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
      >
        <Menu size={24} />
      </button>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
      <div className="relative" ref={notificationsRef}>
        <button 
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors focus:outline-none"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          )}
        </button>

        {notificationsOpen && (
          <div className="fixed top-[70px] inset-x-4 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 transition-colors duration-300 flex flex-col max-h-[80vh] sm:max-h-96">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
              {unreadCount > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>}
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center">No notifications yet.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg mb-1 flex items-start gap-3 transition-colors ${n.is_read ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-700/30' : 'bg-primary/5 hover:bg-primary/10'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.id)} className="text-primary hover:text-blue-700 p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-700 shrink-0 transition-colors shadow-sm" title="Mark as read">
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Employee Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 pr-4 rounded-full transition-colors focus:outline-none border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{currentUser.designation}</p>
          </div>
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-lg bg-slate-100 dark:bg-slate-700">
            {currentUser.image ? (
              <Image 
                src={currentUser.image} 
                alt={currentUser.name} 
                fill 
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <UserCircle size={24} />
              </div>
            )}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-2 transition-colors duration-300">
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 mb-1 block sm:hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{currentUser.designation}</p>
            </div>
            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white flex items-center gap-3 transition-colors">
              <User size={16} /> Profile
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white flex items-center gap-3 transition-colors">
              <Settings size={16} /> Settings
            </button>
            <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
            <button 
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-3 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
