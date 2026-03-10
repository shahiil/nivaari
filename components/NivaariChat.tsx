'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, X, Loader2, Sparkles, MapPin } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isAction?: boolean;
}

interface NivaariChatProps {
  isOpen: boolean;
  onClose: () => void;
  contextLocation?: { lat: number; lng: number } | null;
}

export default function NivaariChat({ isOpen, onClose, contextLocation }: NivaariChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I am Nivaari Assistant. You can tell me about issues around you or ask for area updates.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI Processing Delay
    setTimeout(() => {
      let aiResponse: Message;

      // Dummy NLP Simulation based on keywords
      const lowerInput = userMessage.content.toLowerCase();
      
      if (lowerInput.includes('pothole') || lowerInput.includes('road')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'I understand you are reporting a road issue. I am generating a structured report for the moderator team. Would you like me to attach your current location?',
          isAction: true
        };
      } else if (lowerInput.includes('traffic')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'Traffic reported. I will update the map tile data for others in your vicinity immediately.',
          isAction: true
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'Thank you for the update. Our spatial analysis engine has recorded your input to evaluate the surrounding tile infrastructure.',
        };
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,183,255,0.2)] flex flex-col overflow-hidden z-[60] animate-in slide-in-from-bottom-10">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Nivaari AI</h3>
            <p className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />
              ONLINE {contextLocation && `- LOC SECURED`}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex-shrink-0 flex items-center justify-center border border-cyan-500/30">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            )}
            
            <div className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-md ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-sm' 
                : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-sm'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              
              {/* Optional dummy action block from AI */}
              {msg.isAction && (
                <div className="mt-3 p-2 bg-black/40 rounded-lg border border-cyan-500/30">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-cyan-400 font-mono tracking-wider">ACTION PENDING</span>
                     <Button size="sm" className="h-6 text-[10px] bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                        Confirm
                     </Button>
                   </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex-shrink-0 flex items-center justify-center border border-gray-600">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex-shrink-0 flex items-center justify-center border border-cyan-500/30">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="bg-white/5 text-gray-200 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300" />
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs */}
      <div className="p-3 bg-black/60 border-t border-white/10 backdrop-blur-md">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Report issues directly to AI..."
            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder-gray-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 p-0 flex items-center justify-center text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
