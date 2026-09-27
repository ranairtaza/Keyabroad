"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { createClient } from "@/lib/auth/client";

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
            .select('role, staff_role, full_name, avatar_url, designation, phone')
            .eq('email', session.user.email)
            .limit(1);
            
          if (error) console.error("Profiles error:", error);

          const profile = profiles?.[0];
          const tm = teamMembers?.[0];
          
          const profileRole = profile?.role?.trim().toLowerCase();
          const staffRole = profile?.staff_role?.trim().toLowerCase();
          const tmRole = tm?.role?.trim().toLowerCase();
          const designation = tm?.role || profile?.designation;
          
          const isOwner = 
            tmRole === 'owner' || 
            tmRole === 'super_admin' || 
            tmRole === 'super admin' || 
            tmRole === 'admin';

            setCurrentUser({
              id: session.user.id,
              name: tm?.name || profile?.full_name || session.user.email?.split('@')[0] || "User",
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

    // Request system notification permissions
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // We use a ref to prevent duplicate toasts for the same payload
    let lastNotifiedId = "";

    const handleTaskEvent = (payload: any) => {
      const newRow = payload.new;
      // Many tables use 'assignee' or 'assigned_to' or 'counselor_name'
      const assigneeName = newRow.assignee || newRow.assigned_to || newRow.counselor_name;
      
      if (newRow && assigneeName === currentUser.name) {
        // Basic deduplication to avoid double-firing
        if (lastNotifiedId !== newRow.id) {
          lastNotifiedId = newRow.id;
          
          let title = '';
          let body = '';
          let icon = '';
          const isHighPriority = newRow.priority === 'High';
          
          if (payload.table === 'crm_leads') {
            title = 'New Lead Assigned';
            body = `Lead: ${newRow.full_name || newRow.name || 'New Student'}`;
            icon = '📋';
          } else if (payload.table === 'crm_tasks') {
            if (newRow.task_type === 'follow_up') {
              title = 'New Follow-Up Assigned';
              body = `Follow-Up: ${newRow.title || newRow.description || 'New Student'}`;
              icon = '📞';
            } else {
              title = 'New Task Assigned';
              body = `Task: ${newRow.title || newRow.description || 'New Task'}`;
              icon = '📝';
            }
          }

          if (title) {
            // Show in-app toast (urgent style if high priority)
            if (isHighPriority) {
              toast.error(`URGENT: ${title} - ${body}`, { duration: 15000, icon: '🚨' });
            } else {
              toast.success(`${title} - ${body}`, { duration: 6000, icon });
            }
            
            // Show system-level notification for when tab is in background
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const notification = new Notification(isHighPriority ? '🚨 URGENT: KeyAbroad Task Assigned' : 'KeyAbroad Task Assigned', {
                  body: isHighPriority ? `URGENT\n${title}\n${body}` : `${title}\n${body}`,
                  icon: '/icon.png', // Assuming icon.png is in the public folder
                  requireInteraction: true // ALWAYS keep it on screen until user interacts
                });
                
                // Focus the window when clicked
                notification.onclick = function() {
                  window.focus();
                  this.close();
                };
              } catch (e) {
                console.error("Failed to show system notification", e);
              }
            }

            // Extreme Notification: Send an email if high priority
            if (isHighPriority && currentUser.email) {
              fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to_email: currentUser.email,
                  subject: `🚨 URGENT TASK ASSIGNED: ${title}`,
                  message: `You have been assigned a High Priority task: ${body}. Please check your KeyAbroad Dashboard immediately.`,
                  type: 'urgent_task'
                })
              }).catch(err => console.error("Failed to send urgent email", err));
            }
          }
        }
      }
    };

    const taskSubscription = supabase
      .channel('task-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_leads' }, handleTaskEvent)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'crm_leads' }, handleTaskEvent)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_tasks' }, handleTaskEvent)
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, [currentUser]);

  // Automated Background Reminder Poller
  useEffect(() => {
    if (!currentUser || !currentUser.name) return;
    
    const checkReminders = async () => {
      try {
        const now = new Date();
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);
        
        const { data, error } = await supabase
          .from('crm_tasks')
          .select('*')
          .neq('status', 'completed');
          
        let allPendingTasks = data || [];
        
        const myTasks = allPendingTasks.filter(t => (t.assignee === currentUser.name || t.assigned_to_id === currentUser.id || t.assigned_to === currentUser.name || t.counselor_name === currentUser.name));
        const remindedTasks = JSON.parse(sessionStorage.getItem('remindedTasksMap') || '{}');
        
        myTasks.forEach(task => {
          const deadline = task.deadline || task.due_date || task.follow_up_date;
          if (!deadline) return;
          
          const deadlineDate = new Date(deadline);
          const diffMinutes = Math.floor((deadlineDate.getTime() - now.getTime()) / 60000);
          
          let reminderLevel: string | null = null;
          if (diffMinutes <= 15 && diffMinutes > 10) reminderLevel = '15m';
          else if (diffMinutes <= 10 && diffMinutes > 5) reminderLevel = '10m';
          else if (diffMinutes <= 5 && diffMinutes >= 0) reminderLevel = '5m';
          else if (diffMinutes < 0 && diffMinutes >= -60) reminderLevel = 'overdue'; // Only remind once when overdue (within an hour)
          
          if (reminderLevel) {
            const taskMemory = remindedTasks[task.id] || [];
            if (!taskMemory.includes(reminderLevel)) {
              
              // Mark this level as reminded
              taskMemory.push(reminderLevel);
              remindedTasks[task.id] = taskMemory;
              sessionStorage.setItem('remindedTasksMap', JSON.stringify(remindedTasks));
              
              let title = '⏰ Upcoming Task Reminder';
              if (reminderLevel === 'overdue') title = '🚨 OVERDUE TASK';
              else title = `⏰ Task Due in ${reminderLevel.replace('m', ' Minutes')}`;

              const body = `Due: ${deadlineDate.toLocaleString()}\nTask: ${task.student_name || task.full_name || task.title || task.description || 'Pending task'}`;
              
              // In-app alert
              toast.error(`${title} - ${body}`, { duration: 15000, icon: '⏰' });
              
              // Desktop alert
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                  body: body,
                  icon: '/icon.png',
                  requireInteraction: true
                });
                notification.onclick = function() {
                  window.focus();
                  this.close();
                };
              }
              
              // Email alert
              if (currentUser.email) {
                fetch('/api/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to_email: currentUser.email,
                    subject: title,
                    message: `Reminder: ${body}. Please check your KeyAbroad Dashboard.`,
                    type: 'task_reminder'
                  })
                }).catch(err => console.error("Failed to send reminder email", err));
              }
            }
          }
        });
      } catch (err) {
        console.error("Reminder check failed:", err);
      }
    };
    
    // Check immediately, then every 60 seconds
    checkReminders();
    const intervalId = setInterval(checkReminders, 60000);
    
    return () => clearInterval(intervalId);
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
