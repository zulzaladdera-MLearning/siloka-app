/**
 * Master Konfigurasi & Matriks Akses Format Naskah Dinas (SILOKA UNSIL)
 * 
 * Mengimplementasikan:
 * - Peraturan Rektor Universitas Siliwangi No. 3 Tahun 2023 Bab III & IV
 * - Tabel 1: Matriks Kewenangan Penandatanganan Naskah Dinas
 * 
 * Aturan Khusus Dosen Biasa Tanpa Jabatan Struktural / Tugas Tambahan (DOSEN_NON_JABATAN):
 * Berdasarkan Peraturan Rektor Universitas Siliwangi No. 3 Tahun 2023 (dokumen sistem siloka_compressed.pdf),
 * fitur "Buat Surat" menyediakan 8 Template Utama + 2 Template Kondisional yang terbagi ke dalam 2 Kategori Akses/Fungsi:
 *
 * 1. KATEGORI TEMPLATE MANDIRI (Ditandatangani Langsung oleh Dosen):
 *    a. Nota Dinas (Pasal 11) — Usulan, laporan singkat, komunikasi internal bawahan ke atasan langsung (Koorprodi/Kajur/Dekan).
 *    b. Laporan (Pasal 26) — Pemberitahuan/pertanggungjawaban pelaksanaan pengajaran, penelitian, pengabdian, atau tugas dinas.
 *    c. Telaah Staf (Pasal 27) — Analisis singkat persoalan akademis/kedinasan beserta usulan solusi/rekomendasi kepada pimpinan.
 *    d. Surat Pernyataan (Pasal 20) — Menyatakan kebenaran suatu hal pribadi kedinasan beserta pertanggungjawabannya.
 *    + Template Kondisional (Sesuai Penugasan/Kejadian):
 *    e. Notula (Pasal 25) — Muncul jika dosen ditunjuk resmi sebagai pencatat/notulis rapat.
 *    f. Berita Acara (Pasal 18) — Muncul jika dosen terlibat dalam pelaksanaan suatu kejadian/kegiatan kedinasan bersama para pihak.
 *
 * 2. KATEGORI TEMPLATE KONSEP / DRAFTING (Diajukan untuk Ditandatangani Pimpinan: Kajur / Dekan / Rektor):
 *    a. Surat Tugas (Pasal 9) [ST Lembar & ST Kolom] — Menyusun draft usulan penugasan kegiatan (pemateri seminar, workshop, pengabdian, penelitian).
 *    b. Surat Dinas (Pasal 12) — Menyusun draft surat korespondensi resmi keluar instansi atau antar-unit.
 *    c. Surat Keterangan (Pasal 19) — Menyusun draft pengajuan penerbitan surat keterangan resmi kedinasan/akademik.
 *    d. Surat Pengantar (Pasal 21) — Menyusun draft pengantar pengiriman berkas atau dokumen.
 */

export type UserRole =
  | 'DOSEN_NON_JABATAN'
  | 'DOSEN'
  | 'PEJABAT'
  | 'DEKAN'
  | 'WADEK'
  | 'KAJUR_KAPRODI'
  | 'REKTOR'
  | 'WAREK'
  | 'KEPALA_BIRO'
  | 'STAFF_TU'
  | 'OPERATOR'
  | 'SUPER_ADMIN'
  | string;

export type LecturerTemplateAccessCategory =
  | 'MANDIRI'
  | 'KONDISIONAL'
  | 'KONSEP_PIMPINAN';

export interface LecturerTemplateSopMeta {
  id: string;
  conceptOrder: number;
  isMainTemplate: boolean; // true = 8 Template Utama, false = 2 Template Kondisional
  accessCategory: LecturerTemplateAccessCategory;
  categoryTitle: string;
  pasalRef: string;
  shortLabel: string;
  signerAuthority: 'DOSEN_MANDIRI' | 'PIMPINAN_BERJENJANG';
  signerBadgeText: string;
  sopDescription: string;
  defaultKlasifikasi: string;
}

export interface DocumentTemplateItem {
  id: string; // Identifier internal naskah (e.g., 'st_lembar', 'pos', 'nd')
  code: string; // Kode naskah baku
  baseLabel: string; // Label bersih naskah dinas (tanpa prefix angka statis)
  category: 'ARAHAN' | 'KORESPONDENSI' | 'KHUSUS' | 'LAPORAN_KAJIAN';
  iconName: string; // Identifier ikon Lucide
  allowedRoles: UserRole[]; // Role yang memiliki wewenang membuat/mengakses
  isUniversityLevel?: boolean; // Eksklusif level universitas (Rektorat/Super Admin)
  description?: string;
}

export interface FormattedTemplateItem extends DocumentTemplateItem {
  displayNumber: number; // Urutan nomor dinamis mulai dari 1
  displayLabel: string; // Label lengkap dengan nomor urut dinamis: "1. Nota Dinas"
  lecturerSopMeta?: LecturerTemplateSopMeta;
}

/**
 * Katalog Resmi 8 Template Utama + 2 Template Kondisional untuk Dosen Biasa (Tanpa Jabatan Struktural)
 * Sesuai Peraturan Rektor UNSIL No. 3 Tahun 2023 (dokumen sistem siloka_compressed.pdf)
 */
export const LECTURER_SOP_TEMPLATE_CATALOG: Record<string, LecturerTemplateSopMeta> = {
  // === 1. KATEGORI TEMPLATE MANDIRI (DITANDATANGANI LANGSUNG OLEH DOSEN) ===
  nd: {
    id: 'nd',
    conceptOrder: 1,
    isMainTemplate: true,
    accessCategory: 'MANDIRI',
    categoryTitle: '1. Kategori Template Mandiri (Ditandatangani Langsung oleh Dosen)',
    pasalRef: 'Pasal 11',
    shortLabel: 'Nota Dinas (Pasal 11)',
    signerAuthority: 'DOSEN_MANDIRI',
    signerBadgeText: 'Mandiri — TTD Langsung Dosen',
    sopDescription:
      'Digunakan dosen untuk menyampaikan usulan, laporan singkat, atau komunikasi internal dari bawahan kepada atasan langsung (Koordinator Program Studi, Ketua Jurusan, atau Dekan).',
    defaultKlasifikasi: 'PP.01.02'
  },
  sper: {
    id: 'sper',
    conceptOrder: 2,
    isMainTemplate: true,
    accessCategory: 'MANDIRI',
    categoryTitle: '1. Kategori Template Mandiri (Ditandatangani Langsung oleh Dosen)',
    pasalRef: 'Pasal 20',
    shortLabel: 'Surat Pernyataan (Pasal 20)',
    signerAuthority: 'DOSEN_MANDIRI',
    signerBadgeText: 'Mandiri — TTD Langsung Dosen',
    sopDescription:
      'Digunakan dosen untuk menyatakan kebenaran suatu hal pribadi kedinasan beserta pertanggungjawabannya.',
    defaultKlasifikasi: 'KP.04.03'
  },
  lap: {
    id: 'lap',
    conceptOrder: 3,
    isMainTemplate: true,
    accessCategory: 'MANDIRI',
    categoryTitle: '1. Kategori Template Mandiri (Ditandatangani Langsung oleh Dosen)',
    pasalRef: 'Pasal 26',
    shortLabel: 'Laporan (Pasal 26)',
    signerAuthority: 'DOSEN_MANDIRI',
    signerBadgeText: 'Mandiri — TTD Langsung Dosen',
    sopDescription:
      'Digunakan dosen untuk memberikan pemberitahuan atau pertanggungjawaban pelaksanaan kegiatan pengajaran, penelitian, pengabdian masyarakat, atau tugas kedinasan.',
    defaultKlasifikasi: 'PP.03.05'
  },
  ts: {
    id: 'ts',
    conceptOrder: 4,
    isMainTemplate: true,
    accessCategory: 'MANDIRI',
    categoryTitle: '1. Kategori Template Mandiri (Ditandatangani Langsung oleh Dosen)',
    pasalRef: 'Pasal 27',
    shortLabel: 'Telaah Staf (Pasal 27)',
    signerAuthority: 'DOSEN_MANDIRI',
    signerBadgeText: 'Mandiri — TTD Langsung Dosen',
    sopDescription:
      'Digunakan dosen untuk menyampaikan analisis singkat mengenai suatu persoalan akademis/kedinasan beserta usulan solusi/rekomendasi kepada pimpinan.',
    defaultKlasifikasi: 'PR.00.02'
  },

  // === 1B. TEMPLATE KONDISIONAL (SESUAI PENUGASAN / KEJADIAN) ===
  ba: {
    id: 'ba',
    conceptOrder: 5,
    isMainTemplate: false,
    accessCategory: 'KONDISIONAL',
    categoryTitle: '1b. Template Kondisional (Sesuai Penugasan/Kejadian)',
    pasalRef: 'Pasal 18',
    shortLabel: 'Berita Acara (Pasal 18 - Kondisional)',
    signerAuthority: 'DOSEN_MANDIRI',
    signerBadgeText: 'Kondisional — Pelaksanaan Kegiatan Bersama Para Pihak',
    sopDescription:
      'Muncul dan digunakan jika dosen terlibat dalam pelaksanaan suatu kejadian atau kegiatan kedinasan bersama para pihak.',
    defaultKlasifikasi: 'PP.03.05'
  },
  notula: {
    id: 'notula',
    conceptOrder: 6,
    isMainTemplate: false,
    accessCategory: 'KONDISIONAL',
    categoryTitle: '1b. Template Kondisional (Sesuai Penugasan/Kejadian)',
    pasalRef: 'Pasal 25',
    shortLabel: 'Notula (Pasal 25 - Kondisional)',
    signerAuthority: 'DOSEN_MANDIRI',
    signerBadgeText: 'Kondisional — Dosen sebagai Notulis Rapat',
    sopDescription:
      'Muncul dan digunakan jika dosen ditunjuk resmi sebagai pencatat/notulis rapat akademik atau kedinasan.',
    defaultKlasifikasi: 'HM.00.01'
  },

  // === 2. KATEGORI TEMPLATE KONSEP / DRAFTING (DIAJUKAN UNTUK DITANDATANGANI PIMPINAN) ===
  st_lembar: {
    id: 'st_lembar',
    conceptOrder: 7,
    isMainTemplate: true,
    accessCategory: 'KONSEP_PIMPINAN',
    categoryTitle: '2. Kategori Template Konsep / Drafting (Diajukan TTD Pimpinan)',
    pasalRef: 'Pasal 9',
    shortLabel: 'ST (Lembar) (Pasal 9)',
    signerAuthority: 'PIMPINAN_BERJENJANG',
    signerBadgeText: 'Konsep/Drafting — Diajukan TTD Pimpinan (Kajur/Dekan/Rektor)',
    sopDescription:
      'Untuk menyusun draft usulan penugasan kegiatan perorangan (pemateri seminar, workshop, pengabdian, atau penelitian) yang diajukan melalui paraf berjenjang hingga ditandatangani Pimpinan.',
    defaultKlasifikasi: 'KP.05.00'
  },
  st_kolom: {
    id: 'st_kolom',
    conceptOrder: 8,
    isMainTemplate: true,
    accessCategory: 'KONSEP_PIMPINAN',
    categoryTitle: '2. Kategori Template Konsep / Drafting (Diajukan TTD Pimpinan)',
    pasalRef: 'Pasal 9',
    shortLabel: 'ST (Kolom) (Pasal 9)',
    signerAuthority: 'PIMPINAN_BERJENJANG',
    signerBadgeText: 'Konsep/Drafting — Diajukan TTD Pimpinan (Kajur/Dekan/Rektor)',
    sopDescription:
      'Untuk menyusun draft usulan penugasan kegiatan kolektif/tim (seminar, workshop, pengabdian, atau penelitian) yang diajukan melalui paraf berjenjang hingga ditandatangani Pimpinan.',
    defaultKlasifikasi: 'KP.05.00'
  },
  sd: {
    id: 'sd',
    conceptOrder: 9,
    isMainTemplate: true,
    accessCategory: 'KONSEP_PIMPINAN',
    categoryTitle: '2. Kategori Template Konsep / Drafting (Diajukan TTD Pimpinan)',
    pasalRef: 'Pasal 12',
    shortLabel: 'Surat Dinas (Pasal 12)',
    signerAuthority: 'PIMPINAN_BERJENJANG',
    signerBadgeText: 'Konsep/Drafting — Diajukan TTD Pimpinan (Kajur/Dekan/Rektor)',
    sopDescription:
      'Untuk menyusun draft surat korespondensi resmi keluar instansi atau antar-unit yang bergerak melalui alur verifikasi (paraf berjenjang) hingga ditandatangani Pimpinan.',
    defaultKlasifikasi: 'PP.03.05'
  },
  sket: {
    id: 'sket',
    conceptOrder: 10,
    isMainTemplate: true,
    accessCategory: 'KONSEP_PIMPINAN',
    categoryTitle: '2. Kategori Template Konsep / Drafting (Diajukan TTD Pimpinan)',
    pasalRef: 'Pasal 19',
    shortLabel: 'Surat Keterangan (Pasal 19)',
    signerAuthority: 'PIMPINAN_BERJENJANG',
    signerBadgeText: 'Konsep/Drafting — Diajukan TTD Pimpinan (Kajur/Dekan/Rektor)',
    sopDescription:
      'Untuk menyusun draft pengajuan penerbitan surat keterangan resmi kedinasan/akademik untuk ditandatangani oleh Pimpinan.',
    defaultKlasifikasi: 'PP.00.03'
  },
  speng: {
    id: 'speng',
    conceptOrder: 11,
    isMainTemplate: true,
    accessCategory: 'KONSEP_PIMPINAN',
    categoryTitle: '2. Kategori Template Konsep / Drafting (Diajukan TTD Pimpinan)',
    pasalRef: 'Pasal 21',
    shortLabel: 'Surat Pengantar (Pasal 21)',
    signerAuthority: 'PIMPINAN_BERJENJANG',
    signerBadgeText: 'Konsep/Drafting — Diajukan TTD Pimpinan (Kajur/Dekan/Rektor)',
    sopDescription:
      'Untuk menyusun draft pengantar pengiriman berkas atau dokumen kedinasan untuk ditandatangani oleh Pimpinan.',
    defaultKlasifikasi: 'HM.00.00'
  }
};

// Urutan kanonik template Dosen Tanpa Jabatan:
// 1. Nota Dinas (nd)
// 2. Surat Pernyataan (sper)
// 3. Laporan (lap)
// 4. Telaah Staf (ts)
// 5. Berita Acara (ba)
// 6. Notula (notula)
// 7. ST (Lembar) (st_lembar)
// 8. ST (Kolom) (st_kolom)
// 9. Surat Dinas (sd)
// 10. Surat Keterangan (sket)
// 11. Surat Pengantar (speng)
export const LECTURER_MAIN_TEMPLATE_IDS = [
  'nd',        // 1. Nota Dinas (Pasal 11) — Mandiri
  'sper',      // 2. Surat Pernyataan (Pasal 20) — Mandiri
  'lap',       // 3. Laporan (Pasal 26) — Mandiri
  'ts',        // 4. Telaah Staf (Pasal 27) — Mandiri
  'st_lembar', // 7. ST (Lembar) (Pasal 9) — Konsep/Drafting Pimpinan
  'st_kolom',  // 8. ST (Kolom) (Pasal 9) — Konsep/Drafting Pimpinan
  'sd',        // 9. Surat Dinas (Pasal 12) — Konsep/Drafting Pimpinan
  'sket',      // 10. Surat Keterangan (Pasal 19) — Konsep/Drafting Pimpinan
  'speng'      // 11. Surat Pengantar (Pasal 21) — Konsep/Drafting Pimpinan
] as const;

export const LECTURER_CONDITIONAL_TEMPLATE_IDS = [
  'ba',        // 5. Berita Acara (Pasal 18) — Kondisional
  'notula'     // 6. Notula (Pasal 25) — Kondisional
] as const;

export const LECTURER_ALLOWED_TEMPLATE_IDS = [
  // 1. Kategori Mandiri (Ditandatangani Langsung oleh Dosen)
  'nd',        // 1. Nota Dinas
  'sper',      // 2. Surat Pernyataan
  'lap',       // 3. Laporan
  'ts',        // 4. Telaah Staf
  // 1b. Template Kondisional (Sesuai Penugasan/Kejadian)
  'ba',        // 5. Berita Acara
  'notula',    // 6. Notula
  // 2. Kategori Konsep / Drafting (Diajukan untuk Ditandatangani Pimpinan)
  'st_lembar', // 7. ST (Lembar)
  'st_kolom',  // 8. ST (Kolom)
  'sd',        // 9. Surat Dinas
  'sket',      // 10. Surat Keterangan
  'speng'      // 11. Surat Pengantar
] as const;

export function getLecturerTemplateSopMetadata(templateId: string): any | null {
  const base = LECTURER_SOP_TEMPLATE_CATALOG[templateId];
  if (!base) return null;
  return {
    ...base,
    pasal: base.pasalRef,
    shortName: base.shortLabel,
    description: base.sopDescription,
    signerMechanism: base.signerBadgeText,
    isDirectLecturerSignature: base.signerAuthority === 'DOSEN_MANDIRI',
    isDraftForLeader: base.signerAuthority === 'PIMPINAN_BERJENJANG',
    isConditional: base.accessCategory === 'KONDISIONAL_PENUGASAN' || !base.isMainTemplate
  };
}

/**
 * Master daftar template naskah dinas resmi UNSIL
 */
export const DOCUMENT_TEMPLATES: DocumentTemplateItem[] = [
  {
    id: 'pos',
    code: 'POS',
    baseLabel: 'POS/SOP',
    category: 'ARAHAN',
    iconName: 'Layers',
    // Tabel 1 No. 3 Hal. 88: Rektor (√), Warek (-), Dekan (√), Kepala Biro (√)
    allowedRoles: ['REKTOR', 'DEKAN', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Prosedur Operasional Standar (POS / SOP) — Tabel 1 No. 3 Per. Rektor No. 3/2023'
  },
  {
    id: 'se',
    code: 'SURAT_EDARAN',
    baseLabel: 'Surat Edaran',
    category: 'ARAHAN',
    iconName: 'FileText',
    // Tabel 1 No. 4 Hal. 88 & Pasal 7 ayat (2): Rektor (√*), Warek (-), Dekan (√**)
    allowedRoles: ['REKTOR', 'DEKAN', 'KEPALA_BIRO', 'SUPER_ADMIN'],
    description: 'Surat Edaran pimpinan — Tabel 1 No. 4 & Pasal 7 ayat (2) Per. Rektor No. 3/2023'
  },
  {
    id: 'sk',
    code: 'KEPUTUSAN',
    baseLabel: 'Keputusan Rektor',
    category: 'ARAHAN',
    iconName: 'FileSignature',
    // Tabel 1 No. 5 Hal. 88 & Pasal 8 ayat (3): Eksklusif Rektor (√), Warek (-)
    allowedRoles: ['REKTOR', 'SUPER_ADMIN'],
    isUniversityLevel: true,
    description: 'Keputusan Rektor Universitas Siliwangi — Tabel 1 No. 5 & Pasal 8 ayat (3)'
  },
  {
    id: 'sp',
    code: 'SURAT_PERINTAH',
    baseLabel: 'Surat Perintah',
    category: 'ARAHAN',
    iconName: 'FileCheck',
    // Tabel 1 No. 6 Hal. 88 & Pasal 9 ayat (2): Eksklusif Rektor (√*), Warek (-)
    allowedRoles: ['REKTOR', 'SUPER_ADMIN'],
    isUniversityLevel: true,
    description: 'Surat Perintah pelaksanaan tugas khusus — Tabel 1 No. 6 & Pasal 9 ayat (2)'
  },
  {
    id: 'st_lembar',
    code: 'SURAT_TUGAS_LEMBAR',
    baseLabel: 'ST (Lembar)',
    category: 'ARAHAN',
    iconName: 'UserCheck',
    // Tabel 1 No. 7 Hal. 88: Rektor (√), Warek (√), Dekan (√), Wadek (√)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'REKTOR', 'WAREK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat Tugas dinas format tunggal / perorangan (Contoh 5a)'
  },
  {
    id: 'st_kolom',
    code: 'SURAT_TUGAS_KOLOM',
    baseLabel: 'ST (Kolom)',
    category: 'ARAHAN',
    iconName: 'Users',
    // Tabel 1 No. 7 Hal. 88: Rektor (√), Warek (√)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'REKTOR', 'WAREK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat Tugas dinas format kolektif / rombongan tim (Contoh 5b)'
  },
  {
    id: 'nd',
    code: 'NOTA_DINAS',
    baseLabel: 'Nota Dinas',
    category: 'KORESPONDENSI',
    iconName: 'Mail',
    // Tabel 1 No. 8 Hal. 88: Rektor (√), Warek (√)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'REKTOR', 'WAREK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Komunikasi kedinasan internal antar pejabat atau bawahan ke atasan (Contoh 6)'
  },
  {
    id: 'sd',
    code: 'SURAT_DINAS',
    baseLabel: 'Surat Dinas',
    category: 'KORESPONDENSI',
    iconName: 'Building',
    // Tabel 1 No. 9 Hal. 88: Rektor (√), Warek (√), Dosen Tanpa Jabatan (Konsep/Drafting Pasal 12)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat dinas korespondensi eksternal atau resmi antar instansi (Contoh 7)'
  },
  {
    id: 'undangan_lembar',
    code: 'SURAT_UNDANGAN_LEMBAR',
    baseLabel: 'Undangan (Lembar)',
    category: 'KORESPONDENSI',
    iconName: 'Mail',
    // Tabel 1 No. 10 Hal. 88: Rektor (√), Warek (-), Dekan (√)
    allowedRoles: ['PEJABAT', 'REKTOR', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat undangan resmi format lembaran standar — Tabel 1 No. 10 (Contoh 8a)'
  },
  {
    id: 'undangan_kartu',
    code: 'SURAT_UNDANGAN_KARTU',
    baseLabel: 'Undangan (Kartu)',
    category: 'KORESPONDENSI',
    iconName: 'CreditCard',
    // Tabel 1 No. 10 Hal. 88: Rektor (√), Warek (-), Dekan (√)
    allowedRoles: ['PEJABAT', 'REKTOR', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat undangan resmi format kartu seremonial — Tabel 1 No. 10 (Contoh 8c)'
  },
  {
    id: 'mou',
    code: 'MOU',
    baseLabel: 'Nota Kesepahaman',
    category: 'KHUSUS',
    iconName: 'Handshake',
    // Tabel 1 No. 11 & No. 19b Hal. 88-89: Rektor (√***), Warek (√**** berdasarkan pendelegasian Rektor)
    allowedRoles: ['REKTOR', 'WAREK', 'SUPER_ADMIN'],
    isUniversityLevel: true,
    description: 'Nota Kesepahaman (MoU) tingkat universitas / pendelegasian Rektor (Tabel 1 No. 11 & 19b)'
  },
  {
    id: 'pks',
    code: 'PKS_DN',
    baseLabel: 'PKS Dalam Negeri',
    category: 'KHUSUS',
    iconName: 'Handshake',
    // Tabel 1 No. 12 Hal. 89: Rektor (√), Warek (√), Dekan (√)
    allowedRoles: ['PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'SUPER_ADMIN'],
    description: 'Perjanjian Kerja Sama Dalam Negeri — Tabel 1 No. 12 (Contoh 10)'
  },
  {
    id: 'skua',
    code: 'SURAT_KUASA',
    baseLabel: 'Surat Kuasa',
    category: 'KHUSUS',
    iconName: 'Key',
    // Tabel 1 No. 13 Hal. 89: Rektor (√), Warek (√)
    allowedRoles: ['PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'SUPER_ADMIN'],
    description: 'Surat pelimpahan wewenang atau kuasa kedinasan — Tabel 1 No. 13 (Contoh 11)'
  },
  {
    id: 'ba',
    code: 'BERITA_ACARA',
    baseLabel: 'Berita Acara',
    category: 'KHUSUS',
    iconName: 'FileSpreadsheet',
    // Tabel 1 No. 14 Hal. 89: Rektor (√), Warek (√), Dosen Tanpa Jabatan (Kondisional Pasal 18)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Naskah dinas bukti peristiwa atau kegiatan kedinasan — Tabel 1 No. 14 (Contoh 12)'
  },
  {
    id: 'sket',
    code: 'SURAT_KETERANGAN',
    baseLabel: 'Surat Keterangan',
    category: 'KHUSUS',
    iconName: 'FileBadge',
    // Tabel 1 No. 15 Hal. 89: Rektor (√), Warek (√), Dosen Tanpa Jabatan (Konsep/Drafting Pasal 19)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'REKTOR', 'WAREK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat Keterangan aktif, Tridharma, atau kedinasan — Tabel 1 No. 15 (Contoh 13)'
  },
  {
    id: 'sper',
    code: 'SURAT_PERNYATAAN',
    baseLabel: 'Surat Pernyataan',
    category: 'KHUSUS',
    iconName: 'PenTool',
    // Tabel 1 No. 16 Hal. 89: Rektor (√), Warek (√), Dosen Tanpa Jabatan (Mandiri Pasal 20)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat pernyataan kebenaran hal atau komitmen dinas — Tabel 1 No. 16 (Contoh 14)'
  },
  {
    id: 'speng',
    code: 'SURAT_PENGANTAR',
    baseLabel: 'Surat Pengantar',
    category: 'KHUSUS',
    iconName: 'Send',
    // Tabel 1 No. 17 Hal. 89: Rektor (√), Warek (√), Dosen Tanpa Jabatan (Konsep/Drafting Pasal 21)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Surat pengantar pengiriman dokumen atau berkas — Tabel 1 No. 17 (Contoh 15)'
  },
  {
    id: 'peng',
    code: 'PENGUMUMAN',
    baseLabel: 'Pengumuman',
    category: 'KHUSUS',
    iconName: 'Megaphone',
    // Tabel 1 No. 18 Hal. 89: Rektor (√), Warek (√)
    allowedRoles: ['PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'SUPER_ADMIN'],
    description: 'Naskah dinas pemberitahuan umum sivitas akademika — Tabel 1 No. 18 (Contoh 16)'
  },
  {
    id: 'notula',
    code: 'NOTULA',
    baseLabel: 'Notula',
    category: 'KHUSUS',
    iconName: 'ClipboardList',
    // Tabel 1 No. 20 Hal. 89: Rektor (√), Warek (√), Dosen Tanpa Jabatan (Kondisional Pasal 25)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Catatan ringkas resmi jalannya sidang atau rapat kedinasan — Tabel 1 No. 20 (Contoh 17)'
  },
  {
    id: 'lap',
    code: 'LAPORAN',
    baseLabel: 'Laporan',
    category: 'LAPORAN_KAJIAN',
    iconName: 'FileBarChart',
    // Pasal 24 huruf b & Pasal 26: Rektor (√), Warek (√)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'REKTOR', 'WAREK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Laporan pertanggungjawaban kegiatan kedinasan / Tridharma — Pasal 26 (Contoh 18)'
  },
  {
    id: 'ts',
    code: 'TELAAH_STAF',
    baseLabel: 'Telaah Staf',
    category: 'LAPORAN_KAJIAN',
    iconName: 'FileSearch',
    // Pasal 24 huruf c & Pasal 27: Rektor (√), Warek (√)
    allowedRoles: ['DOSEN_NON_JABATAN', 'DOSEN', 'PEJABAT', 'DEKAN', 'WADEK', 'KAJUR_KAPRODI', 'REKTOR', 'WAREK', 'KEPALA_BIRO', 'STAFF_TU', 'SUPER_ADMIN'],
    description: 'Analisis, kajian masalah, dan saran rekomendasi opsi kebijakan — Pasal 27 (Contoh 19)'
  },
  {
    id: 'disp_rektor',
    code: 'DISPOSISI_REKTOR',
    baseLabel: 'Disposisi Rektor',
    category: 'KHUSUS',
    iconName: 'SendHorizontal',
    // Pasal 55 ayat (3) & Contoh 21 Hal. 84: Eksklusif Rektor
    allowedRoles: ['REKTOR', 'SUPER_ADMIN'],
    isUniversityLevel: true,
    description: 'Lembar disposisi pimpinan tertinggi universitas — Pasal 55 ayat (3) (Contoh 21)'
  },
  {
    id: 'tte_doc',
    code: 'PENGGUNAAN_TTE',
    baseLabel: 'Penggunaan TTE',
    category: 'KHUSUS',
    iconName: 'QrCode',
    // Pasal 61 & Contoh 20 Hal. 81: Rektor (√), Warek (√)
    allowedRoles: ['PEJABAT', 'REKTOR', 'WAREK', 'DEKAN', 'WADEK', 'KEPALA_BIRO', 'SUPER_ADMIN'],
    description: 'Dokumen naskah bersertifikasi Tanda Tangan Elektronik (BSrE) — Pasal 61 (Contoh 20)'
  }
];

export interface RektoratSopProfile {
  subRoleKey: 'REKTOR' | 'WAREK_1' | 'WAREK_2' | 'WAREK_3' | null;
  canonicalRole: 'REKTOR' | 'WAREK' | null;
  officialTitle: string;
  signerTitle: string;
  signerTitleAnRektor: string;
  officialName: string;
  officialNip: string;
  kodeUnit: string;
  authorizedCount: number;
  sopLegalReference: string;
  defaultClassificationByTemplate: Record<string, string>;
  bidangFocusLabel: string;
}

/**
 * Mengidentifikasi profil SOP spesifik bagi akun Rektor dan Wakil Rektor (Warek I, II, III)
 * Merujuk pada:
 * 1. Peraturan Rektor UNSIL No. 3 Tahun 2023 (Tabel 1 Hal. 88-89, Pasal 30(2), Pasal 45, Hal. 74)
 * 2. SK Rektor UNSIL No. 2803 Tahun 2023 beserta Lampiran Klasifikasi Arsip, JRA & SKKAAD
 */
export function getRektoratOfficialSopProfile(user: any): RektoratSopProfile | null {
  if (!user || typeof user !== 'object') return null;

  const normalizedRole = normalizeUserRole(user);
  if (normalizedRole !== 'REKTOR' && normalizedRole !== 'WAREK') {
    return null;
  }

  const combinedPosition = [
    user.jabatan,
    user.nama_jabatan,
    user.role_label,
    user.roleLabel,
    user.sotk_position,
    user.sotk_position_label
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const userName = user.nama_lengkap || user.name || user.nama_gelar || '';
  const userNip = user.nip || user.nip_nik || '';

  if (normalizedRole === 'REKTOR') {
    return {
      subRoleKey: 'REKTOR',
      canonicalRole: 'REKTOR',
      officialTitle: 'Rektor Universitas Siliwangi',
      signerTitle: 'Rektor,',
      signerTitleAnRektor: 'Rektor Universitas Siliwangi,',
      officialName: userName || 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      officialNip: userNip || '196708161996031001',
      kodeUnit: 'UN58',
      authorizedCount: 23,
      sopLegalReference:
        'Tabel 1 Kolom 3 (Hal. 88–89) & Pasal 30 ayat (2) Peraturan Rektor UNSIL No. 3/2023 + SK Rektor No. 2803/2023',
      bidangFocusLabel: 'Pimpinan Tertinggi Universitas (Seluruh Rumpun Substantif & Fasilitatif UN58)',
      defaultClassificationByTemplate: {
        pos: 'OT.01.01',
        se: 'OT.00.01',
        sk: 'OT.01.00',
        sp: 'KP.05.00',
        st_lembar: 'KP.05.00',
        st_kolom: 'KP.05.00',
        nd: 'PR.00.02',
        sd: 'KU.01.03', // Contoh Resmi Nomor Surat Rektor Hal. 74: 1/UN58/B/KU.01.03/2022
        undangan_lembar: 'HM.00.01',
        undangan_kartu: 'HM.01.00',
        mou: 'HM.02.00',
        pks: 'HM.02.00',
        skua: 'HK.04.00',
        ba: 'PL.02.01',
        sket: 'KP.05.01',
        sper: 'KU.01.04',
        speng: 'HM.00.00',
        peng: 'HM.01.01',
        notula: 'HM.00.01',
        lap: 'PR.04.01',
        ts: 'OT.01.00',
        disp_rektor: 'HM.00.00',
        tte_doc: 'TI.01.00'
      }
    };
  }

  // WAKIL REKTOR: Bedakan Bidang Akademik (Warek I), Keuangan & Umum (Warek II), Kemahasiswaan & Alumni (Warek III)
  if (combinedPosition.includes('keuangan') || combinedPosition.includes('umum') || combinedPosition.includes('warek ii') || combinedPosition.includes('warek 2')) {
    return {
      subRoleKey: 'WAREK_2',
      canonicalRole: 'WAREK',
      officialTitle: 'Wakil Rektor Bidang Keuangan dan Umum',
      signerTitle: 'Wakil Rektor Bidang Keuangan dan Umum,',
      signerTitleAnRektor: 'a.n. Rektor\nWakil Rektor Bidang Keuangan dan Umum,',
      officialName: userName || 'Dr. Gumilar Mulya, M.Pd.',
      officialNip: userNip || '197302212001121001',
      kodeUnit: 'UN58',
      authorizedCount: 16,
      sopLegalReference:
        'Tabel 1 Kolom 7 (Hal. 88–89) & Contoh Nomor Surat Warek Hal. 74 Peraturan Rektor UNSIL No. 3/2023 + SK Rektor No. 2803/2023',
      bidangFocusLabel: 'Bidang Keuangan, Kepegawaian, Kerumahtanggaan, Perlengkapan/BMN & Umum (Rumpun KU, KP, KR, PL, HK, OT)',
      defaultClassificationByTemplate: {
        st_lembar: 'KP.05.00',
        st_kolom: 'KP.05.00',
        nd: 'KU.01.04',
        sd: 'KU.01.04',
        mou: 'HM.02.00',
        pks: 'PL.02.00',
        skua: 'KU.01.03',
        ba: 'PL.02.01',
        sket: 'KP.04.03', // Usul Kenaikan Pangkat / Kepegawaian
        sper: 'KU.01.04',
        speng: 'KU.01.04',
        peng: 'KP.01.00',
        notula: 'KU.00.01',
        lap: 'KU.04.01',
        ts: 'KP.04.03',
        tte_doc: 'TI.01.00'
      }
    };
  }

  if (combinedPosition.includes('kemahasiswaan') || combinedPosition.includes('alumni') || combinedPosition.includes('warek iii') || combinedPosition.includes('warek 3')) {
    return {
      subRoleKey: 'WAREK_3',
      canonicalRole: 'WAREK',
      officialTitle: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
      signerTitle: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni,',
      signerTitleAnRektor: 'a.n. Rektor\nWakil Rektor Bidang Kemahasiswaan dan Alumni,',
      officialName: userName || 'Dr. Supratman, M.Pd.',
      officialNip: userNip || '197204121998021001',
      kodeUnit: 'UN58',
      authorizedCount: 16,
      sopLegalReference:
        'Tabel 1 Kolom 7 (Hal. 88–89) & Contoh Nomor Surat Warek Hal. 74 Peraturan Rektor UNSIL No. 3/2023 + SK Rektor No. 2803/2023',
      bidangFocusLabel: 'Bidang Kemahasiswaan, Beasiswa, Organisasi Mahasiswa, Prestasi & Alumni (Rumpun KM & HM)',
      defaultClassificationByTemplate: {
        st_lembar: 'KM.01.00',
        st_kolom: 'KM.01.00',
        nd: 'KM.01.00',
        sd: 'KM.02.00',
        mou: 'HM.02.00',
        pks: 'HM.02.00',
        skua: 'KM.01.00',
        ba: 'KM.04.00',
        sket: 'KM.04.00',
        sper: 'KM.02.00',
        speng: 'KM.01.00',
        peng: 'KM.02.00',
        notula: 'KM.01.00',
        lap: 'KM.04.00',
        ts: 'KM.01.00',
        tte_doc: 'TI.01.00'
      }
    };
  }

  // Default Wakil Rektor -> Wakil Rektor Bidang Akademik (Warek I)
  return {
    subRoleKey: 'WAREK_1',
    canonicalRole: 'WAREK',
    officialTitle: 'Wakil Rektor Bidang Akademik',
    signerTitle: 'Wakil Rektor Bidang Akademik,',
    signerTitleAnRektor: 'a.n. Rektor\nWakil Rektor Bidang Akademik,',
    officialName: userName || 'Prof. Dr. Dedi Nurjamil, M.Pd.',
    officialNip: userNip || '197005141997021001',
    kodeUnit: 'UN58',
    authorizedCount: 16,
    sopLegalReference:
      'Tabel 1 Kolom 7 (Hal. 88–89) & Contoh Nomor Surat Warek Hal. 74 Peraturan Rektor UNSIL No. 3/2023 + SK Rektor No. 2803/2023',
    bidangFocusLabel: 'Bidang Akademik, Pendidikan, PMB, Kurikulum, Penelitian & Pengabdian (Rumpun PP, PM, PR, TI)',
    defaultClassificationByTemplate: {
      st_lembar: 'KP.05.00',
      st_kolom: 'KP.05.00',
      nd: 'PR.00.02',
      sd: 'PR.00.02', // Contoh Resmi Nomor Surat Wakil Rektor Hal. 74: 18/UN58/R/PR.00.02/2022
      mou: 'HM.02.00',
      pks: 'HM.02.00',
      skua: 'PP.00.04',
      ba: 'PP.00.04',
      sket: 'PP.03.05',
      sper: 'PP.00.04',
      speng: 'PP.01.02',
      peng: 'PP.00.04', // Naskah Soal / Informasi PMB & Akademik
      notula: 'PP.01.02',
      lap: 'PP.03.05',
      ts: 'PR.00.02',
      tte_doc: 'TI.01.00'
    }
  };
}

/**
 * Normalisasi objek user atau string role ke canonical role system
 */
export function normalizeUserRole(user: any): string {
  if (!user) return 'DOSEN_NON_JABATAN'; // Prinsip least privilege default
  
  if (typeof user === 'string') {
    const rawRole = user.toUpperCase().trim();
    if (rawRole === 'SUPER_ADMIN' || rawRole === 'SUPER ADMIN') return 'SUPER_ADMIN';
    if (
      rawRole === 'DOSEN_NON_JABATAN' ||
      rawRole === 'DOSEN' ||
      rawRole === 'DOSEN_TANPA_JABATAN' ||
      rawRole === 'DOSEN TANPA JABATAN' ||
      rawRole === 'DOSEN (NON-JABATAN)' ||
      rawRole.includes('TANPA JABATAN') ||
      rawRole.includes('NON-JABATAN') ||
      rawRole.includes('DOSEN BIASA')
    ) {
      return 'DOSEN_NON_JABATAN';
    }
    if (rawRole === 'WADEK' || rawRole.includes('WAKIL DEKAN')) return 'WADEK';
    if (rawRole === 'DEKAN' || /\bDEKAN\b/.test(rawRole)) return 'DEKAN';
    if (rawRole === 'KAJUR' || rawRole === 'KAPRODI') return 'KAJUR_KAPRODI';
    if (rawRole === 'WAREK' || rawRole.includes('WAKIL REKTOR')) return 'WAREK';
    if (rawRole === 'REKTOR' || /\bREKTOR\b/.test(rawRole)) return 'REKTOR';
    return rawRole;
  }

  const role = String(user.role || user.id_role || '').toUpperCase().trim();
  const idRoleNum = Number(user.id_role);
  const roleLevel = String(user.roleLevel || user.role_level || '').toLowerCase();

  // Gabungkan seluruh kandidat atribut jabatan struktural / tupoksi pada objek user
  const combinedPosition = [
    user.jabatan,
    user.nama_jabatan,
    user.role_label,
    user.roleLabel,
    user.sotk_position,
    user.sotk_position_label,
    user.tupoksi_role,
    user.tupoksi_label
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (role === 'SUPER_ADMIN' || role === 'SUPER ADMIN' || combinedPosition.includes('super admin')) {
    return 'SUPER_ADMIN';
  }

  const hasStructuralPositionKeyword =
    /\b(rektor|wakil\s+rektor|warek|dekan|wakil\s+dekan|wadek|direktur|ketua\s+lppm|kepala\s+lppm|ketua\s+lpmpp|kepala\s+lpmpp|ketua\s+spi|kepala\s+spi|ketua\s+satuan\s+pengawas|ketua\s+senat|ketua\s+dewan|kepala\s+biro|kepala\s+upa|kepala\s+upt|ketua\s+jurusan|kajur|koordinator\s+program\s+studi|kaprodi|koorprodi|sekretaris\s+lppm|sekretaris\s+lpmpp|sekretaris\s+jurusan|kepala\s+bagian|kabag|kepala\s+subbagian|kasubbag)\b/i.test(
      combinedPosition
    );

  // Deteksi eksplisit Dosen Tanpa Jabatan / Dosen Biasa / Dosen (Non-Jabatan) (id_role = 7)
  if (
    idRoleNum === 7 ||
    role === 'DOSEN_NON_JABATAN' ||
    role === 'DOSEN_TANPA_JABATAN' ||
    role === 'DOSEN TANPA JABATAN' ||
    role === 'DOSEN (NON-JABATAN)' ||
    role === 'DOSEN' ||
    combinedPosition.includes('dosen tanpa jabatan') ||
    combinedPosition.includes('dosen biasa') ||
    combinedPosition.includes('dosen (non-jabatan)') ||
    combinedPosition.includes('tanpa jabatan') ||
    combinedPosition.includes('non-jabatan') ||
    combinedPosition.includes('tanpa tugas tambahan') ||
    (/\bdosen\b/i.test(combinedPosition) && !hasStructuralPositionKeyword)
  ) {
    return 'DOSEN_NON_JABATAN';
  }

  // 1. Deteksi Staf / Operator / Pelaksana terlebih dahulu agar label "Staf ... Rektorat" tidak terdeteksi sebagai "Rektor"
  const isExplicitStaffOrOperator =
    role === 'STAFF_TU' ||
    role === 'OPERATOR' ||
    role === 'OPERATOR_UNIT' ||
    role === 'STAF_PERSURATAN' ||
    roleLevel.includes('pelaksana') ||
    /^(staf|operator|analis|arsiparis|pengadministrasi|sekretariat)\b/i.test(combinedPosition.trim());

  if (isExplicitStaffOrOperator && !user.is_pejabat) {
    return 'STAFF_TU';
  }

  // 2. Deteksi Pimpinan Universitas: WAKIL REKTOR wajib diperiksa SEBELUM REKTOR!
  //    Karena string "wakil rektor" mengandung substring "rektor".
  if (
    role === 'WAREK' ||
    /\bwakil\s+rektor\b/i.test(combinedPosition) ||
    /\bwarek\b/i.test(combinedPosition)
  ) {
    return 'WAREK';
  }

  // Gunakan word boundary \brektor\b agar kata "rektorat" tidak salah terdeteksi sebagai "rektor"
  if (role === 'REKTOR' || /\brektor\b/i.test(combinedPosition)) {
    return 'REKTOR';
  }

  // 3. Deteksi Pimpinan Fakultas: WAKIL DEKAN wajib diperiksa SEBELUM DEKAN!
  if (
    role === 'WADEK' ||
    /\bwakil\s+dekan\b/i.test(combinedPosition) ||
    /\bwadek\b/i.test(combinedPosition)
  ) {
    return 'WADEK';
  }

  if (
    role === 'DEKAN' ||
    /\bdekan\b/i.test(combinedPosition) ||
    /\bdirektur\s+program\s+pascasarjana\b/i.test(combinedPosition) ||
    /\bdirektur\s+pascasarjana\b/i.test(combinedPosition)
  ) {
    return 'DEKAN';
  }

  // 4. Deteksi Jurusan / Prodi / Lembaga / Biro
  if (
    role === 'KAJUR' ||
    role === 'KAPRODI' ||
    combinedPosition.includes('ketua jurusan') ||
    combinedPosition.includes('sekretaris jurusan') ||
    combinedPosition.includes('kajur') ||
    combinedPosition.includes('koorprodi') ||
    combinedPosition.includes('koordinator program studi') ||
    combinedPosition.includes('kepala program studi') ||
    combinedPosition.includes('kepala pusat')
  ) {
    return 'KAJUR_KAPRODI';
  }

  if (
    role === 'KEPALA_BIRO' ||
    combinedPosition.includes('kepala biro') ||
    combinedPosition.includes('kepala bagian') ||
    combinedPosition.includes('kepala subbagian') ||
    combinedPosition.includes('ketua lppm') ||
    combinedPosition.includes('kepala lppm') ||
    combinedPosition.includes('sekretaris lppm') ||
    combinedPosition.includes('ketua lpmpp') ||
    combinedPosition.includes('kepala lpmpp') ||
    combinedPosition.includes('sekretaris lpmpp') ||
    combinedPosition.includes('kepala upa') ||
    combinedPosition.includes('ketua senat') ||
    combinedPosition.includes('ketua satuan pengawas') ||
    combinedPosition.includes('ketua dewan penyantun')
  ) {
    return 'KEPALA_BIRO';
  }

  if (Boolean(user.is_pejabat) || role === 'PEJABAT') {
    return 'PEJABAT';
  }

  // Dosen Biasa / Tanpa Jabatan
  if (role === 'DOSEN' || combinedPosition.includes('dosen')) {
    return 'DOSEN_NON_JABATAN';
  }

  // Staf TU / Operator fallback
  if (isExplicitStaffOrOperator || combinedPosition.includes('staf') || combinedPosition.includes('operator')) {
    return 'STAFF_TU';
  }

  return role || 'DOSEN_NON_JABATAN';
}

/**
 * Filter template yang sah berdasarkan pengguna yang sedang aktif
 */
export function getAuthorizedTemplates(
  user: any,
  options?: { includeConditional?: boolean; categoryFilter?: 'ALL' | 'MANDIRI' | 'KONDISIONAL' | 'KONSEP_PIMPINAN' }
): DocumentTemplateItem[] {
  const normalizedRole = normalizeUserRole(user);

  // Super Admin dan Rektor memiliki akses ke seluruh 23 naskah dinas tingkat universitas
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'REKTOR') {
    return [...DOCUMENT_TEMPLATES];
  }

  // DOSEN_NON_JABATAN (Dosen Biasa Tanpa Jabatan Struktural/Tugas Tambahan):
  // Menyediakan 8 Template Utama + 2 Template Kondisional yang terbagi ke dalam:
  // 1. Kategori Template Mandiri (Ditandatangani Langsung oleh Dosen): Nota Dinas (Pasal 11), Laporan (Pasal 26), Telaah Staf (Pasal 27), Surat Pernyataan (Pasal 20)
  //    + Template Kondisional: Notula (Pasal 25), Berita Acara (Pasal 18)
  // 2. Kategori Template Konsep / Drafting (Diajukan TTD Pimpinan): Surat Tugas (Pasal 9 - Lembar & Kolom), Surat Dinas (Pasal 12), Surat Keterangan (Pasal 19), Surat Pengantar (Pasal 21)
  if (normalizedRole === 'DOSEN_NON_JABATAN') {
    const includeConditional = options?.includeConditional !== false;
    const categoryFilter = options?.categoryFilter || 'ALL';

    const orderedIds = LECTURER_ALLOWED_TEMPLATE_IDS.filter((id) => {
      const meta = LECTURER_SOP_TEMPLATE_CATALOG[id];
      if (!meta) return false;
      if (!includeConditional && meta.accessCategory === 'KONDISIONAL') {
        return false;
      }
      if (categoryFilter !== 'ALL' && meta.accessCategory !== categoryFilter) {
        return false;
      }
      return true;
    });

    return orderedIds
      .map((id) => DOCUMENT_TEMPLATES.find((tpl) => tpl.id === id))
      .filter((tpl): tpl is DocumentTemplateItem => Boolean(tpl));
  }

  // Role lain (Wakil Rektor = 16 template, Dekan, Wadek, Kajur, Kepala Biro, dll): filter berdasarkan allowedRoles
  return DOCUMENT_TEMPLATES.filter((tpl) => {
    return (
      tpl.allowedRoles.includes(normalizedRole) ||
      tpl.allowedRoles.includes('ALL')
    );
  });
}

/**
 * Mendapatkan daftar template yang sah dengan penomoran urut dinamis mulai dari 1
 * (Mencegah loncatan angka seperti '5. ST...', '15. Ket...', melainkan urut '1. Nota Dinas', '2. Laporan', dst.)
 */
export function getAuthorizedTemplatesWithNumbering(
  user: any,
  options?: { includeConditional?: boolean; categoryFilter?: 'ALL' | 'MANDIRI' | 'KONDISIONAL' | 'KONSEP_PIMPINAN' }
): FormattedTemplateItem[] {
  const normalizedRole = normalizeUserRole(user);
  const authorized = getAuthorizedTemplates(user, options);

  return authorized.map((tpl, index) => {
    const lecturerSopMeta =
      normalizedRole === 'DOSEN_NON_JABATAN'
        ? getLecturerTemplateSopMetadata(tpl.id) || undefined
        : undefined;

    return {
      ...tpl,
      displayNumber: index + 1,
      displayLabel: `${index + 1}. ${tpl.baseLabel}`,
      lecturerSopMeta
    };
  });
}

/**
 * Memeriksa apakah suatu format template sah untuk user tertentu
 */
export function isTemplateAllowedForUser(templateId: string, user: any): boolean {
  const authorized = getAuthorizedTemplates(user, { includeConditional: true });
  return authorized.some((tpl) => tpl.id === templateId);
}

/**
 * Mendapatkan default template ID yang sah untuk user
 */
export function getDefaultTemplateForUser(user: any): string {
  const normalizedRole = normalizeUserRole(user);
  if (normalizedRole === 'REKTOR') {
    return 'sk'; // Default Rektor: Keputusan Rektor / Surat Dinas / POS sesuai kewenangan tertinggi
  }
  if (normalizedRole === 'WAREK') {
    return 'sd'; // Default Wakil Rektor: Surat Dinas / Surat Tugas sesuai Tabel 1 Kolom 7
  }
  if (normalizedRole === 'DOSEN_NON_JABATAN') {
    return 'nd'; // Default Dosen Tanpa Jabatan: 1. Nota Dinas (Pasal 11) — Kategori Template Mandiri
  }
  const authorized = getAuthorizedTemplates(user);
  return authorized.length > 0 ? authorized[0].id : 'nd';
}

