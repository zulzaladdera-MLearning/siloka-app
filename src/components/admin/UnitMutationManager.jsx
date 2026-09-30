import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Building2,
  ArrowRightLeft,
  Briefcase,
  FileCheck2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  X,
  History,
  UserCheck,
  Layers,
  Lock,
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react';
import { buildFiveMechanismsRbacBundle } from '../../utils/rbacTupoksiEngine';

export const OTK_UNSIL_GROUPED_UNITS = [
  {
    groupKey: 'PIMPINAN_ORGAN',
    groupLabel: '1. Unsur Pimpinan & Organ Penunjang',
    items: [
      { kode_unit: 'REKTORAT', kode_otk: 'UN58', nama_unit: 'Rektorat (Rektor & Wakil Rektor 1–3)' },
      { kode_unit: 'SENAT', kode_otk: 'UN58.SENAT', nama_unit: 'Senat Universitas Siliwangi' },
      { kode_unit: 'SPI', kode_otk: 'UN58.19', nama_unit: 'Satuan Pengawas Internal (SPI)' },
      { kode_unit: 'DEWAN_PENYANTUN', kode_otk: 'UN58.DP', nama_unit: 'Dewan Penyantun Universitas Siliwangi' }
    ]
  },
  {
    groupKey: 'BIRO',
    groupLabel: '2. Unsur Pelaksana Administrasi (Biro)',
    items: [
      { kode_unit: 'BAKPK', kode_otk: 'UN58.06', nama_unit: 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)' },
      { kode_unit: 'BKU', kode_otk: 'UN58.07', nama_unit: 'Biro Keuangan dan Umum (BKU)' }
    ]
  },
  {
    groupKey: 'FAKULTAS_PASCASARJANA',
    groupLabel: '3. Unsur Pelaksana Akademik (7 Fakultas & Pascasarjana)',
    items: [
      { kode_unit: 'FKIP', kode_otk: 'UN58.10', nama_unit: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)' },
      { kode_unit: 'FEB', kode_otk: 'UN58.11', nama_unit: 'Fakultas Ekonomi dan Bisnis (FEB)' },
      { kode_unit: 'FP', kode_otk: 'UN58.12', nama_unit: 'Fakultas Pertanian (FP)' },
      { kode_unit: 'FT', kode_otk: 'UN58.13', nama_unit: 'Fakultas Teknik (FT)' },
      { kode_unit: 'FISIP', kode_otk: 'UN58.14', nama_unit: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)' },
      { kode_unit: 'FIK', kode_otk: 'UN58.15', nama_unit: 'Fakultas Ilmu Kesehatan (FIK)' },
      { kode_unit: 'FAI', kode_otk: 'UN58.16', nama_unit: 'Fakultas Agama Islam (FAI)' },
      { kode_unit: 'PASCA', kode_otk: 'UN58.17', nama_unit: 'Program Pascasarjana' }
    ]
  },
  {
    groupKey: 'LEMBAGA',
    groupLabel: '4. Unsur Pelaksana Akademik & Mutu (Lembaga)',
    items: [
      { kode_unit: 'LPPM', kode_otk: 'UN58.08', nama_unit: 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)' },
      { kode_unit: 'LPMPP', kode_otk: 'UN58.09', nama_unit: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)' }
    ]
  },
  {
    groupKey: 'UPA',
    groupLabel: '5. Unsur Penunjang Akademik (UPA)',
    items: [
      { kode_unit: 'UPA_PERPUS', kode_otk: 'UN58.20', nama_unit: 'UPA Perpustakaan' },
      { kode_unit: 'UPA_TIK', kode_otk: 'UN58.21', nama_unit: 'UPA Teknologi Informasi dan Komunikasi (TIK)' },
      { kode_unit: 'UPA_BAHASA', kode_otk: 'UN58.22', nama_unit: 'UPA Bahasa' },
      { kode_unit: 'UPA_PKKM', kode_otk: 'UN58.23', nama_unit: 'UPA Pengembangan Karier & Kewirausahaan Mahasiswa' },
      { kode_unit: 'UPA_LUK', kode_otk: 'UN58.24', nama_unit: 'UPA Layanan Uji Kompetensi' }
    ]
  }
];

const ALL_FLAT_OTK_UNITS = OTK_UNSIL_GROUPED_UNITS.flatMap((g) =>
  g.items.map((item) => ({ ...item, groupLabel: g.groupLabel }))
);

/**
 * Pemetaan Lokal Kondisional Jabatan Baku SOTK (tbl_master_jabatan <-> tbl_unit_jabatan_map)
 * Digunakan sebagai instant hydration & fallback saat mengambil dari GET /api/v1/unit-kerja/:unit_id/jabatan-tersedia
 */
export const getClientMappedPositionsByUnit = (unitCode) => {
  if (!unitCode) return [];
  const code = String(unitCode).trim().toUpperCase();
  const unitObj = ALL_FLAT_OTK_UNITS.find((u) => u.kode_unit === code);
  const unitName = unitObj ? unitObj.nama_unit : code;

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
      {
        id_jabatan: 'JBT_DEKAN',
        nama_jabatan: 'Dekan',
        nama_jabatan_spesifik: `Dekan ${unitName}`,
        sub_kelompok: '1. Dekan',
        kategori_jabatan: 'STRUKTURAL_PIMPINAN',
        is_signatory_tte: true,
        level_otorisasi: 'Level 1: Pimpinan Fakultas'
      },
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
      ...kajurItems,
      ...sekjurItems,
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

export const resolveEmployeeOriginOtkUnit = (emp) => {
  if (!emp) {
    return { kode_unit: 'FT', kode_otk: 'UN58.13', nama_unit: 'Fakultas Teknik (FT)' };
  }
  const rawCode = String(emp.kode_unit || emp.kode_unit_kerja || emp.unit_kerja_id || '').trim().toUpperCase();
  const rawName = String(emp.unit || '').toLowerCase();

  const directMatch = ALL_FLAT_OTK_UNITS.find(
    (u) =>
      u.kode_unit === rawCode ||
      u.kode_otk === rawCode ||
      (rawCode.startsWith('UN58.13') && u.kode_unit === 'FT') ||
      (rawCode.startsWith('UN58.10') && u.kode_unit === 'FKIP') ||
      (rawCode.startsWith('UN58.11') && u.kode_unit === 'FEB') ||
      (rawCode.startsWith('UN58.12') && u.kode_unit === 'FP') ||
      (rawCode.startsWith('UN58.14') && u.kode_unit === 'FISIP') ||
      (rawCode.startsWith('UN58.15') && u.kode_unit === 'FIK') ||
      (rawCode.startsWith('UN58.16') && u.kode_unit === 'FAI') ||
      (rawCode.startsWith('UN58.17') && u.kode_unit === 'PASCA') ||
      (rawCode.startsWith('UN58.08') && u.kode_unit === 'LPPM') ||
      (rawCode.startsWith('UN58.09') && u.kode_unit === 'LPMPP') ||
      (rawCode.startsWith('UN58.06') && u.kode_unit === 'BAKPK') ||
      (rawCode.startsWith('UN58.07') && u.kode_unit === 'BKU') ||
      (rawCode === 'UN58.6' && u.kode_unit === 'BKU') ||
      (rawCode === 'UN58.5' && u.kode_unit === 'BAKPK')
  );

  if (directMatch) return directMatch;

  if (rawName.includes('teknik') || rawName.includes('informatika')) {
    return ALL_FLAT_OTK_UNITS.find((u) => u.kode_unit === 'FT');
  }
  if (rawName.includes('fkip') || rawName.includes('keguruan')) {
    return ALL_FLAT_OTK_UNITS.find((u) => u.kode_unit === 'FKIP');
  }
  if (rawName.includes('lppm')) {
    return ALL_FLAT_OTK_UNITS.find((u) => u.kode_unit === 'LPPM');
  }
  if (rawName.includes('bku') || rawName.includes('keuangan')) {
    return ALL_FLAT_OTK_UNITS.find((u) => u.kode_unit === 'BKU');
  }

  return {
    kode_unit: rawCode || 'FT',
    kode_otk: emp.unit_kerja_id || 'UN58.13',
    nama_unit: emp.unit || 'Fakultas Teknik (FT)'
  };
};

export const UnitMutationManager = ({ allUsers = [], currentUser, onUpdateUsers, showToast }) => {
  // Default select a Fakultas Teknik (FT) lecturer if available
  const defaultFtEmployee = useMemo(() => {
    return (
      allUsers.find((u) => {
        const origin = resolveEmployeeOriginOtkUnit(u);
        return origin.kode_unit === 'FT';
      }) || allUsers[0] || null
    );
  }, [allUsers]);

  // Kolom 1: Searchable Combobox Pegawai
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() =>
    defaultFtEmployee ? String(defaultFtEmployee.id || defaultFtEmployee.id_user) : ''
  );

  // Kolom 2: Radio button tipe perubahan ('Tugas Tambahan / Sekunder' vs 'Mutasi Unit Penuh')
  const [jenisPerubahan, setJenisPerubahan] = useState('Tugas Tambahan / Sekunder');

  // Kolom 3: Dropdown Unit Kerja Tujuan (bisa dikosongkan '' untuk menguji efek Dependent Dropdown Terkunci)
  const [unitTujuanKode, setUnitTujuanKode] = useState('LPPM');

  // Kolom 4: Dependent Searchable Select Box "Jabatan / Peran di Unit Tujuan" (Foreign Key jabatan_tujuan_id)
  const [availablePositions, setAvailablePositions] = useState(() =>
    getClientMappedPositionsByUnit('LPPM')
  );
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [jabatanTujuanId, setJabatanTujuanId] = useState('JBT_KOOR_PUSLIT');
  const [isJabatanDropdownOpen, setIsJabatanDropdownOpen] = useState(false);
  const [jabatanSearchTerm, setJabatanSearchTerm] = useState('');

  const [nomorSk, setNomorSk] = useState('842/UN58/KP.04.02/2026');
  const [tanggalMulai, setTanggalMulai] = useState(() => new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState('2027-12-31');

  // Confirmation Modal & Submission State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [mutationHistory, setMutationHistory] = useState([
    {
      id_mutasi: 'MUT-2026-001',
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
      status_transaksi: 'Tercatat Sah'
    }
  ]);

  // Selected Employee Object
  const selectedEmployee = useMemo(() => {
    return (
      allUsers.find((u) => String(u.id || u.id_user) === String(selectedEmployeeId)) ||
      defaultFtEmployee ||
      null
    );
  }, [allUsers, selectedEmployeeId, defaultFtEmployee]);

  const originUnitObj = useMemo(
    () => resolveEmployeeOriginOtkUnit(selectedEmployee),
    [selectedEmployee]
  );

  const targetUnitObj = useMemo(
    () => ALL_FLAT_OTK_UNITS.find((u) => u.kode_unit === unitTujuanKode) || null,
    [unitTujuanKode]
  );

  // Jika unit asal sama dengan unit tujuan saat ganti pegawai, otomatis arahkan ke LPPM atau FT
  useEffect(() => {
    if (originUnitObj && unitTujuanKode && unitTujuanKode === originUnitObj.kode_unit) {
      setUnitTujuanKode(originUnitObj.kode_unit === 'LPPM' ? 'FT' : 'LPPM');
    }
  }, [originUnitObj, unitTujuanKode]);

  // =========================================================================
  // DEPENDENT DROPDOWN EFFECT:
  // Trigger fetch ke GET /api/v1/unit-kerja/:unit_id/jabatan-tersedia setiap kali
  // "Unit Kerja Tujuan" (unitTujuanKode) dipilih/diubah.
  // Jika unitTujuanKode kosong (''), kosongkan daftar jabatan & kunci dropdown!
  // =========================================================================
  useEffect(() => {
    if (!unitTujuanKode) {
      setAvailablePositions([]);
      setJabatanTujuanId('');
      setIsJabatanDropdownOpen(false);
      return;
    }

    let isCancelled = false;
    const localFallback = getClientMappedPositionsByUnit(unitTujuanKode);
    setAvailablePositions(localFallback);
    const defaultPos =
      localFallback.find((p) => p.is_default_selection) || localFallback[0] || null;
    setJabatanTujuanId(defaultPos ? defaultPos.id_jabatan : '');

    const fetchPositionsFromBackend = async () => {
      setIsLoadingPositions(true);
      try {
        const res = await fetch(
          `/api/v1/unit-kerja/${encodeURIComponent(unitTujuanKode)}/jabatan-tersedia`
        );
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && Array.isArray(json?.data) && json.data.length > 0) {
            setAvailablePositions(json.data);
            const backendDefault =
              json.data.find((p) => p.is_default_selection) || json.data[0];
            if (backendDefault) {
              setJabatanTujuanId(backendDefault.id_jabatan);
            }
          }
        }
      } catch {
        // Fallback ke localFallback yang sudah ter-set secara sinkron
      } finally {
        if (!isCancelled) {
          setIsLoadingPositions(false);
        }
      }
    };

    fetchPositionsFromBackend();
    return () => {
      isCancelled = true;
    };
  }, [unitTujuanKode]);

  const selectedJabatanObj = useMemo(() => {
    return (
      availablePositions.find((p) => p.id_jabatan === jabatanTujuanId) ||
      availablePositions[0] ||
      null
    );
  }, [availablePositions, jabatanTujuanId]);

  // =========================================================================
  // 5 MEKANISME TEKNIS UTAMA CONTEXT-AWARE RBAC & TUPOKSI OTOMATIS (LIVE)
  // =========================================================================
  const liveFiveMechanisms = useMemo(() => {
    const empName =
      selectedEmployee?.nama_lengkap ||
      selectedEmployee?.nama ||
      selectedEmployee?.name ||
      'Dosen UNSIL';
    const empNip = selectedEmployee?.nip_nik || selectedEmployee?.nip || '198504122015041002';

    return buildFiveMechanismsRbacBundle({
      nip_pegawai: empNip,
      nama_pegawai: empName,
      unit_asal_id: originUnitObj?.kode_unit || 'FT',
      unit_tujuan_id: targetUnitObj?.kode_unit || 'LPPM',
      jabatan_tujuan_id: selectedJabatanObj?.id_jabatan || 'JBT_DEKAN',
      nama_jabatan_spesifik:
        selectedJabatanObj?.nama_jabatan_spesifik || 'Dekan Fakultas Teknik',
      jenis_perubahan: jenisPerubahan,
      nomor_sk: nomorSk,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai
    });
  }, [
    selectedEmployee,
    originUnitObj,
    targetUnitObj,
    selectedJabatanObj,
    jenisPerubahan,
    nomorSk,
    tanggalMulai,
    tanggalSelesai
  ]);

  const filteredJabatanOptions = useMemo(() => {
    const q = jabatanSearchTerm.trim().toLowerCase();
    if (!q) return availablePositions;
    return availablePositions.filter(
      (pos) =>
        pos.nama_jabatan.toLowerCase().includes(q) ||
        pos.nama_jabatan_spesifik.toLowerCase().includes(q) ||
        pos.id_jabatan.toLowerCase().includes(q) ||
        pos.level_otorisasi.toLowerCase().includes(q)
    );
  }, [availablePositions, jabatanSearchTerm]);

  // Filtered employees for Searchable Combobox
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allUsers.slice(0, 25);
    return allUsers.filter((u) => {
      const name = String(u.nama_lengkap || u.nama || u.name || '').toLowerCase();
      const nip = String(u.nip_nik || u.nip || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const origin = resolveEmployeeOriginOtkUnit(u);
      return (
        name.includes(q) ||
        nip.includes(q) ||
        email.includes(q) ||
        origin.kode_unit.toLowerCase().includes(q) ||
        origin.nama_unit.toLowerCase().includes(q)
      );
    });
  }, [allUsers, searchTerm]);

  const handleOpenConfirmModal = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedEmployee) {
      setValidationError('Silakan pilih profil pegawai/dosen terlebih dahulu pada Kolom 1.');
      return;
    }

    if (!unitTujuanKode || !targetUnitObj) {
      setValidationError(
        'Silakan pilih Unit Kerja Tujuan pada Kolom 3 terlebih dahulu sebelum memilih Jabatan Tujuan.'
      );
      return;
    }

    // Validasi Ketat: Cegah pemilihan unit tujuan yang sama dengan unit asal
    if (originUnitObj.kode_unit === targetUnitObj.kode_unit) {
      setValidationError(
        `Validasi Ditolak: Unit Tujuan ([${targetUnitObj.kode_unit}] ${targetUnitObj.nama_unit}) tidak boleh sama dengan Unit Kerja Asal ([${originUnitObj.kode_unit}] ${originUnitObj.nama_unit})!`
      );
      return;
    }

    if (!jabatanTujuanId || !selectedJabatanObj) {
      setValidationError(
        'Silakan pilih Jabatan / Peran di Unit Tujuan dari daftar dropdown SOTK pada Kolom 4.'
      );
      return;
    }

    if (!nomorSk.trim()) {
      setValidationError('Nomor SK Mutasi / Penugasan wajib diisi pada Kolom 4.');
      return;
    }

    if (!tanggalMulai) {
      setValidationError('Tanggal efektif mulai wajib diisi pada Kolom 4.');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleExecuteAtomicMutation = async () => {
    if (!selectedEmployee || !targetUnitObj || !selectedJabatanObj) return;
    setIsSubmitting(true);
    setValidationError('');

    const empName =
      selectedEmployee.nama_lengkap || selectedEmployee.nama || selectedEmployee.name || 'Dosen UNSIL';
    const empNip = selectedEmployee.nip_nik || selectedEmployee.nip || '-';
    const empId = String(selectedEmployee.id || selectedEmployee.id_user);

    const payload = {
      id_pegawai: empId,
      nama_pegawai: empName,
      nip_pegawai: empNip,
      unit_asal_id: originUnitObj.kode_unit,
      unit_tujuan_id: targetUnitObj.kode_unit,
      jenis_perubahan: jenisPerubahan,
      jabatan_tujuan_id: selectedJabatanObj.id_jabatan,
      jabatan_penugasan: selectedJabatanObj.nama_jabatan_spesifik,
      nomor_sk: nomorSk.trim(),
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai || null
    };

    try {
      const token =
        localStorage.getItem('siloka_auth_token') ||
        sessionStorage.getItem('siloka_auth_token') ||
        '';

      let responseRecord = null;
      try {
        const res = await fetch('/api/admin/pegawai/mutasi-unit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-user-role': 'Super Admin'
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok && res.status === 422) {
          throw new Error(json.message || 'Validasi SOTK ditolak.');
        }
        if (json?.data) {
          responseRecord = json.data;
        }
      } catch (netErr) {
        if (netErr.message && (netErr.message.includes('tidak boleh sama') || netErr.message.includes('Ditolak'))) {
          throw netErr;
        }
      }

      const rbacBundle = responseRecord?.rbac_five_mechanisms || liveFiveMechanisms;

      const finalAuditRecord = responseRecord || {
        id_mutasi: `MUT-${Date.now()}`,
        id_pegawai: empId,
        nama_pegawai: empName,
        nip_pegawai: empNip,
        unit_asal_id: originUnitObj.kode_unit,
        unit_asal_nama: originUnitObj.nama_unit,
        unit_tujuan_id: targetUnitObj.kode_unit,
        unit_tujuan_nama: targetUnitObj.nama_unit,
        jenis_perubahan: jenisPerubahan,
        jabatan_tujuan_id: selectedJabatanObj.id_jabatan,
        jabatan_penugasan: selectedJabatanObj.nama_jabatan_spesifik,
        is_signatory_tte: selectedJabatanObj.is_signatory_tte,
        nomor_sk: payload.nomor_sk,
        tanggal_mulai: payload.tanggal_mulai,
        tanggal_selesai: payload.tanggal_selesai,
        rbac_five_mechanisms: rbacBundle,
        status_transaksi: 'Tercatat Sah'
      };

      // Update daftar riwayat mutasi
      setMutationHistory((prev) => [finalAuditRecord, ...prev]);

      // Update state pegawai di aplikasi (Mutasi Penuh vs Tugas Tambahan Sekunder + 5 Mekanisme RBAC & Context Switcher)
      if (typeof onUpdateUsers === 'function') {
        const isMutasiPenuh = jenisPerubahan === 'Mutasi Unit Penuh';
        const existingSecondary = Array.isArray(selectedEmployee.secondary_units)
          ? selectedEmployee.secondary_units
          : [];
        const dualProfiles = rbacBundle.mekanisme_5_context_switcher_and_sk.profiles;
        const isSkExpired = rbacBundle.mekanisme_5_context_switcher_and_sk.sk_auto_expiration.is_expired;
        const activePermissions = rbacBundle.mekanisme_1_role_permission_matrix.permissions;

        const updatedEmployee = isMutasiPenuh
          ? {
              ...selectedEmployee,
              kode_unit: targetUnitObj.kode_unit,
              kode_unit_kerja: targetUnitObj.kode_unit,
              unit_kerja_id: targetUnitObj.kode_otk,
              unit: targetUnitObj.nama_unit,
              jabatan_tujuan_id: selectedJabatanObj.id_jabatan,
              jabatan: selectedJabatanObj.nama_jabatan_spesifik,
              roleLabel: selectedJabatanObj.nama_jabatan_spesifik,
              role: selectedJabatanObj.is_signatory_tte && !isSkExpired ? 'PEJABAT' : 'DOSEN',
              is_pejabat: Boolean(selectedJabatanObj.is_signatory_tte && !isSkExpired),
              signatureReady: Boolean(selectedJabatanObj.is_signatory_tte && !isSkExpired),
              permissions: activePermissions,
              rbac_five_mechanisms: rbacBundle,
              dual_role_profiles: dualProfiles
            }
          : {
              ...selectedEmployee,
              roleLabel: !isSkExpired
                ? selectedJabatanObj.nama_jabatan_spesifik
                : selectedEmployee.roleLabel,
              jabatan: !isSkExpired
                ? selectedJabatanObj.nama_jabatan_spesifik
                : selectedEmployee.jabatan,
              role: selectedJabatanObj.is_signatory_tte && !isSkExpired ? 'PEJABAT' : selectedEmployee.role,
              is_pejabat: Boolean(selectedJabatanObj.is_signatory_tte && !isSkExpired),
              signatureReady: Boolean(selectedJabatanObj.is_signatory_tte && !isSkExpired),
              permissions: activePermissions,
              rbac_five_mechanisms: rbacBundle,
              dual_role_profiles: dualProfiles,
              secondary_units: [
                ...existingSecondary.filter((s) => s.kode_unit !== targetUnitObj.kode_unit),
                {
                  kode_unit: targetUnitObj.kode_unit,
                  unit_kerja_id: targetUnitObj.kode_otk,
                  nama_unit: targetUnitObj.nama_unit,
                  jabatan_tujuan_id: selectedJabatanObj.id_jabatan,
                  jabatan_penugasan: selectedJabatanObj.nama_jabatan_spesifik,
                  is_signatory_tte: Boolean(selectedJabatanObj.is_signatory_tte && !isSkExpired),
                  nomor_sk: payload.nomor_sk,
                  tanggal_mulai: payload.tanggal_mulai,
                  tanggal_selesai: payload.tanggal_selesai
                }
              ]
            };

        onUpdateUsers([updatedEmployee]);
      }

      setIsConfirmModalOpen(false);
      if (typeof showToast === 'function') {
        showToast(
          jenisPerubahan === 'Mutasi Unit Penuh'
            ? `Mutasi Unit Penuh berhasil: ${empName} kini menjabat sebagai ${selectedJabatanObj.nama_jabatan_spesifik} (${selectedJabatanObj.id_jabatan}).`
            : `Tugas Tambahan berhasil: ${empName} memegang jabatan sekunder ${selectedJabatanObj.nama_jabatan_spesifik} (${selectedJabatanObj.id_jabatan}) di [${targetUnitObj.kode_unit}].`,
          'success'
        );
      }
    } catch (err) {
      setValidationError(err.message || 'Gagal mengeksekusi transaksi mutasi unit kerja.');
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isJabatanLocked = !unitTujuanKode || !targetUnitObj;

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-800/20 shadow-md overflow-hidden">
      {/* Header Panel Arsitektur Mutasi & Dependent Dropdown SOTK UNSIL */}
      <div className="bg-gradient-to-r from-unsil-green-950 via-slate-900 to-unsil-green-900 p-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Standar Formasi SOTK Resmi UNSIL
          </div>
          <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            Manajemen Mutasi Unit Kerja &amp; Penugasan Tambahan (Unit Sekunder)
          </h3>
          <p className="text-xs text-emerald-100/85">
            Kolom <strong>Jabatan / Peran di Unit Tujuan</strong> menyesuaikan secara otomatis dan hanya menampilkan formasi jabatan yang sah sesuai Struktur Organisasi dan Tata Kerja (SOTK) unit tujuan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setUnitTujuanKode('');
              setJabatanTujuanId('');
              setIsJabatanDropdownOpen(false);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Kosongkan Unit Kerja Tujuan untuk mereset pilihan Jabatan"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Pilihan</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleOpenConfirmModal} className="p-6 space-y-6">
        {validationError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 4-Column Structured Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================================================================= */}
          {/* KOLOM 1: SEARCHABLE COMBOBOX / AUTOCOMPLETE PROFIL DOSEN/PEGAWAI  */}
          {/* ================================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-unsil-green-900 text-white inline-flex items-center justify-center text-[10px]">
                  1
                </span>
                Cari &amp; Pilih Pegawai / Dosen (NIP / Nama)
              </label>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Searchable Combobox
              </span>
            </div>

            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Ketik NIP atau Nama Dosen (misal: Raka, Aris, FT)..."
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-700 focus:border-unsil-green-700 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="absolute right-2 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  {isDropdownOpen ? 'Tutup' : 'Daftar'}
                </button>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => {
                    const empId = String(emp.id || emp.id_user);
                    const empName = emp.nama_lengkap || emp.nama || emp.name;
                    const empNip = emp.nip_nik || emp.nip || '-';
                    const empOrigin = resolveEmployeeOriginOtkUnit(emp);
                    const isSelected = empId === String(selectedEmployeeId);

                    return (
                      <button
                        key={empId}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId(empId);
                          setSearchTerm('');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected ? 'bg-emerald-50 font-bold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{empName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            NIP: {empNip} • {emp.roleLabel || emp.role}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono text-[11px] font-bold shrink-0">
                          [{empOrigin.kode_unit}] {empOrigin.nama_unit.split('(')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Kartu Profil & Badge Unit Kerja Saat Ini */}
            {selectedEmployee && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-unsil-green-800" />
                      {selectedEmployee.nama_lengkap || selectedEmployee.nama || selectedEmployee.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      NIP/NIK: {selectedEmployee.nip_nik || selectedEmployee.nip || '-'} • Role:{' '}
                      {selectedEmployee.roleLabel || selectedEmployee.role}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Unit Kerja Saat Ini (Homebase Utama):
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-900 text-amber-300 font-mono text-xs font-extrabold shadow-2xs">
                      <Building2 className="w-3.5 h-3.5" /> [{originUnitObj.kode_unit}] {originUnitObj.nama_unit}
                    </span>
                  </div>
                </div>

                {/* Tampilkan Badge Unit Sekunder Aktif jika sudah ada */}
                {Array.isArray(selectedEmployee.secondary_units) &&
                  selectedEmployee.secondary_units.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Tugas Tambahan / Unit Sekunder Aktif:
                      </span>
                      {selectedEmployee.secondary_units.map((sec, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-bold"
                        >
                          [{sec.kode_unit}] {sec.jabatan_penugasan}{' '}
                          {sec.jabatan_tujuan_id ? `(${sec.jabatan_tujuan_id})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* KOLOM 2: RADIO BUTTON OPSI TIPE PERUBAHAN                         */}
          {/* ================================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-unsil-green-900 text-white inline-flex items-center justify-center text-[10px]">
                2
              </span>
              Pilih Opsi Tipe Perubahan Relasi Unit Kerja
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Radio 1: Tugas Tambahan / Unit Sekunder */}
              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                  jenisPerubahan === 'Tugas Tambahan / Sekunder'
                    ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="jenis_perubahan"
                    value="Tugas Tambahan / Sekunder"
                    checked={jenisPerubahan === 'Tugas Tambahan / Sekunder'}
                    onChange={(e) => setJenisPerubahan(e.target.value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Tugas Tambahan / Unit Sekunder
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      <strong>Primary unit tetap di [{originUnitObj.kode_unit}]</strong>, namun dosen memperoleh hak akses &amp; disposisi sekunder aktif pada unit tujuan (misal: <strong>LPPM</strong>).
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded self-start">
                  Rekomendasi Dosen Tugas Tambahan
                </span>
              </label>

              {/* Radio 2: Mutasi Unit Penuh */}
              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                  jenisPerubahan === 'Mutasi Unit Penuh'
                    ? 'bg-emerald-50/80 border-unsil-green-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="jenis_perubahan"
                    value="Mutasi Unit Penuh"
                    checked={jenisPerubahan === 'Mutasi Unit Penuh'}
                    onChange={(e) => setJenisPerubahan(e.target.value)}
                    className="mt-0.5 accent-emerald-800"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Mutasi Unit Penuh (Pindah Homebase)
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      <strong>Unit kerja utama berpindah penuh</strong> dari [{originUnitObj.kode_unit}] ke unit kerja tujuan pada data kepegawaian resmi.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded self-start">
                  Peralihan Unit Kerja Utama
                </span>
              </label>
            </div>
          </div>

          {/* ================================================================= */}
          {/* KOLOM 3: DROPDOWN SELECT BOX UNIT KERJA TUJUAN (OTK UNSIL)        */}
          {/* ================================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-unsil-green-900 text-white inline-flex items-center justify-center text-[10px]">
                  3
                </span>
                Unit Kerja Tujuan (Master OTK Permendikbudristek 19/2023)
              </label>
              {unitTujuanKode && (
                <button
                  type="button"
                  onClick={() => setUnitTujuanKode('')}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                >
                  Kosongkan Pilihan
                </button>
              )}
            </div>

            <select
              value={unitTujuanKode}
              onChange={(e) => {
                setUnitTujuanKode(e.target.value);
                setJabatanSearchTerm('');
              }}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-unsil-green-700 focus:border-unsil-green-700 outline-none cursor-pointer"
            >
              <option value="">-- Pilih Unit Kerja Tujuan (Membuka Kunci Dropdown Jabatan) --</option>
              {OTK_UNSIL_GROUPED_UNITS.map((group) => (
                <optgroup key={group.groupKey} label={group.groupLabel}>
                  {group.items.map((unit) => {
                    const isSameAsOrigin = unit.kode_unit === originUnitObj.kode_unit;
                    return (
                      <option
                        key={unit.kode_unit}
                        value={unit.kode_unit}
                        disabled={isSameAsOrigin}
                      >
                        [{unit.kode_unit}] {unit.nama_unit} ({unit.kode_otk})
                        {isSameAsOrigin ? ' - [Unit Asal Saat Ini / Terkunci]' : ''}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>

            {/* Quick Select Chips untuk Lembaga & Fakultas Populer */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Klik Cepat Unit:</span>
              {['LPPM', 'LPMPP', 'FT', 'FKIP', 'BKU', 'UPA_TIK', 'SPI'].map((quickCode) => {
                const isOrigin = quickCode === originUnitObj.kode_unit;
                const isSelected = quickCode === unitTujuanKode;
                return (
                  <button
                    key={quickCode}
                    type="button"
                    disabled={isOrigin}
                    onClick={() => {
                      setUnitTujuanKode(quickCode);
                      setJabatanSearchTerm('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                      isOrigin
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : isSelected
                          ? 'bg-unsil-green-900 text-amber-300 border-unsil-green-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    [{quickCode}]
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* KOLOM 4: DEPENDENT SEARCHABLE DROPDOWN JABATAN + NOMOR SK         */}
          {/* ================================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-unsil-green-900 text-white inline-flex items-center justify-center text-[10px]">
                  4
                </span>
                Jabatan Tujuan (Dependent Dropdown) &amp; Nomor SK
              </label>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  isJabatanLocked
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {isJabatanLocked ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-700" /> Terkunci (Pilih Unit Dulu)
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> {availablePositions.length} Jabatan SOTK [{unitTujuanKode}]
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* DEPENDENT SEARCHABLE SELECT BOX: Jabatan / Peran di Unit Tujuan */}
              <div className="sm:col-span-2 relative">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Jabatan / Peran di Unit Tujuan (<code>jabatan_tujuan_id</code>){' '}
                    <span className="text-rose-600">*</span>
                  </span>
                  {isLoadingPositions && (
                    <span className="text-[10px] text-emerald-700 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Memuat SOTK...
                    </span>
                  )}
                </label>

                {/* Custom Searchable Command / Select Trigger */}
                <button
                  type="button"
                  disabled={isJabatanLocked}
                  onClick={() => {
                    if (!isJabatanLocked) {
                      setIsJabatanDropdownOpen((prev) => !prev);
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-left text-xs transition-all flex items-center justify-between gap-2 ${
                    isJabatanLocked
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-emerald-700/50 hover:border-unsil-green-800 text-slate-900 cursor-pointer shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isJabatanLocked ? (
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-unsil-green-800 shrink-0" />
                    )}
                    {isJabatanLocked ? (
                      <span className="truncate font-medium text-slate-400">
                        Terkunci: Pilih &quot;Unit Kerja Tujuan&quot; pada Kolom 3 terlebih dahulu...
                      </span>
                    ) : selectedJabatanObj ? (
                      <div className="truncate">
                        <span className="font-extrabold text-slate-900">
                          {selectedJabatanObj.nama_jabatan_spesifik}
                        </span>{' '}
                        <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">
                          Kode: {selectedJabatanObj.id_jabatan}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Pilih Jabatan Baku di [{unitTujuanKode}]...</span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* Searchable Command Popover Menu */}
                {isJabatanDropdownOpen && !isJabatanLocked && (
                  <div className="absolute z-40 mt-1.5 w-full bg-white rounded-xl border-2 border-emerald-800/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Autocomplete Search Box inside Dropdown */}
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={jabatanSearchTerm}
                        onChange={(e) => setJabatanSearchTerm(e.target.value)}
                        placeholder={`Cari nama jabatan legal di [${unitTujuanKode}] (misal: Kepala Pusat, Sekretaris, Dekan)...`}
                        className="w-full bg-transparent text-xs text-slate-800 outline-none"
                      />
                      {jabatanSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setJabatanSearchTerm('')}
                          className="text-[10px] text-slate-400 hover:text-slate-700"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {filteredJabatanOptions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Tidak ada jabatan di [{unitTujuanKode}] yang cocok dengan pencarian &quot;{jabatanSearchTerm}&quot;.
                        </div>
                      ) : (
                        filteredJabatanOptions.map((pos, idx) => {
                          const isCurrentSelected = pos.id_jabatan === jabatanTujuanId;
                          const prevSubKelompok = idx > 0 ? filteredJabatanOptions[idx - 1].sub_kelompok : null;
                          const showGroupHeader = Boolean(pos.sub_kelompok && pos.sub_kelompok !== prevSubKelompok);

                          return (
                            <React.Fragment key={pos.id_jabatan}>
                              {showGroupHeader && (
                                <div className="px-3.5 py-1.5 bg-slate-100/90 border-y border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-unsil-green-900">
                                  {pos.sub_kelompok}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setJabatanTujuanId(pos.id_jabatan);
                                  setIsJabatanDropdownOpen(false);
                                  setJabatanSearchTerm('');
                                }}
                                className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                                  isCurrentSelected ? 'bg-emerald-50/90' : ''
                                } ${
                                  pos.sub_kelompok &&
                                  (pos.sub_kelompok.startsWith('2.') ||
                                    pos.sub_kelompok.startsWith('3.') ||
                                    pos.sub_kelompok.startsWith('4.'))
                                    ? 'pl-6'
                                    : ''
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                    {isCurrentSelected && (
                                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    )}
                                    <span>{pos.nama_jabatan_spesifik}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[10px] text-slate-600">
                                      ID: {pos.id_jabatan}
                                    </span>
                                    <span>•</span>
                                    <span>{pos.level_otorisasi}</span>
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                                    pos.is_signatory_tte
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {pos.is_signatory_tte ? 'Pejabat TTE BSrE' : 'Fungsional / Non-TTE'}
                                </span>
                              </button>
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nomor SK Mutasi / Penugasan <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    required
                    value={nomorSk}
                    onChange={(e) => setNomorSk(e.target.value)}
                    placeholder="Contoh: 842/UN58/KP.04.02/2026"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tanggal Mulai Efektif <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="date"
                      required
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Masa Berlaku SK Berakhir (KP.04.04)
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Verifikasi kepatuhan formasi jabatan SOTK dan perlindungan integritas data aktif terlindungi.
            </span>
          </div>

          <button
            type="submit"
            disabled={isJabatanLocked}
            className="px-5 py-2.5 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-md shadow-unsil-green-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-300" />
            <span>Verifikasi &amp; Simpan Perubahan Unit Kerja</span>
          </button>
        </div>
      </form>

      {/* ================================================================= */}
      {/* TABEL AUDIT RIWAYAT MUTASI & PENUGASAN TAMBAHAN                   */}
      {/* ================================================================= */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <History className="w-4 h-4 text-unsil-green-800" />
            Riwayat Resmi Mutasi &amp; Tugas Tambahan Pegawai
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Total Riwayat Tercatat: {mutationHistory.length}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-2.5 px-3">Pegawai / Dosen</th>
                <th className="py-2.5 px-3">Unit Asal</th>
                <th className="py-2.5 px-3">Unit Tujuan</th>
                <th className="py-2.5 px-3">Jabatan Baku SOTK</th>
                <th className="py-2.5 px-3">Nomor SK &amp; Tgl Efektif</th>
                <th className="py-2.5 px-3">Status Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mutationHistory.map((item) => (
                <tr key={item.id_mutasi} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{item.nama_pegawai}</div>
                    <div className="text-[11px] font-mono text-slate-500">NIP: {item.nip_pegawai}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    [{item.unit_asal_id}] {item.unit_asal_nama}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">
                    → [{item.unit_tujuan_id}] {item.unit_tujuan_nama}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.jenis_perubahan === 'Mutasi Unit Penuh'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-300'
                        }`}
                      >
                        {item.jenis_perubahan}
                      </span>
                      {item.jabatan_tujuan_id && (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.jabatan_tujuan_id}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{item.jabatan_penugasan}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <div className="font-bold text-slate-800">{item.nomor_sk}</div>
                    <div className="text-slate-500">Mulai: {item.tanggal_mulai}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-medium text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" /> {item.status_transaksi || 'Tercatat Sah'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL KONFIRMASI PERUBAHAN SEBELUM SUBMIT                         */}
      {/* ================================================================= */}
      {isConfirmModalOpen && selectedEmployee && targetUnitObj && selectedJabatanObj && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Konfirmasi Mutasi &amp; Validasi Jabatan SOTK
                  </h4>
                  <p className="text-xs text-slate-500">
                    Verifikasi formasi jabatan tujuan sebelum penetapan mutasi disahkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                <span className="text-slate-500 font-semibold">Nama Pegawai / Dosen:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedEmployee.nama_lengkap || selectedEmployee.nama || selectedEmployee.name}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                <span className="text-slate-500 font-semibold">Jabatan Tujuan Resmi SOTK:</span>
                <span className="font-bold text-emerald-950">
                  {selectedJabatanObj.nama_jabatan_spesifik}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Unit Kerja Asal</div>
                  <div className="font-mono font-extrabold text-slate-800 mt-0.5">
                    [{originUnitObj.kode_unit}] {originUnitObj.nama_unit}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">Unit Kerja Tujuan</div>
                  <div className="font-mono font-extrabold text-emerald-950 mt-0.5">
                    [{targetUnitObj.kode_unit}] {targetUnitObj.nama_unit}
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-1 text-[11px] text-slate-600">
                <div>
                  <strong>Nomor SK:</strong> <span className="font-mono">{nomorSk}</span> •{' '}
                  <strong>Tgl Efektif:</strong> {tanggalMulai}
                </div>
                <div>
                  <strong>Wewenang TTE Dokumen Dinas:</strong>{' '}
                  {selectedJabatanObj.is_signatory_tte
                    ? `Jabatan ini memiliki wewenang penandatanganan elektronik (TTE BSrE) resmi pada [${targetUnitObj.kode_unit}].`
                    : `Jabatan fungsional/pelaksana pada [${targetUnitObj.kode_unit}] (tanpa otorisasi TTE pimpinan).`}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteAtomicMutation}
                className="px-5 py-2 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-extrabold shadow-md cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Menyimpan Perubahan...' : 'Ya, Konfirmasi & Simpan Mutasi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

