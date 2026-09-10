import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, LogOut, Eye, EyeOff } from 'lucide-react';

export const SessionLockModal = ({
  isOpen,
  user,
  onUnlock,
  onLogout
}) => {
  if (!isOpen || !user) return null;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Harap masukkan kata sandi akun Anda.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      // Demo password check: accept anything or standard password
      if (password.length >= 3) {
        setPassword('');
        onUnlock();
      } else {
        setErrorMsg('Kata sandi tidak sesuai.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-unsil-green-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-unsil-gold-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon & Identity */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center mb-4 shadow-xl border border-unsil-gold-400/40 select-none protected-asset"
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src="/unsil-logo.png"
              alt="Logo Resmi Universitas Siliwangi"
              className="w-11 h-11 object-contain drop-shadow select-none pointer-events-none protected-asset"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-semibold border border-slate-700 mb-3">
            <Lock className="w-3.5 h-3.5 text-unsil-gold-400" />
            Sesi Kerja Terkunci
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            SILOKA - Keamanan Intranet BKU
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Layar dikunci secara otomatis demi melindungi kerahasiaan naskah dinas
          </p>

          {/* User Avatar Card */}
          <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 w-full text-left">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-unsil-green-700 select-none pointer-events-none protected-asset"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-unsil-gold-400 truncate">{user.roleLabel}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user.email} • NIP. {user.nip}</div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="w-full mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
              {errorMsg}
            </div>
          )}

          {/* Unlock Form */}
          <form onSubmit={handleUnlock} className="w-full mt-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi untuk membuka"
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unsil-gold-500/60 focus:border-unsil-gold-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Demo hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Kata sandi akun demo:</span>
              <button
                type="button"
                onClick={() => {
                  setPassword('Siloka2026@Unsil');
                  setErrorMsg('');
                }}
                className="text-unsil-gold-400 hover:text-unsil-gold-300 font-mono hover:underline font-semibold"
                title="Klik untuk isi otomatis"
              >
                Siloka2026@Unsil
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-unsil-green-700 to-unsil-green-800 hover:from-unsil-green-600 hover:to-unsil-green-700 text-white font-semibold text-xs rounded-lg shadow-lg shadow-unsil-green-950/50 flex items-center justify-center gap-2 transition transform active:scale-[0.99] border border-unsil-green-600/40"
            >
              {isVerifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Membuka Kunci...</span>
                </>
              ) : (
                <>
                  <span>Buka Kunci Layar Sesi</span>
                  <ArrowRight className="w-4 h-4 text-unsil-gold-300" />
                </>
              )}
            </button>
          </form>

          {/* Switch / Logout option */}
          <div className="mt-4 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
            <span>Bukan akun Anda?</span>
            <button
              onClick={onLogout}
              className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-medium"
            >
              <LogOut className="w-3 h-3" /> Keluar dari Sesi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

