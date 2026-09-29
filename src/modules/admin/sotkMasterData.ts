/**
 * SOTK Master Data & Organizational Hierarchy (SILOKA UNSIL)
 * 
 * Berdasarkan:
 * 1. Permendikbudristek No. 19/2023 tentang Organisasi dan Tata Kerja Universitas Siliwangi
 * 2. Peraturan Rektor UNSIL No. 3/2023 (Tabel 1 Matriks Kewenangan Penandatanganan Naskah Dinas)
 * 3. Dokumen Resmi "Program Studi di Unsil.pdf" (Ketua Jurusan & Sekretaris Jurusan)
 */

export interface PositionOption {
  id?: string;
  code: string;
  name: string;
  unitGroup: string;
  unitName?: string;
  parentUnitId?: string;
  facultyId?: string;
  level: 'UNIVERSITAS' | 'FAKULTAS' | 'JURUSAN' | 'LEMBAGA' | 'BIRO' | 'LEMBAGA_PUSAT';
  defaultRoleKey?: string;
  canSignPolicy?: boolean;
  isVacant?: boolean;
  currentOccupant?: {
    nama_lengkap: string;
    nip: string;
  } | null;
}

export interface UnitCategoryOption {
  id: string;
  name: string;
  category: 'UNIVERSITAS' | 'FAKULTAS' | 'LEMBAGA' | 'BIRO';
}

export const MASTER_FACULTIES: UnitCategoryOption[] = [
  { id: 'FT', name: 'Fakultas Teknik (FT)', category: 'FAKULTAS' },
  { id: 'FKIP', name: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', category: 'FAKULTAS' },
  { id: 'FEB', name: 'Fakultas Ekonomi dan Bisnis (FEB)', category: 'FAKULTAS' },
  { id: 'FP', name: 'Fakultas Pertanian (FP)', category: 'FAKULTAS' },
  { id: 'FAI', name: 'Fakultas Agama Islam (FAI)', category: 'FAKULTAS' },
  { id: 'FIK', name: 'Fakultas Ilmu Kesehatan (FIK)', category: 'FAKULTAS' },
  { id: 'FISIP', name: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)', category: 'FAKULTAS' },
  { id: 'PASCA', name: 'Program Pascasarjana (PASCA)', category: 'FAKULTAS' },
  { id: 'UNSIL', name: 'Rektorat & Pimpinan Universitas', category: 'UNIVERSITAS' },
  { id: 'LPPM', name: 'Lembaga Penelitian & Pengabdian kepada Masyarakat (LPPM)', category: 'LEMBAGA' },
  { id: 'LPMPP', name: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)', category: 'LEMBAGA' },
  { id: 'SPI', name: 'Satuan Pengawas Internal (SPI)', category: 'LEMBAGA' }
];

export const OTK_UNSIL_UNITS = [
  { kode: 'FT', nama: 'Fakultas Teknik', kategori: 'Fakultas' },
  { kode: 'FKIP', nama: 'Fakultas Keguruan dan Ilmu Pendidikan', kategori: 'Fakultas' },
  { kode: 'FEB', nama: 'Fakultas Ekonomi dan Bisnis', kategori: 'Fakultas' },
  { kode: 'FP', nama: 'Fakultas Pertanian', kategori: 'Fakultas' },
  { kode: 'FAI', nama: 'Fakultas Agama Islam', kategori: 'Fakultas' },
  { kode: 'FIK', nama: 'Fakultas Ilmu Kesehatan', kategori: 'Fakultas' },
  { kode: 'FISIP', nama: 'Fakultas Ilmu Sosial dan Ilmu Politik', kategori: 'Fakultas' },
  { kode: 'PASCA', nama: 'Program Pascasarjana', kategori: 'Fakultas' },
  { kode: 'UNSIL', nama: 'Rektorat Universitas Siliwangi', kategori: 'Pimpinan' },
  { kode: 'LPPM', nama: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat', kategori: 'Lembaga' },
  { kode: 'LPMPP', nama: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran', kategori: 'Lembaga' },
  { kode: 'SPI', nama: 'Satuan Pengawas Internal', kategori: 'Unit Pengawas' }
];

export const UNSIL_REKTORAT_ALLOWED_CODES = [
  'REKTOR',
  'WAREK_1',
  'WAREK_2',
  'WAREK_3',
  'KEPALA_BIRO_BKU',
  'KEPALA_BIRO_BAKPK',
  'KABAG_UMUM_BKU',
  'KABAG_AKADEMIK_BAKPK'
];

export const LPPM_ALLOWED_CODES = [
  'KEPALA_LPPM',
  'SEKRETARIS_LPPM',
  'KASUBBAG_TU_LPPM',
  'KAPUS_PENELITIAN_LPPM',
  'KAPUS_PENGABDIAN_LPPM',
  'KAPUS_PUBLIKASI_HAKI_LPPM',
  'KAPUS_INOVASI_BISNIS_LPPM',
  'KAPUS_STUDI_HALAL_LPPM'
];

export const LPMPP_ALLOWED_CODES = [
  'KEPALA_LPMPP',
  'SEKRETARIS_LPMPP',
  'KASUBBAG_TU_LPMPP',
  'KAPUS_MUTU_AUDIT_LPMPP',
  'KAPUS_KURIKULUM_LPMPP',
  'KAPUS_PEMBELAJARAN_MBKM_LPMPP',
  'KAPUS_KARAKTER_KONSELING_LPMPP'
];

export const MASTER_POSITIONS: PositionOption[] = [
  // 1. Rektorat & Pimpinan Universitas (UNSIL)
  { code: 'REKTOR', name: 'Rektor Universitas Siliwangi', unitGroup: 'UNSIL', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'UNIVERSITAS', canSignPolicy: true },
  { code: 'WAREK_1', name: 'Wakil Rektor Bidang Akademik', unitGroup: 'UNSIL', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'UNIVERSITAS', canSignPolicy: true },
  { code: 'WAREK_2', name: 'Wakil Rektor Bidang Keuangan dan Umum', unitGroup: 'UNSIL', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'UNIVERSITAS', canSignPolicy: true },
  { code: 'WAREK_3', name: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', unitGroup: 'UNSIL', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'UNIVERSITAS', canSignPolicy: true },

  // 2. Fakultas Teknik (FT) - Dekanat, TU, & 5 Jurusan Sesuai PDF (Kajur + Sekjur)
  { code: 'DEKAN_FT', name: 'Dekan Fakultas Teknik', unitGroup: 'FT', facultyId: 'FT', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true, isVacant: true },
  { code: 'WADEK_FT_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FT', unitGroup: 'FT', facultyId: 'FT', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FT_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FT', unitGroup: 'FT', facultyId: 'FT', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FT', name: 'Kepala Subbagian Umum Fakultas Teknik', unitGroup: 'FT', facultyId: 'FT', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_SIPIL_FT', name: 'Ketua Jurusan Teknik Sipil', unitGroup: 'JUR_SIPIL_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_SIPIL_FT', name: 'Sekretaris Jurusan Teknik Sipil', unitGroup: 'JUR_SIPIL_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_ELEKTRO_FT', name: 'Ketua Jurusan Teknik Elektro', unitGroup: 'JUR_ELEKTRO_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_ELEKTRO_FT', name: 'Sekretaris Jurusan Teknik Elektro', unitGroup: 'JUR_ELEKTRO_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_INFORMATIKA_FT', name: 'Ketua Jurusan Informatika', unitGroup: 'JUR_INFORMATIKA_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_INFORMATIKA_FT', name: 'Sekretaris Jurusan Informatika', unitGroup: 'JUR_INFORMATIKA_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_SI_FT', name: 'Ketua Jurusan Sistem Informasi', unitGroup: 'JUR_SI_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_SI_FT', name: 'Sekretaris Jurusan Sistem Informasi', unitGroup: 'JUR_SI_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_SAINSDATA_FT', name: 'Ketua Jurusan Sains Data', unitGroup: 'JUR_SAINSDATA_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_SAINSDATA_FT', name: 'Sekretaris Jurusan Sains Data', unitGroup: 'JUR_SAINSDATA_FT', facultyId: 'FT', parentUnitId: 'FT', level: 'JURUSAN', canSignPolicy: false },

  // 3. Fakultas Keguruan dan Ilmu Pendidikan (FKIP) - Dekanat, TU, & 13 Jurusan Sesuai PDF
  { code: 'DEKAN_FKIP', name: 'Dekan Fakultas Keguruan dan Ilmu Pendidikan', unitGroup: 'FKIP', facultyId: 'FKIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADEK_FKIP_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FKIP', unitGroup: 'FKIP', facultyId: 'FKIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FKIP_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FKIP', unitGroup: 'FKIP', facultyId: 'FKIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FKIP', name: 'Kepala Subbagian Umum FKIP', unitGroup: 'FKIP', facultyId: 'FKIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_PENMAS_FKIP', name: 'Ketua Jurusan Pendidikan Masyarakat', unitGroup: 'JUR_PENMAS_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_PENMAS_FKIP', name: 'Sekretaris Jurusan Pendidikan Masyarakat', unitGroup: 'JUR_PENMAS_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_BINDO_FKIP', name: 'Ketua Jurusan Pendidikan Bahasa Indonesia', unitGroup: 'JUR_BINDO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_BINDO_FKIP', name: 'Sekretaris Jurusan Pendidikan Bahasa Indonesia', unitGroup: 'JUR_BINDO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_BING_FKIP', name: 'Ketua Jurusan Pendidikan Bahasa Inggris', unitGroup: 'JUR_BING_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_BING_FKIP', name: 'Sekretaris Jurusan Pendidikan Bahasa Inggris', unitGroup: 'JUR_BING_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_MAT_FKIP', name: 'Ketua Jurusan Pendidikan Matematika', unitGroup: 'JUR_MAT_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_MAT_FKIP', name: 'Sekretaris Jurusan Pendidikan Matematika', unitGroup: 'JUR_MAT_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_BIO_FKIP', name: 'Ketua Jurusan Pendidikan Biologi', unitGroup: 'JUR_BIO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_BIO_FKIP', name: 'Sekretaris Jurusan Pendidikan Biologi', unitGroup: 'JUR_BIO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_EKO_FKIP', name: 'Ketua Jurusan Pendidikan Ekonomi', unitGroup: 'JUR_EKO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_EKO_FKIP', name: 'Sekretaris Jurusan Pendidikan Ekonomi', unitGroup: 'JUR_EKO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_GEO_FKIP', name: 'Ketua Jurusan Pendidikan Geografi', unitGroup: 'JUR_GEO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_GEO_FKIP', name: 'Sekretaris Jurusan Pendidikan Geografi', unitGroup: 'JUR_GEO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_PENJAS_FKIP', name: 'Ketua Jurusan Pendidikan Jasmani', unitGroup: 'JUR_PENJAS_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_PENJAS_FKIP', name: 'Sekretaris Jurusan Pendidikan Jasmani', unitGroup: 'JUR_PENJAS_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_SEJ_FKIP', name: 'Ketua Jurusan Pendidikan Sejarah', unitGroup: 'JUR_SEJ_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_SEJ_FKIP', name: 'Sekretaris Jurusan Pendidikan Sejarah', unitGroup: 'JUR_SEJ_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_FIS_FKIP', name: 'Ketua Jurusan Pendidikan Fisika', unitGroup: 'JUR_FIS_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_FIS_FKIP', name: 'Sekretaris Jurusan Pendidikan Fisika', unitGroup: 'JUR_FIS_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_PPG_FKIP', name: 'Ketua Jurusan Pendidikan Profesi Guru', unitGroup: 'JUR_PPG_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_PPG_FKIP', name: 'Sekretaris Jurusan Pendidikan Profesi Guru', unitGroup: 'JUR_PPG_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_PKO_FKIP', name: 'Ketua Jurusan Pendidikan Kepelatihan Olahraga', unitGroup: 'JUR_PKO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_PKO_FKIP', name: 'Sekretaris Jurusan Pendidikan Kepelatihan Olahraga', unitGroup: 'JUR_PKO_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_SENI_FKIP', name: 'Ketua Jurusan Pendidikan Seni Pertunjukan', unitGroup: 'JUR_SENI_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_SENI_FKIP', name: 'Sekretaris Jurusan Pendidikan Seni Pertunjukan', unitGroup: 'JUR_SENI_FKIP', facultyId: 'FKIP', parentUnitId: 'FKIP', level: 'JURUSAN', canSignPolicy: false },

  // 4. Fakultas Ekonomi dan Bisnis (FEB) - Dekanat & 5 Jurusan Sesuai PDF
  { code: 'DEKAN_FEB', name: 'Dekan Fakultas Ekonomi dan Bisnis', unitGroup: 'FEB', facultyId: 'FEB', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADEK_FEB_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FEB', unitGroup: 'FEB', facultyId: 'FEB', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FEB_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FEB', unitGroup: 'FEB', facultyId: 'FEB', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FEB', name: 'Kepala Subbagian Umum FEB', unitGroup: 'FEB', facultyId: 'FEB', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_EKOPEM_FEB', name: 'Ketua Jurusan Ekonomi Pembangunan', unitGroup: 'JUR_EKOPEM_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_EKOPEM_FEB', name: 'Sekretaris Jurusan Ekonomi Pembangunan', unitGroup: 'JUR_EKOPEM_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_MANAJEMEN_FEB', name: 'Ketua Jurusan Manajemen', unitGroup: 'JUR_MANAJEMEN_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_MANAJEMEN_FEB', name: 'Sekretaris Jurusan Manajemen', unitGroup: 'JUR_MANAJEMEN_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_AKUNTANSI_FEB', name: 'Ketua Jurusan Akuntansi', unitGroup: 'JUR_AKUNTANSI_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_AKUNTANSI_FEB', name: 'Sekretaris Jurusan Akuntansi', unitGroup: 'JUR_AKUNTANSI_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_PERBANKAN_D3_FEB', name: 'Ketua Jurusan Perbankan dan Keuangan (D3)', unitGroup: 'JUR_PERBANKAN_D3_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_PERBANKAN_D3_FEB', name: 'Sekretaris Jurusan Perbankan dan Keuangan (D3)', unitGroup: 'JUR_PERBANKAN_D3_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_PERBANKAN_D4_FEB', name: 'Ketua Jurusan Perbankan dan Keuangan Digital (D4)', unitGroup: 'JUR_PERBANKAN_D4_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_PERBANKAN_D4_FEB', name: 'Sekretaris Jurusan Perbankan dan Keuangan Digital (D4)', unitGroup: 'JUR_PERBANKAN_D4_FEB', facultyId: 'FEB', parentUnitId: 'FEB', level: 'JURUSAN', canSignPolicy: false },

  // 5. Fakultas Pertanian (FP) - Dekanat & 3 Jurusan Sesuai PDF
  { code: 'DEKAN_FP', name: 'Dekan Fakultas Pertanian', unitGroup: 'FP', facultyId: 'FP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADEK_FP_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FP', unitGroup: 'FP', facultyId: 'FP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FP_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FP', unitGroup: 'FP', facultyId: 'FP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FP', name: 'Kepala Subbagian Umum FP', unitGroup: 'FP', facultyId: 'FP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_AGROTEK_FP', name: 'Ketua Jurusan Agroteknologi', unitGroup: 'JUR_AGROTEK_FP', facultyId: 'FP', parentUnitId: 'FP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_AGROTEK_FP', name: 'Sekretaris Jurusan Agroteknologi', unitGroup: 'JUR_AGROTEK_FP', facultyId: 'FP', parentUnitId: 'FP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_AGRIBISNIS_FP', name: 'Ketua Jurusan Agribisnis', unitGroup: 'JUR_AGRIBISNIS_FP', facultyId: 'FP', parentUnitId: 'FP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_AGRIBISNIS_FP', name: 'Sekretaris Jurusan Agribisnis', unitGroup: 'JUR_AGRIBISNIS_FP', facultyId: 'FP', parentUnitId: 'FP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_TEKPANGAN_FP', name: 'Ketua Jurusan Teknologi Pangan dan Hasil Pertanian', unitGroup: 'JUR_TEKPANGAN_FP', facultyId: 'FP', parentUnitId: 'FP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_TEKPANGAN_FP', name: 'Sekretaris Jurusan Teknologi Pangan dan Hasil Pertanian', unitGroup: 'JUR_TEKPANGAN_FP', facultyId: 'FP', parentUnitId: 'FP', level: 'JURUSAN', canSignPolicy: false },

  // 6. Fakultas Agama Islam (FAI) - Dekanat & 2 Jurusan Sesuai PDF
  { code: 'DEKAN_FAI', name: 'Dekan Fakultas Agama Islam', unitGroup: 'FAI', facultyId: 'FAI', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADEK_FAI_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FAI', unitGroup: 'FAI', facultyId: 'FAI', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FAI_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FAI', unitGroup: 'FAI', facultyId: 'FAI', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FAI', name: 'Kepala Subbagian Umum FAI', unitGroup: 'FAI', facultyId: 'FAI', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_EKSYAR_FAI', name: 'Ketua Jurusan Ekonomi Syariah', unitGroup: 'JUR_EKSYAR_FAI', facultyId: 'FAI', parentUnitId: 'FAI', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_EKSYAR_FAI', name: 'Sekretaris Jurusan Ekonomi Syariah', unitGroup: 'JUR_EKSYAR_FAI', facultyId: 'FAI', parentUnitId: 'FAI', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_MMH_FAI', name: 'Ketua Jurusan Manajemen Mutu Halal', unitGroup: 'JUR_MMH_FAI', facultyId: 'FAI', parentUnitId: 'FAI', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_MMH_FAI', name: 'Sekretaris Jurusan Manajemen Mutu Halal', unitGroup: 'JUR_MMH_FAI', facultyId: 'FAI', parentUnitId: 'FAI', level: 'JURUSAN', canSignPolicy: false },

  // 7. Fakultas Ilmu Kesehatan (FIK) - Dekanat & 2 Jurusan Sesuai PDF
  { code: 'DEKAN_FIK', name: 'Dekan Fakultas Ilmu Kesehatan', unitGroup: 'FIK', facultyId: 'FIK', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADEK_FIK_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FIK', unitGroup: 'FIK', facultyId: 'FIK', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FIK_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FIK', unitGroup: 'FIK', facultyId: 'FIK', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FIK', name: 'Kepala Subbagian Umum FIK', unitGroup: 'FIK', facultyId: 'FIK', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_KESMAS_FIK', name: 'Ketua Jurusan Kesehatan Masyarakat', unitGroup: 'JUR_KESMAS_FIK', facultyId: 'FIK', parentUnitId: 'FIK', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_KESMAS_FIK', name: 'Sekretaris Jurusan Kesehatan Masyarakat', unitGroup: 'JUR_KESMAS_FIK', facultyId: 'FIK', parentUnitId: 'FIK', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_GIZI_FIK', name: 'Ketua Jurusan Gizi', unitGroup: 'JUR_GIZI_FIK', facultyId: 'FIK', parentUnitId: 'FIK', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_GIZI_FIK', name: 'Sekretaris Jurusan Gizi', unitGroup: 'JUR_GIZI_FIK', facultyId: 'FIK', parentUnitId: 'FIK', level: 'JURUSAN', canSignPolicy: false },

  // 8. Fakultas Ilmu Sosial dan Ilmu Politik (FISIP) - Dekanat & 2 Jurusan Sesuai PDF
  { code: 'DEKAN_FISIP', name: 'Dekan Fakultas Ilmu Sosial dan Ilmu Politik', unitGroup: 'FISIP', facultyId: 'FISIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADEK_FISIP_1', name: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FISIP', unitGroup: 'FISIP', facultyId: 'FISIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADEK_FISIP_2', name: 'Wakil Dekan Bidang Keuangan dan Umum FISIP', unitGroup: 'FISIP', facultyId: 'FISIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_FISIP', name: 'Kepala Subbagian Umum FISIP', unitGroup: 'FISIP', facultyId: 'FISIP', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_ILPOL_FISIP', name: 'Ketua Jurusan Ilmu Politik', unitGroup: 'JUR_ILPOL_FISIP', facultyId: 'FISIP', parentUnitId: 'FISIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_ILPOL_FISIP', name: 'Sekretaris Jurusan Ilmu Politik', unitGroup: 'JUR_ILPOL_FISIP', facultyId: 'FISIP', parentUnitId: 'FISIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_HUKUMBISNIS_FISIP', name: 'Ketua Jurusan Hukum Bisnis', unitGroup: 'JUR_HUKUMBISNIS_FISIP', facultyId: 'FISIP', parentUnitId: 'FISIP', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_HUKUMBISNIS_FISIP', name: 'Sekretaris Jurusan Hukum Bisnis', unitGroup: 'JUR_HUKUMBISNIS_FISIP', facultyId: 'FISIP', parentUnitId: 'FISIP', level: 'JURUSAN', canSignPolicy: false },

  // 9. Program Pascasarjana (PASCA)
  { code: 'DIREKTUR_PASCA', name: 'Direktur Program Pascasarjana', unitGroup: 'PASCA', facultyId: 'PASCA', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: true },
  { code: 'WADIR_PASCA', name: 'Wakil Direktur Bidang Akademik dan Kemahasiswaan Program Pascasarjana', unitGroup: 'PASCA', facultyId: 'PASCA', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'WADIR_PASCA_2', name: 'Wakil Direktur Bidang Keuangan dan Umum Program Pascasarjana', unitGroup: 'PASCA', facultyId: 'PASCA', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KASUBBAG_TU_PASCA', name: 'Kepala Subbagian Umum Program Pascasarjana', unitGroup: 'PASCA', facultyId: 'PASCA', parentUnitId: 'UNSIL', level: 'FAKULTAS', canSignPolicy: false },
  { code: 'KAJUR_S2_GEO_PASCA', name: 'Ketua Program Magister Pendidikan Geografi', unitGroup: 'JUR_S2_GEO_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_GEO_PASCA', name: 'Sekretaris Program Magister Pendidikan Geografi', unitGroup: 'JUR_S2_GEO_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S2_AGRI_PASCA', name: 'Ketua Program Magister Agribisnis', unitGroup: 'JUR_S2_AGRI_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_AGRI_PASCA', name: 'Sekretaris Program Magister Agribisnis', unitGroup: 'JUR_S2_AGRI_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S2_MAN_PASCA', name: 'Ketua Program Magister Manajemen', unitGroup: 'JUR_S2_MAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_MAN_PASCA', name: 'Sekretaris Program Magister Manajemen', unitGroup: 'JUR_S2_MAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S2_MAT_PASCA', name: 'Ketua Program Magister Pendidikan Matematika', unitGroup: 'JUR_S2_MAT_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_MAT_PASCA', name: 'Sekretaris Program Magister Pendidikan Matematika', unitGroup: 'JUR_S2_MAT_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S2_AGRO_PASCA', name: 'Ketua Program Magister Agroteknologi', unitGroup: 'JUR_S2_AGRO_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_AGRO_PASCA', name: 'Sekretaris Program Magister Agroteknologi', unitGroup: 'JUR_S2_AGRO_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S2_IPA_PASCA', name: 'Ketua Program Magister Pendidikan IPA', unitGroup: 'JUR_S2_IPA_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_IPA_PASCA', name: 'Sekretaris Program Magister Pendidikan IPA', unitGroup: 'JUR_S2_IPA_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S2_PENJAS_PASCA', name: 'Ketua Program Magister Pendidikan Jasmani', unitGroup: 'JUR_S2_PENJAS_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S2_PENJAS_PASCA', name: 'Sekretaris Program Magister Pendidikan Jasmani', unitGroup: 'JUR_S2_PENJAS_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S3_MAN_PASCA', name: 'Ketua Program Doktor Ilmu Manajemen', unitGroup: 'JUR_S3_MAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S3_MAN_PASCA', name: 'Sekretaris Program Doktor Ilmu Manajemen', unitGroup: 'JUR_S3_MAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S3_PERTANIAN_PASCA', name: 'Ketua Program Doktor Ilmu Pertanian', unitGroup: 'JUR_S3_PERTANIAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S3_PERTANIAN_PASCA', name: 'Sekretaris Program Doktor Ilmu Pertanian', unitGroup: 'JUR_S3_PERTANIAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'KAJUR_S3_PENDIDIKAN_PASCA', name: 'Ketua Program Doktor Pendidikan', unitGroup: 'JUR_S3_PENDIDIKAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },
  { code: 'SEKJUR_S3_PENDIDIKAN_PASCA', name: 'Sekretaris Program Doktor Pendidikan', unitGroup: 'JUR_S3_PENDIDIKAN_PASCA', facultyId: 'PASCA', parentUnitId: 'PASCA', level: 'JURUSAN', canSignPolicy: false },

  // 10. Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)
  { code: 'KEPALA_LPPM', name: 'Kepala LPPM', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: true },
  { code: 'SEKRETARIS_LPPM', name: 'Sekretaris LPPM', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: false },
  { code: 'KASUBBAG_TU_LPPM', name: 'Kepala Subbagian Umum LPPM', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: false },
  { code: 'KAPUS_PENELITIAN_LPPM', name: 'Kepala Pusat Penelitian', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'LPPM', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_PENGABDIAN_LPPM', name: 'Kepala Pusat Pengabdian kepada Masyarakat', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'LPPM', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_PUBLIKASI_HAKI_LPPM', name: 'Kepala Pusat Publikasi Ilmiah, HaKI, dan Paten', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'LPPM', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_INOVASI_BISNIS_LPPM', name: 'Kepala Pusat Manajemen Inovasi dan Inkubator Bisnis', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'LPPM', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_STUDI_HALAL_LPPM', name: 'Kepala Pusat Studi Halal', unitGroup: 'LPPM', facultyId: 'LPPM', parentUnitId: 'LPPM', level: 'LEMBAGA_PUSAT', canSignPolicy: false },

  // 11. Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)
  { code: 'KEPALA_LPMPP', name: 'Kepala LPMPP', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: true },
  { code: 'SEKRETARIS_LPMPP', name: 'Sekretaris LPMPP', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: false },
  { code: 'KASUBBAG_TU_LPMPP', name: 'Kepala Subbagian Umum LPMPP', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: false },
  { code: 'KAPUS_MUTU_AUDIT_LPMPP', name: 'Kepala Pusat Penjaminan Mutu & Audit Mutu Internal', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'LPMPP', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_KURIKULUM_LPMPP', name: 'Kepala Pusat Pengkajian dan Pengembangan Kurikulum', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'LPMPP', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_PEMBELAJARAN_MBKM_LPMPP', name: 'Kepala Pusat Pengembangan Pembelajaran, Pendidikan, dan MBKM', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'LPMPP', level: 'LEMBAGA_PUSAT', canSignPolicy: false },
  { code: 'KAPUS_KARAKTER_KONSELING_LPMPP', name: 'Kepala Pusat Pendidikan Karakter, Bimbingan Konseling, dan Layanan Psikologi', unitGroup: 'LPMPP', facultyId: 'LPMPP', parentUnitId: 'LPMPP', level: 'LEMBAGA_PUSAT', canSignPolicy: false },

  // 12. Satuan Pengawas Internal (SPI) & Pejabat Struktural Biro
  { code: 'KEPALA_SPI', name: 'Kepala Satuan Pengawas Internal', unitGroup: 'SPI', facultyId: 'SPI', parentUnitId: 'UNSIL', level: 'LEMBAGA', canSignPolicy: false },
  { code: 'KEPALA_BIRO_BKU', name: 'Kepala Biro Keuangan dan Umum (BKU)', unitGroup: 'BKU', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'BIRO', canSignPolicy: false },
  { code: 'KEPALA_BIRO_BAKPK', name: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)', unitGroup: 'BAKPK', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'BIRO', canSignPolicy: false },
  { code: 'KABAG_UMUM_BKU', name: 'Kepala Bagian Umum (pada BKU)', unitGroup: 'BKU', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'BIRO', canSignPolicy: false },
  { code: 'KABAG_AKADEMIK_BAKPK', name: 'Kepala Bagian Akademik (pada BAKPK)', unitGroup: 'BAKPK', facultyId: 'UNSIL', parentUnitId: 'UNSIL', level: 'BIRO', canSignPolicy: false }
];

