import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Check,
  Building2,
  Mail,
  Shield,
  UserCheck,
  CheckCircle2,
  Sparkles,
  UserPlus,
  Trash2,
  ShieldCheck,
  Lock,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
  User,
  IdCard,
  Briefcase
} from 'lucide-react';
import unitKerjaList from '../../data/unitKerja.json';
import { isSuperAdminUser } from '../../utils/authGuards';
import {
  getRolesCatalog,
  resolveUserRoleSlug,
  getUserEffectivePermissions,
  getPermissionLabel,
  RBAC_CHANGE_EVENT
} from '../../utils/rbacSyncService';

/**
 * Helper untuk menentukan warna inisial avatar pengguna
 */
const getAvatarColor = (name = '') => {
  const colors = [
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Helper untuk mengambil 2 huruf inisial dari nama
 */
const getInitials = (name = '') => {
  if (!name) return 'U';
  // Bersihkan gelar umum di awal nama
  const cleanName = name
    .replace(/^(Prof\.|Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s*/gi, '')
    .trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Resolusi Peran Aktual (Role) yang diemban oleh Pengguna
 * Sesuai instruksi: "tapi role lokalnya ganti oleh role yang diemban oleh user tersebut"
 */
export const resolveDisplayRole = (u) => {
  if (!u) return 'Pengguna';

  // 1. Super Administrator
  if (
    u.role === 'Super Admin' ||
    u.role === 'SUPER_ADMIN' ||
    u.id_role === 1 ||
    u.is_super_admin ||
    (u.roleLabel && u.roleLabel.toLowerCase().includes('super admin')) ||
    (u.email && u.email.toLowerCase().includes('superadmin'))
  ) {
    return 'Super Administrator';
  }

  // 2. Rektor & Wakil Rektor
  if (u.id === 'usr-01' || (u.jabatan && u.jabatan.toLowerCase().includes('rektor universitas'))) {
    return 'Rektor Universitas Siliwangi';
  }
  if (u.jabatan && u.jabatan.toLowerCase().includes('wakil rektor')) {
    return u.jabatan;
  }

  // 3. Pejabat Struktural & Dekan
  if (u.jabatan && u.jabatan.trim() && !u.jabatan.toLowerCase().includes('dosen biasa') && !u.jabatan.toLowerCase().includes('asisten ahli') && !u.jabatan.toLowerCase().includes('lektor')) {
    return u.jabatan;
  }

  // 4. Role label yang bersih
  if (u.roleLabel && u.roleLabel.trim()) {
    const clean = u.roleLabel
      .replace(/\s*\(Tanpa Jabatan Struktural\)/gi, '')
      .replace(/\s*SILOKA UNSIL/gi, '')
      .trim();
    if (clean) return clean;
  }

  // 5. Normalisasi Kode Role
  const roleCode = String(u.role || '').toUpperCase();
  if (roleCode === 'DOSEN' || roleCode === 'DOSEN_NON_JABATAN') {
    return 'Dosen';
  }
  if (roleCode === 'PEJABAT') {
    return u.jabatan || 'Pejabat Struktural';
  }
  if (roleCode === 'OPERATOR_UNIT') {
    return 'Operator Tata Usaha';
  }
  if (roleCode === 'STAF_PERSURATAN') {
    return 'Staf Persuratan & Kearsipan';
  }
  if (roleCode === 'PENGAWAS') {
    return 'Pengawas SPI';
  }

  return u.role || 'Staf Pegawai';
};

/**
 * Resolusi Nama Unit Kerja Resmi
 */
const resolveDisplayUnit = (u) => {
  if (u?.unit && u.unit.trim()) {
    return u.unit;
  }
  if (u?.unit_kerja_id) {
    const found = unitKerjaList.find(
      (item) => item.kode_unit === u.unit_kerja_id || item.id === u.unit_kerja_id
    );
    if (found) return found.nama_unit;
  }
  return 'Universitas Siliwangi';
};

/**
 * Komponen Utama: Manajemen User
 * Menggantikan seluruh isi menu pengaturan lama sesuai instruksi pengguna.
 */
export const SystemSettingsView = ({
  user,
  allUsers = [],
  onUpdateUsers,
  onDeleteUser,
  showToast = () => {}
}) => {
  // Verifikasi Otorisasi Super Admin
  const isSuperAdmin = isSuperAdminUser(user);

  // Katalog Role Aktif (Tersinkronisasi dengan Manajemen Role & Permission)
  const [rolesCatalog, setRolesCatalog] = useState(() => getRolesCatalog());

  useEffect(() => {
    const handleRbacUpdate = () => {
      setRolesCatalog(getRolesCatalog());
    };
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
  }, []);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // State Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSyncingSSO, setIsSyncingSSO] = useState(false);

  // State Visibility Kata Sandi
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // State Edit User Form
  const [editFormData, setEditFormData] = useState({
    name: '',
    nip: '',
    email: '',
    unit: '',
    unit_kerja_id: '',
    jabatan: '',
    role_slug: 'drafter',
    role: '',
    password: 'Siloka2026!',
    signatureReady: true,
    is_active: true
  });

  // State Tambah User Form
  const [newUserData, setNewUserData] = useState({
    name: '',
    nip: '',
    email: '',
    unit_kerja_id: 'UN58.13',
    role_slug: 'drafter',
    role: 'DOSEN',
    jabatan: 'Dosen',
    password: 'Siloka2026!'
  });

  // Role Display Badge Styling Helper
  const getRoleBadgeStyle = (displayRole = '') => {
    const lower = displayRole.toLowerCase();
    if (lower.includes('super admin')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (lower.includes('rektor') || lower.includes('dekan') || lower.includes('kepala biro')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (lower.includes('dosen')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (lower.includes('operator') || lower.includes('staf') || lower.includes('pranata')) {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  // Filter Data Pengguna (Sekaligus Membersihkan Artefak Dummy "Administrator Utama SILOKA")
  const filteredUsers = useMemo(() => {
    return allUsers
      .filter(
        (u) =>
          u.id !== 'usr-admin-01' &&
          u.id !== 'usr-00' &&
          !String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA')
      )
      .filter((u) => {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.nama_lengkap || u.name || '').toLowerCase();
        const nip = (u.nip || u.nip_nik || '').toLowerCase();
        const email = (u.email || u.username || '').toLowerCase();
        const unit = resolveDisplayUnit(u).toLowerCase();
        const role = resolveDisplayRole(u).toLowerCase();
        const userSlug = resolveUserRoleSlug(u);

        const matchesSearch =
          !q ||
          name.includes(q) ||
          nip.includes(q) ||
          email.includes(q) ||
          unit.includes(q) ||
          role.includes(q) ||
          userSlug.includes(q);

        if (!matchesSearch) return false;

        if (selectedRoleFilter === 'ALL') return true;
        if (selectedRoleFilter === 'SUPER_ADMIN' || selectedRoleFilter === 'super_admin') {
          return userSlug === 'super_admin';
        }
        if (selectedRoleFilter === 'PIMPINAN' || selectedRoleFilter === 'pimpinan') {
          return userSlug === 'pimpinan';
        }
        if (selectedRoleFilter === 'VERIFIKATOR' || selectedRoleFilter === 'verifikator') {
          return userSlug === 'verifikator';
        }
        if (selectedRoleFilter === 'OPERATOR' || selectedRoleFilter === 'admin_tu') {
          return userSlug === 'admin_tu';
        }
        if (selectedRoleFilter === 'DOSEN' || selectedRoleFilter === 'drafter') {
          return userSlug === 'drafter';
        }
        if (selectedRoleFilter === 'auditor_spi') {
          return userSlug === 'auditor_spi';
        }
        return userSlug === selectedRoleFilter;
      });
  }, [allUsers, searchQuery, selectedRoleFilter]);

  // Handler: Buka Modal Detail / Atur Role
  const handleOpenDetailModal = (targetUser) => {
    setSelectedUserForDetail(targetUser);
    const userRoleSlug = targetUser.role_slug || resolveUserRoleSlug(targetUser);
    const currentPassword = targetUser.raw_password || targetUser.password || 'Siloka2026!';
    setEditFormData({
      name: targetUser.nama_lengkap || targetUser.name || '',
      nip: targetUser.nip || targetUser.nip_nik || '',
      email: targetUser.email || targetUser.username || '',
      unit: resolveDisplayUnit(targetUser),
      unit_kerja_id: targetUser.unit_kerja_id || 'UN58.13',
      jabatan: resolveDisplayRole(targetUser),
      role_slug: userRoleSlug,
      role: targetUser.role || 'DOSEN',
      password: currentPassword,
      signatureReady: targetUser.signatureReady !== false,
      is_active: true
    });
    setShowEditPassword(false);
    setIsDetailModalOpen(true);
  };

  // Handler: Simpan Perubahan Role & Pengguna (Sinkron ke Hak Akses & Matriks)
  const handleSaveUserDetail = (e) => {
    e.preventDefault();
    if (!selectedUserForDetail) return;

    const cleanPassword = (editFormData.password || '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      showToast('Kata sandi akun pengguna harus diisi minimal 6 karakter.', 'error');
      return;
    }

    const unitObj = unitKerjaList.find(
      (item) => item.kode_unit === editFormData.unit_kerja_id || item.id === editFormData.unit_kerja_id
    );

    const selectedRole = rolesCatalog.find(
      (r) => (r.slug || r.id) === editFormData.role_slug
    ) || rolesCatalog[0];

    const isSuper = selectedRole.slug === 'super_admin';
    const isPimpinan = selectedRole.slug === 'pimpinan';
    const mappedRole = isSuper
      ? 'Super Admin'
      : isPimpinan
      ? 'PEJABAT'
      : selectedRole.slug === 'verifikator'
      ? 'VERIFIKATOR'
      : selectedRole.slug === 'admin_tu'
      ? 'OPERATOR_UNIT'
      : selectedRole.slug === 'auditor_spi'
      ? 'PENGAWAS'
      : 'DOSEN';

    const updatedUser = {
      ...selectedUserForDetail,
      nama_lengkap: editFormData.name.trim(),
      name: editFormData.name.trim(),
      nip: editFormData.nip.trim(),
      nip_nik: editFormData.nip.trim(),
      email: editFormData.email.trim(),
      username: editFormData.email.trim(),
      unit_kerja_id: editFormData.unit_kerja_id,
      unit: unitObj ? unitObj.nama_unit : editFormData.unit,
      role_slug: selectedRole.slug,
      role: mappedRole,
      roleLabel: editFormData.jabatan || selectedRole.name,
      jabatan: editFormData.jabatan || selectedRole.name,
      permissions: selectedRole.keySlugs || [],
      is_pejabat:
        isPimpinan ||
        editFormData.jabatan.toLowerCase().includes('rektor') ||
        editFormData.jabatan.toLowerCase().includes('dekan') ||
        editFormData.jabatan.toLowerCase().includes('kepala biro'),
      is_super_admin: isSuper,
      signatureReady: editFormData.signatureReady,
      password: cleanPassword,
      raw_password: cleanPassword
    };

    if (onUpdateUsers) {
      onUpdateUsers([updatedUser]);
    }

    setIsDetailModalOpen(false);
    showToast(
      `Peran dan data pengguna ${editFormData.name} berhasil diperbarui.`,
      'success'
    );
  };

  // Handler: Hapus Pengguna dari Sistem
  const handleDeleteUser = (targetUser) => {
    if (!targetUser) return;
    const name = targetUser.nama_lengkap || targetUser.name || 'Pengguna';
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun pengguna "${name}" dari sistem? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      if (onDeleteUser) {
        onDeleteUser(targetUser.id);
      }
      setIsDetailModalOpen(false);
      showToast(`Pengguna ${name} berhasil dihapus dari sistem.`, 'info');
    }
  };

  // Handler: Tambah User Manual
  const handleCreateUserManual = (e) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      showToast('Mohon lengkapi nama dan email pengguna.', 'error');
      return;
    }

    if (!newUserData.password || newUserData.password.trim().length < 6) {
      showToast('Kata sandi akun pengguna baru harus diisi minimal 6 karakter.', 'error');
      return;
    }

    const cleanEmail = newUserData.email.trim().toLowerCase();

    // Validasi pencegahan duplikasi email
    const isEmailExist = allUsers.some(
      (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (u.username && u.username.toLowerCase() === cleanEmail)
    );
    if (isEmailExist) {
      showToast(`Email [${cleanEmail}] sudah terdaftar di sistem. Mohon gunakan email unik lain.`, 'error');
      return;
    }

    const unitObj = unitKerjaList.find(
      (item) => item.kode_unit === newUserData.unit_kerja_id
    );

    const selectedRole = rolesCatalog.find(
      (r) => (r.slug || r.id) === (newUserData.role_slug || newUserData.role)
    ) || rolesCatalog.find((r) => r.slug === 'drafter') || rolesCatalog[0];

    const isSuper = selectedRole.slug === 'super_admin';
    const isPimpinan = selectedRole.slug === 'pimpinan';
    const mappedRole = isSuper
      ? 'Super Admin'
      : isPimpinan
      ? 'PEJABAT'
      : selectedRole.slug === 'verifikator'
      ? 'VERIFIKATOR'
      : selectedRole.slug === 'admin_tu'
      ? 'OPERATOR_UNIT'
      : selectedRole.slug === 'auditor_spi'
      ? 'PENGAWAS'
      : 'DOSEN';

    const roleLabelText = isSuper
      ? 'Super Administrator SILOKA UNSIL'
      : newUserData.jabatan || selectedRole.name;

    const newUser = {
      id: `usr-custom-${Date.now()}`,
      nama_lengkap: newUserData.name.trim(),
      name: newUserData.name.trim(),
      nip: newUserData.nip.trim() || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      nip_nik: newUserData.nip.trim() || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      email: cleanEmail,
      username: cleanEmail,
      password: newUserData.password.trim(),
      raw_password: newUserData.password.trim(),
      unit_kerja_id: newUserData.unit_kerja_id,
      unit: unitObj
        ? unitObj.nama_unit
        : isSuper
        ? 'Unit Penunjang Akademik Teknologi Informasi dan Komunikasi'
        : 'Fakultas Teknik',
      role_slug: selectedRole.slug,
      role: mappedRole,
      roleLevel: isSuper
        ? 'Level 0: Administrator Sistem'
        : isPimpinan
        ? 'Level 1: Pimpinan'
        : selectedRole.slug === 'verifikator'
        ? 'Level 2: Verifikator'
        : 'Level 3: Dosen/Staf',
      roleLabel: roleLabelText,
      jabatan: newUserData.jabatan || (isSuper ? 'Super Administrator' : selectedRole.name),
      permissions: selectedRole.keySlugs || [],
      is_pejabat: isPimpinan || (newUserData.jabatan && newUserData.jabatan.toLowerCase().includes('dekan')),
      is_super_admin: isSuper,
      signatureReady: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };

    if (onUpdateUsers) {
      onUpdateUsers([newUser]);
    }

    setIsAddUserModalOpen(false);
    setNewUserData({
      name: '',
      nip: '',
      email: '',
      unit_kerja_id: 'UN58.13',
      role_slug: 'drafter',
      role: 'DOSEN',
      jabatan: 'Dosen',
      password: 'Siloka2026!'
    });
    setShowNewPassword(false);
    showToast(`Pengguna baru [${newUser.name}] berhasil ditambahkan dengan role ${selectedRole.name}.`, 'success');
  };

  // Handler: Simulasi Sinkronisasi Data Pegawai
  const handleSyncSSO = () => {
    setIsSyncingSSO(true);
    setTimeout(() => {
      setIsSyncingSSO(false);
      showToast(
        `Pembaruan data berhasil: ${allUsers.length} akun pengguna aktif telah disinkronkan dengan data kepegawaian UNSIL.`,
        'success'
      );
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* =========================================================================
          HEADER HALAMAN (SESUAI GAMBAR 1)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data pegawai, hak akses akun, dan sinkronisasi profil kepegawaian Universitas Siliwangi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Tombol Sinkron Data Pegawai */}
          <button
            type="button"
            onClick={handleSyncSSO}
            disabled={isSyncingSSO}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Sinkronkan data pegawai dengan sistem kepegawaian resmi UNSIL"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncingSSO ? 'animate-spin' : ''}`} />
            <span>Sinkron Data Pegawai</span>
          </button>

          {/* Tombol Tambah Pengguna Baru */}
          <button
            type="button"
            onClick={() => {
              setNewUserData({
                name: '',
                nip: '',
                email: '',
                unit_kerja_id: 'UN58.13',
                role_slug: 'drafter',
                role: 'DOSEN',
                jabatan: 'Dosen',
                password: 'Siloka2026!'
              });
              setShowNewPassword(false);
              setIsAddUserModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KONTROL FILTER & PENCARIAN (SESUAI GAMBAR 1)
          ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Input Pencarian */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP, atau email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown Role (Sinkron dengan Manajemen Role) */}
          <div className="w-full sm:w-56">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium"
            >
              <option value="ALL">Semua Peran ({allUsers.length})</option>
              {rolesCatalog.map((r) => (
                <option key={r.slug || r.id} value={r.slug || r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Badge Total Pengguna */}
        <div className="flex items-center justify-end">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Total: {filteredUsers.length} Pengguna
          </span>
        </div>
      </div>

      {/* =========================================================================
          TABEL DATA PENGGUNA (SESUAI GAMBAR 1)
          ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">NO</th>
                <th className="py-3.5 px-4 min-w-[240px]">PENGGUNA</th>
                <th className="py-3.5 px-4 min-w-[200px]">UNIT KERJA</th>
                <th className="py-3.5 px-4 min-w-[200px]">PERAN & HAK AKSES</th>
                <th className="py-3.5 px-4 min-w-[150px]">STATUS AKUN</th>
                <th className="py-3.5 px-4 text-center w-36">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const displayName = u.nama_lengkap || u.name || 'Pengguna SILOKA';
                  const email = u.email || u.username || '-';
                  const nip = u.nip || u.nip_nik || '';
                  const unitName = resolveDisplayUnit(u);
                  const displayRole = resolveDisplayRole(u);
                  const userRoleSlug = resolveUserRoleSlug(u);
                  const canonicalRole = rolesCatalog.find((r) => (r.slug || r.id) === userRoleSlug);
                  const colorStyle = getAvatarColor(displayName);

                  return (
                    <tr
                      key={u.id || index}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* 1. NO */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>

                      {/* 2. PENGGUNA */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}
                          >
                            {getInitials(displayName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-tight truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {email}
                              {nip ? ` • NIP ${nip}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. UNIT KERJA */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 max-w-[240px] truncate">
                          {unitName}
                        </span>
                      </td>

                      {/* 4. ROLE (Peran Aktual yang Diemban & Sinkron RBAC) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium border max-w-[240px] truncate ${
                              canonicalRole?.badgeColor || getRoleBadgeStyle(displayRole)
                            }`}
                            title={displayRole}
                          >
                            {displayRole}
                          </span>
                          {canonicalRole && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {canonicalRole.name} • {canonicalRole.keySlugs?.length || 0} hak akses
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. STATUS AKUN */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif Terverifikasi
                        </span>
                      </td>

                      {/* 6. AKSI */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:border-unsil-green-700 hover:text-unsil-green-800 hover:bg-unsil-green-50 transition cursor-pointer shadow-2xs"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Detail &amp; Hak Akses</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL DETAIL / ATUR ROLE PENGGUNA
          ========================================================================= */}
      {isDetailModalOpen && selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal - Tetap Pinned di Atas */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-unsil-green-900 text-unsil-gold-400 flex items-center justify-center shrink-0 shadow-xs ring-2 ring-unsil-green-800/10">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Pengaturan Profil &amp; Hak Akses Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pembaruan identitas pegawai, unit kerja, dan hak akses persuratan dinas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Form Modal - Scrollable Container */}
            <form id="edit-user-form" onSubmit={handleSaveUserDetail} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
              {/* Profil Singkat Card */}
              <div className="p-3.5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border shadow-xs ${getAvatarColor(
                      editFormData.name
                    ).bg} ${getAvatarColor(editFormData.name).text} ${getAvatarColor(editFormData.name).border}`}
                  >
                    {getInitials(editFormData.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" title="Akun Aktif" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm truncate">{editFormData.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {rolesCatalog.find((r) => (r.slug || r.id) === editFormData.role_slug)?.name || 'Pengguna'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {editFormData.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IdCard className="w-3 h-3 text-slate-400" />
                      NIP: {editFormData.nip || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bagian 1: Data Identitas & Unit Kerja */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Building2 className="w-3.5 h-3.5 text-unsil-green-800" />
                  <span>1. Data Pegawai &amp; Unit Kerja</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nama Lengkap (dengan Gelar Akademik) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      NIP / Identitas ASN
                    </label>
                    <input
                      type="text"
                      value={editFormData.nip}
                      onChange={(e) => setEditFormData({ ...editFormData, nip: e.target.value })}
                      placeholder="18 digit NIP"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Email Resmi UNSIL (@unsil.ac.id) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Unit Kerja / Fakultas di Lingkungan UNSIL
                  </label>
                  <select
                    value={editFormData.unit_kerja_id}
                    onChange={(e) => setEditFormData({ ...editFormData, unit_kerja_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                  >
                    {unitKerjaList.map((unit) => (
                      <option key={unit.kode_unit || unit.id} value={unit.kode_unit}>
                        {unit.kode_unit} — {unit.nama_unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bagian 2: Peran & Jabatan Pegawai */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Shield className="w-3.5 h-3.5 text-unsil-green-800" />
                  <span>2. Peran &amp; Jabatan Pegawai</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Peran &amp; Wewenang Akun
                    </label>
                    <select
                      value={editFormData.role_slug}
                      onChange={(e) => {
                        const newSlug = e.target.value;
                        const roleObj = rolesCatalog.find((r) => (r.slug || r.id) === newSlug);
                        setEditFormData((prev) => ({
                          ...prev,
                          role_slug: newSlug,
                          jabatan: prev.jabatan || roleObj?.name || ''
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                    >
                      {rolesCatalog.map((r) => (
                        <option key={r.slug || r.id} value={r.slug || r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Jabatan Struktural / Peran Institusi
                    </label>
                    <input
                      type="text"
                      value={editFormData.jabatan}
                      onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                      placeholder="Contoh: Dekan Fakultas Teknik"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Keamanan & Kata Sandi Masuk */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-unsil-green-800" />
                    <span>Kata Sandi Akun (Password) <span className="text-red-500">*</span></span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Masukkan kata sandi pengguna"
                    className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                    title={showEditPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Kata sandi aktif untuk akses masuk ke SILOKA. Anda dapat langsung mengedit atau mereset kata sandi ini (minimal 6 karakter).
                </p>
              </div>

              {/* Bagian 4: Panel Hak Akses Terintegrasi */}
              {(() => {
                const currentRoleObj = rolesCatalog.find(
                  (r) => (r.slug || r.id) === editFormData.role_slug
                );
                const roleSlugs = currentRoleObj?.keySlugs || [];
                const hasRahasia = roleSlugs.includes('arsip.view_rahasia');

                return (
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-100 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-unsil-green-800" />
                        Daftar Hak Akses ({roleSlugs.length} Wewenang)
                      </span>
                      {hasRahasia && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Akses Brankas Digital
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {currentRoleObj?.description || 'Hak akses otomatis disesuaikan dengan peran yang dipilih.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto pr-1">
                      {roleSlugs.map((slug) => (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                        >
                          <Check className="w-3 h-3 text-unsil-green-700 shrink-0" />
                          <span>{getPermissionLabel(slug)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bagian 5: Wewenang TTE */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={editFormData.signatureReady}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, signatureReady: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-800 font-semibold block">
                      Wewenang Tanda Tangan Digital (TTE) Aktif
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      Memberikan hak kepada pejabat untuk menandatangani surat dinas resmi secara digital.
                    </span>
                  </div>
                </label>
              </div>
            </form>

            {/* Footer Modal - Tetap Pinned di Bawah */}
            <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
              {selectedUserForDetail && selectedUserForDetail.id !== user?.id && onDeleteUser ? (
                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUserForDetail)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pengguna</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="edit-user-form"
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-sm active:scale-98"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL TAMBAH USER MANUAL
          ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal - Tetap Pinned di Atas */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-unsil-green-900 text-unsil-gold-400 flex items-center justify-center shrink-0 shadow-xs ring-2 ring-unsil-green-800/10">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Tambah Pengguna Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Daftarkan akun pegawai baru dan tentukan wewenang perannya.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Form Modal - Scrollable Container */}
            <form id="add-user-form" onSubmit={handleCreateUserManual} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
              {/* Bagian 1: Data Identitas & Unit Kerja */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Building2 className="w-3.5 h-3.5 text-unsil-green-800" />
                  <span>1. Data Pegawai &amp; Unit Kerja</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nama Lengkap (dengan Gelar Akademik) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    placeholder="Contoh: Ahmad Fauzi, S.T., M.T."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      NIP / Identitas ASN
                    </label>
                    <input
                      type="text"
                      value={newUserData.nip}
                      onChange={(e) => setNewUserData({ ...newUserData, nip: e.target.value })}
                      placeholder="18 digit NIP (kosongkan untuk nomor acak)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Email Resmi UNSIL (@unsil.ac.id) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="nama@unsil.ac.id"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Unit Kerja / Fakultas di Lingkungan UNSIL
                  </label>
                  <select
                    value={newUserData.unit_kerja_id}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, unit_kerja_id: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                  >
                    {unitKerjaList.map((unit) => (
                      <option key={unit.kode_unit || unit.id} value={unit.kode_unit}>
                        {unit.kode_unit} — {unit.nama_unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bagian 2: Peran & Jabatan Pegawai */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Shield className="w-3.5 h-3.5 text-unsil-green-800" />
                  <span>2. Peran &amp; Jabatan Pegawai</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Peran &amp; Wewenang Akun
                    </label>
                    <select
                      value={newUserData.role_slug}
                      onChange={(e) => {
                        const newSlug = e.target.value;
                        const roleObj = rolesCatalog.find((r) => (r.slug || r.id) === newSlug);
                        setNewUserData((prev) => ({
                          ...prev,
                          role_slug: newSlug,
                          role: newSlug === 'super_admin' ? 'Super Admin' : newSlug === 'pimpinan' ? 'PEJABAT' : newSlug === 'admin_tu' ? 'OPERATOR_UNIT' : newSlug === 'verifikator' ? 'VERIFIKATOR' : 'DOSEN',
                          jabatan:
                            newSlug === 'super_admin'
                              ? 'Super Administrator'
                              : prev.jabatan === 'Super Administrator'
                              ? roleObj?.name || 'Dosen'
                              : prev.jabatan || roleObj?.name || 'Dosen',
                          unit_kerja_id:
                            newSlug === 'super_admin' && prev.unit_kerja_id === 'UN58.13'
                              ? 'UN58.32'
                              : prev.unit_kerja_id
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                    >
                      {rolesCatalog.map((r) => (
                        <option key={r.slug || r.id} value={r.slug || r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Jabatan Struktural / Peran Institusi
                    </label>
                    <input
                      type="text"
                      value={newUserData.jabatan}
                      onChange={(e) => setNewUserData({ ...newUserData, jabatan: e.target.value })}
                      placeholder={
                        newUserData.role_slug === 'super_admin'
                          ? 'Super Administrator'
                          : 'Contoh: Dosen Teknik Informatika'
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Keamanan & Kata Sandi Akun Baru */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-unsil-green-800" />
                    <span>Kata Sandi Akun (Password) <span className="text-red-500">*</span></span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Masukkan kata sandi untuk akun baru"
                    className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                    title={showNewPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Kata sandi awal untuk pengguna masuk pertama kali. Minimal 6 karakter.
                </p>
              </div>

              {/* Bagian 4: Panel Hak Akses Terintegrasi */}
              {(() => {
                const currentRoleObj = rolesCatalog.find(
                  (r) => (r.slug || r.id) === newUserData.role_slug
                );
                const roleSlugs = currentRoleObj?.keySlugs || [];
                const hasRahasia = roleSlugs.includes('arsip.view_rahasia');

                return (
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-100 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-unsil-green-800" />
                        Daftar Hak Akses ({roleSlugs.length} Wewenang)
                      </span>
                      {hasRahasia && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Akses Brankas Digital
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {currentRoleObj?.description || 'Hak akses otomatis disesuaikan dengan peran yang dipilih.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto pr-1">
                      {roleSlugs.map((slug) => (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                        >
                          <Check className="w-3 h-3 text-unsil-green-700 shrink-0" />
                          <span>{getPermissionLabel(slug)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </form>

            {/* Footer Modal - Tetap Pinned di Bawah */}
            <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer shadow-2xs"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-user-form"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-sm active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsView;
