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

      // Find matching user from mock data by email, username, or NIP
      const matchedUser = usersData.find(
        (u) =>
          u.email.toLowerCase() === inputClean ||
          u.username.toLowerCase() === inputClean ||
          u.email.toLowerCase() === withDomain ||
          u.username.toLowerCase() === withDomain ||
          u.nip === username.trim() ||
          u.nip_nik === username.trim()
      );

      setIsLoading(false);

      if (matchedUser) {
        onLoginSuccess(matchedUser, rememberMe);
      } else {
        setErrorMsg(
          `Akun '${username}' tidak terdaftar di Master User UNSIL. Gunakan email resmi @unsil.ac.id (contoh: nana.sujana@unsil.ac.id atau dian.fkip@unsil.ac.id) dengan kata sandi: Siloka2026!`
        );
      }
    }, 500);
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Left Branding Hero Section */}
      <div className="w-full md:w-5/12 lg:w-1/2 relative bg-gradient-to-br from-unsil-green-950 via-unsil-green-900 to-slate-950 p-5 sm:p-8 md:p-14 flex flex-col justify-between overflow-hidden text-white border-b md:border-b-0 md:border-r border-unsil-green-800/40">
        {/* Decorative Background Accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-unsil-green-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-unsil-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Top Bureau Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 sm:gap-3.5 mb-1 md:mb-6">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1.5 shadow-xl border border-unsil-gold-400/50 flex items-center justify-center select-none protected-asset shrink-0"
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src="/unsil-logo.png"
                alt="Logo Resmi Universitas Siliwangi"
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow select-none pointer-events-none protected-asset"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-unsil-gold-400 uppercase">
                Universitas Siliwangi
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SILOKA
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-unsil-gold-500 text-unsil-green-950 font-extrabold tracking-normal">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Biro Keuangan dan Umum (BKU)
              </p>
            </div>
          </div>
        </div>

        {/* Center Hero Description - Hidden on mobile for immediate access to login */}
        <div className="hidden md:block relative z-10 my-8 md:my-auto max-w-lg">
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
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="w-full md:w-7/12 lg:w-1/2 bg-slate-900 p-5 sm:p-8 md:p-14 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          {/* Header Card */}
          <div className="mb-5 md:mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-unsil-green-950 text-unsil-gold-400 border border-unsil-gold-500/30 mb-2 sm:mb-3">
              <KeyRound className="w-3.5 h-3.5" />
              Autentikasi Pegawai & Pimpinan
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Masuk ke SILOKA UNSIL
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
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

          {/* Quick Demo Preset Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Pilih Cepat Akun Uji Coba (Demo Testing):
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setUsername('siti.rohmah@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate"
                title="Staf Operator BKU"
              >
                <span className="font-semibold text-unsil-gold-300">Staf BKU:</span> Siti Rohmah
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('nana.sujana@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate"
                title="Kepala Biro BKU (Pejabat)"
              >
                <span className="font-semibold text-emerald-400">Kepala BKU:</span> Dr. Nana S.
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('dian.fkip@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate"
                title="Staf TU FKIP"
              >
                <span className="font-semibold text-unsil-gold-300">Staf FKIP:</span> Dian Fitriani
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('cucu.suherman@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate"
                title="Dekan FKIP (Pejabat)"
              >
                <span className="font-semibold text-emerald-400">Dekan FKIP:</span> Dr. Cucu S.
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('aripin.rektor@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate"
                title="Rektor Universitas Siliwangi"
              >
                <span className="font-semibold text-amber-300">Rektorat:</span> Prof. Aripin
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('hendra.spi@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate"
                title="Ketua SPI (Pengawas)"
              >
                <span className="font-semibold text-rose-300">Pengawas:</span> Hendra (SPI)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('kepala.tik@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-indigo-950/70 hover:bg-indigo-900/80 text-slate-200 text-left border border-indigo-700/60 transition truncate col-span-1"
                title="Kepala UPA TIK (Pejabat & Process Mining)"
              >
                <span className="font-semibold text-indigo-300">Kepala TIK:</span> Alam R.
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('operator.tik@unsil.ac.id');
                  setPassword('Siloka2026!');
                }}
                className="p-1.5 rounded bg-indigo-950/70 hover:bg-indigo-900/80 text-slate-200 text-left border border-indigo-700/60 transition truncate col-span-1"
                title="Staf Admin UPA TIK (Process Mining)"
              >
                <span className="font-semibold text-indigo-300">Staf TIK:</span> Gilang R.
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-slate-500">
            &copy; 2026 Biro Keuangan dan Umum (BKU) - Universitas Siliwangi
          </div>
        </div>
      </div>
    </div>
  );
};

