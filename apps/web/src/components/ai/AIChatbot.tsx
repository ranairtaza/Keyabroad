"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'initial',
    role: 'assistant',
    content: 'Hi! I am the KeyAbroad AI Assistant. How can I help you find your dream university today?',
    timestamp: new Date().toISOString()
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // In production, this hits our secure backend which interfaces with Supabase pgvector
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages })
      });
      
      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.reply || 'Sorry, I am currently disconnected from the vector database.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Connection error. Please try again later.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all z-50 animate-bounce"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/50 flex flex-col z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between text-white shadow-md z-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight tracking-wide">KeyAbroad AI</h3>
            <p className="text-blue-100 text-xs font-medium opacity-90">Always here to help</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all relative z-10">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto space-y-5" ref={scrollRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`p-3.5 rounded-2xl max-w-[75%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <Bot size={18} />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-tl-sm flex items-center gap-1.5 h-12">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all shrink-0"
        >
          <Send className="h-5 w-5 ml-1" />
        </button>
      </form>
    </div>
  );
}
