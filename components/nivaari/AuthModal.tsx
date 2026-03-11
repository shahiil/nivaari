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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Welcome to NIVAARI - Decentralized Mapping</h2>
        <div className="flex mb-4">
          <button className={`flex-1 py-2 ${mode === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => setMode('create')}>
            Create Identity
          </button>
          <button className={`flex-1 py-2 ${mode === 'recover' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => setMode('recover')}>
            Recover Account
          </button>
        </div>
        {mode === 'create' ? (
          <div>
            {!showCredentials ? (
              <>
                <p className="mb-4">
                  NIVAARI requires no email, phone, or KYC. Click below to generate a secure identity and recovery key.
                </p>
                <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleGenerate}>
                  Generate Secure ID
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div>
                  <div className="font-bold">Social ID:</div>
                  <pre className="bg-gray-100 p-2 rounded">{user.socialId}</pre>
                </div>
                <div>
                  <div className="font-bold">Recovery Key:</div>
                  <pre className="bg-gray-100 p-2 rounded break-words">{user.recoveryKey}</pre>
                </div>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={savedCheckbox}
                    onChange={(event) => setSavedCheckbox(event.target.checked)}
                    className="mr-2"
                  />
                  I have saved my Recovery Key
                </label>
                <button
                  className={`w-full mt-4 px-4 py-2 rounded ${savedCheckbox ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                  disabled={!savedCheckbox}
                  onClick={onComplete}
                >
                  Enter Map
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              placeholder="Social ID"
              value={recoverId}
              onChange={(event) => setRecoverId(event.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="Recovery Key"
              value={recoverKey}
              onChange={(event) => setRecoverKey(event.target.value)}
              className="w-full border p-2 rounded"
            />
            {loginError && <div className="text-red-500">{loginError}</div>}
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded" onClick={handleLogin}>
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
