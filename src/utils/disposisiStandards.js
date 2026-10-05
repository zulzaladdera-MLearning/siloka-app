import { isSuperAdminUser } from './authGuards.js';

/**
 * Standar Format Disposisi Resmi Universitas Siliwangi (UNSIL)
 * Mengacu pada Lampiran Contoh 21 (Format Disposisi Resmi) & Tata Kelola OTK UNSIL
 * Serta Matriks Kewenangan Penandatanganan & Disposisi Naskah Dinas
 */

/**
 * Nomenklatur Struktural Resmi Biro Keuangan dan Umum (BKU)
 * Universitas Siliwangi (OTK UNSIL)
 */
export const BKU_STRUCTURAL_TEAMS = [
  {
    id: 'kbg_umum',
    nama: 'Kepala Bagian Umum',
    deskripsi: 'Koordinasi umum, tata usaha pimpinan, dan administrasi BKU',
    badge: 'Bagian'
  },
  {
    id: 'tim_keuangan',
    nama: 'Ketua Tim Bidang Keuangan',
    deskripsi: 'Perbendaharaan, pembukuan, realisasi DIPA, dan SPJ keuangan',
    badge: 'Tim Bidang'
  },
  {
    id: 'tim_kepegawaian',
    nama: 'Ketua Tim Bidang Kepegawaian',
    deskripsi: 'Layanan kepegawaian, kenaikan pangkat, dan mutasi ASN/PPPK',
    badge: 'Tim Bidang'
  },
  {
    id: 'tim_kerumahtanggan_bmn',
    nama: 'Ketua Tim Kerumahtanggan dan BMN',
    deskripsi: 'Pengelolaan aset BMN, sarana prasarana, logistik, dan pemeliharaan',
    badge: 'Tim Bidang'
  },
  {
    id: 'tim_keprotokolan_humas',
    nama: 'Ketua Tim Keprotokolan dan Humas',
    deskripsi: 'Keprotokolan pimpinan, humas publikasi, dan dokumentasi dinas',
    badge: 'Tim Bidang'
  }
];

/**
 * Checklist Kolom Kiri - Format Disposisi Resmi UNSIL ("Untuk :")
 * Berdasarkan Lampiran Contoh 21 Peraturan Rektor No. 3/2023
 */
export const OFFICIAL_DISPOSISI_CHECKLIST_COL1 = [
  { id: 'ikuti_disposisi_rektor', label: 'Ikuti Disposisi Rektor' },
  { id: 'proses_sesuai_prosedur', label: 'Proses sesuai prosedur' },
  { id: 'selesaikan', label: 'Selesaikan' },
  { id: 'tanggapan_saran_tertulis', label: 'Tanggapan/saran tertulis)*' },
  { id: 'pelajari', label: 'Pelajari' },
  { id: 'untuk_pertimbangan', label: 'Untuk pertimbangan' },
  { id: 'perbaiki', label: 'Perbaiki' },
  { id: 'siapkan_konsep_bahan', label: 'Siapkan dan buatkan konsep/bahan)*' },
  { id: 'buatkan_undangan', label: 'Buatkan undangan' },
  { id: 'untuk_digunakan_ditindaklanjuti', label: 'Untuk digunakan/ditindaklanjuti)*' },
  { id: 'tangani_bersama', label: 'Tangani bersama' },
  { id: 'hadiri_wakili', label: 'Hadiri/wakili)*' }
];

/**
 * Checklist Kolom Kanan - Format Disposisi Resmi UNSIL ("Untuk :")
 * Berdasarkan Lampiran Contoh 21 Peraturan Rektor No. 3/2023
 */
export const OFFICIAL_DISPOSISI_CHECKLIST_COL2 = [
  { id: 'untuk_diketahui_perhatikan', label: 'Untuk diketahui/perhatikan)*' },
  { id: 'check_status_perkembangan', label: 'Check status/perkembangan)*' },
  { id: 'laporkan', label: 'Laporkan' },
  { id: 'dibantu', label: 'Dibantu' },
  { id: 'dapat_disetujui', label: 'Dapat disetujui' },
  { id: 'temui_saya', label: 'Temui saya' },
  { id: 'adakan_rapat', label: 'Adakan rapat' },
  { id: 'koordinasikan_dengan', label: 'Koordinasikan dengan...', hasInput: true, placeholder: 'Sebutkan pihak / unit kerja koordinasi' },
  { id: 'jadwalkan_ingatkan', label: 'Jadwalkan/ingatkan)*' },
  { id: 'kirimkan_segera', label: 'Kirimkan segera' },
  { id: 'fotokopi_arsipkan', label: 'Fotokopi/arsipkan)*' },
  { id: 'lainnya', label: 'Lainnya / Catatan Khusus', hasInput: true, placeholder: 'Instruksi tambahan...' }
];

/**
 * Daftar Instruksi Tindak Lanjut Resmi ("Untuk :")
 * Sesuai Format Disposisi Resmi UNSIL (Lampiran Contoh 21)
 * Memuat seluruh butir resmi untuk kompatibilitas dan verifikasi sistem.
 */
export const OFFICIAL_UNSIL_INSTRUCTIONS = [
  'Ikuti Disposisi Rektor',
  'Proses sesuai prosedur',
  'Selesaikan',
  'Tanggapan/saran tertulis',
  'Pelajari',
  'Untuk pertimbangan',
  'Perbaiki',
  'Siapkan dan buatkan konsep/bahan',
  'Buatkan undangan',
  'Untuk digunakan/ditindaklanjuti',
  'Tangani bersama',
  'Hadiri/wakili',
  'Untuk diketahui/perhatikan',
  'Check status/perkembangan',
  'Laporkan',
  'Dibantu',
  'Dapat disetujui',
  'Temui saya',
  'Adakan rapat',
  'Koordinasikan dengan...',
  'Jadwalkan/ingatkan',
  'Kirimkan segera',
  'Fotokopi/arsipkan'
];

/**
 * Batas Waktu Penyelesaian Disposisi (SLA) Resmi UNSIL
 * Sesuai Peraturan Rektor No. 3 Tahun 2023 (Derajat Kecepatan Penyampaian & Tindak Lanjut):
 * - Sangat Segera: Hari yang sama / seketika (Maks. 24 Jam)
 * - Segera: Maks. 2x24 Jam (2 Hari Kerja)
 * - Biasa: Maks. 5 Hari Kerja
 */
export const DISPOSISI_SLA_DAYS = {
  'Sangat Segera': 1,
  'Segera': 2,
  'Biasa': 5,
  'Rahasia': 3
};

/**
 * Pola Regex Resmi Jabatan yang Berwenang Menerbitkan Disposisi
 * Wajib saling berintegrasi antara Manajemen User & Manajemen Role:
 * 1. Pimpinan Universitas:
 *    - Rektor, Wakil Rektor I (Akademik), Wakil Rektor II (Umum & Keuangan), Wakil Rektor III (Kemahasiswaan & Alumni), Warek
 * 2. Fakultas & Pascasarjana:
 *    - Dekan, Wakil Dekan, Direktur Pascasarjana, Wakil Direktur Pascasarjana, Ketua Jurusan (Kajur), Koordinator Program Studi (Kaprodi / Koorprodi)
 * 3. Biro & Bagian:
 *    - Kepala Biro (Kepala BAKPK, Kepala BKU), Kepala Bagian (Kabag)
 * 4. Lembaga & UPA:
 *    - Ketua LPPM, Kepala LPPM, Ketua LPMPP, Kepala LPMPP, Kepala UPA (Perpustakaan, TIK, Bahasa, Layanan Uji Kompetensi, dll.)
 * 5. Organ Khusus:
 *    - Ketua Senat Universitas, Ketua SPI (Satuan Pengawas Internal)
 */
/**
 * Pola Regex Resmi Jabatan Struktural SOTK UNSIL yang Berwenang Menerbitkan Disposisi
 * Sesuai Gambar 2 (Matriks Kewenangan OTK UNSIL & Format Disposisi Contoh 21):
 * 
 * 1. Pimpinan Universitas:
 *    - Rektor, Wakil Rektor I (Akademik), Wakil Rektor II (Umum & Keuangan),
 *      Wakil Rektor III (Kemahasiswaan & Alumni), Wakil Rektor IV (Perencanaan & Kerja Sama), Warek
 * 2. Fakultas & Pascasarjana:
 *    - Dekan, Wakil Dekan, Direktur Pascasarjana, Wakil Direktur Pascasarjana,
 *      Ketua Jurusan / Koordinator Program Studi (Kajur, Kaprodi, Koorprodi)
 * 3. Biro & Bagian:
 *    - Kepala Biro (Kepala BAKPK, Kepala BKU), Kepala Bagian (Kabag)
 * 4. Lembaga & UPA:
 *    - Ketua LPPM, Kepala LPPM, Ketua LPMPP, Kepala LPMPP,
 *      Kepala UPA (Perpustakaan, TIK, Bahasa, Layanan Uji Kompetensi, dll.), Kepala Laboratorium (Kalab)
 * 5. Organ Khusus:
 *    - Ketua Senat Universitas, Sekretaris Senat, Ketua SPI (Satuan Pengawas Internal), Sekretaris SPI
 */
export const OFFICIAL_DISPOSISI_PATTERNS = [
  // 1. Pimpinan Universitas: Rektor, Warek I/II/III/IV
  /\b(rektor|wakil\s+rektor(\s+i|\s+ii|\s+iii|\s+iv)?|warek(\s+i|\s+ii|\s+iii|\s+iv)?)\b/i,
  // 2. Fakultas & Pascasarjana: Dekan, Wadek, Direktur Pascasarjana, Wadir, Ketua Jurusan, Kaprodi
  /\b(dekan|wakil\s+dekan|wadek|direktur(\s+pascasarjana)?|wakil\s+direktur|ketua\s+jurusan|kajur|koordinator\s+program\s+studi|koordinator\s+prodi|kaprodi|koorprodi)\b/i,
  // 3. Biro & Bagian: Kepala Biro (Kepala BAKPK, Kepala BKU), Kepala Bagian
  /\b(kepala\s+biro|kabiro|kepala\s+bakpk|kepala\s+bku|kepala\s+bagian|kabag)\b/i,
  // 4. Lembaga & UPA: Ketua/Kepala LPPM, LPMPP, Kepala UPA (Perpustakaan, TIK, Bahasa, dll.)
  /\b(ketua\s+lppm|kepala\s+lppm|ketua\s+lpmpp|kepala\s+lpmpp|kepala\s+upa|kepala\s+unit\s+penunjang|kepala\s+laboratorium|kalab)\b/i,
  // 5. Organ Khusus: Ketua Senat, Ketua SPI
  /\b(ketua\s+senat|sekretaris\s+senat|ketua\s+spi|kepala\s+spi|sekretaris\s+spi|ketua\s+satuan\s+pengawas\s+internal)\b/i
];

export const matchesOfficialDisposisiPosition = (text = '') => {
  if (!text) return false;
  const str = String(text).toLowerCase();
  return OFFICIAL_DISPOSISI_PATTERNS.some((pattern) => pattern.test(str));
};

/**
 * Memeriksa apakah pengguna memiliki hak akses pimpinan/pejabat struktural
 * yang berwenang menerbitkan dan mengelola lembar disposisi (Contoh 21).
 *
 * ATURAN BISNIS KAKU & INTEGRASI SISTEM:
 * 1. Akun dengan role PEJABAT, PIMPINAN, atau role_slug 'pimpinan' (atau is_pejabat = true)
 *    khususnya yang menjabat posisi struktural resmi pada Gambar 2:
 *    - Rektor, Wakil Rektor I, II, III, IV
 *    - Dekan, Wakil Dekan, Direktur Pascasarjana, Ketua Jurusan / Koordinator Program Studi
 *    - Kepala Biro (Kepala BAKPK, Kepala BKU), Kepala Bagian
 *    - Ketua LPPM, Ketua LPMPP, Kepala UPA (Perpustakaan, TIK, Bahasa, Layanan Uji Kompetensi, dll.)
 *    - Ketua Senat Universitas, Ketua SPI (Satuan Pengawas Internal)
 *    WAJIB ADA FITUR DISPOSISI TERSEBUT.
 * 2. Jika akun tersebut rolenya BUKAN PEJABAT (misal: Dosen biasa tanpa jabatan,
 *    Operator Unit, Staf TU, Drafter, Verifikator, Arsiparis, dll.):
 *    DILARANG KERAS ADA FITUR DISPOSISI TERSEBUT.
 * 3. Menyesuaikan langsung dengan Manajemen Role & Manajemen User yang terintegrasi (allUsers).
 *
 * @param {object} user - Objek session user
 * @param {Array<object>} [allUsersList] - Daftar master user dari Manajemen Pengguna (opsional)
 * @returns {boolean}
 */
export const isDisposisiAuthorizedOfficial = (user, allUsersList = null) => {
  if (!user) return false;

  // 1. Sinkronisasi dengan data profil termutakhir di Manajemen Pengguna
  let effectiveUser = user;
  if (Array.isArray(allUsersList) && allUsersList.length > 0) {
    const matched = allUsersList.find(
      (u) =>
        (u.id && user.id && String(u.id) === String(user.id)) ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
        (u.nip && user.nip && u.nip === user.nip)
    );
    if (matched) {
      effectiveUser = { ...user, ...matched };
    }
  }

  // 2. Super Admin diperbolehkan untuk kebutuhan pengujian / simulasi sistem
  if (isSuperAdminUser(effectiveUser)) {
    return true;
  }

  // 3. Normalisasi Role dari Manajemen Role & Manajemen User
  const role = String(effectiveUser?.role || '').toUpperCase().trim();
  const roleSlug = String(effectiveUser?.role_slug || '').toLowerCase().trim();
  const isPejabatFlag = Boolean(effectiveUser?.is_pejabat);
  const permissions = Array.isArray(effectiveUser?.permissions) ? effectiveUser.permissions : [];

  // Identifikasi peran non-pejabat eksplisit (Dilarang Keras)
  const isExplicitNonPejabatRole =
    role === 'DOSEN' ||
    role === 'DOSEN_NON_JABATAN' ||
    role === 'OPERATOR_UNIT' ||
    role === 'ADMIN_TU' ||
    role === 'STAF' ||
    role === 'STAF_PERSURATAN' ||
    role === 'VERIFIKATOR' ||
    role === 'AUDITOR_SPI' ||
    roleSlug === 'drafter' ||
    roleSlug === 'admin_tu' ||
    roleSlug === 'verifikator' ||
    roleSlug === 'auditor_spi' ||
    roleSlug === 'dosen_non_jabatan';

  // Jika akun secara eksplisit memiliki role non-pejabat dan tidak memiliki flag is_pejabat / role_slug pimpinan: DILARANG KERAS
  if (isExplicitNonPejabatRole && !isPejabatFlag && roleSlug !== 'pimpinan') {
    return false;
  }

  const isRolePejabat =
    isPejabatFlag === true ||
    role === 'PEJABAT' ||
    role === 'PIMPINAN' ||
    roleSlug === 'pimpinan' ||
    permissions.includes('disposisi.create');

  // Jika akun TIDAK memiliki role pejabat / pimpinan sama sekali: DILARANG KERAS
  if (!isRolePejabat) {
    return false;
  }

  // 4. Kumpulkan seluruh identitas jabatan struktural pengguna
  const posText = [
    effectiveUser?.jabatan,
    effectiveUser?.roleLabel,
    effectiveUser?.role_label,
    effectiveUser?.nama_jabatan,
    effectiveUser?.sotk_position_label
  ].filter(Boolean).join(' ');

  const posLower = posText.toLowerCase();

  // Kecualikan jika judul jabatan adalah staf/pelaksana/dosen biasa
  const isExcludedTitle =
    posLower.includes('dosen biasa') ||
    posLower.includes('dosen fungsional') ||
    posLower.includes('dosen pengajar') ||
    posLower.includes('tanpa jabatan') ||
    posLower.includes('pengadministrasi') ||
    posLower.includes('operator unit') ||
    posLower.includes('arsiparis');

  if (isExcludedTitle) {
    return false;
  }

  // 5. Cek apakah cocok dengan daftar resmi Pejabat Struktural SOTK UNSIL (Gambar 2)
  if (matchesOfficialDisposisiPosition(posText)) {
    return true;
  }

  // Jika role akun adalah pimpinan/pejabat dan memiliki jabatan yang tidak dikecualikan
  if (isRolePejabat && posText && !isExcludedTitle) {
    return true;
  }

  return false;
};

/**
 * Menentukan daftar tujuan disposisi hirarkis (Top-Down Subordinate Targets)
 * berdasarkan level pimpinan sesuai MATRIKS KEWENANGAN & OTK UNSIL.
 */
export const getHierarchicalDisposisiTargets = (currentUser) => {
  if (!currentUser) return BKU_STRUCTURAL_TEAMS;

  const roleLevel = String(currentUser?.roleLevel || '').toLowerCase();
  const jabatan = String(currentUser?.jabatan || currentUser?.sotk_position_label || '').toLowerCase();
  const unitId = String(currentUser?.unit_kerja_id || '');
  const unitName = String(currentUser?.unit || '').toLowerCase();

  // 1. Level Rektorat / Pimpinan Tertinggi Universitas (Rektor / Wakil Rektor)
  // Sesuai 33 Pejabat Struktural + Pilihan Manual pada Format Resmi Contoh 21
  if (
    jabatan.includes('rektor') ||
    roleLevel.includes('level 1: pimpinan') && (unitId === 'UN58' || unitName.includes('rektorat'))
  ) {
    return [
      { id: 'tgt-1', nama: 'Ketua Senat Universitas', deskripsi: 'Pimpinan Organ Pertimbangan Akademik', badge: 'Senat' },
      { id: 'tgt-2', nama: 'Ketua SPI', deskripsi: 'Pengawasan Kepatuhan & Audit Internal', badge: 'SPI' },
      { id: 'tgt-3', nama: 'Wakil Rektor Bidang Akademik', deskripsi: 'Bidang Pembelajaran, Kurikulum & Mutu', badge: 'Pimpinan' },
      { id: 'tgt-4', nama: 'Wakil Rektor Bidang Keuangan dan Umum', deskripsi: 'Bidang Anggaran, Kepegawaian & Sarpras', badge: 'Pimpinan' },
      { id: 'tgt-5', nama: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', deskripsi: 'Bidang Kemahasiswaan & Hubungan Alumni', badge: 'Pimpinan' },
      { id: 'tgt-6', nama: 'Kepala BAKPK', deskripsi: 'Biro Akademik, Kemahasiswaan, Perencanaan & Kerjasama', badge: 'Biro' },
      { id: 'tgt-7', nama: 'Kepala BKU', deskripsi: 'Biro Keuangan dan Umum', badge: 'Biro' },
      { id: 'tgt-8', nama: 'Kepala LPPM', deskripsi: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat', badge: 'Lembaga' },
      { id: 'tgt-9', nama: 'Kepala LPMPP', deskripsi: 'Lembaga Penjaminan Mutu & Pengembangan Pembelajaran', badge: 'Lembaga' },
      { id: 'tgt-10', nama: 'Dekan FKIP', deskripsi: 'Fakultas Keguruan dan Ilmu Pendidikan', badge: 'Fakultas' },
      { id: 'tgt-11', nama: 'Dekan FEB', deskripsi: 'Fakultas Ekonomi dan Bisnis', badge: 'Fakultas' },
      { id: 'tgt-12', nama: 'Dekan FP', deskripsi: 'Fakultas Pertanian', badge: 'Fakultas' },
      { id: 'tgt-13', nama: 'Dekan FT', deskripsi: 'Fakultas Teknik', badge: 'Fakultas' },
      { id: 'tgt-14', nama: 'Dekan FAI', deskripsi: 'Fakultas Agama Islam', badge: 'Fakultas' },
      { id: 'tgt-15', nama: 'Dekan FIK', deskripsi: 'Fakultas Ilmu Kesehatan', badge: 'Fakultas' },
      { id: 'tgt-16', nama: 'Dekan FISIP', deskripsi: 'Fakultas Ilmu Sosial dan Ilmu Politik', badge: 'Fakultas' },
      { id: 'tgt-17', nama: 'Direktur Pascasarjana', deskripsi: 'Program Pascasarjana Magister & Doktoral', badge: 'Pascasarjana' },
      { id: 'tgt-18', nama: 'Kepala UPA Perpustakaan', deskripsi: 'Layanan Koleksi & Referensi Ilmiah', badge: 'UPA' },
      { id: 'tgt-19', nama: 'Kepala UPA Layanan Uji Kompetensi', deskripsi: 'Sertifikasi & Uji Kompetensi Profesi', badge: 'UPA' },
      { id: 'tgt-20', nama: 'Kepala UPA Bahasa', deskripsi: 'Pelatihan & Uji Kemahiran Bahasa', badge: 'UPA' },
      { id: 'tgt-21', nama: 'Kepala UPA Pengembangan Karir dan Kewirausahaan Mahasiswa', deskripsi: 'Karier, Tracer Study & Kewirausahaan (PKKM)', badge: 'UPA' },
      { id: 'tgt-22', nama: 'Kepala UPA Teknologi, Informasi dan Komunikasi', deskripsi: 'Infrastruktur Jaringan & Sistem Informasi (TIK)', badge: 'UPA' },
      { id: 'tgt-23', nama: 'Kepala Bagian Akademik', deskripsi: 'Ketatausahaan Akademik & Registrasi', badge: 'Bagian' },
      { id: 'tgt-24', nama: 'Ketua Tim Bidang Akademik', deskripsi: 'Kurikulum & Administrasi Pembelajaran', badge: 'Tim' },
      { id: 'tgt-25', nama: 'Ketua Tim Bidang Kemahasiswaan dan Alumni', deskripsi: 'Pembinaan Ormawa & Prestasi Mahasiswa', badge: 'Tim' },
      { id: 'tgt-26', nama: 'Ketua Tim Bidang Kerja Sama', deskripsi: 'Kemitraan Dalam & Luar Negeri', badge: 'Tim' },
      { id: 'tgt-27', nama: 'Ketua Tim Bidang Perencanaan', deskripsi: 'Perencanaan Program & Pagu Anggaran', badge: 'Tim' },
      { id: 'tgt-28', nama: 'Kepala Bagian Umum', deskripsi: 'Ketatausahaan & Kerumahtanggaan BKU', badge: 'Bagian' },
      { id: 'tgt-29', nama: 'Ketua Tim Bidang Keuangan', deskripsi: 'Perbendaharaan, Akuntansi & SPJ Keuangan', badge: 'Tim' },
      { id: 'tgt-30', nama: 'Ketua Tim Bidang Kepegawaian', deskripsi: 'Layanan Kepegawaian & Formasi ASN', badge: 'Tim' },
      { id: 'tgt-31', nama: 'Ketua Tim Bidang Hukum, Ketatausahaan, Organisasi dan Ketatalaksanaan', deskripsi: 'Regulasi, Tata Laksana & Persuratan', badge: 'Tim' },
      { id: 'tgt-32', nama: 'Ketua Tim Kerumahtanggan dan BMN', deskripsi: 'Pengelolaan Barang Milik Negara & Sarpras', badge: 'Tim' },
      { id: 'tgt-33', nama: 'Ketua Tim Keprotokolan dan Humas', deskripsi: 'Protokoler Pimpinan & Komunikasi Publik', badge: 'Tim' }
    ];
  }

  // 2. Level Dekan / Wakil Dekan / Direktur Pascasarjana
  if (
    jabatan.includes('dekan') ||
    jabatan.includes('direktur') ||
    unitName.includes('fakultas') ||
    unitName.includes('pascasarjana')
  ) {
    const unitTag = unitName.includes('fkip') ? 'FKIP' : unitName.includes('ft') || unitName.includes('teknik') ? 'FT' : 'Fakultas';
    return [
      { id: 'wadek-1', nama: `Wakil Dekan Bidang Akademik (${unitTag})`, deskripsi: 'Koordinasi Kurikulum, Perkuliahan & Penjaminan Mutu', badge: 'Pimpinan' },
      { id: 'wadek-2', nama: `Wakil Dekan Bidang Keuangan dan Umum (${unitTag})`, deskripsi: 'Koordinasi Keuangan, Sarana Prasarana & Kepegawaian', badge: 'Pimpinan' },
      { id: 'wadek-3', nama: `Wakil Dekan Bidang Kemahasiswaan & Alumni (${unitTag})`, deskripsi: 'Koordinasi Organisasi Mahasiswa, Prestasi & Alumni', badge: 'Pimpinan' },
      { id: 'kajur-1', nama: `Ketua Jurusan / Koordinator Program Studi (${unitTag})`, deskripsi: 'Penyelenggaraan Tridharma & Kurikulum Prodi', badge: 'Jurusan' },
      { id: 'ktu-fak', nama: `Kepala Bagian Tata Usaha (${unitTag})`, deskripsi: 'Ketatausahaan, Persuratan & Pengelolaan Berkas', badge: 'Tata Usaha' },
      { id: 'gpm-fak', nama: `Ketua Tim Gugus Penjaminan Mutu (GPM ${unitTag})`, deskripsi: 'Audit Internal Mutu Pembelajaran Fakultas', badge: 'GPM' },
      { id: 'lab-fak', nama: `Kepala Laboratorium Terpadu (${unitTag})`, deskripsi: 'Praktikum, Fasilitas Riset & Pengujian', badge: 'Lab' },
      { id: 'dosen-fak', nama: `Tim Dosen & Tenaga Kependidikan (${unitTag})`, deskripsi: 'Pelaksana Teknis Tridharma & Administrasi', badge: 'Pelaksana' }
    ];
  }

  // 3. Level Ketua Jurusan / Koordinator Program Studi
  if (
    jabatan.includes('jurusan') ||
    jabatan.includes('prodi') ||
    jabatan.includes('kajur') ||
    jabatan.includes('kaprodi')
  ) {
    return [
      { id: 'sekjur', nama: 'Sekretaris Jurusan / Program Studi', deskripsi: 'Administrasi Tridharma & Penjadwalan Kuliah', badge: 'Jurusan' },
      { id: 'kalab', nama: 'Kepala / Koordinator Laboratorium Prodi', deskripsi: 'Pengelolaan Praktikum, Alat & Bahan Uji', badge: 'Lab' },
      { id: 'koor-ta', nama: 'Koordinator Skripsi / Tugas Akhir', deskripsi: 'Bimbingan, Seminar Proposal & Sidang Ujian', badge: 'Akademik' },
      { id: 'koor-mbkm', nama: 'Koordinator Kerja Praktik & MBKM', deskripsi: 'Magang Industri, KKN Tematik & Pertukaran Mahasiswa', badge: 'Akademik' },
      { id: 'dosen-homebase', nama: 'Dosen Homebase Program Studi', deskripsi: 'Pengampu Mata Kuliah & Pembimbing Akademik', badge: 'Dosen' },
      { id: 'staf-adm-jurusan', nama: 'Staf Administrasi Akademik Jurusan', deskripsi: 'Pelaksana Surat Menyurat & Pelayanan Mahasiswa', badge: 'Staf' }
    ];
  }

  // 4. Level Kepala Biro BKU
  if (unitId === 'UN58.6' || unitName.includes('keuangan dan umum')) {
    return BKU_STRUCTURAL_TEAMS;
  }

  // 5. Level Kepala Biro BAKPK
  if (unitId === 'UN58.5' || unitName.includes('bakpk')) {
    return [
      { id: 'kbg_akademik', nama: 'Kepala Bagian Akademik', deskripsi: 'Registrasi, kelulusan, dan data pangkalan Dikti', badge: 'Bagian' },
      { id: 'tim_akademik', nama: 'Ketua Tim Bidang Akademik', deskripsi: 'Layanan administrasi kurikulum dan kalender akademik', badge: 'Tim' },
      { id: 'tim_kemahasiswaan', nama: 'Ketua Tim Bidang Kemahasiswaan & Alumni', deskripsi: 'Beasiswa, ormawa, dan tracer study alumni', badge: 'Tim' },
      { id: 'tim_perencanaan', nama: 'Ketua Tim Bidang Perencanaan', deskripsi: 'Renstra, pagu anggaran, dan program kerja', badge: 'Tim' },
      { id: 'tim_kerjasama', nama: 'Ketua Tim Bidang Kerjasama', deskripsi: 'MoU, PKS mitra instansi luar, dan humas kerjasama', badge: 'Tim' }
    ];
  }

  // 6. Level Kepala Lembaga (LPPM / LPMPP) & UPA
  if (unitName.includes('lppm') || unitName.includes('lpmpp') || unitName.includes('upa') || unitName.includes('spi')) {
    return [
      { id: 'sek_lembaga', nama: 'Sekretaris Lembaga / Koordinator Unit', deskripsi: 'Koordinasi program dan tata kelola unit kerja', badge: 'Sekretaris' },
      { id: 'kapus_1', nama: 'Kepala Pusat / Koordinator Bidang I', deskripsi: 'Program kerja spesifik bidang utama', badge: 'Pusat' },
      { id: 'kapus_2', nama: 'Kepala Pusat / Koordinator Bidang II', deskripsi: 'Program kerja spesifik bidang pendukung', badge: 'Pusat' },
      { id: 'kasubbag_tu', nama: 'Kepala Subbagian / Tata Usaha Unit', deskripsi: 'Administrasi umum, persuratan, dan kearsipan unit', badge: 'Tata Usaha' },
      { id: 'staf_pelaksana', nama: 'Staf Pelaksana Teknis & Fungsional', deskripsi: 'Pelaksana kegiatan dinas operasional unit', badge: 'Pelaksana' }
    ];
  }

  // Default fallback
  return BKU_STRUCTURAL_TEAMS;
};
