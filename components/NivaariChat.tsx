'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MapPin, Send, Sparkles, User, X } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface NivaariChatProps {
  isOpen: boolean;
  onClose: () => void;
  contextLocation?: { lat: number; lng: number } | null;
}

const quickPrompts = [
  'This building is a hospital and it is crowded.',
  'There is flooding on this route.',
  'This tile should be residential, not commercial.',
];

export default function NivaariChat({ isOpen, onClose, contextLocation }: NivaariChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'ai',
      content:
        'Describe the tile in natural language. I will convert it into a structured NIVAARI report with category, services, risks, and confidence.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const locationLabel = useMemo(() => {
    if (!contextLocation) return 'Tile location not attached';
    return `Location attached: ${contextLocation.lat.toFixed(4)}, ${contextLocation.lng.toFixed(4)}`;
  }, [contextLocation]);

  const submitMessage = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: buildStructuredReply(trimmed, contextLocation),
        },
      ]);
      setLoading(false);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex h-[34rem] w-[24rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#07131a]/96 text-white shadow-[0_22px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10">
            <Sparkles className="h-4 w-4 text-cyan-200" />
          </div>
          <div>
            <p className="text-sm font-semibold">NIVAARI AI</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">field data assistant</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-white/10 px-4 py-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cyan-200" />
          <span>{locationLabel}</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'ai' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-500/10">
                <Bot className="h-4 w-4 text-cyan-200" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'border border-white/10 bg-white/5 text-slate-100'
              }`}
            >
              {message.content}
            </div>
            {message.role === 'user' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <User className="h-4 w-4 text-slate-200" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-500/10">
              <Bot className="h-4 w-4 text-cyan-200" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Structuring report
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => submitMessage(prompt)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-left text-[11px] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe a tile, service, risk, or correction..."
            className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 w-11 rounded-2xl bg-cyan-600 p-0 hover:bg-cyan-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function buildStructuredReply(input: string, contextLocation?: { lat: number; lng: number } | null) {
  const normalized = input.toLowerCase();
  const category = normalized.includes('hospital')
    ? 'health'
    : normalized.includes('flood')
      ? 'disaster'
      : normalized.includes('residential')
        ? 'residential'
        : normalized.includes('road') || normalized.includes('train') || normalized.includes('traffic')
          ? 'transportation'
          : 'services';

  const type = normalized.includes('hospital')
    ? 'hospital'
    : normalized.includes('flood')
      ? 'flooding'
      : normalized.includes('residential')
        ? 'land usage correction'
        : normalized.includes('traffic')
          ? 'traffic load'
          : 'field report';

  const attributes =
    category === 'health'
      ? '"crowd_level":"high","emergency_services":true,"public":true'
      : category === 'disaster'
        ? '"severity":"elevated","route_access":"limited"'
        : category === 'residential'
          ? '"requested_zone":"residential","change_type":"tile correction"'
          : '"verification_status":"needs_review"';

  const location = contextLocation
    ? `"location":{"lat":${contextLocation.lat.toFixed(4)},"lng":${contextLocation.lng.toFixed(4)}}`
    : '"location":{"source":"manual"}';

  return `Structured report draft:
{
  "category": "${category}",
  "type": "${type}",
  ${location},
  "attributes": { ${attributes} },
  "confidence": 0.84
}

Next questions:
- confirm service availability
- confirm zone classification
- submit for verification voting`;
}
