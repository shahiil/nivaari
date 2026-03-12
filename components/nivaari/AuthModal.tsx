'use client';

import { useState } from 'react';
import type { UserIdentity } from '@/lib/nivaariStore';

interface AuthModalProps {
  mode: 'create' | 'recover';
  setMode: (mode: 'create' | 'recover') => void;
  generateIdentity: () => void;
  login: (id: string, key: string) => boolean;
  user: UserIdentity;
  savedCheckbox: boolean;
  setSavedCheckbox: (value: boolean) => void;
  recoverId: string;
  setRecoverId: (value: string) => void;
  recoverKey: string;
  setRecoverKey: (value: string) => void;
  onComplete: () => void;
}

export default function AuthModal({
  mode,
  setMode,
  generateIdentity,
  login,
  user,
  savedCheckbox,
  setSavedCheckbox,
  recoverId,
  setRecoverId,
  recoverKey,
  setRecoverKey,
  onComplete,
}: AuthModalProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGenerate = () => {
    generateIdentity();
    setShowCredentials(true);
  };

  const handleLogin = () => {
    const ok = login(recoverId.trim(), recoverKey.trim());
    if (!ok) {
      setLoginError('Invalid ID or recovery key');
      return;
    }
    onComplete();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8, 13, 26, 0.85)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 0 60px rgba(0,212,255,0.12), 0 24px 48px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header accent line */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, #7c3aed, transparent)' }} />

        <div className="p-8">
          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
              Welcome to Nivaari
            </h2>
            <p className="text-sm text-white/50 mt-1">Decentralized City Mapping — No KYC Required</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex mb-6 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              className="flex-1 py-2.5 text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === 'create' ? 'rgba(0,212,255,0.15)' : 'transparent',
                color: mode === 'create' ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
              }}
              onClick={() => setMode('create')}
            >
              Create Identity
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === 'recover' ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: mode === 'recover' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              }}
              onClick={() => setMode('recover')}
            >
              Recover Account
            </button>
          </div>

          {mode === 'create' ? (
            <div>
              {!showCredentials ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-white/60 leading-relaxed">
                    Nivaari requires no email, phone, or KYC. We'll generate a secure anonymous identity and recovery key only you control.
                  </p>
                  <button
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #0ea5e9)' }}
                    onClick={handleGenerate}
                  >
                    Generate Secure Identity ✦
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Social ID', value: user.socialId, color: '#00d4ff' },
                    { label: 'Recovery Key', value: user.recoveryKey, color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color }}>{label}</div>
                      <pre className="font-mono text-sm text-white/90 break-words whitespace-pre-wrap">{value}</pre>
                    </div>
                  ))}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-xs text-red-300 leading-relaxed">
                      <strong>Critical:</strong> Save your Recovery Key now. This cannot be recovered if lost.
                    </p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={savedCheckbox}
                      onChange={(event) => setSavedCheckbox(event.target.checked)}
                      className="w-4 h-4 accent-cyan-400"
                    />
                    <span className="text-sm text-white/70">I have saved my Recovery Key</span>
                  </label>
                  <button
                    className="w-full mt-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                    disabled={!savedCheckbox}
                    onClick={onComplete}
                    style={{
                      background: savedCheckbox ? 'linear-gradient(135deg, #00d4ff, #0ea5e9)' : 'rgba(255,255,255,0.06)',
                      color: savedCheckbox ? '#fff' : 'rgba(255,255,255,0.3)',
                      cursor: savedCheckbox ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Enter Map →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                placeholder="Social ID"
                value={recoverId}
                onChange={(event) => setRecoverId(event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-cyan-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <input
                placeholder="Recovery Key"
                value={recoverKey}
                onChange={(event) => setRecoverKey(event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-purple-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              {loginError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{loginError}</div>
              )}
              <button
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                onClick={handleLogin}
              >
                Login →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
