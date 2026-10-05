/**
 * Utilitas Pemetaan Jabatan Berdasarkan Unit Kerja & Peran Akun (SILOKA UNSIL)
 * Menyelaraskan Struktur Organisasi dan Tata Kerja (SOTK) Universitas Siliwangi
 * dengan modul Manajemen Pengguna & Manajemen Peran.
 */

import unitKerjaList from '../data/unitKerja.json' with { type: 'json' };

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
export const getPositionsByUnitAndRole = (unitCode = 'UN58', roleSlug = 'pimpinan') => {
  const cleanUnit = String(unitCode || 'UN58').trim().toUpperCase();
  const cleanRole = String(roleSlug || 'pimpinan').trim().toLowerCase();

  // 1. Super Administrator selalu memiliki opsi Super Administrator
  if (cleanRole === 'super_admin') {
    return ['Super Administrator', 'Administrator Sistem SILOKA'];
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
  const unitObj = unitKerjaList.find((u) => u.kode_unit === cleanUnit);
  const tipeUnit = String(unitObj?.tipe_unit || '').toUpperCase();
  const unitName = unitObj?.nama_unit || 'Unit Terkait';

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
 * Mendapatkan data unit kerja berdasarkan kode unit
 * @param {string} unitCode
 * @returns {object|null}
 */
export const getUnitByCode = (unitCode) => {
  const clean = String(unitCode || '').trim().toUpperCase();
  return unitKerjaList.find((u) => u.kode_unit === clean) || null;
};

