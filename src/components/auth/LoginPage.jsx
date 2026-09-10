import React, { useState } from 'react';
import { Lock, User, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Building2, KeyRound, AlertCircle } from 'lucide-react';
import usersData from '../../data/users.json';

export const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Harap masukkan username Anda.');
      return;
    }

    if (!password) {
      setErrorMsg('Harap masukkan kata sandi akun SILOKA Anda.');
      return;
    }

    setIsLoading(true);

    // Simulate authentic API authentication delay
    setTimeout(() => {
      const inputClean = username.trim().toLowerCase();
      const withDomain = inputClean.includes('@') ? inputClean : `${inputClean}@unsil.ac.id`;

      // Find matching user from mock data or default to first user
      const matchedUser = usersData.find(
        (u) =>
          u.email.toLowerCase() === inputClean ||
          u.username.toLowerCase() === inputClean ||
          u.email.toLowerCase() === withDomain ||
          u.username.toLowerCase() === withDomain ||
          u.nip === username.trim()
      );

      setIsLoading(false);

      if (matchedUser) {
        onLoginSuccess(matchedUser);
      } else {
        // Allow demo login with any credentials or provide default executive user
        const defaultUser = usersData[0];
        onLoginSuccess({
          ...defaultUser,
          name: inputClean.includes('@') ? inputClean.split('@')[0].replace('.', ' ') : inputClean,
          email: inputClean.includes('@') ? inputClean : `${inputClean}@unsil.ac.id`,
          username: inputClean.includes('@') ? inputClean : `${inputClean}@unsil.ac.id`,
        });
      }
    }, 600);
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Left Branding Hero Section */}
      <div className="w-full md:w-5/12 lg:w-1/2 relative bg-gradient-to-br from-unsil-green-950 via-unsil-green-900 to-slate-950 p-8 md:p-14 flex flex-col justify-between overflow-hidden text-white border-r border-unsil-green-800/40">
        {/* Decorative Background Accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-unsil-green-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-unsil-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Top Bureau Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-6">
            <div
              className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-xl border border-unsil-gold-400/50 flex items-center justify-center select-none protected-asset"
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
            <div>
              <span className="text-[11px] font-bold tracking-widest text-unsil-gold-400 uppercase">
                Universitas Siliwangi
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SILOKA
                <span className="text-xs px-2 py-0.5 rounded bg-unsil-gold-500 text-unsil-green-950 font-extrabold tracking-normal">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Biro Keuangan dan Umum (BKU)
              </p>
            </div>
          </div>
        </div>

        {/* Center Hero Description */}
        <div className="relative z-10 my-8 md:my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-unsil-green-800/60 border border-unsil-green-700/50 text-unsil-gold-300 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-unsil-gold-400" />
            Sistem Terintegrasi Tata Kelola Birokrasi Kampus
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug mb-3">
            Layanan Organisasi, Kearsipan, dan Administrasi Persuratan
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Portal eksekutif dan operasional digital untuk percepatan alur disposisi pimpinan, validasi tanda tangan elektronik (TTE), pengendalian surat keluar-masuk, serta tata kelola retensi arsip resmi Universitas Siliwangi.
          </p>

          {/* Key Pillars */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-unsil-gold-400 font-bold text-sm">E-Disposisi & TTE</div>
              <div className="text-xs text-slate-300 mt-0.5">Alur disposisi berjenjang terverifikasi</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-unsil-gold-400 font-bold text-sm">Brankas Digital JRA</div>
              <div className="text-xs text-slate-300 mt-0.5">Arsip vital terenkripsi & Jadwal Retensi</div>
            </div>
          </div>
        </div>

        {/* Bottom Security / System Info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Server Data Center Mugarsari Aktif</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Standar BSSN & ANRI</span>
            <span>•</span>
            <span>SSL 256-Bit</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="w-full md:w-7/12 lg:w-1/2 bg-slate-900 p-8 md:p-14 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          {/* Header Card */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-unsil-green-950 text-unsil-gold-400 border border-unsil-gold-500/30 mb-3">
              <KeyRound className="w-3.5 h-3.5" />
              Autentikasi Pegawai & Pimpinan
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Masuk ke SILOKA UNSIL
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Gunakan username akun resmi Universitas Siliwangi
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unsil-gold-500/60 focus:border-unsil-gold-500 transition duration-150"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Kata Sandi
                </label>
                <a
                  href="#lupa-sandi"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Silakan hubungi Helpdesk UPT TIK UNSIL di kampus Mugarsari atau email tik@unsil.ac.id untuk reset kata sandi.');
                  }}
                  className="text-xs text-unsil-gold-400 hover:text-unsil-gold-300 hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun Anda"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-unsil-gold-500/60 focus:border-unsil-gold-500 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-unsil-green-700 bg-slate-800 focus:ring-unsil-gold-500"
                />
                <span className="text-xs text-slate-300">Ingat sesi saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-unsil-green-700 to-unsil-green-800 hover:from-unsil-green-600 hover:to-unsil-green-700 text-white font-semibold text-sm rounded-lg shadow-lg shadow-unsil-green-950/50 flex items-center justify-center gap-2 transition duration-150 transform active:scale-[0.99] border border-unsil-green-600/40"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard SILOKA</span>
                  <ArrowRight className="w-4 h-4 text-unsil-gold-300" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-slate-500">
            &copy; 2026 Biro Perencanaan, Keuangan, dan Umum - Universitas Siliwangi
          </div>
        </div>
      </div>
    </div>
  );
};

