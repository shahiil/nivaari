'use client';

import { useState } from 'react';
import { useNivaariStore } from '@/lib/nivaariStore';

export default function NivaariAIWindow() {
  const chatHistory = useNivaariStore((state) => state.chatHistory);
  const sendMessage = useNivaariStore((state) => state.sendMessage);
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const next = input.trim();
    if (!next) return;
    void sendMessage(next);
    setInput('');
  };

  return (
    <div
      className="fixed bottom-24 right-4 w-80 flex flex-col pointer-events-auto overflow-hidden rounded-2xl"
      style={{
        maxHeight: '420px',
        background: 'rgba(8,13,26,0.95)',
        border: '1px solid rgba(0,212,255,0.2)',
        boxShadow: '0 0 40px rgba(0,212,255,0.1), 0 16px 32px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,212,255,0.05)' }}
      >
        <span className="text-base">🤖</span>
        <span className="text-sm font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Nivaari AI</span>
        <span className="ml-auto flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-white/40">online</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 0, maxHeight: '280px' }}>
        {chatHistory.length === 0 && (
          <div className="text-center text-xs text-white/30 py-6">Ask me anything about this city sector…</div>
        )}
        {chatHistory.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={
                message.role === 'user'
                  ? { background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.3)', color: '#e0f8ff' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }
              }
            >
              <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 p-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <input
          className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          placeholder="Ask about this area…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') handleSubmit(); }}
        />
        <button
          className="w-8 h-8 flex items-center justify-center rounded-xl text-white text-sm transition-all duration-200 hover:opacity-80 active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #0ea5e9)' }}
          onClick={handleSubmit}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
