-- =============================================================================
-- MIGRATION 011: CENTRALIZED MASTER KLASIFIKASI, JRA, & SKKAAD (SK REKTOR NO. 2803/2023)
-- Berdasarkan:
-- 1. Keputusan Rektor Universitas Siliwangi Nomor 2803/UN58/OT/2023
-- 2. Lampiran SK Klasifikasi Arsip, Jadwal Retensi Arsip (JRA), dan SKKAAD UNSIL
-- =============================================================================

BEGIN;

-- 1. Pastikan seluruh 18 Kategori Utama (Tier-1: Substantif & Fasilitatif) terdaftar di tbl_master_klasifikasi_utama
INSERT INTO tbl_master_klasifikasi_utama (kode_utama, nama_urusan, jenis_klasifikasi) VALUES
  -- Bagian 1: Fungsi Substantif
  ('PP', 'Pendidikan dan Pengajaran', 'Substantif'),
  ('KM', 'Kemahasiswaan', 'Substantif'),
  ('SA', 'Sarana Akademik dan Perpustakaan', 'Substantif'),
  ('PM', 'Penelitian dan Pengabdian kepada Masyarakat', 'Substantif'),
  ('OT', 'Organisasi / Tata Pamong Universitas dan Fakultas', 'Substantif'),
  ('DI', 'Data dan Informasi Akademik', 'Substantif'),
  -- Bagian 2: Fungsi Fasilitatif
  ('PR', 'Perencanaan', 'Fasilitatif'),
  ('HK', 'Hukum', 'Fasilitatif'),
  ('OK', 'Organisasi dan Ketatalaksanaan', 'Fasilitatif'),
  ('KA', 'Kearsipan', 'Fasilitatif'),
  ('KR', 'Ketatausahaan dan Kerumahtanggaan', 'Fasilitatif'),
  ('PL', 'Perlengkapan dan Barang Milik Negara (BMN)', 'Fasilitatif'),
  ('HM', 'Hubungan Masyarakat (Humas) dan Keprotokolan', 'Fasilitatif'),
  ('DT', 'Pendidikan dan Pelatihan (Diklat)', 'Fasilitatif'),
  ('TI', 'Informatika / Sistem Informasi (SIM) / TIK', 'Fasilitatif'),
  ('PS', 'Pengawasan Internal dan Eksternal', 'Fasilitatif'),
  ('KU', 'Keuangan dan Anggaran', 'Fasilitatif'),
  ('KP', 'Kepegawaian', 'Fasilitatif')
ON CONFLICT (kode_utama) DO UPDATE
SET nama_urusan = EXCLUDED.nama_urusan,
    jenis_klasifikasi = EXCLUDED.jenis_klasifikasi;

-- 2. Seed Sub-Kategori Lengkap (Tier-2) sesuai Lampiran SK Rektor No. 2803 Tahun 2023
INSERT INTO tbl_master_sub_klasifikasi (kode_sub, kode_utama, nama_sub_urusan) VALUES
  -- PP: Pendidikan dan Pengajaran
  ('PP.00', 'PP', 'Penerimaan Mahasiswa Baru (PMB)'),
  ('PP.01', 'PP', 'Orientasi Mahasiswa Baru'),
  ('PP.02', 'PP', 'Registrasi Mahasiswa'),
  ('PP.03', 'PP', 'Kurikulum dan Silabus'),
  ('PP.04', 'PP', 'Perkuliahan dan Evaluasi Mahasiswa'),
  ('PP.05', 'PP', 'Sistem Penjaminan Mutu Akademik & Akreditasi'),
  ('PP.06', 'PP', 'Kelulusan (Yudisium), Ijazah, dan Transkrip'),
  ('PP.07', 'PP', 'Wisuda'),
  ('PP.08', 'PP', 'Dosen / Tenaga Pengajar dan Beban Kerja (BKD)'),
  ('PP.09', 'PP', 'Penerimaan Mahasiswa Asing & Pertukaran Mahasiswa'),

  -- KM: Kemahasiswaan
  ('KM.00', 'KM', 'Status Administrasi Mahasiswa (Aktif, Cuti, Skorsing, DO)'),
  ('KM.01', 'KM', 'Kegiatan dan Pembinaan Mahasiswa (UKM & PKM)'),
  ('KM.02', 'KM', 'Kesejahteraan, Beasiswa, dan Biaya Pendidikan (UKT)'),
  ('KM.03', 'KM', 'Organisasi Kemahasiswaan'),
  ('KM.04', 'KM', 'Karya Ilmiah, Lomba, dan Berkas Perseorangan Mahasiswa'),

  -- SA: Sarana Akademik
  ('SA.00', 'SA', 'Perpustakaan'),
  ('SA.01', 'SA', 'Laboratorium, Studio, Bengkel Kerja, dan Lahan Percobaan'),
  ('SA.02', 'SA', 'Arsip Perguruan Tinggi'),
  ('SA.03', 'SA', 'Pusat Bahasa'),
  ('SA.04', 'SA', 'Teaching Industry dan Inkubator Bisnis'),
  ('SA.05', 'SA', 'Publikasi Jurnal dan Buku'),

  -- PM: Penelitian dan Pengabdian kepada Masyarakat
  ('PM.00', 'PM', 'Penelitian dan Pengembangan HaKI/Paten'),
  ('PM.01', 'PM', 'Pengabdian kepada Masyarakat dan KKN'),

  -- OT: Organisasi / Tata Pamong
  ('OT.00', 'OT', 'Senat Universitas'),
  ('OT.01', 'OT', 'Senat Fakultas'),
  ('OT.02', 'OT', 'Dewan Guru Besar (DGB)'),

  -- DI: Data dan Informasi Akademik
  ('DI.00', 'DI', 'Data Akademik dan Alumni'),
  ('DI.01', 'DI', 'Data Prestasi dan Nilai Mahasiswa'),
  ('DI.02', 'DI', 'Statistik Perguruan Tinggi'),
  ('DI.03', 'DI', 'Informasi Akademis dan Buku Pedoman'),

  -- PR: Perencanaan
  ('PR.00', 'PR', 'Pokok-Pokok Kebijakan, Renstra, Program Kerja, & Kontrak Kinerja'),

  -- HK: Hukum
  ('HK.00', 'HK', 'Peraturan Perundang-undangan Terkait UNSIL'),
  ('HK.01', 'HK', 'Peraturan Rektor'),
  ('HK.02', 'HK', 'Keputusan Rektor'),
  ('HK.03', 'HK', 'Peraturan Dekan / Direktur / Ketua Lembaga'),
  ('HK.04', 'HK', 'Keputusan Dekan / Direktur / Ketua Lembaga'),
  ('HK.05', 'HK', 'Instruksi Rektor'),
  ('HK.06', 'HK', 'Pedoman, Standar, Juklak, Juknis, dan Protap (POS/SOP)'),
  ('HK.07', 'HK', 'MoU, Kontrak, dan Perjanjian Kerja Sama (PKS)'),
  ('HK.10', 'HK', 'Bantuan, Konsultasi Hukum, Advokasi, dan Kuasa Hukum'),
  ('HK.11', 'HK', 'Kasus atau Sengketa Hukum'),

  -- OK: Organisasi dan Ketatalaksanaan
  ('OK.00', 'OK', 'Organisasi, Statuta, dan Struktur SOTK'),
  ('OK.01', 'OK', 'Tata Laksana, Sistem Prosedur Kerja (SOP), dan Laporan Kinerja (LAKIP)'),

  -- KA: Kearsipan
  ('KA.00', 'KA', 'Pengendalian Surat (Agenda Surat, Ekspedisi, & Pengantar)'),
  ('KA.03', 'KA', 'Penyimpanan dan Pemeliharaan Arsip'),
  ('KA.04', 'KA', 'Penyusutan, Pemindahan, dan Pemusnahan Arsip'),

  -- KR: Ketatausahaan dan Kerumahtanggaan
  ('KR.01', 'KR', 'Perjalanan Dinas Dalam dan Luar Negeri'),
  ('KR.02', 'KR', 'Administrasi Penggunaan Fasilitas Kantor, Gedung, & Kendaraan'),
  ('KR.03', 'KR', 'Risalah / Notula Rapat Staf, Pimpinan, dan Koordinasi'),
  ('KR.06', 'KR', 'Pemeliharaan Gedung dan Taman'),
  ('KR.07', 'KR', 'Mekanikal, Engineering, Jaringan Listrik, Air, & Telepon'),
  ('KR.08', 'KR', 'Keamanan dan Ketertiban / Sekuriti'),

  -- PL: Perlengkapan
  ('PL.00', 'PL', 'Rencana Kebutuhan Barang (RKB) / RUP'),
  ('PL.01', 'PL', 'Pengadaan Barang'),
  ('PL.02', 'PL', 'Pengadaan Jasa'),
  ('PL.04', 'PL', 'Penyaluran / Distribusi dan Berita Acara Serah Terima Barang'),
  ('PL.05', 'PL', 'Inventarisasi Barang dan Laporan SIMAK BMN'),
  ('PL.07', 'PL', 'Penghapusan Barang Milik Negara'),

  -- HM: Hubungan Masyarakat
  ('HM.00', 'HM', 'Keprotokolan, Undangan Acara Dinas, dan Pengumuman'),
  ('HM.01', 'HM', 'Hubungan Antar Lembaga, Media Massa, dan Layanan Informasi Publik (PPID)'),

  -- DT: Pendidikan dan Pelatihan
  ('DT.00', 'DT', 'Pedoman dan Kurikulum Kediklatan'),
  ('DT.14', 'DT', 'Penyelenggaraan Diklat, Bimtek, dan Lokakarya'),

  -- TI: Teknologi Informasi
  ('TI.00', 'TI', 'Rencana Strategis dan Master Plan Sistem Informasi (SIM)'),
  ('TI.01', 'TI', 'Rancang Bangun, Implementasi, dan Keamanan Sistem Informasi'),

  -- PS: Pengawasan
  ('PS.00', 'PS', 'Rencana Pengawasan Strategis dan Tahunan'),
  ('PS.02', 'PS', 'Pelaksanaan Pengawasan Internal (Audit LHA/LHP/LHAI) & Eksternal'),

  -- KU: Keuangan
  ('KU.00', 'KU', 'Rencana Anggaran Pendapatan dan Belanja (RAPB / RKA)'),
  ('KU.01', 'KU', 'Penyusunan Anggaran, DIPA, dan POK'),
  ('KU.02', 'KU', 'Pelaksanaan Anggaran, Belanja, SPM/SP2D, dan SPJ'),
  ('KU.05', 'KU', 'Sistem Akuntansi Instansi (SAI) dan Rekonsiliasi'),
  ('KU.06', 'KU', 'Pertanggungjawaban Keuangan dan Pemeriksaan Audit BPK'),

  -- KP: Kepegawaian
  ('KP.00', 'KP', 'Formasi Pegawai'),
  ('KP.01', 'KP', 'Pengadaan dan Penerimaan Pegawai ASN/PPPK'),
  ('KP.02', 'KP', 'Pembinaan Karier, Tugas Belajar, SKP, PAK, dan Disiplin Pegawai'),
  ('KP.03', 'KP', 'Penyelesaian Pengelolaan Keberatan Pegawai'),
  ('KP.04', 'KP', 'Mutasi Pegawai (Kenaikan Pangkat, Jabatan, & Alih Status)'),
  ('KP.05', 'KP', 'Administrasi Pegawai (Surat Tugas / Perintah Dinas & Cuti)'),
  ('KP.06', 'KP', 'Kesejahteraan Pegawai'),
  ('KP.08', 'KP', 'Perselisihan / Sengketa Kepegawaian'),
  ('KP.09', 'KP', 'Usul Pemberhentian dan Penetapan Pensiun')
ON CONFLICT (kode_sub) DO UPDATE
SET kode_utama = EXCLUDED.kode_utama,
    nama_sub_urusan = EXCLUDED.nama_sub_urusan;

-- 3. Seed Matriks Perihal Spesifik / Series Arsip (Tier-3) di tbl_master_jra
INSERT INTO tbl_master_jra (
  kode_jra, kode_sub, series_arsip,
  retensi_aktif_tahun, retensi_inaktif_tahun,
  keterangan_akhir, klasifikasi_keamanan, unit_pengolah_default
) VALUES
  -- PP: Pendidikan dan Pengajaran
  ('PP.00.00', 'PP.00', 'Kepanitiaan dan Operasional Penerimaan Mahasiswa Baru (PMB)', 2, 3, 'Musnah', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.00.01', 'PP.00', 'Petunjuk Pelaksanaan (Juklak) dan Petunjuk Teknis (Juknis) PMB', 1, 1, 'Musnah', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.00.02', 'PP.00', 'Usulan dan Penetapan Daya Tampung Mahasiswa Baru', 2, 3, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.00.03', 'PP.00', 'Data Statistik Peminat dan Penetapan Kelulusan Mahasiswa Baru', 2, 3, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.00.04', 'PP.00', 'Administrasi dan Seleksi Penerimaan Mahasiswa Baru (Naskah Soal & Hasil Ujian Seleksi)', 2, 3, 'Musnah', 'Rahasia', 'BAKPK'),
  ('PP.01.00', 'PP.01', 'Buku Panduan dan Pedoman Orientasi Mahasiswa Baru', 1, 1, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.02.00', 'PP.02', 'Bukti Pembayaran dan Penundaan Uang Kuliah Tunggal (UKT) Registrasi Mahasiswa', 2, 3, 'Musnah', 'Terbatas', 'BKU'),
  ('PP.02.01', 'PP.02', 'Registrasi Akademik dan Penetapan Nomor Induk Mahasiswa (NIM)', 1, 2, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.03.00', 'PP.03', 'Pedoman Penyusunan Kurikulum Fakultas / Program Studi (OBE)', 1, 4, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),
  ('PP.04.00', 'PP.04', 'Penyusunan Kalender Akademik dan Jadwal Perkuliahan Semester', 1, 1, 'Musnah', 'Biasa/Terbuka', 'FAKULTAS'),
  ('PP.04.01', 'PP.04', 'Rencana Studi Mahasiswa (KRS), Izin Cuti Kuliah, dan Dispensasi Kuliah', 1, 2, 'Musnah', 'Biasa/Terbuka', 'FAKULTAS'),
  ('PP.04.09', 'PP.04', 'Evaluasi Mahasiswa, Naskah Soal Ujian (UTS/UAS), Nilai Ujian, dan Tugas Akhir/Skripsi', 2, 3, 'Permanen', 'Rahasia', 'FAKULTAS'),
  ('PP.05.00', 'PP.05', 'Audit Mutu Internal (AMI) dan Dokumen Sistem Penjaminan Mutu Akademik', 1, 1, 'Permanen', 'Terbatas', 'LPMPP'),
  ('PP.05.01', 'PP.05', 'Akreditasi Nasional dan Internasional Program Studi / Institusi', 1, 1, 'Permanen', 'Terbatas', 'LPMPP'),
  ('PP.06.00', 'PP.06', 'Administrasi Yudisium dan Penetapan Kelulusan Mahasiswa', 2, 3, 'Permanen', 'Terbatas', 'FAKULTAS'),
  ('PP.06.03', 'PP.06', 'Penerbitan Ijazah, Transkrip Nilai, dan Surat Keterangan Lulus (SKL)', 2, 3, 'Permanen', 'Terbatas', 'BAKPK'),
  ('PP.07.00', 'PP.07', 'Penyelenggaraan Wisuda dan Buku Wisudawan', 2, 3, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('PP.08.04', 'PP.08', 'Penugasan Pengajaran, Beban Kerja Dosen (BKD), dan SK Pembimbing/Penguji Mahasiswa', 2, 3, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),

  -- KM: Kemahasiswaan
  ('KM.00.00', 'KM.00', 'Surat Keterangan Aktif Kuliah Mahasiswa', 2, 3, 'Musnah', 'Biasa/Terbuka', 'FAKULTAS'),
  ('KM.00.01', 'KM.00', 'Permohonan dan Penetapan Cuti Kuliah / Pengaktifan Kembali Mahasiswa', 2, 3, 'Musnah', 'Terbatas', 'BAKPK'),
  ('KM.00.03', 'KM.00', 'Surat Peringatan, Usulan Skorsing, dan Penetapan Skorsing Mahasiswa', 2, 3, 'Musnah', 'Rahasia', 'FAKULTAS'),
  ('KM.01.00', 'KM.01', 'Kegiatan Rutin Unit Kegiatan Mahasiswa (UKM) dan Pembinaan Mahasiswa', 2, 3, 'Musnah', 'Biasa/Terbuka', 'BAKPK'),
  ('KM.01.01', 'KM.01', 'Program Kreativitas Mahasiswa (PKM) dan Lomba Kemahasiswaan', 2, 3, 'Musnah', 'Biasa/Terbuka', 'BAKPK'),
  ('KM.02.00', 'KM.02', 'Pengelolaan Beasiswa Mahasiswa (Usulan, Seleksi, dan Penetapan Penerima Beasiswa)', 2, 3, 'Permanen', 'Terbatas', 'BAKPK'),
  ('KM.03.00', 'KM.03', 'Pembentukan Organisasi Mahasiswa (Ormawa) dan Pengangkatan Pengurus', 2, 3, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),

  -- SA: Sarana Akademik
  ('SA.00.00', 'SA.00', 'Kebijakan Layanan Perpustakaan, Koleksi Buku, dan Bebas Pustaka', 1, 4, 'Musnah', 'Biasa/Terbuka', 'UPA_PERPUS'),
  ('SA.01.02', 'SA.01', 'Surat Menyurat Penggunaan Laboratorium, Praktikum, dan Pengujian', 1, 4, 'Musnah', 'Biasa/Terbuka', 'FAKULTAS'),
  ('SA.02.00', 'SA.02', 'Kebijakan Pembinaan Kearsipan dan Pengelolaan Arsip Perguruan Tinggi', 2, 3, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('SA.05.00', 'SA.05', 'Pengajuan Publikasi Jurnal/Buku, Review Naskah, dan Kontrak Penerbitan', 1, 1, 'Permanen', 'Terbatas', 'LPPM'),

  -- PM: Penelitian & Pengabdian kepada Masyarakat
  ('PM.00.00', 'PM.00', 'Kebijakan Penelitian, Proposal, Kontrak Penelitian, dan Surat Izin Penelitian', 2, 3, 'Permanen', 'Biasa/Terbuka', 'LPPM'),
  ('PM.00.04', 'PM.00', 'Publikasi Hasil Penelitian, Seminar/Workshop, dan Laporan Akhir Penelitian', 2, 3, 'Permanen', 'Biasa/Terbuka', 'LPPM'),
  ('PM.00.09', 'PM.00', 'Pengembangan HaKI, Pengajuan Paten, dan Hak Cipta', 2, 3, 'Permanen', 'Terbatas', 'LPPM'),
  ('PM.01.00', 'PM.01', 'Program Pengabdian kepada Masyarakat, Proposal, dan Laporan Pengabdian', 2, 3, 'Permanen', 'Biasa/Terbuka', 'LPPM'),
  ('PM.01.09', 'PM.01', 'Penyelenggaraan Kuliah Kerja Nyata (KKN) dan Kegiatan Magang Mahasiswa', 1, 4, 'Permanen', 'Biasa/Terbuka', 'LPPM'),

  -- OT: Organisasi / Tata Pamong
  ('OT.00.00', 'OT.00', 'Peraturan dan Surat Keputusan Senat Universitas', 2, 3, 'Permanen', 'Biasa/Terbuka', 'UNSIL'),
  ('OT.00.01', 'OT.00', 'Notula / Risalah Rapat dan Telaah Pertimbangan Senat Universitas', 2, 3, 'Permanen', 'Terbatas', 'UNSIL'),
  ('OT.01.00', 'OT.01', 'Peraturan, Keputusan, dan Risalah Senat Fakultas', 2, 3, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),

  -- DI: Data & Informasi Akademik
  ('DI.00.00', 'DI.00', 'Data Akademik, Data Lulusan, dan Tracer Study Alumni', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),

  -- PR: Perencanaan
  ('PR.00.00', 'PR.00', 'Rencana Strategis (Renstra), Program Kerja Tahunan, dan Kontrak Kinerja', 2, 3, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),

  -- HK: Hukum
  ('HK.01.00', 'HK.01', 'Peraturan Rektor Universitas Siliwangi', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('HK.02.00', 'HK.02', 'Keputusan Rektor (SK Rektor) Universitas Siliwangi', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('HK.03.00', 'HK.03', 'Peraturan Dekan / Direktur / Ketua Lembaga', 1, 4, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),
  ('HK.04.00', 'HK.04', 'Keputusan Dekan / Direktur / Ketua Lembaga', 1, 4, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),
  ('HK.05.00', 'HK.05', 'Instruksi Rektor Universitas Siliwangi', 1, 4, 'Permanen', 'Biasa/Terbuka', 'UNSIL'),
  ('HK.06.00', 'HK.06', 'Pedoman, Standar, Juklak, Juknis, Surat Edaran, dan SOP/POS', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('HK.07.00', 'HK.07', 'Nota Kesepahaman (MoU) dan Perjanjian Kerja Sama (PKS) Dalam Negeri', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('HK.07.01', 'HK.07', 'Nota Kesepahaman (MoU) dan Perjanjian Kerja Sama (PKS) Luar Negeri', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
  ('HK.10.02', 'HK.10', 'Pemberian Kuasa Kedinasan, Bantuan Hukum, dan Advokasi Tata Usaha Negara', 2, 2, 'Dinilai Kembali', 'Terbatas', 'BKU'),
  ('HK.11.00', 'HK.11', 'Berkas Kasus / Sengketa Hukum Pidana, Perdata, dan Putusan Pengadilan', 2, 3, 'Dinilai Kembali', 'Rahasia', 'BKU'),

  -- OK: Organisasi dan Ketatalaksanaan
  ('OK.00.01', 'OK.00', 'Struktur Organisasi dan Tata Kerja (SOTK) Universitas Siliwangi', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('OK.01.00', 'OK.01', 'Sistem dan Prosedur Operasional Standar (POS / SOP) Unit Kerja', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('OK.01.05', 'OK.01', 'Evaluasi dan Laporan Kinerja Berkala (Laporan Bulanan, Triwulan, Tahunan, & LAKIP)', 2, 4, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),

  -- KA: Kearsipan
  ('KA.00.00', 'KA.00', 'Pengendalian Surat (Agenda Surat Masuk/Keluar, Ekspedisi, & Surat Pengantar)', 1, 2, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('KA.04.01', 'KA.04', 'Berita Acara Pemindahan, Pemusnahan, dan Penyerahan Arsip Statis', 2, 3, 'Permanen', 'Terbatas', 'BKU'),

  -- KR: Ketatausahaan dan Kerumahtanggaan
  ('KR.01.00', 'KR.01', 'Administrasi Perjalanan Dinas Dalam Negeri dan Luar Negeri', 2, 3, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('KR.02.00', 'KR.02', 'Permintaan dan Izin Penggunaan Fasilitas Kantor, Ruang, Gedung, dan Kendaraan Dinas', 1, 1, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('KR.03.00', 'KR.03', 'Risalah / Notula Rapat Staf Internal Unit Kerja', 1, 4, 'Dinilai Kembali', 'Terbatas', 'FAKULTAS'),
  ('KR.03.01', 'KR.03', 'Risalah / Notula Rapat Pimpinan Universitas / Fakultas', 1, 4, 'Permanen', 'Rahasia', 'UNSIL'),
  ('KR.03.02', 'KR.03', 'Risalah / Notula Rapat Koordinasi Kedinasan', 1, 4, 'Dinilai Kembali', 'Terbatas', 'BKU'),
  ('KR.07.01', 'KR.07', 'Pengelolaan dan Pemeliharaan Instalasi Listrik, Air, Telepon, dan Jaringan', 1, 1, 'Musnah', 'Biasa/Terbuka', 'BKU'),

  -- PL: Perlengkapan & BMN
  ('PL.00.00', 'PL.00', 'Rencana Kebutuhan Barang (RKB) dan Rencana Umum Pengadaan (RUP) Unit Kerja', 5, 5, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('PL.01.00', 'PL.01', 'Pengadaan / Pembelian Barang dan Jasa (SPK, Kontrak, & Pemeriksaan)', 2, 3, 'Dinilai Kembali', 'Terbatas', 'BKU'),
  ('PL.04.02', 'PL.04', 'Berita Acara Serah Terima (BAST) Barang dan Aset Milik Negara (BMN)', 1, 2, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('PL.05.02', 'PL.05', 'Inventarisasi Barang dan Laporan Rekonsiliasi SIMAK BMN', 1, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),

  -- HM: Hubungan Masyarakat
  ('HM.00.00', 'HM.00', 'Penyelenggaraan Acara Kedinasan, Undangan Resmi, Pelantikan, dan Keprotokolan', 1, 3, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('HM.00.01', 'HM.00', 'Penyelenggaraan Dies Natalis dan Upacara Akademik Universitas', 1, 1, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('HM.00.06', 'HM.00', 'Pengumuman Resmi, Pemberitaan, dan Penyajian Informasi Kelembagaan', 1, 2, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('HM.01.00', 'HM.01', 'Hubungan Antar Lembaga Pemerintahan, Perguruan Tinggi, dan Kemitraan', 1, 2, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),

  -- DT: Pendidikan dan Pelatihan
  ('DT.14.00', 'DT.14', 'Penyelenggaraan Diklat, Bimbingan Teknis (Bimtek), Seminar, dan Lokakarya', 1, 3, 'Musnah', 'Biasa/Terbuka', 'BKU'),

  -- TI: Teknologi Informasi
  ('TI.01.00', 'TI.01', 'Pengelolaan Sistem Informasi, Sertifikat Elektronik (TTE BSrE), dan Jaringan TIK', 1, 4, 'Permanen', 'Terbatas', 'UPA_TIK'),

  -- PS: Pengawasan
  ('PS.02.00', 'PS.02', 'Laporan Hasil Audit Internal (LHA), Pemeriksaan Khusus, dan Tindak Lanjut SPI', 1, 3, 'Permanen', 'Rahasia', 'SPI'),
  ('PS.02.01', 'PS.02', 'Laporan Hasil Audit Investigasi (LHAI) Tindak Pidana Korupsi / Pelanggaran Berat', 2, 3, 'Permanen', 'Sangat Rahasia', 'SPI'),

  -- KU: Keuangan
  ('KU.00.00', 'KU.00', 'Dokumen Rencana Kerja dan Anggaran (RKA-K/L) serta RBA UNSIL', 2, 4, 'Musnah', 'Biasa/Terbuka', 'BAKPK'),
  ('KU.01.04', 'KU.01', 'Daftar Isian Pelaksanaan Anggaran (DIPA), POK, dan Revisi Anggaran', 2, 4, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('KU.02.01', 'KU.02', 'Dokumen Pembayaran Keuangan: SPP, SPM, SP2D, dan Surat Pertanggungjawaban (SPJ)', 2, 5, 'Dinilai Kembali', 'Terbatas', 'BKU'),
  ('KU.06.00', 'KU.06', 'Laporan Hasil Pemeriksaan Keuangan BPK dan Penyelesaian Kerugian Negara', 2, 5, 'Permanen', 'Rahasia', 'BKU'),

  -- KP: Kepegawaian (Termasuk Contoh Eksplisit Permintaan Pengguna: KP.04.03 & KP.05.00)
  ('KP.00.00', 'KP.00', 'Usulan dan Penetapan Formasi Kebutuhan Pegawai dari Unit Kerja', 2, 2, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('KP.01.02', 'KP.01', 'Penetapan NIP, Pengangkatan CPNS, PNS, PPPK, dan Dosen Tetap', 2, 5, 'Permanen', 'Rahasia', 'BKU'),
  ('KP.02.00', 'KP.02', 'Tugas Belajar, Izin Belajar, Diklat, dan Pengembangan Karier Pegawai', 1, 3, 'Permanen', 'Biasa/Terbuka', 'BKU'),
  ('KP.02.02', 'KP.02', 'Sasaran Kinerja Pegawai (SKP) dan Penilaian Prestasi Kerja ASN', 1, 3, 'Musnah', 'Terbatas', 'BKU'),
  ('KP.02.03', 'KP.02', 'Daftar Usul Penetapan Angka Kredit (PAK) Jabatan Fungsional Dosen', 1, 2, 'Permanen', 'Terbatas', 'BKU'),
  ('KP.02.05', 'KP.02', 'Pemeriksaan Pelanggaran Disiplin dan Penjatuhan Hukuman Disiplin Pegawai', 1, 2, 'Permanen', 'Sangat Rahasia', 'BKU'),
  ('KP.04.00', 'KP.04', 'Mutasi Pegawai: Alih Status, Pindah Instansi, dan Penempatan Antar Unit Kerja', 1, 2, 'Permanen', 'Terbatas', 'BKU'),
  ('KP.04.03', 'KP.04', 'Usul Kenaikan Pangkat Golongan/Jabatan', 1, 2, 'Permanen', 'Terbatas', 'BKU'),
  ('KP.04.04', 'KP.04', 'Usul Pengangkatan dan Pemberhentian dalam Jabatan Struktural / Fungsional', 1, 2, 'Permanen', 'Terbatas', 'BKU'),
  ('KP.04.07', 'KP.04', 'Berkas Pertimbangan BAPERJAKAT (Badan Pertimbangan Jabatan dan Kepangkatan)', 1, 5, 'Permanen', 'Rahasia', 'BKU'),
  ('KP.05.00', 'KP.05', 'Surat Perintah Dinas / Surat Tugas (Administrasi Pegawai)', 2, 2, 'Musnah', 'Biasa/Terbuka', 'BKU'),
  ('KP.05.01', 'KP.05', 'Administrasi Cuti Pegawai (Cuti Besar, Cuti Tahunan, Cuti Sakit, & Bersalin)', 1, 2, 'Musnah', 'Terbatas', 'BKU'),
  ('KP.05.05', 'KP.05', 'Surat Pernyataan Melaksanakan Tugas (SPMT) dan Dokumentasi Identitas Pegawai', 1, 2, 'Musnah', 'Terbatas', 'BKU')
ON CONFLICT (kode_jra) DO UPDATE
SET kode_sub = EXCLUDED.kode_sub,
    series_arsip = EXCLUDED.series_arsip,
    retensi_aktif_tahun = EXCLUDED.retensi_aktif_tahun,
    retensi_inaktif_tahun = EXCLUDED.retensi_inaktif_tahun,
    keterangan_akhir = EXCLUDED.keterangan_akhir,
    klasifikasi_keamanan = EXCLUDED.klasifikasi_keamanan,
    unit_pengolah_default = EXCLUDED.unit_pengolah_default;

-- 4. Sinkronkan ke tabel master_klasifikasi_arsip (jika ada) agar endpoint lama dan baru 100% konsisten
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_klasifikasi_arsip') THEN
    INSERT INTO master_klasifikasi_arsip (kode_klasifikasi, keterangan_klasifikasi, is_active)
    SELECT kode_jra, series_arsip, TRUE
    FROM tbl_master_jra
    ON CONFLICT (kode_klasifikasi) DO UPDATE
    SET keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
        is_active = TRUE;
  END IF;
END $$;

COMMIT;

