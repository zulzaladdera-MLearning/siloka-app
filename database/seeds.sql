-- =============================================================================
-- DATA AWAL (SEEDS) DATABASE POSTGRESQL SILOKA UNSIL (TERPADU & TERSTRUKTUR)
-- =============================================================================

-- 1. SEED: 21 SATUAN KERJA RESMI UNIVERSITAS SILIWANGI
INSERT INTO master_unit_kerja (id, kode_unit, nama_unit, singkatan, tipe_unit, parent_kode, is_active) VALUES
(1, 'UN58', 'Universitas Siliwangi (Rektorat)', 'UNSIL', 'UNIVERSITAS', NULL, TRUE),
(2, 'UN58.SENAT', 'Senat Universitas Siliwangi', 'SENAT', 'ORGAN', 'UN58', TRUE),
(3, 'UN58.SPI', 'Satuan Pengawas Internal', 'SPI', 'ORGAN', 'UN58', TRUE),
(4, 'UN58.DP', 'Dewan Penyantun', 'DP', 'ORGAN', 'UN58', TRUE),
(5, 'UN58.5', 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama', 'BAKPK', 'BIRO', 'UN58', TRUE),
(6, 'UN58.6', 'Biro Keuangan dan Umum', 'BKU', 'BIRO', 'UN58', TRUE),
(7, 'UN58.10', 'Fakultas Keguruan dan Ilmu Pendidikan', 'FKIP', 'FAKULTAS', 'UN58', TRUE),
(8, 'UN58.11', 'Fakultas Ekonomi dan Bisnis', 'FEB', 'FAKULTAS', 'UN58', TRUE),
(9, 'UN58.12', 'Fakultas Pertanian', 'FP', 'FAKULTAS', 'UN58', TRUE),
(10, 'UN58.13', 'Fakultas Teknik', 'FT', 'FAKULTAS', 'UN58', TRUE),
(11, 'UN58.14', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'FISIP', 'FAKULTAS', 'UN58', TRUE),
(12, 'UN58.15', 'Fakultas Ilmu Kesehatan', 'FIK', 'FAKULTAS', 'UN58', TRUE),
(13, 'UN58.16', 'Fakultas Agama Islam', 'FAI', 'FAKULTAS', 'UN58', TRUE),
(14, 'UN58.17', 'Program Pascasarjana', 'PASCA', 'FAKULTAS', 'UN58', TRUE),
(15, 'UN58.21', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat', 'LPPM', 'LEMBAGA', 'UN58', TRUE),
(16, 'UN58.22', 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran', 'LPMPP', 'LEMBAGA', 'UN58', TRUE),
(17, 'UN58.31', 'Unit Penunjang Akademik Perpustakaan', 'UPA PERPUS', 'UPA', 'UN58', TRUE),
(18, 'UN58.32', 'Unit Penunjang Akademik Teknologi Informasi dan Komunikasi', 'UPA TIK', 'UPA', 'UN58', TRUE),
(19, 'UN58.33', 'Unit Penunjang Akademik Bahasa', 'UPA BAHASA', 'UPA', 'UN58', TRUE),
(20, 'UN58.34', 'Unit Penunjang Akademik Pengembangan Karier dan Kewirausahaan Mahasiswa', 'UPA PKKM', 'UPA', 'UN58', TRUE),
(21, 'UN58.35', 'Unit Penunjang Akademik Layanan Uji Kompetensi', 'UPA LUK', 'UPA', 'UN58', TRUE)
ON CONFLICT (kode_unit) DO UPDATE 
SET nama_unit = EXCLUDED.nama_unit,
    singkatan = EXCLUDED.singkatan,
    tipe_unit = EXCLUDED.tipe_unit,
    parent_kode = EXCLUDED.parent_kode;

SELECT setval('master_unit_kerja_id_seq', (SELECT MAX(id) FROM master_unit_kerja));


-- 2. SEED: MASTER KLASIFIKASI ARSIP (Hierarkis 3 Tingkat Standar ANRI & UNSIL)

-- Tingkat 1: Pokok
INSERT INTO master_klasifikasi_arsip (id, kode_klasifikasi, nama_klasifikasi, keterangan_klasifikasi, parent_id, level, kode, is_active) VALUES
(1, 'PP', 'Pendidikan & Pengajaran', 'Urusan pendidikan, kurikulum, silabus, dan kegiatan belajar mengajar', NULL, 1, 'PP', TRUE),
(2, 'KU', 'Keuangan & Anggaran', 'Urusan pengelolaan anggaran belanja, DIPA, perbendaharaan, dan akuntansi', NULL, 1, 'KU', TRUE),
(3, 'KP', 'Kepegawaian & SDM', 'Urusan formasi, pengangkatan, penempatan, dan mutasi tugas pegawai', NULL, 1, 'KP', TRUE),
(4, 'PL', 'Perlengkapan & BMN', 'Urusan pengadaan, pencatatan tanah, dan barang milik negara (BMN)', NULL, 1, 'PL', TRUE),
(5, 'KR', 'Kerumahtanggaan & Sarpras', 'Urusan pemeliharaan gedung kuliah, sarana dan prasarana kampus', NULL, 1, 'KR', TRUE),
(6, 'HM', 'Humas & Protokoler', 'Urusan keprotokolan pimpinan, publikasi, dan hubungan lembaga eksternal', NULL, 1, 'HM', TRUE)
ON CONFLICT (kode_klasifikasi) DO UPDATE
SET nama_klasifikasi = EXCLUDED.nama_klasifikasi,
    keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
    level = 1,
    parent_id = NULL;

-- Tingkat 2: Sub-Klasifikasi
INSERT INTO master_klasifikasi_arsip (id, kode_klasifikasi, nama_klasifikasi, keterangan_klasifikasi, parent_id, level, kode, is_active) VALUES
(7, 'PP.00', 'Kurikulum dan Pembelajaran', 'Penyusunan kurikulum, silabus, dan program akademik', 1, 2, 'PP', TRUE),
(8, 'PP.01', 'Penerimaan Mahasiswa', 'Proses seleksi dan pendaftaran mahasiswa baru', 1, 2, 'PP', TRUE),
(9, 'PP.02', 'Kelulusan dan Kemahasiswaan', 'Administrasi yudisium, kelulusan, dan UKT mahasiswa', 1, 2, 'PP', TRUE),
(10, 'KU.01', 'Perencanaan & Pelaksanaan Anggaran', 'DIPA dan pengelolaan anggaran belanja operasional satker', 2, 2, 'KU', TRUE),
(11, 'KU.02', 'Perbendaharaan & Laporan Keuangan', 'Kuitansi belanja, pembukuan kas, dan audit eksternal', 2, 2, 'KU', TRUE),
(12, 'KP.01', 'Formasi dan Pengadaan SDM', 'Analisis jabatan dan formasi pegawai ASN/PPPK', 3, 2, 'KP', TRUE),
(13, 'KP.02', 'Mutasi dan Penugasan Jabatan', 'Pengangkatan tugas tambahan dan penempatan pegawai', 3, 2, 'KP', TRUE),
(14, 'PL.01', 'Pengadaan Barang & Jasa', 'Pelelangan dan pengadaan inventaris dinas', 4, 2, 'PL', TRUE),
(15, 'PL.02', 'Inventarisasi & Legalitas BMN', 'Sertifikat tanah dan aset kepemilikan universitas', 4, 2, 'PL', TRUE),
(16, 'KR.03', 'Pemeliharaan Gedung Kampus', 'Perbaikan ruang kuliah, laboratorium, dan gedung dinas', 5, 2, 'KR', TRUE),
(17, 'KR.07', 'Gambar Bangunan & Denah Fisik', 'Gambar as-built drawing fisik gedung kampus', 5, 2, 'KR', TRUE),
(18, 'HM.00', 'Keprotokolan & Agenda Acara', 'Undangan dinas dan protokoler rapat pimpinan', 6, 2, 'HM', TRUE)
ON CONFLICT (kode_klasifikasi) DO UPDATE
SET nama_klasifikasi = EXCLUDED.nama_klasifikasi,
    keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
    parent_id = EXCLUDED.parent_id,
    level = 2;

-- Tingkat 3: Sub-sub Klasifikasi
INSERT INTO master_klasifikasi_arsip (id, kode_klasifikasi, nama_klasifikasi, keterangan_klasifikasi, parent_id, level, kode, is_active) VALUES
(19, 'PP.00.03', 'Penyelenggaraan Kurikulum, Silabus, dan Program Pembelajaran Akademik', 'Dokumen pelaksanaan silabus dan kurikulum program studi', 7, 3, 'PP', TRUE),
(20, 'PP.02.00', 'Bukti Pembayaran Kuliah UKT Mahasiswa', 'Kuitansi dan verifikasi pelunasan uang kuliah tunggal', 9, 3, 'PP', TRUE),
(21, 'KU.01.00', 'Penyusunan Rencana Anggaran Belanja', 'Rancangan anggaran biaya operasional tahun berjalan', 10, 3, 'KU', TRUE),
(22, 'KU.01.04', 'Pengelolaan Anggaran Belanja Operasional, DIPA, dan SPJ Keuangan', 'Pertanggungjawaban belanja dinas dan pengajuan UP', 10, 3, 'KU', TRUE),
(23, 'KU.02.01', 'Kuitansi Belanja Operasional & Pajak', 'Bukti pengeluaran kas operasional dan pemotongan pajak', 11, 3, 'KU', TRUE),
(24, 'KU.02.01.h', 'Laporan Keuangan Tahunan (Audited)', 'Laporan pertanggungjawaban keuangan tahunan audit BPK', 11, 3, 'KU', TRUE),
(25, 'KP.02.01', 'Pengangkatan, Penempatan Tugas, dan Formasi Jabatan Pegawai ASN/PPPK', 'SK Rektor pengangkatan dan penugasan struktural pegawai', 13, 3, 'KP', TRUE),
(26, 'PL.01.02', 'Pengadaan, Pendataan Aset Tanah, dan Inventaris Barang Milik Negara (BMN)', 'Berkas pengadaan dan penatausahaan inventaris BMN', 14, 3, 'PL', TRUE),
(27, 'PL.02.04', 'Sertifikat Kepemilikan Tanah & Aset BMN', 'Dokumen legal sertifikat kepemilikan tanah dan aset vital', 15, 3, 'PL', TRUE),
(28, 'KR.03.01', 'Pemeliharaan Bangunan Gedung, Ruang Kuliah, dan Sarana Prasarana Kampus', 'Usulan perbaikan atap, instalasi listrik, dan lab', 16, 3, 'KR', TRUE),
(29, 'KR.07.00', 'Gambar As-Built Drawing Gedung Kampus', 'Arsip gambar teknik dan instalasi denah fisik gedung kampus', 17, 3, 'KR', TRUE),
(30, 'HM.00.01', 'Keprotokolan, Undangan Rapat Kedinasan, dan Hubungan Lembaga Eksternal', 'Surat undangan resmi pimpinan dan agenda keprotokolan', 18, 3, 'HM', TRUE)
ON CONFLICT (kode_klasifikasi) DO UPDATE
SET nama_klasifikasi = EXCLUDED.nama_klasifikasi,
    keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
    parent_id = EXCLUDED.parent_id,
    level = 3;

SELECT setval('master_klasifikasi_arsip_id_seq', (SELECT MAX(id) FROM master_klasifikasi_arsip));


-- 3. SEED: MASTER USER KANONIK (LINTAS 21 SATUAN KERJA + SUPER ADMIN & DOSEN)
INSERT INTO master_user (id, nip_nik, username, nama_lengkap, email, password_hash, unit_kerja_id, role, role_level, role_label, avatar_url, is_signature_ready, is_active) VALUES
-- Super Admin SILOKA
('usr-00', '198501012010121001', 'superadmin', 'Administrator Utama SILOKA, S.Kom., M.T.', 'superadmin@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.32', 'SUPER_ADMIN', 'Level 0: Administrator', 'Super Admin SILOKA UNSIL', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),

-- Rektorat (UN58)
('usr-01', '196708161996031001', '196708161996031001', 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.', 'aripin.rektor@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'PEJABAT', 'Level 1: Pimpinan', 'Rektor Universitas Siliwangi', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-02', '199003152015041002', '199003152015041002', 'Rahmat Hidayat, S.AP.', 'tu.rektorat@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Tata Usaha & Protokoler Rektorat', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Senat (UN58.SENAT)
('usr-03', '196605121992031003', '196605121992031003', 'Prof. Dr. Dedi Kusmayadi, S.E., M.Si., Ak., CA.', 'ketua.senat@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SENAT', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua Senat Universitas Siliwangi', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-04', '199208202018022001', '199208202018022001', 'Dewi Sartika, S.Sos.', 'sekretariat.senat@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SENAT', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Sekretariat Senat', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Satuan Pengawas Internal (UN58.SPI)
('usr-05', '198007112005011002', '198007112005011002', 'Hendra Pratama, S.E., Ak., C.A.', 'hendra.spi@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SPI', 'PENGAWAS', 'Level 3: Pengawas', 'Ketua Satuan Pengawas Internal (SPI)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-06', '199304122019031004', '199304122019031004', 'Mochamad Iqbal, S.Ak.', 'operator.spi@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SPI', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Administrasi & Audit SPI', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Dewan Penyantun (UN58.DP)
('usr-07', '195907141987031002', '195907141987031002', 'Drs. H. Syarif Hidayat, M.Si.', 'ketua.dp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.DP', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua Dewan Penyantun', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-08', '199111052017042003', '199111052017042003', 'Lilis Suryani, S.AP.', 'sekretariat.dp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.DP', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Sekretariat Dewan Penyantun', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Biro BAKPK (UN58.5)
('usr-09', '196510251991031002', '196510251991031002', 'Drs. H. Ade Rustandi, M.Si.', 'ade.bakpk@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.5', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala Biro BAKPK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-10', '198706182012042001', '198706182012042001', 'Neni Triana, S.Sos.', 'operator.bakpk@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.5', 'STAF_PERSURATAN', 'Level 2: Pelaksana (Staf)', 'Staf Persuratan & Tata Usaha BAKPK', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Biro BKU (UN58.6)
('usr-11', '196808301989031004', '196808301989031004', 'Dr. Nana Sujana, Drs., M.Si.', 'nana.sujana@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.6', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala Biro Keuangan dan Umum', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-12', '198809152014042001', '198809152014042001', 'Siti Rohmah, S.AP.', 'siti.rohmah@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.6', 'STAF_PERSURATAN', 'Level 2: Pelaksana (Staf)', 'Staf Persuratan & Kearsipan BKU', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- FKIP (UN58.10)
('usr-13', '197204151998021001', '197204151998021001', 'Dr. H. Cucu Suherman, M.Pd.', 'cucu.suherman@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.10', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Keguruan dan Ilmu Pendidikan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-14', '199105202018032001', '199105202018032001', 'Dian Fitriani, S.Pd.', 'dian.fkip@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.10', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FKIP', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- FEB (UN58.11)
('usr-15', '197103101997022001', '197103101997022001', 'Prof. Dr. H. Iis Rahmawati, S.E., M.Si.', 'dekan.feb@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.11', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Ekonomi dan Bisnis', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-16', '198904122015041002', '198904122015041002', 'Asep Saepuloh, S.E.', 'operator.feb@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.11', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FEB', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Fakultas Pertanian (UN58.12)
('usr-17', '196409181990031003', '196409181990031003', 'Dr. Rudi Priyadi, Ir., M.P.', 'dekan.fp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.12', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Pertanian', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-18', '199007222016042001', '199007222016042001', 'Enok Widaningsih, S.P.', 'operator.fp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.12', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FP', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Fakultas Teknik (UN58.13)
('usr-19', '197306282000031001', '197306282000031001', 'Dr. Nurul Hiron, S.T., M.Eng.', 'dekan.ft@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.13', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Teknik', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-20', '198906102015041003', '198906102015041003', 'Arif Hidayat, S.T.', 'arif.ft@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.13', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha Fakultas Teknik', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- Dosen Tambahan Fakultas Teknik
('usr-dosen-01', '198205102008121003', '198205102008121003', 'Husni Mubarok, S.T., M.T.', 'husni.mubarok@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.13', 'DOSEN', 'Level 2: Fungsional Dosen', 'Dosen Teknik Informatika', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),
('usr-dosen-02', '199308142020011003', '199308142020011003', 'Fajar Nugraha, S.KM., M.T.', 'fajar.nugraha@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.13', 'DOSEN', 'Level 2: Fungsional Dosen', 'Dosen Fakultas Teknik', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- LPPM (UN58.21)
('usr-29', '197405102002121001', '197405102002121001', 'Dr. Gumilar Mulya, M.Pd.', 'ketua.lppm@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.21', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua LPPM Universitas Siliwangi', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-30', '199009172018012001', '199009172018012001', 'Rina Marlina, S.Si.', 'operator.lppm@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.21', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Administrasi Penelitian LPPM', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- LPMPP (UN58.22)
('usr-31', '196702141993031002', '196702141993031002', 'Dr. H. Supratman, Drs., M.Pd.', 'ketua.lpmpp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.22', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua LPMPP Universitas Siliwangi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-32', '199106202019021002', '199106202019021002', 'Cecep Supriadi, S.Pd.', 'operator.lpmpp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.22', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Administrasi Mutu LPMPP', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE, TRUE),

-- UPA TIK (UN58.32)
('usr-35', '198501282012121002', '198501282012121002', 'Alam Rahmatulloh, S.T., M.T.', 'kepala.tik@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.32', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala UPA TIK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE, TRUE),
('usr-36', '199402152020011002', '199402152020011002', 'Gilang Ramadhan, S.Kom.', 'operator.tik@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.32', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Admin Jaringan & Server TIK', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE, TRUE)
ON CONFLICT (id) DO UPDATE 
SET nama_lengkap = EXCLUDED.nama_lengkap,
    username = EXCLUDED.username,
    unit_kerja_id = EXCLUDED.unit_kerja_id,
    role = EXCLUDED.role,
    role_level = EXCLUDED.role_level,
    role_label = EXCLUDED.role_label,
    is_active = EXCLUDED.is_active;


-- 4. SEED: MASTER PEJABAT PENANDATANGAN (Automated Hierarchy Routing)
-- Perhatian: "Dr. Gumilar Mulya" dan "Dr. Supratman" dikonfirmasi sebagai entitas terpisah dengan NIP masing-masing
INSERT INTO master_pejabat (user_id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, status_plt_plh, is_penandatangan_default, tanggal_mulai, is_active) VALUES
-- Rektorat (UN58)
('usr-01', '196708161996031001', 'Prof. Dr. Eng. Ir. Aripin', 'IPU., ASEAN Eng.', 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.', 'Rektor Universitas Siliwangi', 'UN58', 'DEFINITIF', TRUE, '2022-05-18', TRUE),
(NULL, '197005141997021001', 'Prof. Dr. Dedi Nurjamil', 'M.Pd.', 'Prof. Dr. Dedi Nurjamil, M.Pd.', 'Wakil Rektor Bidang Akademik', 'UN58', 'DEFINITIF', FALSE, '2022-06-01', TRUE),
(NULL, '197302212001121001', 'Dr. Gumilar Mulya', 'M.Pd.', 'Dr. Gumilar Mulya, M.Pd.', 'Wakil Rektor Bidang Umum dan Keuangan', 'UN58', 'DEFINITIF', FALSE, '2022-06-01', TRUE),
(NULL, '197204121998021001', 'Dr. Supratman', 'M.Pd.', 'Dr. Supratman, M.Pd.', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', 'UN58', 'DEFINITIF', FALSE, '2022-06-01', TRUE),

-- Organ & Pimpinan Khusus
('usr-03', '196605121992031003', 'Prof. Dr. Dedi Kusmayadi', 'S.E., M.Si., Ak., CA.', 'Prof. Dr. Dedi Kusmayadi, S.E., M.Si., Ak., CA.', 'Ketua Senat Universitas Siliwangi', 'UN58.SENAT', 'DEFINITIF', TRUE, '2022-06-15', TRUE),
('usr-05', '198007112005011002', 'Hendra Pratama', 'S.E., Ak., C.A.', 'Hendra Pratama, S.E., Ak., C.A.', 'Ketua Satuan Pengawas Internal (SPI)', 'UN58.SPI', 'DEFINITIF', TRUE, '2022-07-01', TRUE),
('usr-07', '195907141987031002', 'Drs. H. Syarif Hidayat', 'M.Si.', 'Drs. H. Syarif Hidayat, M.Si.', 'Ketua Dewan Penyantun', 'UN58.DP', 'DEFINITIF', TRUE, '2022-07-01', TRUE),

-- Biro
('usr-09', '196510251991031002', 'Drs. H. Ade Rustandi', 'M.Si.', 'Drs. H. Ade Rustandi, M.Si.', 'Kepala Biro BAKPK', 'UN58.5', 'DEFINITIF', TRUE, '2021-03-10', TRUE),
('usr-11', '196808301989031004', 'Dr. Nana Sujana', 'Drs., M.Si.', 'Dr. Nana Sujana, Drs., M.Si.', 'Kepala Biro Keuangan dan Umum', 'UN58.6', 'DEFINITIF', TRUE, '2021-03-10', TRUE),

-- Fakultas
('usr-13', '197204151998021001', 'Dr. H. Cucu Suherman', 'M.Pd.', 'Dr. H. Cucu Suherman, M.Pd.', 'Dekan Fakultas Keguruan dan Ilmu Pendidikan', 'UN58.10', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
(NULL, '197109251998022001', 'Dr. Hj. Evi Soviawati', 'M.Pd.', 'Dr. Hj. Evi Soviawati, M.Pd.', 'Wakil Dekan Bidang Akademik FKIP', 'UN58.10', 'DEFINITIF', FALSE, '2023-02-01', TRUE),
('usr-15', '197103101997022001', 'Prof. Dr. H. Iis Rahmawati', 'S.E., M.Si.', 'Prof. Dr. H. Iis Rahmawati, S.E., M.Si.', 'Dekan Fakultas Ekonomi dan Bisnis', 'UN58.11', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
('usr-17', '196409181990031003', 'Dr. Rudi Priyadi', 'Ir., M.P.', 'Dr. Rudi Priyadi, Ir., M.P.', 'Dekan Fakultas Pertanian', 'UN58.12', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
('usr-19', '197306282000031001', 'Dr. Nurul Hiron', 'S.T., M.Eng.', 'Dr. Nurul Hiron, S.T., M.Eng.', 'Dekan Fakultas Teknik', 'UN58.13', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
('usr-dosen-01', '198205102008121003', 'Husni Mubarok', 'S.T., M.T.', 'Husni Mubarok, S.T., M.T.', 'Wakil Dekan Bidang Akademik FT', 'UN58.13', 'DEFINITIF', FALSE, '2023-02-01', TRUE),
(NULL, '196901151994031002', 'Dr. H. Akhmad Satori', 'Drs., M.Si.', 'Dr. H. Akhmad Satori, Drs., M.Si.', 'Dekan Fakultas Ilmu Sosial dan Ilmu Politik', 'UN58.14', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
(NULL, '196811201993032001', 'Dr. Hj. Nina Herlina', 'Dra., M.Kes.', 'Dr. Hj. Nina Herlina, Dra., M.Kes.', 'Dekan Fakultas Ilmu Kesehatan', 'UN58.15', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
(NULL, '197005161998031004', 'Dr. H. Aam Abdussalam', 'M.Ag.', 'Dr. H. Aam Abdussalam, M.Ag.', 'Dekan Fakultas Agama Islam', 'UN58.16', 'DEFINITIF', TRUE, '2023-01-15', TRUE),
(NULL, '196309081990021001', 'Prof. Dr. H. Deden Mulyana', 'S.E., M.Si.', 'Prof. Dr. H. Deden Mulyana, S.E., M.Si.', 'Direktur Program Pascasarjana', 'UN58.17', 'DEFINITIF', TRUE, '2023-01-15', TRUE),

-- Lembaga
('usr-29', '197405102002121001', 'Dr. Gumilar Mulya', 'M.Pd.', 'Dr. Gumilar Mulya, M.Pd.', 'Ketua LPPM Universitas Siliwangi', 'UN58.21', 'DEFINITIF', TRUE, '2022-09-01', TRUE),
('usr-31', '196702141993031002', 'Dr. H. Supratman', 'Drs., M.Pd.', 'Dr. H. Supratman, Drs., M.Pd.', 'Ketua LPMPP Universitas Siliwangi', 'UN58.22', 'DEFINITIF', TRUE, '2022-09-01', TRUE),

-- UPA
(NULL, '196604181992032001', 'Dra. Hj. Lilis Rohaeti', 'M.Si.', 'Dra. Hj. Lilis Rohaeti, M.Si.', 'Kepala UPA Perpustakaan', 'UN58.31', 'DEFINITIF', TRUE, '2023-03-01', TRUE),
('usr-35', '198501282012121002', 'Alam Rahmatulloh', 'S.T., M.T.', 'Alam Rahmatulloh, S.T., M.T.', 'Kepala UPA TIK', 'UN58.32', 'DEFINITIF', TRUE, '2022-08-01', TRUE),
(NULL, '197904092005011003', 'Dr. Soni Tantan Tandiana', 'S.Pd., M.Pd.', 'Dr. Soni Tantan Tandiana, S.Pd., M.Pd.', 'Kepala UPA Bahasa', 'UN58.33', 'DEFINITIF', TRUE, '2023-03-01', TRUE),
(NULL, '197607212003121001', 'Dr. Dian Kurniawan', 'S.E., M.Si.', 'Dr. Dian Kurniawan, S.E., M.Si.', 'Kepala UPA PKKM', 'UN58.34', 'DEFINITIF', TRUE, '2023-03-01', TRUE),
(NULL, '196503121991031003', 'Dr. Ir. H. Ade Ismail', 'M.P.', 'Dr. Ir. H. Ade Ismail, M.P.', 'Kepala UPA Layanan Uji Kompetensi', 'UN58.35', 'DEFINITIF', TRUE, '2023-03-01', TRUE)
ON CONFLICT (nip) DO UPDATE
SET user_id = EXCLUDED.user_id,
    nama = EXCLUDED.nama,
    gelar = EXCLUDED.gelar,
    nama_gelar = EXCLUDED.nama_gelar,
    jabatan = EXCLUDED.jabatan,
    kode_unit = EXCLUDED.kode_unit,
    status_plt_plh = EXCLUDED.status_plt_plh,
    is_penandatangan_default = EXCLUDED.is_penandatangan_default,
    is_active = EXCLUDED.is_active;

SELECT setval('master_pejabat_id_seq', (SELECT MAX(id) FROM master_pejabat));


-- 5. SEED: JADWAL RETENSI ARSIP (JRA) RESMI DENGAN RELASI KLASIFIKASI
INSERT INTO jadwal_retensi_arsip (klasifikasi_id, kode_seri, nama_seri, retensi_aktif_tahun, retensi_inaktif_tahun, status_akhir, is_safeguard_locked, jumlah_berkas, keterangan) VALUES
((SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU.02.01'), 'KU.02.01', 'Kuitansi Belanja Operasional & Pajak', 2, 5, 'Musnah', FALSE, 1420, 'Dimusnahkan setelah diaudit BPK dan mendapat persetujuan ANRI'),
((SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PP.02.00'), 'PP.02.00', 'Bukti Pembayaran Kuliah UKT Mahasiswa', 2, 3, 'Musnah', FALSE, 3890, 'Dimusnahkan setelah mahasiswa lulus yudisium'),
((SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU.02.01.h'), 'KU.02.01.h', 'Laporan Keuangan Tahunan (Audited)', 5, 10, 'Permanen', TRUE, 48, 'Wajib diserahkan ke Arsip Nasional Republik Indonesia (ANRI)'),
((SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KR.07.00'), 'KR.07.00', 'Gambar As-Built Drawing Gedung Kampus', 10, 15, 'Permanen', TRUE, 115, 'Arsip vital statis pemeliharaan aset fisik kampus'),
((SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PL.02.04'), 'PL.02.04', 'Sertifikat Kepemilikan Tanah & Aset BMN', 0, 0, 'Permanen', TRUE, 76, 'Tersimpan dalam Brankas Digital Terenkripsi AES-256')
ON CONFLICT (kode_seri) DO UPDATE
SET klasifikasi_id = EXCLUDED.klasifikasi_id,
    nama_seri = EXCLUDED.nama_seri,
    retensi_aktif_tahun = EXCLUDED.retensi_aktif_tahun,
    retensi_inaktif_tahun = EXCLUDED.retensi_inaktif_tahun,
    status_akhir = EXCLUDED.status_akhir,
    is_safeguard_locked = EXCLUDED.is_safeguard_locked,
    jumlah_berkas = EXCLUDED.jumlah_berkas,
    keterangan = EXCLUDED.keterangan;

SELECT setval('jadwal_retensi_arsip_id_seq', (SELECT MAX(id) FROM jadwal_retensi_arsip));


-- 6. SEED: NASKAH DINAS AWAL
INSERT INTO naskah_dinas (
    id, nomor_surat, nomor_surat_asal, nomor_urut_seq, tanggal, perihal, kategori, sifat, 
    kategori_keamanan, kode_klasifikasi, sub_klasifikasi, asal_pengirim, tujuan_penerima, 
    status, status_timestamp, ringkasan, lampiran, tte_verified, unit_kerja_id, created_by_user_id
) VALUES
('SRT-2026-0142', '0142/UN58.6/KU/2026', '042/KEMDIKBUD/KU/2026', '0142', '2026-09-08', 'Permohonan Pembayaran Uang Persediaan (UP) Triwulan III', 'Surat Masuk', 'Penting', 'Biasa/Terbuka', 'KU', 'KU.01.00', 'KPPN Tasikmalaya', 'Kepala Biro Perencanaan, Keuangan, dan Umum', 'Dikirim', 'Baru saja diinput staf', 'Surat pengajuan pencairan UP Triwulan III tahun anggaran berjalan.', '1 (satu) Berkas PDF', TRUE, 'UN58.6', 'usr-02'),
('SRT-2026-0120', '0120/UN58.10/PP/2026', '110/FKIP-UNSIL/TU/2026', '0120', '2026-09-07', 'Usulan Yudisium dan Surat Keterangan Lulus Mahasiswa FKIP', 'Surat Keluar', 'Biasa', 'Biasa/Terbuka', 'PP', 'PP.02.00', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Kepala Biro Akademik dan Kemahasiswaan', 'Diparaf', 'Diparaf Dekan FKIP', 'Daftar calon wisudawan FKIP periode September 2026.', 'Daftar_Yudisium_FKIP.pdf', TRUE, 'UN58.10', 'usr-06'),
('SRT-2026-0042', '0042/UN58.13/KR/2026', '018/FT-UNSIL/SARPRAS/2026', '0042', '2026-09-06', 'Permohonan Pemeliharaan Gedung Laboratorium Teknik Sipil', 'Surat Keluar', 'Penting', 'Biasa/Terbuka', 'KR', 'KR.07.00', 'Fakultas Teknik', 'Kepala Biro Keuangan dan Umum', 'Dibaca', 'Ditinjau staf sarpras', 'Usulan perbaikan atap bocor dan instalasi listrik lab FT.', 'Proposal_Renovasi_FT.pdf', FALSE, 'UN58.13', 'usr-07')
ON CONFLICT (id) DO NOTHING;
