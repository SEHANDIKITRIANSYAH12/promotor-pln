'use client';

import React, { useState } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { Zap, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, availableUsers } = usePromotor();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('NIP atau Email PLN wajib diisi');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await login(identifier, password, rememberMe);
      if (!res.success) {
        setErrorMsg(res.message || 'NIP atau kata sandi tidak cocok. Periksa kembali lalu coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan pada sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: typeof availableUsers[0]) => {
    setIdentifier(user.nip || user.email || user.role);
    setPassword(user.password || 'admin');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Kolom Kiri: Form Login */}
      <main className="flex flex-col justify-center items-center px-6 sm:px-12 py-10 min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col justify-center">
          {/* Official Logo Header */}
          <div className="mb-6 flex items-center justify-between">
            <img
              src="/pln-logo.png"
              alt="PLN UP3 Banten Selatan"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              PROMOTOR V1.0
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Masuk ke Sistem
          </h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Silakan masukkan NIP atau email PLN dan kata sandi Anda.
          </p>

          {/* Alert Box */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200/80 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nip-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                NIP / Email PLN
              </label>
              <input
                id="nip-input"
                type="text"
                placeholder="Contoh: 198503152010011001 atau nama@pln.co.id"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
              />
            </div>

            <div>
              <label htmlFor="pass-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="pass-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full h-12 pl-3.5 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <a
                href="#forgot"
                onClick={e => {
                  e.preventDefault();
                  alert('Silakan hubungi administrator unit PLN untuk reset password.');
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                Lupa kata sandi?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memeriksa akun...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          {/* Quick Login Pill Presets for easy local testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Akun Uji Coba Cepat (Klik untuk Isi):
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickFill(user)}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 text-left transition-all group"
                >
                  <span className="text-base">{user.avatar}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 truncate">
                      {user.name.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{user.roleTitle.split('/')[0]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-5">
            Belum punya akses? Hubungi admin unit Anda.
          </p>

          <div className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
            <div className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>RBAC aktif · Role Protected</span>
            </div>
            <div>PT PLN (Persero) UP3 Banten Selatan</div>
          </div>
        </div>
      </main>

      {/* Kolom Kanan: Sambutan & Background Gradien */}
      <aside className="hidden md:flex m-4 rounded-[28px] bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] text-white flex-col items-center justify-center text-center p-12 relative overflow-hidden shadow-2xl">
        {/* Lingkaran Dekorasi Lembut */}
        <div className="absolute -right-36 -top-36 w-[480px] h-[480px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -left-28 -bottom-28 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md">
          {/* Logo Card */}
          <div className="bg-white rounded-3xl p-6 mb-8 shadow-2xl shadow-blue-950/30 flex items-center justify-center border border-white/40">
            <img
              src="/pln-logo.png"
              alt="PLN UP3 Banten Selatan"
              className="h-16 w-auto object-contain"
            />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-white leading-tight">
            Selamat datang di PROMOTOR
          </h2>
          <p className="text-blue-100 text-base font-normal leading-relaxed">
            Aplikasi Project &amp; Material Control untuk monitoring penyambungan, survei, dan logistik distribusi.
          </p>

          <span className="inline-block mt-6 text-xs font-bold text-white bg-white/15 border border-white/25 px-4 py-1.5 rounded-full backdrop-blur-xs">
            Versi 1.0 · Sistem Terintegrasi
          </span>
        </div>
      </aside>
    </div>
  );
};
