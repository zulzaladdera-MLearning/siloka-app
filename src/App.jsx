import React, { useState, useMemo, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { MetricCards } from './components/dashboard/MetricCards';
import { ActivityTable } from './components/dashboard/ActivityTable';
import { LetterDetailModal } from './components/dashboard/LetterDetailModal';
import { QuickDisposisiModal } from './components/dashboard/QuickDisposisiModal';
import { DocumentBuilderModal } from './components/documents/DocumentBuilderModal';
import { TtePassphraseModal } from './components/security/TtePassphraseModal';
import {
  DisposisiView,
  ParafTteView,
  RetensiArsipView,
  BrankasDigitalView,
} from './components/dashboard/ModuleViews';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { PermissionManagementView } from './components/admin/PermissionManagementView';
import { RoleManagementView } from './components/admin/RoleManagementView';
import { Toast } from './components/ui/Toast';
import { Inbox, Send, Plus, Trash2, Receipt, Users, CheckSquare } from 'lucide-react';
import { BukuAgendaView } from './components/dashboard/BukuAgendaView';

import initialLetters from './data/letters.json';
import usersData from './data/users.json';
import unitKerjaList from './data/unitKerja.json';
import { CreateLetterModal } from './components/dashboard/CreateLetterModal';
import { initialAuditLogs, createAuditEntry } from './utils/security';
import { DOCUMENT_TEMPLATES } from './components/documents/DocumentTemplates';
import { ProcessMiningLogger, PROCESS_ACTIVITIES } from './domain';
import { isLetterSignatureRequest, canUserRegisterIncomingLetter } from './utils/letterActionPolicy';
import {
  isSuperAdminUser,
  canAccessBrankasDigital,
  isDosenTanpaJabatan,
  getQueueAccessPolicy,
  isLetterOwnedByUser,
  isMandiriPersonalDocument
} from './utils/authGuards';
import { sanitizeUiText, sanitizeErrorMessage } from './utils/antiSlopGuard';
import { incrementSequenceSession } from './services/letterService';
import {
  getTabFromPathname,
  getPathFromTab,
  syncUrlWithTab
} from './utils/routeNavigation';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const isExplicitlyLoggedOut =
        localStorage.getItem('siloka_logged_out') ||
        sessionStorage.getItem('siloka_logged_out');
      if (isExplicitlyLoggedOut === 'true') {
        return null;
      }

      const authToken =
        localStorage.getItem('siloka_auth_token') ||
        sessionStorage.getItem('siloka_auth_token');
      const savedUser =
        localStorage.getItem('siloka_active_user') ||
        sessionStorage.getItem('siloka_active_user');

      // Only re-hydrate user if an active auth token exists
      if (authToken && savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.email || parsed.username || parsed.id)) {
          const emailLower = String(parsed.email || parsed.username || '').toLowerCase();
          const nameLower = String(parsed.nama_lengkap || parsed.nama || parsed.name || '').toLowerCase();
          const posLower = String(parsed.jabatan || parsed.roleLabel || parsed.role_label || '').toLowerCase();
          const hasStructuralKeyword = /\b(rektor|dekan|direktur|ketua|kepala|koordinator|kaprodi|kajur|sekretaris)\b/i.test(posLower);
          if (
            Number(parsed.id_role) === 7 ||
            emailLower.includes('aris.martono') ||
            emailLower.includes('aris.test') ||
            emailLower.includes('dosen.') ||
            emailLower.includes('fajar.nugraha') ||
            nameLower.includes('aris martono') ||
            nameLower.includes('zulza laddera') ||
            (/\bdosen\b/i.test(posLower) && !hasStructuralKeyword)
          ) {
            parsed.role = 'DOSEN_NON_JABATAN';
            parsed.role_key = 'DOSEN_NON_JABATAN';
            parsed.id_role = 7;
            parsed.roleLabel = parsed.roleLabel || parsed.jabatan || 'Dosen Tanpa Jabatan';
            parsed.jabatan = parsed.jabatan || parsed.roleLabel || 'Dosen Tanpa Jabatan';
            parsed.is_pejabat = false;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved user', e);
    }
    // Default to unauthenticated (LoginPage will be shown first)
    return null;
  });

  const [letters, setLetters] = useState(() => {
    try {
      // Periksa flag pembersihan riwayat naskah dummy lama (Surat Masuk & Surat Keluar) di browser
      const isLettersPurged = localStorage.getItem('siloka_letters_purged_v3');

      const savedLetters = localStorage.getItem('siloka_letters_data');
      if (savedLetters) {
        let parsed = JSON.parse(savedLetters);
        if (Array.isArray(parsed)) {
          // Bersihkan seluruh riwayat naskah dinas dummy lama dari penyimpanan lokal peramban
          if (!isLettersPurged) {
            parsed = [];
            try {
              localStorage.setItem('siloka_letters_data', JSON.stringify([]));
              localStorage.setItem('siloka_letters_purged_v3', 'true');
            } catch (err) {
              // ignore
            }
          }

          return parsed;
        }
      } else {
        localStorage.setItem('siloka_letters_purged_v3', 'true');
      }
    } catch (e) {
      console.error('Error loading saved letters', e);
    }
    return initialLetters;
  });

  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);

  // State master users yang dapat dimutasi dan diperbarui via modul Manajemen Pengguna
  // Kebijakan: Hanya mempertahankan akun Super Administrator, menghapus seluruh pengguna non-super-admin
  const [allUsers, setAllUsers] = useState(() => {
    try {
      const savedUsers = localStorage.getItem('siloka_users_data');
      if (savedUsers) {
        let parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Hanya pertahankan Super Administrator asli sistem
          const superAdminsOnly = parsed.filter(
            (u) =>
              isSuperAdminUser(u) &&
              u.id !== 'usr-admin-01' &&
              u.id !== 'usr-00' &&
              !String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA')
          );

          if (superAdminsOnly.length > 0) {
            localStorage.setItem('siloka_users_data', JSON.stringify(superAdminsOnly));
            return superAdminsOnly;
          }
        }
      }
    } catch (e) {
      console.error('Error loading saved users', e);
    }

    // Default: Ambil hanya akun Super Administrator dari seed usersData
    const defaultSuperAdmins = usersData.filter(
      (u) =>
        isSuperAdminUser(u) &&
        u.id !== 'usr-admin-01' &&
        u.id !== 'usr-00' &&
        !String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA')
    );

    try {
      localStorage.setItem('siloka_users_data', JSON.stringify(defaultSuperAdmins));
    } catch (e) {
      console.error('Error saving initial super admin', e);
    }
    return defaultSuperAdmins;
  });

  const handleDeleteUser = (userId) => {
    setAllUsers((prev) => {
      // Proteksi mutlak: Akun Super Administrator sistem tidak boleh dihapus
      const filtered = prev.filter((u) => u.id !== userId || isSuperAdminUser(u));
      try {
        localStorage.setItem('siloka_users_data', JSON.stringify(filtered));
      } catch (e) {
        console.error('Error deleting user', e);
      }
      return filtered;
    });
  };

  const handleDeleteAllExceptSuperAdmin = () => {
    setAllUsers((prev) => {
      const superAdmins = prev.filter((u) => isSuperAdminUser(u));
      const finalUsers =
        superAdmins.length > 0
          ? superAdmins
          : usersData.filter((u) => isSuperAdminUser(u));
      try {
        localStorage.setItem('siloka_users_data', JSON.stringify(finalUsers));
      } catch (e) {
        console.error('Error clearing non-super-admin users', e);
      }
      return finalUsers;
    });
  };

  const handleUpdateUsers = (updatedOrNewUsers) => {
    setAllUsers((prev) => {
      const copy = [...prev];
      updatedOrNewUsers.forEach((newU) => {
        const existingIdx = copy.findIndex(
          (u) =>
            u.id === newU.id ||
            (u.nip && u.nip === newU.nip) ||
            (u.nip_nik && u.nip_nik === newU.nip_nik)
        );
        if (existingIdx !== -1) {
          copy[existingIdx] = { ...copy[existingIdx], ...newU };
        } else {
          copy.unshift(newU);
        }

        // Sinkronisasi real-time ke akun aktif saat ini jika user yang diedit sedang login
        if (
          currentUser &&
          (currentUser.id === newU.id ||
            (currentUser.nip && currentUser.nip === newU.nip) ||
            (currentUser.email && currentUser.email === newU.email))
        ) {
          setCurrentUser((curr) => ({ ...curr, ...newU }));
        }
      });
      try {
        localStorage.setItem('siloka_users_data', JSON.stringify(copy));
      } catch (e) {
        console.error('Failed to persist users', e);
      }
      return copy;
    });
  };

  const [activeTab, setActiveTab] = useState(() => {
    try {
      // 1. Periksa path URL dari 404 redirection (Cloudflare Pages fallback)
      const redirectPath = sessionStorage.getItem('siloka_redirect_path');
      if (redirectPath) {
        sessionStorage.removeItem('siloka_redirect_path');
        const tabFromRedirect = getTabFromPathname(redirectPath);
        if (tabFromRedirect) {
          return tabFromRedirect;
        }
      }

      // 2. Baca URL browser saat ini (misal: /surat-masuk -> 'surat-masuk')
      if (typeof window !== 'undefined' && window.location.pathname) {
        const tabFromUrl = getTabFromPathname(window.location.pathname);
        if (tabFromUrl) {
          return tabFromUrl;
        }
      }

      // 3. Fallback ke tab yang disimpan di penyimpanan lokal
      const savedTab = localStorage.getItem('siloka_active_tab');
      if (savedTab) {
        return savedTab;
      }
    } catch (e) {
      console.warn('Error determining initial active tab', e);
    }
    return 'dashboard';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [metricFilter, setMetricFilter] = useState(null);

  // Sync active user to storage (respecting rememberMe preference)
  useEffect(() => {
    if (currentUser) {
      if (localStorage.getItem('siloka_auth_token')) {
        localStorage.setItem('siloka_active_user', JSON.stringify(currentUser));
      } else if (sessionStorage.getItem('siloka_auth_token')) {
        sessionStorage.setItem('siloka_active_user', JSON.stringify(currentUser));
      }
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('siloka_letters_data', JSON.stringify(letters));
    } catch (e) {
      console.error('Failed to persist letters', e);
    }
  }, [letters]);

  // Sinkronisasi navigasi tombol Back/Forward (popstate) browser dengan activeTab
  useEffect(() => {
    const handlePopState = () => {
      const tabFromUrl = getTabFromPathname(window.location.pathname) || 'dashboard';
      setActiveTab(tabFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sinkronisasi activeTab ke localStorage dan address bar browser secara real-time
  useEffect(() => {
    try {
      localStorage.setItem('siloka_active_tab', activeTab);
    } catch (e) {
      console.error('Failed to persist active tab', e);
    }

    if (currentUser) {
      syncUrlWithTab(activeTab);
    }
  }, [activeTab, currentUser]);

  // Validasi proteksi akses rute berdasarkan otorisasi peran pengguna aktif
  useEffect(() => {
    if (!currentUser) return;

    if (
      (activeTab === 'settings' ||
        activeTab === 'manajemen-user' ||
        activeTab === 'manajemen-role' ||
        activeTab === 'manajemen-permission') &&
      !isSuperAdminUser(currentUser)
    ) {
      showToast('Akses Terbatas: Menu Manajemen hanya dapat diakses oleh Super Administrator.', 'error');
      setActiveTab('dashboard');
      syncUrlWithTab('dashboard', true);
    } else if (
      activeTab === 'brankas-digital' &&
      !canAccessBrankasDigital(currentUser)
    ) {
      showToast('Akses Terbatas: Menu Brankas Digital hanya untuk Pejabat Struktural & Arsiparis.', 'error');
      setActiveTab('dashboard');
      syncUrlWithTab('dashboard', true);
    }
  }, [activeTab, currentUser]);

  // Security, Units & Modals
  const [tteTargetLetter, setTteTargetLetter] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isDisposisiOpen, setIsDisposisiOpen] = useState(false);
  const [disposisiTargetLetter, setDisposisiTargetLetter] = useState(null);
  const [isCreateLetterOpen, setIsCreateLetterOpen] = useState(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');

  // Identitas Unit Kerja Pengguna Aktif
  const currentUnit = useMemo(() => {
    return (
      unitKerjaList.find((u) => u.kode_unit === currentUser?.unit_kerja_id || u.id === currentUser?.unit_kerja_id) || {
        id: 6,
        kode_unit: 'UN58.6',
        nama_unit: 'Biro Keuangan dan Umum',
        singkatan: 'BKU',
        tipe_unit: 'BIRO'
      }
    );
  }, [currentUser]);

  // Hak Akses Lintas Unit (University-Wide Access):
  // Rektorat (UN58), Kepala Biro (UN58.6), atau Satuan Pengawas Internal (UN58.SPI)
  const isUniversityWideAccess =
    currentUser?.role === 'PENGAWAS' ||
    currentUser?.unit_kerja_id === 'UN58.SPI' ||
    (currentUser?.role === 'PEJABAT' &&
      (currentUser?.unit_kerja_id === 'UN58' || currentUser?.unit_kerja_id === 'UN58.6'));

  // Helper otorisasi Bagian IT / UPT TIK (Unit Penunjang Akademik Teknologi Informasi & Komunikasi)
  const isUptTikUser = (user) => {
    if (!user) return false;
    return Boolean(
      user.unit_kerja_id === 'UN58.32' ||
      user.unit_kerja_id === 'UN58.TIK' ||
      user.kode_unit === 'UN58.32' ||
      user.kode_unit === 'UN58.TIK' ||
      (user.email && (user.email.includes('tik@unsil.ac.id') || user.email.includes('it@unsil.ac.id'))) ||
      (user.roleLabel && (
        user.roleLabel.toLowerCase().includes('tik') ||
        /\b(it|ti)\b/i.test(user.roleLabel) ||
        user.roleLabel.toLowerCase().includes('teknologi informasi') ||
        user.roleLabel.toLowerCase().includes('programmer') ||
        user.roleLabel.toLowerCase().includes('server')
      )) ||
      (user.unit && (
        user.unit.toLowerCase().includes('tik') ||
        user.unit.toLowerCase().includes('teknologi informasi')
      ))
    );
  };

  // Multi-Tenancy & Strict Personal Isolation Scoping (SK Rektor UNSIL No. 2803 Tahun 2023):
  // 1. DOSEN_NON_JABATAN (Dosen Tanpa Jabatan): Strict Personal Isolation (WHERE creator_id = $1)
  //    Dosen A hanya dapat melihat & membubuhkan TTE pada naskah yang dibuat oleh dirinya sendiri.
  //    Dosen B sama sekali tidak bisa melihat draf milik Dosen A meskipun berada di fakultas/unit yang sama.
  // 2. 3 Entitas Pengecualian Akses Massal:
  //    - Pimpinan Unit Struktural (Rektor/Dekan/Kajur): Target Penandatangan Akhir (TTE)
  //    - Staf Ketatausahaan / Arsiparis TU Fakultas & Biro: Kebutuhan penomoran resmi naskah dinas
  //    - Super Admin: Kontrol sistem secara global
  const scopedLetters = useMemo(() => {
    if (!currentUser) return [];

    // STRICT PERSONAL ISOLATION untuk Dosen Tanpa Jabatan (SKKAAD SK Rektor No. 2803/2023)
    if (isDosenTanpaJabatan(currentUser)) {
      const userId = String(currentUser.id_user || currentUser.id || 'dosen-active');
      const userName = currentUser.nama_lengkap || currentUser.nama || currentUser.name || 'Dosen Pengusul';
      const userNip = currentUser.nip_nik || currentUser.nip || '-';
      const userEmail = currentUser.email || '';
      const unitId = currentUser.unit_kerja_id || currentUnit.kode_unit || 'UN58.13';
      const unitShort = currentUnit.singkatan || 'FT';
      const unitFullName = currentUnit.nama_unit || 'Fakultas Teknik';

      // Filter ketat: HANYA surat yang dibuat oleh dosen yang sedang login (WHERE creator_id = $1)
      const ownedLetters = letters.filter((letter) => isLetterOwnedByUser(letter, currentUser));

      // Jika dosen belum memiliki draf pribadi di state, sediakan draf personal miliknya sendiri (terkunci pada creator_id dosen aktif)
      const hasPersonalNotaDinas = ownedLetters.some((l) => String(l.id).includes(`ND-PERSONAL-${userId}`));
      const personalSeedDrafts = hasPersonalNotaDinas
        ? []
        : [
            {
              id: `ND-PERSONAL-${userId}-01`,
              nomorSurat: `DRAFT/ND/${unitShort}/2026`,
              tanggal: new Date().toISOString().split('T')[0],
              perihal: `Nota Dinas Laporan Kesiapan Perkuliahan & Praktikum Semester Ganjil (${userName})`,
              kategori: 'Nota Dinas',
              jenis_naskah: 'NOTA_DINAS',
              kode_jenis_naskah: 'NOTA_DINAS',
              kategori_akses: 'MANDIRI_DOSEN',
              sifat: 'Penting',
              kategoriKeamanan: 'Terbatas',
              kodeKlasifikasi: 'PP',
              subKlasifikasi: 'PP.01.02 (Perkuliahan & Evaluasi Akademik)',
              pengirim: `${userName} (NIP. ${userNip})`,
              tujuan: `Dekan ${unitFullName} melalui Ketua Jurusan`,
              status: 'Diparaf',
              status_db: 'SIAP_TTE',
              statusTimestamp: 'Siap Ditandatangani Secara Elektronik (TTE Mandiri)',
              ringkasan: `Nota dinas internal yang disusun dan ditandatangani langsung oleh ${userName} mengenai evaluasi pelaksanaan perkuliahan dan kesiapan modul praktikum pada ${unitFullName}.`,
              tteVerified: false,
              isLockedPermanen: false,
              unit_kerja_id: unitId,
              creator_id: userId,
              created_by_user_id: userId,
              creator_nip: userNip,
              creator_email: userEmail,
              creator_name: userName,
              created_at: new Date().toISOString(),
              riwayatParaf: [
                {
                  nama: userName,
                  jabatan: currentUser.roleLabel || 'Dosen Tanpa Jabatan',
                  waktu: 'Hari ini, 08:30 WIB',
                  catatan: 'Konsep Nota Dinas Mandiri dibuat oleh Dosen Pembuat (Siap TTE Mandiri)'
                }
              ]
            },
            {
              id: `LAP-PERSONAL-${userId}-02`,
              nomorSurat: `DRAFT/LAP/${unitShort}/2026`,
              tanggal: new Date().toISOString().split('T')[0],
              perihal: `Laporan Pelaksanaan Kegiatan Tridharma Perguruan Tinggi & Bimbingan Akademik (${userName})`,
              kategori: 'Laporan',
              jenis_naskah: 'LAPORAN',
              kode_jenis_naskah: 'LAPORAN',
              kategori_akses: 'MANDIRI_DOSEN',
              sifat: 'Biasa',
              kategoriKeamanan: 'Terbatas',
              kodeKlasifikasi: 'PP',
              subKlasifikasi: 'PP.00.03 (Pelaksanaan Tridharma Perguruan Tinggi)',
              pengirim: `${userName} (NIP. ${userNip})`,
              tujuan: `Dekan ${unitFullName}`,
              status: 'Diparaf',
              status_db: 'SIAP_TTE',
              statusTimestamp: 'Siap Ditandatangani Secara Elektronik (TTE Mandiri)',
              ringkasan: `Laporan pertanggungjawaban pelaksanaan kegiatan pengajaran, penelitian, dan pengabdian masyarakat semester berjalan oleh ${userName}.`,
              tteVerified: false,
              isLockedPermanen: false,
              unit_kerja_id: unitId,
              creator_id: userId,
              created_by_user_id: userId,
              creator_nip: userNip,
              creator_email: userEmail,
              creator_name: userName,
              created_at: new Date().toISOString(),
              riwayatParaf: [
                {
                  nama: userName,
                  jabatan: currentUser.roleLabel || 'Dosen Tanpa Jabatan',
                  waktu: 'Hari ini, 09:00 WIB',
                  catatan: 'Konsep Laporan Tridharma disusun oleh Dosen Pembuat (Siap TTE Mandiri)'
                }
              ]
            },
            {
              id: `ST-PERSONAL-${userId}-03`,
              nomorSurat: `[Menunggu Penomoran TU ${unitShort}]`,
              tanggal: new Date().toISOString().split('T')[0],
              perihal: `Draft Konsep Surat Tugas Pemateri Seminar & Pengabdian Masyarakat a.n. ${userName}`,
              kategori: 'Surat Tugas',
              jenis_naskah: 'SURAT_TUGAS',
              kode_jenis_naskah: 'SURAT_TUGAS',
              kategori_akses: 'KONSEP_PIMPINAN',
              sifat: 'Segera',
              kategoriKeamanan: 'Terbatas',
              kodeKlasifikasi: 'KP',
              subKlasifikasi: 'KP.04.01 (Penugasan Dosen & Tenaga Pendidik)',
              pengirim: `Konseptor: ${userName} (Diajukan ke Dekan ${unitShort})`,
              tujuan: `Dekan ${unitFullName} (Target Penandatangan Akhir TTE)`,
              status: 'Diparaf',
              status_db: 'DIPARAF',
              statusTimestamp: 'Dalam Antrean Verifikasi Paraf Berjenjang -> TTE Dekan',
              ringkasan: `Draf pengajuan Surat Tugas yang dikonsep oleh ${userName} untuk ditandatangani secara elektronik (TTE) oleh Dekan ${unitFullName}.`,
              tteVerified: false,
              isLockedPermanen: false,
              unit_kerja_id: unitId,
              creator_id: userId,
              created_by_user_id: userId,
              creator_nip: userNip,
              creator_email: userEmail,
              creator_name: userName,
              created_at: new Date().toISOString(),
              riwayatParaf: [
                {
                  nama: userName,
                  jabatan: `Pembuat Konsep (${currentUser.roleLabel || 'Dosen Tanpa Jabatan'})`,
                  waktu: 'Hari ini, 09:15 WIB',
                  catatan: 'Draf Surat Tugas diajukan ke alur verifikasi berjenjang untuk TTE Pimpinan Unit'
                }
              ]
            }
          ];

      return [...ownedLetters, ...personalSeedDrafts];
    }

    if (isUniversityWideAccess || isSuperAdminUser(currentUser)) {
      if (selectedUnitFilter && selectedUnitFilter !== 'ALL') {
        return letters.filter((l) => l.unit_kerja_id === selectedUnitFilter);
      }
      return letters;
    }

    // Scoping untuk Pimpinan Fakultas/Unit, Penugasan Unit Sekunder (misal: Dosen FT dengan Tugas Tambahan di LPPM), dan Staf TU
    const activeSecondaryUnits = Array.isArray(currentUser?.secondary_units)
      ? currentUser.secondary_units
      : [];

    return letters.filter((letter) => {
      // Dibuat oleh atau milik unit kerja utama user yang sedang login
      if (letter.unit_kerja_id === currentUser.unit_kerja_id) return true;

      // Cek apakah surat milik salah satu Unit Sekunder / Tugas Tambahan aktif (misal: LPPM / UN58.08)
      const matchesSecondaryUnit = activeSecondaryUnits.some(
        (sec) =>
          letter.unit_kerja_id === sec.unit_kerja_id ||
          letter.unit_kerja_id === sec.kode_unit ||
          (sec.kode_unit && String(letter.tujuan || '').toUpperCase().includes(sec.kode_unit)) ||
          (sec.nama_unit && String(letter.tujuan || '').toLowerCase().includes(sec.nama_unit.toLowerCase()))
      );
      if (matchesSecondaryUnit) return true;

      // Surat masuk yang dialamatkan kepada unit atau pimpinan unit
      const userUnitShort = (currentUnit.singkatan || '').toLowerCase();
      const userUnitName = (currentUnit.nama_unit || '').toLowerCase();
      const letterTujuan = (letter.tujuan || '').toLowerCase();
      if (userUnitShort && letterTujuan.includes(userUnitShort)) return true;
      if (userUnitName && letterTujuan.includes(userUnitName)) return true;

      return false;
    });
  }, [letters, currentUser, currentUnit, isUniversityWideAccess, selectedUnitFilter]);

  // Toast feedback (guarded by anti-slop copy/error filter)
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    const cleanMessage =
      type === 'error' ? sanitizeErrorMessage(message) : sanitizeUiText(message);
    setToast({ message: cleanMessage, type });
    setTimeout(() => setToast(null), 3500);
  };

  const recordAuditLog = ({ action, details, severity = 'NORMAL', ipAddress = '10.58.12.44' }) => {
    const entry = createAuditEntry({
      user: currentUser,
      action,
      details,
      severity,
      ipAddress
    });
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const handleLogin = (user, rememberMe = true) => {
    // Clear any previous logout flags
    localStorage.removeItem('siloka_logged_out');
    sessionStorage.removeItem('siloka_logged_out');

    const tokenPayload = {
      id_user: user.id || user.id_user,
      role: user.role,
      is_super_admin: isSuperAdminUser(user),
      nama: user.nama || user.nama_lengkap || user.name
    };
    let base64Payload = '';
    try {
      base64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))));
    } catch {
      base64Payload = 'eyJyb2xlIjoiU3VwZXIgQWRtaW4ifQ';
    }
    const generatedToken = `siloka_jwt.${base64Payload}.${Date.now()}`;

    if (rememberMe) {
      localStorage.setItem('siloka_auth_token', generatedToken);
      localStorage.setItem('siloka_active_user', JSON.stringify(user));
      // Purge session storage
      sessionStorage.removeItem('siloka_auth_token');
      sessionStorage.removeItem('siloka_active_user');
    } else {
      sessionStorage.setItem('siloka_auth_token', generatedToken);
      sessionStorage.setItem('siloka_active_user', JSON.stringify(user));
      // Purge local storage
      localStorage.removeItem('siloka_auth_token');
      localStorage.removeItem('siloka_active_user');
    }

    setCurrentUser(user);

    // Buka rute/tab yang diminta pengguna sebelum login jika ada
    const redirectPath = sessionStorage.getItem('siloka_redirect_path');
    const postLoginTab = sessionStorage.getItem('siloka_post_login_tab');
    const targetTab = (redirectPath && getTabFromPathname(redirectPath)) || postLoginTab;

    if (targetTab) {
      sessionStorage.removeItem('siloka_redirect_path');
      sessionStorage.removeItem('siloka_post_login_tab');
      setActiveTab(targetTab);
      syncUrlWithTab(targetTab, true);
    } else {
      syncUrlWithTab(activeTab, true);
    }

    const entry = createAuditEntry({
      user,
      action: 'AUTH_LOGIN_SUCCESS',
      details: `Login berhasil melalui Intranet Kampus UNSIL (${user.roleLevel || user.role})`,
      severity: 'NORMAL'
    });
    setAuditLogs((prev) => [entry, ...prev]);
    showToast(`Selamat datang di SILOKA, ${user.nama_lengkap || user.name}!`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      recordAuditLog({
        action: 'AUTH_LOGOUT',
        details: `Sesi berakhir atas inisiatif pengguna: ${currentUser.nama_lengkap || currentUser.name}`
      });
    }

    // Set logout flag & purge both storage locations
    localStorage.setItem('siloka_logged_out', 'true');
    sessionStorage.setItem('siloka_logged_out', 'true');
    localStorage.removeItem('siloka_active_user');
    localStorage.removeItem('siloka_auth_token');
    sessionStorage.removeItem('siloka_active_user');
    sessionStorage.removeItem('siloka_auth_token');

    setCurrentUser(null);
    setActiveTab('dashboard');
    syncUrlWithTab('dashboard', true);
    showToast('Anda telah keluar dari sesi SILOKA.', 'info');
  };

  const handleOpenDisposisiForLetter = (letter) => {
    if (currentUser?.role === 'PENGAWAS') {
      showToast('Akses Read-Only: Pengawas SPI tidak berwenang menerbitkan disposisi.', 'warning');
      return;
    }
    // Staf Tata Usaha & Operator Unit bertugas meregistrasi naskah, disposisi merupakan hak pimpinan
    if (
      currentUser?.role === 'STAF' ||
      currentUser?.role === 'STAF_PERSURATAN' ||
      currentUser?.role === 'OPERATOR_UNIT' ||
      currentUser?.role === 'OPERATOR'
    ) {
      showToast('Akses Dibatasi: Staf bertugas meregistrasi naskah masuk. Pemberian instruksi disposisi merupakan wewenang pimpinan.', 'warning');
      return;
    }
    // STRICT BUSINESS RULE: Naskah permohonan TTE DILARANG KERAS didisposisikan
    if (isLetterSignatureRequest(letter)) {
      showToast('ATURAN KETAT: Naskah Permohonan Tanda Tangan (TTE) DILARANG didisposisikan.', 'warning');
      return;
    }
    setDisposisiTargetLetter(letter);
    setIsDisposisiOpen(true);
  };

  // Penghapusan Riwayat Naskah Dinas Per-Item dengan Validasi & Audit Trail
  const handleDeleteLetter = (letterToDelete) => {
    if (!letterToDelete || !letterToDelete.id) return;
    if (currentUser?.role === 'PENGAWAS') {
      showToast('Akses Read-Only: Pengawas SPI berstatus peninjau dan tidak berwenang menghapus riwayat naskah.', 'warning');
      return;
    }
    if (letterToDelete.isLockedPermanen) {
      showToast('Akses Ditolak: Berkas ini berstatus Arsip Permanen dan dilindungi regulasi kearsipan.', 'error');
      return;
    }

    setLetters((prev) => prev.filter((l) => l.id !== letterToDelete.id));
    showToast(`Naskah ${letterToDelete.nomorSurat || 'dinas'} berhasil dihapus dari riwayat.`, 'success');

    handleLogAction({
      action: 'LETTER_DELETED',
      details: `Penghapusan riwayat naskah dinas: ${letterToDelete.nomorSurat || letterToDelete.id} (${letterToDelete.perihal || 'Naskah'}) oleh ${currentUser?.nama_lengkap || currentUser?.name || 'Pengguna'}`,
      severity: 'WARNING'
    });
  };

  // Feature 6: Review & Approval Workflow (Setujui Naskah)
  const handleApproveLetter = (letterId, note) => {
    let approvedNomor = '';
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';

    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          approvedNomor = l.nomorSurat;
          return {
            ...l,
            status: 'Disetujui',
            statusTimestamp: 'Disetujui Pimpinan',
            riwayatParaf: [
              ...(l.riwayatParaf || []),
              {
                nama: currentUser.nama_lengkap || currentUser.name,
                jabatan: currentUser.roleLabel || 'Pejabat Penandatangan',
                waktu: timestamp,
                catatan: note || 'Naskah dinas telah diverifikasi dan disetujui untuk diterbitkan / ditandatangani.'
              }
            ]
          };
        }
        return l;
      })
    );

    recordAuditLog({
      action: 'LETTER_APPROVED',
      details: `Persetujuan naskah dinas ${approvedNomor || letterId} oleh ${currentUser.nama_lengkap || currentUser.name} (${currentUser.roleLabel})`
    });

    ProcessMiningLogger.getInstance().recordEvent(
      letterId,
      'APPROVAL_GRANTED',
      currentUser,
      {
        status: 'Disetujui',
        catatan: note || 'Disetujui pimpinan',
        slaHours: 12
      }
    );

    showToast('Naskah dinas berhasil disetujui!', 'success');
  };

  // Feature 6: Review & Approval Workflow (Tolak / Minta Revisi Naskah)
  const handleRejectLetter = (letterId, note) => {
    let rejectedNomor = '';
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';

    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          rejectedNomor = l.nomorSurat;
          return {
            ...l,
            status: 'Ditolak',
            statusTimestamp: 'Dikembalikan untuk Revisi',
            riwayatParaf: [
              ...(l.riwayatParaf || []),
              {
                nama: currentUser.nama_lengkap || currentUser.name,
                jabatan: currentUser.roleLabel || 'Pejabat Penandatangan',
                waktu: timestamp,
                catatan: `[CATATAN REVISI / PENOLAKAN]: ${note}`
              }
            ]
          };
        }
        return l;
      })
    );

    recordAuditLog({
      action: 'LETTER_REJECTED',
      details: `Penolakan/permintaan revisi naskah ${rejectedNomor || letterId} oleh ${currentUser.nama_lengkap || currentUser.name}. Alasan: ${note}`,
      severity: 'WARNING'
    });

    ProcessMiningLogger.getInstance().recordEvent(
      letterId,
      'LETTER_REVISION_REQUESTED',
      currentUser,
      {
        status: 'Ditolak',
        revisionNote: note,
        slaHours: 24
      }
    );

    showToast('Catatan revisi berhasil dikirim ke pengusul naskah.', 'info');
  };

  const handleSaveDisposisi = (newDisposisi) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === newDisposisi.letterId) {
          return {
            ...l,
            // Sesuai Pasal 74 Peraturan Rektor No. 3/2023:
            // Surat masuk yang didisposisikan berstatus 'Didisposisikan' (bukan 'Diparaf', karena surat masuk bukan draf internal)
            status: 'Didisposisikan',
            statusTimestamp: `Didisposisikan kepada ${newDisposisi.targetUnit} (Tenggat: ${newDisposisi.dueDate})`,
            disposisi: {
              tujuanDisposisi: newDisposisi.targetUnit,
              actions: newDisposisi.actions || [],
              instruksi: (newDisposisi.actions || []).join(', ') + (newDisposisi.customNote ? ' — Catatan: ' + newDisposisi.customNote : ''),
              batasWaktu: newDisposisi.dueDate,
              sifatInstruksi: newDisposisi.sifatInstruksi,
              customNote: newDisposisi.customNote,
              pemberiDisposisi: newDisposisi.pemberiName || currentUser?.nama_lengkap || currentUser?.name || 'Pimpinan Unit',
              jabatanPemberi: newDisposisi.pemberiJabatan || currentUser?.jabatan || currentUser?.sotk_position_label || currentUser?.roleLabel || 'Pimpinan',
              tanggalDisposisi: new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
            },
          };
        }
        return l;
      })
    );

    recordAuditLog({
      action: 'DISPOSISI_ISSUED',
      details: `Disposisi diterbitkan untuk ${newDisposisi.targetUnit} (Agenda: ${newDisposisi.nomorAgenda}) oleh ${currentUser.name}`
    });

    // Injeksi Asinkron Process Mining: Pemberian Instruksi Disposisi
    ProcessMiningLogger.getInstance().recordEvent(
      newDisposisi.letterId,
      PROCESS_ACTIVITIES.DISPOSITION_ISSUED,
      currentUser,
      {
        targetUnit: newDisposisi.targetUnit,
        nomorAgenda: newDisposisi.nomorAgenda,
        dueDate: newDisposisi.dueDate,
        instruksi: newDisposisi.actions?.join(', ') || newDisposisi.customNote,
        slaHours: 24
      }
    );

    showToast(`E-Disposisi berhasil diteruskan ke ${newDisposisi.targetUnit}!`, 'success');
  };

  const handleSaveNewLetter = (newLetter) => {
    const activeCreatorId = String(currentUser?.id_user || currentUser?.id || 'usr-02');
    const activeCreatorName = currentUser?.nama_lengkap || currentUser?.nama || currentUser?.name || 'Pengguna SILOKA';
    const activeCreatorNip = currentUser?.nip_nik || currentUser?.nip || '-';
    const activeCreatorEmail = currentUser?.email || '';

    const letterWithAudit = {
      ...newLetter,
      unit_kerja_id: newLetter.unit_kerja_id || currentUser?.unit_kerja_id || 'UN58.6',
      creator_id: newLetter.creator_id || activeCreatorId,
      created_by_user_id: newLetter.created_by_user_id || activeCreatorId,
      creator_nip: newLetter.creator_nip || activeCreatorNip,
      creator_email: newLetter.creator_email || activeCreatorEmail,
      creator_name: newLetter.creator_name || activeCreatorName,
      created_at: newLetter.created_at || new Date().toISOString()
    };
    setLetters((prev) => [letterWithAudit, ...prev]);
    const assignedSeq = letterWithAudit.nomor_urut || (
      letterWithAudit.nomorSurat?.match(/^0*([1-9]\d*)\//)
        ? parseInt(letterWithAudit.nomorSurat.match(/^0*([1-9]\d*)\//)[1], 10)
        : null
    );
    incrementSequenceSession(
      letterWithAudit.unit_kerja_id || currentUser?.unit_kerja_id,
      new Date().getFullYear(),
      assignedSeq
    );

    recordAuditLog({
      action: 'LETTER_REGISTERED',
      details: `Registrasi surat dinas baru: ${letterWithAudit.nomorSurat} (${letterWithAudit.perihal.slice(0, 50)}...) oleh ${activeCreatorName} [Unit: ${currentUnit.singkatan}]`
    });

    // Injeksi Asinkron Process Mining: Registrasi Surat Masuk vs Pengajuan Draf Surat
    const isSuratMasuk = letterWithAudit.kategori === 'Surat Masuk';
    ProcessMiningLogger.getInstance().recordEvent(
      letterWithAudit.id || letterWithAudit.nomorSurat,
      isSuratMasuk ? PROCESS_ACTIVITIES.INBOUND_REGISTRATION : PROCESS_ACTIVITIES.DRAFT_SUBMISSION,
      currentUser,
      {
        kategori: letterWithAudit.kategori,
        sifat: letterWithAudit.sifat,
        kategoriKeamanan: letterWithAudit.kategoriKeamanan,
        kodeKlasifikasi: letterWithAudit.kodeKlasifikasi,
        subKlasifikasi: letterWithAudit.subKlasifikasi,
        tujuan: letterWithAudit.tujuan,
        pengirim: letterWithAudit.pengirim,
        slaHours: letterWithAudit.sifat === 'Amat Segera' ? 12 : letterWithAudit.sifat === 'Segera' ? 24 : 48
      }
    );

    showToast(`Surat nomor ${letterWithAudit.nomorSurat} berhasil didaftarkan ke SILOKA!`, 'success');
  };

  // Step 1 of TTE: Check permissions (including Strict Personal Isolation for Dosen Tanpa Jabatan) and prompt passphrase modal
  const handleInitiateTte = (letterId) => {
    const target =
      scopedLetters.find((l) => l.id === letterId) ||
      letters.find((l) => l.id === letterId);

    if (!target) return;

    // 1. Surat Masuk tidak melalui penandatanganan TTE internal (Pasal 74 Peraturan Rektor No. 3/2023)
    if (target.kategori === 'Surat Masuk' || target.kategori === 'Inbound') {
      showToast('Surat Masuk adalah naskah eksternal dan tidak memerlukan TTE internal.', 'info');
      return;
    }

    // 2. Super Admin adalah administrator sistem IT (UPA TIK), bukan pejabat penandatangan naskah dinas
    if (isSuperAdminUser(currentUser)) {
      recordAuditLog({
        action: 'UNAUTHORIZED_TTE_ATTEMPT',
        details: `Penolakan TTE: Akun Administrator Sistem ${currentUser.name} tidak memiliki kewenangan menandatangani naskah dinas ID ${letterId} (Pasal 58/61)`,
        severity: 'WARNING'
      });
      const officialName = target.namaPenandatangan || target.namaPejabat || target.templateData?.namaPejabat || 'Pejabat Penandatangan';
      showToast(`Akses Ditolak: Super Admin adalah Administrator Sistem IT. Naskah ini wajib ditandatangani oleh ${officialName}. Silakan login dengan akun pejabat yang bersangkutan.`, 'warning');
      return;
    }

    // 3. Aturan Khusus Dosen Tanpa Jabatan (Strict Personal Isolation - SK Rektor No. 2803/2023):
    if (isDosenTanpaJabatan(currentUser)) {
      if (!isLetterOwnedByUser(target, currentUser)) {
        recordAuditLog({
          action: 'SKKAAD_ISOLATION_VIOLATION_BLOCKED',
          details: `Blokir Isolasi SKKAAD: ${currentUser.nama_lengkap || currentUser.name} mencoba mengakses/menandatangani draf bukan miliknya (ID: ${letterId})`,
          severity: 'WARNING'
        });
        showToast('Akses Ditolak (Strict Personal Isolation): Anda hanya dapat memeriksa & menandatangani naskah yang dibuat oleh Anda sendiri.', 'error');
        return;
      }

      if (!isMandiriPersonalDocument(target)) {
        showToast(
          'Naskah Kategori Konsep (Drafting) ini diajukan untuk ditandatangani (TTE) oleh Pimpinan Unit Struktural (Dekan/Rektor/Kajur).',
          'info'
        );
        return;
      }

      // Pastikan draf personal sudah tercatat di state letters agar statusnya dapat diperbarui saat TTE selesai
      setLetters((prev) => {
        if (prev.some((l) => l.id === target.id)) return prev;
        return [target, ...prev];
      });
      setTteTargetLetter(target);
      return;
    }

    // 4. Verifikasi Kewenangan Pejabat Penandatangan (Pasal 58 & 61)
    if (currentUser?.role !== 'PIMPINAN' && currentUser?.role !== 'PEJABAT') {
      recordAuditLog({
        action: 'UNAUTHORIZED_TTE_ATTEMPT',
        details: `Penolakan TTE: Akun ${currentUser.name} (${currentUser.roleLevel}) mencoba menandatangani surat ID ${letterId}`,
        severity: 'WARNING'
      });
      showToast('Akses Ditolak: Hanya Pejabat / Pimpinan yang berwenang membubuhkan TTE BSrE.', 'warning');
      return;
    }

    // 5. Cek kesesuaian pejabat penandatangan jika naskah ditujukan ke pejabat tertentu
    const targetSignerNip = target.nipPenandatangan || target.nip || target.templateData?.nip;
    const targetSignerName = target.namaPenandatangan || target.namaPejabat || target.templateData?.namaPejabat;
    if (targetSignerNip && currentUser.nip && currentUser.role !== 'PIMPINAN') {
      const cleanTargetNip = String(targetSignerNip).replace(/\D/g, '');
      const cleanUserNip = String(currentUser.nip).replace(/\D/g, '');
      if (cleanTargetNip && cleanUserNip && cleanTargetNip !== cleanUserNip) {
        showToast(`Akses Ditolak: Naskah dinas ini hanya dapat ditandatangani oleh ${targetSignerName || 'pejabat yang bersangkutan'}.`, 'warning');
        return;
      }
    }

    setTteTargetLetter(target);
  };

  // Step 2 of TTE: Passphrase successfully verified in TtePassphraseModal
  const handleConfirmTteSignature = ({ letterId, certSerial, signerName, signerNip, timestamp }) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          const officialSigner = l.namaPenandatangan || l.namaPejabat || l.templateData?.namaPejabat || signerName;
          const officialNip = l.nipPenandatangan || l.nip || l.templateData?.nip || signerNip;
          const officialJabatan = l.jabatanPenandatangan || l.pengirim || l.templateData?.namaJabatan || currentUser.roleLabel;

          return {
            ...l,
            status: 'Disetujui',
            tteVerified: true,
            statusTimestamp: 'Ditandatangani TTE BSrE',
            namaPenandatangan: officialSigner,
            namaPejabat: officialSigner,
            nipPenandatangan: officialNip,
            jabatanPenandatangan: officialJabatan,
            riwayatParaf: [
              ...(l.riwayatParaf || []),
              {
                nama: officialSigner,
                jabatan: officialJabatan,
                waktu: timestamp,
                catatan: `Tanda Tangan Elektronik (TTE) Tersertifikasi BSrE BSSN dibubuhkan secara sah oleh ${officialSigner} (NIP. ${officialNip}). Seri Sertifikat: ${certSerial}`,
              },
            ],
          };
        }
        return l;
      })
    );

    recordAuditLog({
      action: 'TTE_SIGN_BSRE',
      details: `Pembubuhan TTE BSrE sukses (Sertifikat: ${certSerial}) pada surat ID ${letterId} oleh ${currentUser.name}`
    });

    // Injeksi Asinkron Process Mining: Penandatanganan TTE BSrE
    ProcessMiningLogger.getInstance().recordEvent(
      letterId,
      PROCESS_ACTIVITIES.TTE_SIGNED,
      currentUser,
      {
        certSerial,
        signerName,
        signerNip,
        status: 'APPROVED_AND_SIGNED',
        slaHours: 12
      }
    );

    showToast(`Tanda Tangan Elektronik (TTE BSrE) berhasil dibubuhkan! Cap dinas fisik dihapus otomatis.`, 'success');
  };

  const handleArchiveLetter = (letterId) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          return {
            ...l,
            status: 'Diarsipkan',
            statusTimestamp: 'Diarsipkan ke JRA (Retensi Aktif)',
          };
        }
        return l;
      })
    );

    recordAuditLog({
      action: 'LETTER_ARCHIVED',
      details: `Naskah dinas ID ${letterId} berhasil dipindahkan ke Arsip & Retensi (JRA) oleh ${currentUser.name}`
    });

    // Injeksi Asinkron Process Mining: Pengarsipan Dokumen JRA
    ProcessMiningLogger.getInstance().recordEvent(
      letterId,
      PROCESS_ACTIVITIES.ARCHIVED_JRA,
      currentUser,
      {
        destination: 'Jadwal Retensi Arsip (JRA)',
        status: 'Diarsipkan'
      }
    );

    showToast(`Naskah dinas berhasil dipindahkan ke Jadwal Retensi Arsip (JRA)!`, 'success');
  };

  // If user is not authenticated, strictly render LoginPage to prevent any null-reference evaluation in children
  if (!currentUser) {
    return (
      <AuthProvider>
        <LoginPage onLoginSuccess={handleLogin} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ProtectedRoute
        isAuthenticated={Boolean(currentUser)}
        fallback={<LoginPage onLoginSuccess={handleLogin} />}
      >
        <MainLayout
          user={currentUser}
          onLogout={handleLogout}
          onSwitchUser={(newUser) => {
            recordAuditLog({
              action: 'SWITCH_USER_ROLE',
              details: `Beralih peran dari ${currentUser.roleLabel} ke ${newUser.roleLabel}`
            });
            // Update active user in whichever storage is holding the token
            if (localStorage.getItem('siloka_auth_token')) {
              localStorage.setItem('siloka_active_user', JSON.stringify(newUser));
            } else if (sessionStorage.getItem('siloka_auth_token')) {
              sessionStorage.setItem('siloka_active_user', JSON.stringify(newUser));
            }
            setCurrentUser(newUser);
            if (
              activeTab === 'settings' &&
              !isSuperAdminUser(newUser)
            ) {
              setActiveTab('dashboard');
            }
            if (
              activeTab === 'brankas-digital' &&
              !canAccessBrankasDigital(newUser)
            ) {
              setActiveTab('dashboard');
            }
            showToast(`Beralih peran sebagai: ${newUser.roleLabel}`, 'info');
          }}
        allUsers={allUsers}
        activeTab={
          activeTab === 'brankas-digital' && !canAccessBrankasDigital(currentUser)
            ? 'dashboard'
            : activeTab
        }
        setActiveTab={(tab) => {
          if (
            (tab === 'settings' || tab === 'manajemen-user' || tab === 'manajemen-role' || tab === 'manajemen-permission') &&
            !isSuperAdminUser(currentUser)
          ) {
            showToast('Akses Ditolak: Modul Manajemen Pengaturan hanya boleh diakses oleh Super Admin.', 'error');
            setActiveTab('dashboard');
            return;
          }
          if (
            tab === 'brankas-digital' &&
            !canAccessBrankasDigital(currentUser)
          ) {
            showToast('Akses Dibatasi: Brankas Digital khusus untuk Pejabat Struktural dan Staf Khusus Arsiparis Pusat/Biro.', 'warning');
            setActiveTab('dashboard');
            return;
          }
          setActiveTab(tab);
          setMetricFilter(null);
        }}
        onOpenCreateLetter={() => {
          if (currentUser.role === 'PENGAWAS') {
            showToast('Akses Read-Only: Pengawas SPI tidak berwenang membuat surat baru.', 'warning');
            return;
          }
          setIsCreateLetterOpen(true);
        }}
        onOpenQuickDisposisi={() => {
          if (currentUser.role === 'PENGAWAS') {
            showToast('Akses Read-Only: Pengawas SPI tidak berwenang menerbitkan disposisi.', 'warning');
            return;
          }
          const firstDisposable = scopedLetters.find((l) => !isLetterSignatureRequest(l));
          if (!firstDisposable) {
            showToast('Tidak ada naskah yang memenuhi syarat untuk disposisi saat ini.', 'info');
            return;
          }
          setDisposisiTargetLetter(firstDisposable);
          setIsDisposisiOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        letters={scopedLetters}
        onSelectLetter={(letter) => setSelectedLetter(letter)}
      >
        {/* Dashboard View */}
        {(activeTab === 'dashboard' || (activeTab === 'brankas-digital' && !canAccessBrankasDigital(currentUser))) && (
          <div className="space-y-6">
            {/* Executive Welcome Greeting & Security Tier Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Dashboard Persuratan & Kearsipan SILOKA
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Pengguna aktif: <span className="font-semibold text-unsil-green-900">{currentUser.nama_lengkap || currentUser.name}</span> ({currentUser.roleLabel})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-mono text-[11px]">
                  IP: <strong>10.58.12.44</strong> (Intranet)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-unsil-green-900 border border-emerald-200 font-semibold flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  BSSN Tier-4 Enkripsi
                </span>
              </div>
            </div>

            {/* Multi-Tenancy Scope & Unit Identity Banner */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-unsil-green-900 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm border border-unsil-gold-500/30">
                  {currentUnit.singkatan}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {currentUnit.nama_unit}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-unsil-green-900 border border-emerald-200">
                      ID: {currentUnit.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                {canUserRegisterIncomingLetter(currentUser) && (
                  <button
                    onClick={() => setIsQuickRegisterOpen(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-unsil-green-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <span>Registrasi Cepat</span>
                  </button>
                )}
                <button
                  onClick={() => setIsCreateLetterOpen(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-xs transition-colors"
                >
                  <span>+ Buat Naskah</span>
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <MetricCards
              letters={letters}
              scopedLetters={scopedLetters}
              currentUser={currentUser}
              currentFilter={metricFilter}
              onSelectFilter={(filter) => {
                if (filter === 'Brankas' && canAccessBrankasDigital(currentUser)) {
                  setActiveTab('brankas-digital');
                } else if (filter === 'Diarsipkan') {
                  setMetricFilter(metricFilter === 'Diarsipkan' ? null : 'Diarsipkan');
                } else if (filter === 'Diparaf') {
                  setMetricFilter(metricFilter === 'Diparaf' ? null : 'Diparaf');
                } else {
                  setMetricFilter(filter === metricFilter ? null : filter);
                }
              }}
            />

            {/* Main Content: Activity Table with Role-Based Masking & Unit Scoping */}
            <ActivityTable
              letters={scopedLetters}
              onSelectLetter={(letter) => setSelectedLetter(letter)}
              onOpenDisposisi={handleOpenDisposisiForLetter}
              onDeleteLetter={handleDeleteLetter}
              searchQuery={searchQuery}
              activeFilter={metricFilter}
              setActiveFilter={setMetricFilter}
              currentUser={currentUser}
              selectedUnitFilter={selectedUnitFilter}
              setSelectedUnitFilter={setSelectedUnitFilter}
              isUniversityWideAccess={isUniversityWideAccess}
            />
          </div>
        )}

        {/* Dedicated Module Views */}
        {activeTab === 'disposisi' && (
          <DisposisiView
            letters={scopedLetters}
            onSelectLetter={(letter) => setSelectedLetter(letter)}
            onOpenNewDisposisi={() => {
              if (currentUser.role === 'PENGAWAS') {
                showToast('Akses Read-Only: Pengawas SPI tidak berwenang menerbitkan disposisi.', 'warning');
                return;
              }
              setDisposisiTargetLetter(scopedLetters[0] || null);
              setIsDisposisiOpen(true);
            }}
          />
        )}

        {activeTab === 'paraf-tte' && (
          <ParafTteView
            letters={scopedLetters}
            currentUser={currentUser}
            onSelectLetter={(letter) => setSelectedLetter(letter)}
            onSignSuccess={handleInitiateTte}
          />
        )}

        {/* Modul Surat Masuk */}
        {activeTab === 'surat-masuk' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-unsil-green-800" />
                  Surat Masuk - {currentUnit.nama_unit} ({currentUnit.singkatan})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pencatatan, verifikasi, dan tindak lanjut disposisi naskah dinas masuk dari instansi eksternal maupun antar-unit kerja UNSIL.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canUserRegisterIncomingLetter(currentUser) ? (
                  <button
                    onClick={() => setIsQuickRegisterOpen(true)}
                    className="px-4 py-2.5 rounded-lg bg-unsil-green-800 text-white text-xs font-semibold hover:bg-unsil-green-900 transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrasi Surat Masuk</span>
                  </button>
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-unsil-green-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
                    <CheckSquare className="w-4 h-4 text-unsil-green-700 shrink-0" />
                    <span>
                      {currentUser?.is_pejabat || currentUser?.role === 'PEJABAT' || currentUser?.role === 'PIMPINAN'
                        ? 'Mode Pimpinan: Penelaahan Naskah Masuk & Pemberian Disposisi'
                        : 'Mode Pemantauan: Naskah Masuk & Pelaksanaan Disposisi'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <ActivityTable
              letters={scopedLetters}
              fixedKategori="Surat Masuk"
              tableTitle="Daftar Surat Masuk Resmi"
              onSelectLetter={(letter) => setSelectedLetter(letter)}
              onOpenDisposisi={handleOpenDisposisiForLetter}
              onDeleteLetter={handleDeleteLetter}
              searchQuery={searchQuery}
              activeFilter={null}
              setActiveFilter={() => {}}
              currentUser={currentUser}
              selectedUnitFilter={selectedUnitFilter}
              setSelectedUnitFilter={setSelectedUnitFilter}
              isUniversityWideAccess={isUniversityWideAccess}
            />
          </div>
        )}

        {/* Modul Surat Keluar */}
        {activeTab === 'surat-keluar' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-unsil-green-800" />
                  Surat Keluar - {currentUnit.nama_unit} ({currentUnit.singkatan})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar naskah dinas keluar, nota dinas, surat tugas, dan korespondensi resmi yang diterbitkan oleh {currentUnit.nama_unit}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-unsil-green-800 text-white text-xs font-semibold hover:bg-unsil-green-900 transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Naskah Dinas Baru</span>
                </button>
              </div>
            </div>
            <ActivityTable
              letters={scopedLetters}
              fixedKategori="Surat Keluar"
              tableTitle="Daftar Surat Keluar & Naskah Dinas"
              onSelectLetter={(letter) => setSelectedLetter(letter)}
              onOpenDisposisi={handleOpenDisposisiForLetter}
              onDeleteLetter={handleDeleteLetter}
              searchQuery={searchQuery}
              activeFilter={null}
              setActiveFilter={() => {}}
              currentUser={currentUser}
              selectedUnitFilter={selectedUnitFilter}
              setSelectedUnitFilter={setSelectedUnitFilter}
              isUniversityWideAccess={isUniversityWideAccess}
            />
          </div>
        )}

        {/* Modul Buku Agenda Masuk & Ekspedisi */}
        {activeTab === 'buku-agenda' && (
          <BukuAgendaView
            letters={letters}
            currentUser={currentUser}
            currentUnit={currentUnit}
            onSelectLetter={(letter) => setSelectedLetter(letter)}
          />
        )}

        {/* Modul Brankas Keuangan / Verifikasi SPM */}
        {activeTab === 'brankas-keuangan' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-unsil-green-800" />
              Brankas Keuangan &amp; Verifikasi SPM — {currentUnit.nama_unit}
            </h2>
            <p className="text-xs text-slate-500">
              Pengelolaan dokumen pertanggungjawaban keuangan, DIPA, dan Surat Perintah Membayar (SPM) terintegrasi sistem kearsipan.
            </p>
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mb-2 stroke-1 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">Modul Brankas Keuangan Siap Digunakan</p>
              <p className="text-xs text-slate-400 mt-1">Belum ada berkas SPM atau DIPA yang diunggah untuk unit ini.</p>
            </div>
          </div>
        )}

        {/* Modul Administrasi Kepegawaian / SKP */}
        {activeTab === 'administrasi-kepegawaian' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-unsil-green-800" />
              Administrasi Kepegawaian &amp; SKP ASN — {currentUnit.nama_unit}
            </h2>
            <p className="text-xs text-slate-500">
              Pengelolaan berkas formasi jabatan, berkas kenaikan pangkat, dan penilaian Sasaran Kinerja Pegawai (SKP) ASN.
            </p>
            <div className="py-12 text-center text-slate-400">
              <Users className="w-12 h-12 mb-2 stroke-1 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">Modul Administrasi Kepegawaian Siap Digunakan</p>
              <p className="text-xs text-slate-400 mt-1">Belum ada usulan SKP atau mutasi berkas kepegawaian yang aktif.</p>
            </div>
          </div>
        )}

        {activeTab === 'retensi-arsip' && <RetensiArsipView letters={letters} currentUser={currentUser} />}

        {activeTab === 'brankas-digital' && canAccessBrankasDigital(currentUser) && <BrankasDigitalView />}

        {(activeTab === 'settings' || activeTab === 'manajemen-user') && (
          <SystemSettingsView
            user={currentUser}
            allUsers={allUsers}
            onUpdateUsers={handleUpdateUsers}
            onDeleteUser={handleDeleteUser}
            onPurgeNonSuperAdmins={handleDeleteAllExceptSuperAdmin}
            showToast={showToast}
          />
        )}

        {activeTab === 'manajemen-role' && (
          <RoleManagementView
            currentUser={currentUser}
            allUsers={allUsers}
            onNavigateToUserManagement={() => {
              setActiveTab('manajemen-user');
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'manajemen-permission' && (
          <PermissionManagementView
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {/* Modals */}
        <LetterDetailModal
          letter={selectedLetter}
          isOpen={!!selectedLetter}
          onClose={() => setSelectedLetter(null)}
          onOpenDisposisi={handleOpenDisposisiForLetter}
          onSignTte={handleInitiateTte}
          onArchiveLetter={handleArchiveLetter}
          onApproveLetter={handleApproveLetter}
          onRejectLetter={handleRejectLetter}
          currentUser={currentUser}
          onLogAction={recordAuditLog}
        />

        <QuickDisposisiModal
          letter={disposisiTargetLetter}
          isOpen={isDisposisiOpen}
          onClose={() => setIsDisposisiOpen(false)}
          onSubmitDisposisi={handleSaveDisposisi}
          allLetters={scopedLetters}
          currentUser={currentUser}
        />

        <CreateLetterModal
          isOpen={isQuickRegisterOpen}
          onClose={() => setIsQuickRegisterOpen(false)}
          onSaveLetter={handleSaveNewLetter}
          currentUser={currentUser}
          initialMode="surat-masuk"
          allLetters={letters}
        />

        <DocumentBuilderModal
          isOpen={isCreateLetterOpen}
          onClose={() => setIsCreateLetterOpen(false)}
          onSaveLetter={handleSaveNewLetter}
          currentUser={currentUser}
          allLetters={letters}
        />

        {/* TTE BSrE Passphrase Security Modal */}
        <TtePassphraseModal
          isOpen={!!tteTargetLetter}
          letter={tteTargetLetter}
          user={currentUser}
          onClose={() => setTteTargetLetter(null)}
          onConfirmSignature={handleConfirmTteSignature}
        />

        {/* Toast Feedback */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  </AuthProvider>
);
}
