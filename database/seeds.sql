-- =============================================================================
-- DATA AWAL (SEEDS) DATABASE POSTGRESQL SILOKA UNSIL
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

-- Sesuaikan sequence serial id master_unit_kerja
SELECT setval('master_unit_kerja_id_seq', (SELECT MAX(id) FROM master_unit_kerja));


-- 2. SEED: MASTER KLASIFIKASI ARSIP
INSERT INTO master_klasifikasi_arsip (kode, nama_klasifikasi, keterangan, is_active) VALUES
('KU', 'Keuangan & Anggaran', 'SPJ, Kuitansi, DIPA, Penggajian, dan Audit Keuangan', TRUE),
('PL', 'Perlengkapan & BMN', 'Pengadaan, Aset Tanah, Inventaris Barang Milik Negara', TRUE),
('KR', 'Kerumahtanggaan & Sarpras', 'Pemeliharaan Gedung, Keamanan, dan As-Built Drawing', TRUE),
('PP', 'Pendidikan & Pengajaran', 'Kurikulum, Mahasiswa, Wisuda, dan Pembayaran UKT', TRUE),
('KP', 'Kepegawaian & SDM', 'Kenaikan Pangkat, SK Tugas, dan Formasi Pegawai', TRUE),
('HM', 'Humas & Protokoler', 'Kerja Sama Eksternal, Undangan, dan Protokol', TRUE)
ON CONFLICT (kode) DO NOTHING;


-- 3. SEED: MASTER USER LINTAS SATUAN KERJA (MULTI-TENANCY: 21 SATKER x 2 AKUN)
INSERT INTO master_user (id, nip_nik, nama_lengkap, email, password_hash, unit_kerja_id, role, role_level, role_label, avatar_url, is_signature_ready) VALUES
('usr-01', '196708161996031001', 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.', 'aripin.rektor@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'PEJABAT', 'Level 1: Pimpinan', 'Rektor Universitas Siliwangi', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-02', '199003152015041002', 'Rahmat Hidayat, S.AP.', 'tu.rektorat@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Tata Usaha & Protokoler Rektorat', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-03', '196605121992031003', 'Prof. Dr. Dedi Kusmayadi, S.E., M.Si., Ak., CA.', 'ketua.senat@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SENAT', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua Senat Universitas Siliwangi', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-04', '199208202018022001', 'Dewi Sartika, S.Sos.', 'sekretariat.senat@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SENAT', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Sekretariat Senat', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-05', '198007112005011002', 'Hendra Pratama, S.E., Ak., C.A.', 'hendra.spi@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SPI', 'PENGAWAS', 'Level 3: Pengawas', 'Ketua Satuan Pengawas Internal (SPI)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-06', '199304122019031004', 'Mochamad Iqbal, S.Ak.', 'operator.spi@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.SPI', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Administrasi & Audit SPI', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-07', '195907141987031002', 'Drs. H. Syarif Hidayat, M.Si.', 'ketua.dp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.DP', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua Dewan Penyantun', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-08', '199111052017042003', 'Lilis Suryani, S.AP.', 'sekretariat.dp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.DP', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Sekretariat Dewan Penyantun', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-09', '196510251991031002', 'Drs. H. Ade Rustandi, M.Si.', 'ade.bakpk@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.5', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala Biro BAKPK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-10', '198706182012042001', 'Neni Triana, S.Sos.', 'operator.bakpk@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.5', 'STAF_PERSURATAN', 'Level 2: Pelaksana (Staf)', 'Staf Persuratan & Tata Usaha BAKPK', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-11', '196808301989031004', 'Dr. Nana Sujana, Drs., M.Si.', 'nana.sujana@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.6', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala Biro Keuangan dan Umum', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-12', '198809152014042001', 'Siti Rohmah, S.AP.', 'siti.rohmah@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.6', 'STAF_PERSURATAN', 'Level 2: Pelaksana (Staf)', 'Staf Persuratan & Kearsipan BKU', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-13', '197204151998021001', 'Dr. H. Cucu Suherman, M.Pd.', 'cucu.suherman@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.10', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Keguruan dan Ilmu Pendidikan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-14', '199105202018032001', 'Dian Fitriani, S.Pd.', 'dian.fkip@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.10', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FKIP', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-15', '197103101997022001', 'Prof. Dr. H. Iis Rahmawati, S.E., M.Si.', 'dekan.feb@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.11', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Ekonomi dan Bisnis', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-16', '198904122015041002', 'Asep Saepuloh, S.E.', 'operator.feb@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.11', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FEB', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-17', '196409181990031003', 'Dr. Rudi Priyadi, Ir., M.P.', 'dekan.fp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.12', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Pertanian', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-18', '199007222016042001', 'Enok Widaningsih, S.P.', 'operator.fp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.12', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FP', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-19', '197306282000031001', 'Dr. Nurul Hiron, S.T., M.Eng.', 'dekan.ft@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.13', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Teknik', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-20', '198906102015041003', 'Arif Hidayat, S.T.', 'arif.ft@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.13', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha Fakultas Teknik', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-21', '196901151994031002', 'Dr. H. Akhmad Satori, Drs., M.Si.', 'dekan.fisip@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.14', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Ilmu Sosial dan Ilmu Politik', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-22', '199203112019032002', 'Yanti Maryanti, S.IP.', 'operator.fisip@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.14', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FISIP', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-23', '196811201993032001', 'Dr. Hj. Nina Herlina, Dra., M.Kes.', 'dekan.fik@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.15', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Ilmu Kesehatan', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-24', '199308142020011003', 'Fajar Nugraha, S.KM.', 'operator.fik@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.15', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FIK', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-25', '197005161998031004', 'Dr. H. Aam Abdussalam, M.Ag.', 'dekan.fai@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.16', 'PEJABAT', 'Level 1: Pimpinan', 'Dekan Fakultas Agama Islam', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-26', '198810242015042002', 'Imas Masitoh, S.Ag.', 'operator.fai@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.16', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha FAI', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-27', '196309081990021001', 'Prof. Dr. H. Deden Mulyana, S.E., M.Si.', 'direktur.pasca@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.17', 'PEJABAT', 'Level 1: Pimpinan', 'Direktur Program Pascasarjana', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-28', '198812052016041001', 'Gilar Gandana, S.Pd., M.Pd.', 'operator.pasca@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.17', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Tata Usaha Pascasarjana', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-29', '197405102002121001', 'Dr. Gumilar Mulya, M.Pd.', 'ketua.lppm@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.21', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua LPPM Universitas Siliwangi', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-30', '199009172018012001', 'Rina Marlina, S.Si.', 'operator.lppm@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.21', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Administrasi Penelitian LPPM', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-31', '196702141993031002', 'Dr. H. Supratman, Drs., M.Pd.', 'ketua.lpmpp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.22', 'PEJABAT', 'Level 1: Pimpinan', 'Ketua LPMPP Universitas Siliwangi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-32', '199106202019021002', 'Cecep Supriadi, S.Pd.', 'operator.lpmpp@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.22', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Administrasi Mutu LPMPP', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-33', '196604181992032001', 'Dra. Hj. Lilis Rohaeti, M.Si.', 'kepala.perpus@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.31', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala UPA Perpustakaan', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-34', '198608252014041003', 'Agus Salim, S.Sos.', 'operator.perpus@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.31', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Pengelola Perpustakaan', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-35', '198501282012121002', 'Alam Rahmatulloh, S.T., M.T.', 'kepala.tik@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.32', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala UPA TIK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-36', '199402152020011002', 'Gilang Ramadhan, S.Kom.', 'operator.tik@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.32', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Staf Admin Jaringan & Server TIK', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-37', '197904092005011003', 'Dr. Soni Tantan Tandiana, S.Pd., M.Pd.', 'kepala.bahasa@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.33', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala UPA Bahasa', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-38', '199206142018032002', 'Eka Nur Fitriani, S.Pd.', 'operator.bahasa@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.33', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Layanan Bahasa', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-39', '197607212003121001', 'Dr. Dian Kurniawan, S.E., M.Si.', 'kepala.pkkm@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.34', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala UPA PKKM', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-40', '199310192020021001', 'Rizki Fauzi, S.M.', 'operator.pkkm@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.34', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Layanan Karier & Alumni PKKM', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', FALSE),
('usr-41', '196503121991031003', 'Dr. Ir. H. Ade Ismail, M.P.', 'kepala.luk@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.35', 'PEJABAT', 'Level 1: Pimpinan', 'Kepala UPA Layanan Uji Kompetensi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', TRUE),
('usr-42', '198805212015041001', 'Wawan Setiawan, S.T.', 'operator.luk@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58.35', 'OPERATOR_UNIT', 'Level 2: Pelaksana (Staf)', 'Operator Sertifikasi & Uji Kompetensi LUK', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', FALSE)
ON CONFLICT (id) DO UPDATE 
SET nama_lengkap = EXCLUDED.nama_lengkap,
    unit_kerja_id = EXCLUDED.unit_kerja_id,
    role = EXCLUDED.role,
    role_label = EXCLUDED.role_label;


-- 4. SEED: JADWAL RETENSI ARSIP (JRA) RESMI
INSERT INTO jadwal_retensi_arsip (kode_seri, nama_seri, retensi_aktif_tahun, retensi_inaktif_tahun, status_akhir, is_safeguard_locked, jumlah_berkas, keterangan) VALUES
('KU.02.01', 'Kuitansi Belanja Operasional & Pajak', 2, 5, 'Musnah', FALSE, 1420, 'Dimusnahkan setelah diaudit BPK dan mendapat persetujuan ANRI'),
('PP.02.00', 'Bukti Pembayaran Kuliah UKT Mahasiswa', 2, 3, 'Musnah', FALSE, 3890, 'Dimusnahkan setelah mahasiswa lulus yudisium'),
('KU.02.01.h', 'Laporan Keuangan Tahunan (Audited)', 5, 10, 'Permanen', TRUE, 48, 'Wajib diserahkan ke Arsip Nasional Republik Indonesia (ANRI)'),
('KR.07.00', 'Gambar As-Built Drawing Gedung Kampus', 10, 15, 'Permanen', TRUE, 115, 'Arsip vital statis pemeliharaan aset fisik kampus'),
('PL.02.04', 'Sertifikat Kepemilikan Tanah & Aset BMN', 0, 0, 'Permanen', TRUE, 76, 'Tersimpan dalam Brankas Digital Terenkripsi AES-256')
ON CONFLICT (kode_seri) DO NOTHING;


-- 5. SEED: NASKAH DINAS AWAL
INSERT INTO naskah_dinas (
    id, nomor_surat, nomor_surat_asal, nomor_urut_seq, tanggal, perihal, kategori, sifat, 
    kategori_keamanan, kode_klasifikasi, sub_klasifikasi, asal_pengirim, tujuan_penerima, 
    status, status_timestamp, ringkasan, lampiran, tte_verified, unit_kerja_id, created_by_user_id
) VALUES
('SRT-2026-0142', '0142/UN58.6/KU/2026', '042/KEMDIKBUD/KU/2026', '0142', '2026-09-08', 'Permohonan Pembayaran Uang Persediaan (UP) Triwulan III', 'Surat Masuk', 'Penting', 'Biasa/Terbuka', 'KU', 'KU.01.00', 'KPPN Tasikmalaya', 'Kepala Biro Perencanaan, Keuangan, dan Umum', 'Dikirim', 'Baru saja diinput staf', 'Surat pengajuan pencairan UP Triwulan III tahun anggaran berjalan.', '1 (satu) Berkas PDF', TRUE, 'UN58.6', 'usr-02'),
('SRT-2026-0120', '0120/UN58.10/PP/2026', '110/FKIP-UNSIL/TU/2026', '0120', '2026-09-07', 'Usulan Yudisium dan Surat Keterangan Lulus Mahasiswa FKIP', 'Surat Keluar', 'Biasa', 'Biasa/Terbuka', 'PP', 'PP.02.00', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Kepala Biro Akademik dan Kemahasiswaan', 'Diparaf', 'Diparaf Dekan FKIP', 'Daftar calon wisudawan FKIP periode September 2026.', 'Daftar_Yudisium_FKIP.pdf', TRUE, 'UN58.10', 'usr-06'),
('SRT-2026-0042', '0042/UN58.13/KR/2026', '018/FT-UNSIL/SARPRAS/2026', '0042', '2026-09-06', 'Permohonan Pemeliharaan Gedung Laboratorium Teknik Sipil', 'Surat Keluar', 'Penting', 'Biasa/Terbuka', 'KR', 'KR.07.00', 'Fakultas Teknik', 'Kepala Biro Keuangan dan Umum', 'Dibaca', 'Ditinjau staf sarpras', 'Usulan perbaikan atap bocor dan instalasi listrik lab FT.', 'Proposal_Renovasi_FT.pdf', FALSE, 'UN58.13', 'usr-07')
ON CONFLICT (id) DO NOTHING;

