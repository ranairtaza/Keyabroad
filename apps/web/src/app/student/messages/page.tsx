"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@keyabroad/auth/client";
import { Send, User } from "lucide-react";

export default function StudentMessages() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // First fetch the student record
        const { data: studentRecord } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!studentRecord) return;

        // Find or create conversation
        const { data: existingConv } = await supabase
          .from("student_conversations")
          .select("*")
          .eq("student_id", studentRecord.id)
          .single();
          
        if (existingConv) {
          setConversation(existingConv);
        } else {
          // Attempt to create
          const { data: newConv } = await supabase
            .from("student_conversations")
            .insert({ student_id: studentRecord.id })
            .select()
            .single();
          if (newConv) setConversation(newConv);
        }
      }
    };
    init();
  }, [supabase]);

  useEffect(() => {
    if (!conversation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("student_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (!error) setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((p) => p.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !currentUser) return;

    const tempMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      sender_role: "student",
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      setSendError(null);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversation.id,
          content: tempMessage.content,
          id: tempMessage.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setSendError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  };

  if (!currentUser) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col h-[600px] shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-sky-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Your Counselor</h2>
              <p className="text-xs text-sky-600">Typically replies within 24 hours</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <p>Send a message to start chatting with your counselor.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_role === "student";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe ? "bg-primary text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? "text-primary-foreground/70" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
          {sendError && (
            <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {sendError}
            </div>
          )}
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
