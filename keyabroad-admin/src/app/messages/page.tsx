"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Search, Send, UserCircle, Phone, Video, MoreVertical, Paperclip, Smile, MessageSquare, PhoneOff, Mic, MicOff, User, BellOff, Ban, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRole } from "@/components/RoleContext";

export default function MessagesPage() {
  const { currentUser, onlineUsers } = useRole();
  const supabase = createClient();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New states for interactive buttons
  const [showDropdown, setShowDropdown] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchContacts = async () => {
      // Fetch team members
      const { data: teamData } = await supabase.from('team_members').select('id, name, email, role, image');
      // Fetch students
      const { data: studentsData } = await supabase.from('students').select('id, full_name, email, admissions_stage');
      // Fetch profiles to get last_seen
      let profilesData: any[] = [];
      try {
        const { data } = await supabase.from('profiles').select('email, last_seen');
        profilesData = data || [];
      } catch (err) {
        console.error(err);
      }
      
      const getLastSeen = (email: string) => {
        const profile = profilesData?.find((p: any) => p.email === email);
        return profile?.last_seen || null;
      };
      
      // Fetch latest messages for currentUser to populate sidebar
      let allUserMessages: any[] = [];
      try {
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_email.eq.${currentUser.email},receiver_email.eq.${currentUser.email}`)
          .order('created_at', { ascending: false });
        allUserMessages = msgs || [];
      } catch (err) {
        console.error(err);
      }

      const getLastMessageDetails = (email: string) => {
        const chatMsgs = allUserMessages.filter(m => 
          (m.sender_email === currentUser.email && m.receiver_email === email) ||
          (m.sender_email === email && m.receiver_email === currentUser.email)
        );
        if (chatMsgs.length > 0) {
          const last = chatMsgs[0];
          return {
            text: last.content,
            time: new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUnread: last.receiver_email === currentUser.email // Very basic unread logic
          };
        }
        return { text: "Tap to view conversation", time: "", isUnread: false };
      };
      
      const teamContacts = (teamData || []).map(t => {
        const lastMsg = getLastMessageDetails(t.email);
        return {
        id: t.email,
        name: t.name,
        role: t.role,
        image: t.image || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff",
        email: t.email,
        type: 'team',
        lastMessage: lastMsg.text,
        time: lastMsg.time,
        unread: lastMsg.isUnread ? 1 : 0,
        online: onlineUsers.includes(t.email),
        last_seen: getLastSeen(t.email)
      }}).filter(c => c.email !== currentUser.email && c.email);
      
      const studentContacts = (studentsData || []).map(s => {
        const lastMsg = getLastMessageDetails(s.email);
        return {
        id: s.email,
        name: s.full_name,
        role: `Student - ${s.admissions_stage || 'Unknown'}`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.full_name || 'Student')}&background=64748B&color=fff`,
        email: s.email,
        type: 'student',
        lastMessage: lastMsg.text,
        time: lastMsg.time,
        unread: lastMsg.isUnread ? 1 : 0,
        online: onlineUsers.includes(s.email),
        last_seen: getLastSeen(s.email)
      }}).filter(c => c.email !== currentUser.email && c.email);
      
      // Sort contacts so those with recent messages appear at the top
      const allContacts = [...teamContacts, ...studentContacts].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return 0; // Simple sort for now, better to sort by actual timestamp if needed
      });
      
      setContacts(allContacts);
    };
    
    fetchContacts();

    // Global listener for new messages
    const globalChannel = supabase
      .channel('global_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.receiver_email === currentUser.email) {
            setContacts(prev => {
              const newContacts = [...prev];
              const contactIndex = newContacts.findIndex(c => c.email === newMsg.sender_email);
              if (contactIndex !== -1) {
                newContacts[contactIndex].lastMessage = newMsg.content;
                newContacts[contactIndex].time = new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // If it's not the active chat, show toast and increment unread
                // We must use activeContactId state, but it might be stale in this closure. 
                // We will rely on an effect to clear unread when activeContactId changes.
                newContacts[contactIndex].unread = 1; 
                toast.success(`New message from ${newContacts[contactIndex].name}`, { icon: '💬' });
                
                const [movedContact] = newContacts.splice(contactIndex, 1);
                newContacts.unshift(movedContact);
              }
              return newContacts;
            });
          } else if (newMsg.sender_email === currentUser.email) {
            setContacts(prev => {
              const newContacts = [...prev];
              const contactIndex = newContacts.findIndex(c => c.email === newMsg.receiver_email);
              if (contactIndex !== -1) {
                newContacts[contactIndex].lastMessage = newMsg.content;
                newContacts[contactIndex].time = new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                newContacts[contactIndex].unread = 0; // Clear unread since I replied
                const [movedContact] = newContacts.splice(contactIndex, 1);
                newContacts.unshift(movedContact);
              }
              return newContacts;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [currentUser]);

  // Clear unread count when switching to a contact
  useEffect(() => {
    if (activeContactId) {
      setContacts(prev => prev.map(c => 
        c.id === activeContactId ? { ...c, unread: 0 } : c
      ));
    }
  }, [activeContactId]);

  // Sync online state when it changes
  useEffect(() => {
    setContacts(prev => prev.map(c => ({
      ...c,
      online: onlineUsers.includes(c.email)
    })));
  }, [onlineUsers]);

  useEffect(() => {
    if (!currentUser || !activeContactId) return;

    const fetchMessages = async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          // Using IN to workaround PostgREST syntax issues with emails in OR/AND clauses
          .in('sender_email', [currentUser.email, activeContactId])
          .in('receiver_email', [currentUser.email, activeContactId])
          .order('created_at', { ascending: true });
        
        if (data) {
          // Double check filter since IN matches all combinations (e.g. sender=me AND receiver=me)
          const filteredData = data.filter(m => 
            (m.sender_email === currentUser.email && m.receiver_email === activeContactId) ||
            (m.sender_email === activeContactId && m.receiver_email === currentUser.email)
          );
          setMessages(filteredData);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      } catch (err) {
        console.error("Messages table might not exist yet.", err);
      }
    };
    
    fetchMessages();
    
    const channel = supabase
      .channel(`realtime_messages_${activeContactId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_email === currentUser.email && newMsg.receiver_email === activeContactId) ||
            (newMsg.sender_email === activeContactId && newMsg.receiver_email === currentUser.email)
          ) {
            setMessages(prev => {
              // Avoid duplicates if global listener or local insert already added it
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, activeContactId]);

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser || !activeContactId) return;
    
    const newMsg = {
      sender_email: currentUser.email,
      receiver_email: activeContactId,
      content: messageText.trim()
    };
    
    setMessageText("");
    
    const { error } = await supabase.from('messages').insert([newMsg]);
    if (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeContact = contacts.find(c => c.id === activeContactId);

  const handleDropdownAction = (action: string) => {
    setShowDropdown(false);
    if (action === 'clear') {
      toast.success('Chat history cleared locally');
    } else {
      toast.success(`${action} applied for ${activeContact?.name}`);
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setIsMuted(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex overflow-hidden relative z-10">
      
      {/* Sidebar Contacts List */}
      <div className="w-80 border-r border-slate-800 bg-slate-950/50 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors flex items-center gap-4 ${activeContactId === contact.id ? 'bg-slate-800/80 border-l-4 border-l-primary' : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'}`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                  <Image src={contact.image} alt={contact.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                </div>
                {contact.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-white font-bold text-sm truncate">{contact.name}</h3>
                  <span className="text-xs font-medium text-slate-500">{contact.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${contact.unread > 0 ? 'text-slate-300 font-semibold' : 'text-slate-500'}`}>
                    {contact.lastMessage}
                  </p>
                  {contact.unread > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeContact ? (
        <div className="flex-1 flex flex-col bg-slate-900/50">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                  <Image src={activeContact.image} alt={activeContact.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                </div>
                {activeContact.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{activeContact.name}</h3>
                <p className="text-xs font-medium">
                  {activeContact.online ? (
                    <span className="text-green-400">Online</span>
                  ) : (
                    <span className="text-slate-400">
                      Last seen: {activeContact.last_seen 
                        ? new Date(activeContact.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : "Offline"}
                    </span>
                  )}
                  <span className="text-slate-600 mx-1">•</span><span className="text-primary">{activeContact.role}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative">
              <button onClick={() => startCall('voice')} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors">
                <Phone size={18} />
              </button>
              <button onClick={() => startCall('video')} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors">
                <Video size={18} />
              </button>
              
              <div ref={dropdownRef} className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showDropdown ? 'bg-slate-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  <MoreVertical size={18} />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50"
                  >
                    <button onClick={() => handleDropdownAction('Profile')} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3">
                      <User size={16} /> View Profile
                    </button>
                    <button onClick={() => handleDropdownAction('Mute')} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3">
                      <BellOff size={16} /> Mute Notifications
                    </button>
                    <div className="h-px bg-slate-700 my-1"></div>
                    <button onClick={() => handleDropdownAction('clear')} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3">
                      <Trash2 size={16} /> Clear Chat
                    </button>
                    <button onClick={() => handleDropdownAction('Block')} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-3">
                      <Ban size={16} /> Block Contact
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-center">
              <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">Beginning of conversation</span>
            </div>
            
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-10">No messages yet. Say hello!</div>
            )}
            
            {messages.map((msg, idx) => {
              const isMine = msg.sender_email === currentUser?.email;
              const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <motion.div key={msg.id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 ${isMine ? 'justify-end' : ''}`}>
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto">
                      <Image src={activeContact.image} alt={activeContact.name} width={32} height={32} unoptimized />
                    </div>
                  )}
                  <div className={`${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-bl-sm'} px-4 py-3 rounded-2xl max-w-[70%] shadow-sm`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[10px] block mt-2 ${isMine ? 'text-blue-200 text-right' : 'text-slate-500'}`}>{msgTime}</span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/50">
            <div className="flex items-end gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-inner focus-within:border-primary/50 transition-colors">
              <button className="p-3 text-slate-400 hover:text-white transition-colors">
                <Paperclip size={20} />
              </button>
              <textarea 
                placeholder="Type your message..." 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-white text-sm focus:outline-none resize-none py-3 min-h-[44px] max-h-32"
                rows={1}
              />
              <button className="p-3 text-slate-400 hover:text-white transition-colors">
                <Smile size={20} />
              </button>
              <button onClick={sendMessage} disabled={!messageText.trim()} className="p-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                <Send size={18} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <MessageSquare size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium text-slate-400">Select a conversation to start messaging</p>
        </div>
      )}
      {/* Call Overlays */}
      {callType && activeContact && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-2xl overflow-hidden">
          
          {callType === 'video' && (
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {/* Simulated camera background */}
              <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900"></div>
            </div>
          )}

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 flex flex-col items-center"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-primary/20 rounded-full"
              ></motion.div>
              <motion.div 
                animate={{ scale: [1, 1.5, 1] }} 
                transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                className="absolute inset-0 bg-primary/10 rounded-full"
              ></motion.div>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 relative z-10">
                <Image src={activeContact.image} alt={activeContact.name} width={128} height={128} unoptimized />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">{activeContact.name}</h2>
            <p className="text-primary font-medium mb-12">
              {callType === 'video' ? 'Video calling...' : 'Calling...'}
            </p>

            <div className="flex gap-6">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button 
                onClick={() => setCallType(null)}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-lg shadow-red-500/20"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
