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
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
      <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h3 className="font-semibold">KeyAbroad AI</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4" ref={scrollRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[75%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm rounded-tl-sm flex gap-1">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isTyping}
          className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
