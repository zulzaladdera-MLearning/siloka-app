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
      'Wewenang administratif sistem persuratan dinas, manajemen akun dan peran, konfigurasi unit kerja, serta pemeliharaan sistem (Terkunci dari 4 aksi operasional persuratan harian).',
    permissionCount: 24,
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
      'naskah.numbering',
      'surat_keluar.numbering',
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
      'Pengelolaan loket penerimaan surat masuk, penomoran naskah otomatis, tata usaha buku agenda, dan pendistribusian ekspedisi persuratan.',
    permissionCount: 22,
    userCount: 15,
    keySlugs: [
      'admin.access',
      'dashboard.view',
      'surat_masuk.register',
      'surat_keluar.numbering',
      'naskah.numbering',
      'naskah.draft',
      'naskah.create_draft',
      'agenda.manage',
      'ekspedisi.manage',
      'arsip.view_biasa',
      'arsip.manage_jra',
      'arsip.jra_manage',
      'tembusan.send'
    ],
    remainingCount: 14
  },
  {
    id: 'pimpinan',
    slug: 'pimpinan',
    name: 'Pimpinan / Penandatangan',
    badgeType: 'Sistem',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description:
      'Wewenang pimpinan institusi untuk pengesahan naskah dinas via TTE BSrE tersertifikasi, penerbitan arahan E-Disposisi berjenjang, dan penelaahan naskah masuk.',
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
      'Pemeriksaan substansi kelayakan naskah dinas dan pembubuhan paraf hierarki level 1 & 2 sebelum dokumen diajukan ke pimpinan.',
    permissionCount: 13,
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
      'disposisi.forward',
      'disposisi.read',
      'disposisi.read_action',
      'arsip.view_biasa',
      'notula.approve'
    ],
    remainingCount: 5
  },
  {
    id: 'drafter',
    slug: 'drafter',
    name: 'Dosen / Staff Drafter',
    badgeType: 'Sistem',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description:
      'Penyusunan konsep naskah Tridharma perguruan tinggi (Surat Tugas Lembar/Kolom, Nota Dinas, Surat Keterangan, Laporan, Telaah Staf) dalam batas lingkup akademik pribadi.',
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
 * Matriks Default Permission SILOKA UNSIL (Berdasarkan Modul & Pertor No. 3/2023)
 * Diselaraskan 100% dengan Katalog Wewenang 4 Kategori (Sistem, Naskah, Disposisi, Kearsipan - Total 22 Hak Akses)
 */
export const DEFAULT_PERMISSION_MATRIX = [
  {
    id: 'sistem',
    title: 'Sistem & Administrasi',
    description: 'Pengaturan otorisasi sistem inti, hierarki unit kerja, dan pengawasan akun',
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
        allowedRoles: ['super_admin', 'pimpinan', 'verifikator', 'admin_tu', 'drafter', 'dosen_drafter', 'auditor_spi']
      },
      {
        slug: 'role.manage',
        name: 'Mengelola Peran & Hak Akses',
        description: 'Mengkonfigurasi hak akses modul dan katalog peran institusi.',
        allowedRoles: ['super_admin']
      },
      {
        slug: 'user.impersonate',
        name: 'Akses Tampilan Pengguna Lain',
        description: 'Masuk sementara sebagai pengguna lain untuk pemecahan masalah teknis.',
        allowedRoles: ['super_admin']
      },
      {
        slug: 'unit.manage',
        name: 'Pengelolaan Unit Kerja',
        description: 'Pengelolaan master data hierarki unit kerja (UN58.X).',
        allowedRoles: ['super_admin']
      },
      {
        slug: 'audit.view',
        name: 'Melihat Riwayat Perubahan Sistem',
        description: 'Melihat riwayat jejak aktivitas dan log perubahan sistem.',
        allowedRoles: ['super_admin', 'auditor_spi']
      }
    ]
  },
  {
    id: 'naskah',
    title: 'Tata Naskah Dinas & Drafting',
    description: 'Penyusunan konsep naskah dinas, verifikasi paraf hierarki, dan pengesahan TTE BSrE',
    permissions: [
      {
        slug: 'naskah.draft',
        name: 'Menyusun Konsep Surat (Draf)',
        description: 'Menyusun draf naskah dinas sesuai template standar tata persuratan UNSIL.',
        allowedRoles: ['admin_tu', 'pimpinan', 'verifikator', 'drafter', 'dosen_drafter']
      },
      {
        slug: 'naskah.create_mandiri',
        name: 'Menerbitkan Naskah Mandiri',
        description: 'Menyusun naskah Tridharma dan internal mandiri (Nota Dinas, Laporan, Telaah Staf).',
        allowedRoles: ['pimpinan', 'verifikator', 'drafter', 'dosen_drafter']
      },
      {
        slug: 'naskah.verify',
        name: 'Paraf Digital Berjenjang',
        description: 'Membubuhkan paraf digital verifikasi naskah sebelum diserahkan ke penandatangan.',
        allowedRoles: ['pimpinan', 'verifikator']
      },
      {
        slug: 'naskah.tte',
        name: 'Pengesahan Tanda Tangan TTE BSrE',
        description: 'Mengesahkan dan menandatangani naskah dinas dengan TTE tersertifikasi BSrE (Eksklusif Pejabat Struktural).',
        allowedRoles: ['pimpinan']
      },
      {
        slug: 'naskah.numbering',
        name: 'Penomoran Otomatis Naskah Keluar',
        description: 'Pemberian nomor naskah otomatis berdasarkan klasifikasi kode JRA/SKKAAD SK 2803/2023.',
        allowedRoles: ['super_admin', 'admin_tu']
      },
      {
        slug: 'draft.return_koreksi',
        name: 'Mengembalikan Draf untuk Revisi',
        description: 'Memberikan catatan telaah dan mengembalikan konsep surat kepada penyusun.',
        allowedRoles: ['pimpinan', 'verifikator']
      }
    ]
  },
  {
    id: 'surat_masuk_disposisi',
    title: 'E-Disposisi & Agenda',
    description: 'Penerimaan surat masuk loket TU, penerbitan lembar disposisi, dan tata kelola buku agenda',
    permissions: [
      {
        slug: 'surat_masuk.register',
        name: 'Registrasi Agenda Surat Masuk',
        description: 'Mencatat surat dinas masuk dari instansi luar atau unit lain pada buku register TU.',
        allowedRoles: ['admin_tu']
      },
      {
        slug: 'disposisi.create',
        name: 'Menerbitkan Arahan Disposisi',
        description: 'Menerbitkan instruksi disposisi kepada staf atau jajaran struktural (Eksklusif Pejabat Struktural).',
        allowedRoles: ['pimpinan']
      },
      {
        slug: 'disposisi.forward',
        name: 'Meneruskan Instruksi Disposisi',
        description: 'Meneruskan arahan disposisi berjenjang ke unit pelaksana bawahan (Eksklusif Pejabat Struktural).',
        allowedRoles: ['pimpinan', 'verifikator']
      },
      {
        slug: 'disposisi.read',
        name: 'Melihat & Melaksanakan Disposisi',
        description: 'Membaca lembar disposisi yang diterima dan mengunggah tindak lanjut naskah.',
        allowedRoles: ['pimpinan', 'verifikator', 'drafter', 'dosen_drafter']
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
    title: 'Kearsipan & Klasifikasi JRA/SKKAAD',
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
        name: 'Akses Surat Rahasia (R / SR)',
        description: 'Membuka dan membaca naskah berklasifikasi Rahasia (R) atau Sangat Rahasia (SR).',
        allowedRoles: ['super_admin', 'pimpinan', 'auditor_spi']
      },
      {
        slug: 'arsip.jra_manage',
        name: 'Jadwal Retensi & Pemusnahan Arsip',
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
 * 22 Hak Akses Terstandarisasi untuk Form Pengaturan Peran (Single Source of Truth Gambar 1)
 */
export const AVAILABLE_PERMISSIONS_CATALOG = DEFAULT_PERMISSION_MATRIX.map((cat) => ({
  id: cat.id,
  category: cat.title,
  items: cat.permissions.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description
  }))
}));

/**
 * Peta Sinonim / Alias Slug Permission agar kompatibel ke belakang
 */
export const PERMISSION_ALIASES = {
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
 * Pengecekan aktifitas slug dengan dukungan alias dua arah
 */
export const isSlugActive = (selectedSlugs = [], targetSlug) => {
  if (!Array.isArray(selectedSlugs) || !targetSlug) return false;
  if (selectedSlugs.includes(targetSlug)) return true;
  const alias = PERMISSION_ALIASES[targetSlug];
  return Boolean(alias && selectedSlugs.includes(alias));
};

/**
 * Toggle slug beserta aliasnya secara serentak
 */
export const toggleSlugWithAlias = (selectedSlugs = [], targetSlug) => {
  if (!Array.isArray(selectedSlugs) || !targetSlug) return [];
  const alias = PERMISSION_ALIASES[targetSlug];
  const active = selectedSlugs.includes(targetSlug) || (alias && selectedSlugs.includes(alias));
  let updated = selectedSlugs.filter((s) => s !== targetSlug && s !== alias);
  if (!active) {
    updated.push(targetSlug);
    if (alias) updated.push(alias);
  }
  return updated;
};

/**
 * Peta Nama Resmi Human-Readable untuk Hak Akses Modul SILOKA (Anti-Slop Clean Copy)
 */
export const PERMISSION_LABEL_MAP = {
  'admin.access': 'Portal Administrasi',
  'dashboard.view': 'Ringkasan Dashboard',
  'role.manage': 'Kelola Peran & Izin',
  'user.impersonate': 'Akses Pengawasan Akun',
  'unit.manage': 'Pengelolaan Unit Kerja',
  'audit.view': 'Riwayat Jejak Aktivitas',
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
 * Sanitasi Matriks Permission: Melindungi prinsip Separation of Duties SPBE.
 * Super Admin (administrator sistem murni) dikunci dari tindakan operasional kedinasan.
 */
export const sanitizePermissionMatrix = (categories) => {
  if (!Array.isArray(categories)) return DEFAULT_PERMISSION_MATRIX;

  const superAdminForbiddenSlugs = [
    'naskah.tte',
    'naskah.tte_sign',
    'naskah.verify',
    'naskah.verify_paraf',
    'draft.return_koreksi',
    'disposisi.create',
    'disposisi.forward',
    'disposisi.read',
    'surat_masuk.register',
    'naskah.draft',
    'naskah.create_draft',
    'naskah.create_mandiri'
  ];

  return categories.map((cat) => ({
    ...cat,
    permissions: (cat.permissions || []).map((perm) => {
      let allowed = Array.isArray(perm.allowedRoles) ? [...perm.allowedRoles] : [];
      if (superAdminForbiddenSlugs.includes(perm.slug)) {
        allowed = allowed.filter((r) => r !== 'super_admin');
      }
      return {
        ...perm,
        allowedRoles: allowed
      };
    })
  }));
};

/**
 * Ambil Matriks Permission Aktif dari localStorage (dengan fallback default)
 * Selalu disinkronkan dengan template master 4 Kategori & 22 Hak Akses Gambar 1
 */
export const getPermissionMatrix = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('siloka_permission_matrix');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Buat map allowedRoles dari cache berdasarkan slug
          const savedRolesMap = new Map();
          parsed.forEach((cat) => {
            (cat.permissions || []).forEach((p) => {
              if (p.slug && Array.isArray(p.allowedRoles)) {
                savedRolesMap.set(p.slug, p.allowedRoles);
                const alias = PERMISSION_ALIASES[p.slug];
                if (alias) savedRolesMap.set(alias, p.allowedRoles);
              }
            });
          });

          // Petakan ke template DEFAULT_PERMISSION_MATRIX agar 4 kategori dan 22 hak akses selalu sinkron 100%
          const merged = DEFAULT_PERMISSION_MATRIX.map((cat) => ({
            ...cat,
            permissions: cat.permissions.map((perm) => {
              const customRoles = savedRolesMap.get(perm.slug) || (PERMISSION_ALIASES[perm.slug] ? savedRolesMap.get(PERMISSION_ALIASES[perm.slug]) : null);
              return {
                ...perm,
                allowedRoles: customRoles ? customRoles : perm.allowedRoles
              };
            })
          }));

          return sanitizePermissionMatrix(merged);
        }
      }
    }
  } catch (e) {
    console.error('[RBAC] Gagal membaca siloka_permission_matrix:', e);
  }
  return sanitizePermissionMatrix(DEFAULT_PERMISSION_MATRIX);
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
          .flatMap((r) => {
            const list = [r.slug, r.id];
            if (r.slug === 'drafter' || r.id === 'drafter') list.push('dosen_drafter');
            if (r.slug === 'dosen_drafter' || r.id === 'dosen_drafter') list.push('drafter');
            return list;
          })
          .filter(Boolean);

        return {
          ...perm,
          allowedRoles: Array.from(new Set(allowedRoles))
        };
      })
    }));

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siloka_permission_matrix', JSON.stringify(sanitizePermissionMatrix(updatedMatrix)));
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
    const sanitizedCategories = sanitizePermissionMatrix(categories);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siloka_permission_matrix', JSON.stringify(sanitizedCategories));
    }

    // Sinkronisasi dua arah ke Katalog Role
    const roles = getRolesCatalog();
    const updatedRoles = roles.map((role) => {
      const roleSlug = role.slug || role.id;
      const collectedSlugs = new Set();

      sanitizedCategories.forEach((cat) => {
        (cat.permissions || []).forEach((perm) => {
          const isAllowed = (perm.allowedRoles || []).some((r) =>
            r === roleSlug ||
            r === role.id ||
            ((roleSlug === 'drafter' || role.id === 'drafter') && r === 'dosen_drafter') ||
            ((roleSlug === 'dosen_drafter' || role.id === 'dosen_drafter') && r === 'drafter')
          );
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

  const matrix = getPermissionMatrix();
  const permissionsSet = new Set();

  // Super Admin: memiliki hak akses administratif sistem sesuai izin allowedRoles di matriks
  if (isSuperAdminUser(user)) {
    matrix.forEach((cat) => {
      (cat.permissions || []).forEach((p) => {
        if (p.allowedRoles && p.allowedRoles.includes('super_admin')) {
          permissionsSet.add(p.slug);
          const alias = PERMISSION_ALIASES[p.slug];
          if (alias) permissionsSet.add(alias);
        }
      });
    });
    return Array.from(permissionsSet);
  }

  const roleSlug = resolveUserRoleSlug(user);
  const roleAliases = [roleSlug];
  if (roleSlug === 'drafter') roleAliases.push('dosen_drafter');
  if (roleSlug === 'dosen_drafter') roleAliases.push('drafter');

  matrix.forEach((cat) => {
    (cat.permissions || []).forEach((p) => {
      const isAllowed = (p.allowedRoles || []).some((r) => roleAliases.includes(r));
      if (isAllowed) {
        permissionsSet.add(p.slug);
        const alias = PERMISSION_ALIASES[p.slug];
        if (alias) permissionsSet.add(alias);
      }
    });
  });

  // Tambahkan permissions array khusus jika ada di profil user
  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((p) => {
      permissionsSet.add(p);
      const alias = PERMISSION_ALIASES[p];
      if (alias) permissionsSet.add(alias);
    });
  }

  return Array.from(permissionsSet);
};

/**
 * Memeriksa apakah user berwenang terhadap permissionSlug tertentu
 */
export const hasUserPermission = (user, permissionSlug) => {
  if (!user || !permissionSlug) return false;

  // Sesuai Regulasi Tata Naskah Dinas UNSIL & SPBE (Separation of Duties):
  // 4 Aksi operasional persuratan (TTE BSrE, Disposisi, Registrasi Masuk, Draf Naskah)
  // adalah wewenang staf pelaksana, dosen, dan pejabat struktural.
  // Super Admin (Administrator Sistem Murni) terkunci mutlak dari transaksi operasional ini.
  if (
    permissionSlug === 'naskah.tte' ||
    permissionSlug === 'naskah.tte_sign' ||
    permissionSlug === 'naskah.verify' ||
    permissionSlug === 'naskah.verify_paraf' ||
    permissionSlug === 'draft.return_koreksi' ||
    permissionSlug === 'disposisi.create' ||
    permissionSlug === 'disposisi.forward' ||
    permissionSlug === 'disposisi.read' ||
    permissionSlug === 'surat_masuk.register' ||
    permissionSlug === 'naskah.draft' ||
    permissionSlug === 'naskah.create_draft' ||
    permissionSlug === 'naskah.create_mandiri'
  ) {
    if (isSuperAdminUser(user)) return false;
  }

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
