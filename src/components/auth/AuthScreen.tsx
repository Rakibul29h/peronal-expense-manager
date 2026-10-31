'use client';

import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (mode === 'login' ? login(email, password) : register(email, password));
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900">Flow</h1><p className="mt-1 text-sm text-slate-500">{mode === 'login' ? 'Log in to your account' : 'Create your account'}</p></div>
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <label className="block text-sm font-semibold text-slate-700">Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label>
        <label className="block text-sm font-semibold text-slate-700">Password<input type="password" required minLength={mode === 'register' ? 8 : 1} value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label>
        <button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}</button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full text-sm font-semibold text-indigo-600">{mode === 'login' ? 'Create a new account' : 'Already have an account? Log in'}</button>
      </form>
    </main>
  );
};
