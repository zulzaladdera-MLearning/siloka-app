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
  Briefcase,
  CheckSquare,
  Info,
  AlertTriangle,
  Users,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import unitKerjaList from '../../data/unitKerja.json';
import { isSuperAdminUser } from '../../utils/authGuards';
import { fetchUsersList, createUser, updateUser } from '../../services/adminService';
import { matchesOfficialDisposisiPosition } from '../../utils/disposisiStandards';
import {
  getPositionsByUnitAndRole,
  getUnitByCode,
  getActiveUnitKerjaList,
  getJurusanByUnitCode,
  findPositionOccupant,
  isSingleIncumbentPosition,
  resolveJabatanScope
} from '../../utils/unitJabatanOptions';
import {
  getRolesCatalog,
  resolveUserRoleSlug,
  getUserEffectivePermissions,
  getPermissionLabel,
  RBAC_CHANGE_EVENT
} from '../../utils/rbacSyncService';

/**
 * Daftar Referensi Jabatan Struktural & Fungsional Resmi di Lingkungan UNSIL
 */
export const OFFICIAL_UNSIL_POSITIONS = [
  'Rektor Universitas Siliwangi',
  'Wakil Rektor Bidang Akademik',
  'Wakil Rektor Bidang Keuangan dan Umum',
  'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
  'Wakil Rektor Bidang Perencanaan, Kerja Sama, dan Sistem Informasi',
  'Dekan Fakultas Keguruan dan Ilmu Pendidikan',
  'Wakil Dekan Bidang Akademik FKIP',
  'Wakil Dekan Bidang Keuangan dan Umum FKIP',
  'Wakil Dekan Bidang Kemahasiswaan dan Alumni FKIP',
  'Dekan Fakultas Ekonomi dan Bisnis',
  'Wakil Dekan Bidang Akademik FEB',
  'Wakil Dekan Bidang Keuangan dan Umum FEB',
  'Wakil Dekan Bidang Kemahasiswaan dan Alumni FEB',
  'Dekan Fakultas Pertanian',
  'Dekan Fakultas Teknik',
  'Wakil Dekan Bidang Akademik dan Kemahasiswaan FT',
  'Wakil Dekan Bidang Keuangan dan Umum FT',
  'Dekan Fakultas Ilmu Kesehatan',
  'Dekan Fakultas Ilmu Sosial dan Ilmu Politik',
  'Dekan Fakultas Agama Islam',
  'Direktur Pascasarjana',
  'Wakil Direktur Pascasarjana',
  'Ketua LPPM',
  'Sekretaris LPPM',
  'Ketua LPMPP',
  'Sekretaris LPMPP',
  'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama',
  'Kepala Biro Keuangan dan Umum',
  'Kepala UPA Teknologi Informasi dan Komunikasi',
  'Kepala UPA Perpustakaan',
  'Kepala UPA Laboratorium Terpadu',
  'Kepala UPA Bahasa',
  'Kepala UPA Layanan Uji Kompetensi',
  'Ketua Senat Universitas',
  'Sekretaris Senat Universitas',
  'Ketua Satuan Pengawas Internal',
  'Sekretaris Satuan Pengawas Internal',
  'Ketua Jurusan Teknik Sipil',
  'Sekretaris Jurusan Teknik Sipil',
  'Ketua Jurusan Teknik Elektro',
  'Ketua Jurusan Informatika',
  'Koordinator Program Studi',
  'Dosen Fungsional (Tridharma)',
  'Dosen Pengajar / Peneliti',
  'Kepala Bagian Tata Usaha',
  'Kepala Subbagian Umum & Kepegawaian',
  'Pengadministrasi Persuratan / Loket TU',
  'Arsiparis Ahli / Terampil',
  'Pranata Komputer / Pengelola TI',
  'Verifikator Naskah Dinas',
  'Super Administrator'
];

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
    const list = getActiveUnitKerjaList();
    const found = list.find(
      (item) => item.kode_unit === u.unit_kerja_id || item.id === u.unit_kerja_id
    );
    if (found) return found.nama_unit;
  }
  return 'Universitas Siliwangi';
};

/**
 * Memeriksa apakah seorang pengguna bertugas pada unit kerja tertentu
 * Single Source of Truth: Menghubungkan kode_unit, unit_kerja_id, nama_unit, dan singkatan.
 */
export const isUserInUnit = (u, unit) => {
  if (!u || !unit) return false;
  if (u.is_active === false || u.is_aktif === false || u.status_aktif === false) return false;

  const unitCode = String(unit.kode_unit || '').trim().toUpperCase();
  const uKode = String(u.unit_kerja_id || u.kode_unit || u.id_unit || '').trim().toUpperCase();
  const uNama = String(u.unit || u.unitKerja || '').trim().toLowerCase();
  const unitName = String(unit.nama_unit || '').trim().toLowerCase();
  const unitSingkatan = String(unit.singkatan || '').trim().toLowerCase();

  // 1. Pencocokan langsung kode unit (misal 'UN58.13', 'UN58.SENAT', 'UN58.32')
  if (uKode && uKode === unitCode) {
    return true;
  }

  // 2. Pencocokan langsung nama unit atau singkatan
  if (unitName && (uNama === unitName || uNama.includes(unitName))) {
    return true;
  }
  if (unitSingkatan && (uNama === unitSingkatan || uNama.includes(unitSingkatan))) {
    return true;
  }

  // 3. Kasus khusus Rektorat / Universitas Siliwangi (UN58):
  // Menangkap pejabat rektorat / staf universitas dan mengecualikan sub-unit yang memiliki kode spesifik sendiri
  if (unitCode === 'UN58') {
    if (uKode === 'UN58' || uNama.includes('rektorat') || uNama === 'universitas siliwangi') {
      if (!uKode.startsWith('UN58.')) return true;
    }
  }

  return false;
};

/**
 * Pratinjau Hak Akses Real-Time saat Memilih Peran Pengguna
 */
const UserRoleCapabilityPreview = ({ roleSlug }) => {
  const slug = String(roleSlug || '').toLowerCase();

  let title = 'Peran Pengguna';
  let desc = 'Deskripsi wewenang operasional naskah dinas.';
  let chips = [
    { label: 'Registrasi Masuk', ok: false },
    { label: 'Draf Naskah', ok: false },
    { label: 'E-Disposisi', ok: false },
    { label: 'Pengesahan TTE', ok: false }
  ];

  if (slug === 'drafter' || slug === 'dosen' || slug === 'dosen_non_jabatan') {
    title = 'Dosen Fungsional (Tridharma)';
    desc = 'Pegawai ini hanya berwenang menyusun 6 template Tridharma (ST Lembar/Kolom, Nota Dinas, Surat Keterangan, Laporan, Telaah Staf). Fitur registrasi surat masuk, disposisi pimpinan, dan TTE pejabat otomatis disembunyikan dari antarmuka.';
    chips = [
      { label: 'Registrasi Masuk', ok: false },
      { label: '6 Naskah Tridharma', ok: true },
      { label: 'E-Disposisi', ok: false },
      { label: 'Pengesahan TTE', ok: false }
    ];
  } else if (slug === 'pimpinan' || slug === 'pejabat') {
    title = 'Pejabat Struktural & Penandatangan';
    desc = 'Pegawai ini memegang kewenangan pimpinan untuk menerbitkan E-Disposisi hierarkis dan Pengesahan TTE BSrE naskah dinas. Loket registrasi surat masuk otomatis disembunyikan.';
    chips = [
      { label: 'Registrasi Masuk', ok: false },
      { label: '23 Template Dinas', ok: true },
      { label: 'E-Disposisi Pimpinan', ok: true },
      { label: 'Pengesahan TTE BSrE', ok: true }
    ];
  } else if (slug === 'admin_tu' || slug === 'staf' || slug === 'operator_unit') {
    title = 'Staf TU / Operator Loket';
    desc = 'Pegawai ini bertugas di loket penerimaan surat masuk dan registrasi buku agenda. Fitur disposisi pimpinan dan TTE pejabat disembunyikan.';
    chips = [
      { label: 'Registrasi Surat Masuk', ok: true },
      { label: '23 Template Dinas', ok: true },
      { label: 'E-Disposisi', ok: false },
      { label: 'Pengesahan TTE', ok: false }
    ];
  } else if (slug === 'super_admin') {
    title = 'Super Administrator (Otoritas Penuh)';
    desc = 'Akun ini memegang wewenang administratif penuh atas seluruh modul persuratan dinas (Registrasi Masuk, 23 Template Draf, E-Disposisi, dan Pengesahan TTE BSrE).';
    chips = [
      { label: 'Registrasi Surat Masuk', ok: true },
      { label: '23 Template Dinas', ok: true },
      { label: 'E-Disposisi', ok: true },
      { label: 'Pengesahan TTE BSrE', ok: true }
    ];
  } else if (slug === 'verifikator') {
    title = 'Verifikator & Atasan Hierarki';
    desc = 'Pegawai ini bertugas memeriksa substansi draf naskah dinas dan membubuhkan paraf hierarki level 1-2 sebelum diajukan ke pimpinan unit.';
    chips = [
      { label: 'Registrasi Masuk', ok: false },
      { label: '23 Template Dinas', ok: true },
      { label: 'E-Disposisi', ok: false },
      { label: 'Paraf Hierarki L1-L2', ok: true }
    ];
  } else if (slug === 'auditor_spi') {
    title = 'Pengawas Internal (SPI)';
    desc = 'Hak peninjauan audit kepatuhan tata naskah dan kearsipan persuratan universitas (read-only) tanpa hak penerbitan surat.';
    chips = [
      { label: 'Registrasi Masuk', ok: false },
      { label: 'Draf Naskah', ok: false },
      { label: 'E-Disposisi', ok: false },
      { label: 'Pengesahan TTE', ok: false }
    ];
  }

  return (
    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-700 leading-relaxed">
          <strong className="text-unsil-green-950 font-bold block mb-0.5">{title}</strong>
          {desc}
        </div>
      </div>
      <div className="pt-1.5 border-t border-emerald-200/60 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {chips.map((c) => (
          <div
            key={c.label}
            className={`px-2 py-1 rounded-md text-[10.5px] font-semibold flex items-center gap-1 border ${
              c.ok
                ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                : 'bg-white/80 text-slate-400 border-slate-200'
            }`}
          >
            {c.ok ? (
              <Check className="w-3 h-3 text-emerald-700 shrink-0" />
            ) : (
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Role Display Badge Styling Helper (Module-Level)
export const getRoleBadgeStyle = (displayRole = '') => {
  const lower = String(displayRole || '').toLowerCase();
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

/**
 * Mengklasifikasikan pengguna dalam konteks struktur hierarki unit kerja:
 * 1. Pejabat Pimpinan Fakultas (Dekan, Wakil Dekan, Kabag TU)
 * 2. Staf Tata Usaha Fakultas (Operator, Staf TU Fakultas)
 * 3. Pejabat / Pimpinan Jurusan (Kajur, Sekjur, Ka Lab)
 * 4. Staf Administrasi Jurusan (Staf TU Prodi)
 * 5. Dosen Pengajar / Fungsional (Tridharma tanpa jabatan struktural)
 * 6. Pengelola Khusus (Super Administrator / Auditor)
 */
export const classifyUserInUnit = (user, jurusans = []) => {
  if (!user) {
    return {
      level: 'FAKULTAS',
      category: 'staf_fakultas',
      label: 'Staf Unit',
      jurusan: 'FAKULTAS'
    };
  }

  const roleSlug = resolveUserRoleSlug(user);
  if (roleSlug === 'super_admin' || isSuperAdminUser(user)) {
    return {
      level: 'SPECIAL',
      category: 'super_admin',
      label: 'Super Administrator',
      jurusan: 'FAKULTAS'
    };
  }
  if (roleSlug === 'auditor_spi') {
    return {
      level: 'SPECIAL',
      category: 'auditor',
      label: 'Auditor SPI',
      jurusan: 'FAKULTAS'
    };
  }

  const scope = resolveJabatanScope(user, jurusans);
  const isAtJurusan = scope && scope !== 'FAKULTAS' && scope !== 'ALL' && scope !== 'SEMUA';
  const posLower = String(user.jabatan || user.roleLabel || user.role_label || '').toLowerCase();

  const isStructuralTitle =
    user.is_pejabat === true ||
    roleSlug === 'pimpinan' ||
    roleSlug === 'verifikator' ||
    isSingleIncumbentPosition(user.jabatan, roleSlug) ||
    /\b(rektor|warek|wakil rektor|dekan|wadek|wakil dekan|kajur|ketua jurusan|kaprodi|koordinator program studi|sekjur|sekretaris jurusan|kepala lab|kalab|kabag|kepala bagian|kepala biro|kepala upa|kepala upt|direktur|ketua lembaga|ketua pusat)\b/i.test(posLower);

  const isStafTitle =
    roleSlug === 'admin_tu' ||
    /\b(staf|operator|tata usaha|pengadministrasi|arsiparis|pranata|teknisi|administrasi)\b/i.test(posLower);

  const isDosenTitle =
    roleSlug === 'drafter' ||
    user.role === 'DOSEN' ||
    /\b(dosen|pengajar|lektor|asisten ahli|guru besar|profesor)\b/i.test(posLower);

  if (isAtJurusan) {
    if (isStructuralTitle) {
      return {
        level: 'JURUSAN',
        category: 'pejabat_jurusan',
        label: 'Pimpinan Jurusan / Prodi',
        jurusan: scope
      };
    }
    if (isStafTitle) {
      return {
        level: 'JURUSAN',
        category: 'staf_jurusan',
        label: 'Staf Administrasi Jurusan',
        jurusan: scope
      };
    }
    return {
      level: 'JURUSAN',
      category: 'dosen_biasa',
      label: 'Dosen Pengajar (Tanpa Jabatan)',
      jurusan: scope
    };
  } else {
    if (isStructuralTitle) {
      return {
        level: 'FAKULTAS',
        category: 'pejabat_fakultas',
        label: 'Pejabat Pimpinan Fakultas',
        jurusan: 'FAKULTAS'
      };
    }
    if (isDosenTitle) {
      return {
        level: 'JURUSAN',
        category: 'dosen_biasa',
        label: 'Dosen Pengajar',
        jurusan: 'FAKULTAS'
      };
    }
    return {
      level: 'FAKULTAS',
      category: 'staf_fakultas',
      label: 'Staf Tata Usaha Fakultas',
      jurusan: 'FAKULTAS'
    };
  }
};

/**
 * Komponen Tabel Seksi Pengguna Berdasarkan Kategori Hierarki Unit
 * Tampilan Sederhana, Lapang, dan Mudah Dipahami Orang Awam / Anak SMP
 */
const UserSectionTable = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200',
  users = [],
  emptyMessage = 'Belum ada pegawai di bagian ini.',
  onAddUser,
  addLabel = 'Tambah Pegawai',
  onDetailClick,
  onDeleteClick,
  rolesCatalog = []
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Seksi */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">{title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}>
                {badgeText}
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {onAddUser && (
          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-unsil-green-950 bg-white hover:bg-unsil-green-50 border border-slate-300 hover:border-unsil-green-700 rounded-xl transition cursor-pointer shadow-2xs shrink-0 w-fit"
          >
            <Plus className="w-3.5 h-3.5 text-unsil-green-800" />
            <span>{addLabel}</span>
          </button>
        )}
      </div>

      {/* Konten Tabel atau Pesan Kosong */}
      {users.length === 0 ? (
        <div className="py-8 px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs font-semibold text-slate-600">{emptyMessage}</p>
          {onAddUser && (
            <button
              type="button"
              onClick={onAddUser}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-unsil-green-900 hover:bg-unsil-green-950 rounded-lg transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4 min-w-[240px]">NAMA &amp; IDENTITAS</th>
                <th className="py-3 px-4 min-w-[200px]">JABATAN &amp; PERAN</th>
                <th className="py-3 px-4 min-w-[130px]">STATUS AKUN</th>
                <th className="py-3 px-4 text-center w-36">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, index) => {
                const displayName = u.nama_lengkap || u.name || 'Pengguna SILOKA';
                const email = u.email || u.username || '-';
                const nip = u.nip || u.nip_nik || '';
                const displayRole = resolveDisplayRole(u);
                const userRoleSlug = u.role_slug || resolveUserRoleSlug(u);
                const canonicalRole = rolesCatalog.find((r) => (r.slug || r.id) === userRoleSlug);
                const colorStyle = getAvatarColor(displayName);

                return (
                  <tr key={u.id || index} className="hover:bg-slate-50/60 transition group">
                    {/* 1. NO */}
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>

                    {/* 2. NAMA & IDENTITAS */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
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

                    {/* 3. JABATAN & PERAN */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border max-w-[260px] truncate ${
                            canonicalRole?.badgeColor || getRoleBadgeStyle(displayRole)
                          }`}
                          title={displayRole}
                        >
                          {displayRole}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
                          {canonicalRole && <span>{canonicalRole.name}</span>}
                          {u.jurusan && (
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                              {u.jurusan}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. STATUS AKUN */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Aktif
                      </span>
                    </td>

                    {/* 5. AKSI */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDetailClick(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:border-unsil-green-700 hover:text-unsil-green-900 hover:bg-unsil-green-50 transition cursor-pointer shadow-2xs"
                          title="Ubah wewenang dan profil akun"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail &amp; Hak Akses</span>
                        </button>
                        {!isSuperAdminUser(u) && onDeleteClick && (
                          <button
                            type="button"
                            onClick={() => onDeleteClick(u)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title={`Hapus akun ${displayName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <p className="font-bold text-sm">Akses Dibatasi: Khusus Super Administrator</p>
          <p className="text-xs mt-1 text-rose-600">Modul Manajemen Pengguna hanya dapat diakses oleh akun Super Administrator SILOKA UNSIL.</p>
        </div>
      </div>
    );
  }

  // Katalog Role Aktif (Tersinkronisasi dengan Manajemen Role & Permission)
  const [rolesCatalog, setRolesCatalog] = useState(() => getRolesCatalog());

  useEffect(() => {
    const handleRbacUpdate = () => {
      setRolesCatalog(getRolesCatalog());
    };
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
  }, []);

  // Filter & Search State (Navigasi 2 Tingkat Berbasis Unit Kerja)
  const [selectedUnitForFilter, setSelectedUnitForFilter] = useState(null);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [selectedUnitKategori, setSelectedUnitKategori] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Sub-Unit & Jurusan State (Pemisahan Hierarki yang Bersih dan Ramah Pengguna)
  const [subUnitTab, setSubUnitTab] = useState('FAKULTAS'); // 'FAKULTAS' | 'JURUSAN'
  const [selectedJurusanFilter, setSelectedJurusanFilter] = useState('ALL'); // 'ALL' | nama jurusan

  // State Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSyncingSSO, setIsSyncingSSO] = useState(false);

  // State Visibility Kata Sandi
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // State Input Jabatan Kustom (Manual Input Mode)
  const [isCustomJabatanEdit, setIsCustomJabatanEdit] = useState(false);
  const [isCustomJabatanAdd, setIsCustomJabatanAdd] = useState(false);

  // Unit Kerja Aktif & Tersinkronisasi
  const [activeUnits, setActiveUnits] = useState(() => getActiveUnitKerjaList());
  useEffect(() => {
    const handleUnitChange = (e) => {
      if (e?.detail?.units && Array.isArray(e.detail.units)) {
        setActiveUnits(e.detail.units);
      } else {
        setActiveUnits(getActiveUnitKerjaList());
      }
    };
    window.addEventListener('SILOKA_UNIT_DATA_CHANGED', handleUnitChange);
    window.addEventListener('storage', handleUnitChange);
    return () => {
      window.removeEventListener('SILOKA_UNIT_DATA_CHANGED', handleUnitChange);
      window.removeEventListener('storage', handleUnitChange);
    };
  }, []);

  // Sinkronkan selectedUnitForFilter dengan activeUnits jika ada pembaruan unit
  useEffect(() => {
    if (selectedUnitForFilter) {
      const updated = activeUnits.find(
        (u) => u.kode_unit === selectedUnitForFilter.kode_unit || u.id === selectedUnitForFilter.id
      );
      if (updated) {
        setSelectedUnitForFilter((prev) => ({ ...prev, ...updated }));
      }
    }
  }, [activeUnits]);

  // State Edit User Form
  const [editFormData, setEditFormData] = useState({
    name: '',
    nip: '',
    email: '',
    unit: '',
    unit_kerja_id: 'UN58',
    jurusan: '',
    jabatan: '',
    role_slug: 'pimpinan',
    role: 'PEJABAT',
    password: 'Siloka2026!',
    signatureReady: true,
    is_active: true
  });

  // State Tambah User Form
  const [newUserData, setNewUserData] = useState(() => {
    const defaultPositions = getPositionsByUnitAndRole('UN58.13', 'pimpinan');
    const defaultJurusanList = getJurusanByUnitCode('UN58.13');
    return {
      name: '',
      nip: '',
      email: '',
      unit_kerja_id: 'UN58.13',
      jurusan: defaultJurusanList[0]?.nama || '',
      role_slug: 'pimpinan',
      role: 'PEJABAT',
      jabatan: defaultPositions[0] || 'Dekan Fakultas Teknik',
      password: 'Siloka2026!'
    };
  });

  // Pilihan Jabatan Dinamis Berdasarkan Unit Kerja & Peran (Mendukung Prioritas Jurusan Spesifik)
  const editUnitPositions = useMemo(() => {
    return getPositionsByUnitAndRole(editFormData.unit_kerja_id, editFormData.role_slug, activeUnits, editFormData.jurusan);
  }, [editFormData.unit_kerja_id, editFormData.role_slug, activeUnits, editFormData.jurusan]);

  const newUnitPositions = useMemo(() => {
    return getPositionsByUnitAndRole(newUserData.unit_kerja_id, newUserData.role_slug, activeUnits, newUserData.jurusan);
  }, [newUserData.unit_kerja_id, newUserData.role_slug, activeUnits, newUserData.jurusan]);

  // Deteksi Okupansi Pejabat Aktif untuk Jabatan Tunggal (Anti Duplikasi & Human Error)
  const newJabatanOccupant = useMemo(() => {
    return findPositionOccupant(newUserData.jabatan, allUsers, null, newUserData.unit_kerja_id);
  }, [newUserData.jabatan, allUsers, newUserData.unit_kerja_id]);

  const editJabatanOccupant = useMemo(() => {
    return findPositionOccupant(
      editFormData.jabatan,
      allUsers,
      selectedUserForDetail?.id || selectedUserForDetail?.nip,
      editFormData.unit_kerja_id
    );
  }, [editFormData.jabatan, allUsers, selectedUserForDetail, editFormData.unit_kerja_id]);

  // Daftar Jurusan Sesuai Unit yang Sedang Dipilih
  const editSelectedUnitJurusan = useMemo(() => {
    return getJurusanByUnitCode(editFormData.unit_kerja_id, activeUnits);
  }, [editFormData.unit_kerja_id, activeUnits]);

  const newSelectedUnitJurusan = useMemo(() => {
    return getJurusanByUnitCode(newUserData.unit_kerja_id, activeUnits);
  }, [newUserData.unit_kerja_id, activeUnits]);

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

  // Data pengguna bersih (mengecualikan artefak dummy Administrator Utama SILOKA)
  const cleanAllUsers = useMemo(() => {
    return (allUsers || []).filter(
      (u) =>
        u.id !== 'usr-admin-01' &&
        u.id !== 'usr-00' &&
        !String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA')
    );
  }, [allUsers]);

  // Daftar Unit Kerja yang Diperkaya Jumlah Pegawai Aktual (Single Source of Truth)
  const enrichedUnits = useMemo(() => {
    return activeUnits.map((unit) => {
      const unitUsers = cleanAllUsers.filter((u) => isUserInUnit(u, unit));
      const parentObj = activeUnits.find((p) => p.kode_unit === unit.parent_kode);

      return {
        ...unit,
        parent_name: parentObj ? parentObj.nama_unit : unit.parent_kode || 'Universitas Siliwangi',
        memberCount: unitUsers.length,
        jurusanCount: Array.isArray(unit.jurusan) ? unit.jurusan.length : 0
      };
    });
  }, [activeUnits, cleanAllUsers]);

  // Filter Unit Kerja (Tingkat 1)
  const filteredUnits = useMemo(() => {
    return enrichedUnits.filter((unit) => {
      const matchKategori =
        selectedUnitKategori === 'ALL' ||
        (selectedUnitKategori === 'FAKULTAS' &&
          (unit.tipe_unit === 'FAKULTAS' || unit.tipe_unit === 'PASCASARJANA')) ||
        (selectedUnitKategori === 'BIRO' && unit.tipe_unit === 'BIRO') ||
        (selectedUnitKategori === 'LEMBAGA_UPA' &&
          (unit.tipe_unit === 'LEMBAGA' || unit.tipe_unit === 'UPA')) ||
        (selectedUnitKategori === 'ORGAN' &&
          ['UNIVERSITAS', 'ORGAN'].includes(unit.tipe_unit));

      const term = unitSearchQuery.trim().toLowerCase();
      const matchSearch =
        !term ||
        (unit.nama_unit && unit.nama_unit.toLowerCase().includes(term)) ||
        (unit.kode_unit && unit.kode_unit.toLowerCase().includes(term)) ||
        (unit.singkatan && unit.singkatan.toLowerCase().includes(term));

      return matchKategori && matchSearch;
    });
  }, [enrichedUnits, selectedUnitKategori, unitSearchQuery]);

  // Pengguna Terdaftar pada Unit Kerja Terpilih (Tingkat 2)
  const selectedUnitUsers = useMemo(() => {
    if (!selectedUnitForFilter) return [];
    return cleanAllUsers.filter((u) => isUserInUnit(u, selectedUnitForFilter));
  }, [selectedUnitForFilter, cleanAllUsers]);

  // Kolam Pengguna Aktif pada Unit Kerja Terpilih
  const activeUserPool = selectedUnitUsers;

  // Daftar Jurusan resmi dari unit kerja terpilih
  const unitJurusans = useMemo(() => {
    if (!selectedUnitForFilter) return [];
    return (
      getJurusanByUnitCode(selectedUnitForFilter.kode_unit, activeUnits) ||
      selectedUnitForFilter.jurusan ||
      []
    );
  }, [selectedUnitForFilter, activeUnits]);

  // Apakah unit memiliki struktur jurusan? (Fakultas / Pascasarjana ber-jurusan)
  const hasJurusans = useMemo(() => {
    return Array.isArray(unitJurusans) && unitJurusans.length > 0;
  }, [unitJurusans]);

  // Klasifikasi pengguna pada unit kerja terpilih sesuai hierarki dan filter pencarian
  const classifiedUsers = useMemo(() => {
    const res = {
      pejabatFakultas: [],
      stafFakultas: [],
      pejabatJurusan: [],
      stafJurusan: [],
      dosenBiasa: [],
      specialRoles: []
    };

    if (!selectedUnitForFilter) return res;

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = (u) => {
      if (!q) return true;
      const name = (u.nama_lengkap || u.name || '').toLowerCase();
      const nip = (u.nip || u.nip_nik || '').toLowerCase();
      const email = (u.email || u.username || '').toLowerCase();
      const jabatan = String(u.jabatan || u.roleLabel || u.role_label || '').toLowerCase();
      const jurusan = String(u.jurusan || '').toLowerCase();
      return (
        name.includes(q) ||
        nip.includes(q) ||
        email.includes(q) ||
        jabatan.includes(q) ||
        jurusan.includes(q)
      );
    };

    selectedUnitUsers.forEach((u) => {
      if (!matchesQuery(u)) return;

      const cls = classifyUserInUnit(u, unitJurusans);
      const userWithMeta = { ...u, _classification: cls };

      if (cls.category === 'super_admin' || cls.category === 'auditor') {
        res.specialRoles.push(userWithMeta);
      } else if (cls.category === 'pejabat_fakultas') {
        res.pejabatFakultas.push(userWithMeta);
      } else if (cls.category === 'staf_fakultas') {
        res.stafFakultas.push(userWithMeta);
      } else if (cls.category === 'pejabat_jurusan') {
        res.pejabatJurusan.push(userWithMeta);
      } else if (cls.category === 'staf_jurusan') {
        res.stafJurusan.push(userWithMeta);
      } else if (cls.category === 'dosen_biasa') {
        res.dosenBiasa.push(userWithMeta);
      } else {
        res.stafFakultas.push(userWithMeta);
      }
    });

    return res;
  }, [selectedUnitUsers, unitJurusans, selectedUnitForFilter, searchQuery]);

  // Pengguna jurusan yang disaring berdasarkan pilihan jurusan saat ini
  const displayedPejabatJurusan = useMemo(() => {
    if (selectedJurusanFilter === 'ALL') return classifiedUsers.pejabatJurusan;
    return classifiedUsers.pejabatJurusan.filter(
      (u) =>
        u._classification?.jurusan === selectedJurusanFilter ||
        u.jurusan === selectedJurusanFilter
    );
  }, [classifiedUsers.pejabatJurusan, selectedJurusanFilter]);

  const displayedStafJurusan = useMemo(() => {
    if (selectedJurusanFilter === 'ALL') return classifiedUsers.stafJurusan;
    return classifiedUsers.stafJurusan.filter(
      (u) =>
        u._classification?.jurusan === selectedJurusanFilter ||
        u.jurusan === selectedJurusanFilter
    );
  }, [classifiedUsers.stafJurusan, selectedJurusanFilter]);

  const displayedDosenBiasa = useMemo(() => {
    if (selectedJurusanFilter === 'ALL') return classifiedUsers.dosenBiasa;
    return classifiedUsers.dosenBiasa.filter(
      (u) =>
        u._classification?.jurusan === selectedJurusanFilter ||
        u.jurusan === selectedJurusanFilter
    );
  }, [classifiedUsers.dosenBiasa, selectedJurusanFilter]);

  // Total hitungan per kategori
  const facultyCount =
    classifiedUsers.pejabatFakultas.length + classifiedUsers.stafFakultas.length;
  const jurusanTotalCount =
    classifiedUsers.pejabatJurusan.length +
    classifiedUsers.stafJurusan.length +
    classifiedUsers.dosenBiasa.length;
  const totalFilteredCount =
    facultyCount + jurusanTotalCount + classifiedUsers.specialRoles.length;

  const getCountForJurusan = (jurusanName) => {
    const jClean = String(jurusanName || '').toLowerCase().trim();
    return (
      classifiedUsers.pejabatJurusan.filter(
        (u) =>
          String(u._classification?.jurusan || u.jurusan || '').toLowerCase().trim() === jClean
      ).length +
      classifiedUsers.stafJurusan.filter(
        (u) =>
          String(u._classification?.jurusan || u.jurusan || '').toLowerCase().trim() === jClean
      ).length +
      classifiedUsers.dosenBiasa.filter(
        (u) =>
          String(u._classification?.jurusan || u.jurusan || '').toLowerCase().trim() === jClean
      ).length
    );
  };

  // Hitungan Peran Aktual untuk Filter Bar
  const roleCounts = useMemo(() => {
    const pimpinan = activeUserPool.filter((u) => resolveUserRoleSlug(u) === 'pimpinan').length;
    const tu = activeUserPool.filter((u) => resolveUserRoleSlug(u) === 'admin_tu').length;
    const dosen = activeUserPool.filter((u) => resolveUserRoleSlug(u) === 'drafter').length;
    const superAdmin = activeUserPool.filter((u) => resolveUserRoleSlug(u) === 'super_admin').length;
    return {
      all: activeUserPool.length,
      pimpinan,
      tu,
      dosen,
      superAdmin
    };
  }, [activeUserPool]);

  // Filter Data Pengguna Sesuai Pencarian dan Peran
  const filteredUsers = useMemo(() => {
    return activeUserPool.filter((u) => {
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
  }, [activeUserPool, searchQuery, selectedRoleFilter]);

  // Handler: Buka Modal Tambah Pengguna Baru (Terpreset ke Unit Kerja dan Konteks)
  const handleOpenAddUserModal = (targetUnit = null, preset = {}) => {
    const unitObj = targetUnit || selectedUnitForFilter;
    const defaultUnit = unitObj?.kode_unit || 'UN58';
    const jurList = getJurusanByUnitCode(defaultUnit, activeUnits);
    const targetSlug = preset.role_slug || 'pimpinan';
    const targetRole =
      preset.role ||
      (targetSlug === 'pimpinan' || targetSlug === 'verifikator'
        ? 'PEJABAT'
        : targetSlug === 'drafter'
        ? 'DOSEN'
        : 'STAF');
    const targetJurusan =
      preset.jurusan !== undefined ? preset.jurusan : (jurList[0]?.nama || '');
    const defaultPositions = getPositionsByUnitAndRole(defaultUnit, targetSlug, activeUnits);
    const targetJabatan =
      preset.jabatan ||
      defaultPositions[0] ||
      (targetSlug === 'drafter' ? 'Dosen' : 'Staf Administrasi');

    setNewUserData({
      name: '',
      nip: '',
      email: '',
      unit_kerja_id: defaultUnit,
      jurusan: targetJurusan,
      role_slug: targetSlug,
      role: targetRole,
      jabatan: targetJabatan,
      password: 'Siloka2026!'
    });
    setIsCustomJabatanAdd(false);
    setShowNewPassword(false);
    setIsAddUserModalOpen(true);
  };

  // Handler: Buka Modal Detail / Atur Role
  const handleOpenDetailModal = (targetUser) => {
    setSelectedUserForDetail(targetUser);
    const userRoleSlug = targetUser.role_slug || resolveUserRoleSlug(targetUser);
    const currentPassword = targetUser.raw_password || targetUser.password || 'Siloka2026!';
    const userUnitId = targetUser.unit_kerja_id || 'UN58.13';
    const userJabatan = resolveDisplayRole(targetUser);
    const unitPositions = getPositionsByUnitAndRole(userUnitId, userRoleSlug, activeUnits);
    const isStandardPosition = unitPositions.includes(userJabatan);

    let userJurusan = targetUser.jurusan || '';
    if (!userJurusan && userUnitId) {
      const jurList = getJurusanByUnitCode(userUnitId, activeUnits);
      const matchJur = jurList.find((j) => userJabatan.toLowerCase().includes(j.nama.toLowerCase()));
      if (matchJur) {
        userJurusan = matchJur.nama;
      }
    }

    setEditFormData({
      name: targetUser.nama_lengkap || targetUser.name || '',
      nip: targetUser.nip || targetUser.nip_nik || '',
      email: targetUser.email || targetUser.username || '',
      unit: resolveDisplayUnit(targetUser),
      unit_kerja_id: userUnitId,
      jurusan: userJurusan,
      jabatan: userJabatan,
      role_slug: userRoleSlug,
      role: targetUser.role || 'DOSEN',
      password: currentPassword,
      signatureReady: targetUser.signatureReady !== false,
      is_active: true
    });
    setIsCustomJabatanEdit(!isStandardPosition && Boolean(userJabatan));
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

    const unitObj =
      activeUnits.find(
        (item) => item.kode_unit === editFormData.unit_kerja_id || item.id === editFormData.unit_kerja_id
      ) ||
      unitKerjaList.find(
        (item) => item.kode_unit === editFormData.unit_kerja_id || item.id === editFormData.unit_kerja_id
      );

    const selectedRole = rolesCatalog.find(
      (r) => (r.slug || r.id) === editFormData.role_slug
    ) || rolesCatalog[0];

    const isSuper = selectedRole.slug === 'super_admin';
    const isPimpinan = selectedRole.slug === 'pimpinan';
    const isAdminTU = selectedRole.slug === 'admin_tu';
    const isVerifikator = selectedRole.slug === 'verifikator';
    const isAuditor = selectedRole.slug === 'auditor_spi';

    const cleanJabatan = (editFormData.jabatan || selectedRole.name).trim();

    // Validasi pencegahan duplikasi okupansi jabatan struktural tunggal pada mode edit
    const incumbent = findPositionOccupant(
      cleanJabatan,
      allUsers,
      selectedUserForDetail?.id || selectedUserForDetail?.nip,
      editFormData.unit_kerja_id
    );
    if (incumbent) {
      const incumbentName = incumbent.name || incumbent.nama_lengkap || 'pejabat lain';
      const confirmMsg =
        `Peringatan Okupansi Jabatan Pimpinan!\n\n` +
        `Jabatan "${cleanJabatan}" saat ini telah aktif diisi oleh ${incumbentName} (NIP: ${incumbent.nip || '-'}).\n\n` +
        `Satu jabatan struktural tunggal tidak disarankan memiliki lebih dari 1 pejabat aktif untuk mencegah tumpang tindih wewenang.\n\n` +
        `Apakah Anda yakin tetap ingin menyimpan perubahan jabatan ini?`;
      if (typeof window !== 'undefined' && !window.confirm(confirmMsg)) {
        showToast(`Perubahan dibatalkan: Jabatan [${cleanJabatan}] telah diisi oleh [${incumbentName}].`, 'warning');
        return;
      }
    }
    const posLower = cleanJabatan.toLowerCase();
    const hasStructuralKeyword = matchesOfficialDisposisiPosition(cleanJabatan);
    const isExplicitlyNonPejabat =
      posLower.includes('dosen fungsional') ||
      posLower.includes('dosen pengajar') ||
      posLower.includes('staf') ||
      posLower.includes('operator') ||
      posLower.includes('pengadministrasi') ||
      posLower.includes('arsiparis') ||
      (posLower.includes('auditor') && !posLower.includes('ketua'));

    const isPejabat = isPimpinan || (hasStructuralKeyword && !isExplicitlyNonPejabat);

    let mappedRole = 'DOSEN';
    if (isSuper) {
      mappedRole = 'Super Admin';
    } else if (isPejabat) {
      mappedRole = 'PEJABAT';
    } else if (isVerifikator) {
      mappedRole = 'VERIFIKATOR';
    } else if (isAdminTU) {
      mappedRole = 'STAF';
    } else if (isAuditor) {
      mappedRole = 'PENGAWAS';
    } else {
      mappedRole = 'DOSEN';
    }

    let userPermissions = [...(selectedRole.keySlugs || [])];
    if (isPejabat) {
      if (!userPermissions.includes('disposisi.create')) userPermissions.push('disposisi.create');
      if (!userPermissions.includes('disposisi.forward')) userPermissions.push('disposisi.forward');
    } else {
      userPermissions = userPermissions.filter((p) => p !== 'disposisi.create' && p !== 'disposisi.forward');
    }

    const updatedUser = {
      ...selectedUserForDetail,
      nama_lengkap: editFormData.name.trim(),
      name: editFormData.name.trim(),
      nip: editFormData.nip.trim(),
      nip_nik: editFormData.nip.trim(),
      email: editFormData.email.trim(),
      username: editFormData.email.trim(),
      unit_kerja_id: editFormData.unit_kerja_id,
      jurusan: editFormData.jurusan || '',
      unit: unitObj ? unitObj.nama_unit : editFormData.unit,
      role_slug: selectedRole.slug,
      role: mappedRole,
      roleLevel: isSuper
        ? 'Level 0: Administrator Sistem'
        : isPejabat
        ? 'Level 1: Pimpinan'
        : isVerifikator
        ? 'Level 2: Verifikator'
        : isAdminTU
        ? 'Level 3: Tata Usaha'
        : 'Level 3: Dosen/Pegawai',
      roleLabel: cleanJabatan,
      jabatan: cleanJabatan,
      permissions: userPermissions,
      is_pejabat: isPejabat,
      is_super_admin: isSuper,
      signatureReady: Boolean(editFormData.signatureReady),
      password: cleanPassword,
      raw_password: cleanPassword
    };

    // Bersihkan seluruh atribut switcher agar user beroperasi dalam peran tunggal yang telah disetel oleh Super Admin
    delete updatedUser.active_context_mode;
    delete updatedUser.saved_pejabat_snapshot;
    delete updatedUser.dual_role_profiles;

    // Simpan ke database melalui backend API
    updateUser(
      selectedUserForDetail.id || selectedUserForDetail.nip,
      {
        id: selectedUserForDetail.id,
        nip: updatedUser.nip,
        nama: updatedUser.name,
        email: updatedUser.email,
        kode_unit: updatedUser.unit_kerja_id,
        unit_kerja_id: updatedUser.unit_kerja_id,
        jurusan: updatedUser.jurusan,
        jabatan: updatedUser.jabatan,
        role: updatedUser.role,
        password: cleanPassword,
        password_baru: cleanPassword
      },
      user
    ).catch((err) => {
      console.warn('[MANAJEMEN-PENGGUNA] Gagal memperbarui user di database backend:', err.message);
    });

    if (onUpdateUsers) {
      onUpdateUsers([updatedUser]);
    }

    setIsDetailModalOpen(false);
    showToast(
      `Peran dan data pengguna ${editFormData.name} berhasil diperbarui sebagai [${cleanJabatan}].`,
      'success'
    );
  };

  // Handler: Hapus Pengguna dari Sistem (Konfirmasi Tunggal 1x)
  const handleDeleteUser = (targetUser) => {
    if (!targetUser) return;
    if (isSuperAdminUser(targetUser)) {
      showToast('Akun Super Administrator sistem tidak dapat dihapus untuk menjaga keamanan dan kedaulatan akses SILOKA.', 'error');
      return;
    }
    const name = targetUser.nama_lengkap || targetUser.name || 'Pengguna';
    if (window.confirm('Apakah anda yakin untuk menghapus user tersebut? Pengguna yang dihapus otomatis tidak dapat lagi mengakses sistem SILOKA.')) {
      if (onDeleteUser) {
        onDeleteUser(targetUser);
      }
      setIsDetailModalOpen(false);
      showToast(`Pengguna ${name} berhasil dihapus dari sistem dan aksesnya telah dicabut.`, 'info');
    }
  };

  // Handler: Tambah User Manual
  const handleCreateUserManual = (e) => {
    e.preventDefault();
    try {
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

      const unitObj =
        activeUnits.find((item) => item.kode_unit === newUserData.unit_kerja_id) ||
        unitKerjaList.find((item) => item.kode_unit === newUserData.unit_kerja_id);

      const selectedRole = rolesCatalog.find(
        (r) => (r.slug || r.id) === (newUserData.role_slug || newUserData.role)
      ) || rolesCatalog.find((r) => r.slug === 'drafter') || rolesCatalog[0];

      const isSuper = selectedRole.slug === 'super_admin';
      const isPimpinan = selectedRole.slug === 'pimpinan';
      const isAdminTU = selectedRole.slug === 'admin_tu';
      const isVerifikator = selectedRole.slug === 'verifikator';
      const isAuditor = selectedRole.slug === 'auditor_spi';

      const cleanJabatan = (newUserData.jabatan || (isSuper ? 'Super Administrator' : selectedRole.name)).trim();

      // Validasi pencegahan duplikasi okupansi jabatan struktural tunggal
      const incumbent = findPositionOccupant(cleanJabatan, allUsers, null, newUserData.unit_kerja_id);
      if (incumbent) {
        const incumbentName = incumbent.name || incumbent.nama_lengkap || 'pejabat lain';
        const confirmMsg =
          `Peringatan Okupansi Jabatan Pimpinan!\n\n` +
          `Jabatan "${cleanJabatan}" saat ini telah aktif diisi oleh ${incumbentName} (NIP: ${incumbent.nip || '-'}).\n\n` +
          `Satu jabatan struktural tunggal tidak disarankan memiliki lebih dari 1 pejabat aktif untuk mencegah konflik wewenang TTE dan disposisi.\n\n` +
          `Apakah Anda yakin tetap ingin mendaftarkan pengguna baru dengan jabatan yang sama?`;
        if (typeof window !== 'undefined' && !window.confirm(confirmMsg)) {
          showToast(`Pendaftaran dibatalkan: Jabatan [${cleanJabatan}] telah diisi oleh [${incumbentName}].`, 'warning');
          return;
        }
      }
      const posLower = cleanJabatan.toLowerCase();
      const hasStructuralKeyword = matchesOfficialDisposisiPosition(cleanJabatan);
      const isExplicitlyNonPejabat =
        posLower.includes('dosen fungsional') ||
        posLower.includes('dosen pengajar') ||
        posLower.includes('staf') ||
        posLower.includes('operator') ||
        posLower.includes('pengadministrasi') ||
        posLower.includes('arsiparis') ||
        (posLower.includes('auditor') && !posLower.includes('ketua'));

      const isPejabat = isPimpinan || (hasStructuralKeyword && !isExplicitlyNonPejabat);

      let mappedRole = 'DOSEN';
      if (isSuper) {
        mappedRole = 'Super Admin';
      } else if (isPejabat) {
        mappedRole = 'PEJABAT';
      } else if (selectedRole.slug === 'verifikator') {
        mappedRole = 'VERIFIKATOR';
      } else if (selectedRole.slug === 'admin_tu') {
        mappedRole = 'STAF';
      } else if (selectedRole.slug === 'auditor_spi') {
        mappedRole = 'PENGAWAS';
      } else {
        mappedRole = 'DOSEN';
      }

      let userPermissions = [...(selectedRole.keySlugs || [])];
      if (isPejabat) {
        if (!userPermissions.includes('disposisi.create')) userPermissions.push('disposisi.create');
        if (!userPermissions.includes('disposisi.forward')) userPermissions.push('disposisi.forward');
      } else {
        userPermissions = userPermissions.filter((p) => p !== 'disposisi.create' && p !== 'disposisi.forward');
      }

      const roleLabelText = isSuper
        ? 'Super Administrator SILOKA UNSIL'
        : cleanJabatan;

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
        jurusan: newUserData.jurusan || '',
        unit: unitObj
          ? unitObj.nama_unit
          : isSuper
          ? 'Unit Penunjang Akademik Teknologi Informasi dan Komunikasi'
          : 'Fakultas Teknik',
        role_slug: selectedRole.slug,
        role: mappedRole,
        roleLevel: isSuper
          ? 'Level 0: Administrator Sistem'
          : isPejabat
          ? 'Level 1: Pimpinan'
          : selectedRole.slug === 'verifikator'
          ? 'Level 2: Verifikator'
          : selectedRole.slug === 'admin_tu'
          ? 'Level 3: Tata Usaha'
          : 'Level 3: Dosen/Pegawai',
        roleLabel: roleLabelText,
        jabatan: cleanJabatan,
        permissions: userPermissions,
        is_pejabat: isPejabat,
        is_super_admin: isSuper,
        signatureReady: isPejabat || isSuper,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };

      // Hapus identifier pengguna dari blacklist lokal jika sebelumnya pernah terhapus
      try {
        const deletedStr = localStorage.getItem('siloka_deleted_user_ids');
        if (deletedStr) {
          const deletedArr = JSON.parse(deletedStr);
          if (Array.isArray(deletedArr)) {
            const idSet = new Set([
              newUser.id.toLowerCase(),
              newUser.nip.toLowerCase(),
              cleanEmail.toLowerCase(),
              cleanEmail.split('@')[0].toLowerCase()
            ]);
            const filtered = deletedArr.filter((item) => {
              const clean = String(item).toLowerCase().trim();
              return !idSet.has(clean);
            });
            localStorage.setItem('siloka_deleted_user_ids', JSON.stringify(filtered));
          }
        }
      } catch (e) {
        // ignore
      }

      // Simpan akun ke database melalui service/backend API
      createUser(
        {
          nip: newUser.nip,
          nama: newUser.name,
          email: newUser.email,
          kode_unit: newUser.unit_kerja_id,
          unit_kerja_id: newUser.unit_kerja_id,
          jurusan: newUser.jurusan,
          jabatan: cleanJabatan,
          role: mappedRole,
          password: newUser.password,
          raw_password: newUser.password
        },
        user
      )
        .then((res) => {
          const resData = res?.data || res?.user;
          if (resData) {
            const persisted = {
              ...newUser,
              ...resData,
              unit: newUser.unit || resData.unit,
              role_slug: newUser.role_slug || resData.role_slug,
              roleLabel: newUser.roleLabel || resData.roleLabel || resData.role_label,
              permissions: newUser.permissions || resData.permissions
            };
            if (onUpdateUsers) {
              onUpdateUsers([persisted]);
            }
          }
        })
        .catch((err) => {
          console.warn('[MANAJEMEN-PENGGUNA] Sinkronisasi backend gagal, menyimpan ke cache lokal:', err.message);
        });

      if (onUpdateUsers) {
        onUpdateUsers([newUser]);
      }

      // Reset filter dan kata kunci pencarian agar pengguna baru langsung muncul seketika di tabel
      setSelectedRoleFilter('ALL');
      setSearchQuery('');

      const resetJurusan = getJurusanByUnitCode('UN58.13', activeUnits);
      setIsAddUserModalOpen(false);
      setNewUserData({
        name: '',
        nip: '',
        email: '',
        unit_kerja_id: 'UN58.13',
        jurusan: resetJurusan[0]?.nama || '',
        role_slug: 'drafter',
        role: 'DOSEN',
        jabatan: resetJurusan[0]?.nama ? `Dosen Jurusan ${resetJurusan[0].nama}` : 'Dosen Fungsional (Tridharma)',
        password: 'Siloka2026!'
      });
      setShowNewPassword(false);
      showToast(`Pengguna baru [${newUser.name}] berhasil didaftarkan sebagai [${cleanJabatan}].`, 'success');
    } catch (err) {
      console.error('[MANAJEMEN-PENGGUNA] Gagal mendaftarkan pengguna baru:', err);
      showToast('Terjadi kendala saat mendaftarkan pengguna baru. Silakan periksa kembali kelengkapan formulir.', 'error');
    }
  };

  // Handler: Sinkronisasi Data Pegawai dari Basis Data
  const handleSyncSSO = async () => {
    setIsSyncingSSO(true);
    try {
      const fetched = await fetchUsersList(user);
      if (Array.isArray(fetched) && fetched.length > 0) {
        if (onUpdateUsers) {
          onUpdateUsers(fetched);
        }
        showToast(
          `Sinkronisasi berhasil: ${fetched.length} akun pengguna telah disinkronkan langsung dengan basis data kepegawaian UNSIL.`,
          'success'
        );
      } else {
        showToast(`Sinkronisasi selesai: ${allUsers.length} akun pengguna aktif terverifikasi.`, 'info');
      }
    } catch (err) {
      console.error('Error syncing users:', err);
      showToast('Gagal melakukan sinkronisasi dengan basis data. Menggunakan data lokal.', 'error');
    } finally {
      setIsSyncingSSO(false);
    }
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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
        </div>
      </div>

      {/* =========================================================================
          KONTEN TINGKAT 1: TABEL UNIT KERJA
          ========================================================================= */}
      {!selectedUnitForFilter && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Kontrol Pencarian & Filter Kategori Unit Kerja */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  placeholder="Cari nama unit kerja atau singkatan..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                />
                {unitSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUnitSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Kategori Unit */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'ALL', label: `Semua (${enrichedUnits.length})` },
                  { id: 'FAKULTAS', label: 'Fakultas' },
                  { id: 'BIRO', label: 'Biro' },
                  { id: 'LEMBAGA_UPA', label: 'Lembaga & UPA' },
                  { id: 'ORGAN', label: 'Pimpinan' }
                ].map((kat) => (
                  <button
                    key={kat.id}
                    type="button"
                    onClick={() => setSelectedUnitKategori(kat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedUnitKategori === kat.id
                        ? 'bg-unsil-green-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {kat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabel Unit Kerja Resmi (Persis Format Gambar 4) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60">
              <span className="font-bold text-xs text-slate-700">
                Total {filteredUnits.length} Unit Kerja
              </span>
              <span className="text-[11px] text-slate-500">
                Klik tombol &ldquo;Kelola Pengguna&rdquo; untuk melihat rincian akun pegawai pada unit kerja terkait.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[280px]">Nama Unit Kerja</th>
                    <th className="py-3 px-4 min-w-[140px]">Kode / Singkatan</th>
                    <th className="py-3 px-4 min-w-[120px]">Kategori</th>
                    <th className="py-3 px-4 text-center min-w-[90px]">Pegawai</th>
                    <th className="py-3 px-4 text-center min-w-[90px]">Status</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">Unit kerja tidak ditemukan.</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Silakan periksa kata kunci pencarian atau pilih filter kategori lain.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u, index) => (
                      <tr
                        key={u.id || u.kode_unit}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {u.nama_unit}
                          </div>
                          {u.parent_kode && u.parent_kode !== 'UN58' && (
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              Induk: {u.parent_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-bold text-unsil-green-950 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {u.kode_unit}
                            </span>
                            {u.singkatan && u.singkatan !== u.kode_unit && (
                              <span className="text-[11px] font-semibold text-slate-600">
                                ({u.singkatan})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              u.tipe_unit === 'FAKULTAS' || u.tipe_unit === 'PASCASARJANA'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : u.tipe_unit === 'BIRO'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : u.tipe_unit === 'LEMBAGA' || u.tipe_unit === 'UPA'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {u.tipe_unit === 'ORGAN' || u.tipe_unit === 'UNIVERSITAS'
                              ? 'Pimpinan'
                              : u.tipe_unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            <Users className="w-3 h-3 text-slate-400" />
                            {u.memberCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {u.is_active !== false ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUnitForFilter(u);
                              setSelectedRoleFilter('ALL');
                              setSearchQuery('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-unsil-green-900 bg-emerald-50 hover:bg-unsil-green-900 hover:text-white border border-emerald-200 transition cursor-pointer shadow-2xs group/btn"
                            title={`Kelola akun pengguna di ${u.nama_unit}`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Kelola Pengguna</span>
                            <ChevronRight className="w-3.5 h-3.5 text-unsil-green-700 group-hover/btn:text-white transition group-hover/btn:translate-x-0.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          KONTEN TINGKAT 2: PENGGUNA DI UNIT TERPILIH
          ========================================================================= */}
      {selectedUnitForFilter && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Banner Navigasi & Info Unit Kerja Terpilih */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitForFilter(null);
                  setSelectedRoleFilter('ALL');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg hover:bg-unsil-green-50 hover:text-unsil-green-900 hover:border-unsil-green-700 transition cursor-pointer shadow-2xs w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Unit Kerja</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddUserModal(selectedUnitForFilter)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-2xs active:scale-95 w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengguna ke Unit Ini</span>
              </button>
            </div>

            {/* Rincian Identitas Unit Kerja */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-unsil-green-950 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                    {selectedUnitForFilter.kode_unit}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedUnitForFilter.nama_unit}
                  </h2>
                  {selectedUnitForFilter.singkatan && (
                    <span className="text-xs font-semibold text-slate-500">
                      ({selectedUnitForFilter.singkatan})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar seluruh akun pegawai dan pejabat struktural yang bertugas pada unit kerja ini.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedUnitForFilter.tipe_unit === 'FAKULTAS' || selectedUnitForFilter.tipe_unit === 'PASCASARJANA'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : selectedUnitForFilter.tipe_unit === 'BIRO'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : selectedUnitForFilter.tipe_unit === 'LEMBAGA' || selectedUnitForFilter.tipe_unit === 'UPA'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}
                >
                  {selectedUnitForFilter.tipe_unit === 'ORGAN' || selectedUnitForFilter.tipe_unit === 'UNIVERSITAS'
                    ? 'Pimpinan'
                    : selectedUnitForFilter.tipe_unit}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {selectedUnitUsers.length} Pegawai Terdaftar
                </span>
              </div>
            </div>
          </div>

          {/* Tampilan Pengguna Terstruktur Sesuai Hierarki Unit Kerja */}
          {selectedUnitUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-unsil-green-900 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Belum Ada Pegawai di {selectedUnitForFilter.nama_unit}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Saat ini belum ada akun pejabat struktural maupun staf pelaksana yang ditugaskan pada unit kerja ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddUserModal(selectedUnitForFilter)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-unsil-green-900 hover:bg-unsil-green-950 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pegawai Pertama</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Bar Pencarian Pegawai Cepat */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pegawai, NIP, email, atau jabatan..."
                    className="w-full pl-9.5 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 focus:bg-white transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Bersihkan pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <UserCheck className="w-3.5 h-3.5 text-unsil-green-800" />
                    {searchQuery ? (
                      <span>Ditemukan <strong>{totalFilteredCount}</strong> pegawai</span>
                    ) : (
                      <span>Total <strong>{selectedUnitUsers.length}</strong> pegawai</span>
                    )}
                  </span>
                </div>
              </div>

              {/* 2. Pemisahan Berbasis Sub-Unit / Jurusan untuk Fakultas / Pascasarjana */}
              {hasJurusans ? (
                <div className="space-y-4">
                  {/* Tab Tingkat Sub-Unit: Kantor Fakultas vs Jurusan & Prodi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Tab 1: Kantor Fakultas & Dekanat */}
                    <button
                      type="button"
                      onClick={() => setSubUnitTab('FAKULTAS')}
                      className={`p-4 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                        subUnitTab === 'FAKULTAS'
                          ? 'bg-unsil-green-900 text-white border-unsil-green-900 shadow-sm ring-2 ring-unsil-green-900/10'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            subUnitTab === 'FAKULTAS'
                              ? 'bg-white/10 text-white'
                              : 'bg-emerald-50 text-unsil-green-900 border border-emerald-200'
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p
                            className={`font-extrabold text-sm ${
                              subUnitTab === 'FAKULTAS' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Kantor Fakultas / Dekanat
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              subUnitTab === 'FAKULTAS' ? 'text-emerald-100' : 'text-slate-500'
                            }`}
                          >
                            Pimpinan dekanat &amp; staf tata usaha fakultas
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                          subUnitTab === 'FAKULTAS'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {facultyCount} Pegawai
                      </span>
                    </button>

                    {/* Tab 2: Jurusan & Program Studi */}
                    <button
                      type="button"
                      onClick={() => setSubUnitTab('JURUSAN')}
                      className={`p-4 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                        subUnitTab === 'JURUSAN'
                          ? 'bg-unsil-green-900 text-white border-unsil-green-900 shadow-sm ring-2 ring-unsil-green-900/10'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            subUnitTab === 'JURUSAN'
                              ? 'bg-white/10 text-white'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <p
                            className={`font-extrabold text-sm ${
                              subUnitTab === 'JURUSAN' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Jurusan &amp; Program Studi
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              subUnitTab === 'JURUSAN' ? 'text-emerald-100' : 'text-slate-500'
                            }`}
                          >
                            Pimpinan jurusan, staf prodi, &amp; dosen pengajar
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                          subUnitTab === 'JURUSAN'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {jurusanTotalCount} Pegawai
                      </span>
                    </button>
                  </div>

                  {/* Banner Notifikasi jika Hasil Pencarian ada di Tab Lain */}
                  {searchQuery && subUnitTab === 'FAKULTAS' && facultyCount === 0 && jurusanTotalCount > 0 && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>
                          Tidak ada hasil di Kantor Fakultas, tetapi ditemukan <strong>{jurusanTotalCount} pegawai</strong> di lingkup Jurusan &amp; Program Studi.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubUnitTab('JURUSAN')}
                        className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
                      >
                        Buka Tab Jurusan
                      </button>
                    </div>
                  )}

                  {searchQuery && subUnitTab === 'JURUSAN' && jurusanTotalCount === 0 && facultyCount > 0 && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>
                          Tidak ada hasil di Jurusan, tetapi ditemukan <strong>{facultyCount} pegawai</strong> di lingkup Kantor Fakultas / Dekanat.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubUnitTab('FAKULTAS')}
                        className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
                      >
                        Buka Tab Fakultas
                      </button>
                    </div>
                  )}

                  {/* KONTEN TAB FAKULTAS */}
                  {subUnitTab === 'FAKULTAS' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Seksi 1: Pejabat Pimpinan Fakultas */}
                      <UserSectionTable
                        title="Pejabat Pimpinan Fakultas"
                        subtitle="Dekan, para Wakil Dekan, dan pimpinan struktural fakultas"
                        icon={ShieldCheck}
                        badgeText={`${classifiedUsers.pejabatFakultas.length} Pejabat`}
                        badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
                        users={classifiedUsers.pejabatFakultas}
                        emptyMessage="Belum ada pejabat pimpinan fakultas yang ditugaskan."
                        onAddUser={() =>
                          handleOpenAddUserModal(selectedUnitForFilter, {
                            role_slug: 'pimpinan',
                            role: 'PEJABAT',
                            jurusan: 'FAKULTAS'
                          })
                        }
                        addLabel="Tambah Pejabat Fakultas"
                        onDetailClick={handleOpenDetailModal}
                        onDeleteClick={handleDeleteUser}
                        rolesCatalog={rolesCatalog}
                      />

                      {/* Seksi 2: Staf Tata Usaha Fakultas */}
                      <UserSectionTable
                        title="Staf Tata Usaha &amp; Administrasi Fakultas"
                        subtitle="Pengadministrasi persuratan, operator loket TU, dan pengelola fakultas"
                        icon={Briefcase}
                        badgeText={`${classifiedUsers.stafFakultas.length} Staf`}
                        badgeColor="bg-slate-100 text-slate-700 border-slate-200"
                        users={classifiedUsers.stafFakultas}
                        emptyMessage="Belum ada staf tata usaha fakultas yang terdaftar."
                        onAddUser={() =>
                          handleOpenAddUserModal(selectedUnitForFilter, {
                            role_slug: 'admin_tu',
                            role: 'STAF',
                            jurusan: 'FAKULTAS'
                          })
                        }
                        addLabel="Tambah Staf TU Fakultas"
                        onDetailClick={handleOpenDetailModal}
                        onDeleteClick={handleDeleteUser}
                        rolesCatalog={rolesCatalog}
                      />
                    </div>
                  )}

                  {/* KONTEN TAB JURUSAN & PROGRAM STUDI */}
                  {subUnitTab === 'JURUSAN' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Bar Pemilih Jurusan Horizontal Ramah Pengguna */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
                          Pilih Jurusan:
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedJurusanFilter('ALL')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            selectedJurusanFilter === 'ALL'
                              ? 'bg-unsil-green-900 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Semua Jurusan ({jurusanTotalCount})
                        </button>
                        {unitJurusans.map((jur) => {
                          const count = getCountForJurusan(jur.nama);
                          const isSelected = selectedJurusanFilter === jur.nama;
                          return (
                            <button
                              key={jur.id || jur.kode || jur.nama}
                              type="button"
                              onClick={() => setSelectedJurusanFilter(jur.nama)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-unsil-green-900 text-white shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{jur.nama}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Seksi 1: Pimpinan Jurusan / Ketua Program Studi */}
                      <UserSectionTable
                        title={
                          selectedJurusanFilter === 'ALL'
                            ? 'Pimpinan Jurusan &amp; Ketua Program Studi'
                            : `Pimpinan Jurusan / Prodi ${selectedJurusanFilter}`
                        }
                        subtitle="Ketua jurusan, sekretaris jurusan, kaprodi, dan kepala laboratorium"
                        icon={Briefcase}
                        badgeText={`${displayedPejabatJurusan.length} Pejabat`}
                        badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                        users={displayedPejabatJurusan}
                        emptyMessage={
                          selectedJurusanFilter === 'ALL'
                            ? 'Belum ada pimpinan jurusan yang terdaftar.'
                            : `Belum ada pimpinan jurusan yang terdaftar di ${selectedJurusanFilter}.`
                        }
                        onAddUser={() =>
                          handleOpenAddUserModal(selectedUnitForFilter, {
                            role_slug: 'pimpinan',
                            role: 'PEJABAT',
                            jurusan:
                              selectedJurusanFilter !== 'ALL'
                                ? selectedJurusanFilter
                                : unitJurusans[0]?.nama || ''
                          })
                        }
                        addLabel="Tambah Pimpinan Jurusan"
                        onDetailClick={handleOpenDetailModal}
                        onDeleteClick={handleDeleteUser}
                        rolesCatalog={rolesCatalog}
                      />

                      {/* Seksi 2: Staf Administrasi Jurusan */}
                      <UserSectionTable
                        title={
                          selectedJurusanFilter === 'ALL'
                            ? 'Staf Administrasi Jurusan / Program Studi'
                            : `Staf Administrasi Jurusan ${selectedJurusanFilter}`
                        }
                        subtitle="Staf TU jurusan, operator prodi, dan teknisi laboratorium"
                        icon={Briefcase}
                        badgeText={`${displayedStafJurusan.length} Staf`}
                        badgeColor="bg-slate-100 text-slate-700 border-slate-200"
                        users={displayedStafJurusan}
                        emptyMessage={
                          selectedJurusanFilter === 'ALL'
                            ? 'Belum ada staf administrasi jurusan yang terdaftar.'
                            : `Belum ada staf administrasi yang terdaftar di ${selectedJurusanFilter}.`
                        }
                        onAddUser={() =>
                          handleOpenAddUserModal(selectedUnitForFilter, {
                            role_slug: 'admin_tu',
                            role: 'STAF',
                            jurusan:
                              selectedJurusanFilter !== 'ALL'
                                ? selectedJurusanFilter
                                : unitJurusans[0]?.nama || ''
                          })
                        }
                        addLabel="Tambah Staf Jurusan"
                        onDetailClick={handleOpenDetailModal}
                        onDeleteClick={handleDeleteUser}
                        rolesCatalog={rolesCatalog}
                      />

                      {/* Seksi 3: Dosen Pengajar (Tanpa Jabatan Struktural) */}
                      <UserSectionTable
                        title={
                          selectedJurusanFilter === 'ALL'
                            ? 'Dosen Pengajar (Tanpa Jabatan Struktural)'
                            : `Dosen Pengajar Jurusan ${selectedJurusanFilter}`
                        }
                        subtitle="Dosen fungsional aktif yang menjalankan Tridharma perguruan tinggi"
                        icon={BookOpen}
                        badgeText={`${displayedDosenBiasa.length} Dosen`}
                        badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
                        users={displayedDosenBiasa}
                        emptyMessage={
                          selectedJurusanFilter === 'ALL'
                            ? 'Belum ada dosen pengajar tanpa jabatan struktural yang terdaftar.'
                            : `Belum ada dosen pengajar yang terdaftar di ${selectedJurusanFilter}.`
                        }
                        onAddUser={() =>
                          handleOpenAddUserModal(selectedUnitForFilter, {
                            role_slug: 'drafter',
                            role: 'DOSEN',
                            jurusan:
                              selectedJurusanFilter !== 'ALL'
                                ? selectedJurusanFilter
                                : unitJurusans[0]?.nama || ''
                          })
                        }
                        addLabel="Tambah Dosen Pengajar"
                        onDetailClick={handleOpenDetailModal}
                        onDeleteClick={handleDeleteUser}
                        rolesCatalog={rolesCatalog}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* 3. Tampilan Unit Non-Fakultas (Rektorat, Biro, Lembaga, UPA, SPI, Senat) */
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Seksi 1: Pimpinan / Pejabat Struktural Unit */}
                  <UserSectionTable
                    title={`Pimpinan & Pejabat Struktural ${selectedUnitForFilter.nama_unit}`}
                    subtitle="Pimpinan unit yang berwenang menindaklanjuti dan mengesahkan naskah dinas"
                    icon={ShieldCheck}
                    badgeText={`${classifiedUsers.pejabatFakultas.length} Pejabat`}
                    badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
                    users={classifiedUsers.pejabatFakultas}
                    emptyMessage="Belum ada pimpinan atau pejabat struktural yang terdaftar pada unit ini."
                    onAddUser={() =>
                      handleOpenAddUserModal(selectedUnitForFilter, {
                        role_slug: 'pimpinan',
                        role: 'PEJABAT'
                      })
                    }
                    addLabel="Tambah Pimpinan Unit"
                    onDetailClick={handleOpenDetailModal}
                    onDeleteClick={handleDeleteUser}
                    rolesCatalog={rolesCatalog}
                  />

                  {/* Seksi 2: Staf Administrasi & Pelaksana Unit */}
                  <UserSectionTable
                    title={`Staf Administrasi & Operator ${selectedUnitForFilter.nama_unit}`}
                    subtitle="Staf pelaksana administrasi, operator persuratan, dan tim kerja unit"
                    icon={Briefcase}
                    badgeText={`${(classifiedUsers.stafFakultas.length + classifiedUsers.dosenBiasa.length)} Staf`}
                    badgeColor="bg-slate-100 text-slate-700 border-slate-200"
                    users={[...classifiedUsers.stafFakultas, ...classifiedUsers.dosenBiasa]}
                    emptyMessage="Belum ada staf administrasi yang terdaftar pada unit ini."
                    onAddUser={() =>
                      handleOpenAddUserModal(selectedUnitForFilter, {
                        role_slug: 'admin_tu',
                        role: 'STAF'
                      })
                    }
                    addLabel="Tambah Staf Unit"
                    onDetailClick={handleOpenDetailModal}
                    onDeleteClick={handleDeleteUser}
                    rolesCatalog={rolesCatalog}
                  />
                </div>
              )}

              {/* 4. Seksi Khusus: Administrator Sistem / Auditor (Jika Ada) */}
              {classifiedUsers.specialRoles.length > 0 && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <UserSectionTable
                    title="Pengelola Khusus / Administrator Sistem"
                    subtitle="Akun pengelola sistem SILOKA dan pengawas internal yang bertugas di unit ini"
                    icon={Shield}
                    badgeText={`${classifiedUsers.specialRoles.length} Akun Khusus`}
                    badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                    users={classifiedUsers.specialRoles}
                    emptyMessage="Tidak ada akun khusus pada unit ini."
                    onDetailClick={handleOpenDetailModal}
                    onDeleteClick={handleDeleteUser}
                    rolesCatalog={rolesCatalog}
                  />
                </div>
              )}
            </div>
          )}
      </div>
    )}

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
                    onChange={(e) => {
                      const nextUnitId = e.target.value;
                      const unitObj =
                        activeUnits.find((u) => u.kode_unit === nextUnitId) ||
                        unitKerjaList.find((u) => u.kode_unit === nextUnitId);
                      const unitPositions = getPositionsByUnitAndRole(nextUnitId, editFormData.role_slug, activeUnits);
                      const jurList = getJurusanByUnitCode(nextUnitId, activeUnits);
                      let updatedJurusan = editFormData.jurusan;
                      let updatedJabatan = editFormData.jabatan;

                      if (jurList.length > 0) {
                        if (!jurList.some((j) => j.nama === updatedJurusan)) {
                          updatedJurusan = jurList[0].nama;
                        }
                        if (editFormData.role_slug === 'drafter') {
                          updatedJabatan = `Dosen Jurusan ${updatedJurusan}`;
                          setIsCustomJabatanEdit(false);
                        }
                      } else {
                        updatedJurusan = '';
                      }

                      if (editFormData.role_slug === 'pimpinan') {
                        updatedJabatan = unitPositions[0] || 'Pejabat Struktural';
                        setIsCustomJabatanEdit(false);
                      } else if (editFormData.role_slug !== 'drafter' && !isCustomJabatanEdit && unitPositions.length > 0) {
                        updatedJabatan = unitPositions[0];
                      }

                      setEditFormData((prev) => ({
                        ...prev,
                        unit_kerja_id: nextUnitId,
                        unit: unitObj?.nama_unit || prev.unit,
                        jurusan: updatedJurusan,
                        jabatan: updatedJabatan
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                  >
                    {activeUnits.map((unit) => (
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
                        const unitPositions = getPositionsByUnitAndRole(editFormData.unit_kerja_id, newSlug, activeUnits);
                        const jurList = getJurusanByUnitCode(editFormData.unit_kerja_id, activeUnits);
                        const defaultJurusan = editFormData.jurusan || (jurList.length > 0 ? jurList[0].nama : '');
                        const updatedTte = newSlug === 'pimpinan' || newSlug === 'super_admin';
                        let updatedJabatan = unitPositions[0] || roleObj?.name || 'Dosen Fungsional (Tridharma)';
                        if (newSlug === 'drafter' && defaultJurusan) {
                          updatedJabatan = `Dosen Jurusan ${defaultJurusan}`;
                        }
                        setIsCustomJabatanEdit(false);

                        setEditFormData((prev) => ({
                          ...prev,
                          role_slug: newSlug,
                          jurusan: newSlug === 'drafter' ? defaultJurusan : prev.jurusan,
                          jabatan: updatedJabatan,
                          signatureReady: updatedTte
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

                  {editSelectedUnitJurusan.length > 0 && editFormData.role_slug === 'drafter' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Jurusan / Program Studi
                      </label>
                      <select
                        value={editFormData.jurusan || ''}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          const nextJabatan = chosen ? `Dosen Jurusan ${chosen}` : (editUnitPositions[0] || 'Dosen Fungsional (Tridharma)');
                          setIsCustomJabatanEdit(false);
                          setEditFormData((prev) => ({
                            ...prev,
                            jurusan: chosen,
                            jabatan: nextJabatan
                          }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                      >
                        <option value="">Pilih Jurusan...</option>
                        {editSelectedUnitJurusan.map((j) => (
                          <option key={j.id || j.kode || j.nama} value={j.nama}>
                            {j.nama} {j.kode ? `(${j.kode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={`space-y-1 ${editSelectedUnitJurusan.length > 0 && editFormData.role_slug === 'drafter' ? 'sm:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Jabatan Struktural / Peran Institusi
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomJabatanEdit((prev) => !prev)}
                        className="text-[11px] text-unsil-green-800 hover:text-unsil-green-950 font-medium underline cursor-pointer"
                      >
                        {isCustomJabatanEdit ? 'Pilih dari Daftar Unit' : 'Ketik Manual'}
                      </button>
                    </div>
                    {!isCustomJabatanEdit ? (
                      <select
                        value={editFormData.jabatan}
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomJabatanEdit(true);
                          } else {
                            setEditFormData({ ...editFormData, jabatan: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                      >
                        {editFormData.jabatan && !editUnitPositions.includes(editFormData.jabatan) && (
                          <option value={editFormData.jabatan}>
                            {editFormData.jabatan}
                            {editJabatanOccupant ? ` — (Terisi: ${editJabatanOccupant.name || editJabatanOccupant.nama_lengkap})` : ''}
                          </option>
                        )}
                        {editUnitPositions.map((pos) => {
                          const occ = findPositionOccupant(pos, allUsers, selectedUserForDetail?.id, editFormData.unit_kerja_id);
                          return (
                            <option key={pos} value={pos}>
                              {pos}{occ ? ` — (Terisi: ${occ.name || occ.nama_lengkap})` : ''}
                            </option>
                          );
                        })}
                        <option value="__CUSTOM__">Ketik Jabatan Lainnya (Kustom)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        list="unsil-structural-positions-list"
                        value={editFormData.jabatan}
                        onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                        placeholder="Contoh: Dekan Fakultas Teknik / Dosen Fungsional"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                      />
                    )}
                    <div className="text-[10px] text-slate-500">
                      {editFormData.role_slug === 'pimpinan'
                        ? `Opsi jabatan pimpinan resmi di ${getUnitByCode(editFormData.unit_kerja_id)?.nama_unit || editFormData.unit_kerja_id}`
                        : `Menyesuaikan unit kerja: ${getUnitByCode(editFormData.unit_kerja_id)?.singkatan || editFormData.unit_kerja_id}`}
                    </div>

                    {/* Alert Warning Okupansi Jabatan Tunggal (Anti Human Error) */}
                    {editJabatanOccupant && (
                      <div className="p-3 bg-amber-50 border border-amber-300/80 rounded-xl text-amber-900 space-y-1 animate-in fade-in duration-200 shadow-2xs mt-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <span className="font-bold text-amber-950">Peringatan Okupansi Jabatan:</span>{' '}
                            Jabatan <strong className="font-semibold text-amber-950">"{editFormData.jabatan}"</strong> saat ini telah aktif diisi oleh{' '}
                            <strong className="font-semibold text-amber-950">{editJabatanOccupant.name || editJabatanOccupant.nama_lengkap}</strong>
                            {editJabatanOccupant.nip ? ` (NIP: ${editJabatanOccupant.nip})` : ''}.
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-700 pl-6 leading-normal">
                          Satu jabatan struktural tunggal tidak disarankan memiliki lebih dari satu pejabat aktif untuk mencegah tumpang tindih wewenang dan TTE naskah dinas.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel Ringkasan Wewenang Peran yang Dipilih (Pratinjau Hak Akses Real-Time) */}
                <UserRoleCapabilityPreview roleSlug={editFormData.role_slug} />
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
                const hasDisposisi =
                  editFormData.role_slug === 'super_admin' ||
                  editFormData.role_slug === 'pimpinan' ||
                  matchesOfficialDisposisiPosition(editFormData.jabatan);

                return (
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-100 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-unsil-green-800" />
                        Daftar Hak Akses ({roleSlugs.length} Wewenang)
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {hasDisposisi ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                            <CheckSquare className="w-3 h-3 text-blue-700" />
                            Wewenang Disposisi Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Tanpa Hak Disposisi
                          </span>
                        )}
                        {hasRahasia && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            Akses Brankas Digital
                          </span>
                        )}
                      </div>
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
              {selectedUserForDetail && !isSuperAdminUser(selectedUserForDetail) && onDeleteUser ? (
                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUserForDetail)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pengguna</span>
                </button>
              ) : selectedUserForDetail && isSuperAdminUser(selectedUserForDetail) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Akun Super Administrator Terlindungi</span>
                </span>
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
                    onChange={(e) => {
                      const nextUnitId = e.target.value;
                      const unitPositions = getPositionsByUnitAndRole(nextUnitId, newUserData.role_slug, activeUnits);
                      const jurList = getJurusanByUnitCode(nextUnitId, activeUnits);
                      let updatedJurusan = newUserData.jurusan;
                      let updatedJabatan = newUserData.jabatan;

                      if (jurList.length > 0) {
                        if (!jurList.some((j) => j.nama === updatedJurusan)) {
                          updatedJurusan = jurList[0].nama;
                        }
                        if (newUserData.role_slug === 'drafter') {
                          updatedJabatan = `Dosen Jurusan ${updatedJurusan}`;
                          setIsCustomJabatanAdd(false);
                        }
                      } else {
                        updatedJurusan = '';
                      }

                      if (newUserData.role_slug === 'pimpinan') {
                        updatedJabatan = unitPositions[0] || 'Pejabat Struktural';
                        setIsCustomJabatanAdd(false);
                      } else if (newUserData.role_slug !== 'drafter' && !isCustomJabatanAdd && unitPositions.length > 0) {
                        updatedJabatan = unitPositions[0];
                      }

                      setNewUserData((prev) => ({
                        ...prev,
                        unit_kerja_id: nextUnitId,
                        jurusan: updatedJurusan,
                        jabatan: updatedJabatan
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                  >
                    {activeUnits.map((unit) => (
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
                        const nextUnitId =
                          newSlug === 'super_admin' && newUserData.unit_kerja_id === 'UN58.13'
                            ? 'UN58.32'
                            : newUserData.unit_kerja_id;
                        const unitPositions = getPositionsByUnitAndRole(nextUnitId, newSlug, activeUnits);
                        const jurList = getJurusanByUnitCode(nextUnitId, activeUnits);
                        const defaultJurusan = newUserData.jurusan || (jurList.length > 0 ? jurList[0].nama : '');
                        let defaultJabatan = unitPositions[0] || roleObj?.name || 'Dosen Fungsional (Tridharma)';
                        if (newSlug === 'drafter' && defaultJurusan) {
                          defaultJabatan = `Dosen Jurusan ${defaultJurusan}`;
                        }
                        setIsCustomJabatanAdd(false);

                        setNewUserData((prev) => ({
                          ...prev,
                          role_slug: newSlug,
                          role: newSlug === 'super_admin' ? 'Super Admin' : newSlug === 'pimpinan' ? 'PEJABAT' : newSlug === 'admin_tu' ? 'STAF' : newSlug === 'verifikator' ? 'VERIFIKATOR' : 'DOSEN',
                          jurusan: newSlug === 'drafter' ? defaultJurusan : prev.jurusan,
                          jabatan: defaultJabatan,
                          unit_kerja_id: nextUnitId
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

                  {newSelectedUnitJurusan.length > 0 && newUserData.role_slug === 'drafter' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Jurusan / Program Studi
                      </label>
                      <select
                        value={newUserData.jurusan || ''}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          const nextJabatan = chosen ? `Dosen Jurusan ${chosen}` : (newUnitPositions[0] || 'Dosen Fungsional (Tridharma)');
                          setIsCustomJabatanAdd(false);
                          setNewUserData((prev) => ({
                            ...prev,
                            jurusan: chosen,
                            jabatan: nextJabatan
                          }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                      >
                        <option value="">Pilih Jurusan...</option>
                        {newSelectedUnitJurusan.map((j) => (
                          <option key={j.id || j.kode || j.nama} value={j.nama}>
                            {j.nama} {j.kode ? `(${j.kode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={`space-y-1 ${newSelectedUnitJurusan.length > 0 && newUserData.role_slug === 'drafter' ? 'sm:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Jabatan Struktural / Peran Institusi
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomJabatanAdd((prev) => !prev)}
                        className="text-[11px] text-unsil-green-800 hover:text-unsil-green-950 font-medium underline cursor-pointer"
                      >
                        {isCustomJabatanAdd ? 'Pilih dari Daftar Unit' : 'Ketik Manual'}
                      </button>
                    </div>
                    {!isCustomJabatanAdd ? (
                      <select
                        value={newUserData.jabatan}
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomJabatanAdd(true);
                          } else {
                            setNewUserData({ ...newUserData, jabatan: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium shadow-2xs"
                      >
                        {newUserData.jabatan && !newUnitPositions.includes(newUserData.jabatan) && (
                          <option value={newUserData.jabatan}>
                            {newUserData.jabatan}
                            {newJabatanOccupant ? ` — (Terisi: ${newJabatanOccupant.name || newJabatanOccupant.nama_lengkap})` : ''}
                          </option>
                        )}
                        {newUnitPositions.map((pos) => {
                          const occ = findPositionOccupant(pos, allUsers, null, newUserData.unit_kerja_id);
                          return (
                            <option key={pos} value={pos}>
                              {pos}{occ ? ` — (Terisi: ${occ.name || occ.nama_lengkap})` : ''}
                            </option>
                          );
                        })}
                        <option value="__CUSTOM__">Ketik Jabatan Lainnya (Kustom)...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        list="unsil-structural-positions-list"
                        value={newUserData.jabatan}
                        onChange={(e) => setNewUserData({ ...newUserData, jabatan: e.target.value })}
                        placeholder={
                          newUserData.role_slug === 'super_admin'
                            ? 'Super Administrator'
                            : 'Contoh: Dekan Fakultas Teknik / Dosen Fungsional'
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition shadow-2xs font-medium"
                      />
                    )}
                    <div className="text-[10px] text-slate-500">
                      {newUserData.role_slug === 'pimpinan'
                        ? `Opsi jabatan pimpinan resmi di ${getUnitByCode(newUserData.unit_kerja_id)?.nama_unit || newUserData.unit_kerja_id}`
                        : `Menyesuaikan unit kerja: ${getUnitByCode(newUserData.unit_kerja_id)?.singkatan || newUserData.unit_kerja_id}`}
                    </div>

                    {/* Alert Warning Okupansi Jabatan Tunggal (Anti Duplikasi & Human Error) */}
                    {newJabatanOccupant && (
                      <div className="p-3 bg-amber-50 border border-amber-300/80 rounded-xl text-amber-900 space-y-1 animate-in fade-in duration-200 shadow-2xs mt-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <span className="font-bold text-amber-950">Peringatan Okupansi Jabatan:</span>{' '}
                            Jabatan <strong className="font-semibold text-amber-950">"{newUserData.jabatan}"</strong> saat ini telah aktif diisi oleh{' '}
                            <strong className="font-semibold text-amber-950">{newJabatanOccupant.name || newJabatanOccupant.nama_lengkap}</strong>
                            {newJabatanOccupant.nip ? ` (NIP: ${newJabatanOccupant.nip})` : ''}.
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-700 pl-6 leading-normal">
                          Satu jabatan struktural tunggal tidak disarankan memiliki lebih dari satu pejabat aktif untuk mencegah tumpang tindih wewenang dan TTE naskah dinas.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel Ringkasan Wewenang Peran yang Dipilih (Pratinjau Hak Akses Real-Time) */}
                <UserRoleCapabilityPreview roleSlug={newUserData.role_slug} />
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
                const hasDisposisi =
                  newUserData.role_slug === 'super_admin' ||
                  newUserData.role_slug === 'pimpinan' ||
                  matchesOfficialDisposisiPosition(newUserData.jabatan);

                return (
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-100 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-unsil-green-800" />
                        Daftar Hak Akses ({roleSlugs.length} Wewenang)
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {hasDisposisi ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                            <CheckSquare className="w-3 h-3 text-blue-700" />
                            Wewenang Disposisi Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Tanpa Hak Disposisi
                          </span>
                        )}
                        {hasRahasia && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            Akses Brankas Digital
                          </span>
                        )}
                      </div>
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
                onClick={(e) => {
                  const form = document.getElementById('add-user-form');
                  if (form && !form.checkValidity()) {
                    form.reportValidity();
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-sm active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Datalist Saran Jabatan Struktural & Fungsional Resmi UNSIL */}
      <datalist id="unsil-structural-positions-list">
        {OFFICIAL_UNSIL_POSITIONS.map((pos) => (
          <option key={pos} value={pos} />
        ))}
      </datalist>
    </div>
  );
};

export default SystemSettingsView;
