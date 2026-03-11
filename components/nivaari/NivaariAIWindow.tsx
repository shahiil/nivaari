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
    <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-slate-900 border border-blue-500/50 rounded-lg flex flex-col pointer-events-auto">
      <div className="px-3 py-2 bg-slate-800 text-white font-bold">AI Assistant</div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
        {chatHistory.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-2 rounded ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white flex items-center'}`}>
              {message.role === 'ai' && <span className="mr-1">🤖</span>}
              <pre className="whitespace-pre-wrap">{message.text}</pre>
            </div>
          </div>
        ))}
      </div>
      <div className="flex p-2">
        <input
          className="flex-1 bg-slate-800 text-white p-1 rounded-l"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
        <button className="bg-blue-500 text-white px-3 rounded-r" onClick={handleSubmit}>
          Send
        </button>
      </div>
    </div>
  );
}
