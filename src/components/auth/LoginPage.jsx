import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  RotateCcw,
  Sparkles
} from 'lucide-react';
import usersData from '../../data/users.json';
import { isSuperAdminUser } from '../../utils/authGuards';
import { resolveUserRoleSlug } from '../../utils/rbacSyncService';

// 5 Akun Kanonikal Resmi Manajemen Pengguna SILOKA UNSIL (Sesuai Master Data Kepegawaian)
export const CANONICAL_MANAJEMEN_PENGGUNA_USERS = [
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
    id: 'usr-warek-01',
    nama_lengkap: 'Prof. Dr. Dedi Nurjamil, M.Pd.',
    email: 'dedi.warek1@unsil.ac.id',
    nip: '197005141997021001',
    nip_nik: '197005141997021001',
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

/**
 * Format nama ringkas beretika akademik untuk kenyamanan tampilan tombol
 */
export const formatShortAcademicName = (fullName) => {
  if (!fullName) return '';
  const str = String(fullName).trim();

  // Kasus khusus Rektor Universitas Siliwangi
  if (str.includes('Aripin') && /prof/i.test(str)) {
    return 'Prof. Aripin';
  }

  // Potong gelar belakang setelah koma pertama
  const beforeComma = str.split(',')[0].trim();

  // Ekstrak gelar depan jika ada (Prof., Dr., Drs., Dra., Ir., dll)
  const frontMatch = beforeComma.match(/^((?:Prof\.?\s*(?:Dr\.?|Ir\.?)?|Dr\.?\s*(?:Ir\.?|Drs\.?)?|Drs\.?\s*(?:H\.?)?|Dra\.?\s*(?:Hj\.?)?|Ir\.?))\s*(.+)$/i);

  if (frontMatch) {
    const front = frontMatch[1].trim();
    const rest = frontMatch[2].trim();
    const restWords = rest.split(/\s+/).filter((w) => !/^(eng\.?|ir\.?|dr\.?|h\.?|hj\.?)$/i.test(w));
    const shortRest = restWords.slice(0, 2).join(' ');
    return `${front} ${shortRest}`.trim();
  }

  // Jika tanpa gelar depan, ambil 2-3 kata awal
  const words = beforeComma.split(/\s+/);
  return words.slice(0, 3).join(' ');
};

/**
 * Sanitasi dan deduplikasi pengguna unik berdasarkan ID, NIP, Email, dan nama ternormalisasi
 */
export const deduplicateUsers = (users) => {
  if (!Array.isArray(users)) return [];

  let deletedSet = new Set();
  try {
    const rawDeleted = typeof window !== 'undefined' ? localStorage.getItem('siloka_deleted_user_ids') : null;
    if (rawDeleted) {
      const parsed = JSON.parse(rawDeleted);
      if (Array.isArray(parsed)) {
        parsed.forEach((x) => deletedSet.add(String(x).toLowerCase().trim()));
      }
    }
  } catch (e) {}

  const seenIds = new Set();
  const seenNips = new Set();
  const seenEmails = new Set();
  const seenNormNames = new Set();
  const result = [];

  const cleanNameForDedup = (name) => {
    return String(name || '')
      .toLowerCase()
      .replace(/\b(prof|dr|drs|dra|ir|s\.pd|m\.pd|s\.kom|m\.kom|s\.t|m\.t|s\.ap|s\.ak|s\.e|m\.si|ak|ca|ipu|asean|eng|m\.cs)\b/gi, '')
      .replace(/[^a-z]/g, '')
      .trim();
  };

  users.forEach((u) => {
    if (!u) return;
    if (u.is_active === false) return;

    const uId = String(u.id || '').toLowerCase().trim();
    const uNip = String(u.nip || u.nip_nik || '').replace(/\D/g, '').trim();
    const uEmail = String(u.email || u.username || '').toLowerCase().trim();
    const normName = cleanNameForDedup(u.nama_lengkap || u.name || '');

    // Filter pengguna yang telah dihapus di Manajemen Pengguna
    if (uId && deletedSet.has(uId)) return;
    if (uNip && deletedSet.has(uNip)) return;
    if (uEmail && deletedSet.has(uEmail)) return;

    // Filter duplikasi data akun
    if (uId && seenIds.has(uId)) return;
    if (uNip && uNip.length >= 6 && seenNips.has(uNip)) return;
    if (uEmail && seenEmails.has(uEmail)) return;
    if (normName && normName.length >= 5 && seenNormNames.has(normName)) return;

    if (uId) seenIds.add(uId);
    if (uNip && uNip.length >= 6) seenNips.add(uNip);
    if (uEmail) seenEmails.add(uEmail);
    if (normName && normName.length >= 5) seenNormNames.add(normName);

    result.push(u);
  });

  return result;
};

/**
 * Pemetaan akun pengguna ke spesifikasi tombol preset dengan badge peran presisi
 */
export const mapUserToDemoPreset = (u) => {
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
      orderPriority: 0
    };
  }

  const roleSlug = resolveUserRoleSlug(u);
  const posLower = String(
    u.jabatan || u.roleLabel || u.role_label || u.sotk_position_label || u.role || ''
  ).toLowerCase();
  const unitLower = String(u.unit || u.nama_unit || u.unit_kerja_id || '').toLowerCase();
  const name = String(u.nama_lengkap || u.nama || u.name || '');
  const shortName = formatShortAcademicName(name);

  let labelPrefix = 'Pejabat:';
  let labelColor = 'font-semibold text-emerald-400';
  let orderPriority = 50;

  // 1. Rektorat Utama
  if (posLower.includes('rektor') && !posLower.includes('wakil') && !posLower.includes('warek')) {
    labelPrefix = 'Rektorat:';
    labelColor = 'font-semibold text-amber-300';
    orderPriority = 1;
  }
  // 2. Wakil Rektor
  else if (
    posLower.includes('wakil rektor bidang akademik') ||
    posLower.includes('warek 1') ||
    posLower.includes('warek i') ||
    (posLower.includes('wakil rektor') && posLower.includes('akademik'))
  ) {
    labelPrefix = 'Wakil Rektor I:';
    labelColor = 'font-semibold text-sky-400';
    orderPriority = 2;
  } else if (
    posLower.includes('wakil rektor bidang keuangan') ||
    posLower.includes('warek 2') ||
    posLower.includes('warek ii') ||
    (posLower.includes('wakil rektor') && (posLower.includes('keuangan') || posLower.includes('umum')))
  ) {
    labelPrefix = 'Wakil Rektor II:';
    labelColor = 'font-semibold text-emerald-400';
    orderPriority = 3;
  } else if (
    posLower.includes('wakil rektor bidang kemahasiswaan') ||
    posLower.includes('warek 3') ||
    posLower.includes('warek iii') ||
    (posLower.includes('wakil rektor') && (posLower.includes('kemahasiswaan') || posLower.includes('alumni')))
  ) {
    labelPrefix = 'Wakil Rektor III:';
    labelColor = 'font-semibold text-teal-400';
    orderPriority = 4;
  } else if (
    posLower.includes('wakil rektor bidang perencanaan') ||
    posLower.includes('warek 4') ||
    posLower.includes('warek iv') ||
    (posLower.includes('wakil rektor') && (posLower.includes('perencanaan') || posLower.includes('kerjasama')))
  ) {
    labelPrefix = 'Wakil Rektor IV:';
    labelColor = 'font-semibold text-cyan-400';
    orderPriority = 5;
  }
  // 3. Senat Universitas & Dewan Penyantun
  else if (posLower.includes('senat')) {
    if (posLower.includes('ketua')) {
      labelPrefix = 'Ketua Senat:';
      orderPriority = 6;
    } else {
      labelPrefix = 'Sekretaris Senat:';
      orderPriority = 7;
    }
    labelColor = 'font-semibold text-purple-300';
  } else if (posLower.includes('dewan penyantun') || posLower.includes('dewan')) {
    labelPrefix = 'Dewan Penyantun:';
    labelColor = 'font-semibold text-violet-300';
    orderPriority = 8;
  }
  // 4. Dekan & Direktur Pascasarjana
  else if (posLower.includes('dekan') || posLower.includes('direktur')) {
    labelPrefix = posLower.includes('direktur') ? 'Direktur:' : 'Dekan:';
    labelColor = 'font-semibold text-emerald-400';
    orderPriority = 9;
  }
  // 5. Kepala Biro / Lembaga / UPA
  else if (posLower.includes('biro')) {
    labelPrefix = 'Ka. Biro:';
    labelColor = 'font-semibold text-blue-400';
    orderPriority = 10;
  } else if (posLower.includes('lppm') || posLower.includes('lpmpp') || posLower.includes('lembaga')) {
    labelPrefix = 'Ka. Lembaga:';
    labelColor = 'font-semibold text-blue-400';
    orderPriority = 11;
  } else if (posLower.includes('upa') || posLower.includes('tik') || posLower.includes('perpustakaan') || posLower.includes('laboratorium')) {
    labelPrefix = 'Ka. UPA:';
    labelColor = 'font-semibold text-indigo-300';
    orderPriority = 12;
  }
  // 6. Verifikator Hierarki (Wakil Dekan, Kajur, Kaprodi)
  else if (posLower.includes('wakil dekan') || posLower.includes('wadek')) {
    labelPrefix = 'Wakil Dekan:';
    labelColor = 'font-semibold text-cyan-400';
    orderPriority = 13;
  } else if (posLower.includes('ketua jurusan') || posLower.includes('kajur')) {
    labelPrefix = 'Ketua Jurusan:';
    labelColor = 'font-semibold text-cyan-400';
    orderPriority = 14;
  } else if (posLower.includes('kaprodi') || posLower.includes('koordinator program studi') || posLower.includes('koorprodi')) {
    labelPrefix = 'Kaprodi:';
    labelColor = 'font-semibold text-cyan-400';
    orderPriority = 15;
  }
  // 7. Pengawas / Satuan Pengawas Internal (SPI)
  else if (
    roleSlug === 'auditor_spi' ||
    unitLower.includes('spi') ||
    posLower.includes('spi') ||
    posLower.includes('auditor') ||
    posLower.includes('pengawas')
  ) {
    labelPrefix = 'Pengawas SPI:';
    labelColor = 'font-semibold text-rose-300';
    orderPriority = 16;
  }
  // 8. Administrator TU / Sekretariat / Pengendali Surat
  else if (
    roleSlug === 'admin_tu' ||
    posLower.includes('tata usaha') ||
    posLower.includes('persuratan') ||
    posLower.includes('pengadministrasi') ||
    posLower.includes('operator')
  ) {
    labelPrefix = 'Staf TU:';
    labelColor = 'font-semibold text-amber-400';
    orderPriority = 17;
  }
  // 9. Dosen / Staff Drafter (Konseptor Tridharma)
  else if (
    roleSlug === 'drafter' ||
    String(u.role || '').toUpperCase() === 'DOSEN' ||
    posLower.includes('dosen')
  ) {
    labelPrefix = 'Dosen:';
    labelColor = 'font-semibold text-sky-300';
    orderPriority = 18;
  }
  // 10. Pejabat Umum Lainnya
  else if (
    roleSlug === 'pimpinan' ||
    u.is_pejabat === true ||
    String(u.role || '').toUpperCase() === 'PEJABAT'
  ) {
    labelPrefix = 'Pejabat:';
    labelColor = 'font-semibold text-emerald-400';
    orderPriority = 19;
  }
  // 11. Staf Pelaksana
  else {
    labelPrefix = 'Staf:';
    labelColor = 'font-semibold text-slate-300';
    orderPriority = 20;
  }

  return {
    id: u.id || u.email,
    labelPrefix,
    labelColor,
    displayName: shortName || name,
    email: u.email || u.username,
    password: u.raw_password || u.password || 'Siloka2026!',
    isSuper: false,
    title: `${u.jabatan || u.roleLabel || labelPrefix} (${u.nama_lengkap || name})`,
    orderPriority
  };
};

export const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sinkronisasi dinamis daftar akun uji coba langsung dari modul Manajemen Pengguna
  const [demoUsers, setDemoUsers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('siloka_users_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = deduplicateUsers(parsed);
            if (valid.length > 0) return valid;
          }
        }
      } catch (e) {}
    }
    return deduplicateUsers(usersData);
  });

  const syncUsers = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Ambil data pengguna terbaru dari backend database API
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: 'Bearer superadmin-secret-token',
          'x-user-role': 'SUPER_ADMIN'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const valid = deduplicateUsers(json.data);
          if (valid.length > 0) {
            setDemoUsers(valid);
            try {
              localStorage.setItem('siloka_users_data', JSON.stringify(valid));
            } catch (e) {}
            return;
          }
        }
      }
    } catch (e) {
      // Backend offline, lanjutkan membaca dari penyimpanan lokal
    } finally {
      setIsSyncing(false);
    }

    // 2. Baca dari penyimpanan lokal browser
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('siloka_users_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = deduplicateUsers(parsed);
            if (valid.length > 0) {
              setDemoUsers(valid);
              return;
            }
          }
        }
      } catch (e) {}
    }

    // 3. Fallback: master dataset resmi kepegawaian
    setDemoUsers(deduplicateUsers(usersData));
  }, []);

  useEffect(() => {
    let isMounted = true;

    syncUsers();

    const handleStorageOrUpdate = () => {
      if (isMounted) {
        syncUsers();
      }
    };

    window.addEventListener('storage', handleStorageOrUpdate);
    window.addEventListener('siloka:users-updated', handleStorageOrUpdate);
    window.addEventListener('siloka:user-deleted', handleStorageOrUpdate);
    window.addEventListener('siloka:rbac-change', handleStorageOrUpdate);
    window.addEventListener('focus', handleStorageOrUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageOrUpdate);
      window.removeEventListener('siloka:users-updated', handleStorageOrUpdate);
      window.removeEventListener('siloka:user-deleted', handleStorageOrUpdate);
      window.removeEventListener('siloka:rbac-change', handleStorageOrUpdate);
      window.removeEventListener('focus', handleStorageOrUpdate);
    };
  }, [syncUsers]);

  // Format opsi tombol akun masuk terhubung langsung dengan profil Manajemen Pengguna
  const demoButtons = useMemo(() => {
    const list = Array.isArray(demoUsers) && demoUsers.length > 0 ? demoUsers : CANONICAL_MANAJEMEN_PENGGUNA_USERS;
    const deduped = deduplicateUsers(list);
    const formatted = deduped.map(mapUserToDemoPreset);
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

          {/* Quick Demo Preset Accounts - Terintegrasi dengan Manajemen Pengguna & Peran (Real-Time) */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pilihan Akun Masuk (Uji Coba):
              </p>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-Time
                </span>
                <button
                  type="button"
                  onClick={() => syncUsers()}
                  title="Sinkronisasikan ulang akun secara real-time dari Manajemen Pengguna Super Admin"
                  className="p-1 rounded text-slate-400 hover:text-unsil-gold-300 hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Refresh Akun Uji Coba"
                >
                  <RotateCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-unsil-gold-400' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] max-h-64 sm:max-h-72 overflow-y-auto pr-1">
              {demoButtons.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    setUsername(btn.email);
                    setPassword(btn.password || 'Siloka2026!');
                    setErrorMsg('');
                  }}
                  className={`p-1.5 rounded text-left transition truncate cursor-pointer flex items-center gap-1.5 ${
                    btn.isSuper
                      ? 'bg-unsil-gold-500/20 hover:bg-unsil-gold-500/30 text-unsil-gold-200 border border-unsil-gold-500/50 col-span-2 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                  }`}
                  title={btn.title}
                >
                  <span className={`${btn.labelColor} shrink-0`}>{btn.labelPrefix}</span>
                  <span className="truncate">{btn.displayName}</span>
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

