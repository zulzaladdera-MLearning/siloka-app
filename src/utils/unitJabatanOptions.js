/**
 * Utilitas Pemetaan Jabatan Berdasarkan Unit Kerja & Peran Akun (SILOKA UNSIL)
 * Menyelaraskan Struktur Organisasi dan Tata Kerja (SOTK) Universitas Siliwangi
 * dengan modul Manajemen Pengguna & Manajemen Peran.
 */

import unitKerjaList from '../data/unitKerja.json' with { type: 'json' };

/**
 * Peta Jurusan Default per Fakultas di Lingkungan UNSIL
 */
export const DEFAULT_FAKULTAS_JURUSAN_MAP = {
  // 1. FKIP (UN58.10)
  'UN58.10': [
    { id: 'jur-penmas', kode: 'PENMAS', nama: 'Pendidikan Masyarakat' },
    { id: 'jur-pbsi', kode: 'PBSI', nama: 'Pendidikan Bahasa Indonesia' },
    { id: 'jur-pbi', kode: 'PBI', nama: 'Pendidikan Bahasa Inggris' },
    { id: 'jur-pmtk', kode: 'PMTK', nama: 'Pendidikan Matematika' },
    { id: 'jur-pbio', kode: 'PBIO', nama: 'Pendidikan Biologi' },
    { id: 'jur-peko', kode: 'PEKO', nama: 'Pendidikan Ekonomi' },
    { id: 'jur-pgeo', kode: 'PGEO', nama: 'Pendidikan Geografi' },
    { id: 'jur-penjas', kode: 'PENJAS', nama: 'Pendidikan Jasmani' },
    { id: 'jur-psej', kode: 'PSEJ', nama: 'Pendidikan Sejarah' },
    { id: 'jur-pfis', kode: 'PFIS', nama: 'Pendidikan Fisika' },
    { id: 'jur-ppg', kode: 'PPG', nama: 'Pendidikan Profesi Guru' },
    { id: 'jur-pko', kode: 'PKO', nama: 'Pendidikan Kepelatihan Olahraga' },
    { id: 'jur-psp', kode: 'PSP', nama: 'Pendidikan Seni Pertunjukan' }
  ],
  FKIP: [
    { id: 'jur-penmas', kode: 'PENMAS', nama: 'Pendidikan Masyarakat' },
    { id: 'jur-pbsi', kode: 'PBSI', nama: 'Pendidikan Bahasa Indonesia' },
    { id: 'jur-pbi', kode: 'PBI', nama: 'Pendidikan Bahasa Inggris' },
    { id: 'jur-pmtk', kode: 'PMTK', nama: 'Pendidikan Matematika' },
    { id: 'jur-pbio', kode: 'PBIO', nama: 'Pendidikan Biologi' },
    { id: 'jur-peko', kode: 'PEKO', nama: 'Pendidikan Ekonomi' },
    { id: 'jur-pgeo', kode: 'PGEO', nama: 'Pendidikan Geografi' },
    { id: 'jur-penjas', kode: 'PENJAS', nama: 'Pendidikan Jasmani' },
    { id: 'jur-psej', kode: 'PSEJ', nama: 'Pendidikan Sejarah' },
    { id: 'jur-pfis', kode: 'PFIS', nama: 'Pendidikan Fisika' },
    { id: 'jur-ppg', kode: 'PPG', nama: 'Pendidikan Profesi Guru' },
    { id: 'jur-pko', kode: 'PKO', nama: 'Pendidikan Kepelatihan Olahraga' },
    { id: 'jur-psp', kode: 'PSP', nama: 'Pendidikan Seni Pertunjukan' }
  ],
  // 2. FEB (UN58.11)
  'UN58.11': [
    { id: 'jur-ep', kode: 'EP', nama: 'Ekonomi Pembangunan' },
    { id: 'jur-mnj', kode: 'MNJ', nama: 'Manajemen' },
    { id: 'jur-akt', kode: 'AKT', nama: 'Akuntansi' },
    { id: 'jur-pkd3', kode: 'PK_D3', nama: 'Perbankan dan Keuangan (D3)' },
    { id: 'jur-pkd4', kode: 'PKD_D4', nama: 'Perbankan dan Keuangan Digital (D4)' }
  ],
  FEB: [
    { id: 'jur-ep', kode: 'EP', nama: 'Ekonomi Pembangunan' },
    { id: 'jur-mnj', kode: 'MNJ', nama: 'Manajemen' },
    { id: 'jur-akt', kode: 'AKT', nama: 'Akuntansi' },
    { id: 'jur-pkd3', kode: 'PK_D3', nama: 'Perbankan dan Keuangan (D3)' },
    { id: 'jur-pkd4', kode: 'PKD_D4', nama: 'Perbankan dan Keuangan Digital (D4)' }
  ],
  // 3. FP (UN58.12)
  'UN58.12': [
    { id: 'jur-agrotek', kode: 'AGROTEK', nama: 'Agroteknologi' },
    { id: 'jur-agribisnis', kode: 'AGRIBISNIS', nama: 'Agribisnis' },
    { id: 'jur-tphp', kode: 'TPHP', nama: 'Teknologi Pangan dan Hasil Pertanian' }
  ],
  FP: [
    { id: 'jur-agrotek', kode: 'AGROTEK', nama: 'Agroteknologi' },
    { id: 'jur-agribisnis', kode: 'AGRIBISNIS', nama: 'Agribisnis' },
    { id: 'jur-tphp', kode: 'TPHP', nama: 'Teknologi Pangan dan Hasil Pertanian' }
  ],
  // 4. FT (UN58.13)
  'UN58.13': [
    { id: 'jur-sipil', kode: 'SIPIL', nama: 'Teknik Sipil' },
    { id: 'jur-elektro', kode: 'ELEKTRO', nama: 'Teknik Elektro' },
    { id: 'jur-if', kode: 'INFORMATIKA', nama: 'Informatika' },
    { id: 'jur-si', kode: 'SI', nama: 'Sistem Informasi' },
    { id: 'jur-data', kode: 'SAINS_DATA', nama: 'Sains Data' }
  ],
  FT: [
    { id: 'jur-sipil', kode: 'SIPIL', nama: 'Teknik Sipil' },
    { id: 'jur-elektro', kode: 'ELEKTRO', nama: 'Teknik Elektro' },
    { id: 'jur-if', kode: 'INFORMATIKA', nama: 'Informatika' },
    { id: 'jur-si', kode: 'SI', nama: 'Sistem Informasi' },
    { id: 'jur-data', kode: 'SAINS_DATA', nama: 'Sains Data' }
  ],
  // 5. FISIP (UN58.14)
  'UN58.14': [
    { id: 'jur-ilpol', kode: 'ILPOL', nama: 'Ilmu Politik' },
    { id: 'jur-hbisnis', kode: 'HUKUM_BISNIS', nama: 'Hukum Bisnis' }
  ],
  FISIP: [
    { id: 'jur-ilpol', kode: 'ILPOL', nama: 'Ilmu Politik' },
    { id: 'jur-hbisnis', kode: 'HUKUM_BISNIS', nama: 'Hukum Bisnis' }
  ],
  // 6. FIK (UN58.15)
  'UN58.15': [
    { id: 'jur-kesmas', kode: 'KESMAS', nama: 'Kesehatan Masyarakat' },
    { id: 'jur-gizi', kode: 'GIZI', nama: 'Gizi' }
  ],
  FIK: [
    { id: 'jur-kesmas', kode: 'KESMAS', nama: 'Kesehatan Masyarakat' },
    { id: 'jur-gizi', kode: 'GIZI', nama: 'Gizi' }
  ],
  // 7. FAI (UN58.16)
  'UN58.16': [
    { id: 'jur-eksyar', kode: 'EKSYAR', nama: 'Ekonomi Syariah' },
    { id: 'jur-mmh', kode: 'MMH', nama: 'Manajemen Mutu Halal' }
  ],
  FAI: [
    { id: 'jur-eksyar', kode: 'EKSYAR', nama: 'Ekonomi Syariah' },
    { id: 'jur-mmh', kode: 'MMH', nama: 'Manajemen Mutu Halal' }
  ],
  // 8. Pascasarjana (UN58.17)
  'UN58.17': [
    { id: 'jur-pasca-mm', kode: 'MM', nama: 'Magister Manajemen' },
    { id: 'jur-pasca-mpklh', kode: 'MPKLH', nama: 'Magister Pendidikan Kependudukan dan Lingkungan Hidup' },
    { id: 'jur-pasca-mpmtk', kode: 'MPMTK', nama: 'Magister Pendidikan Matematika' },
    { id: 'jur-pasca-magro', kode: 'MAGRO', nama: 'Magister Agroteknologi' },
    { id: 'jur-pasca-mip', kode: 'MIP', nama: 'Magister Ilmu Pertanian' }
  ],
  PASCA: [
    { id: 'jur-pasca-mm', kode: 'MM', nama: 'Magister Manajemen' },
    { id: 'jur-pasca-mpklh', kode: 'MPKLH', nama: 'Magister Pendidikan Kependudukan dan Lingkungan Hidup' },
    { id: 'jur-pasca-mpmtk', kode: 'MPMTK', nama: 'Magister Pendidikan Matematika' },
    { id: 'jur-pasca-magro', kode: 'MAGRO', nama: 'Magister Agroteknologi' },
    { id: 'jur-pasca-mip', kode: 'MIP', nama: 'Magister Ilmu Pertanian' }
  ]
};

/**
 * Memastikan unit kerja fakultas memiliki array jurusan default jika belum terisi
 */
export const enrichUnitsWithDefaultJurusan = (unitList = []) => {
  if (!Array.isArray(unitList)) return [];
  return unitList.map((unit) => {
    if (Array.isArray(unit.jurusan) && unit.jurusan.length > 0) {
      return unit;
    }
    const defaults =
      DEFAULT_FAKULTAS_JURUSAN_MAP[unit.kode_unit] ||
      DEFAULT_FAKULTAS_JURUSAN_MAP[unit.singkatan];
    if (defaults && (!unit.jurusan || unit.jurusan.length === 0)) {
      return {
        ...unit,
        jurusan: [...defaults]
      };
    }
    return unit;
  });
};

/**
 * Mengambil daftar unit kerja aktif dari localStorage atau JSON bawaan
 */
export const getActiveUnitKerjaList = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('siloka_unit_kerja_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return enrichUnitsWithDefaultJurusan(parsed);
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return enrichUnitsWithDefaultJurusan(unitKerjaList);
};

/**
 * Mengambil daftar jurusan untuk unit kerja tertentu
 */
export const getJurusanByUnitCode = (unitCode = '', customUnitsList = null) => {
  const clean = String(unitCode || '').trim().toUpperCase();
  const list = customUnitsList || getActiveUnitKerjaList();
  const unit = list.find((u) => u.kode_unit === clean || u.singkatan === clean);
  if (Array.isArray(unit?.jurusan)) {
    return unit.jurusan;
  }
  const fallback = DEFAULT_FAKULTAS_JURUSAN_MAP[clean];
  return Array.isArray(fallback) ? fallback : [];
};

/**
 * Peta Referensi Jabatan Khusus per Kode Unit Kerja
 */
const UNIT_POSITIONS_MAP = {
  // 1. Rektorat / Kantor Pusat Universitas
  UN58: {
    pimpinan: [
      'Rektor Universitas Siliwangi',
      'Wakil Rektor Bidang Akademik',
      'Wakil Rektor Bidang Keuangan dan Umum',
      'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
      'Wakil Rektor Bidang Perencanaan, Kerja Sama, dan Sistem Informasi'
    ],
    verifikator: [
      'Verifikator Naskah Dinas Rektorat',
      'Koordinator Sekretariat Pimpinan'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Tata Usaha Pimpinan',
      'Arsiparis Ahli / Terampil Rektorat',
      'Staf Pengendali Naskah Masuk & Keluar'
    ],
    drafter: [
      'Drafter / Konseptor Naskah Rektorat',
      'Staf Ahli / Asisten Pimpinan Universitas'
    ]
  },

  // 2. Senat Universitas Siliwangi
  'UN58.SENAT': {
    pimpinan: [
      'Ketua Senat Universitas Siliwangi',
      'Sekretaris Senat Universitas Siliwangi',
      'Ketua Komisi I (Akademik) Senat',
      'Ketua Komisi II (Keuangan & Sarpras) Senat',
      'Ketua Komisi III (Etik & SDM) Senat'
    ],
    verifikator: [
      'Sekretaris Senat Universitas Siliwangi'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Sekretariat Senat'
    ],
    drafter: [
      'Anggota Senat Perwakilan Fakultas'
    ]
  },

  // 3. Satuan Pengawas Internal (SPI)
  'UN58.SPI': {
    pimpinan: [
      'Ketua Satuan Pengawas Internal (SPI)',
      'Sekretaris Satuan Pengawas Internal (SPI)'
    ],
    auditor_spi: [
      'Ketua Satuan Pengawas Internal (SPI)',
      'Sekretaris Satuan Pengawas Internal (SPI)',
      'Auditor Satuan Pengawas Internal',
      'Anggota Tim Pengawas Bidang Keuangan SPI',
      'Anggota Tim Pengawas Bidang Aset SPI'
    ],
    verifikator: [
      'Sekretaris Satuan Pengawas Internal (SPI)',
      'Auditor Pengendali Mutu Pemeriksaan'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Sekretariat SPI'
    ],
    drafter: [
      'Auditor Pendamping / Drafter LHP SPI'
    ]
  },

  // 4. Dewan Penyantun
  'UN58.DP': {
    pimpinan: [
      'Ketua Dewan Penyantun',
      'Sekretaris Dewan Penyantun',
      'Anggota Dewan Penyantun'
    ],
    admin_tu: [
      'Sekretariat Dewan Penyantun'
    ]
  },

  // 5. Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)
  'UN58.5': {
    pimpinan: [
      'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama',
      'Kepala Bagian Akademik',
      'Kepala Bagian Kemahasiswaan',
      'Kepala Bagian Perencanaan dan Kerja Sama'
    ],
    verifikator: [
      'Kepala Bagian Akademik',
      'Kepala Bagian Kemahasiswaan',
      'Kepala Bagian Perencanaan dan Kerja Sama',
      'Ketua Tim Bidang Akademik'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU BAKPK',
      'Staf Tata Usaha Biro BAKPK',
      'Arsiparis BAKPK'
    ],
    drafter: [
      'Penyusun Program & Kerja Sama BAKPK',
      'Pengelola Data Akademik & Kemahasiswaan'
    ]
  },

  // 6. Biro Keuangan dan Umum (BKU)
  'UN58.6': {
    pimpinan: [
      'Kepala Biro Keuangan dan Umum',
      'Kepala Bagian Umum',
      'Kepala Bagian Keuangan dan Kepegawaian',
      'Ketua Tim Bidang Keuangan',
      'Ketua Tim Bidang Kepegawaian',
      'Ketua Tim Tata Usaha dan Rumah Tangga'
    ],
    verifikator: [
      'Kepala Bagian Umum',
      'Kepala Bagian Keuangan dan Kepegawaian',
      'Ketua Tim Bidang Keuangan',
      'Ketua Tim Bidang Kepegawaian'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU BKU',
      'Pengadministrasi Kepegawaian BKU',
      'Pengadministrasi Perbendaharaan / Keuangan BKU',
      'Arsiparis BKU'
    ],
    drafter: [
      'Analis Pengelolaan Keuangan APBN',
      'Analis SDM Aparatur BKU'
    ]
  },

  // 7. Fakultas Keguruan dan Ilmu Pendidikan (FKIP)
  'UN58.10': {
    pimpinan: [
      'Dekan Fakultas Keguruan dan Ilmu Pendidikan',
      'Wakil Dekan Bidang Akademik FKIP',
      'Wakil Dekan Bidang Keuangan dan Umum FKIP',
      'Wakil Dekan Bidang Kemahasiswaan dan Alumni FKIP',
      'Ketua Jurusan Pendidikan Matematika',
      'Ketua Jurusan Pendidikan Biologi',
      'Ketua Jurusan Pendidikan Fisika',
      'Ketua Jurusan Pendidikan Bahasa Indonesia',
      'Ketua Jurusan Pendidikan Bahasa Inggris',
      'Ketua Jurusan Pendidikan Geografi',
      'Ketua Jurusan Pendidikan Sejarah',
      'Ketua Jurusan Pendidikan Ekonomi',
      'Ketua Jurusan Pendidikan Jasmani',
      'Koordinator Program Studi FKIP'
    ],
    verifikator: [
      'Wakil Dekan Bidang Akademik FKIP',
      'Wakil Dekan Bidang Keuangan dan Umum FKIP',
      'Ketua Jurusan / Koordinator Prodi FKIP',
      'Kepala Bagian Tata Usaha FKIP'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU FKIP',
      'Staf Tata Usaha FKIP',
      'Arsiparis FKIP'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) FKIP',
      'Dosen Pengajar / Peneliti FKIP',
      'Sekretaris Jurusan FKIP'
    ]
  },

  // 8. Fakultas Ekonomi dan Bisnis (FEB)
  'UN58.11': {
    pimpinan: [
      'Dekan Fakultas Ekonomi dan Bisnis',
      'Wakil Dekan Bidang Akademik FEB',
      'Wakil Dekan Bidang Keuangan dan Umum FEB',
      'Wakil Dekan Bidang Kemahasiswaan dan Alumni FEB',
      'Ketua Jurusan Manajemen',
      'Ketua Jurusan Akuntansi',
      'Ketua Jurusan Ekonomi Pembangunan',
      'Koordinator Program Studi FEB'
    ],
    verifikator: [
      'Wakil Dekan Bidang Akademik FEB',
      'Wakil Dekan Bidang Keuangan dan Umum FEB',
      'Ketua Jurusan / Koordinator Prodi FEB',
      'Kepala Bagian Tata Usaha FEB'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU FEB',
      'Staf Tata Usaha FEB',
      'Arsiparis FEB'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) FEB',
      'Dosen Pengajar / Peneliti FEB',
      'Sekretaris Jurusan FEB'
    ]
  },

  // 9. Fakultas Pertanian (FP)
  'UN58.12': {
    pimpinan: [
      'Dekan Fakultas Pertanian',
      'Wakil Dekan Bidang Akademik dan Kemahasiswaan Faperta',
      'Wakil Dekan Bidang Keuangan dan Umum Faperta',
      'Ketua Jurusan Agroteknologi',
      'Ketua Jurusan Agribisnis',
      'Koordinator Program Studi Faperta'
    ],
    verifikator: [
      'Wakil Dekan Bidang Akademik dan Kemahasiswaan Faperta',
      'Wakil Dekan Bidang Keuangan dan Umum Faperta',
      'Ketua Jurusan Faperta',
      'Kepala Bagian Tata Usaha Faperta'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU Faperta',
      'Staf Tata Usaha Faperta'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) Faperta',
      'Dosen Pengajar / Peneliti Faperta'
    ]
  },

  // 10. Fakultas Teknik (FT)
  'UN58.13': {
    pimpinan: [
      'Dekan Fakultas Teknik',
      'Wakil Dekan Bidang Akademik dan Kemahasiswaan FT',
      'Wakil Dekan Bidang Keuangan dan Umum FT',
      'Ketua Jurusan Teknik Sipil',
      'Ketua Jurusan Teknik Elektro',
      'Ketua Jurusan Informatika',
      'Koordinator Program Studi FT'
    ],
    verifikator: [
      'Wakil Dekan Bidang Akademik dan Kemahasiswaan FT',
      'Wakil Dekan Bidang Keuangan dan Umum FT',
      'Ketua Jurusan Teknik Sipil',
      'Ketua Jurusan Teknik Elektro',
      'Ketua Jurusan Informatika',
      'Kepala Bagian Tata Usaha FT'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU FT',
      'Staf Tata Usaha Fakultas Teknik',
      'Arsiparis FT',
      'Pranata Komputer FT'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) FT',
      'Dosen Jurusan Teknik Sipil',
      'Dosen Jurusan Teknik Elektro',
      'Dosen Jurusan Informatika',
      'Sekretaris Jurusan FT'
    ]
  },

  // 11. Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)
  'UN58.14': {
    pimpinan: [
      'Dekan Fakultas Ilmu Sosial dan Ilmu Politik',
      'Wakil Dekan Bidang Akademik FISIP',
      'Wakil Dekan Bidang Keuangan dan Umum FISIP',
      'Ketua Jurusan Ilmu Politik',
      'Ketua Jurusan Ilmu Pemerintahan',
      'Koordinator Program Studi FISIP'
    ],
    verifikator: [
      'Wakil Dekan FISIP',
      'Ketua Jurusan FISIP',
      'Kepala Bagian Tata Usaha FISIP'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU FISIP',
      'Staf Tata Usaha FISIP'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) FISIP',
      'Dosen Pengajar / Peneliti FISIP'
    ]
  },

  // 12. Fakultas Ilmu Kesehatan (FIK)
  'UN58.15': {
    pimpinan: [
      'Dekan Fakultas Ilmu Kesehatan',
      'Wakil Dekan Bidang Akademik FIK',
      'Wakil Dekan Bidang Keuangan dan Umum FIK',
      'Ketua Jurusan Kesehatan Masyarakat',
      'Ketua Jurusan Gizi',
      'Koordinator Program Studi FIK'
    ],
    verifikator: [
      'Wakil Dekan FIK',
      'Ketua Jurusan FIK',
      'Kepala Bagian Tata Usaha FIK'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU FIK',
      'Staf Tata Usaha FIK'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) FIK',
      'Dosen Pengajar / Peneliti FIK'
    ]
  },

  // 13. Fakultas Agama Islam (FAI)
  'UN58.16': {
    pimpinan: [
      'Dekan Fakultas Agama Islam',
      'Wakil Dekan Bidang Akademik FAI',
      'Wakil Dekan Bidang Keuangan dan Umum FAI',
      'Ketua Jurusan Pendidikan Agama Islam',
      'Ketua Jurusan Ekonomi Syariah',
      'Koordinator Program Studi FAI'
    ],
    verifikator: [
      'Wakil Dekan FAI',
      'Ketua Jurusan FAI',
      'Kepala Bagian Tata Usaha FAI'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU FAI',
      'Staf Tata Usaha FAI'
    ],
    drafter: [
      'Dosen Fungsional (Tridharma) FAI',
      'Dosen Pengajar / Peneliti FAI'
    ]
  },

  // 14. Program Pascasarjana
  'UN58.17': {
    pimpinan: [
      'Direktur Program Pascasarjana',
      'Wakil Direktur Pascasarjana',
      'Koordinator Program Studi Magister'
    ],
    verifikator: [
      'Wakil Direktur Pascasarjana',
      'Koordinator Program Studi Pascasarjana'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU Pascasarjana',
      'Staf Tata Usaha Pascasarjana'
    ],
    drafter: [
      'Dosen Pengajar Pascasarjana'
    ]
  },

  // 15. LPPM
  'UN58.21': {
    pimpinan: [
      'Ketua LPPM Universitas Siliwangi',
      'Sekretaris LPPM',
      'Kepala Pusat Penelitian',
      'Kepala Pusat Pengabdian kepada Masyarakat'
    ],
    verifikator: [
      'Sekretaris LPPM',
      'Kepala Bagian Tata Usaha LPPM'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU LPPM',
      'Staf Tata Usaha LPPM'
    ],
    drafter: [
      'Peneliti / Pengabdi LPPM'
    ]
  },

  // 16. LPMPP
  'UN58.22': {
    pimpinan: [
      'Ketua LPMPP Universitas Siliwangi',
      'Sekretaris LPMPP',
      'Kepala Pusat Penjaminan Mutu',
      'Kepala Pusat Pengembangan Pembelajaran'
    ],
    verifikator: [
      'Sekretaris LPMPP',
      'Kepala Bagian Tata Usaha LPMPP'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU LPMPP',
      'Staf Tata Usaha LPMPP'
    ],
    drafter: [
      'Fasilitator Penjaminan Mutu Pembelajaran'
    ]
  },

  // 17. UPA Perpustakaan
  'UN58.31': {
    pimpinan: [
      'Kepala UPA Perpustakaan'
    ],
    verifikator: [
      'Koordinator Layanan Teknis Perpustakaan'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Tata Usaha Perpustakaan',
      'Pustakawan Ahli / Terampil'
    ],
    drafter: [
      'Pustakawan Pelaksana'
    ]
  },

  // 18. UPA TIK
  'UN58.32': {
    pimpinan: [
      'Kepala UPA Teknologi Informasi dan Komunikasi'
    ],
    verifikator: [
      'Koordinator Infrastruktur & Jaringan TIK',
      'Koordinator Sistem Informasi TIK'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Tata Usaha TIK',
      'Pranata Komputer / Pengelola TI'
    ],
    drafter: [
      'Programmer / Pengembang Sistem TIK',
      'Network Administrator TIK'
    ]
  },

  // 19. UPA Bahasa
  'UN58.33': {
    pimpinan: [
      'Kepala UPA Bahasa'
    ],
    verifikator: [
      'Koordinator Layanan Tes & Pelatihan Bahasa'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Tata Usaha Bahasa'
    ],
    drafter: [
      'Instruktur / Penerjemah Bahasa'
    ]
  },

  // 20. UPA PKKM
  'UN58.34': {
    pimpinan: [
      'Kepala UPA Pengembangan Karier dan Kewirausahaan Mahasiswa'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU PKKM'
    ],
    drafter: [
      'Fasilitator Pembina Kewirausahaan & Karier'
    ]
  },

  // 21. UPA Layanan Uji Kompetensi
  'UN58.35': {
    pimpinan: [
      'Kepala UPA Layanan Uji Kompetensi'
    ],
    verifikator: [
      'Manajer Mutu Uji Kompetensi'
    ],
    admin_tu: [
      'Pengadministrasi Persuratan / Loket TU Uji Kompetensi'
    ],
    drafter: [
      'Asesor / Penguji Kompetensi'
    ]
  }
};

/**
 * Mendapatkan daftar pilihan jabatan struktural / peran institusi
 * yang relevan secara kontekstual berdasarkan Unit Kerja dan Peran Akun yang dipilih.
 *
 * @param {string} unitCode - Kode unit kerja (misal: 'UN58', 'UN58.13', dll)
 * @param {string} roleSlug - Slug peran ('pimpinan', 'drafter', 'admin_tu', 'verifikator', 'super_admin', 'auditor_spi')
 * @returns {Array<string>} Daftar opsi nama jabatan resmi
 */
/**
 * Menghasilkan opsi jabatan bawaan berdasarkan SOTK statis / jurusan jika belum ada struktur kustom
 */
export const getDefaultPositionsByUnitAndRole = (cleanUnit, cleanRole, activeList, unitObj) => {
  const tipeUnit = String(unitObj?.tipe_unit || '').toUpperCase();
  const unitName = unitObj?.nama_unit || 'Unit Terkait';
  const unitShort = unitObj?.singkatan || '';

  // 1. Jika unit memiliki daftar jurusan, generate jabatan berbasis jurusan dinamis
  const jurusanList = Array.isArray(unitObj?.jurusan) && unitObj.jurusan.length > 0
    ? unitObj.jurusan
    : (DEFAULT_FAKULTAS_JURUSAN_MAP[cleanUnit] || DEFAULT_FAKULTAS_JURUSAN_MAP[unitShort] || []);

  if (jurusanList.length > 0) {
    if (cleanRole === 'drafter') {
      const positions = [
        `Dosen Fungsional (Tridharma) ${unitShort || unitName}`.trim(),
        ...jurusanList.map((j) => `Dosen Jurusan ${j.nama}`),
        `Dosen Pengajar / Peneliti ${unitShort || unitName}`.trim(),
        `Sekretaris Jurusan ${unitShort || unitName}`.trim()
      ];
      return Array.from(new Set(positions));
    }

    if (cleanRole === 'pimpinan') {
      const positions = [
        `Dekan ${unitName}`,
        `Wakil Dekan Bidang Akademik dan Kemahasiswaan ${unitShort}`.trim(),
        `Wakil Dekan Bidang Keuangan dan Umum ${unitShort}`.trim(),
        ...jurusanList.map((j) => `Ketua Jurusan ${j.nama}`),
        ...jurusanList.map((j) => `Sekretaris Jurusan ${j.nama}`),
        `Koordinator Program Studi ${unitShort}`.trim()
      ];
      return Array.from(new Set(positions));
    }

    if (cleanRole === 'verifikator') {
      const positions = [
        `Wakil Dekan Bidang Akademik dan Kemahasiswaan ${unitShort}`.trim(),
        `Wakil Dekan Bidang Keuangan dan Umum ${unitShort}`.trim(),
        ...jurusanList.map((j) => `Ketua Jurusan ${j.nama}`),
        `Kepala Bagian Tata Usaha ${unitShort}`.trim(),
        `Verifikator Naskah Dinas ${unitShort}`.trim()
      ];
      return Array.from(new Set(positions));
    }
  }

  // 2. Ambil referensi dari peta unit spesifik jika tersedia
  const unitGroup = UNIT_POSITIONS_MAP[cleanUnit];
  if (unitGroup) {
    if (unitGroup[cleanRole] && Array.isArray(unitGroup[cleanRole]) && unitGroup[cleanRole].length > 0) {
      return unitGroup[cleanRole];
    }

    // Fallback jika role auditor_spi di SPI
    if (cleanRole === 'auditor_spi' && unitGroup.auditor_spi) {
      return unitGroup.auditor_spi;
    }
  }

  // 3. Fallback cerdas berdasarkan tipe unit jika kode unit belum terdaftar di peta spesifik
  if (cleanRole === 'pimpinan') {
    if (tipeUnit === 'FAKULTAS') {
      return [
        `Dekan ${unitName}`,
        `Wakil Dekan Bidang Akademik ${unitName}`,
        `Wakil Dekan Bidang Keuangan dan Umum ${unitName}`,
        `Wakil Dekan Bidang Kemahasiswaan dan Alumni ${unitName}`,
        `Koordinator Program Studi di ${unitName}`
      ];
    }
    if (tipeUnit === 'BIRO') {
      return [
        `Kepala ${unitName}`,
        `Kepala Bagian Tata Usaha ${unitName}`,
        `Ketua Tim Bidang di ${unitName}`
      ];
    }
    if (tipeUnit === 'LEMBAGA') {
      return [
        `Ketua ${unitName}`,
        `Sekretaris ${unitName}`,
        `Kepala Pusat di ${unitName}`
      ];
    }
    if (tipeUnit === 'UPA') {
      return [
        `Kepala ${unitName}`
      ];
    }
    return [
      `Kepala / Pimpinan ${unitName}`,
      `Wakil Pimpinan ${unitName}`
    ];
  }

  if (cleanRole === 'admin_tu') {
    return [
      `Pengadministrasi Persuratan / Loket TU ${unitName}`,
      `Staf Tata Usaha ${unitName}`,
      `Arsiparis ${unitName}`
    ];
  }

  if (cleanRole === 'verifikator') {
    return [
      `Verifikator Naskah Dinas ${unitName}`,
      `Kepala Bagian / Subbagian TU ${unitName}`
    ];
  }

  // Default Drafter / Dosen
  return [
    `Dosen Fungsional (Tridharma) ${unitName}`,
    `Dosen Pengajar / Peneliti ${unitName}`,
    `Staf Penyusun Konsep Naskah ${unitName}`
  ];
};

/**
 * Menentukan lingkup jabatan (apakah 'FAKULTAS' atau nama Jurusan tertentu)
 * berdasarkan atribut jabatan atau pencocokan nama jabatan dengan daftar jurusan.
 *
 * @param {object|string} itemOrName - Objek jabatan { nama_jabatan, jurusan } atau string nama jabatan
 * @param {Array<object|string>} jurusanList - Daftar jurusan pada unit kerja
 * @returns {string} 'FAKULTAS' atau nama jurusan yang cocok
 */
export const resolveJabatanScope = (itemOrName, jurusanList = []) => {
  if (!itemOrName) return 'FAKULTAS';

  if (typeof itemOrName === 'object' && itemOrName.jurusan) {
    const jur = String(itemOrName.jurusan).trim();
    if (jur && jur.toUpperCase() !== 'FAKULTAS' && jur.toUpperCase() !== 'ALL' && jur.toUpperCase() !== 'SEMUA') {
      return jur;
    }
    if (jur.toUpperCase() === 'FAKULTAS') {
      return 'FAKULTAS';
    }
  }

  const name = typeof itemOrName === 'object' ? (itemOrName.nama_jabatan || '') : String(itemOrName);
  const cleanName = name.trim().toLowerCase();

  if (Array.isArray(jurusanList) && jurusanList.length > 0) {
    for (const j of jurusanList) {
      const jName = typeof j === 'string' ? j : (j.nama || '');
      if (jName && cleanName.includes(jName.toLowerCase())) {
        return jName;
      }
    }
  }

  return 'FAKULTAS';
};

/**
 * Menghasilkan struktur organisasi lengkap standar SOTK untuk satu unit kerja
 */
export const getDefaultStrukturOrganisasi = (unitCode = 'UN58', customUnitsList = null) => {
  const clean = String(unitCode || 'UN58').trim().toUpperCase();
  const list = customUnitsList || getActiveUnitKerjaList();
  const unit =
    list.find((u) => u.kode_unit === clean || u.singkatan === clean) ||
    unitKerjaList.find((u) => u.kode_unit === clean || u.singkatan === clean);

  const roles = [
    { key: 'pimpinan', level: 1 },
    { key: 'verifikator', level: 2 },
    { key: 'admin_tu', level: 3 },
    { key: 'drafter', level: 4 }
  ];

  const jurusanList = Array.isArray(unit?.jurusan) && unit.jurusan.length > 0
    ? unit.jurusan
    : (DEFAULT_FAKULTAS_JURUSAN_MAP[clean] || DEFAULT_FAKULTAS_JURUSAN_MAP[unit?.singkatan] || []);

  const struktur = [];
  roles.forEach(({ key, level }) => {
    const posList = getDefaultPositionsByUnitAndRole(clean, key, list, unit);
    posList.forEach((pos, idx) => {
      const scope = resolveJabatanScope(pos, jurusanList);
      struktur.push({
        id: `sotk-${key}-${clean.replace(/[^a-zA-Z0-9]/g, '')}-${idx + 1}`,
        nama_jabatan: pos,
        kategori_peran: key,
        level_hirarki: level,
        jurusan: scope
      });
    });
  });

  return struktur;
};

/**
 * Mengambil struktur organisasi aktif milik unit kerja (kustom atau fallback SOTK)
 */
export const getStrukturOrganisasiByUnit = (unitCode = '', customUnitsList = null) => {
  const clean = String(unitCode || '').trim().toUpperCase();
  const list = customUnitsList || getActiveUnitKerjaList();
  const unit = list.find((u) => u.kode_unit === clean || u.singkatan === clean);
  if (Array.isArray(unit?.struktur_organisasi)) {
    return unit.struktur_organisasi;
  }
  return getDefaultStrukturOrganisasi(clean, list);
};

export const getPositionsByUnitAndRole = (unitCode = 'UN58', roleSlug = 'pimpinan', customUnitsList = null, targetJurusan = null) => {
  const cleanUnit = String(unitCode || 'UN58').trim().toUpperCase();
  const cleanRole = String(roleSlug || 'pimpinan').trim().toLowerCase();

  // 1. Super Administrator selalu memiliki opsi Super Administrator
  if (cleanRole === 'super_admin') {
    return ['Super Administrator', 'Administrator Sistem SILOKA'];
  }

  // 2. Ambil referensi objek unit aktif
  const activeList = customUnitsList || getActiveUnitKerjaList();
  const unitObj =
    activeList.find((u) => u.kode_unit === cleanUnit || u.singkatan === cleanUnit) ||
    unitKerjaList.find((u) => u.kode_unit === cleanUnit || u.singkatan === cleanUnit);

  // 3. Utamakan struktur organisasi kustom yang diatur melalui Antarmuka Manajemen Unit Kerja
  // Jika properti struktur_organisasi sudah ada pada unit (telah dikelola oleh admin),
  // patuhi data tersebut sepenuhnya. Jabatan yang telah dihapus tidak boleh dibangkitkan kembali ke default.
  if (Array.isArray(unitObj?.struktur_organisasi)) {
    const matched = unitObj.struktur_organisasi
      .filter((s) => s.kategori_peran === cleanRole || (cleanRole === 'dosen' && s.kategori_peran === 'drafter'));

    if (targetJurusan && String(targetJurusan).trim() && targetJurusan !== 'FAKULTAS' && targetJurusan !== 'ALL') {
      const cleanTarget = String(targetJurusan).trim().toLowerCase();
      const specific = matched.filter((s) => {
        const itemJur = (s.jurusan || '').toLowerCase();
        const itemName = (s.nama_jabatan || '').toLowerCase();
        return itemJur === cleanTarget || itemName.includes(cleanTarget);
      });
      const rest = matched.filter((s) => {
        const itemJur = (s.jurusan || '').toLowerCase();
        const itemName = (s.nama_jabatan || '').toLowerCase();
        return itemJur !== cleanTarget && !itemName.includes(cleanTarget);
      });
      const ordered = [...specific, ...rest]
        .map((s) => s.nama_jabatan?.trim())
        .filter(Boolean);
      return Array.from(new Set(ordered));
    }

    const allPositions = matched
      .map((s) => s.nama_jabatan?.trim())
      .filter(Boolean);

    return Array.from(new Set(allPositions));
  }

  // 4. Fallback ke generator jabatan berbasis SOTK / Jurusan bawaan hanya jika unit belum pernah dikonfigurasi
  const defaultPos = getDefaultPositionsByUnitAndRole(cleanUnit, cleanRole, activeList, unitObj);
  if (targetJurusan && String(targetJurusan).trim() && targetJurusan !== 'FAKULTAS' && targetJurusan !== 'ALL') {
    const cleanTarget = String(targetJurusan).trim().toLowerCase();
    const specific = defaultPos.filter((p) => p.toLowerCase().includes(cleanTarget));
    const rest = defaultPos.filter((p) => !p.toLowerCase().includes(cleanTarget));
    return Array.from(new Set([...specific, ...rest]));
  }

  return defaultPos;
};

/**
 * Mendapatkan data unit kerja berdasarkan kode unit
 * @param {string} unitCode
 * @param {Array} [customUnitsList]
 * @returns {object|null}
 */
export const getUnitByCode = (unitCode, customUnitsList = null) => {
  const clean = String(unitCode || '').trim().toUpperCase();
  const list = customUnitsList || getActiveUnitKerjaList();
  return list.find((u) => u.kode_unit === clean || u.singkatan === clean) || null;
};

