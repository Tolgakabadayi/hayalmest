'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Utensils, Lock, ArrowRight, AlertCircle, ArrowLeft, Delete } from 'lucide-react';

function WaiterLoginForm() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('PIN en az 4 haneli olmalıdır.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/waiter/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('hayalmest_waiter_token', data.token);
        localStorage.setItem('hayalmest_waiter_name', data.waiterName);
        router.push('/garson');
      } else {
        setError(data.error || 'Geçersiz garson PIN kodu.');
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="max-w-md w-full luxury-card rounded-3xl p-6 sm:p-8 border border-gold/40 shadow-2xl relative space-y-6">
      
      {/* Logo & Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-xl">
          <Utensils className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-white">
          Garson & Servis Paneli
        </h1>
        <p className="text-xs text-meyhane-muted">
          Canlı masa çağrıları, menü siparişleri ve hesap talepleri için PIN ile hızlı giriş
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PIN Display Dots / Input */}
      <div className="space-y-2 text-center">
        <label className="text-gray-300 font-semibold text-xs uppercase tracking-wider block">
          Garson PIN Kodu
        </label>
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-gold border-gold scale-125 shadow-lg shadow-gold/50'
                    : 'border-meyhane-border bg-meyhane-bg'
                }`}
              />
            );
          })}
        </div>
        <div className="text-[11px] text-meyhane-muted">
          {pin.length > 0 ? `${pin.length} / 4 hane girildi` : '4 haneli PIN kodunuzu tuşlayın'}
        </div>
      </div>

      {/* On-Screen Numeric Keypad for fast mobile tap */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKeypadPress(digit)}
            className="h-14 rounded-2xl bg-white/5 hover:bg-gold/20 active:bg-gold active:text-black border border-meyhane-border/70 hover:border-gold/50 text-white font-mono text-xl font-bold transition-all flex items-center justify-center shadow"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-14 rounded-2xl bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-500/30 text-xs font-semibold transition-all flex items-center justify-center"
        >
          Temizle
        </button>
        <button
          type="button"
          onClick={() => handleKeypadPress('0')}
          className="h-14 rounded-2xl bg-white/5 hover:bg-gold/20 active:bg-gold active:text-black border border-meyhane-border/70 hover:border-gold/50 text-white font-mono text-xl font-bold transition-all flex items-center justify-center shadow"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-gray-300 border border-meyhane-border/70 text-xs font-semibold transition-all flex items-center justify-center"
          title="Sil"
        >
          <Delete className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => handleLogin()}
        disabled={isLoading || pin.length < 4}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-600 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {isLoading ? (
          <span>Giriş Yapılıyor...</span>
        ) : (
          <>
            <span>Garson Paneline Giriş Yap</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
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

export default function WaiterLoginPage() {
  return (
    <div className="min-h-screen bg-meyhane-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-gold text-center text-xs">Yükleniyor...</div>}>
        <WaiterLoginForm />
      </Suspense>
    </div>
  );
}
