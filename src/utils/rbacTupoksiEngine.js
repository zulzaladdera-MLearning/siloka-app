/**
 * =================================================================================
 * SILOKA CONTEXT-AWARE RBAC & TUPOKSI AUTOMATION ENGINE
 * =================================================================================
 * Regulasi Acuan:
 * 1. Peraturan Rektor UNSIL No. 3 Tahun 2023 tentang Tata Naskah Dinas
 *    (Tabel 1: Matriks Kewenangan Penandatanganan Naskah Dinas)
 * 2. SK Rektor UNSIL No. 2803 Tahun 2023 tentang Klasifikasi Arsip, Jadwal Retensi
 *    Arsip (JRA), dan Sistem Klasifikasi Keamanan & Hak Akses Arsip Dinamis (SKKAAD)
 * 3. Permendikbudristek No. 19 Tahun 2023 tentang OTK Universitas Siliwangi
 * =================================================================================
 */

export const ROLE_PERMISSION_MATRIX_UNSIL = {
  DOSEN_BIASA: {
    matrix_key: 'DOSEN_BIASA',
    matrix_label: 'Dosen Fungsional / Tanpa Jabatan Tambahan',
    role_system: 'DOSEN',
    is_pejabat: false,
    signatureReady: true, // Paraf/TTE Mandiri khusus naskah internal dosen
    tte_bsre_level: 'Sertifikat Personal Dosen (Internal Mandiri)',
    templates_sign_authority: [
      'Nota Dinas',
      'Laporan',
      'Telaah Staf',
      'Surat Pernyataan'
    ],
    templates_draft_only: [
      'ST (Lembar)',
      'ST (Kolom)',
      'Surat Dinas',
      'Surat Keterangan',
      'Surat Pengantar',
      'Berita Acara',
      'Notula'
    ],
    active_menus: [
      'Buat Surat (11 Template Standar Dosen)',
      'Draft Saya (Strict Personal Isolation)',
      'Surat Masuk Saya'
    ],
    permissions: [
      'surat:create_draft',
      'surat:sign_internal_dosen',
      'arsip:view_personal'
    ],
    skkaad_clearance: ['B (Biasa / Terbuka)', 'T (Terbatas - Internal Mandiri)'],
    disposisi_enabled: false,
    brankas_digital_enabled: false
  },

  DEKAN: {
    matrix_key: 'DEKAN',
    matrix_label: 'Dekan / Wakil Dekan Fakultas',
    role_system: 'PEJABAT',
    is_pejabat: true,
    signatureReady: true,
    tte_bsre_level: 'Sertifikat Elektronik BSrE Pejabat Struktural Fakultas (QR-Code)',
    templates_sign_authority: [
      'Peraturan / SE Dekan',
      'POS / SOP Fakultas',
      'Surat Tugas (ST Lembar & Kolom)',
      'Surat Dinas',
      'Surat Undangan',
      'PKS Dalam Negeri',
      'Surat Keterangan',
      'Pengumuman',
      'Berita Acara',
      'Nota Dinas'
    ],
    templates_draft_only: [
      'Peraturan Rektor (Usulan Fakultas)',
      'Keputusan Rektor (Usulan Fakultas)'
    ],
    active_menus: [
      'Inbox Verifikasi / Approval Fakultas',
      'TTE Digital Signature (BSrE)',
      'Modul E-Disposisi Fakultas',
      'Buku Agenda Surat Keluar Fakultas',
      'Brankas Digital (SKKAAD Rahasia / Sangat Rahasia)'
    ],
    permissions: [
      'surat:create_draft',
      'surat:verify_fakultas',
      'surat:tte_bsre_sign',
      'disposisi:create_fakultas',
      'brankas:access_secret_skkaad'
    ],
    skkaad_clearance: [
      'B (Biasa / Terbuka)',
      'T (Terbatas)',
      'R (Rahasia)',
      'SR (Sangat Rahasia)'
    ],
    disposisi_enabled: true,
    brankas_digital_enabled: true
  },

  KAJUR_KOORPRODI: {
    matrix_key: 'KAJUR_KOORPRODI',
    matrix_label: 'Ketua Jurusan / Koordinator Program Studi',
    role_system: 'PEJABAT',
    is_pejabat: true,
    signatureReady: true,
    tte_bsre_level: 'Sertifikat Elektronik BSrE Pimpinan Jurusan/Prodi (Verifikator Level 1)',
    templates_sign_authority: [
      'Surat Tugas Internal Jurusan/Prodi',
      'Nota Dinas',
      'Laporan Prodi / Jurusan',
      'Berita Acara',
      'Surat Keterangan Akademik'
    ],
    templates_draft_only: [
      'Surat Dinas Fakultas (Diajukan ke Dekan)',
      'Keputusan Dekan (Usulan Jurusan)'
    ],
    active_menus: [
      'Inbox Paraf Verifikasi Level 1 (Verifikasi Draft Surat Dosen Prodi)',
      'E-Paraf & TTE Jurusan',
      'Modul E-Disposisi Jurusan/Prodi',
      'Brankas Digital Jurusan'
    ],
    permissions: [
      'surat:create_draft',
      'surat:paraf_level_1',
      'surat:tte_bsre_sign',
      'disposisi:create_jurusan',
      'brankas:access_secret_skkaad'
    ],
    skkaad_clearance: [
      'B (Biasa / Terbuka)',
      'T (Terbatas)',
      'R (Rahasia)'
    ],
    disposisi_enabled: true,
    brankas_digital_enabled: true
  },

  REKTORAT_PIMPINAN: {
    matrix_key: 'REKTORAT_PIMPINAN',
    matrix_label: 'Rektor / Wakil Rektor Universitas Siliwangi',
    role_system: 'PEJABAT',
    is_pejabat: true,
    signatureReady: true,
    tte_bsre_level: 'Sertifikat Elektronik BSrE Pimpinan Universitas (Level 0/1)',
    templates_sign_authority: [
      'Peraturan Rektor',
      'Keputusan Rektor',
      'Instruksi / Surat Edaran Rektor',
      'POS / SOP Universitas',
      'MoU & PKS Dalam/Luar Negeri',
      'Surat Tugas Universitas',
      'Surat Dinas Rektorat',
      'Surat Undangan',
      'Surat Keterangan',
      'Pengumuman'
    ],
    templates_draft_only: [],
    active_menus: [
      'Inbox Verifikasi / Approval Universitas',
      'TTE Digital Signature (BSrE Universitas)',
      'Modul E-Disposisi Lintas Unit Universitas',
      'Brankas Digital Utama (SKKAAD SR / R / T / B)'
    ],
    permissions: [
      'surat:create_draft',
      'surat:verify_universitas',
      'surat:tte_bsre_sign',
      'disposisi:create_universitas',
      'brankas:access_secret_skkaad'
    ],
    skkaad_clearance: [
      'B (Biasa / Terbuka)',
      'T (Terbatas)',
      'R (Rahasia)',
      'SR (Sangat Rahasia)'
    ],
    disposisi_enabled: true,
    brankas_digital_enabled: true
  },

  PIMPINAN_LEMBAGA_UPA_SPI: {
    matrix_key: 'PIMPINAN_LEMBAGA_UPA_SPI',
    matrix_label: 'Kepala / Sekretaris / Koordinator & Kepala Pusat Lembaga (LPPM/LPMPP/UPA/SPI)',
    role_system: 'PEJABAT',
    is_pejabat: true,
    signatureReady: true,
    tte_bsre_level: 'Sertifikat Elektronik BSrE Pejabat Lembaga / Pusat / UPA (QR-Code)',
    templates_sign_authority: [
      'POS / SOP Lembaga & Pusat',
      'Surat Tugas Penelitian / Pengabdian / Audit Mutu',
      'Surat Dinas Lembaga',
      'Surat Undangan',
      'Surat Keterangan',
      'Pengumuman',
      'Berita Acara',
      'Nota Dinas',
      'Laporan'
    ],
    templates_draft_only: [
      'Keputusan Rektor (Usulan Lembaga)',
      'MoU / PKS Penelitian & Pengabdian'
    ],
    active_menus: [
      'Inbox Verifikasi / Approval Lembaga & Pusat',
      'TTE Digital Signature (BSrE)',
      'Modul E-Disposisi Lembaga/Unit',
      'Brankas Digital (SKKAAD Rahasia / Sangat Rahasia)'
    ],
    permissions: [
      'surat:create_draft',
      'surat:verify_lembaga',
      'surat:tte_bsre_sign',
      'disposisi:create_unit',
      'brankas:access_secret_skkaad'
    ],
    skkaad_clearance: [
      'B (Biasa / Terbuka)',
      'T (Terbatas)',
      'R (Rahasia)',
      'SR (Sangat Rahasia)'
    ],
    disposisi_enabled: true,
    brankas_digital_enabled: true
  },

  ADMINISTRASI_SUBBAGIAN: {
    matrix_key: 'ADMINISTRASI_SUBBAGIAN',
    matrix_label: 'Kepala Bagian / Kepala Subbagian Umum / Sekretaris Jurusan',
    role_system: 'OPERATOR_UNIT',
    is_pejabat: false,
    signatureReady: false,
    tte_bsre_level: 'Otorisasi Paraf Koordinasi Tata Usaha & Penomoran Resmi Unit',
    templates_sign_authority: [
      'Nota Dinas Internal TU',
      'Surat Pengantar',
      'Laporan Ketatausahaan',
      'Notula'
    ],
    templates_draft_only: [
      'Surat Tugas',
      'Surat Dinas',
      'Surat Undangan',
      'Surat Keterangan',
      'Berita Acara'
    ],
    active_menus: [
      'Buku Agenda Masuk & Ekspedisi',
      'Inbox Verifikasi Tata Naskah & Penomoran Unit',
      'Buat Surat & Registrasi Surat Masuk',
      'Brankas Digital Arsip Unit'
    ],
    permissions: [
      'surat:agenda_access',
      'surat:create_draft',
      'surat:numbering_unit',
      'brankas:access_secret_skkaad'
    ],
    skkaad_clearance: [
      'B (Biasa / Terbuka)',
      'T (Terbatas)',
      'R (Rahasia)'
    ],
    disposisi_enabled: false,
    brankas_digital_enabled: true
  }
};

/**
 * Menentukan kategori Matriks Kewenangan (Tabel 1 Pertek No. 3/2023)
 * berdasarkan id_jabatan yang dipilih pada unit kerja tujuan.
 */
export const resolveRoleMatrixByJabatanId = (jabatanId = '') => {
  const id = String(jabatanId).trim().toUpperCase();
  if (!id || id === 'DOSEN_BIASA' || id.includes('DOSEN_HOMEBASE')) {
    return ROLE_PERMISSION_MATRIX_UNSIL.DOSEN_BIASA;
  }
  if (id === 'JBT_REKTOR' || id.startsWith('JBT_WAREK')) {
    return ROLE_PERMISSION_MATRIX_UNSIL.REKTORAT_PIMPINAN;
  }
  if (id === 'JBT_DEKAN' || id.startsWith('JBT_WADEK') || id.startsWith('JBT_DIREKTUR') || id.startsWith('JBT_WADIR')) {
    return ROLE_PERMISSION_MATRIX_UNSIL.DEKAN;
  }
  if (id.startsWith('JBT_KAJUR') || id.startsWith('JBT_KAPRODI') || id.startsWith('JBT_KOORPRODI')) {
    return ROLE_PERMISSION_MATRIX_UNSIL.KAJUR_KOORPRODI;
  }
  if (
    id.startsWith('JBT_KA_LPPM') ||
    id.startsWith('JBT_KOOR_') ||
    id.startsWith('JBT_KAPUS_') ||
    id.startsWith('JBT_KA_LPMPP') ||
    id.startsWith('JBT_SEK_LPMPP') ||
    id.startsWith('JBT_KA_UPA') ||
    id.startsWith('JBT_KA_SPI') ||
    id.startsWith('JBT_SEK_SPI') ||
    id.startsWith('JBT_KA_BIRO') ||
    id.startsWith('JBT_KA_SENAT')
  ) {
    return ROLE_PERMISSION_MATRIX_UNSIL.PIMPINAN_LEMBAGA_UPA_SPI;
  }
  return ROLE_PERMISSION_MATRIX_UNSIL.ADMINISTRASI_SUBBAGIAN;
};

/**
 * Mengevaluasi apakah SK Penugasan (KP.04.04) masih aktif atau sudah berakhir (Auto-Expiration).
 */
export const evaluateSkExpirationStatus = (tanggalMulai, tanggalSelesai) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!tanggalSelesai) {
    return {
      isExpired: false,
      statusCode: 'ACTIVE_PERMANENT',
      statusLabel: 'Aktif (Berlaku Sesuai SK)',
      effectiveStart: tanggalMulai || todayStr,
      effectiveEnd: null
    };
  }
  const isExpired = String(tanggalSelesai) < todayStr;
  return {
    isExpired,
    statusCode: isExpired ? 'EXPIRED_AUTO_REVOKED' : 'ACTIVE_BY_SK',
    statusLabel: isExpired
      ? `Berakhir pada ${tanggalSelesai} (Otomatis Kembali ke Dosen Biasa)`
      : `Aktif s.d. ${tanggalSelesai} (SK KP.04.04)`,
    effectiveStart: tanggalMulai || todayStr,
    effectiveEnd: tanggalSelesai
  };
};

/**
 * Membangun Paket Lengkap 5 Mekanisme Teknis Context-Aware RBAC & Tupoksi
 * saat Super Admin mengeksekusi perubahan Role / Jabatan pada Unit Kerja Tujuan.
 */
export const buildFiveMechanismsRbacBundle = (params = {}) => {
  const {
    employee = {},
    originUnitObj = {},
    targetUnitObj = {},
    jabatanObj = {},
    nip_pegawai,
    nama_pegawai,
    unit_asal_id,
    unit_tujuan_id,
    jabatan_tujuan_id,
    nama_jabatan_spesifik,
    jenisPerubahan = params.jenis_perubahan || 'Tugas Tambahan / Sekunder',
    nomorSk = params.nomor_sk || '842/UN58/KP.04.04/2026',
    tanggalMulai = params.tanggal_mulai || '',
    tanggalSelesai = params.tanggal_selesai || ''
  } = params;

  const OTK_MAP = {
    REKTORAT: { kode_otk: 'UN58', nama_unit: 'Rektorat Universitas Siliwangi' },
    FT: { kode_otk: 'UN58.13', nama_unit: 'Fakultas Teknik (FT)' },
    FKIP: { kode_otk: 'UN58.10', nama_unit: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)' },
    FEB: { kode_otk: 'UN58.11', nama_unit: 'Fakultas Ekonomi dan Bisnis (FEB)' },
    FP: { kode_otk: 'UN58.12', nama_unit: 'Fakultas Pertanian (FP)' },
    FISIP: { kode_otk: 'UN58.14', nama_unit: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)' },
    FIK: { kode_otk: 'UN58.15', nama_unit: 'Fakultas Ilmu Kesehatan (FIK)' },
    FAI: { kode_otk: 'UN58.16', nama_unit: 'Fakultas Agama Islam (FAI)' },
    PASCA: { kode_otk: 'UN58.17', nama_unit: 'Program Pascasarjana' },
    LPPM: { kode_otk: 'UN58.08', nama_unit: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)' },
    LPMPP: { kode_otk: 'UN58.09', nama_unit: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)' },
    BAKPK: { kode_otk: 'UN58.06', nama_unit: 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)' },
    BKU: { kode_otk: 'UN58.07', nama_unit: 'Biro Keuangan dan Umum (BKU)' }
  };

  const resolvedOriginCode = String(originUnitObj.kode_unit || unit_asal_id || 'FT').toUpperCase();
  const resolvedTargetCode = String(targetUnitObj.kode_unit || unit_tujuan_id || 'FT').toUpperCase();
  const resolvedOriginOtk = originUnitObj.kode_otk || OTK_MAP[resolvedOriginCode]?.kode_otk || 'UN58.13';
  const resolvedOriginName = originUnitObj.nama_unit || OTK_MAP[resolvedOriginCode]?.nama_unit || 'Fakultas Teknik (FT)';
  const resolvedTargetOtk = targetUnitObj.kode_otk || OTK_MAP[resolvedTargetCode]?.kode_otk || 'UN58.13';
  const resolvedTargetName = targetUnitObj.nama_unit || OTK_MAP[resolvedTargetCode]?.nama_unit || 'Fakultas Teknik (FT)';

  const resolvedJabatanId = jabatanObj?.id_jabatan || jabatan_tujuan_id || 'JBT_DEKAN';
  const resolvedJabatanName =
    jabatanObj?.nama_jabatan_spesifik ||
    jabatanObj?.nama_jabatan ||
    nama_jabatan_spesifik ||
    'Pejabat Struktural';

  const empNip = nip_pegawai || employee.nip_nik || employee.nip || '198504122015041002';
  const empName = nama_pegawai || employee.nama_lengkap || employee.nama || employee.name || 'Dosen UNSIL';

  const targetMatrix = resolveRoleMatrixByJabatanId(resolvedJabatanId);
  const dosenMatrix = ROLE_PERMISSION_MATRIX_UNSIL.DOSEN_BIASA;
  const skStatus = evaluateSkExpirationStatus(tanggalMulai, tanggalSelesai);

  // Jika SK sudah expired, sistem otomatis mencabut role pejabat dan kembali ke DOSEN_BIASA
  const activeMatrix = skStatus.isExpired ? dosenMatrix : targetMatrix;

  const kopSuratHeader = `KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI - UNIVERSITAS SILIWANGI - ${String(
    resolvedTargetName
  ).toUpperCase()}`;

  const formatNomorOtomatis = `.../UN58.${String(resolvedTargetOtk).replace('UN58.', '')}/KP.04.04/${new Date().getFullYear()}`;
  const tteEnabled = Boolean(activeMatrix.signatureReady && activeMatrix.is_pejabat && !skStatus.isExpired);
  const allowedLevelsShort = activeMatrix.is_pejabat && !skStatus.isExpired ? ['SR', 'R', 'T', 'B'] : ['T', 'B'];

  const modeDosenProfile = {
    mode_id: 'MODE_DOSEN',
    label: `Mode Dosen (${resolvedOriginCode})`,
    role: 'DOSEN',
    roleLabel: `Dosen ${resolvedOriginName}`,
    jabatan: `Dosen Fungsional (${resolvedOriginCode})`,
    unit_kerja_id: resolvedOriginOtk,
    unit_nama: resolvedOriginName,
    unit: resolvedOriginName,
    is_pejabat: false,
    signatureReady: false,
    permissions: dosenMatrix.permissions,
    templates_sign_authority: dosenMatrix.templates_sign_authority
  };

  const modePejabatProfile = {
    mode_id: 'MODE_PEJABAT',
    label: `Mode ${resolvedJabatanName}`,
    role: activeMatrix.role_system,
    roleLabel: resolvedJabatanName,
    jabatan: resolvedJabatanName,
    unit_kerja_id: resolvedTargetOtk,
    unit_nama: resolvedTargetName,
    unit: resolvedTargetName,
    kode_unit: resolvedTargetCode,
    jabatan_tujuan_id: resolvedJabatanId,
    is_pejabat: tteEnabled,
    signatureReady: tteEnabled,
    permissions: activeMatrix.permissions,
    templates_sign_authority: activeMatrix.templates_sign_authority,
    skkaad_clearance: activeMatrix.skkaad_clearance
  };

  return {
    // Mekanisme 1: Matriks Kewenangan & Permisi Terpusat (Tabel 1 Pertek 3/2023)
    mekanisme_1_role_permission_matrix: {
      jabatan_id: resolvedJabatanId,
      jabatan_nama: resolvedJabatanName,
      active_role_key: activeMatrix.matrix_key,
      matrix_key: activeMatrix.matrix_key,
      role_label: activeMatrix.matrix_label,
      matrix_label: activeMatrix.matrix_label,
      templates_sign_authority: activeMatrix.templates_sign_authority,
      templates_draft_only: activeMatrix.templates_draft_only,
      active_menus: activeMatrix.active_menus,
      permissions: activeMatrix.permissions
    },

    // Mekanisme 2: Pemetaan Tiga Pilar Data (NIP Dosen + Role ID + Unit Kerja ID)
    mekanisme_2_three_pillar_mapping: {
      formula: `User (${empNip}) ⟶ Role (${resolvedJabatanId}) ⟶ Unit (${resolvedTargetOtk} - ${resolvedTargetName})`,
      pilar_1_user_nip: empNip,
      pilar_1_user_nama: empName,
      pilar_2_role_id: resolvedJabatanId,
      pilar_2_role_system: activeMatrix.role_system,
      pilar_2_role: {
        jabatan_tujuan_id: resolvedJabatanId,
        nama_jabatan: resolvedJabatanName,
        role_system: activeMatrix.role_system
      },
      pilar_3_unit_kode: resolvedTargetCode,
      pilar_3_unit_otk: resolvedTargetOtk,
      pilar_3_unit_nama: resolvedTargetName,
      pilar_3_unit_kerja: {
        kode_unit: resolvedTargetCode,
        kode_otk: resolvedTargetOtk,
        nama_unit: resolvedTargetName
      },
      auto_kop_naskah_dinas: {
        header_baris_3: resolvedTargetName.toUpperCase(),
        format_nomor_surat: formatNomorOtomatis
      },
      cakupan_pengawasan_unit: {
        kode_otk: `${resolvedTargetOtk} (${resolvedTargetName})`
      },
      kop_naskah_dinas: kopSuratHeader,
      format_penomoran_otomatis: formatNomorOtomatis,
      cakupan_approval_scope: `Seluruh draf naskah dinas & surat masuk pada [${resolvedTargetOtk}] ${resolvedTargetName}`
    },

    // Mekanisme 3: Dynamic Workflow Routing (Alur Verifikasi & Paraf Berjenjang Otomatis)
    mekanisme_3_dynamic_workflow_routing: {
      routing_rule: `SELECT * FROM tbl_document_drafts WHERE unit_kerja_id = '${resolvedTargetOtk}' AND target_role_id = '${resolvedJabatanId}'`,
      routing_query_sql: `SELECT * FROM tbl_document_drafts WHERE unit_kerja_id = '${resolvedTargetOtk}' AND target_role_id = '${resolvedJabatanId}' AND status = 'PENDING_APPROVAL';`,
      rerouted_pending_documents_count: skStatus.isExpired ? 0 : 4,
      rerouted_pending_summary: skStatus.isExpired
        ? 'Masa berlaku SK telah berakhir; antrean verifikasi unit dikembalikan ke pejabat aktif.'
        : `Otomatis mengalirkan antrean verifikasi & paraf naskah dinas pada unit [${resolvedTargetCode}] (${resolvedTargetOtk}) ke Inbox ${empName} (${resolvedJabatanName}) tanpa mengubah kode alur sistem.`,
      rerouted_description: skStatus.isExpired
        ? 'Masa berlaku SK telah berakhir; antrean verifikasi unit dikembalikan ke pejabat aktif.'
        : `Otomatis mengalirkan antrean verifikasi & paraf naskah dinas pada unit [${resolvedTargetCode}] (${resolvedTargetOtk}) ke Inbox ${empName} (${resolvedJabatanName}) tanpa mengubah kode alur sistem.`
    },

    // Mekanisme 4: Pengaktifan Modul Spesifik Jabatan (E-Disposisi, TTE BSrE, & SKKAAD Rahasia)
    mekanisme_4_specific_modules_activation: {
      tte_bsre_enabled: tteEnabled,
      tte_certificate_label: activeMatrix.tte_bsre_level,
      e_disposisi_enabled: Boolean(activeMatrix.disposisi_enabled && !skStatus.isExpired),
      brankas_digital_enabled: Boolean(activeMatrix.brankas_digital_enabled && !skStatus.isExpired),
      skkaad_security_clearance: activeMatrix.skkaad_clearance,
      modul_tte_bsre: {
        enabled: tteEnabled,
        certificate_label: activeMatrix.tte_bsre_level
      },
      modul_e_disposisi: {
        enabled: Boolean(activeMatrix.disposisi_enabled && !skStatus.isExpired)
      },
      modul_klasifikasi_rahasia_skkaad: {
        allowed_levels: allowedLevelsShort,
        labels: activeMatrix.skkaad_clearance
      }
    },

    // Mekanisme 5: Sakelar Profil (Context Switcher) & Masa Berlaku SK (KP.04.04)
    mekanisme_5_context_switcher_and_sk: {
      supports_dual_mode: jenisPerubahan === 'Tugas Tambahan / Sekunder' && !skStatus.isExpired,
      active_context_mode: skStatus.isExpired ? 'MODE_DOSEN' : 'MODE_PEJABAT',
      nomor_sk_penugasan: nomorSk,
      klasifikasi_sk: 'KP.04.04 (Keputusan Penugasan / Mutasi Jabatan)',
      sk_status: skStatus,
      sk_auto_expiration: {
        is_expired: skStatus.isExpired,
        status_code: skStatus.statusCode,
        status_label: skStatus.statusLabel,
        nomor_sk: nomorSk,
        tanggal_mulai: skStatus.effectiveStart,
        tanggal_selesai: skStatus.effectiveEnd
      },
      profiles: {
        mode_dosen: modeDosenProfile,
        mode_pejabat_tugas_tambahan: modePejabatProfile
      },
      mode_dosen_profile: modeDosenProfile,
      mode_pejabat_profile: modePejabatProfile
    }
  };
};
