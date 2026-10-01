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
  if (
    jabatan.includes('rektor') ||
    roleLevel.includes('level 1: pimpinan') && (unitId === 'UN58' || unitName.includes('rektorat'))
  ) {
    return [
      { id: 'tgt-senat', nama: 'Ketua Senat Universitas Siliwangi', deskripsi: 'Pimpinan Organ Pertimbangan Akademik', badge: 'Organ' },
      { id: 'tgt-spi', nama: 'Ketua Satuan Pengawas Internal (SPI)', deskripsi: 'Pengawasan Kepatuhan & Audit Internal', badge: 'Organ' },
      { id: 'tgt-warek1', nama: 'Wakil Rektor Bidang Akademik', deskripsi: 'Bidang Pembelajaran, Kurikulum & Kerjasama', badge: 'Pimpinan' },
      { id: 'tgt-warek2', nama: 'Wakil Rektor Bidang Keuangan dan Umum', deskripsi: 'Bidang Anggaran, Kepegawaian & BMN', badge: 'Pimpinan' },
      { id: 'tgt-warek3', nama: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', deskripsi: 'Bidang Kemahasiswaan, Prestasi & Alumni', badge: 'Pimpinan' },
      { id: 'tgt-bakpk', nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)', deskripsi: 'Layanan Akademik, Kemahasiswaan & Rencana', badge: 'Biro' },
      { id: 'tgt-bku', nama: 'Kepala Biro Keuangan dan Umum (BKU)', deskripsi: 'Pengelolaan Keuangan, SDM & Sarpras Universitas', badge: 'Biro' },
      { id: 'tgt-lppm', nama: 'Kepala Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)', deskripsi: 'Riset, Pengabdian, Publikasi & KKN', badge: 'Lembaga' },
      { id: 'tgt-lpmpp', nama: 'Kepala Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)', deskripsi: 'Audit Mutu Akademik & Akreditasi', badge: 'Lembaga' },
      { id: 'tgt-fkip', nama: 'Dekan Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', deskripsi: 'Pimpinan Fakultas Keguruan & Ilmu Pendidikan', badge: 'Fakultas' },
      { id: 'tgt-feb', nama: 'Dekan Fakultas Ekonomi dan Bisnis (FEB)', deskripsi: 'Pimpinan Fakultas Ekonomi & Bisnis', badge: 'Fakultas' },
      { id: 'tgt-fp', nama: 'Dekan Fakultas Pertanian (FP)', deskripsi: 'Pimpinan Fakultas Pertanian', badge: 'Fakultas' },
      { id: 'tgt-ft', nama: 'Dekan Fakultas Teknik (FT)', deskripsi: 'Pimpinan Fakultas Teknik', badge: 'Fakultas' },
      { id: 'tgt-fai', nama: 'Dekan Fakultas Agama Islam (FAI)', deskripsi: 'Pimpinan Fakultas Agama Islam', badge: 'Fakultas' },
      { id: 'tgt-fik', nama: 'Dekan Fakultas Ilmu Kesehatan (FIK)', deskripsi: 'Pimpinan Fakultas Ilmu Kesehatan', badge: 'Fakultas' },
      { id: 'tgt-fisip', nama: 'Dekan Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)', deskripsi: 'Pimpinan Fakultas Ilmu Sosial & Politik', badge: 'Fakultas' },
      { id: 'tgt-pasca', nama: 'Direktur Pascasarjana', deskripsi: 'Pimpinan Pengelola Program Magister & Doktoral', badge: 'Pascasarjana' },
      { id: 'tgt-perpus', nama: 'Kepala UPA Perpustakaan', deskripsi: 'Layanan Koleksi & Referensi Ilmiah', badge: 'UPA' },
      { id: 'tgt-tik', nama: 'Kepala UPA Teknologi Informasi dan Komunikasi (TIK)', deskripsi: 'Infrastruktur Jaringan & Sistem Informasi', badge: 'UPA' },
      { id: 'tgt-bahasa', nama: 'Kepala UPA Bahasa', deskripsi: 'Pelatihan & Uji Kemahiran Bahasa', badge: 'UPA' }
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
