/**
 * Authentication & Authorization Guards (SILOKA UNSIL)
 * Standardized Role-Based Access Control (RBAC) validation & canonical role normalization
 * Strictly adheres to Peraturan Rektor UNSIL No. 3/2023 & SK Rektor No. 2803/2023
 */

/**
 * Normalizes any role representation into uppercase snake_case canonical format
 * Handles: 'Super Admin' -> 'SUPER_ADMIN', 'super_admin' -> 'SUPER_ADMIN', 'Dosen (Non-Jabatan)' -> 'DOSEN_NON_JABATAN'
 */
export const normalizeRole = (role) => {
  if (!role) return '';
  return String(role)
    .trim()
    .toUpperCase()
    .replace(/[()]/g, '')
    .replace(/[\s-]+/g, '_');
};

/**
 * Deterministic Super Admin verification helper
 * Inspects:
 * 1. String role representation (e.g. 'SUPER_ADMIN', 'Super Admin', 'super_admin')
 * 2. Role aliases (role_key, role_name, roleLabel)
 * 3. Database numeric id_role === 1
 * 4. Multi-role array permissions (currentUser.roles)
 * 5. Boolean flags (currentUser.is_super_admin)
 */
export const isSuperAdminUser = (currentUser) => {
  if (!currentUser) return false;

  // 1. Direct role string normalization
  const candidateRoles = [
    currentUser.role,
    currentUser.role_key,
    currentUser.role_name,
    currentUser.roleLabel,
    currentUser.role_label,
    currentUser.jabatan
  ];

  for (const r of candidateRoles) {
    if (r) {
      const normalized = normalizeRole(r);
      if (normalized === 'SUPER_ADMIN' || normalized === 'SUPERADMIN') {
        return true;
      }
    }
  }

  // 2. Numeric id_role verification (id_role 1 is Super Admin in master_roles & tbl_roles)
  if (currentUser.id_role === 1 || currentUser.id_role === '1') {
    return true;
  }

  // 3. Multi-role array verification
  if (Array.isArray(currentUser.roles)) {
    const hasSuperAdminRole = currentUser.roles.some((r) => {
      if (typeof r === 'string') {
        const norm = normalizeRole(r);
        return norm === 'SUPER_ADMIN' || norm === 'SUPERADMIN';
      }
      if (r && typeof r === 'object') {
        const roleVal = r.name || r.key || r.role || r.code;
        const norm = normalizeRole(roleVal);
        return norm === 'SUPER_ADMIN' || norm === 'SUPERADMIN' || r.id_role === 1;
      }
      return false;
    });
    if (hasSuperAdminRole) return true;
  }

  // 4. Boolean flag in user profile/session
  if (currentUser.is_super_admin === true || currentUser.isSuperAdmin === true) {
    return true;
  }

  return false;
};

/**
 * Checks whether user has one of the allowed canonical roles
 */
export const hasCanonicalRole = (currentUser, allowedRoles = []) => {
  if (!currentUser) return false;
  if (isSuperAdminUser(currentUser)) return true; // Super Admin always bypasses role guards

  const normalizedUserRole = normalizeRole(currentUser.role || currentUser.role_key);
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

  return normalizedAllowed.includes(normalizedUserRole);
};

/**
 * Otorisasi Akses Menu & Modul "Brankas Digital Kearsipan Vital (Secure Vault)"
 *
 * Aturan Kebijakan Akses:
 * 1. TIDAK DITAMPILKAN (false) untuk:
 *    - Role Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan), misal: Dosen Informatika FT, Dosen FKIP, dll.
 *    - Role Staf Pelaksana Biasa / Operator Unit Biasa (Staf Keuangan, Staf Kepegawaian, Staf Layanan Akademik,
 *      Staf Perencanaan, Staf Kerumahtanggaan, Staf Kerja Sama, Analis Hukum, Operator Fakultas/Prodi/UPA).
 * 2. WAJIB DITAMPILKAN (true) untuk:
 *    - Super Admin SILOKA
 *    - Staf Khusus (Arsiparis Pusat / Biro / Pengendali Surat Kearsipan Pusat/Biro BKU & BAKPK)
 *    - Dosen dengan Tugas Tambahan / Pejabat Struktural:
 *      Rektor, Wakil Rektor, Dekan, Wakil Dekan, Direktur Pascasarjana,
 *      Kepala/Ketua LPPM, Kepala/Ketua LPMPP, Ketua SPI (Satuan Pengawas Internal),
 *      Ketua Senat, Ketua Dewan Penyantun, Kepala Biro (BKU/BAKPK), Kepala UPA, Kajur/Kaprodi.
 */
export const canAccessBrankasDigital = (currentUser) => {
  if (!currentUser) return false;

  // 1. Super Admin selalu memiliki akses penuh
  if (isSuperAdminUser(currentUser)) return true;

  const rawRole = normalizeRole(
    currentUser.role || currentUser.role_key || currentUser.role_name || ''
  );
  const idRoleNum = Number(currentUser.id_role);

  const combinedPosition = [
    currentUser.jabatan,
    currentUser.nama_jabatan,
    currentUser.roleLabel,
    currentUser.role_label,
    currentUser.tupoksi,
    currentUser.tupoksi_role,
    currentUser.tupoksi_label,
    currentUser.sotk_position,
    currentUser.sotk_position_label
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const unitText = [
    currentUser.unit,
    currentUser.nama_unit,
    currentUser.unit_kerja_id,
    currentUser.kode_unit
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 2. Cek apakah merupakan Staf Khusus: Arsiparis Pusat / Biro atau Pengendali Surat Kearsipan Pusat/Biro
  const isArsiparisKeyword =
    /\barsiparis\b/i.test(combinedPosition) ||
    /\bkearsipan\b/i.test(combinedPosition) ||
    /\bpengendali\s+surat\b/i.test(combinedPosition) ||
    rawRole === 'STAF_ARSIPARIS' ||
    rawRole === 'ARSIPARIS';

  const isStafPersuratanBiroPusat =
    rawRole === 'STAF_PERSURATAN' &&
    (unitText.includes('un58.5') ||
      unitText.includes('un58.6') ||
      unitText.includes('bku') ||
      unitText.includes('bakpk') ||
      unitText.includes('biro') ||
      unitText.includes('rektorat') ||
      combinedPosition.includes('bku') ||
      combinedPosition.includes('bakpk') ||
      combinedPosition.includes('biro'));

  if (isArsiparisKeyword || isStafPersuratanBiroPusat) {
    return true;
  }

  // 3. Cek apakah merupakan Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan)
  const hasStructuralPositionKeyword =
    /\b(rektor|wakil\s+rektor|warek|dekan|wakil\s+dekan|wadek|direktur|ketua\s+lppm|kepala\s+lppm|ketua\s+lpmpp|kepala\s+lpmpp|ketua\s+spi|kepala\s+spi|ketua\s+satuan\s+pengawas|ketua\s+senat|ketua\s+dewan|kepala\s+biro|kepala\s+upa|kepala\s+upt|ketua\s+jurusan|kajur|koordinator\s+program\s+studi|kaprodi|koorprodi|sekretaris\s+lppm|sekretaris\s+lpmpp|sekretaris\s+jurusan|kepala\s+bagian|kabag|kepala\s+subbagian|kasubbag)\b/i.test(
      combinedPosition
    );

  if (
    idRoleNum === 7 ||
    rawRole === 'DOSEN_NON_JABATAN' ||
    rawRole === 'DOSEN_TANPA_JABATAN' ||
    rawRole === 'DOSEN' ||
    rawRole === 'DOSEN_BIASA' ||
    combinedPosition.includes('tanpa jabatan') ||
    combinedPosition.includes('non-jabatan') ||
    combinedPosition.includes('tanpa tugas tambahan') ||
    (/\bdosen\b/i.test(combinedPosition) && !hasStructuralPositionKeyword)
  ) {
    return false;
  }

  // 4. Cek apakah merupakan Staf Pelaksana Biasa / Operator Unit Biasa (bukan Arsiparis Pusat/Biro dan bukan Pejabat Struktural)
  const isStaffOrOperatorRole =
    idRoleNum === 5 ||
    rawRole === 'OPERATOR_UNIT' ||
    rawRole === 'OPERATOR_FAKULTAS' ||
    rawRole === 'STAF_ADMINISTRASI' ||
    rawRole === 'STAFF_TU' ||
    rawRole === 'OPERATOR' ||
    rawRole === 'PELAKSANA' ||
    /^(staf|operator|analis|pengadministrasi|sekretariat|pelaksana)\b/i.test(combinedPosition.trim());

  if (isStaffOrOperatorRole && !hasStructuralPositionKeyword) {
    return false;
  }

  // 5. Cek apakah merupakan Pejabat Struktural / Dosen dengan Tugas Tambahan (Rektor, Warek, Dekan, Kepala LPPM/LPMPP, Ketua SPI, Kepala Biro, Kepala UPA, dll.)
  if (
    hasStructuralPositionKeyword ||
    idRoleNum === 2 ||
    idRoleNum === 3 ||
    idRoleNum === 4 ||
    idRoleNum === 6 ||
    rawRole === 'PEJABAT' ||
    rawRole === 'REKTOR' ||
    rawRole === 'WAREK' ||
    rawRole === 'REKTORAT' ||
    rawRole === 'PIMPINAN_UNIVERSITAS' ||
    rawRole === 'DEKAN' ||
    rawRole === 'WADEK' ||
    rawRole === 'DEKANAT' ||
    rawRole === 'PIMPINAN_UNIT' ||
    rawRole === 'KEPALA_BIRO' ||
    rawRole === 'PENGAWAS' ||
    rawRole === 'SPI' ||
    rawRole === 'SUB_UNIT_AKADEMIK' ||
    rawRole === 'KASUBBAG_KOORDINATOR'
  ) {
    return true;
  }

  return false;
};

/**
   * Deteksi Deterministik apakah pengguna adalah Dosen Regulasi / Dosen Tanpa Jabatan
   * (Tidak memegang jabatan struktural / tugas tambahan seperti Rektor, Dekan, Kajur, Kaprodi, Kepala Lembaga/Biro/SPI)
   */
export const isDosenTanpaJabatan = (currentUser) => {
  if (!currentUser) return false;
  if (isSuperAdminUser(currentUser)) return false;

  const rawRole = normalizeRole(
    currentUser.role || currentUser.role_key || currentUser.role_name || ''
  );
  const idRoleNum = Number(currentUser.id_role);

  const combinedPosition = [
    currentUser.jabatan,
    currentUser.nama_jabatan,
    currentUser.roleLabel,
    currentUser.role_label,
    currentUser.tupoksi,
    currentUser.sotk_position_label
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const hasStructuralPositionKeyword =
    /\b(rektor|wakil\s+rektor|warek|dekan|wakil\s+dekan|wadek|direktur|ketua\s+lppm|kepala\s+lppm|ketua\s+lpmpp|kepala\s+lpmpp|ketua\s+spi|kepala\s+spi|ketua\s+satuan\s+pengawas|ketua\s+senat|ketua\s+dewan|kepala\s+biro|kepala\s+upa|kepala\s+upt|ketua\s+jurusan|kajur|koordinator\s+program\s+studi|kaprodi|koorprodi|sekretaris\s+lppm|sekretaris\s+lpmpp|sekretaris\s+jurusan|kepala\s+bagian|kabag|kepala\s+subbagian|kasubbag)\b/i.test(
      combinedPosition
    );

  if (hasStructuralPositionKeyword || currentUser.is_pejabat === true) {
    return false;
  }

  return Boolean(
    idRoleNum === 7 ||
    rawRole === 'DOSEN_NON_JABATAN' ||
    rawRole === 'DOSEN_TANPA_JABATAN' ||
    rawRole === 'DOSEN' ||
    rawRole === 'DOSEN_BIASA' ||
    combinedPosition.includes('tanpa jabatan') ||
    combinedPosition.includes('non-jabatan') ||
    combinedPosition.includes('tanpa tugas tambahan') ||
    /\bdosen\b/i.test(combinedPosition)
  );
};

/**
 * Menentukan Kebijakan Akses Antrean E-Paraf & TTE (3 Entitas Pengecualian Massal vs Strict Personal Isolation)
 * Sesuai SK Rektor UNSIL No. 2803 Tahun 2023 (SKKAAD):
 * - MASS_QUEUE_SUPER_ADMIN: Super Admin (Kontrol sistem global)
 * - MASS_QUEUE_PIMPINAN: Pimpinan Unit Struktural (Rektor/Dekan/Kajur/Kepala Lembaga/Biro - Target Penandatangan Akhir TTE)
 * - MASS_QUEUE_TU_ARSIPARIS: Staf Ketatausahaan / Arsiparis TU Fakultas/Biro (Kebutuhan penomoran resmi naskah dinas)
 * - STRICT_PERSONAL_ISOLATION: Dosen Tanpa Jabatan (Hanya melihat draf miliknya sendiri: WHERE creator_id = $1)
 */
export const getQueueAccessPolicy = (currentUser) => {
  if (!currentUser) {
    return {
      mode: 'STRICT_PERSONAL_ISOLATION',
      canViewMassQueue: false,
      entityLabel: 'Pengguna Terisolasi'
    };
  }

  // 1. Pengecualian 3: Super Admin
  if (isSuperAdminUser(currentUser)) {
    return {
      mode: 'MASS_QUEUE_SUPER_ADMIN',
      canViewMassQueue: true,
      entityLabel: 'Super Admin (Kontrol Sistem Global)'
    };
  }

  // 2. Jika Dosen Tanpa Jabatan -> WAJIB Strict Personal Isolation
  if (isDosenTanpaJabatan(currentUser)) {
    return {
      mode: 'STRICT_PERSONAL_ISOLATION',
      canViewMassQueue: false,
      entityLabel: 'Dosen Tanpa Jabatan (Strict Personal Isolation - SKKAAD)'
    };
  }

  const rawRole = normalizeRole(
    currentUser.role || currentUser.role_key || currentUser.role_name || ''
  );
  const combinedPosition = [
    currentUser.jabatan,
    currentUser.nama_jabatan,
    currentUser.roleLabel,
    currentUser.role_label
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 3. Pengecualian 1: Pimpinan Unit Struktural (Rektor/Dekan/Ketua Jurusan/Kepala Lembaga/Biro)
  const isPimpinanStruktural =
    currentUser.is_pejabat === true ||
    rawRole === 'PEJABAT' ||
    rawRole === 'PIMPINAN' ||
    /\b(rektor|wakil\s+rektor|warek|dekan|wakil\s+dekan|wadek|direktur|ketua|kepala|kajur|kaprodi|koorprodi|sekretaris)\b/i.test(
      combinedPosition
    );

  if (isPimpinanStruktural) {
    return {
      mode: 'MASS_QUEUE_PIMPINAN',
      canViewMassQueue: true,
      entityLabel: 'Pimpinan Unit Struktural (Target Penandatangan Akhir / Verifikator TTE)'
    };
  }

  // 4. Pengecualian 2: Staf Ketatausahaan / Arsiparis TU Fakultas & Biro
  return {
    mode: 'MASS_QUEUE_TU_ARSIPARIS',
    canViewMassQueue: true,
    entityLabel: 'Staf Ketatausahaan / Arsiparis TU (Otorisasi Penomoran Resmi)'
  };
};

/**
 * Memeriksa apakah sebuah naskah dinas adalah milik/dibuat oleh pengguna yang sedang login
 * (atau pengguna tersebut adalah penandatangan pertama pada dokumen internal seperti NOTA_DINAS / LAPORAN)
 */
export const isLetterOwnedByUser = (letter, currentUser) => {
  if (!letter || !currentUser) return false;

  const userIdStr = String(currentUser.id_user || currentUser.id || '').trim().toLowerCase();
  const userNipStr = String(currentUser.nip_nik || currentUser.nip || '').trim().toLowerCase();
  const userEmailStr = String(currentUser.email || '').trim().toLowerCase();
  const userNameStr = String(currentUser.nama_lengkap || currentUser.nama || currentUser.name || '').trim().toLowerCase();

  const letterCreatorId = String(letter.creator_id || letter.created_by_user_id || '').trim().toLowerCase();
  const letterCreatorNip = String(letter.creator_nip || letter.nip_pembuat || '').trim().toLowerCase();
  const letterCreatorEmail = String(letter.creator_email || '').trim().toLowerCase();
  const letterCreatorName = String(letter.creator_name || letter.created_by_name || '').trim().toLowerCase();

  // 1. Cek kecocokan eksplisit creator_id / created_by_user_id / creator_email / creator_nip
  if (userIdStr && letterCreatorId && userIdStr === letterCreatorId) return true;
  if (userNipStr && letterCreatorNip && userNipStr === letterCreatorNip) return true;
  if (userEmailStr && letterCreatorEmail && userEmailStr === letterCreatorEmail) return true;
  if (userNameStr && letterCreatorName && userNameStr === letterCreatorName) return true;

  // Jika surat memiliki creator_email atau creator_nip milik dosen lain yang berbeda, langsung tolak!
  if (letterCreatorEmail && userEmailStr && letterCreatorEmail !== userEmailStr) return false;
  if (letterCreatorNip && userNipStr && letterCreatorNip !== userNipStr) return false;
  if (letterCreatorName && userNameStr && letterCreatorName !== userNameStr) return false;

  // 2. Cek apakah nama lengkap dosen tercantum sebagai Pengirim / Pembuat / Penandatangan Pertama
  if (userNameStr && userNameStr.length > 3) {
    const pengirimLower = String(letter.pengirim || '').trim().toLowerCase();
    const firstParafName = String(letter.riwayatParaf?.[0]?.nama || '').trim().toLowerCase();
    if (pengirimLower.includes(userNameStr) || firstParafName === userNameStr) {
      return true;
    }
  }

  return false;
};

/**
 * Memeriksa apakah naskah merupakan Kategori Mandiri yang dapat ditandatangani (TTE) langsung oleh Dosen Pembuatnya
 * (Nota Dinas, Laporan, Telaah Staf, Surat Pernyataan, Notula, Berita Acara)
 */
export const isMandiriPersonalDocument = (letter) => {
  if (!letter) return false;
  const checkStr = [
    letter.jenis_naskah,
    letter.kode_jenis_naskah,
    letter.templateId,
    letter.kategori,
    letter.perihal
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  return (
    checkStr.includes('NOTA_DINAS') ||
    checkStr.includes('NOTA DINAS') ||
    checkStr.includes('LAPORAN') ||
    checkStr.includes('TELAAH_STAF') ||
    checkStr.includes('TELAAH STAF') ||
    checkStr.includes('SURAT_PERNYATAAN') ||
    checkStr.includes('SURAT PERNYATAAN') ||
    checkStr.includes('NOTULA') ||
    checkStr.includes('BERITA_ACARA') ||
    checkStr.includes('BERITA ACARA')
  );
};



