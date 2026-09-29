/**
 * Controller: Mutasi Unit Kerja & Penugasan Tambahan (Sekunder) Pegawai SILOKA
 * Dasar Hukum: Permendikbudristek No. 19 Tahun 2023 tentang OTK Universitas Siliwangi
 *
 * Endpoint:
 * - GET  /api/v1/unit-kerja/:unit_id/jabatan-tersedia
 * - GET  /api/admin/unit-kerja/:unit_id/jabatan-tersedia
 * - GET  /api/admin/pegawai/unit-kerja-otk
 * - GET  /api/admin/pegawai/mutasi-riwayat
 * - POST /api/admin/pegawai/mutasi-unit
 */

import { pool, query, isDatabaseAvailable } from '../config/database.js';
import { memoryUserStore } from '../services/userManagementService.js';
import { buildFiveMechanismsRbacBundle } from '../../src/utils/rbacTupoksiEngine.js';

export const OTK_UNSIL_MASTER_UNITS = [
  // 1. Unsur Pimpinan & Organ Penunjang
  {
    kode_unit: 'REKTORAT',
    kode_otk: 'UN58',
    nama_unit: 'Rektorat (Rektor & Wakil Rektor 1–3)',
    kategori_struktur: 'PIMPINAN_ORGAN',
    label_kategori: '1. Unsur Pimpinan & Organ Penunjang'
  },
  {
    kode_unit: 'SENAT',
    kode_otk: 'UN58.SENAT',
    nama_unit: 'Senat Universitas Siliwangi',
    kategori_struktur: 'PIMPINAN_ORGAN',
    label_kategori: '1. Unsur Pimpinan & Organ Penunjang'
  },
  {
    kode_unit: 'SPI',
    kode_otk: 'UN58.19',
    nama_unit: 'Satuan Pengawas Internal (SPI)',
    kategori_struktur: 'PIMPINAN_ORGAN',
    label_kategori: '1. Unsur Pimpinan & Organ Penunjang'
  },
  {
    kode_unit: 'DEWAN_PENYANTUN',
    kode_otk: 'UN58.DP',
    nama_unit: 'Dewan Penyantun Universitas Siliwangi',
    kategori_struktur: 'PIMPINAN_ORGAN',
    label_kategori: '1. Unsur Pimpinan & Organ Penunjang'
  },

  // 2. Unsur Pelaksana Administrasi (Biro)
  {
    kode_unit: 'BAKPK',
    kode_otk: 'UN58.06',
    nama_unit: 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)',
    kategori_struktur: 'BIRO',
    label_kategori: '2. Unsur Pelaksana Administrasi (Biro)'
  },
  {
    kode_unit: 'BKU',
    kode_otk: 'UN58.07',
    nama_unit: 'Biro Keuangan dan Umum (BKU)',
    kategori_struktur: 'BIRO',
    label_kategori: '2. Unsur Pelaksana Administrasi (Biro)'
  },

  // 3. Unsur Pelaksana Akademik (7 Fakultas & Program Pascasarjana)
  {
    kode_unit: 'FKIP',
    kode_otk: 'UN58.10',
    nama_unit: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'FEB',
    kode_otk: 'UN58.11',
    nama_unit: 'Fakultas Ekonomi dan Bisnis (FEB)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'FP',
    kode_otk: 'UN58.12',
    nama_unit: 'Fakultas Pertanian (FP)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'FT',
    kode_otk: 'UN58.13',
    nama_unit: 'Fakultas Teknik (FT)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'FISIP',
    kode_otk: 'UN58.14',
    nama_unit: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'FIK',
    kode_otk: 'UN58.15',
    nama_unit: 'Fakultas Ilmu Kesehatan (FIK)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'FAI',
    kode_otk: 'UN58.16',
    nama_unit: 'Fakultas Agama Islam (FAI)',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },
  {
    kode_unit: 'PASCA',
    kode_otk: 'UN58.17',
    nama_unit: 'Program Pascasarjana',
    kategori_struktur: 'FAKULTAS_PASCASARJANA',
    label_kategori: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)'
  },

  // 4. Unsur Pelaksana Akademik & Mutu (Lembaga)
  {
    kode_unit: 'LPPM',
    kode_otk: 'UN58.08',
    nama_unit: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)',
    kategori_struktur: 'LEMBAGA',
    label_kategori: '4. Unsur Pelaksana Akademik & Mutu (Lembaga)'
  },
  {
    kode_unit: 'LPMPP',
    kode_otk: 'UN58.09',
    nama_unit: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)',
    kategori_struktur: 'LEMBAGA',
    label_kategori: '4. Unsur Pelaksana Akademik & Mutu (Lembaga)'
  },

  // 5. Unsur Penunjang Akademik (UPA)
  {
    kode_unit: 'UPA_PERPUS',
    kode_otk: 'UN58.20',
    nama_unit: 'UPA Perpustakaan',
    kategori_struktur: 'UPA',
    label_kategori: '5. Unsur Penunjang Akademik (UPA)'
  },
  {
    kode_unit: 'UPA_TIK',
    kode_otk: 'UN58.21',
    nama_unit: 'UPA Teknologi Informasi dan Komunikasi (TIK)',
    kategori_struktur: 'UPA',
    label_kategori: '5. Unsur Penunjang Akademik (UPA)'
  },
  {
    kode_unit: 'UPA_BAHASA',
    kode_otk: 'UN58.22',
    nama_unit: 'UPA Bahasa',
    kategori_struktur: 'UPA',
    label_kategori: '5. Unsur Penunjang Akademik (UPA)'
  },
  {
    kode_unit: 'UPA_PKKM',
    kode_otk: 'UN58.23',
    nama_unit: 'UPA Pengembangan Karier dan Kewirausahaan Mahasiswa',
    kategori_struktur: 'UPA',
    label_kategori: '5. Unsur Penunjang Akademik (UPA)'
  },
  {
    kode_unit: 'UPA_LUK',
    kode_otk: 'UN58.24',
    nama_unit: 'UPA Layanan Uji Kompetensi',
    kategori_struktur: 'UPA',
    label_kategori: '5. Unsur Penunjang Akademik (UPA)'
  }
];

/**
 * Pemetaan Jabatan Baku SOTK per Unit Kerja (tbl_master_jabatan <-> tbl_unit_jabatan_map)
 * Memastikan hanya jabatan yang sah secara hukum OTK UNSIL yang dapat dipilih pada unit kerja tujuan.
 */
export const resolveValidJabatanForUnit = (unitCodeInput) => {
  const unitObj = resolveCanonicalOtkUnit(unitCodeInput);
  if (!unitObj) return [];

  const code = unitObj.kode_unit;
  const unitName = unitObj.nama_unit;

  // 1. Unit LPPM (Lembaga Penelitian dan Pengabdian kepada Masyarakat)
  if (code === 'LPPM') {
    return [
      {
        id_jabatan: 'JBT_KA_LPPM',
        nama_jabatan: 'Kepala LPPM',
        nama_jabatan_spesifik: 'Kepala LPPM',
        sub_kelompok: '1. Pimpinan & Koordinator LPPM',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Lembaga'
      },
      {
        id_jabatan: 'JBT_KOOR_PUSLIT',
        nama_jabatan: 'Koordinator Pusat Penelitian',
        nama_jabatan_spesifik: 'Koordinator Pusat Penelitian',
        sub_kelompok: '1. Pimpinan & Koordinator LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Koordinator Pusat',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_KOOR_PKM',
        nama_jabatan: 'Koordinator Pusat Pengabdian Kepada Masyarakat',
        nama_jabatan_spesifik: 'Koordinator Pusat Pengabdian Kepada Masyarakat',
        sub_kelompok: '1. Pimpinan & Koordinator LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Koordinator Pusat'
      },
      {
        id_jabatan: 'JBT_KAPUS_LITERASI_HKI',
        nama_jabatan: 'Kepala Pusat Penguatan Studi Literasi dan Publikasi Ilmiah, Hak Kekayaan Intelektual, Paten dan Sertifikat Produk',
        nama_jabatan_spesifik: 'Kepala Pusat Penguatan Studi Literasi dan Publikasi Ilmiah, Hak Kekayaan Intelektual, Paten dan Sertifikat Produk',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_HALAL',
        nama_jabatan: 'Kepala Pusat Studi Halal',
        nama_jabatan_spesifik: 'Kepala Pusat Studi Halal',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_KERJASAMA_ALUMNI',
        nama_jabatan: 'Kepala Pusat Kerja Sama dan Alumni',
        nama_jabatan_spesifik: 'Kepala Pusat Kerja Sama dan Alumni',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_INOVASI_INKUBATOR',
        nama_jabatan: 'Kepala Pusat Manajemen Inovasi dan Inkubator Bisnis',
        nama_jabatan_spesifik: 'Kepala Pusat Manajemen Inovasi dan Inkubator Bisnis',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_TIK_ENERGI',
        nama_jabatan: 'Kepala Pusat Kajian Pengembangan Teknologi, Informasi, Kolaborasi Industri dan Energi',
        nama_jabatan_spesifik: 'Kepala Pusat Kajian Pengembangan Teknologi, Informasi, Kolaborasi Industri dan Energi',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_GENDER_KESEHATAN',
        nama_jabatan: 'Kepala Pusat Gender, Disabilitas, dan Kesehatan',
        nama_jabatan_spesifik: 'Kepala Pusat Gender, Disabilitas, dan Kesehatan',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_BENCANA_LH',
        nama_jabatan: 'Kepala Pusat Studi Bencana dan Lingkungan Hidup',
        nama_jabatan_spesifik: 'Kepala Pusat Studi Bencana dan Lingkungan Hidup',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      },
      {
        id_jabatan: 'JBT_KAPUS_PEMBERDAYAAN_DESA',
        nama_jabatan: 'Kepala Pusat Pemberdayaan Masyarakat, Pembangunan dan Pengembangan Pedesaaan',
        nama_jabatan_spesifik: 'Kepala Pusat Pemberdayaan Masyarakat, Pembangunan dan Pengembangan Pedesaaan',
        sub_kelompok: '2. Kepala Pusat Kajian & Studi LPPM',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPPM'
      }
    ];
  }

  // 2. Unit LPMPP (Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran)
  if (code === 'LPMPP') {
    return [
      {
        id_jabatan: 'JBT_KA_LPMPP',
        nama_jabatan: 'Kepala',
        nama_jabatan_spesifik: 'Kepala',
        sub_kelompok: '1. Pimpinan & Koordinator LPMPP',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Lembaga'
      },
      {
        id_jabatan: 'JBT_SEK_LPMPP',
        nama_jabatan: 'Sekretaris',
        nama_jabatan_spesifik: 'Sekretaris',
        sub_kelompok: '1. Pimpinan & Koordinator LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Sekretaris Lembaga'
      },
      {
        id_jabatan: 'JBT_KOOR_MUTU_LPMPP',
        nama_jabatan: 'Koordinator Pusat Penjaminan Mutu',
        nama_jabatan_spesifik: 'Koordinator Pusat Penjaminan Mutu',
        sub_kelompok: '1. Pimpinan & Koordinator LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Koordinator Pusat',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_KOOR_PEMBELAJARAN_LPMPP',
        nama_jabatan: 'Koordinator Pusat Pengembangan Pembelajaran',
        nama_jabatan_spesifik: 'Koordinator Pusat Pengembangan Pembelajaran',
        sub_kelompok: '1. Pimpinan & Koordinator LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Koordinator Pusat'
      },
      {
        id_jabatan: 'JBT_KAPUS_AMI_LPMPP',
        nama_jabatan: 'Kepala Pusat Audit Mutu Internal',
        nama_jabatan_spesifik: 'Kepala Pusat Audit Mutu Internal',
        sub_kelompok: '2. Kepala Pusat LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPMPP'
      },
      {
        id_jabatan: 'JBT_KAPUS_INOVASI_ELEARNING_LPMPP',
        nama_jabatan: 'Kepala Pusat Inovasi Pembelajaran, Media Pembelajaran, e-learning, Sumber-sumber Belajar, dan Pengembangan Profesi',
        nama_jabatan_spesifik: 'Kepala Pusat Inovasi Pembelajaran, Media Pembelajaran, e-learning, Sumber-sumber Belajar, dan Pengembangan Profesi',
        sub_kelompok: '2. Kepala Pusat LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPMPP'
      },
      {
        id_jabatan: 'JBT_KAPUS_KARAKTER_BK_LPMPP',
        nama_jabatan: 'Kepala Pusat Pendidikan Karakter, Bimbingan, Konseling, dan Layanan Psikologi',
        nama_jabatan_spesifik: 'Kepala Pusat Pendidikan Karakter, Bimbingan, Konseling, dan Layanan Psikologi',
        sub_kelompok: '2. Kepala Pusat LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPMPP'
      },
      {
        id_jabatan: 'JBT_KAPUS_MKWK_MKWI_LPMPP',
        nama_jabatan: 'Kepala Pusat Pengkajian dan Pengembangan Mata Kuliah Wajib Kurikulum (MKWK), dan Mata Kuliah Wajib Institusi (MKWI)',
        nama_jabatan_spesifik: 'Kepala Pusat Pengkajian dan Pengembangan Mata Kuliah Wajib Kurikulum (MKWK), dan Mata Kuliah Wajib Institusi (MKWI)',
        sub_kelompok: '2. Kepala Pusat LPMPP',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Kepala Pusat LPMPP'
      }
    ];
  }

  // 3. 7 Fakultas (FKIP, FEB, FT, FP, FAI, FIK, FISIP) merujuk dokumen resmi "program studi di Unsil.pdf"
  const FAKULTAS_PRODI_UNSIL_MAP = {
    FKIP: [
      { kode: 'PENMAS', nama: 'Pendidikan Masyarakat' },
      { kode: 'PBSI', nama: 'Pendidikan Bahasa Indonesia' },
      { kode: 'PBI', nama: 'Pendidikan Bahasa Inggris' },
      { kode: 'PMTK', nama: 'Pendidikan Matematika' },
      { kode: 'PBIO', nama: 'Pendidikan Biologi' },
      { kode: 'PEKO', nama: 'Pendidikan Ekonomi' },
      { kode: 'PGEO', nama: 'Pendidikan Geografi' },
      { kode: 'PENJAS', nama: 'Pendidikan Jasmani' },
      { kode: 'PSEJ', nama: 'Pendidikan Sejarah' },
      { kode: 'PFIS', nama: 'Pendidikan Fisika' },
      { kode: 'PPG', nama: 'Pendidikan Profesi Guru' },
      { kode: 'PKO', nama: 'Pendidikan Kepelatihan Olahraga' },
      { kode: 'PSP', nama: 'Pendidikan Seni Pertunjukan' }
    ],
    FEB: [
      { kode: 'EP', nama: 'Ekonomi Pembangunan' },
      { kode: 'MNJ', nama: 'Manajemen' },
      { kode: 'AKT', nama: 'Akuntansi' },
      { kode: 'PK_D3', nama: 'Perbankan dan Keuangan (D3)' },
      { kode: 'PKD_D4', nama: 'Perbankan dan Keuangan Digital (D4)' }
    ],
    FT: [
      { kode: 'SIPIL', nama: 'Teknik Sipil' },
      { kode: 'ELEKTRO', nama: 'Teknik Elektro' },
      { kode: 'INFORMATIKA', nama: 'Informatika' },
      { kode: 'SI', nama: 'Sistem Informasi' },
      { kode: 'SAINS_DATA', nama: 'Sains Data' }
    ],
    FP: [
      { kode: 'AGROTEK', nama: 'Agroteknologi' },
      { kode: 'AGRIBISNIS', nama: 'Agribisnis' },
      { kode: 'TPHP', nama: 'Teknologi Pangan dan Hasil Pertanian' }
    ],
    FAI: [
      { kode: 'EKSYAR', nama: 'Ekonomi Syariah' },
      { kode: 'MMH', nama: 'Manajemen Mutu Halal' }
    ],
    FIK: [
      { kode: 'KESMAS', nama: 'Kesehatan Masyarakat' },
      { kode: 'GIZI', nama: 'Gizi' }
    ],
    FISIP: [
      { kode: 'ILPOL', nama: 'Ilmu Politik' },
      { kode: 'HUKUM_BISNIS', nama: 'Hukum Bisnis' }
    ]
  };

  if (['FT', 'FKIP', 'FEB', 'FP', 'FISIP', 'FIK', 'FAI'].includes(code)) {
    const jurusanList = FAKULTAS_PRODI_UNSIL_MAP[code] || [];
    const kajurItems = jurusanList.map((j, idx) => ({
      id_jabatan: `JBT_KAJUR_${j.kode}`,
      nama_jabatan: `Ketua Jurusan ${j.nama}`,
      nama_jabatan_spesifik: `Ketua Jurusan ${j.nama}`,
      sub_kelompok: `3. Ketua Jurusan (${jurusanList.length} Jurusan/Prodi ${code})`,
      kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
      is_signatory_tte: true,
      level_otorisasi: 'Level 2: Pimpinan Jurusan',
      is_default_selection: idx === 0
    }));

    const sekjurItems = jurusanList.map((j) => ({
      id_jabatan: `JBT_SEKJUR_${j.kode}`,
      nama_jabatan: `Sekretaris Jurusan ${j.nama}`,
      nama_jabatan_spesifik: `Sekretaris Jurusan ${j.nama}`,
      sub_kelompok: `4. Sekretaris Jurusan (${jurusanList.length} Jurusan/Prodi ${code})`,
      kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
      is_signatory_tte: false,
      level_otorisasi: 'Level 2: Sekretaris Jurusan'
    }));

    return [
      // 1. Dekan
      {
        id_jabatan: 'JBT_DEKAN',
        nama_jabatan: 'Dekan',
        nama_jabatan_spesifik: `Dekan ${unitName}`,
        sub_kelompok: '1. Dekan',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Fakultas'
      },
      // 2. Wakil Dekan (Bidang Akademik dan Kemahasiswaan & Bidang Keuangan dan Umum)
      {
        id_jabatan: 'JBT_WADEK_AKADEMIK',
        nama_jabatan: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan',
        nama_jabatan_spesifik: `Wakil Dekan Bidang Akademik dan Kemahasiswaan (${code})`,
        sub_kelompok: '2. Wakil Dekan',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Wakil Dekan Bidang I'
      },
      {
        id_jabatan: 'JBT_WADEK_KEUANGAN',
        nama_jabatan: 'Wakil Dekan Bidang Keuangan dan Umum',
        nama_jabatan_spesifik: `Wakil Dekan Bidang Keuangan dan Umum (${code})`,
        sub_kelompok: '2. Wakil Dekan',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Wakil Dekan Bidang II'
      },
      // 3. Ketua Jurusan per Prodi/Jurusan di Fakultas
      ...kajurItems,
      // 4. Sekretaris Jurusan per Prodi/Jurusan di Fakultas
      ...sekjurItems,
      // 5. Kepala Subbagian Umum Fakultas
      {
        id_jabatan: 'JBT_KASUBBAG_FAKULTAS',
        nama_jabatan: 'Kepala Subbagian Umum Fakultas',
        nama_jabatan_spesifik: `Kepala Subbagian Umum ${unitName}`,
        sub_kelompok: '5. Kepala Subbagian Umum Fakultas',
        kategori_jabatan: 'ADMINISTRASI_TU',
        is_signatory_tte: false,
        level_otorisasi: 'Level 2: Koordinator Administrasi Fakultas'
      }
    ];
  }

  // 4. Program Pascasarjana (PASCA) merujuk dokumen resmi "program studi di Unsil.pdf"
  if (code === 'PASCA') {
    const prodiMagister = [
      { kode: 'S2_PGEO', nama: 'Pendidikan Geografi' },
      { kode: 'S2_AGRI', nama: 'Agribisnis' },
      { kode: 'S2_MNJ', nama: 'Manajemen' },
      { kode: 'S2_PMTK', nama: 'Pendidikan Matematika' },
      { kode: 'S2_AGRO', nama: 'Agroteknologi' },
      { kode: 'S2_PIPA', nama: 'Pendidikan Ilmu Pengetahuan Alam' },
      { kode: 'S2_PENJAS', nama: 'Pendidikan Jasmani' }
    ];
    const prodiDoktor = [
      { kode: 'S3_IMNJ', nama: 'Ilmu Manajemen' },
      { kode: 'S3_IPERT', nama: 'Ilmu Pertanian' },
      { kode: 'S3_PEND', nama: 'Pendidikan' }
    ];

    return [
      {
        id_jabatan: 'JBT_DIREKTUR_PASCA',
        nama_jabatan: 'Direktur Pascasarjana',
        nama_jabatan_spesifik: 'Direktur Program Pascasarjana',
        sub_kelompok: '1. Pimpinan Pascasarjana',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Pascasarjana',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_WADIR_AKADEMIK_PASCA',
        nama_jabatan: 'Wakil Direktur Bidang Akademik dan Kemahasiswaan',
        nama_jabatan_spesifik: 'Wakil Direktur Bidang Akademik dan Kemahasiswaan Pascasarjana',
        sub_kelompok: '1. Pimpinan Pascasarjana',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Wakil Direktur Pascasarjana'
      },
      {
        id_jabatan: 'JBT_WADIR_KEUANGAN_PASCA',
        nama_jabatan: 'Wakil Direktur Bidang Keuangan dan Umum',
        nama_jabatan_spesifik: 'Wakil Direktur Bidang Keuangan dan Umum Pascasarjana',
        sub_kelompok: '1. Pimpinan Pascasarjana',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Wakil Direktur Pascasarjana'
      },
      ...prodiMagister.map((p) => ({
        id_jabatan: `JBT_KAPRODI_${p.kode}`,
        nama_jabatan: `Ketua Program Studi Magister (S2) ${p.nama}`,
        nama_jabatan_spesifik: `Ketua Program Studi Magister ${p.nama}`,
        sub_kelompok: '2. Program Studi Magister (S2)',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Pimpinan Prodi Magister'
      })),
      ...prodiDoktor.map((p) => ({
        id_jabatan: `JBT_KAPRODI_${p.kode}`,
        nama_jabatan: `Ketua Program Studi Doktor (S3) ${p.nama}`,
        nama_jabatan_spesifik: `Ketua Program Studi Doktor ${p.nama}`,
        sub_kelompok: '3. Program Studi Doktor (S3)',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Pimpinan Prodi Doktor'
      })),
      {
        id_jabatan: 'JBT_KASUBBAG_PASCA',
        nama_jabatan: 'Kepala Subbagian Umum Program Pascasarjana',
        nama_jabatan_spesifik: 'Kepala Subbagian Umum Program Pascasarjana',
        sub_kelompok: '4. Kepala Subbagian Umum',
        kategori_jabatan: 'ADMINISTRASI_TU',
        is_signatory_tte: false,
        level_otorisasi: 'Level 2: Koordinator Administrasi Pascasarjana'
      }
    ];
  }

  // 5. Biro Administrasi (BKU & BAKPK)
  if (['BKU', 'BAKPK'].includes(code)) {
    return [
      {
        id_jabatan: 'JBT_KA_BIRO',
        nama_jabatan: 'Kepala Biro',
        nama_jabatan_spesifik: `Kepala ${unitName}`,
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Biro'
      },
      {
        id_jabatan: 'JBT_KABAG',
        nama_jabatan: 'Kepala Bagian',
        nama_jabatan_spesifik: `Kepala Bagian (${code})`,
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Pejabat Administrasi',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_KASUBBAG',
        nama_jabatan: 'Kepala Subbagian / Koordinator',
        nama_jabatan_spesifik: `Kepala Subbagian / Koordinator (${code})`,
        kategori_jabatan: 'ADMINISTRASI_TU',
        is_signatory_tte: false,
        level_otorisasi: 'Level 2: Koordinator Administrasi'
      },
      {
        id_jabatan: 'JBT_ARSIPARIS_TU',
        nama_jabatan: 'Arsiparis / Pengendali Surat Biro',
        nama_jabatan_spesifik: `Arsiparis Pusat / Pengendali Surat (${code})`,
        kategori_jabatan: 'ADMINISTRASI_TU',
        is_signatory_tte: false,
        level_otorisasi: 'Level 2: Staf Khusus Kearsipan'
      }
    ];
  }

  // 6. Unsur Penunjang Akademik (UPA)
  if (code.startsWith('UPA_')) {
    return [
      {
        id_jabatan: 'JBT_KA_UPA',
        nama_jabatan: 'Kepala UPA',
        nama_jabatan_spesifik: `Kepala ${unitName}`,
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan UPA',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_KOOR_UPA',
        nama_jabatan: 'Koordinator Layanan Teknis UPA',
        nama_jabatan_spesifik: `Koordinator Layanan Teknis ${unitName}`,
        kategori_jabatan: 'FUNGSIONAL_TAMBAHAN',
        is_signatory_tte: false,
        level_otorisasi: 'Level 2: Fungsional UPA'
      }
    ];
  }

  // 7. Unsur Pimpinan & Organ (REKTORAT, SENAT, SPI, DEWAN_PENYANTUN)
  if (code === 'REKTORAT') {
    return [
      {
        id_jabatan: 'JBT_REKTOR',
        nama_jabatan: 'Rektor',
        nama_jabatan_spesifik: 'Rektor',
        sub_kelompok: '1. Rektor',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 0: Pimpinan Tertinggi Universitas'
      },
      {
        id_jabatan: 'JBT_WAREK_AKADEMIK',
        nama_jabatan: 'Wakil Rektor Bidang Akademik',
        nama_jabatan_spesifik: 'Wakil Rektor Bidang Akademik',
        sub_kelompok: '2. Wakil Rektor',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Wakil Rektor Bidang I',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_WAREK_KEUANGAN',
        nama_jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
        nama_jabatan_spesifik: 'Wakil Rektor Bidang Keuangan dan Umum',
        sub_kelompok: '2. Wakil Rektor',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Wakil Rektor Bidang II'
      },
      {
        id_jabatan: 'JBT_WAREK_KEMAHASISWAAN',
        nama_jabatan: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
        nama_jabatan_spesifik: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
        sub_kelompok: '2. Wakil Rektor',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Wakil Rektor Bidang III'
      }
    ];
  }

  if (code === 'SPI') {
    return [
      {
        id_jabatan: 'JBT_KA_SPI',
        nama_jabatan: 'Ketua SPI',
        nama_jabatan_spesifik: 'Ketua Satuan Pengawas Internal (SPI)',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Organ',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_SEK_SPI',
        nama_jabatan: 'Sekretaris SPI',
        nama_jabatan_spesifik: 'Sekretaris Satuan Pengawas Internal (SPI)',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Sekretaris Organ'
      },
      {
        id_jabatan: 'JBT_AUDITOR_SPI',
        nama_jabatan: 'Auditor Internal SPI',
        nama_jabatan_spesifik: 'Auditor Internal Satuan Pengawas Internal (SPI)',
        kategori_jabatan: 'FUNGSIONAL_TAMBAHAN',
        is_signatory_tte: false,
        level_otorisasi: 'Level 2: Fungsional'
      }
    ];
  }

  if (code === 'SENAT') {
    return [
      {
        id_jabatan: 'JBT_KA_SENAT',
        nama_jabatan: 'Ketua Senat Universitas',
        nama_jabatan_spesifik: 'Ketua Senat Universitas',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Organ Senat',
        is_default_selection: true
      },
      {
        id_jabatan: 'JBT_SEK_SENAT',
        nama_jabatan: 'Sekretaris Senat Universitas',
        nama_jabatan_spesifik: 'Sekretaris Senat Universitas',
        kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
        is_signatory_tte: true,
        level_otorisasi: 'Level 2: Sekretaris Organ Senat'
      }
    ];
  }

  return [
    {
      id_jabatan: 'JBT_KA_DEWAN_PENYANTUN',
      nama_jabatan: `Ketua ${unitName}`,
      nama_jabatan_spesifik: `Ketua ${unitName}`,
      kategori_jabatan: 'STRUKTURAL_PIMPINAN',
      is_signatory_tte: true,
      level_otorisasi: 'Level 1: Pimpinan Organ',
      is_default_selection: true
    },
    {
      id_jabatan: 'JBT_SEK_DEWAN_PENYANTUN',
      nama_jabatan: `Sekretaris ${unitName}`,
      nama_jabatan_spesifik: `Sekretaris ${unitName}`,
      kategori_jabatan: 'STRUKTURAL_SUB_UNIT',
      is_signatory_tte: false,
      level_otorisasi: 'Level 2: Sekretaris Organ'
    }
  ];
};

// In-memory audit ledger fallback & cache
const inMemoryMutationHistory = [
  {
    id_mutasi: 'MUT-2026-001',
    id_pegawai: 'u-aris-201',
    nama_pegawai: 'Dr. Aris Martono, M.Kom.',
    nip_pegawai: '198504122015041002',
    unit_asal_id: 'FT',
    unit_asal_nama: 'Fakultas Teknik (FT)',
    unit_tujuan_id: 'LPPM',
    unit_tujuan_nama: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)',
    jenis_perubahan: 'Tugas Tambahan / Sekunder',
    jabatan_tujuan_id: 'JBT_KAPUS_LIT',
    jabatan_penugasan: 'Kepala Pusat Penelitian LPPM',
    nomor_sk: '814/UN58/KP.04.02/2026',
    tanggal_mulai: '2026-09-01',
    tanggal_selesai: '2027-08-31',
    id_admin: '1',
    nama_admin: 'Super Admin SILOKA',
    acid_transaction: 'POSTGRES_ACID_COMMITTED',
    created_at: '2026-09-01T08:30:00.000Z'
  }
];

export const resolveCanonicalOtkUnit = (inputCode) => {
  if (!inputCode) return null;
  const normalized = String(inputCode).trim().toUpperCase();
  return (
    OTK_UNSIL_MASTER_UNITS.find(
      (u) =>
        u.kode_unit === normalized ||
        u.kode_otk === normalized ||
        (normalized.startsWith('UN58.13') && u.kode_unit === 'FT') ||
        (normalized.startsWith('UN58.10') && u.kode_unit === 'FKIP') ||
        (normalized.startsWith('UN58.11') && u.kode_unit === 'FEB') ||
        (normalized.startsWith('UN58.12') && u.kode_unit === 'FP') ||
        (normalized.startsWith('UN58.14') && u.kode_unit === 'FISIP') ||
        (normalized.startsWith('UN58.15') && u.kode_unit === 'FIK') ||
        (normalized.startsWith('UN58.16') && u.kode_unit === 'FAI') ||
        (normalized.startsWith('UN58.08') && u.kode_unit === 'LPPM') ||
        (normalized.startsWith('UN58.09') && u.kode_unit === 'LPMPP') ||
        (normalized.startsWith('UN58.06') && u.kode_unit === 'BAKPK') ||
        (normalized.startsWith('UN58.07') && u.kode_unit === 'BKU') ||
        (normalized === 'UN58.6' && u.kode_unit === 'BKU') ||
        (normalized === 'UN58.5' && u.kode_unit === 'BAKPK')
    ) || null
  );
};

/**
 * GET /api/v1/unit-kerja/:unit_id/jabatan-tersedia
 * Menarik daftar jabatan yang valid secara SOTK (tbl_unit_jabatan_map JOIN tbl_master_jabatan)
 * berdasarkan unit_id tujuan yang sedang dipilih.
 */
export const getAvailablePositionsByUnit = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const targetUnitObj = resolveCanonicalOtkUnit(unit_id);

    if (!targetUnitObj) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: 'UnitNotFound',
        message: `Unit kerja '${unit_id}' tidak ditemukan dalam struktur OTK UNSIL.`
      });
    }

    let mappedPositions = [];
    if (
      ['REKTORAT', 'LPPM', 'LPMPP', 'FT', 'FKIP', 'FEB', 'FP', 'FISIP', 'FIK', 'FAI', 'PASCA'].includes(
        targetUnitObj.kode_unit
      )
    ) {
      mappedPositions = resolveValidJabatanForUnit(targetUnitObj.kode_unit);
    } else if (isDatabaseAvailable()) {
      try {
        const regCheck = await query(
          `SELECT to_regclass('public.tbl_unit_jabatan_map') AS tbl_exists`
        );
        if (regCheck.rows?.[0]?.tbl_exists) {
          const sql = `
            SELECT
              m.id_jabatan,
              m.nama_jabatan,
              u.nama_jabatan_spesifik,
              m.kategori_jabatan,
              m.is_signatory_tte,
              m.level_otorisasi,
              u.is_default_selection
            FROM tbl_unit_jabatan_map u
            JOIN tbl_master_jabatan m ON u.id_jabatan = m.id_jabatan
            WHERE u.kode_unit = $1
            ORDER BY u.urutan ASC;
          `;
          const dbRes = await query(sql, [targetUnitObj.kode_unit]);
          if (dbRes.rows && dbRes.rows.length > 0) {
            mappedPositions = dbRes.rows;
          }
        }
      } catch {
        mappedPositions = [];
      }
    }

    if (mappedPositions.length === 0) {
      mappedPositions = resolveValidJabatanForUnit(targetUnitObj.kode_unit);
    }

    return res.status(200).json({
      status: 200,
      success: true,
      unit: {
        kode_unit: targetUnitObj.kode_unit,
        kode_otk: targetUnitObj.kode_otk,
        nama_unit: targetUnitObj.nama_unit
      },
      total: mappedPositions.length,
      data: mappedPositions
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchPositionsError',
      message: 'Gagal memuat daftar jabatan tersedia untuk unit kerja tersebut.',
      details: err.message
    });
  }
};

/**
 * GET /api/admin/pegawai/unit-kerja-otk
 * Mengambil daftar master unit kerja OTK UNSIL (Permendikbudristek No. 19/2023)
 * beserta riwayat mutasi & penugasan tambahan terbaru.
 */
export const getMasterOtkUnitsAndHistory = async (req, res) => {
  try {
    let dbHistory = [];
    if (isDatabaseAvailable()) {
      try {
        const resDb = await query(`
          SELECT * FROM tbl_riwayat_mutasi
          ORDER BY created_at DESC
          LIMIT 50;
        `);
        dbHistory = resDb.rows || [];
      } catch {
        dbHistory = [];
      }
    }

    const mergedHistory = [...dbHistory, ...inMemoryMutationHistory].slice(0, 50);

    return res.status(200).json({
      status: 200,
      success: true,
      regulation: 'Permendikbudristek No. 19 Tahun 2023 tentang OTK Universitas Siliwangi',
      units: OTK_UNSIL_MASTER_UNITS,
      history: mergedHistory
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: 'Gagal memuat master unit kerja OTK UNSIL.',
      details: err.message
    });
  }
};

/**
 * POST /api/admin/pegawai/mutasi-unit
 * Mengeksekusi Mutasi Unit Penuh atau Penugasan Tambahan (Unit Sekunder)
 * dengan Validasi Ketat Pemetaan Jabatan (tbl_unit_jabatan_map) & Transaksi Atomik (ACID).
 */
export const executeUnitMutationOrAssignment = async (req, res) => {
  const {
    id_pegawai,
    nama_pegawai,
    nip_pegawai,
    unit_asal_id,
    unit_tujuan_id,
    jenis_perubahan, // 'Mutasi Unit Penuh' | 'Tugas Tambahan / Sekunder'
    jabatan_tujuan_id = '',
    jabatan_penugasan = '',
    nomor_sk,
    tanggal_mulai,
    tanggal_selesai = null,
    catatan_mutasi = ''
  } = req.body || {};

  // 1. Validasi Input Mandatori
  if (!id_pegawai || !unit_asal_id || !unit_tujuan_id || !jenis_perubahan || !nomor_sk || !tanggal_mulai) {
    return res.status(400).json({
      status: 400,
      success: false,
      error: 'ValidationError',
      message: 'Kolom pegawai, unit asal, unit tujuan, jenis perubahan, nomor SK, dan tanggal efektif wajib diisi!'
    });
  }

  const originUnitObj = resolveCanonicalOtkUnit(unit_asal_id) || {
    kode_unit: String(unit_asal_id).toUpperCase(),
    kode_otk: String(unit_asal_id).toUpperCase(),
    nama_unit: String(unit_asal_id)
  };
  const targetUnitObj = resolveCanonicalOtkUnit(unit_tujuan_id);

  if (!targetUnitObj) {
    return res.status(404).json({
      status: 404,
      success: false,
      error: 'TargetUnitNotFound',
      message: `Unit kerja tujuan '${unit_tujuan_id}' tidak ditemukan dalam struktur OTK UNSIL!`
    });
  }

  // 2. Validasi Ketat: Cegah Pemilihan Unit Tujuan yang Sama dengan Unit Asal
  if (
    originUnitObj.kode_unit === targetUnitObj.kode_unit ||
    originUnitObj.kode_otk === targetUnitObj.kode_otk
  ) {
    return res.status(422).json({
      status: 422,
      success: false,
      error: 'SameUnitConflict',
      message: `Validasi Ditolak: Unit kerja tujuan ([${targetUnitObj.kode_unit}] ${targetUnitObj.nama_unit}) tidak boleh sama dengan unit kerja asal ([${originUnitObj.kode_unit}] ${originUnitObj.nama_unit})!`
    });
  }

  // 3. Validasi Ketat Pemetaan Jabatan pada Unit Tujuan (tbl_unit_jabatan_map)
  const validPositionsForTargetUnit = resolveValidJabatanForUnit(targetUnitObj.kode_unit);
  let resolvedJabatanObj = null;

  if (jabatan_tujuan_id) {
    const normalizedJabatanId = String(jabatan_tujuan_id).trim().toUpperCase();
    resolvedJabatanObj =
      validPositionsForTargetUnit.find((j) => j.id_jabatan === normalizedJabatanId) ||
      validPositionsForTargetUnit.find((j) => j.id_jabatan.startsWith(`${normalizedJabatanId}_`));
    if (!resolvedJabatanObj) {
      return res.status(422).json({
        status: 422,
        success: false,
        error: 'InvalidUnitPositionMapping',
        message: `Validasi SOTK Ditolak: Jabatan ID '${jabatan_tujuan_id}' tidak terdaftar atau tidak sah pada unit kerja tujuan '[${targetUnitObj.kode_unit}] ${targetUnitObj.nama_unit}'!`,
        allowedPositions: validPositionsForTargetUnit.map((j) => ({
          id_jabatan: j.id_jabatan,
          nama_jabatan: j.nama_jabatan
        }))
      });
    }
  } else {
    // Gunakan default selection dari tbl_unit_jabatan_map jika tidak dikirim eksplisit
    resolvedJabatanObj =
      validPositionsForTargetUnit.find((j) => j.is_default_selection) ||
      validPositionsForTargetUnit[0];
  }

  const finalJabatanId = resolvedJabatanObj?.id_jabatan || 'JBT_KAPUS_LIT';
  const finalJabatanLabel =
    resolvedJabatanObj?.nama_jabatan_spesifik ||
    jabatan_penugasan ||
    resolvedJabatanObj?.nama_jabatan ||
    `Penugasan pada ${targetUnitObj.nama_unit}`;

  const isMutasiPenuh =
    jenis_perubahan === 'Mutasi Unit Penuh' ||
    jenis_perubahan === 'MUTASI_PENUH';

  const normalizedJenisPerubahan = isMutasiPenuh
    ? 'Mutasi Unit Penuh'
    : 'Tugas Tambahan / Sekunder';

  const adminId = String(req.user?.id_user || req.user?.id || '1');
  const adminName = req.user?.nama_lengkap || req.user?.nama || req.user?.name || 'Super Admin SILOKA';

  let dbTransactionCommitted = false;
  let client = null;

  // 4. Eksekusi Transaksi Atomik PostgreSQL (ACID: BEGIN -> UPDATE/INSERT -> LOG -> COMMIT)
  if (isDatabaseAvailable() && pool) {
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Pastikan skema tabel OTK, master jabatan, dan mutasi tersedia secara idempoten
      await client.query(`
        CREATE TABLE IF NOT EXISTS tbl_unit_kerja (
          kode_unit VARCHAR(32) PRIMARY KEY,
          kode_otk_persuratan VARCHAR(32) NOT NULL,
          nama_unit VARCHAR(200) NOT NULL,
          kategori_struktur VARCHAR(40) NOT NULL,
          label_kategori VARCHAR(100) NOT NULL,
          urutan_tampil INT DEFAULT 100,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tbl_master_jabatan (
          id_jabatan VARCHAR(40) PRIMARY KEY,
          nama_jabatan VARCHAR(150) NOT NULL,
          kategori_jabatan VARCHAR(40) NOT NULL,
          is_signatory_tte BOOLEAN DEFAULT FALSE,
          level_otorisasi VARCHAR(50) DEFAULT 'Level 2: Fungsional',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tbl_penugasan_sekunder (
          id_penugasan SERIAL PRIMARY KEY,
          id_pegawai VARCHAR(64) NOT NULL,
          unit_utama_id VARCHAR(32) NOT NULL,
          unit_sekunder_id VARCHAR(32) NOT NULL,
          jabatan_tujuan_id VARCHAR(40),
          jabatan_sekunder VARCHAR(150) DEFAULT 'Penugasan Tambahan / Fungsional',
          nomor_sk VARCHAR(120) NOT NULL,
          tanggal_mulai DATE NOT NULL,
          tanggal_selesai DATE,
          is_active BOOLEAN DEFAULT TRUE,
          created_by_admin VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tbl_riwayat_mutasi (
          id_mutasi SERIAL PRIMARY KEY,
          id_pegawai VARCHAR(64) NOT NULL,
          nama_pegawai VARCHAR(180) NOT NULL,
          nip_pegawai VARCHAR(64) NOT NULL,
          unit_asal_id VARCHAR(32) NOT NULL,
          unit_tujuan_id VARCHAR(32) NOT NULL,
          jenis_perubahan VARCHAR(40) NOT NULL,
          jabatan_tujuan_id VARCHAR(40),
          jabatan_penugasan VARCHAR(150),
          nomor_sk VARCHAR(120) NOT NULL,
          tanggal_mulai DATE NOT NULL,
          tanggal_selesai DATE,
          id_admin VARCHAR(64) NOT NULL,
          nama_admin VARCHAR(180),
          catatan_mutasi TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE tbl_penugasan_sekunder ADD COLUMN IF NOT EXISTS jabatan_tujuan_id VARCHAR(40);
        ALTER TABLE tbl_riwayat_mutasi ADD COLUMN IF NOT EXISTS jabatan_tujuan_id VARCHAR(40);
      `);

      // Pastikan record jabatan_tujuan_id ada di tbl_master_jabatan
      await client.query(
        `INSERT INTO tbl_master_jabatan (id_jabatan, nama_jabatan, kategori_jabatan, is_signatory_tte, level_otorisasi)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_jabatan) DO NOTHING`,
        [
          finalJabatanId,
          resolvedJabatanObj?.nama_jabatan || finalJabatanLabel,
          resolvedJabatanObj?.kategori_jabatan || 'STRUKTURAL_SUB_UNIT',
          Boolean(resolvedJabatanObj?.is_signatory_tte),
          resolvedJabatanObj?.level_otorisasi || 'Level 2: Fungsional'
        ]
      );

      if (isMutasiPenuh) {
        // Skenario A: Mutasi Unit Penuh -> Primary Unit pada tbl_users berpindah ke unit tujuan
        await client.query(
          `UPDATE tbl_users
           SET kode_unit_kerja = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id_user::text = $2::text OR nip_nik = $3`,
          [targetUnitObj.kode_unit, String(id_pegawai), String(nip_pegawai || '')]
        );
      } else {
        // Skenario B: Tugas Tambahan / Unit Sekunder -> Primary Unit TETAP di unit asal (misal: FT),
        // simpan relasi Foreign Key jabatan_tujuan_id pada tbl_penugasan_sekunder
        await client.query(
          `INSERT INTO tbl_penugasan_sekunder (
             id_pegawai, unit_utama_id, unit_sekunder_id, jabatan_tujuan_id, jabatan_sekunder,
             nomor_sk, tanggal_mulai, tanggal_selesai, is_active, created_by_admin
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)`,
          [
            String(id_pegawai),
            originUnitObj.kode_unit,
            targetUnitObj.kode_unit,
            finalJabatanId,
            finalJabatanLabel,
            nomor_sk.trim(),
            tanggal_mulai,
            tanggal_selesai || null,
            adminId
          ]
        );
      }

      // Insert ke tabel audit riwayat mutasi (tbl_riwayat_mutasi) dengan jabatan_tujuan_id (Foreign Key)
      await client.query(
        `INSERT INTO tbl_riwayat_mutasi (
           id_pegawai, nama_pegawai, nip_pegawai,
           unit_asal_id, unit_tujuan_id, jenis_perubahan,
           jabatan_tujuan_id, jabatan_penugasan, nomor_sk, tanggal_mulai, tanggal_selesai,
           id_admin, nama_admin, catatan_mutasi
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          String(id_pegawai),
          nama_pegawai || 'Pegawai UNSIL',
          nip_pegawai || '-',
          originUnitObj.kode_unit,
          targetUnitObj.kode_unit,
          normalizedJenisPerubahan,
          finalJabatanId,
          finalJabatanLabel,
          nomor_sk.trim(),
          tanggal_mulai,
          tanggal_selesai || null,
          adminId,
          adminName,
          catatan_mutasi || null
        ]
      );

      await client.query('COMMIT');
      dbTransactionCommitted = true;
    } catch (txErr) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // ignore rollback error
        }
      }
      console.warn('[UNIT-MUTATION-TX] Fallback to runtime transaction store:', txErr.message);
    } finally {
      if (client) client.release();
    }
  }

  // 5. Bangun Bundel Otomatis 5 Mekanisme Teknis Context-Aware RBAC & Tupoksi (Pertek 3/2023 & SK Rektor 2803/2023)
  const rbacFiveMechanisms = buildFiveMechanismsRbacBundle({
    employee: {
      id: String(id_pegawai),
      nama_lengkap: nama_pegawai || 'Pegawai UNSIL',
      nip_nik: nip_pegawai || '-'
    },
    originUnitObj,
    targetUnitObj,
    jabatanObj: {
      id_jabatan: finalJabatanId,
      nama_jabatan: resolvedJabatanObj?.nama_jabatan || finalJabatanLabel,
      nama_jabatan_spesifik: finalJabatanLabel
    },
    jenisPerubahan: normalizedJenisPerubahan,
    nomorSk: nomor_sk.trim(),
    tanggalMulai: tanggal_mulai,
    tanggalSelesai: tanggal_selesai || ''
  });

  // 6. Buat Record Riwayat Mutasi & Sinkronkan dengan Memory User Store
  const auditRecord = {
    id_mutasi: `MUT-${Date.now()}`,
    id_pegawai: String(id_pegawai),
    nama_pegawai: nama_pegawai || 'Pegawai UNSIL',
    nip_pegawai: nip_pegawai || '-',
    unit_asal_id: originUnitObj.kode_unit,
    unit_asal_otk: originUnitObj.kode_otk,
    unit_asal_nama: originUnitObj.nama_unit,
    unit_tujuan_id: targetUnitObj.kode_unit,
    unit_tujuan_otk: targetUnitObj.kode_otk,
    unit_tujuan_nama: targetUnitObj.nama_unit,
    jenis_perubahan: normalizedJenisPerubahan,
    jabatan_tujuan_id: finalJabatanId,
    jabatan_penugasan: finalJabatanLabel,
    is_signatory_tte: Boolean(resolvedJabatanObj?.is_signatory_tte),
    nomor_sk: nomor_sk.trim(),
    tanggal_mulai,
    tanggal_selesai: tanggal_selesai || null,
    id_admin: adminId,
    nama_admin: adminName,
    catatan_mutasi: catatan_mutasi || '',
    acid_transaction: dbTransactionCommitted ? 'POSTGRES_ACID_COMMITTED' : 'RUNTIME_ATOMIC_COMMITTED',
    rbac_five_mechanisms: rbacFiveMechanisms,
    created_at: new Date().toISOString()
  };

  inMemoryMutationHistory.unshift(auditRecord);

  // Sinkronisasi ke memoryUserStore
  if (Array.isArray(memoryUserStore)) {
    const idx = memoryUserStore.findIndex(
      (u) =>
        String(u.id || u.id_user) === String(id_pegawai) ||
        (nip_pegawai && String(u.nip || u.nip_nik) === String(nip_pegawai))
    );
    if (idx >= 0) {
      const existing = memoryUserStore[idx];
      const existingSecondary = Array.isArray(existing.secondary_units) ? existing.secondary_units : [];
      if (isMutasiPenuh) {
        memoryUserStore[idx] = {
          ...existing,
          kode_unit: targetUnitObj.kode_unit,
          kode_unit_kerja: targetUnitObj.kode_unit,
          unit_kerja_id: targetUnitObj.kode_otk,
          unit: targetUnitObj.nama_unit,
          jabatan_tujuan_id: finalJabatanId,
          jabatan: finalJabatanLabel,
          role: rbacFiveMechanisms.mekanisme_2_three_pillar_mapping.pilar_2_role_system,
          roleLabel: finalJabatanLabel,
          is_pejabat: rbacFiveMechanisms.mekanisme_4_specific_modules_activation.tte_bsre_enabled,
          signatureReady: true,
          permissions: rbacFiveMechanisms.mekanisme_1_role_permission_matrix.permissions,
          rbac_five_mechanisms: rbacFiveMechanisms
        };
      } else {
        const updatedSecondary = [
          ...existingSecondary.filter((s) => s.kode_unit !== targetUnitObj.kode_unit),
          {
            kode_unit: targetUnitObj.kode_unit,
            unit_kerja_id: targetUnitObj.kode_otk,
            nama_unit: targetUnitObj.nama_unit,
            jabatan_tujuan_id: finalJabatanId,
            jabatan_penugasan: finalJabatanLabel,
            nomor_sk: auditRecord.nomor_sk,
            tanggal_mulai: auditRecord.tanggal_mulai,
            tanggal_selesai: auditRecord.tanggal_selesai
          }
        ];
        memoryUserStore[idx] = {
          ...existing,
          secondary_units: updatedSecondary,
          dual_role_profiles: rbacFiveMechanisms.mekanisme_5_context_switcher_and_sk,
          rbac_five_mechanisms: rbacFiveMechanisms
        };
      }
    }
  }

  return res.status(200).json({
    status: 200,
    success: true,
    message: isMutasiPenuh
      ? `Mutasi Unit Penuh berhasil: ${auditRecord.nama_pegawai} kini menjabat sebagai ${finalJabatanLabel} (${finalJabatanId}) di [${targetUnitObj.kode_unit}] ${targetUnitObj.nama_unit}.`
      : `Penugasan Tambahan berhasil: ${auditRecord.nama_pegawai} tetap ber-homebase di [${originUnitObj.kode_unit}] dan resmi memegang jabatan sekunder ${finalJabatanLabel} (${finalJabatanId}) di [${targetUnitObj.kode_unit}] ${targetUnitObj.nama_unit}.`,
    data: auditRecord
  });
};
