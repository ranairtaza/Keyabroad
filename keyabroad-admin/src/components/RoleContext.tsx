"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";

type Role = "owner" | "employee";

interface User {
  id: string;
  name: string;
  designation: string;
  image: string;
  email: string;
  role: Role;
  phone?: string;
}

interface RoleContextType {
  role: Role;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  onlineUsers: string[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      // Supabase can sometimes hang indefinitely if multiple tabs are open and fighting for locks.
      // This timeout ensures the app always loads even if auth checks hang.
      const fallbackTimer = setTimeout(() => {
        setIsLoaded(true);
      }, 2000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
        }
        
        if (session?.user) {
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('role, name, image')
            .eq('email', session.user.email)
            .limit(1);
            
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('role, full_name, avatar_url, designation, phone')
            .eq('email', session.user.email)
            .limit(1);
            
          if (error) console.error("Profiles error:", error);

          const profile = profiles?.[0];
          const tm = teamMembers?.[0];
          
          const profileRole = profile?.role?.trim().toLowerCase();
          const tmRole = tm?.role?.trim().toLowerCase();
          const designation = tm?.role || profile?.designation;
          
          const isOwner = 
            profileRole === 'admin' || 
            session.user.email === 'junaid@keyabroad.com' || 
            (tmRole && (tmRole.includes('admin') || tmRole.includes('ceo') || tmRole.includes('founder')));

          setCurrentUser({
            id: session.user.id,
            name: profile?.full_name || tm?.name || session.user.email?.split('@')[0] || "User",
            designation: designation || (isOwner ? "System Admin" : "Employee"),
            image: profile?.avatar_url || tm?.image || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff",
            email: session.user.email || "",
            role: isOwner ? "owner" : "employee",
            phone: profile?.phone || ""
          });
        }
      } catch (err) {
        console.error("Critical error in fetchUser:", err);
      } finally {
        clearTimeout(fallbackTimer);
        setIsLoaded(true);
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Realtime Presence & Last Seen Tracking
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    const presenceChannel = supabase.channel('global_presence', {
      config: { presence: { key: currentUser.email } },
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const onlineEmails = Object.keys(state);
      setOnlineUsers(onlineEmails);
    });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ email: currentUser.email, online_at: new Date().toISOString() });
        
        // Update last_seen in DB
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('email', currentUser.email);
      }
    });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.email]);

  // Realtime Notifications for Task Assignments
  useEffect(() => {
    if (!currentUser || !currentUser.name) return;

    // We use a ref to prevent duplicate toasts for the same payload
    let lastNotifiedId = "";

    const handleTaskEvent = (payload: any) => {
      const newRow = payload.new;
      if (newRow && newRow.assignee === currentUser.name) {
        // Basic deduplication to avoid double-firing
        if (lastNotifiedId !== newRow.id) {
          lastNotifiedId = newRow.id;
          
          if (payload.table === 'registrations') {
            toast.success(`New Lead Assigned: ${newRow.student_name}`, { duration: 6000, icon: '📋' });
          } else if (payload.table === 'enquiries') {
            toast.success(`Walk-In Ticket Assigned: ${newRow.full_name}`, { duration: 6000, icon: '🎫' });
          }
        }
      }
    };

    const taskSubscription = supabase
      .channel('task-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations' }, handleTaskEvent)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enquiries' }, handleTaskEvent)
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, [currentUser]);

  const login = (user: User) => {
    // Legacy mock login - now handled by supabase in /login
    setCurrentUser(user);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.href = "/login";
  };

  const updateUser = async (updates: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updates });

      // Build database payload
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.image) dbUpdates.avatar_url = updates.image;
      if (updates.designation) dbUpdates.designation = updates.designation;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

      if (Object.keys(dbUpdates).length > 0) {
        // We need the user's UUID to perform an upsert
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        dbUpdates.id = session.user.id;
        dbUpdates.email = currentUser.email;

        // Upsert creates the row if it's completely missing, defaults to using the 'id' Primary Key
        const { error } = await supabase
          .from('profiles')
          .upsert(dbUpdates, { onConflict: 'id' });
          
        if (error) {
          const errString = error.message || error.details || error.hint || error.code || JSON.stringify(error, Object.getOwnPropertyNames(error));
          toast.error(`Database error: ${errString}`);
        }
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Loading workspace...</p>
      </div>
    );
  }

  // We rely on middleware to protect routes now, so we just render children
  // The middleware will redirect to /login if there's no session.
  return (
    <RoleContext.Provider value={{ role: currentUser?.role || 'employee', currentUser, login, logout, updateUser, onlineUsers }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
