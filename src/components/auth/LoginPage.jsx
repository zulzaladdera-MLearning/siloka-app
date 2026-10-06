import React, { useState, useEffect, useMemo } from 'react';
import { Lock, User, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Building2, KeyRound, AlertCircle } from 'lucide-react';
import usersData from '../../data/users.json';
import { isSuperAdminUser } from '../../utils/authGuards';

// 5 Akun Kanonikal Resmi Manajemen Pengguna SILOKA UNSIL (Sesuai Master Data Kepegawaian)
const CANONICAL_MANAJEMEN_PENGGUNA_USERS = [
  {
    id: 'usr-ac-01',
    nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
    email: 'agungcahyanur@unsil.ac.id',
    nip: '200008172027031001',
    nip_nik: '200008172027031001',
    role: 'STAF',
    raw_role: 'OPERATOR_UNIT',
    role_slug: 'admin_tu',
    roleLevel: 'Level 2: Pelaksana Administrasi',
    roleLabel: 'Pengadministrasi Persuratan / Tata Usaha',
    jabatan: 'Pengadministrasi Persuratan / Tata Usaha',
    unit: 'Universitas Siliwangi (Rektorat)',
    unit_kerja_id: 'UN58'
  },
  {
    id: 'usr-01',
    nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    email: 'aripin@unsil.ac.id',
    nip: '196708161996031001',
    nip_nik: '196708161996031001',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    roleLevel: 'Level 1: Pimpinan',
    roleLabel: 'Rektor Universitas Siliwangi',
    jabatan: 'Rektor Universitas Siliwangi',
    unit: 'Universitas Siliwangi (Rektorat)',
    unit_kerja_id: 'UN58'
  },
  {
    id: 'usr-dg-01',
    nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
    email: 'dedegunawan@unsil.ac.id',
    nip: '198501012010121001',
    nip_nik: '198501012010121001',
    role: 'Super Admin',
    is_super_admin: true,
    roleLevel: 'Level 0: Administrator Sistem',
    roleLabel: 'Super Administrator SILOKA UNSIL',
    jabatan: 'Super Administrator',
    unit: 'Unit Penunjang Akademik Teknologi Informasi dan Komunikasi',
    unit_kerja_id: 'UN58.32'
  },
  {
    id: 'usr-muw7evv4-1003',
    nama_lengkap: 'Prof. Dr. H. Dedi Kusmayadi, S.E., M.Si., Ak., CA., CRBC., ACPA., CPA., CRA., CRP., CSBA., ASEAN-CPA',
    email: 'dedikusmayadi@unsil.ac.id',
    nip: '196811132021211003',
    nip_nik: '196811132021211003',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    roleLevel: 'Level 1: Pimpinan',
    roleLabel: 'Wakil Rektor Bidang Akademik',
    jabatan: 'Wakil Rektor Bidang Akademik',
    unit: 'Universitas Siliwangi (Rektorat)',
    unit_kerja_id: 'UN58'
  },
  {
    id: 'usr-ar-01',
    nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
    email: 'aderustiana@unsil.ac.id',
    nip: '196801021992031002',
    nip_nik: '196801021992031002',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    roleLevel: 'Level 1: Pimpinan',
    roleLabel: 'Wakil Rektor Bidang Keuangan dan Umum',
    jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    unit: 'Universitas Siliwangi (Rektorat)',
    unit_kerja_id: 'UN58'
  }
];

export const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sinkronisasi dinamis daftar akun uji coba langsung dari modul Manajemen Pengguna
  const [demoUsers, setDemoUsers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('siloka_users_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const deletedList = JSON.parse(localStorage.getItem('siloka_deleted_user_ids') || '[]');
            const delSet = new Set(Array.isArray(deletedList) ? deletedList.map((x) => String(x).toLowerCase().trim()) : []);
            const valid = parsed.filter((u) => {
              const uId = String(u.id || '').toLowerCase();
              const uNip = String(u.nip || u.nip_nik || '').toLowerCase();
              const uEmail = String(u.email || '').toLowerCase();
              return !delSet.has(uId) && !delSet.has(uNip) && !delSet.has(uEmail);
            });
            if (valid.length > 0) return valid;
          }
        }
      } catch (e) {}
    }
    return CANONICAL_MANAJEMEN_PENGGUNA_USERS;
  });

  useEffect(() => {
    let isMounted = true;
    const syncUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: {
            'Authorization': 'Bearer superadmin-secret-token',
            'x-user-role': 'SUPER_ADMIN'
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json && Array.isArray(json.data) && json.data.length > 0) {
            const deletedList = JSON.parse(localStorage.getItem('siloka_deleted_user_ids') || '[]');
            const delSet = new Set(Array.isArray(deletedList) ? deletedList.map((x) => String(x).toLowerCase().trim()) : []);
            const valid = json.data.filter((u) => {
              const uId = String(u.id || '').toLowerCase();
              const uNip = String(u.nip || u.nip_nik || '').toLowerCase();
              const uEmail = String(u.email || '').toLowerCase();
              return !delSet.has(uId) && !delSet.has(uNip) && !delSet.has(uEmail);
            });
            if (valid.length > 0) {
              setDemoUsers(valid);
              try {
                localStorage.setItem('siloka_users_data', JSON.stringify(valid));
              } catch (e) {}
              return;
            }
          }
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('siloka_users_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
              const deletedList = JSON.parse(localStorage.getItem('siloka_deleted_user_ids') || '[]');
              const delSet = new Set(Array.isArray(deletedList) ? deletedList.map((x) => String(x).toLowerCase().trim()) : []);
              const valid = parsed.filter((u) => {
                const uId = String(u.id || '').toLowerCase();
                const uNip = String(u.nip || u.nip_nik || '').toLowerCase();
                const uEmail = String(u.email || '').toLowerCase();
                return !delSet.has(uId) && !delSet.has(uNip) && !delSet.has(uEmail);
              });
              if (valid.length > 0) {
                setDemoUsers(valid);
              }
            }
          }
        } catch (e) {}
      }
    };

    syncUsers();

    const handleStorageChange = () => {
      syncUsers();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('siloka:user-deleted', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('siloka:user-deleted', handleStorageChange);
    };
  }, []);

  // Format opsi tombol akun masuk terhubung langsung dengan profil Manajemen Pengguna
  const demoButtons = useMemo(() => {
    const list = Array.isArray(demoUsers) && demoUsers.length > 0 ? demoUsers : CANONICAL_MANAJEMEN_PENGGUNA_USERS;

    const formatted = list.map((u) => {
      const isSuper =
        u.is_super_admin === true ||
        u.role === 'Super Admin' ||
        u.role_slug === 'super_admin' ||
        String(u.jabatan || '').toLowerCase().includes('super admin') ||
        String(u.email || '').toLowerCase().includes('dedegunawan');

      if (isSuper) {
        const baseName = (u.nama_lengkap || u.name || 'Dede Gunawan').split(',')[0];
        return {
          id: u.id || 'usr-dg-01',
          labelPrefix: '★ Super Admin:',
          labelColor: 'font-bold text-unsil-gold-400',
          displayName: `${baseName} (${u.email || 'dedegunawan@unsil.ac.id'})`,
          email: u.email || 'dedegunawan@unsil.ac.id',
          password: u.raw_password || u.password || 'Siloka2026!',
          isSuper: true,
          title: `Super Administrator SILOKA (${u.nama_lengkap || 'Dede Gunawan'})`,
          orderPriority: 2
        };
      }

      const jab = String(u.jabatan || u.roleLabel || u.role_label || u.role || '').toLowerCase();
      const name = String(u.nama_lengkap || u.nama || u.name || '');

      let labelPrefix = 'Pejabat:';
      let labelColor = 'font-semibold text-emerald-400';
      let displayName = name.split(',')[0] || name;
      let orderPriority = 10;

      if (jab.includes('rektor') && !jab.includes('wakil') && !jab.includes('warek')) {
        labelPrefix = 'Rektorat:';
        labelColor = 'font-semibold text-amber-300';
        displayName = name.includes('Aripin') ? 'Prof. Aripin' : displayName;
        orderPriority = 1;
      } else if (jab.includes('pengadministrasi') || jab.includes('tata usaha') || jab.includes('admin_tu') || jab.includes('operator') || u.role_slug === 'admin_tu') {
        labelPrefix = 'Staf TU:';
        labelColor = 'font-semibold text-unsil-gold-300';
        displayName = name.includes('Agung Cahya') ? 'Agung Cahya Nur' : displayName;
        orderPriority = 0;
      } else if (jab.includes('wakil rektor bidang akademik') || jab.includes('wakil rektor i') || jab.includes('warek 1') || jab.includes('akademik')) {
        labelPrefix = 'Wakil Rektor I:';
        labelColor = 'font-semibold text-sky-400';
        displayName = name.includes('Dedi Kusmayadi') ? 'Prof. Dedi Kusmayadi' : displayName;
        orderPriority = 3;
      } else if (jab.includes('wakil rektor bidang keuangan') || jab.includes('wakil rektor ii') || jab.includes('warek 2') || jab.includes('keuangan dan umum')) {
        labelPrefix = 'Wakil Rektor II:';
        labelColor = 'font-semibold text-emerald-400';
        displayName = name.includes('Ade Rustiana') ? 'Dr. Ade Rustiana' : displayName;
        orderPriority = 4;
      } else if (jab.includes('dekan')) {
        labelPrefix = 'Dekan:';
        labelColor = 'font-semibold text-emerald-400';
        orderPriority = 5;
      } else if (jab.includes('spi') || jab.includes('pengawas')) {
        labelPrefix = 'Pengawas:';
        labelColor = 'font-semibold text-rose-300';
        orderPriority = 6;
      } else if (jab.includes('tik')) {
        labelPrefix = jab.includes('kepala') ? 'Kepala TIK:' : 'Staf TIK:';
        labelColor = 'font-semibold text-indigo-300';
        orderPriority = 7;
      }

      return {
        id: u.id || u.email,
        labelPrefix,
        labelColor,
        displayName,
        email: u.email || u.username,
        password: u.raw_password || u.password || 'Siloka2026!',
        isSuper: false,
        title: `${u.jabatan || labelPrefix} (${u.nama_lengkap || displayName})`,
        orderPriority
      };
    });

    return formatted.sort((a, b) => a.orderPriority - b.orderPriority);
  }, [demoUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Harap masukkan username atau email Anda.');
      return;
    }

    if (!password) {
      setErrorMsg('Harap masukkan kata sandi akun SILOKA Anda.');
      return;
    }

    setIsLoading(true);

    // 1. SANITISASI INPUT USERNAME (Trim, Lowercase & Domain Auto-Resolution)
    const rawInput = username.trim().toLowerCase();
    const withoutDomain = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput;
    const withDomain = rawInput.includes('@') ? rawInput : `${rawInput}@unsil.ac.id`;

    // 2. HELPER ENGINE: PENCARIAN PENGGUNA FLEKSIBEL (usersData + localStorage)
    const findLocalUser = () => {
      let candidateUsers = [...usersData];
      try {
        const stored = localStorage.getItem('siloka_users_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            candidateUsers = [...parsed, ...candidateUsers];
          }
        }
      } catch (err) {
        console.warn('[LOGIN] Gagal memuat siloka_users_data dari localStorage:', err);
      }

      const matched = candidateUsers.find((u) => {
        const uEmail = u.email ? String(u.email).trim().toLowerCase() : '';
        const uUsername = u.username ? String(u.username).trim().toLowerCase() : '';
        const uNip = u.nip ? String(u.nip).trim().toLowerCase() : '';
        const uNipNik = u.nip_nik ? String(u.nip_nik).trim().toLowerCase() : '';

        const uEmailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : uEmail;
        const uUserPrefix = uUsername.includes('@') ? uUsername.split('@')[0] : uUsername;

        const isMatch =
          uEmail === rawInput ||
          uEmail === withDomain ||
          uEmailPrefix === rawInput ||
          uEmailPrefix === withoutDomain ||
          uUsername === rawInput ||
          uUsername === withDomain ||
          uUsername === withoutDomain ||
          uUserPrefix === rawInput ||
          uUserPrefix === withoutDomain ||
          uNip === rawInput ||
          uNip === withoutDomain ||
          uNipNik === rawInput ||
          uNipNik === withoutDomain;

        const isActive = u.is_active !== false && u.is_aktif !== false && u.status_aktif !== false;
        return isMatch && isActive;
      });

      if (matched) return matched;

      // Fallback alias jika pengguna mengetik alias 'superadmin'
      if (rawInput === 'superadmin' || rawInput === 'superadmin@unsil.ac.id') {
        const superAdmin = candidateUsers.find((u) => isSuperAdminUser(u));
        if (superAdmin) return superAdmin;
      }

      return null;
    };

    // Helper untuk memverifikasi password akun lokal
    const verifyLocalPassword = (userObj) => {
      if (!userObj) return false;
      const expectedPassword = userObj.raw_password || userObj.password;
      if (expectedPassword) {
        return password === expectedPassword;
      }
      if (password === 'Siloka2026!') return true;
      return false;
    };

    try {
      // 3. PANGGIL BACKEND API OTENTIKASI (/api/auth/login)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: rawInput,
          password: password
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json().catch(() => null);

        // A. Backend Otentikasi Berhasil
        if (response.ok && data?.success && data?.user) {
          setIsLoading(false);
          onLoginSuccess(data.user, rememberMe);
          return;
        }

        // B. Backend Menolak Kata Sandi (401)
        if (response.status === 401) {
          // Periksa apakah akun lokal di localStorage memiliki password berbeda (misal hasil Tambah User / Mutasi)
          const localUser = findLocalUser();
          if (localUser && verifyLocalPassword(localUser)) {
            setIsLoading(false);
            onLoginSuccess(localUser, rememberMe);
            return;
          }

          setIsLoading(false);
          setErrorMsg(data?.message || "Gagal Masuk: Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.");
          return;
        }

        // C. Backend Mengembalikan User Not Found (404)
        if (response.status === 404 && data?.error === 'UserNotFound') {
          // Tetap lakukan fallback pencarian ke local dataset / localStorage
          const localUser = findLocalUser();
          if (localUser) {
            setIsLoading(false);
            if (verifyLocalPassword(localUser)) {
              onLoginSuccess(localUser, rememberMe);
              return;
            } else {
              setErrorMsg("Gagal Masuk: Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.");
              return;
            }
          }

          setIsLoading(false);
          setErrorMsg("Gagal Masuk: Username atau Email '@unsil.ac.id' tidak terdaftar dalam sistem SILOKA. Silakan hubungi Super Admin.");
          return;
        }
      }
    } catch (err) {
      console.warn('[LOGIN] Backend offline atau request error, beralih ke verifikasi lokal:', err.message);
    }

    // 4. FALLBACK CLIENT-SIDE AUTHENTICATION ENGINE (Jika server dev Vite tanpa backend atau backend offline)
    const localUser = findLocalUser();
    setIsLoading(false);

    if (localUser) {
      if (verifyLocalPassword(localUser)) {
        onLoginSuccess(localUser, rememberMe);
      } else {
        setErrorMsg("Gagal Masuk: Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.");
      }
    } else {
      setErrorMsg(
        "Gagal Masuk: Username atau Email '@unsil.ac.id' tidak terdaftar dalam sistem SILOKA. Silakan hubungi Super Admin."
      );
    }
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
              Gunakan email atau akun resmi Universitas Siliwangi
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
                Email / Nama Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nama@unsil.ac.id atau nama pengguna"
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
                  <span>Masuk ke SILOKA</span>
                  <ArrowRight className="w-4 h-4 text-unsil-gold-300" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Preset Accounts - Terintegrasi dengan Manajemen Pengguna (allUsers) */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Pilihan Akun Masuk (Uji Coba):
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {demoButtons.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    setUsername(btn.email);
                    setPassword(btn.password || 'Siloka2026!');
                    setErrorMsg('');
                  }}
                  className={`p-1.5 rounded text-left transition truncate cursor-pointer ${
                    btn.isSuper
                      ? 'bg-unsil-gold-500/20 hover:bg-unsil-gold-500/30 text-unsil-gold-200 border border-unsil-gold-500/50 col-span-2 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                  }`}
                  title={btn.title}
                >
                  <span className={btn.labelColor}>{btn.labelPrefix}</span> {btn.displayName}
                </button>
              ))}
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

