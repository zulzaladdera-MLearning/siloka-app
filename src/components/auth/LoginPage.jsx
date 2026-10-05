import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Building2,
  KeyRound,
  AlertCircle,
  Sparkles,
  Search,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import usersData from '../../data/users.json';
import { isSuperAdminUser } from '../../utils/authGuards';

export const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper untuk membaca daftar ID/email yang telah dihapus Super Admin
  const getDeletedSet = () => {
    if (typeof window === 'undefined') return new Set();
    try {
      const deletedList = JSON.parse(localStorage.getItem('siloka_deleted_user_ids') || '[]');
      if (Array.isArray(deletedList)) {
        return new Set(deletedList.map((x) => String(x).toLowerCase().trim()));
      }
    } catch (err) {
      // ignore
    }
    return new Set();
  };

  // State sinkronisasi akun demo dinamis dari CRUD Super Admin & Database (Inisialisasi Cepat & Reaktif)
  const [allDemoUsers, setAllDemoUsers] = useState(() => {
    let initial = Array.isArray(usersData) ? [...usersData] : [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('siloka_users_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initial = [...parsed, ...initial];
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const deletedSet = getDeletedSet();
    const seen = new Set();
    const unique = [];

    initial.forEach((u) => {
      const key = String(u.id || u.email || u.nip || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        const uId = String(u.id || '').toLowerCase();
        const uNip = String(u.nip || u.nip_nik || '').toLowerCase();
        const uEmail = String(u.email || '').toLowerCase();
        const isDeleted = deletedSet.has(uId) || deletedSet.has(uNip) || deletedSet.has(uEmail);
        const isActive = u.is_active !== false && u.is_aktif !== false && u.status_aktif !== false;
        if (!isDeleted && isActive) {
          unique.push(u);
        }
      }
    });

    return unique;
  });

  const [selectedDemoUserNotice, setSelectedDemoUserNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  // Muat dan selaraskan seluruh akun (dari backend, localStorage CRUD, dan dataset awal)
  const refreshDemoAccounts = async () => {
    const deletedSet = getDeletedSet();
    let merged = [];

    // 1. Baca dari localStorage (hasil mutasi CRUD Super Admin)
    try {
      const stored = localStorage.getItem('siloka_users_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          merged = [...parsed];
        }
      }
    } catch (e) {
      console.warn('[LOGIN] Gagal memuat siloka_users_data dari localStorage:', e);
    }

    // 2. Jika backend API aktif, sinkronkan data pengguna terkini
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
          const apiMap = new Map();
          json.data.forEach((u) => {
            const key = String(u.id || u.email || u.nip || '').toLowerCase();
            if (key) apiMap.set(key, u);
          });
          // Update / timpa dengan data API terbaru
          merged = merged.map((u) => {
            const key = String(u.id || u.email || u.nip || '').toLowerCase();
            return apiMap.get(key) || u;
          });
          // Tambahkan user API yang belum ada
          json.data.forEach((u) => {
            const key = String(u.id || u.email || u.nip || '').toLowerCase();
            if (key && !merged.some((m) => String(m.id || m.email || m.nip || '').toLowerCase() === key)) {
              merged.push(u);
            }
          });
        }
      }
    } catch (e) {
      // Backend offline: gunakan data localStorage & fallback usersData
    }

    // 3. Gabungkan dengan data bawaan usersData jika belum ada
    usersData.forEach((u) => {
      const key = String(u.id || u.email || u.nip || '').toLowerCase();
      if (key && !merged.some((m) => String(m.id || m.email || m.nip || '').toLowerCase() === key)) {
        merged.push(u);
      }
    });

    // 4. Bersihkan akun yang telah dihapus Super Admin dan akun yang dinonaktifkan
    const activeUsers = merged.filter((u) => {
      const uId = String(u.id || '').toLowerCase();
      const uNip = String(u.nip || u.nip_nik || '').toLowerCase();
      const uEmail = String(u.email || '').toLowerCase();
      const uUser = String(u.username || '').toLowerCase();

      const isDeleted =
        deletedSet.has(uId) ||
        deletedSet.has(uNip) ||
        deletedSet.has(uEmail) ||
        deletedSet.has(uUser);

      const isActive = u.is_active !== false && u.is_aktif !== false && u.status_aktif !== false;
      return !isDeleted && isActive;
    });

    setAllDemoUsers(activeUsers);
  };

  useEffect(() => {
    refreshDemoAccounts();
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Helper untuk memilih akun demo dengan satu klik
  const handleSelectDemoAccount = (userObj) => {
    if (!userObj) return;
    const finalUsername = userObj.email || userObj.username || userObj.nip || '';
    const finalPassword = userObj.raw_password || userObj.password || 'Siloka2026!';

    setUsername(finalUsername);
    setPassword(finalPassword);
    setErrorMsg('');

    const displayName = userObj.nama_lengkap || userObj.nama || userObj.name || finalUsername;
    const displayRole = userObj.jabatan || userObj.role_label || userObj.roleLabel || userObj.role || 'Pengguna';
    setSelectedDemoUserNotice({ name: displayName, role: displayRole });
    setIsSearchOpen(false);
  };

  // Identifikasi Akun Hasil Penambahan CRUD Baru oleh Super Admin
  const newlyCreatedUsers = useMemo(() => {
    const defaultIds = new Set(usersData.map((u) => String(u.id || '').toLowerCase()));
    return allDemoUsers.filter((u) => {
      const id = String(u.id || '').toLowerCase();
      const isCustomId = !defaultIds.has(id);
      const isNewFlag = u.is_new === true || u.must_change_password === true;
      return isCustomId || isNewFlag;
    });
  }, [allDemoUsers]);

  // Resolusi Akun Demo Utama secara Dinamis (ter-update otomatis jika profil diedit di CRUD)
  const resolvedPresetAccounts = useMemo(() => {
    const findUser = (predicate) => allDemoUsers.find(predicate) || null;

    const superAdmin =
      findUser((u) => isSuperAdminUser(u) || String(u.email || '').toLowerCase().includes('dedegunawan')) || {
        nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
        email: 'dedegunawan@unsil.ac.id',
        jabatan: 'Super Administrator SILOKA',
        roleLabel: 'Super Admin'
      };

    const kepalaBku =
      findUser(
        (u) =>
          String(u.jabatan || '').toLowerCase().includes('kepala biro keuangan') ||
          String(u.email || '').toLowerCase().includes('nana.sujana')
      ) || findUser((u) => String(u.jabatan || '').toLowerCase().includes('kepala biro')) || null;

    const stafBku =
      findUser(
        (u) =>
          String(u.email || '').toLowerCase().includes('siti.rohmah') ||
          String(u.nama_lengkap || u.nama || '').toLowerCase().includes('siti rohmah')
      ) || findUser((u) => u.unit_kerja_id === 'UN58.6' && !u.is_pejabat) || null;

    const dekanFkip =
      findUser(
        (u) =>
          String(u.jabatan || u.roleLabel || u.role_label || '').toLowerCase().includes('dekan') &&
          (String(u.jabatan || u.roleLabel || u.role_label || '').toLowerCase().includes('keguruan') ||
            String(u.unit || '').includes('Keguruan') ||
            String(u.unit || '').includes('FKIP') ||
            String(u.email || '').includes('cucu'))
      ) ||
      findUser((u) => String(u.jabatan || u.roleLabel || u.role_label || '').toLowerCase().includes('dekan')) || {
        nama_lengkap: 'Dr. H. Cucu Suherman, M.Pd.',
        email: 'cucu.suherman@unsil.ac.id',
        jabatan: 'Dekan FKIP'
      };

    const stafFkip =
      findUser(
        (u) =>
          String(u.email || '').toLowerCase().includes('dian.fkip') ||
          (String(u.unit_kerja_id || '') === 'UN58.10' && !u.is_pejabat && String(u.email || '').includes('dian'))
      ) || {
        nama_lengkap: 'Dian Fitriani, S.Pd.',
        email: 'dian.fkip@unsil.ac.id',
        jabatan: 'Staf TU FKIP'
      };

    const rektorat =
      findUser(
        (u) =>
          String(u.jabatan || '').toLowerCase() === 'rektor' ||
          String(u.jabatan || '').toLowerCase().includes('rektor universitas siliwangi') ||
          String(u.email || '').toLowerCase().includes('rektor')
      ) || null;

    const pengawasSpi =
      findUser(
        (u) =>
          String(u.jabatan || '').toLowerCase().includes('spi') ||
          String(u.role || '').toUpperCase() === 'PENGAWAS' ||
          String(u.email || '').toLowerCase().includes('spi')
      ) || null;

    const kepalaTik =
      findUser(
        (u) =>
          String(u.jabatan || '').toLowerCase().includes('kepala upa tik') ||
          String(u.email || '').toLowerCase().includes('kepala.tik')
      ) || null;

    const stafTik =
      findUser(
        (u) =>
          String(u.email || '').toLowerCase().includes('operator.tik') ||
          String(u.nama_lengkap || u.nama || '').toLowerCase().includes('gilang')
      ) || null;

    return {
      superAdmin,
      kepalaBku,
      stafBku,
      dekanFkip,
      stafFkip,
      rektorat,
      pengawasSpi,
      kepalaTik,
      stafTik
    };
  }, [allDemoUsers]);

  // Daftar user yang difilter untuk dropdown pencarian cepat
  const filteredSearchUsers = useMemo(() => {
    if (!searchQuery.trim()) return allDemoUsers.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return allDemoUsers.filter((u) => {
      const nama = String(u.nama_lengkap || u.nama || u.name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const nip = String(u.nip || u.nip_nik || '').toLowerCase();
      const jabatan = String(u.jabatan || u.role_label || u.roleLabel || '').toLowerCase();
      const unit = String(u.unit || u.unit_kerja_id || '').toLowerCase();
      return (
        nama.includes(q) ||
        email.includes(q) ||
        nip.includes(q) ||
        jabatan.includes(q) ||
        unit.includes(q)
      );
    });
  }, [allDemoUsers, searchQuery]);

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

    // 1b. CEK OTORISASI: Jika akun telah dihapus oleh Super Admin, tolak seketika
    const getDeletedSet = () => {
      try {
        const deletedList = JSON.parse(localStorage.getItem('siloka_deleted_user_ids') || '[]');
        if (Array.isArray(deletedList)) {
          return new Set(deletedList.map((x) => String(x).toLowerCase().trim()));
        }
      } catch (err) {
        // ignore
      }
      return new Set();
    };

    const deletedSet = getDeletedSet();
    if (
      deletedSet.has(rawInput) ||
      deletedSet.has(withDomain) ||
      deletedSet.has(withoutDomain)
    ) {
      setIsLoading(false);
      setErrorMsg(
        'Gagal Masuk: Akun Anda telah dinonaktifkan atau dihapus oleh Super Administrator. Akses ke sistem SILOKA tidak lagi tersedia.'
      );
      return;
    }

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

      // Filter mutlak: keluarkan semua user yang telah dihapus oleh Super Admin
      candidateUsers = candidateUsers.filter((u) => {
        const uId = String(u.id || '').toLowerCase();
        const uNip = String(u.nip || u.nip_nik || '').toLowerCase();
        const uEmail = String(u.email || '').toLowerCase();
        const uUser = String(u.username || '').toLowerCase();
        return (
          !deletedSet.has(uId) &&
          !deletedSet.has(uNip) &&
          !deletedSet.has(uEmail) &&
          !deletedSet.has(uUser)
        );
      });

      return candidateUsers.find((u) => {
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
        const superAdmin = localUsers.find((u) => isSuperAdminUser(u));
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

        // B. Backend Menolak: Akun telah dihapus oleh Super Administrator (403)
        if (response.status === 403 || data?.error === 'AccountDeleted') {
          setIsLoading(false);
          setErrorMsg(
            data?.message ||
              'Gagal Masuk: Akun Anda telah dinonaktifkan atau dihapus oleh Super Administrator. Akses ke sistem SILOKA dicabut sepenuhnya.'
          );
          return;
        }

        // C. Backend Menolak Kata Sandi (401)
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

          {/* Quick Demo Preset Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pilihan Akun Masuk (Uji Coba):
              </p>
              <button
                type="button"
                onClick={refreshDemoAccounts}
                className="text-[10px] text-slate-400 hover:text-unsil-gold-400 flex items-center gap-1 transition cursor-pointer"
                title="Sinkronkan data akun terkini dari Manajemen Pengguna & Basis Data"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sinkron Data</span>
              </button>
            </div>

            {/* Banner feedback jika akun demo dipilih */}
            {selectedDemoUserNotice && (
              <div className="mb-2 p-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between animate-in fade-in duration-150">
                <span className="truncate">
                  ✓ Terpilih: <strong className="text-white">{selectedDemoUserNotice.name}</strong> ({selectedDemoUserNotice.role})
                </span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0 ml-1">
                  Siap Masuk
                </span>
              </div>
            )}

            {/* Grid Preset Akun Utama Berjenjang SOTK UNSIL */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {/* Staf BKU */}
              {resolvedPresetAccounts.stafBku && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.stafBku)}
                  className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate cursor-pointer"
                  title="Staf Operator BKU"
                >
                  <span className="font-semibold text-unsil-gold-300">Staf BKU:</span>{' '}
                  {resolvedPresetAccounts.stafBku.nama_lengkap?.split(',')[0] || 'Siti Rohmah'}
                </button>
              )}

              {/* Kepala BKU */}
              {resolvedPresetAccounts.kepalaBku && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.kepalaBku)}
                  className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate cursor-pointer"
                  title="Kepala Biro Keuangan dan Umum"
                >
                  <span className="font-semibold text-emerald-400">Kepala BKU:</span>{' '}
                  {resolvedPresetAccounts.kepalaBku.nama_lengkap?.split(',')[0] || 'Dr. Nana S.'}
                </button>
              )}

              {/* Super Admin SILOKA */}
              {resolvedPresetAccounts.superAdmin && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.superAdmin)}
                  className="p-1.5 rounded bg-unsil-gold-500/20 hover:bg-unsil-gold-500/30 text-unsil-gold-200 text-left border border-unsil-gold-500/50 transition truncate col-span-2 shadow-xs cursor-pointer"
                  title="Super Administrator SILOKA"
                >
                  <span className="font-bold text-unsil-gold-400">★ Super Admin:</span>{' '}
                  {resolvedPresetAccounts.superAdmin.nama_lengkap || 'Dede Gunawan'} ({resolvedPresetAccounts.superAdmin.email || 'dedegunawan@unsil.ac.id'})
                </button>
              )}

              {/* Staf FKIP */}
              {resolvedPresetAccounts.stafFkip && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.stafFkip)}
                  className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate cursor-pointer"
                  title="Staf Tata Usaha FKIP"
                >
                  <span className="font-semibold text-unsil-gold-300">Staf FKIP:</span>{' '}
                  {resolvedPresetAccounts.stafFkip.nama_lengkap?.split(',')[0] || 'Dian Fitriani'}
                </button>
              )}

              {/* Dekan FKIP */}
              {resolvedPresetAccounts.dekanFkip && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.dekanFkip)}
                  className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate cursor-pointer"
                  title="Dekan FKIP (Pejabat Struktural)"
                >
                  <span className="font-semibold text-emerald-400">Dekan FKIP:</span>{' '}
                  {resolvedPresetAccounts.dekanFkip.nama_lengkap?.split(',')[0] || 'Dr. Cucu S.'}
                </button>
              )}

              {/* Rektorat */}
              {resolvedPresetAccounts.rektorat && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.rektorat)}
                  className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate cursor-pointer"
                  title="Pimpinan Rektorat Universitas Siliwangi"
                >
                  <span className="font-semibold text-amber-300">Rektorat:</span>{' '}
                  {resolvedPresetAccounts.rektorat.nama_lengkap?.split(',')[0] || 'Prof. Aripin'}
                </button>
              )}

              {/* Pengawas SPI */}
              {resolvedPresetAccounts.pengawasSpi && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.pengawasSpi)}
                  className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-left border border-slate-700/60 transition truncate cursor-pointer"
                  title="Pengawas Satuan Pengawas Internal (SPI)"
                >
                  <span className="font-semibold text-rose-300">Pengawas:</span>{' '}
                  {resolvedPresetAccounts.pengawasSpi.nama_lengkap?.split(',')[0] || 'Hendra (SPI)'}
                </button>
              )}

              {/* Kepala TIK */}
              {resolvedPresetAccounts.kepalaTik && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.kepalaTik)}
                  className="p-1.5 rounded bg-indigo-950/70 hover:bg-indigo-900/80 text-slate-200 text-left border border-indigo-700/60 transition truncate col-span-1 cursor-pointer"
                  title="Kepala UPA TIK (Pejabat & Otoritas Sistem)"
                >
                  <span className="font-semibold text-indigo-300">Kepala TIK:</span>{' '}
                  {resolvedPresetAccounts.kepalaTik.nama_lengkap?.split(',')[0] || 'Alam R.'}
                </button>
              )}

              {/* Staf TIK */}
              {resolvedPresetAccounts.stafTik && (
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(resolvedPresetAccounts.stafTik)}
                  className="p-1.5 rounded bg-indigo-950/70 hover:bg-indigo-900/80 text-slate-200 text-left border border-indigo-700/60 transition truncate col-span-1 cursor-pointer"
                  title="Staf Pengelola Sistem UPA TIK"
                >
                  <span className="font-semibold text-indigo-300">Staf TIK:</span>{' '}
                  {resolvedPresetAccounts.stafTik.nama_lengkap?.split(',')[0] || 'Gilang R.'}
                </button>
              )}
            </div>

            {/* SECTION DINAMIS: Akun Baru Hasil Penambahan (CRUD Super Admin) */}
            {newlyCreatedUsers.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10.5px] font-bold text-unsil-gold-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-unsil-gold-400" />
                    Akun Baru Hasil CRUD Super Admin:
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-unsil-gold-500/20 text-unsil-gold-300 font-mono font-bold">
                    {newlyCreatedUsers.length} Akun
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {newlyCreatedUsers.map((newUser) => (
                    <button
                      key={newUser.id || newUser.nip || newUser.email}
                      type="button"
                      onClick={() => handleSelectDemoAccount(newUser)}
                      className="p-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-left transition truncate group cursor-pointer"
                      title={`Klik untuk uji coba login sebagai ${newUser.nama_lengkap || newUser.nama} (${newUser.jabatan || newUser.role})`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                          {newUser.jabatan || newUser.roleLabel || 'Baru'}
                        </span>
                        <span className="text-[11px] text-white font-medium truncate group-hover:text-unsil-gold-300">
                          {newUser.nama_lengkap || newUser.nama || newUser.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector Pencarian Cepat Seluruh Akun Pegawai */}
            <div className="mt-2.5 relative" ref={searchDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-full p-1.5 px-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/70 text-slate-300 text-[11px] flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-slate-300 truncate">
                  <Search className="w-3.5 h-3.5 text-unsil-gold-400 shrink-0" />
                  <span className="truncate">Cari & Pilih Akun Demo Lainnya ({allDemoUsers.length} Pegawai)...</span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isSearchOpen ? 'rotate-180 text-unsil-gold-400' : ''
                  }`}
                />
              </button>

              {isSearchOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-2 z-50 text-[11px] max-h-60 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama, NIP, email, atau jabatan..."
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:border-unsil-gold-400 focus:ring-1 focus:ring-unsil-gold-400/40"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto divide-y divide-slate-800/80 pr-1 flex-1 max-h-48">
                    {filteredSearchUsers.length > 0 ? (
                      filteredSearchUsers.map((u) => (
                        <button
                          key={u.id || u.nip || u.email}
                          type="button"
                          onClick={() => handleSelectDemoAccount(u)}
                          className="w-full p-1.5 rounded hover:bg-slate-800/90 text-left transition flex items-center justify-between gap-2 cursor-pointer group"
                        >
                          <div className="truncate">
                            <p className="text-white font-medium truncate group-hover:text-unsil-gold-300">
                              {u.nama_lengkap || u.nama || u.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {u.jabatan || u.roleLabel || u.role} • {u.unit || u.unit_kerja_id}
                            </p>
                          </div>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 group-hover:bg-unsil-gold-500/20 group-hover:text-unsil-gold-300 shrink-0 font-semibold">
                            Pilih
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        Tidak ditemukan pegawai yang cocok dengan kata kunci.
                      </div>
                    )}
                  </div>
                </div>
              )}
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

