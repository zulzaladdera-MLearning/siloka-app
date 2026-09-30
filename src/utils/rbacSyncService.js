/**
 * =================================================================================
 * SILOKA RBAC SYNCHRONIZATION SERVICE (UNSIL)
 * =================================================================================
 * Menghubungkan secara dinamis:
 * 1. Manajemen User (Akun Pengguna & Assign Role)
 * 2. Manajemen Role (Katalog 5+ Peran Utama & Daftar Izin per Role)
 * 3. Manajemen Permission (Matriks Izin Modul per Role)
 * 4. Runtime Enforcement (Sidebar, Brankas Digital, TTE, E-Disposisi)
 * =================================================================================
 */

import { isSuperAdminUser, normalizeRole } from './authGuards';

export const RBAC_CHANGE_EVENT = 'siloka:rbac-change';

/**
 * 5 Role Standar SILOKA UNSIL (Katalog Master Sesuai SK 2803/2023 & Pertor 3/2023)
 */
export const DEFAULT_CANONICAL_ROLES = [
  {
    id: 'super_admin',
    slug: 'super_admin',
    name: 'Super Administrator',
    badgeType: 'Sistem',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description:
      'Akses penuh konfigurasional sistem, manajemen role, master data unit kerja (UN58.X), master klasifikasi arsip, dan monitoring log audit.',
    permissionCount: 32,
    userCount: 2,
    keySlugs: [
      'admin.access',
      'dashboard.view',
      'role.manage',
      'user.impersonate',
      'unit.manage',
      'klasifikasi.manage',
      'arsip.jra_manage',
      'arsip.manage_jra',
      'arsip.view_biasa',
      'arsip.view_rahasia',
      'naskah.draft',
      'naskah.create_draft',
      'naskah.create_mandiri',
      'naskah.verify',
      'naskah.verify_paraf',
      'naskah.tte',
      'naskah.tte_sign',
      'naskah.numbering',
      'surat_keluar.numbering',
      'draft.return_koreksi',
      'disposisi.create',
      'disposisi.forward',
      'disposisi.read',
      'disposisi.read_action',
      'agenda.manage',
      'ekspedisi.manage',
      'audit.view',
      'backup.manage'
    ],
    remainingCount: 23
  },
  {
    id: 'admin_tu',
    slug: 'admin_tu',
    name: 'Administrator TU / Sekretariat',
    badgeType: 'Sistem',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description:
      'Operasional harian registrasi surat masuk/keluar, perakitan nomor otomatis, registrasi buku agenda, pencetakan lembar disposisi, dan pendistribusian fisik/digital.',
    permissionCount: 20,
    userCount: 15,
    keySlugs: [
      'admin.access',
      'dashboard.view',
      'surat_masuk.register',
      'surat_keluar.numbering',
      'naskah.numbering',
      'agenda.manage',
      'ekspedisi.manage',
      'arsip.view_biasa',
      'arsip.manage_jra',
      'arsip.jra_manage',
      'tembusan.send'
    ],
    remainingCount: 12
  },
  {
    id: 'pimpinan',
    slug: 'pimpinan',
    name: 'Pimpinan / Penandatangan',
    badgeType: 'Sistem',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description:
      'Wewenang pengesahan naskah dinas via TTE BSRE, penerbitan surat tugas/keputusan, instruksi E-Disposisi, dan akses surat berklasifikasi Rahasia (R) / Sangat Rahasia (SR). (Berlaku untuk Rektor, Warek, Dekan, Dir. Pasca, Ket. Lembaga, Kepala UPA).',
    permissionCount: 15,
    userCount: 28,
    keySlugs: [
      'admin.access',
      'dashboard.view',
      'naskah.draft',
      'naskah.create_draft',
      'naskah.create_mandiri',
      'naskah.verify',
      'naskah.verify_paraf',
      'naskah.tte',
      'naskah.tte_sign',
      'draft.return_koreksi',
      'disposisi.create',
      'disposisi.forward',
      'disposisi.read',
      'disposisi.read_action',
      'arsip.view_biasa',
      'arsip.view_rahasia',
      'sk.approve',
      'surat_edaran.publish'
    ],
    remainingCount: 7
  },
  {
    id: 'verifikator',
    slug: 'verifikator',
    name: 'Verifikator / Atasan Hierarki',
    badgeType: 'Sistem',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description:
      'Pemeriksaan substansi dan pembubuhan paraf berjenjang level 1 & 2 (Kajur, Koorprodi, Wadek, Kabag TU) sebelum dokumen diajukan ke pimpinan.',
    permissionCount: 12,
    userCount: 45,
    keySlugs: [
      'admin.access',
      'dashboard.view',
      'naskah.draft',
      'naskah.create_draft',
      'naskah.create_mandiri',
      'naskah.verify',
      'naskah.verify_paraf',
      'naskah.review',
      'draft.return_koreksi',
      'disposisi.read',
      'disposisi.read_action',
      'arsip.view_biasa',
      'notula.approve'
    ],
    remainingCount: 4
  },
  {
    id: 'drafter',
    slug: 'drafter',
    name: 'Dosen / Staff Drafter',
    badgeType: 'Sistem',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description:
      'Penyusunan konsep (drafting) surat resmi (Surat Tugas, Surat Dinas) dan pembuatan naskah mandiri (Nota Dinas, Laporan, Telaah Staf, Surat Pernyataan).',
    permissionCount: 8,
    userCount: 850,
    keySlugs: [
      'dashboard.view',
      'naskah.draft',
      'naskah.create_draft',
      'naskah.create_mandiri',
      'draft.submit',
      'surat_masuk.view_disposisi',
      'disposisi.read',
      'disposisi.read_action',
      'arsip.view_biasa',
      'arsip.my_documents'
    ],
    remainingCount: 0
  }
];

/**
 * Matriks Default Permission SILOKA UNSIL (Berdasarkan Modul)
 */
export const DEFAULT_PERMISSION_MATRIX = [
  {
    id: 'sistem',
    title: 'Sistem & Akses',
    description: 'Pengaturan otorisasi sistem inti dan pengawasan akun',
    permissions: [
      {
        slug: 'admin.access',
        name: 'Akses Portal Administrasi',
        description: 'Membuka navigasi dan dashboard modul administrasi sistem SILOKA.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'admin_tu']
      },
      {
        slug: 'dashboard.view',
        name: 'Melihat Ringkasan Dashboard',
        description: 'Melihat statistik persuratan, notifikasi disposisi, dan status naskah.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'admin_tu', 'drafter', 'auditor_spi']
      },
      {
        slug: 'role.manage',
        name: 'Mengelola Role & Permission',
        description: 'Mengkonfigurasi hak akses modul dan katalog peran institusi.',
        allowedRoles: ['super_admin']
      },
      {
        slug: 'user.impersonate',
        name: 'Impersonate Pengguna Lain',
        description: 'Masuk sementara sebagai pengguna lain untuk pemecahan masalah teknis.',
        allowedRoles: ['super_admin']
      },
      {
        slug: 'unit.manage',
        name: 'Master Unit Kerja Struktural',
        description: 'Pengelolaan master data hierarki unit kerja (UN58.X).',
        allowedRoles: ['super_admin']
      },
      {
        slug: 'audit.view',
        name: 'Melihat Jejak Audit (Audit Trail)',
        description: 'Melihat log transaksi dan riwayat aktivitas persuratan.',
        allowedRoles: ['super_admin', 'auditor_spi']
      }
    ]
  },
  {
    id: 'naskah',
    title: 'Tata Naskah Dinas & Drafting',
    description: 'Penyusunan konsep, paraf hierarki, TTE BSrE, dan registrasi nomor surat dinas',
    permissions: [
      {
        slug: 'naskah.draft',
        name: 'Buat Konsep Surat (Draf)',
        description: 'Menyusun draf naskah dinas sesuai 23 template standar tata persuratan UNSIL.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'drafter', 'dosen_drafter']
      },
      {
        slug: 'naskah.create_mandiri',
        name: 'Menerbitkan Naskah Mandiri',
        description: 'Menerbitkan naskah internal mandiri (Nota Dinas, Laporan, Telaah Staf, Surat Pernyataan).',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'drafter', 'dosen_drafter']
      },
      {
        slug: 'naskah.verify',
        name: 'Paraf Verifikasi Berjenjang',
        description: 'Membubuhkan paraf digital verifikasi naskah sebelum diserahkan ke penandatangan.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator']
      },
      {
        slug: 'naskah.tte',
        name: 'Penandatanganan TTE BSrE',
        description: 'Mengesahkan dan menandatangani naskah dinas dengan TTE tersertifikasi BSrE.',
        allowedRoles: ['super_admin', 'pimpinan']
      },
      {
        slug: 'naskah.numbering',
        name: 'Registrasi & Penomoran Otomatis',
        description: 'Pemberian nomor naskah otomatis berdasarkan klasifikasi kode JRA/SKKAAD SK 2803/2023.',
        allowedRoles: ['super_admin', 'admin_tu']
      },
      {
        slug: 'draft.return_koreksi',
        name: 'Mengembalikan Draf untuk Revisi',
        description: 'Memberikan catatan telaah dan mengembalikan konsep surat kepada penyusun.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator']
      }
    ]
  },
  {
    id: 'disposisi',
    title: 'E-Disposisi & Surat Masuk',
    description: 'Penerimaan surat masuk, penerbitan lembar disposisi, dan pelimpahan instruksi kerja',
    permissions: [
      {
        slug: 'surat_masuk.register',
        name: 'Registrasi Agenda Surat Masuk',
        description: 'Mencatat surat dinas masuk dari instansi luar atau unit lain.',
        allowedRoles: ['super_admin', 'admin_tu']
      },
      {
        slug: 'disposisi.create',
        name: 'Menerbitkan Arahan Disposisi',
        description: 'Menerbitkan instruksi disposisi kepada staf atau jajaran struktural.',
        allowedRoles: ['super_admin', 'pimpinan']
      },
      {
        slug: 'disposisi.forward',
        name: 'Meneruskan Instruksi Disposisi',
        description: 'Meneruskan arahan disposisi berjenjang ke unit pelaksana bawahan.',
        allowedRoles: ['super_admin', 'pimpinan']
      },
      {
        slug: 'disposisi.read',
        name: 'Melihat & Melaksanakan Disposisi',
        description: 'Membaca lembar disposisi yang diterima dan mengunggah tindak lanjut.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'drafter', 'dosen_drafter']
      },
      {
        slug: 'agenda.manage',
        name: 'Kelola Buku Agenda Universitas',
        description: 'Mengelola buku agenda nomor surat masuk dan keluar secara terpusat.',
        allowedRoles: ['super_admin', 'admin_tu']
      },
      {
        slug: 'ekspedisi.manage',
        name: 'Kelola Tanda Terima Ekspedisi Fisik',
        description: 'Pencatatan dan pencetakan lembar tanda terima kurir/ekspedisi.',
        allowedRoles: ['super_admin', 'admin_tu']
      }
    ]
  },
  {
    id: 'kearsipan',
    title: 'Kearsipan & Hak Akses Rahasia (SKKAAD)',
    description: 'Pengendalian naskah rahasia, brankas digital, dan retensi jadwal arsip universitas',
    permissions: [
      {
        slug: 'arsip.view_biasa',
        name: 'Membuka Arsip Biasa / Terbuka',
        description: 'Mengakses arsip surat berklasifikasi Biasa atau Terbuka.',
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'admin_tu', 'drafter', 'dosen_drafter', 'auditor_spi']
      },
      {
        slug: 'arsip.view_rahasia',
        name: 'Akses Surat Rahasia (R / SR) / Brankas Digital',
        description: 'Membuka dan membaca naskah berklasifikasi Rahasia (R) atau Sangat Rahasia (SR).',
        allowedRoles: ['super_admin', 'pimpinan', 'auditor_spi']
      },
      {
        slug: 'arsip.manage_jra',
        name: 'Kelola Retensi Arsip (JRA)',
        description: 'Mengatur masa simpan, jadwal retensi arsip, dan rekomendasi pemusnahan berkas.',
        allowedRoles: ['super_admin', 'admin_tu']
      },
      {
        slug: 'klasifikasi.manage',
        name: 'Master Kode Klasifikasi SK 2803',
        description: 'Memperbarui master kode klasifikasi urusan pemerintahan & perguruan tinggi.',
        allowedRoles: ['super_admin']
      }
    ]
  }
];

/**
 * Peta Sinonim / Alias Slug Permission agar kompatibel ke belakang
 */
const PERMISSION_ALIASES = {
  'naskah.create_draft': 'naskah.draft',
  'naskah.draft': 'naskah.create_draft',
  'naskah.verify_paraf': 'naskah.verify',
  'naskah.verify': 'naskah.verify_paraf',
  'naskah.tte_sign': 'naskah.tte',
  'naskah.tte': 'naskah.tte_sign',
  'surat_keluar.numbering': 'naskah.numbering',
  'naskah.numbering': 'surat_keluar.numbering',
  'disposisi.read_action': 'disposisi.read',
  'disposisi.read': 'disposisi.read_action',
  'arsip.jra_manage': 'arsip.manage_jra',
  'arsip.manage_jra': 'arsip.jra_manage'
};

/**
 * Peta Nama Resmi Human-Readable untuk Hak Akses Modul SILOKA (Anti-Slop Clean Copy)
 */
export const PERMISSION_LABEL_MAP = {
  'admin.access': 'Portal Administrasi',
  'dashboard.view': 'Ringkasan Dashboard',
  'role.manage': 'Kelola Peran & Izin',
  'user.impersonate': 'Akses Pengawasan Akun',
  'unit.manage': 'Kelola Unit Kerja (UN58.X)',
  'audit.view': 'Log Audit Jejak Digital',
  'naskah.draft': 'Penyusunan Konsep Surat',
  'naskah.create_draft': 'Draf Naskah Dinas',
  'naskah.create_mandiri': 'Naskah Dinas Mandiri',
  'draft.submit': 'Pengajuan Verifikasi',
  'naskah.verify': 'Verifikasi & Koreksi',
  'naskah.verify_paraf': 'Pembubuhan Paraf Hierarki',
  'naskah.review': 'Review Dokumen',
  'naskah.tte': 'Tanda Tangan Elektronik BSrE',
  'naskah.tte_sign': 'Pengesahan TTE Pejabat',
  'naskah.numbering': 'Penomoran Surat Otomatis',
  'surat_keluar.numbering': 'Penomoran Surat Keluar',
  'draft.return_koreksi': 'Pengembalian & Catatan Koreksi',
  'surat_masuk.register': 'Registrasi Surat Masuk',
  'surat_masuk.view_disposisi': 'Melihat Lembar Disposisi',
  'disposisi.create': 'Penerbitan Disposisi',
  'disposisi.forward': 'Penerusan Disposisi',
  'disposisi.read': 'Tindak Lanjut Disposisi',
  'disposisi.read_action': 'Pelaksanaan Instruksi Disposisi',
  'agenda.manage': 'Buku Agenda Surat',
  'ekspedisi.manage': 'Ekspedisi & Distribusi',
  'arsip.view_biasa': 'Arsip Terbuka Institusi',
  'arsip.view_rahasia': 'Brankas Digital (Rahasia/SR)',
  'arsip.my_documents': 'Dokumen Mandiri Pribadi',
  'arsip.manage_jra': 'Jadwal Retensi Arsip (JRA)',
  'arsip.jra_manage': 'Retensi & Penyusutan Arsip',
  'klasifikasi.manage': 'Kode Klasifikasi Surat',
  'tembusan.send': 'Distribusi Tembusan',
  'sk.approve': 'Persetujuan Surat Keputusan',
  'surat_edaran.publish': 'Penerbitan Surat Edaran',
  'notula.approve': 'Pengesahan Notula Rapat',
  'backup.manage': 'Cadangan Data Sistem'
};

export const getPermissionLabel = (slug) => {
  if (!slug) return '';
  return PERMISSION_LABEL_MAP[slug] || slug.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Ambil Katalog Role Aktif dari localStorage (dengan fallback default)
 */
export const getRolesCatalog = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('siloka_roles_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('[RBAC] Gagal membaca siloka_roles_catalog:', e);
  }
  return DEFAULT_CANONICAL_ROLES;
};

/**
 * Ambil Matriks Permission Aktif dari localStorage (dengan fallback default)
 */
export const getPermissionMatrix = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('siloka_permission_matrix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('[RBAC] Gagal membaca siloka_permission_matrix:', e);
  }
  return DEFAULT_PERMISSION_MATRIX;
};

/**
 * Simpan Katalog Role ke localStorage & sinkronisasikan matriks permission secara otomatis
 */
export const saveRolesCatalog = (roles) => {
  if (!Array.isArray(roles)) return;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siloka_roles_catalog', JSON.stringify(roles));
    }

    // Sinkronisasi dua arah ke Matriks Permission
    const matrix = getPermissionMatrix();
    const updatedMatrix = matrix.map((cat) => ({
      ...cat,
      permissions: cat.permissions.map((perm) => {
        // Kumpulkan role-role yang memiliki permission ini
        const allowedRoles = roles
          .filter((role) => {
            const keys = role.keySlugs || [];
            const alias = PERMISSION_ALIASES[perm.slug];
            return keys.includes(perm.slug) || (alias && keys.includes(alias));
          })
          .map((r) => r.slug || r.id);

        return {
          ...perm,
          allowedRoles
        };
      })
    }));

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siloka_permission_matrix', JSON.stringify(updatedMatrix));
    }
    broadcastRbacChange();
  } catch (e) {
    console.error('[RBAC] Gagal menyimpan katalog role:', e);
  }
};

/**
 * Simpan Matriks Permission ke localStorage & sinkronisasikan katalog role secara otomatis
 */
export const savePermissionMatrix = (categories) => {
  if (!Array.isArray(categories)) return;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siloka_permission_matrix', JSON.stringify(categories));
    }

    // Sinkronisasi dua arah ke Katalog Role
    const roles = getRolesCatalog();
    const updatedRoles = roles.map((role) => {
      const roleSlug = role.slug || role.id;
      const collectedSlugs = new Set();

      categories.forEach((cat) => {
        (cat.permissions || []).forEach((perm) => {
          const isAllowed = (perm.allowedRoles || []).includes(roleSlug);
          if (isAllowed) {
            collectedSlugs.add(perm.slug);
            const alias = PERMISSION_ALIASES[perm.slug];
            if (alias) collectedSlugs.add(alias);
          }
        });
      });

      return {
        ...role,
        keySlugs: Array.from(collectedSlugs),
        permissionCount: collectedSlugs.size
      };
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siloka_roles_catalog', JSON.stringify(updatedRoles));
    }
    broadcastRbacChange();
  } catch (e) {
    console.error('[RBAC] Gagal menyimpan matriks permission:', e);
  }
};

/**
 * Trigger Custom Event agar seluruh komponen di aplikasi langsung memperbarui UI seketika
 */
export const broadcastRbacChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RBAC_CHANGE_EVENT, { detail: { timestamp: Date.now() } }));
  }
};

/**
 * Resolusi Role Canonical Slug dari User Object
 */
export const resolveUserRoleSlug = (user) => {
  if (!user) return 'drafter';

  // 1. Jika pengguna sudah memiliki role_slug eksplisit
  if (user.role_slug) {
    const clean = String(user.role_slug).toLowerCase().trim();
    if (['super_admin', 'pimpinan', 'verifikator', 'admin_tu', 'drafter', 'auditor_spi'].includes(clean)) {
      return clean;
    }
  }

  // 2. Super Administrator
  if (isSuperAdminUser(user)) {
    return 'super_admin';
  }

  const roleStr = normalizeRole(user.role || user.role_key || '');
  const posLower = String(
    user.jabatan || user.roleLabel || user.role_label || user.nama_jabatan || ''
  ).toLowerCase();
  const unitLower = String(user.unit || user.nama_unit || user.unit_kerja_id || '').toLowerCase();

  // 3. Auditor / SPI
  if (
    roleStr === 'PENGAWAS' ||
    unitLower.includes('spi') ||
    posLower.includes('auditor') ||
    posLower.includes('pengawas')
  ) {
    return 'auditor_spi';
  }

  // 4. Verifikator (Atasan Hierarki / Pemeriksa Berjenjang)
  // Wakil Dekan, Ketua Jurusan (Kajur), Koordinator Prodi (Kaprodi), Kepala Bagian TU
  const isVerifikatorKeyword =
    /\b(wakil\s+dekan|wadek|ketua\s+jurusan|kajur|koordinator\s+program\s+studi|kaprodi|koorprodi|sekretaris\s+jurusan|kepala\s+bagian|kabag)\b/i.test(
      posLower
    );

  if (roleStr === 'VERIFIKATOR' || isVerifikatorKeyword) {
    return 'verifikator';
  }

  // 5. Pimpinan / Penandatangan Utama
  // Rektor, Wakil Rektor, Dekan, Direktur Pascasarjana, Ketua Lembaga, Kepala UPA/Biro
  const isPimpinanKeyword =
    /\b(rektor|wakil\s+rektor|warek|dekan|direktur|ketua\s+lppm|kepala\s+lppm|ketua\s+lpmpp|kepala\s+lpmpp|kepala\s+biro|kepala\s+upa|ketua\s+senat)\b/i.test(
      posLower
    );

  if (
    user.is_pejabat === true ||
    roleStr === 'PEJABAT' ||
    roleStr === 'PIMPINAN' ||
    isPimpinanKeyword
  ) {
    return 'pimpinan';
  }

  // 6. Administrator TU / Sekretariat / Pengendali Surat
  const isTuKeyword =
    /\b(tata\s+usaha|tu|sekretariat|persuratan|agenda|arsiparis|pengendali\s+surat|administrasi\s+tim)\b/i.test(
      posLower
    );

  if (
    roleStr === 'OPERATOR_UNIT' ||
    roleStr === 'STAF_PERSURATAN' ||
    roleStr === 'ADMIN_TU' ||
    isTuKeyword
  ) {
    return 'admin_tu';
  }

  // 7. Dosen / Staff Biasa (Konseptor / Drafter)
  return 'drafter';
};

/**
 * Menghitung Hak Akses Efektif Pengguna (Effective Permissions)
 * Menggabungkan role canonical aktif di matriks/katalog + izin khusus user
 */
export const getUserEffectivePermissions = (user) => {
  if (!user) return [];

  // Super Admin selalu memiliki semua hak akses
  if (isSuperAdminUser(user)) {
    const allSlugs = new Set();
    const matrix = getPermissionMatrix();
    matrix.forEach((cat) => {
      (cat.permissions || []).forEach((p) => {
        allSlugs.add(p.slug);
        const alias = PERMISSION_ALIASES[p.slug];
        if (alias) allSlugs.add(alias);
      });
    });
    return Array.from(allSlugs);
  }

  const roleSlug = resolveUserRoleSlug(user);
  const roles = getRolesCatalog();
  const matchedRole = roles.find((r) => (r.slug || r.id) === roleSlug);

  const permissionsSet = new Set(matchedRole?.keySlugs || []);

  // Tambahkan alias otomatis
  Array.from(permissionsSet).forEach((slug) => {
    const alias = PERMISSION_ALIASES[slug];
    if (alias) permissionsSet.add(alias);
  });

  // Tambahkan permissions array khusus jika ada di profil user
  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((p) => permissionsSet.add(p));
  }

  return Array.from(permissionsSet);
};

/**
 * Memeriksa apakah user berwenang terhadap permissionSlug tertentu
 */
export const hasUserPermission = (user, permissionSlug) => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;

  const effective = getUserEffectivePermissions(user);
  if (effective.includes(permissionSlug)) return true;

  const alias = PERMISSION_ALIASES[permissionSlug];
  if (alias && effective.includes(alias)) return true;

  return false;
};

/**
 * Hitung jumlah riil pengguna per role dari master list pengguna
 */
export const computeUserCountPerRole = (allUsers = []) => {
  const counts = {
    super_admin: 0,
    pimpinan: 0,
    verifikator: 0,
    admin_tu: 0,
    drafter: 0,
    auditor_spi: 0
  };

  allUsers.forEach((u) => {
    // Abaikan akun dummy lama
    if (
      u.id === 'usr-admin-01' ||
      u.id === 'usr-00' ||
      String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA')
    ) {
      return;
    }

    const slug = resolveUserRoleSlug(u);
    if (counts[slug] !== undefined) {
      counts[slug]++;
    } else {
      counts.drafter++;
    }
  });

  return counts;
};
