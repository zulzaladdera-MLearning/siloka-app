import { isSuperAdminUser } from './authGuards.js';
import defaultUnitKerjaList from '../data/unitKerja.json';
import { resolveSenderKey, resolveOfficialSenderKey, getTargetsForSender } from '../services/disposisiRoutingService.js';

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
    badge: 'Bagian',
    unit_id: 'UN58.6'
  },
  {
    id: 'tim_keuangan',
    nama: 'Ketua Tim Bidang Keuangan',
    deskripsi: 'Perbendaharaan, pembukuan, realisasi DIPA, dan SPJ keuangan',
    badge: 'Tim Bidang',
    unit_id: 'UN58.6'
  },
  {
    id: 'tim_kepegawaian',
    nama: 'Ketua Tim Bidang Kepegawaian',
    deskripsi: 'Layanan kepegawaian, kenaikan pangkat, dan mutasi ASN/PPPK',
    badge: 'Tim Bidang',
    unit_id: 'UN58.6'
  },
  {
    id: 'tim_kerumahtanggan_bmn',
    nama: 'Ketua Tim Kerumahtanggan dan BMN',
    deskripsi: 'Pengelolaan aset BMN, sarana prasarana, logistik, dan pemeliharaan',
    badge: 'Tim Bidang',
    unit_id: 'UN58.6'
  },
  {
    id: 'tim_hukum_organisasi',
    nama: 'Ketua Tim Hukum, Organisasi, dan Ketatalaksanaan',
    deskripsi: 'Penyusunan produk hukum, advokasi, tatalaksana organisasi & reformasi birokrasi',
    badge: 'Tim Bidang',
    unit_id: 'UN58.6'
  },
  {
    id: 'tim_keprotokolan_humas',
    nama: 'Ketua Tim Keprotokolan dan Humas',
    deskripsi: 'Keprotokolan pimpinan, humas publikasi, dan dokumentasi dinas',
    badge: 'Tim Bidang',
    unit_id: 'UN58.6'
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

  // 2. Sesuai Tata Naskah Dinas UNSIL (Peraturan Rektor No. 3/2023) & UU No. 30/2014:
  // Disposisi adalah hak eksklusif Pejabat Struktural. Administrator Sistem (Super Admin) terkunci dari penerbitan E-Disposisi.
  if (isSuperAdminUser(effectiveUser)) {
    return false;
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
export const getHierarchicalDisposisiTargets = (currentUser, allUsersList = [], allUnitsList = []) => {
  if (!currentUser) return BKU_STRUCTURAL_TEAMS;

  const roleLevel = String(currentUser?.roleLevel || '').toLowerCase();
  const jabatan = String(currentUser?.jabatan || currentUser?.sotk_position_label || '').toLowerCase();
  const unitId = String(currentUser?.unit_kerja_id || '');
  const unitName = String(currentUser?.unit || '').toLowerCase();

  // Resolusi Master Data Unit Kerja (Reaktif terhadap Manajemen Unit Kerja / allUnitsList)
  let activeUnits = [];
  if (Array.isArray(allUnitsList) && allUnitsList.length > 0) {
    activeUnits = allUnitsList;
  } else {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('siloka_unit_kerja_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) activeUnits = parsed;
        }
      }
    } catch (_) {}
    if (activeUnits.length === 0) {
      activeUnits = defaultUnitKerjaList;
    }
  }

  const activeUnitsMap = new Map();
  activeUnits.forEach((u) => {
    if (!u) return;
    const kode = String(u.kode_unit || '').toUpperCase();
    if (kode) activeUnitsMap.set(kode, u);
  });

  const isUnitActive = (kode) => {
    if (!kode) return true;
    const found = activeUnitsMap.get(String(kode).toUpperCase());
    if (!found) return false;
    return found.is_active !== false;
  };

  const buildFakultasCluster = (clusterName = 'Pimpinan Fakultas & Pascasarjana') => {
    const list = [];
    const standardFakultas = [
      { kode: 'UN58.10', id: 'tgt-fkip', defaultBadge: 'FKIP', defaultAliases: ['fkip', 'dekanfkip', 'dekanfakultaskeguruan', 'keguruandanilmupendidikan'] },
      { kode: 'UN58.11', id: 'tgt-feb', defaultBadge: 'FEB', defaultAliases: ['feb', 'dekanfeb', 'dekanfakultasekonomi', 'ekonomidanbisnis'] },
      { kode: 'UN58.12', id: 'tgt-fp', defaultBadge: 'FP', defaultAliases: ['fp', 'dekanfp', 'dekanfakultaspertanian', 'pertanian'] },
      { kode: 'UN58.13', id: 'tgt-ft', defaultBadge: 'FT', defaultAliases: ['ft', 'dekanft', 'dekanfakultasteknik', 'teknik'] },
      { kode: 'UN58.16', id: 'tgt-fai', defaultBadge: 'FAI', defaultAliases: ['fai', 'dekanfai', 'dekanfakultasagama', 'agamaislam'] },
      { kode: 'UN58.15', id: 'tgt-fik', defaultBadge: 'FIK', defaultAliases: ['fik', 'dekanfik', 'dekanfakultasilmukesehatan', 'ilmukesehatan'] },
      { kode: 'UN58.14', id: 'tgt-fisip', defaultBadge: 'FISIP', defaultAliases: ['fisip', 'dekanfisip', 'dekanfakultasilmusosial', 'ilmusosialdanilmupolitik'] },
      { kode: 'UN58.17', id: 'tgt-pasca', defaultBadge: 'Pasca', defaultAliases: ['pasca', 'pascasarjana', 'direkturpasca', 'direkturpascasarjana', 'programpascasarjana'] }
    ];

    standardFakultas.forEach((std) => {
      if (isUnitActive(std.kode)) {
        const u = activeUnitsMap.get(std.kode);
        if (u) {
          const isPasca = std.kode === 'UN58.17' || u.tipe_unit === 'PASCASARJANA';
          list.push({
            id: std.id,
            nama: isPasca ? (u.nama_unit.toLowerCase().startsWith('direktur') ? u.nama_unit : `Direktur ${u.nama_unit}`) : `Dekan ${u.singkatan || u.nama_unit}`,
            cluster: clusterName,
            badge: u.singkatan || std.defaultBadge,
            tupoksi: u.nama_unit,
            deskripsi: u.nama_unit,
            unit_id: std.kode,
            aliases: std.defaultAliases
          });
        }
      }
    });

    const handledFakKode = new Set(standardFakultas.map((s) => s.kode));
    activeUnits.forEach((u) => {
      const kode = String(u.kode_unit || '').toUpperCase();
      if (
        u.is_active !== false &&
        (u.tipe_unit === 'FAKULTAS' || u.tipe_unit === 'PASCASARJANA' || u.kategori === 'FAKULTAS') &&
        !handledFakKode.has(kode)
      ) {
        const isPasca = u.tipe_unit === 'PASCASARJANA';
        list.push({
          id: `tgt-fak-${u.kode_unit.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          nama: isPasca ? `Direktur ${u.nama_unit}` : `Dekan ${u.singkatan || u.nama_unit}`,
          cluster: clusterName,
          badge: u.singkatan || 'Fakultas',
          tupoksi: u.nama_unit,
          deskripsi: u.nama_unit,
          unit_id: u.kode_unit,
          aliases: [u.singkatan?.toLowerCase(), u.nama_unit?.toLowerCase()].filter(Boolean)
        });
      }
    });

    return list;
  };

  const buildUpaCluster = (clusterName = 'Pimpinan Unit Penunjang Akademik (UPA)') => {
    const list = [];
    const standardUPA = [
      { kode: 'UN58.31', id: 'tgt-perpus', defaultBadge: 'UPA', defaultAliases: ['perpustakaan', 'kepalaupaperpustakaan', 'upaperpustakaan'], tupoksi: 'Layanan sarana koleksi & referensi ilmiah' },
      { kode: 'UN58.32', id: 'tgt-tik', defaultBadge: 'UPA', defaultAliases: ['tik', 'teknologiinformasi', 'kepalaupatik', 'upatik'], tupoksi: 'Infrastruktur jaringan & sistem informasi' },
      { kode: 'UN58.33', id: 'tgt-bahasa', defaultBadge: 'UPA', defaultAliases: ['bahasa', 'kepalaupabahasa', 'upabahasa'], tupoksi: 'Pelatihan & uji kemahiran bahasa' },
      { kode: 'UN58.35', id: 'tgt-luk', defaultBadge: 'UPA', defaultAliases: ['luk', 'layananujikompetensi', 'ujikompetensi', 'kepalaupaluk'], tupoksi: 'Sertifikasi & uji kompetensi profesi' },
      { kode: 'UN58.34', id: 'tgt-pkkm', defaultBadge: 'UPA', defaultAliases: ['pkkm', 'karir', 'kewirausahaan', 'kepalaupapkkm', 'pengembangankarir'], tupoksi: 'Karier, tracer study & kewirausahaan mahasiswa' }
    ];

    standardUPA.forEach((std) => {
      if (isUnitActive(std.kode)) {
        const u = activeUnitsMap.get(std.kode);
        if (u) {
          const cleanName = u.nama_unit.startsWith('Unit Penunjang Akademik')
            ? u.nama_unit.replace(/^Unit Penunjang Akademik\s*/i, 'UPA ')
            : u.nama_unit;
          list.push({
            id: std.id,
            nama: u.nama_unit.toLowerCase().startsWith('kepala') ? u.nama_unit : `Kepala ${cleanName} (${u.singkatan || std.defaultBadge})`,
            cluster: clusterName,
            badge: u.singkatan || std.defaultBadge,
            tupoksi: std.tupoksi,
            deskripsi: u.nama_unit,
            unit_id: std.kode,
            aliases: std.defaultAliases
          });
        }
      }
    });

    const handledUpaKode = new Set(standardUPA.map((s) => s.kode));
    activeUnits.forEach((u) => {
      const kode = String(u.kode_unit || '').toUpperCase();
      if (
        u.is_active !== false &&
        (u.tipe_unit === 'UPA' || u.kategori === 'UPA') &&
        !handledUpaKode.has(kode)
      ) {
        const cleanName = u.nama_unit.startsWith('Unit Penunjang Akademik')
          ? u.nama_unit.replace(/^Unit Penunjang Akademik\s*/i, 'UPA ')
          : u.nama_unit;
        list.push({
          id: `tgt-upa-${u.kode_unit.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          nama: `Kepala ${cleanName}` + (u.singkatan ? ` (${u.singkatan})` : ''),
          cluster: clusterName,
          badge: u.singkatan || 'UPA',
          tupoksi: `Layanan teknis & penunjang akademik ${u.nama_unit}`,
          deskripsi: u.nama_unit,
          unit_id: u.kode_unit,
          aliases: [u.singkatan?.toLowerCase(), u.nama_unit?.toLowerCase()].filter(Boolean)
        });
      }
    });

    return list;
  };

  let baseTargets = [];

  // 1. Level Rektorat / Pimpinan Tertinggi Universitas (Rektor / Wakil Rektor)
  // Sesuai 6 Klaster Hierarkis SOTK UNSIL (Terhubung Manajemen Pengguna & Manajemen Unit Kerja)
  const isWarek =
    jabatan.includes('wakil rektor') ||
    jabatan.includes('warek') ||
    currentUser?.role === 'WAREK' ||
    Boolean(currentUser?.subRoleKey?.startsWith('WAREK'));

  const isRektor =
    (!isWarek && (jabatan.includes('rektor') || currentUser?.role === 'REKTOR')) ||
    (roleLevel.includes('level 1: pimpinan') && !isWarek && (unitId === 'UN58' || unitName.includes('rektorat')));

  if (isRektor) {
    const cluster1 = [];
    const cluster2 = [];
    const cluster3 = [];
    const cluster4 = [];
    const cluster5 = [];
    const cluster6 = [];

    // KLASTER 1: PIMPINAN UNIVERSITAS & ORGAN PENGAWAS/PERTIMBANGAN
    cluster1.push({
      id: 'tgt-wr1',
      nama: 'Wakil Rektor Bidang Akademik',
      cluster: '1. Pimpinan Universitas & Pengawas',
      badge: 'WR I',
      tupoksi: 'Urusan kurikulum, pembelajaran, registrasi mahasiswa, dan penjaminan mutu',
      deskripsi: 'Kurikulum, Pembelajaran, Registrasi Mahasiswa & Penjaminan Mutu',
      unit_id: 'UN58',
      aliases: ['akademik', 'wr1', 'warek1', 'wakilrektor1', 'wakilrektorbidangakademik']
    });
    cluster1.push({
      id: 'tgt-wr2',
      nama: 'Wakil Rektor Bidang Keuangan dan Umum',
      cluster: '1. Pimpinan Universitas & Pengawas',
      badge: 'WR II',
      tupoksi: 'Urusan anggaran, DIPA, kepegawaian, sarana prasarana, hukum, dan kerumahtanggaan',
      deskripsi: 'Anggaran, DIPA, Kepegawaian, Sarana Prasarana, Hukum & Kerumahtanggaan',
      unit_id: 'UN58',
      aliases: ['keuangandanumum', 'keuangan', 'wr2', 'warek2', 'wakilrektor2', 'wakilrektorbidangkeuangan']
    });
    cluster1.push({
      id: 'tgt-wr3',
      nama: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
      cluster: '1. Pimpinan Universitas & Pengawas',
      badge: 'WR III',
      tupoksi: 'Urusan ormawa, beasiswa, prestasi mahasiswa, dan hubungan alumni',
      deskripsi: 'Organisasi Mahasiswa, Beasiswa, Prestasi Mahasiswa & Hubungan Alumni',
      unit_id: 'UN58',
      aliases: ['kemahasiswaan', 'alumni', 'wr3', 'warek3', 'wakilrektor3', 'wakilrektorbidangkemahasiswaan']
    });

    if (isUnitActive('UN58.SENAT')) {
      const u = activeUnitsMap.get('UN58.SENAT');
      const baseNama = u.nama_unit.replace(/^ketua\s+/i, '');
      cluster1.push({
        id: 'tgt-senat',
        nama: u.nama_unit.toLowerCase().startsWith('ketua') ? u.nama_unit : `Ketua ${u.nama_unit}`,
        cluster: '1. Pimpinan Universitas & Pengawas',
        badge: u.singkatan || 'Senat',
        tupoksi: 'Urusan pertimbangan dan pengawasan akademik',
        deskripsi: 'Organ Pertimbangan & Pengawasan Akademik Universitas',
        unit_id: 'UN58.SENAT',
        aliases: ['senat', 'ketuasenat', 'ketuasenatuniversitas', 'ketuasenatuniversitassiliwangi']
      });
      cluster1.push({
        id: 'tgt-sekretaris-senat',
        nama: `Sekretaris ${baseNama}`,
        cluster: '1. Pimpinan Universitas & Pengawas',
        badge: 'Sekretaris Senat',
        tupoksi: 'Urusan administrasi persuratan, notulensi & tata laksana persidangan Senat',
        deskripsi: 'Sekretariat & Administrasi Pertimbangan Senat Universitas',
        unit_id: 'UN58.SENAT',
        aliases: ['sekretarissenat', 'sekretarissenatuniversitas', 'sekretarissenatuniversitassiliwangi']
      });
    }

    if (isUnitActive('UN58.SPI')) {
      const u = activeUnitsMap.get('UN58.SPI');
      const baseNama = u.nama_unit.replace(/^ketua\s+/i, '');
      cluster1.push({
        id: 'tgt-spi',
        nama: u.nama_unit.toLowerCase().startsWith('ketua') ? u.nama_unit : `Ketua ${u.nama_unit}`,
        cluster: '1. Pimpinan Universitas & Pengawas',
        badge: u.singkatan || 'SPI',
        tupoksi: 'Urusan kepatuhan, audit internal keuangan, dan operasional',
        deskripsi: 'Pengawasan Kepatuhan, Audit Internal Keuangan & Operasional',
        unit_id: 'UN58.SPI',
        aliases: ['spi', 'satuanpengawasinternal', 'ketuaspi', 'ketuasatuanpengawasinternal']
      });
      cluster1.push({
        id: 'tgt-sekretaris-spi',
        nama: `Sekretaris ${baseNama}`,
        cluster: '1. Pimpinan Universitas & Pengawas',
        badge: 'Sekretaris SPI',
        tupoksi: 'Urusan administrasi pengawasan & kepatuhan pemeriksaan internal',
        deskripsi: 'Sekretariat Satuan Pengawas Internal',
        unit_id: 'UN58.SPI',
        aliases: ['sekretarisspi', 'sekretarissatuanpengawasinternal']
      });
    }

    if (isUnitActive('UN58.DP')) {
      const u = activeUnitsMap.get('UN58.DP');
      cluster1.push({
        id: 'tgt-dp',
        nama: u.nama_unit.toLowerCase().startsWith('ketua') ? u.nama_unit : `Ketua ${u.nama_unit}`,
        cluster: '1. Pimpinan Universitas & Pengawas',
        badge: u.singkatan || 'DP',
        tupoksi: 'Urusan pertimbangan pengembangan institusi',
        deskripsi: 'Dewan Penyantun Universitas Siliwangi',
        unit_id: 'UN58.DP',
        aliases: ['dewanpenyantun', 'penyantun', 'dp']
      });
    }

    activeUnits.forEach((u) => {
      const kode = String(u.kode_unit || '').toUpperCase();
      if (
        u.is_active !== false &&
        (u.tipe_unit === 'ORGAN' || u.kategori === 'ORGAN') &&
        !['UN58', 'UN58.SENAT', 'UN58.SPI', 'UN58.DP'].includes(kode)
      ) {
        cluster1.push({
          id: `tgt-organ-${u.kode_unit.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          nama: u.nama_unit.toLowerCase().startsWith('ketua') ? u.nama_unit : `Ketua ${u.nama_unit}`,
          cluster: '1. Pimpinan Universitas & Pengawas',
          badge: u.singkatan || 'Organ',
          tupoksi: `Organ pengawas/pertimbangan ${u.nama_unit}`,
          deskripsi: u.nama_unit,
          unit_id: u.kode_unit,
          aliases: [u.singkatan?.toLowerCase(), u.nama_unit?.toLowerCase()].filter(Boolean)
        });
      }
    });

    // KLASTER 2: PIMPINAN BIRO (PELAKSANA ADMINISTRASI UNIVERSITAS)
    if (isUnitActive('UN58.6')) {
      const u = activeUnitsMap.get('UN58.6');
      cluster2.push({
        id: 'tgt-bku',
        nama: `Kepala ${u.nama_unit} (${u.singkatan || 'BKU'})`,
        cluster: '2. Pimpinan Biro',
        badge: u.singkatan || 'BKU',
        tupoksi: 'Pengelolaan anggaran, perbendaharaan, persuratan universitas, aset BMN, kepegawaian, dan pengadaan barang/jasa',
        deskripsi: 'Pengelolaan Anggaran, Perbendaharaan, Persuratan, BMN, Kepegawaian & PBJ',
        unit_id: 'UN58.6',
        aliases: ['bku', 'kepalabku', 'birokeuangan', 'birokeuangandanumum', 'kepalabirokeuangan']
      });
    }

    if (isUnitActive('UN58.5')) {
      const u = activeUnitsMap.get('UN58.5');
      cluster2.push({
        id: 'tgt-bakpk',
        nama: `Kepala ${u.nama_unit} (${u.singkatan || 'BAKPK'})`,
        cluster: '2. Pimpinan Biro',
        badge: u.singkatan || 'BAKPK',
        tupoksi: 'Perencanaan program, IKU universitas, administrasi akademik, kemahasiswaan, dan kemitraan dalam/luar negeri',
        deskripsi: 'Perencanaan Program, IKU, Administrasi Akademik, Kemahasiswaan & Kerjasama',
        unit_id: 'UN58.5',
        aliases: ['bakpk', 'kepalabakpk', 'biroakademik', 'biroakademikkemahasiswaan', 'kepalabiroakademik']
      });
    }

    activeUnits.forEach((u) => {
      const kode = String(u.kode_unit || '').toUpperCase();
      if (
        u.is_active !== false &&
        (u.tipe_unit === 'BIRO' || u.kategori === 'BIRO') &&
        !['UN58.5', 'UN58.6'].includes(kode)
      ) {
        cluster2.push({
          id: `tgt-biro-${u.kode_unit.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          nama: `Kepala ${u.nama_unit}` + (u.singkatan ? ` (${u.singkatan})` : ''),
          cluster: '2. Pimpinan Biro',
          badge: u.singkatan || 'Biro',
          tupoksi: `Pelaksana administrasi ${u.nama_unit}`,
          deskripsi: `Pimpinan ${u.nama_unit}`,
          unit_id: u.kode_unit,
          aliases: [u.singkatan?.toLowerCase(), u.nama_unit?.toLowerCase()].filter(Boolean)
        });
      }
    });

    // KLASTER 3: PIMPINAN LEMBAGA (PELAKSANA AKADEMIK KHUSUS)
    if (isUnitActive('UN58.21')) {
      const u = activeUnitsMap.get('UN58.21');
      cluster3.push({
        id: 'tgt-lppm',
        nama: `Ketua ${u.nama_unit} (${u.singkatan || 'LPPM'})`,
        cluster: '3. Pimpinan Lembaga',
        badge: u.singkatan || 'LPPM',
        tupoksi: 'Riset, publikasi, pengabdian masyarakat, dan KKN',
        deskripsi: 'Riset, Publikasi, Pengabdian Masyarakat & KKN',
        unit_id: 'UN58.21',
        aliases: ['lppm', 'ketualppm', 'kepalalppm', 'penelitiandanpengabdian']
      });
    }

    if (isUnitActive('UN58.22')) {
      const u = activeUnitsMap.get('UN58.22');
      cluster3.push({
        id: 'tgt-lpmpp',
        nama: `Ketua ${u.nama_unit} (${u.singkatan || 'LPMPP'})`,
        cluster: '3. Pimpinan Lembaga',
        badge: u.singkatan || 'LPMPP',
        tupoksi: 'Audit mutu internal, kurikulum, akreditasi prodi/institusi, dan sertifikasi dosen',
        deskripsi: 'Audit Mutu Internal, Kurikulum, Akreditasi & Sertifikasi Dosen',
        unit_id: 'UN58.22',
        aliases: ['lpmpp', 'ketualpmpp', 'kepalalpmpp', 'penjaminanmutu']
      });
    }

    activeUnits.forEach((u) => {
      const kode = String(u.kode_unit || '').toUpperCase();
      if (
        u.is_active !== false &&
        (u.tipe_unit === 'LEMBAGA' || u.kategori === 'LEMBAGA') &&
        !['UN58.21', 'UN58.22'].includes(kode)
      ) {
        cluster3.push({
          id: `tgt-lembaga-${u.kode_unit.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          nama: `Ketua ${u.nama_unit}` + (u.singkatan ? ` (${u.singkatan})` : ''),
          cluster: '3. Pimpinan Lembaga',
          badge: u.singkatan || 'Lembaga',
          tupoksi: `Pelaksana fungsi akademik ${u.nama_unit}`,
          deskripsi: `Pimpinan ${u.nama_unit}`,
          unit_id: u.kode_unit,
          aliases: [u.singkatan?.toLowerCase(), u.nama_unit?.toLowerCase()].filter(Boolean)
        });
      }
    });

    // KLASTER 4: PIMPINAN FAKULTAS & PASCASARJANA
    cluster4.push(...buildFakultasCluster('4. Pimpinan Fakultas & Pascasarjana'));

    // KLASTER 5: PIMPINAN UNIT PENUNJANG AKADEMIK (UPA)
    cluster5.push(...buildUpaCluster('5. Pimpinan Unit Penunjang Akademik (UPA)'));

    // KLASTER 6: PENUGASAN KHUSUS (TIM KERJA & BAGIAN)
    if (isUnitActive('UN58.6')) {
      cluster6.push({
        id: 'tgt-humas',
        nama: 'Ketua Tim Keprotokolan dan Humas',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Kegiatan seremonial pimpinan, keprotokolan & publikasi media (BKU)',
        deskripsi: 'Kegiatan Seremonial Pimpinan, Keprotokolan & Publikasi Media',
        unit_id: 'UN58.6',
        aliases: ['humas', 'protokol', 'keprotokolan', 'ketuatimkeprotokolandanhumas', 'timhumas']
      });
      cluster6.push({
        id: 'tgt-hukum',
        nama: 'Ketua Tim Hukum, Organisasi, dan Ketatalaksanaan',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Regulasi, telaah hukum, penataan organisasi & tata laksana (BKU)',
        deskripsi: 'Regulasi, Tata Laksana, Hukum & Naskah Kerja Sama',
        unit_id: 'UN58.6',
        aliases: ['hukum', 'ketatalaksanaan', 'organisasidanketatalaksanaan', 'ketuatimhukum', 'timhukum', 'hkok']
      });
      cluster6.push({
        id: 'tgt-keuangan',
        nama: 'Ketua Tim Bidang Keuangan',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Pengelolaan perbendaharaan, realisasi SPM/SP2D & akuntansi keuangan (BKU)',
        deskripsi: 'Perbendaharaan, Realisasi Anggaran, SPM/SP2D & Akuntansi',
        unit_id: 'UN58.6',
        aliases: ['keuangan', 'perbendaharaan', 'akuntansi', 'ketuatimkeuangan', 'timkeuangan', 'ketuatimbidangkeuangan']
      });
      cluster6.push({
        id: 'tgt-kepegawaian',
        nama: 'Ketua Tim Bidang Kepegawaian',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Layanan kepegawaian, kenaikan pangkat, mutasi & pembinaan ASN/PPPK (BKU)',
        deskripsi: 'Layanan Kepegawaian, Kenaikan Pangkat, Mutasi & Pembinaan ASN/PPPK',
        unit_id: 'UN58.6',
        aliases: ['kepegawaian', 'timkepegawaian', 'ketuatimkepegawaian', 'ketuatimbidangkepegawaian']
      });
      cluster6.push({
        id: 'tgt-bmn',
        nama: 'Ketua Tim Kerumahtanggan dan BMN',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Pengelolaan aset BMN, sarana prasarana, logistik & pemeliharaan (BKU)',
        deskripsi: 'Pengelolaan Aset BMN, Sarana Prasarana, Logistik & Pemeliharaan',
        unit_id: 'UN58.6',
        aliases: ['bmn', 'kerumahtanggaan', 'sarpras', 'ketuatimbmn', 'timbmn', 'kerumahtanggandanbmn']
      });
      cluster6.push({
        id: 'tgt-kbg-umum',
        nama: 'Kepala Bagian Umum',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Bagian',
        tupoksi: 'Koordinasi umum kerumahtanggaan, tata usaha, dan persuratan (BKU)',
        deskripsi: 'Koordinasi Umum Kerumahtanggaan, Tata Usaha & BMN',
        unit_id: 'UN58.6',
        aliases: ['kabagumum', 'bagianumum', 'kepalabagianumum']
      });
    }

    if (isUnitActive('UN58.5')) {
      cluster6.push({
        id: 'tgt-perencanaan',
        nama: 'Ketua Tim Bidang Perencanaan',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Penyusunan rencana program, anggaran (RKAKL/DIPA) & evaluasi kinerja (BAKPK)',
        deskripsi: 'Penyusunan Rencana Program, Pagu RKAKL & Evaluasi Kinerja',
        unit_id: 'UN58.5',
        aliases: ['perencanaan', 'paguanggaran', 'dipa', 'ketuatimperencanaan', 'timperencanaan', 'ketuatimbidangperencanaan']
      });
      cluster6.push({
        id: 'tgt-akademik',
        nama: 'Ketua Tim Bidang Akademik',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Layanan administrasi kurikulum, registrasi mahasiswa & kalender akademik (BAKPK)',
        deskripsi: 'Layanan Administrasi Kurikulum, Registrasi & Pangkalan Data Dikti',
        unit_id: 'UN58.5',
        aliases: ['akademik', 'timakademik', 'ketuatimakademik', 'ketuatimbidangakademik']
      });
      cluster6.push({
        id: 'tgt-kemahasiswaan',
        nama: 'Ketua Tim Bidang Kemahasiswaan dan Alumni',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Pengelolaan beasiswa, kegiatan ormawa & tracer study alumni (BAKPK)',
        deskripsi: 'Pengelolaan Beasiswa KIP-K, Pembinaan Ormawa & Tracer Study Alumni',
        unit_id: 'UN58.5',
        aliases: ['kemahasiswaan', 'alumni', 'timkemahasiswaan', 'ketuatimkemahasiswaan', 'ketuatimbidangkemahasiswaan']
      });
      cluster6.push({
        id: 'tgt-kerjasama',
        nama: 'Ketua Tim Bidang Kerja Sama',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Tim Kerja',
        tupoksi: 'Fasilitasi nota kesepahaman (MoU), PKS & kemitraan strategis (BAKPK)',
        deskripsi: 'Fasilitasi Nota Kesepahaman (MoU), PKS & Kemitraan Strategis',
        unit_id: 'UN58.5',
        aliases: ['kerjasama', 'timkerjasama', 'ketuatimkerjasama', 'ketuatimbidangkerjasama']
      });
      cluster6.push({
        id: 'tgt-kbg-akademik',
        nama: 'Kepala Bagian Akademik',
        cluster: '6. Penugasan Khusus (Tim Kerja)',
        badge: 'Bagian',
        tupoksi: 'Koordinasi umum administrasi akademik, registrasi & PD-Dikti (BAKPK)',
        deskripsi: 'Koordinasi Umum Administrasi Akademik, Registrasi & PD-Dikti',
        unit_id: 'UN58.5',
        aliases: ['kabagakademik', 'bagianakademik', 'kepalabagianakademik']
      });
    }

    baseTargets = [...cluster1, ...cluster2, ...cluster3, ...cluster4, ...cluster5, ...cluster6];
  } else if (isWarek) {
    const isWarek1 =
      jabatan.includes('akademik') ||
      jabatan.includes('wr1') ||
      jabatan.includes('warek1') ||
      currentUser?.subRoleKey === 'WAREK_1';
    const isWarek2 =
      jabatan.includes('keuangan') ||
      jabatan.includes('wr2') ||
      jabatan.includes('warek2') ||
      currentUser?.subRoleKey === 'WAREK_2';
    const isWarek3 =
      jabatan.includes('kemahasiswaan') ||
      jabatan.includes('alumni') ||
      jabatan.includes('wr3') ||
      jabatan.includes('warek3') ||
      currentUser?.subRoleKey === 'WAREK_3';

    if (isWarek1) {
      baseTargets = [
        {
          id: 'tgt-bakpk',
          nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)',
          cluster: 'Pelaksana Administrasi Akademik',
          badge: 'BAKPK',
          deskripsi: 'Administrasi Akademik, Kemahasiswaan & Kerjasama',
          unit_id: 'UN58.5',
          aliases: ['bakpk', 'kepalabakpk']
        },
        ...buildFakultasCluster('Pimpinan Fakultas & Pascasarjana'),
        ...buildUpaCluster('Pimpinan Unit Penunjang Akademik (UPA)'),
        {
          id: 'kbg_akademik',
          nama: 'Kepala Bagian Akademik',
          cluster: 'Pelaksana Administrasi Akademik',
          badge: 'Bagian',
          deskripsi: 'Registrasi, kelulusan, dan pangkalan data Dikti',
          unit_id: 'UN58.5',
          aliases: ['bagianakademik', 'kabagakademik']
        },
        {
          id: 'tim_akademik',
          nama: 'Ketua Tim Bidang Akademik',
          cluster: 'Pelaksana Administrasi Akademik',
          badge: 'Tim Kerja',
          deskripsi: 'Layanan administrasi kurikulum dan kalender akademik',
          unit_id: 'UN58.5',
          aliases: ['timakademik']
        },
        {
          id: 'tgt-perencanaan',
          nama: 'Ketua Tim Bidang Perencanaan',
          cluster: 'Pelaksana Administrasi Akademik',
          badge: 'Tim Kerja',
          deskripsi: 'Penyusunan Rencana Program, Pagu RKAKL & Evaluasi Kinerja (BAKPK)',
          unit_id: 'UN58.5',
          aliases: ['perencanaan', 'timperencanaan']
        },
        {
          id: 'tgt-kerjasama',
          nama: 'Ketua Tim Bidang Kerja Sama',
          cluster: 'Pelaksana Administrasi Akademik',
          badge: 'Tim Kerja',
          deskripsi: 'Fasilitasi nota kesepahaman (MoU), PKS & kemitraan strategis (BAKPK)',
          unit_id: 'UN58.5',
          aliases: ['kerjasama', 'timkerjasama']
        },
        {
          id: 'tgt-lpmpp',
          nama: 'Ketua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)',
          cluster: 'Penjaminan Mutu & Kurikulum',
          badge: 'LPMPP',
          deskripsi: 'Audit Mutu Internal, Kurikulum, Akreditasi & Sertifikasi Dosen',
          unit_id: 'UN58.22',
          aliases: ['lpmpp', 'ketualpmpp']
        }
      ];
    } else if (isWarek2) {
      baseTargets = [
        {
          id: 'tgt-bku',
          nama: 'Kepala Biro Keuangan dan Umum (BKU)',
          cluster: 'Pelaksana Administrasi Keuangan & Umum',
          badge: 'BKU',
          deskripsi: 'Pengelolaan Anggaran, Perbendaharaan, Persuratan, BMN, Kepegawaian & PBJ',
          unit_id: 'UN58.6',
          aliases: ['bku', 'kepalabku']
        },
        ...buildFakultasCluster('Pimpinan Fakultas & Pascasarjana (DIPA, Sarpras & SDM)'),
        ...buildUpaCluster('Pimpinan Unit Penunjang Akademik (UPA)'),
        {
          id: 'kbg_umum',
          nama: 'Kepala Bagian Umum',
          cluster: 'Pelaksana Administrasi Keuangan & Umum',
          badge: 'Bagian',
          deskripsi: 'Koordinasi umum, tata usaha pimpinan, dan administrasi BKU',
          unit_id: 'UN58.6',
          aliases: ['kabagumum', 'bagianumum']
        },
        {
          id: 'tgt-keuangan',
          nama: 'Ketua Tim Keuangan',
          cluster: 'Tim Kerja BKU',
          badge: 'Tim Keuangan',
          deskripsi: 'Perbendaharaan, Realisasi Anggaran, SPM/SP2D & Akuntansi',
          unit_id: 'UN58.6',
          aliases: ['keuangan', 'timkeuangan']
        },
        {
          id: 'tim_kepegawaian',
          nama: 'Ketua Tim Bidang Kepegawaian',
          cluster: 'Tim Kerja BKU',
          badge: 'Tim Kepegawaian',
          deskripsi: 'Layanan kepegawaian, kenaikan pangkat, dan mutasi ASN/PPPK',
          unit_id: 'UN58.6',
          aliases: ['kepegawaian', 'timkepegawaian']
        },
        {
          id: 'tim_kerumahtanggan_bmn',
          nama: 'Ketua Tim Kerumahtanggan dan BMN',
          cluster: 'Tim Kerja BKU',
          badge: 'Tim BMN',
          deskripsi: 'Pengelolaan aset BMN, sarana prasarana, logistik, dan pemeliharaan',
          unit_id: 'UN58.6',
          aliases: ['kerumahtanggaan', 'bmn']
        },
        {
          id: 'tgt-hukum',
          nama: 'Ketua Tim Hukum, Organisasi, dan Ketatalaksanaan',
          cluster: 'Tim Kerja BKU',
          badge: 'Tim HKOK',
          deskripsi: 'Penyusunan produk hukum, advokasi, tatalaksana organisasi & reformasi birokrasi',
          unit_id: 'UN58.6',
          aliases: ['hukum', 'organisasi', 'ketatalaksanaan']
        },
        {
          id: 'tgt-humas',
          nama: 'Ketua Tim Keprotokolan dan Humas',
          cluster: 'Tim Kerja BKU',
          badge: 'Tim Humas',
          deskripsi: 'Keprotokolan pimpinan, humas publikasi, dan dokumentasi dinas',
          unit_id: 'UN58.6',
          aliases: ['keprotokolan', 'humas']
        }
      ];
    } else if (isWarek3) {
      baseTargets = [
        {
          id: 'tgt-bakpk',
          nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)',
          cluster: 'Pelaksana Administrasi Kemahasiswaan',
          badge: 'BAKPK',
          deskripsi: 'Administrasi Kemahasiswaan & Alumni',
          unit_id: 'UN58.5',
          aliases: ['bakpk', 'kepalabakpk']
        },
        ...buildFakultasCluster('Pimpinan Fakultas & Pascasarjana (Ormawa & Kemahasiswaan)'),
        ...buildUpaCluster('Pimpinan Unit Penunjang Akademik (UPA)'),
        {
          id: 'tim_kemahasiswaan',
          nama: 'Ketua Tim Bidang Kemahasiswaan dan Alumni',
          cluster: 'Tim Kerja Kemahasiswaan',
          badge: 'Kemahasiswaan',
          deskripsi: 'Beasiswa, ormawa, dan tracer study alumni',
          unit_id: 'UN58.5',
          aliases: ['timkemahasiswaan', 'alumni']
        }
      ];
    } else {
      // Fallback Wakil Rektor Umum
      baseTargets = [
        {
          id: 'tgt-bku',
          nama: 'Kepala Biro Keuangan dan Umum (BKU)',
          cluster: 'Pimpinan Biro',
          badge: 'BKU',
          deskripsi: 'Pengelolaan Anggaran, Perbendaharaan & Umum',
          unit_id: 'UN58.6'
        },
        {
          id: 'tgt-bakpk',
          nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)',
          cluster: 'Pimpinan Biro',
          badge: 'BAKPK',
          deskripsi: 'Administrasi Akademik & Kemahasiswaan',
          unit_id: 'UN58.5'
        },
        ...buildFakultasCluster('Pimpinan Fakultas & Pascasarjana'),
        ...buildUpaCluster('Pimpinan Unit Penunjang Akademik (UPA)'),
        {
          id: 'tgt-lppm',
          nama: 'Ketua Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)',
          cluster: 'Pimpinan Lembaga',
          badge: 'LPPM',
          deskripsi: 'Riset, Publikasi & Pengabdian Masyarakat',
          unit_id: 'UN58.21'
        },
        {
          id: 'tgt-lpmpp',
          nama: 'Ketua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)',
          cluster: 'Pimpinan Lembaga',
          badge: 'LPMPP',
          deskripsi: 'Penjaminan Mutu & Kurikulum',
          unit_id: 'UN58.22'
        }
      ];
    }
  } else if (
    jabatan.includes('wakil dekan') ||
    jabatan.includes('wadek') ||
    currentUser?.role === 'WADEK'
  ) {
    const unitTag = unitName.includes('fkip') ? 'FKIP' : unitName.includes('ft') || unitName.includes('teknik') ? 'FT' : 'Fakultas';
    baseTargets = [
      { id: 'kajur-wadek', nama: `Ketua Jurusan / Koordinator Program Studi (${unitTag})`, deskripsi: 'Penyelenggaraan Tridharma & Kurikulum Prodi', badge: 'Jurusan' },
      { id: 'ktu-wadek', nama: `Kepala Bagian / Subbagian Tata Usaha (${unitTag})`, deskripsi: 'Ketatausahaan, Persuratan & Pengelolaan Berkas', badge: 'Tata Usaha' },
      { id: 'lab-wadek', nama: `Kepala Laboratorium Terpadu (${unitTag})`, deskripsi: 'Praktikum, Fasilitas Riset & Pengujian', badge: 'Lab' },
      { id: 'dosen-wadek', nama: `Tim Dosen & Staf Pelaksana (${unitTag})`, deskripsi: 'Pelaksana Kegiatan Teknis Tridharma & Administrasi', badge: 'Pelaksana' }
    ];
  } else if (
    jabatan.includes('dekan') ||
    jabatan.includes('direktur') ||
    unitName.includes('fakultas') ||
    unitName.includes('pascasarjana')
  ) {
    const facultyUnit =
      activeUnitsMap.get(String(unitId).toUpperCase()) ||
      activeUnits.find(
        (u) =>
          u &&
          (u.kode_unit === unitId ||
            (u.singkatan && unitName.includes(u.singkatan.toLowerCase())) ||
            (u.nama_unit && unitName.includes(u.nama_unit.toLowerCase())))
      );
    const unitTag = facultyUnit?.singkatan || (unitName.includes('fkip') ? 'FKIP' : unitName.includes('ft') || unitName.includes('teknik') ? 'FT' : 'Fakultas');
    const facultyJurusanList = Array.isArray(facultyUnit?.jurusan) ? facultyUnit.jurusan : [];
    const kajurTargets =
      facultyJurusanList.length > 0
        ? facultyJurusanList.map((j) => ({
            id: `tgt-kajur-${String(j.kode || j.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            nama: `Ketua Jurusan / Koordinator Prodi ${j.nama} (${unitTag})`,
            deskripsi: `Penyelenggaraan Tridharma & Kurikulum Prodi ${j.nama}`,
            badge: j.kode || 'Prodi',
            unit_id: facultyUnit?.kode_unit || unitId,
            aliases: [j.nama?.toLowerCase(), j.kode?.toLowerCase()].filter(Boolean)
          }))
        : [{ id: 'kajur-1', nama: `Ketua Jurusan / Koordinator Program Studi (${unitTag})`, deskripsi: 'Penyelenggaraan Tridharma & Kurikulum Prodi', badge: 'Jurusan' }];

    baseTargets = [
      { id: 'wadek-1', nama: `Wakil Dekan Bidang Akademik (${unitTag})`, deskripsi: 'Koordinasi Kurikulum, Perkuliahan & Penjaminan Mutu', badge: 'Pimpinan' },
      { id: 'wadek-2', nama: `Wakil Dekan Bidang Keuangan dan Umum (${unitTag})`, deskripsi: 'Koordinasi Keuangan, Sarana Prasarana & Kepegawaian', badge: 'Pimpinan' },
      { id: 'wadek-3', nama: `Wakil Dekan Bidang Kemahasiswaan & Alumni (${unitTag})`, deskripsi: 'Koordinasi Organisasi Mahasiswa, Prestasi & Alumni', badge: 'Pimpinan' },
      ...kajurTargets,
      { id: 'ktu-fak', nama: `Kepala Bagian Tata Usaha (${unitTag})`, deskripsi: 'Ketatausahaan, Persuratan & Pengelolaan Berkas', badge: 'Tata Usaha' },
      { id: 'gpm-fak', nama: `Ketua Tim Gugus Penjaminan Mutu (GPM ${unitTag})`, deskripsi: 'Audit Internal Mutu Pembelajaran Fakultas', badge: 'GPM' },
      { id: 'lab-fak', nama: `Kepala Laboratorium Terpadu (${unitTag})`, deskripsi: 'Praktikum, Fasilitas Riset & Pengujian', badge: 'Lab' },
      { id: 'dosen-fak', nama: `Tim Dosen & Tenaga Kependidikan (${unitTag})`, deskripsi: 'Pelaksana Teknis Tridharma & Administrasi', badge: 'Pelaksana' }
    ];
  } else if (
    jabatan.includes('jurusan') ||
    jabatan.includes('prodi') ||
    jabatan.includes('kajur') ||
    jabatan.includes('kaprodi')
  ) {
    baseTargets = [
      { id: 'sekjur', nama: 'Sekretaris Jurusan / Program Studi', deskripsi: 'Administrasi Tridharma & Penjadwalan Kuliah', badge: 'Jurusan' },
      { id: 'kalab', nama: 'Kepala / Koordinator Laboratorium Prodi', deskripsi: 'Pengelolaan Praktikum, Alat & Bahan Uji', badge: 'Lab' },
      { id: 'koor-ta', nama: 'Koordinator Skripsi / Tugas Akhir', deskripsi: 'Bimbingan, Seminar Proposal & Sidang Ujian', badge: 'Akademik' },
      { id: 'koor-mbkm', nama: 'Koordinator Kerja Praktik & MBKM', deskripsi: 'Magang Industri, KKN Tematik & Pertukaran Mahasiswa', badge: 'Akademik' },
      { id: 'dosen-homebase', nama: 'Dosen Homebase Program Studi', deskripsi: 'Pengampu Mata Kuliah & Pembimbing Akademik', badge: 'Dosen' },
      { id: 'staf-adm-jurusan', nama: 'Staf Administrasi Akademik Jurusan', deskripsi: 'Pelaksana Surat Menyurat & Pelayanan Mahasiswa', badge: 'Staf' }
    ];
  } else if (unitId === 'UN58.6' || unitName.includes('keuangan dan umum')) {
    baseTargets = BKU_STRUCTURAL_TEAMS;
  } else if (unitId === 'UN58.5' || unitName.includes('bakpk')) {
    baseTargets = [
      { id: 'kbg_akademik', nama: 'Kepala Bagian Akademik', deskripsi: 'Registrasi, kelulusan, dan data pangkalan Dikti', badge: 'Bagian' },
      { id: 'tim_akademik', nama: 'Ketua Tim Bidang Akademik', deskripsi: 'Layanan administrasi kurikulum dan kalender akademik', badge: 'Tim' },
      { id: 'tim_kemahasiswaan', nama: 'Ketua Tim Bidang Kemahasiswaan & Alumni', deskripsi: 'Beasiswa, ormawa, dan tracer study alumni', badge: 'Tim' },
      { id: 'tim_perencanaan', nama: 'Ketua Tim Bidang Perencanaan', deskripsi: 'Renstra, pagu anggaran, dan program kerja', badge: 'Tim' },
      { id: 'tim_kerjasama', nama: 'Ketua Tim Bidang Kerjasama', deskripsi: 'MoU, PKS mitra instansi luar, dan humas kerjasama', badge: 'Tim' }
    ];
  } else if (unitId === 'UN58.SENAT' || unitName.includes('senat') || jabatan.includes('senat')) {
    baseTargets = [
      { id: 'tgt-sekretaris-senat', nama: 'Sekretaris Senat Universitas Siliwangi', deskripsi: 'Koordinasi umum, kearsipan & notulensi sidang Senat', badge: 'Sekretaris', unit_id: 'UN58.SENAT' },
      { id: 'tgt-komisi-1', nama: 'Ketua Komisi I (Akademik) Senat', deskripsi: 'Pertimbangan bidang akademik, kurikulum & guru besar', badge: 'Komisi I', unit_id: 'UN58.SENAT' },
      { id: 'tgt-komisi-2', nama: 'Ketua Komisi II (Keuangan & Sarpras) Senat', deskripsi: 'Pertimbangan anggaran, sarana prasarana & aset', badge: 'Komisi II', unit_id: 'UN58.SENAT' },
      { id: 'tgt-komisi-3', nama: 'Ketua Komisi III (Etik & SDM) Senat', deskripsi: 'Pertimbangan kode etik, integritas akademik & SDM', badge: 'Komisi III', unit_id: 'UN58.SENAT' },
      { id: 'tgt-tu-senat', nama: 'Pengadministrasi Persuratan / Sekretariat Senat', deskripsi: 'Pelaksana teknis surat menyurat dan agenda sidang Senat', badge: 'Sekretariat', unit_id: 'UN58.SENAT' }
    ];
  } else if (unitId === 'UN58.SPI' || unitName.includes('spi')) {
    baseTargets = [
      { id: 'tgt-sekretaris-spi', nama: 'Sekretaris Satuan Pengawas Internal (SPI)', deskripsi: 'Koordinasi umum, kendali mutu & administrasi pengawasan SPI', badge: 'Sekretaris', unit_id: 'UN58.SPI' },
      { id: 'tgt-auditor-keuangan', nama: 'Anggota Tim Pengawas Bidang Keuangan SPI', deskripsi: 'Pemeriksaan operasional, SPJ & kepatuhan keuangan', badge: 'Auditor', unit_id: 'UN58.SPI' },
      { id: 'tgt-auditor-aset', nama: 'Anggota Tim Pengawas Bidang Aset SPI', deskripsi: 'Pemeriksaan sarana prasarana & inventarisasi BMN', badge: 'Auditor', unit_id: 'UN58.SPI' },
      { id: 'tgt-tu-spi', nama: 'Pengadministrasi Persuratan SPI', deskripsi: 'Administrasi kearsipan & surat menyurat SPI', badge: 'Tata Usaha', unit_id: 'UN58.SPI' }
    ];
  } else if (unitName.includes('lppm') || unitName.includes('lpmpp') || unitName.includes('upa')) {
    baseTargets = [
      { id: 'sek_lembaga', nama: 'Sekretaris Lembaga / Koordinator Unit', deskripsi: 'Koordinasi program dan tata kelola unit kerja', badge: 'Sekretaris' },
      { id: 'kapus_1', nama: 'Kepala Pusat / Koordinator Bidang I', deskripsi: 'Program kerja spesifik bidang utama', badge: 'Pusat' },
      { id: 'kapus_2', nama: 'Kepala Pusat / Koordinator Bidang II', deskripsi: 'Program kerja spesifik bidang pendukung', badge: 'Pusat' },
      { id: 'kasubbag_tu', nama: 'Kepala Subbagian / Tata Usaha Unit', deskripsi: 'Administrasi umum, persuratan, dan kearsipan unit', badge: 'Tata Usaha' },
      { id: 'staf_pelaksana', nama: 'Staf Pelaksana Teknis & Fungsional', deskripsi: 'Pelaksana kegiatan dinas operasional unit', badge: 'Pelaksana' }
    ];
  } else {
    baseTargets = BKU_STRUCTURAL_TEAMS;
  }

  // INTEGRASI REAL-TIME DENGAN MANAJEMEN ALUR DISPOSISI (SUPER ADMIN):
  // Membaca aturan delegasi khusus atau status aktif/nonaktif target yang diatur Super Admin
  const fallbackKey = resolveSenderKey(currentUser);
  const specificKey = resolveOfficialSenderKey(
    currentUser?.unit_kerja_id || currentUser?.kode_unit,
    currentUser?.jabatan || currentUser?.roleLabel || currentUser?.sotk_position_label
  );
  const senderKey = specificKey || fallbackKey;
  if (senderKey || fallbackKey) {
    try {
      const configuredTargets = getTargetsForSender(senderKey, fallbackKey);
      if (Array.isArray(configuredTargets) && configuredTargets.length > 0) {
        const statusMap = new Map();
        configuredTargets.forEach((ct) => {
          if (ct && ct.id) {
            statusMap.set(ct.id, ct.enabled !== false);
          }
        });

        // Saring target yang dinonaktifkan oleh Super Admin
        baseTargets = baseTargets.filter((bt) => {
          if (statusMap.has(bt.id)) {
            return statusMap.get(bt.id);
          }
          return true;
        });

        // Update target jika ada modifikasi konfigurasi dari Super Admin (Edit Target)
        const configMap = new Map();
        configuredTargets.forEach((ct) => {
          if (ct && ct.id && ct.isCustom) {
            configMap.set(ct.id, ct);
          }
        });
        baseTargets = baseTargets.map((bt) => {
          if (configMap.has(bt.id)) {
            const ct = configMap.get(bt.id);
            return {
              ...bt,
              nama: ct.nama || bt.nama,
              cluster: ct.cluster || bt.cluster,
              badge: ct.badge || bt.badge,
              unit_id: ct.unit_id !== undefined ? ct.unit_id : bt.unit_id,
              deskripsi: ct.deskripsi !== undefined ? ct.deskripsi : bt.deskripsi,
              roleKey: ct.roleKey || bt.roleKey,
              userId: ct.userId || bt.userId
            };
          }
          return bt;
        });

        // Tambahkan target kustom tambahan yang dibuat Super Admin
        const existingIds = new Set(baseTargets.map((b) => b.id));
        const customTargets = configuredTargets.filter(
          (ct) => ct && ct.isCustom && ct.enabled !== false && !existingIds.has(ct.id)
        );
        if (customTargets.length > 0) {
          baseTargets.push(...customTargets);
        }
      }
    } catch (_) {}
  }

  // INTEGRASI REAL-TIME DENGAN MANAJEMEN PENGGUNA (allUsersList):
  // Menghubungkan setiap opsi tujuan disposisi ke akun riil pejabat aktif yang sedang menjabat di sistem
  if (!Array.isArray(allUsersList) || allUsersList.length === 0) {
    return baseTargets;
  }

  const currentUserId = String(currentUser?.id || currentUser?.id_user || '');
  const normalize = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const mappedUserIds = new Set();

  const enrichedTargets = baseTargets.map((target) => {
    const tNorm = normalize(target.nama);
    const targetUnitId = target.unit_id ? String(target.unit_id) : '';
    const aliases = Array.isArray(target.aliases) ? target.aliases.map(normalize) : [];

    const matchedUser = allUsersList.find((u) => {
      if (!u || isSuperAdminUser(u)) return false;
      const uId = String(u.id || u.id_user || '');
      if (uId && uId === currentUserId) return false;

      const rawJab = String(u.jabatan || u.roleLabel || u.sotk_position_label || '');
      const uJab = normalize(rawJab);
      const uUnit = String(u.unit_kerja_id || u.kode_unit || '');
      const uRole = String(u.role || '').toUpperCase();
      const rawWords = rawJab.toLowerCase().split(/[\s,./_()-]+/).filter(Boolean);

      // 0. Prioritaskan jika target memiliki rujukan langsung userId dari Manajemen Pengguna
      if (target.userId) {
        if (
          String(u.id || '').toLowerCase() === String(target.userId).toLowerCase() ||
          (u.nip && String(u.nip) === String(target.userId))
        ) {
          return true;
        }
      }

      // 1. Klaster 1: Pimpinan Universitas & Organ Pengawas
      if (target.id === 'tgt-wr1') {
        return (
          (uJab.includes('akademik') || uJab.includes('wr1') || uJab.includes('warek1')) &&
          (uJab.includes('wakil') || uJab.includes('warek') || uId === 'usr-warek-01') &&
          !uJab.includes('dekan') &&
          !uJab.includes('wadek')
        );
      }
      if (target.id === 'tgt-wr2') {
        return (
          (uJab.includes('keuangandanumum') || uJab.includes('keuangan') || uJab.includes('wr2') || uJab.includes('warek2')) &&
          (uJab.includes('wakil') || uJab.includes('warek') || uId === 'usr-warek-02' || uId === 'usr-ar-01') &&
          !uJab.includes('dekan') &&
          !uJab.includes('wadek')
        );
      }
      if (target.id === 'tgt-wr3') {
        return (
          (uJab.includes('kemahasiswaan') || uJab.includes('alumni') || uJab.includes('wr3') || uJab.includes('warek3')) &&
          (uJab.includes('wakil') || uJab.includes('warek') || uId === 'usr-warek-03') &&
          !uJab.includes('dekan') &&
          !uJab.includes('wadek')
        );
      }
      if (target.id === 'tgt-senat') {
        return (
          (uUnit === 'UN58.SENAT' || uJab.includes('senat')) &&
          uJab.includes('ketua') &&
          !uJab.includes('sekretaris') &&
          !uJab.includes('komisi') &&
          !uJab.includes('anggota')
        );
      }
      if (target.id === 'tgt-sekretaris-senat') {
        return (
          (uUnit === 'UN58.SENAT' || uJab.includes('senat')) &&
          uJab.includes('sekretaris') &&
          !uJab.includes('spi') &&
          !uJab.includes('jurusan')
        );
      }
      if (target.id === 'tgt-komisi-1') {
        return (uUnit === 'UN58.SENAT' || uJab.includes('senat')) && (uJab.includes('komisi1') || uJab.includes('komisii') || (uJab.includes('akademik') && uJab.includes('komisi')));
      }
      if (target.id === 'tgt-komisi-2') {
        return (uUnit === 'UN58.SENAT' || uJab.includes('senat')) && (uJab.includes('komisi2') || uJab.includes('komisiii') || (uJab.includes('keuangan') && uJab.includes('komisi')));
      }
      if (target.id === 'tgt-komisi-3') {
        return (uUnit === 'UN58.SENAT' || uJab.includes('senat')) && (uJab.includes('komisi3') || uJab.includes('komisiiii') || (uJab.includes('etik') && uJab.includes('komisi')));
      }
      if (target.id === 'tgt-tu-senat') {
        return (uUnit === 'UN58.SENAT' || uJab.includes('senat')) && (uJab.includes('persuratan') || uJab.includes('sekretariat') || uJab.includes('tu'));
      }
      if (target.id === 'tgt-spi') {
        return (
          (uUnit === 'UN58.SPI' || uJab.includes('spi') || uJab.includes('satuanpengawas')) &&
          uJab.includes('ketua') &&
          !uJab.includes('sekretaris') &&
          !uJab.includes('anggota') &&
          !uJab.includes('tim')
        );
      }
      if (target.id === 'tgt-sekretaris-spi') {
        return (
          (uUnit === 'UN58.SPI' || uJab.includes('spi') || uJab.includes('satuanpengawas')) &&
          uJab.includes('sekretaris') &&
          !uJab.includes('senat') &&
          !uJab.includes('jurusan')
        );
      }
      if (target.id === 'tgt-auditor-keuangan') {
        return (uUnit === 'UN58.SPI' || uJab.includes('spi')) && uJab.includes('keuangan');
      }
      if (target.id === 'tgt-auditor-aset') {
        return (uUnit === 'UN58.SPI' || uJab.includes('spi')) && uJab.includes('aset');
      }
      if (target.id === 'tgt-tu-spi') {
        return (uUnit === 'UN58.SPI' || uJab.includes('spi')) && (uJab.includes('persuratan') || uJab.includes('tu'));
      }
      if (target.id === 'tgt-dp' || target.id.startsWith('tgt-organ-')) {
        return (
          targetUnitId &&
          uUnit === targetUnitId &&
          (uJab.includes('ketua') || uJab.includes('pimpinan')) &&
          !uJab.includes('sekretaris') &&
          !uJab.includes('anggota')
        );
      }

      // 2. Klaster 2: Pimpinan Biro
      if (target.id === 'tgt-bku') {
        return (
          (uUnit === 'UN58.6' || uJab.includes('bku') || uJab.includes('birokeuangan')) &&
          (uJab.includes('kepala') || uJab.includes('biro')) &&
          !uJab.includes('hukum') &&
          !uJab.includes('organisasi')
        );
      }
      if (target.id === 'tgt-bakpk') {
        return (
          (uUnit === 'UN58.5' || uJab.includes('bakpk') || uJab.includes('biroakademik')) &&
          (uJab.includes('kepala') || uJab.includes('biro')) &&
          !uJab.includes('perencanaan') &&
          !uJab.includes('tim')
        );
      }
      if (target.id.startsWith('tgt-biro-')) {
        return (
          targetUnitId &&
          uUnit === targetUnitId &&
          (uJab.includes('kepala') || uJab.includes('biro') || uRole === 'PEJABAT' || Boolean(u.is_pejabat))
        );
      }

      // 3. Klaster 3: Pimpinan Lembaga (LPPM, LPMPP)
      if (target.id === 'tgt-lppm') {
        return (
          (uUnit === 'UN58.21' || uJab.includes('lppm')) &&
          (uJab.includes('ketua') || uJab.includes('kepala') || uRole === 'PEJABAT')
        );
      }
      if (target.id === 'tgt-lpmpp') {
        return (
          (uUnit === 'UN58.22' || uJab.includes('lpmpp')) &&
          (uJab.includes('ketua') || uJab.includes('kepala') || uRole === 'PEJABAT')
        );
      }
      if (target.id.startsWith('tgt-lembaga-')) {
        return (
          targetUnitId &&
          uUnit === targetUnitId &&
          (uJab.includes('ketua') || uJab.includes('kepala') || uRole === 'PEJABAT' || Boolean(u.is_pejabat))
        );
      }

      // 4. Klaster 4: Pimpinan Fakultas & Pascasarjana (Dekan & Direktur)
      if (target.id.startsWith('tgt-f') || target.id === 'tgt-pasca' || target.id.startsWith('tgt-fak-')) {
        if (target.id === 'tgt-pasca') {
          return (uUnit === 'UN58.17' || uJab.includes('pasca')) && (uJab.includes('direktur') || uRole === 'PEJABAT');
        }
        // Fakultas: Wajib berstatus Dekan
        const isDekan =
          uJab.includes('dekan') &&
          !uJab.includes('wakildekan') &&
          !uJab.includes('wadek') &&
          !uJab.includes('kajur') &&
          !uJab.includes('kaprodi') &&
          !uJab.includes('sekretaris');
        if (isDekan && targetUnitId && uUnit === targetUnitId) return true;
        if (isDekan) {
          if (target.id === 'tgt-fkip' && (uJab.includes('fkip') || uJab.includes('keguruan'))) return true;
          if (target.id === 'tgt-feb' && (uJab.includes('feb') || uJab.includes('ekonomi'))) return true;
          if (target.id === 'tgt-fp' && (uJab.includes('fp') || uJab.includes('pertanian'))) return true;
          if (target.id === 'tgt-ft' && (uJab.includes('ft') || uJab.includes('teknik'))) return true;
          if (target.id === 'tgt-fai' && (uJab.includes('fai') || uJab.includes('agama'))) return true;
          if (target.id === 'tgt-fik' && (uJab.includes('fik') || uJab.includes('kesehatan'))) return true;
          if (target.id === 'tgt-fisip' && (uJab.includes('fisip') || uJab.includes('sosial'))) return true;
        }
        return false;
      }

      // 4b. Kajur / Kaprodi Spesifik
      if (target.id.startsWith('tgt-kajur-')) {
        if (targetUnitId && uUnit === targetUnitId) {
          const tWords = target.nama.toLowerCase().split(/[\s,./_()-]+/).filter(Boolean);
          const hasProdiMatch = tWords.some((w) => w.length > 3 && uJab.includes(w));
          if (hasProdiMatch || uJab.includes('kajur') || uJab.includes('kaprodi') || uJab.includes('ketuajurusan')) {
            return true;
          }
        }
      }

      // 5. Klaster 5: Pimpinan Unit Penunjang Akademik (UPA)
      if (target.cluster?.includes('Unit Penunjang Akademik')) {
        const isKepalaUPA = uJab.includes('kepala') || uRole === 'PEJABAT' || Boolean(u.is_pejabat);
        if (isKepalaUPA && targetUnitId && uUnit === targetUnitId) {
          if (!uJab.includes('staf') && !uJab.includes('operator')) return true;
        }
        return false;
      }

      // 6. Klaster 6: Penugasan Khusus (Tim Kerja)
      if (target.id === 'tgt-humas') {
        return (
          (uUnit === 'UN58.6' || !uUnit || uUnit === 'UN58') &&
          (uJab.includes('keprotokolan') ||
            (uJab.includes('humas') && (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim'))))
        );
      }
      if (target.id === 'tgt-hukum') {
        return (
          (uUnit === 'UN58.6' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('hukum') &&
          (uJab.includes('tatalaksana') || uJab.includes('ketatalaksanaan') || uJab.includes('organisasi') || uJab.includes('ketua'))
        );
      }
      if (target.id === 'tgt-perencanaan') {
        return (
          (uUnit === 'UN58.5' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('perencanaan') &&
          !uJab.includes('kepalabiro') &&
          !uJab.includes('bakpk')
        );
      }
      if (target.id === 'tgt-keuangan' || target.id === 'tim_keuangan') {
        return (
          (uUnit === 'UN58.6' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('keuangan') &&
          (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim')) &&
          !uJab.includes('kepalabiro') &&
          !uJab.includes('bku') &&
          !uJab.includes('wadek') &&
          !uJab.includes('dekan')
        );
      }
      if (target.id === 'tgt-kepegawaian' || target.id === 'tim_kepegawaian') {
        return (
          (uUnit === 'UN58.6' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('kepegawaian') &&
          (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim')) &&
          !uJab.includes('kepalabiro') &&
          !uJab.includes('bku')
        );
      }
      if (target.id === 'tgt-bmn' || target.id === 'tim_kerumahtanggan_bmn') {
        return (
          (uUnit === 'UN58.6' || !uUnit || uUnit === 'UN58') &&
          (uJab.includes('bmn') || uJab.includes('kerumahtanggaan') || uJab.includes('rumahtangga')) &&
          (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim')) &&
          !uJab.includes('kepalabiro')
        );
      }
      if (target.id === 'tgt-akademik' || target.id === 'tim_akademik') {
        return (
          (uUnit === 'UN58.5' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('akademik') &&
          (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim')) &&
          !uJab.includes('kepalabiro') &&
          !uJab.includes('wakilrektor') &&
          !uJab.includes('warek') &&
          !uJab.includes('dekan')
        );
      }
      if (target.id === 'tgt-kemahasiswaan' || target.id === 'tim_kemahasiswaan') {
        return (
          (uUnit === 'UN58.5' || !uUnit || uUnit === 'UN58') &&
          (uJab.includes('kemahasiswaan') || uJab.includes('alumni')) &&
          (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim')) &&
          !uJab.includes('kepalabiro') &&
          !uJab.includes('wakilrektor') &&
          !uJab.includes('warek') &&
          !uJab.includes('dekan')
        );
      }
      if (target.id === 'tgt-kerjasama' || target.id === 'tim_kerjasama') {
        return (
          (uUnit === 'UN58.5' || !uUnit || uUnit === 'UN58') &&
          (uJab.includes('kerjasama') || uJab.includes('mitra')) &&
          (uJab.includes('ketua') || uJab.includes('koordinator') || uJab.includes('tim')) &&
          !uJab.includes('kepalabiro')
        );
      }
      if (target.id === 'tgt-kbg-akademik' || target.id === 'kbg_akademik') {
        return (
          (uUnit === 'UN58.5' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('akademik') &&
          (uJab.includes('bagian') || uJab.includes('kabag')) &&
          !uJab.includes('tim')
        );
      }
      if (target.id === 'tgt-kbg-umum' || target.id === 'kbg_umum') {
        return (
          (uUnit === 'UN58.6' || !uUnit || uUnit === 'UN58') &&
          uJab.includes('umum') &&
          (uJab.includes('bagian') || uJab.includes('kabag')) &&
          !uJab.includes('tim')
        );
      }

      // 7. Fallback: Pencocokan Berdasarkan Kamus Alias yang Aman
      if (aliases.length > 0) {
        const hasAliasMatch = aliases.some((alias) => {
          if (alias.length <= 4) {
            return rawWords.includes(alias) || uJab === alias;
          }
          return uJab.includes(alias);
        });
        if (hasAliasMatch) return true;
      }

      // 8. Fallback: Nama Posisi Baku Sama Persis
      if (uJab && tNorm && uJab === tNorm) return true;

      return false;
    });

    if (matchedUser) {
      const uId = String(matchedUser.id || matchedUser.id_user || '');
      mappedUserIds.add(uId);
      const uNama = matchedUser.nama_lengkap || matchedUser.name || '';
      const uNip = matchedUser.nip || matchedUser.nip_nik || '-';
      return {
        ...target,
        user_id: uId,
        user_email: matchedUser.email || '',
        user_nip: uNip,
        user_nama: uNama,
        deskripsi: `${uNama} — NIP. ${uNip}`,
        is_active_account: true,
        account_status_label: '[Akun Terhubung]'
      };
    }

    return {
      ...target,
      user_id: null,
      user_email: null,
      user_nip: null,
      user_nama: null,
      deskripsi: target.tupoksi || target.deskripsi || 'Akun pejabat struktural belum terdaftar di Manajemen Pengguna',
      is_active_account: false,
      account_status_label: '[Belum Terhubung]'
    };
  });

  // Tambahkan juga akun pejabat struktural aktif lain dari Manajemen Pengguna yang belum terdaftar di target baku
  allUsersList.forEach((u) => {
    if (!u || isSuperAdminUser(u)) return;
    const uId = String(u.id || u.id_user || '');
    if (!uId || uId === currentUserId) return;
    if (mappedUserIds.has(uId)) return;

    const rawJab = String(u.jabatan || u.roleLabel || u.sotk_position_label || '').toLowerCase();
    const uRole = String(u.role || '').toUpperCase();
    const uSubRole = String(u.subRoleKey || '').toUpperCase();
    const uUnitId = String(u.unit_kerja_id || '').toUpperCase();

    // 1. KAIDAH MUTLAK TATA NASKAH DINAS (Pasal 55 ayat 3 Peraturan Rektor No. 3/2023):
    // Pejabat bawahan (selain Rektor sendiri) DILARANG KERAS mendisposisikan naskah kepada Rektor!
    const isTargetRektor =
      (!rawJab.includes('wakil') && (rawJab.includes('rektor') || uRole === 'REKTOR' || uSubRole === 'REKTOR')) ||
      uId === 'usr-01';

    if (!isRektor && isTargetRektor) {
      return; // DROP! Haram mendisposisikan ke Rektor
    }

    // 2. KAIDAH MUTLAK HIERARKI WAKIL REKTOR:
    // Wakil Rektor dilarang mendisposisikan ke:
    // - Sesama Wakil Rektor (hubungan koordinasi lateral, bukan hierarki komando)
    // - Senat Universitas & Dewan Penyantun (organ pertimbangan universitas)
    // - SPI (organ pengawas independen Rektor)
    if (isWarek) {
      const isTargetWarek =
        rawJab.includes('wakil rektor') ||
        rawJab.includes('warek') ||
        uRole === 'WAREK' ||
        uSubRole.startsWith('WAREK');
      if (isTargetWarek) return;

      const isTargetSenat = rawJab.includes('senat') || uUnitId === 'UN58.SENAT';
      if (isTargetSenat) return;

      const isTargetSpi = rawJab.includes('spi') || rawJab.includes('satuan pengawas') || uUnitId === 'UN58.SPI';
      if (isTargetSpi) return;

      const isTargetDP = rawJab.includes('dewan penyantun') || uUnitId === 'UN58.DP';
      if (isTargetDP) return;
    }

    // 3. KAIDAH MUTLAK DEKAN & PEJABAT FAKULTAS:
    if (jabatan.includes('dekan') || jabatan.includes('direktur')) {
      if (rawJab.includes('wakil rektor') || rawJab.includes('warek') || rawJab.includes('senat') || rawJab.includes('spi')) {
        return;
      }
    }

    const isPejabat =
      Boolean(u.is_pejabat) ||
      u.role === 'PEJABAT' ||
      u.role_slug === 'pimpinan' ||
      String(u.roleLevel || '').toLowerCase().includes('pimpinan') ||
      matchesOfficialDisposisiPosition(u.jabatan || u.roleLabel);

    if (isPejabat) {
      mappedUserIds.add(uId);
      const uJab = u.jabatan || u.roleLabel || 'Pejabat Struktural';
      const uNama = u.nama_lengkap || u.name || '';
      const uNip = u.nip || u.nip_nik || '-';
      enrichedTargets.push({
        id: `usr-${uId}`,
        nama: uJab,
        cluster: 'Pejabat Struktural Terkait',
        deskripsi: `${uNama} — NIP. ${uNip}`,
        badge: u.unit || 'Pejabat',
        user_id: uId,
        user_email: u.email || '',
        user_nip: uNip,
        user_nama: uNama,
        is_active_account: true,
        account_status_label: '[Akun Terhubung]'
      });
    }
  });

  // SANITISASI PENGAMAN AKHIR (Fail-Safe Defense Guard)
  // Menjamin 100% kepatuhan tata naskah dinas tidak ada target atasan / terlarang yang lolos
  const sanitizedTargets = enrichedTargets.filter((tgt) => {
    if (!tgt) return false;
    const tNama = String(tgt.nama || '').toLowerCase();
    const tDesk = String(tgt.deskripsi || '').toLowerCase();
    const tCluster = String(tgt.cluster || '').toLowerCase();
    const tUserId = String(tgt.user_id || '');

    // KAIDAH 1: Jika user bukan Rektor, DILARANG KERAS ada target Rektor
    if (!isRektor) {
      if (
        tUserId === 'usr-01' ||
        tgt.id === 'tgt-rektor' ||
        (tNama.includes('rektor') && !tNama.includes('wakil')) ||
        (tDesk.includes('rektor') && !tDesk.includes('wakil'))
      ) {
        return false;
      }
    }

    // KAIDAH 2: Jika user adalah Wakil Rektor
    if (isWarek) {
      // Dilarang ke sesama Wakil Rektor
      if (tNama.includes('wakil rektor') || tNama.includes('warek')) return false;
      // Dilarang ke Senat & Dewan Penyantun
      if (tNama.includes('senat') || tDesk.includes('senat') || tCluster.includes('senat')) return false;
      if (tNama.includes('dewan penyantun') || tDesk.includes('dewan penyantun')) return false;
      // Dilarang ke SPI
      if (tNama.includes('spi') || tDesk.includes('spi') || tNama.includes('pengawas internal')) return false;
    }

    // KAIDAH 3: Jika user adalah Dekan / Direktur
    if (jabatan.includes('dekan') || jabatan.includes('direktur')) {
      if (tNama.includes('wakil rektor') || tNama.includes('warek')) return false;
      if (tNama.includes('senat') || tNama.includes('spi')) return false;
    }

    return true;
  });

  return sanitizedTargets;
};
