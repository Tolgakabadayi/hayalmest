'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCheck, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

function HostLoginForm() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/host/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('hayalmest_host_token', data.token);
        localStorage.setItem('hayalmest_host_name', data.hostName);
        router.push('/host');
      } else {
        setError(data.error || 'Geçersiz PIN kodu.');
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full luxury-card rounded-3xl p-8 sm:p-10 border border-gold/40 shadow-2xl relative space-y-6">
      
      {/* Logo & Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-xl">
          <UserCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-white">
          Host & Karşılama Girişi
        </h1>
        <p className="text-xs text-meyhane-muted">
          Canlı masabaşı ve misafir yönlendirmesi için PIN korumalı erişim
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-gray-300 font-semibold uppercase tracking-wider block">
            Host PIN Kodu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-meyhane-bg border border-meyhane-border pl-10 pr-4 py-4 rounded-xl text-white text-lg text-center tracking-[0.5em] font-mono focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="text-[10px] text-meyhane-muted pt-1 text-center">
            4-6 haneli PIN kodunuzu girin
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || pin.length < 4}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span>Giriş Yapılıyor...</span>
          ) : (
            <>
              <span>Host Masasına Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 border-t border-meyhane-border/60 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>

    </div>
  );
}

export default function HostLoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-gold text-xs">Yükleniyor...</div>}>
        <HostLoginForm />
      </Suspense>
    </div>
  );
}
