-- =============================================================================
-- MIGRATION 010: ADD GRANULAR SOTK STAFF ROLES PER UNIT KERJA (UNSIL)
-- Sesuai Struktur Organisasi & Tata Kerja (OTK) Universitas Siliwangi:
-- 1. Rektorat UNSIL - Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)
-- 2. Rektorat UNSIL - Biro Keuangan dan Umum (BKU) + Tim Bidang HKOK (Analis Hukum & Organisasi, Arsiparis / Pengendali Surat)
-- 3. Fakultas (Koordinasi Kepala Subbagian Umum Fakultas)
-- 4. LPPM (Koordinasi Kepala Subbagian Umum LPPM)
-- 5. LPMPP (Koordinasi Kepala Subbagian Umum LPMPP)
-- =============================================================================

BEGIN;

-- 1. Perluas panjang kolom nama_role & lepas constraint unique nama_role agar role lintas unit (misal LPPM & LPMPP) dapat memiliki penamaan resmi yang persis sama
ALTER TABLE tbl_roles ALTER COLUMN nama_role TYPE VARCHAR(255);
ALTER TABLE tbl_roles DROP CONSTRAINT IF EXISTS tbl_roles_nama_role_key;

-- 2. Pastikan role dasar 7 & 8 serta seluruh role staf per unit kerja terdaftar
INSERT INTO tbl_roles (id_role, nama_role, deskripsi, is_active) VALUES
  -- Role Universal
  (7, 'Dosen (Non-Jabatan)', 'Pelaksanaan Tridharma Perguruan Tinggi: Pendidikan, Penelitian, & Pengabdian kepada Masyarakat', TRUE),
  (8, 'Pejabat Struktural / Pimpinan Unit', 'Penetapan Kebijakan Naskah Dinas, Disposisi Elektronik, dan Penandatanganan Berkas Resmi Satker', TRUE),

  -- A. Rektorat UNSIL - Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)
  (101, 'Staf / Pelaksana Administrasi Tim Bidang Akademik', 'Pelaksanaan administrasi layanan akademik, kurikulum, registrasi mahasiswa, dan evaluasi perkuliahan pada BAKPK', TRUE),
  (102, 'Staf / Pelaksana Administrasi Tim Bidang Kemahasiswaan dan Alumni', 'Pelaksanaan administrasi kegiatan kemahasiswaan, organisasi mahasiswa, beasiswa, prestasi, dan alumni pada BAKPK', TRUE),
  (103, 'Staf / Pelaksana Administrasi Tim Bidang Perencanaan', 'Penyusunan rencana program, anggaran (RKAKL/DIPA), evaluasi kinerja, dan pelaporan data institusi pada BAKPK', TRUE),
  (104, 'Staf / Pelaksana Administrasi Tim Bidang Kerja Sama', 'Pengelolaan administrasi naskah kerja sama dalam dan luar negeri (MoU, PKS/MoA, IA) serta kemitraan pada BAKPK', TRUE),

  -- B. Rektorat UNSIL - Biro Keuangan dan Umum (BKU)
  (105, 'Staf / Pelaksana Administrasi Tim Bidang Keuangan', 'Pengelolaan perbendaharaan universitas, realisasi anggaran DIPA, verifikasi SPM/SP2D, dan akuntansi keuangan pada BKU', TRUE),
  (106, 'Staf / Pelaksana Administrasi Tim Bidang Kepegawaian', 'Administrasi SDM, mutasi jabatan, kenaikan pangkat, angka kredit (PAK) dosen, dan disiplin ASN pada BKU', TRUE),
  (107, 'Staf / Pelaksana Administrasi Tim Bidang Hukum, Ketatausahaan, Organisasi, dan Ketatalaksanaan (HKOK)', 'Koordinasi administrasi telaah hukum, tata naskah dinas, penataan organisasi, tata laksana, dan kearsipan pusat pada BKU', TRUE),
  (108, 'Analis Hukum & Organisasi', 'Penyusunan rancangan peraturan/keputusan pimpinan, telaah hukum, analisis kelembagaan (SOTK), dan evaluasi tata laksana pada Tim Bidang HKOK BKU', TRUE),
  (109, 'Arsiparis / Pengendali Surat', 'Pencatatan buku agenda ekspedisi surat masuk/keluar universitas, pengendalian tata naskah dinas, dan akuisisi retensi arsip pada Tim Bidang HKOK BKU', TRUE),
  (110, 'Staf / Pelaksana Administrasi Tim Bidang Kerumahtanggaan dan BMN', 'Pengelolaan sarana prasarana gedung, pemeliharaan fasilitas, inventarisasi aset BMN, dan layanan logistik operasional pada BKU', TRUE),
  (111, 'Staf / Pelaksana Administrasi Tim Bidang Keprotokolan dan Humas', 'Pelaksanaan tata keprotokolan pimpinan, penyelenggaraan upacara akademik/dinas, publikasi informasi publik, dan humas pada BKU', TRUE),

  -- C. Tingkat Fakultas (Koordinasi Kepala Subbagian Umum di Setiap Fakultas)
  (201, 'Staf Layanan Akademik, Kemahasiswaan, dan Alumni', 'Pelaksanaan administrasi layanan perkuliahan, ujian, tugas akhir, kemahasiswaan, dan alumni tingkat Fakultas', TRUE),
  (202, 'Staf Perencanaan dan Keuangan', 'Pengelolaan perencanaan program anggaran fakultas, verifikasi pertanggungjawaban belanja (SPJ), dan administrasi keuangan tingkat Fakultas', TRUE),
  (203, 'Staf Kepegawaian', 'Pengelolaan administrasi kepegawaian pendidik (dosen) dan tenaga kependidikan (tendik), presensi, cuti, serta usulan kenaikan pangkat tingkat Fakultas', TRUE),
  (204, 'Staf Ketatausahaan, Kerumahtanggaan, dan BMN', 'Pengelolaan persuratan/tata naskah dinas fakultas, kearsipan, pemeliharaan ruang perkuliahan, dan inventarisasi BMN Fakultas', TRUE),
  (205, 'Staf Kerja Sama dan Hubungan Masyarakat', 'Fasilitasi administrasi kerja sama tingkat fakultas/jurusan (IA/PKS), publikasi kegiatan akademik, dan layanan kehumasan Fakultas', TRUE),

  -- D. Tingkat LPPM (Koordinasi Kepala Subbagian Umum di LPPM)
  (301, 'Staf Layanan Teknis Penelitian dan Pengabdian', 'Administrasi teknis kontrak penelitian, pengabdian kepada masyarakat, publikasi ilmiah, HaKI/paten, dan pusat studi pada LPPM', TRUE),
  (302, 'Staf Perencanaan dan Keuangan LPPM', 'Penyusunan rencana anggaran riset/pengabdian, pencairan dana hibah penelitian, dan verifikasi pertanggungjawaban keuangan pada LPPM', TRUE),
  (303, 'Staf Kepegawaian, Ketatausahaan, dan BMN', 'Pengelolaan persuratan/agenda naskah dinas LPPM, administrasi SDM lembaga, kearsipan, serta inventarisasi aset BMN pada LPPM', TRUE),
  (304, 'Staf Kerja Sama dan Kehumasan LPPM', 'Pengelolaan administrasi kemitraan riset/pengabdian dengan instansi mitra, diseminasi hasil penelitian, dan kehumasan pada LPPM', TRUE),

  -- E. Tingkat LPMPP (Koordinasi Kepala Subbagian Umum di LPMPP)
  (401, 'Staf Layanan Teknis Penjaminan Mutu dan Pembelajaran', 'Administrasi teknis SPMI, Audit Mutu Internal (AMI), akreditasi program studi/institusi, pengembangan kurikulum OBE, dan program MBKM pada LPMPP', TRUE),
  (402, 'Staf Perencanaan dan Keuangan LPMPP', 'Penyusunan rencana program kerja penjaminan mutu, pengelolaan anggaran kegiatan akreditasi/pelatihan, dan verifikasi keuangan pada LPMPP', TRUE),
  (403, 'Staf Kepegawaian, Ketatausahaan, dan BMN', 'Pengelolaan persuratan/tata naskah dinas LPMPP, administrasi kepegawaian lembaga, kearsipan mutu, serta pengelolaan BMN pada LPMPP', TRUE),
  (404, 'Staf Kerja Sama LPMPP', 'Pengelolaan administrasi kerja sama penjaminan mutu, kemitraan pengembangan pembelajaran/MBKM, dan pendampingan akreditasi pada LPMPP', TRUE)
ON CONFLICT (id_role) DO UPDATE
SET nama_role = EXCLUDED.nama_role,
    deskripsi = EXCLUDED.deskripsi,
    is_active = TRUE;

-- 3. Seed Role Permissions untuk seluruh role baru
INSERT INTO tbl_role_permissions (id_role, permission_key) VALUES
  (7, 'surat:read'), (7, 'surat:create_draft'), (7, 'arsip:read'),
  (8, 'tte:sign'), (8, 'disposisi:approve'), (8, 'surat:create_policy'), (8, 'surat:read'), (8, 'surat:create_draft'), (8, 'arsip:read'),
  (101, 'surat:read'), (101, 'surat:create_draft'), (101, 'arsip:read'),
  (102, 'surat:read'), (102, 'surat:create_draft'), (102, 'arsip:read'),
  (103, 'surat:read'), (103, 'surat:create_draft'), (103, 'keuangan:view'), (103, 'arsip:read'),
  (104, 'surat:read'), (104, 'surat:create_draft'), (104, 'arsip:read'),
  (105, 'surat:read'), (105, 'surat:create_draft'), (105, 'keuangan:view'), (105, 'arsip:read'),
  (106, 'surat:read'), (106, 'surat:create_draft'), (106, 'kepegawaian:view'), (106, 'arsip:read'),
  (107, 'surat:read'), (107, 'surat:create_draft'), (107, 'surat:agenda_access'), (107, 'arsip:read'), (107, 'arsip:manage'),
  (108, 'surat:read'), (108, 'surat:create_draft'), (108, 'surat:create_policy'), (108, 'arsip:read'),
  (109, 'surat:read'), (109, 'surat:create_draft'), (109, 'surat:agenda_access'), (109, 'arsip:read'), (109, 'arsip:manage'),
  (110, 'surat:read'), (110, 'surat:create_draft'), (110, 'arsip:read'),
  (111, 'surat:read'), (111, 'surat:create_draft'), (111, 'arsip:read'),
  (201, 'surat:read'), (201, 'surat:create_draft'), (201, 'arsip:read'),
  (202, 'surat:read'), (202, 'surat:create_draft'), (202, 'keuangan:view'), (202, 'arsip:read'),
  (203, 'surat:read'), (203, 'surat:create_draft'), (203, 'kepegawaian:view'), (203, 'arsip:read'),
  (204, 'surat:read'), (204, 'surat:create_draft'), (204, 'surat:agenda_access'), (204, 'arsip:read'), (204, 'arsip:manage'),
  (205, 'surat:read'), (205, 'surat:create_draft'), (205, 'arsip:read'),
  (301, 'surat:read'), (301, 'surat:create_draft'), (301, 'arsip:read'),
  (302, 'surat:read'), (302, 'surat:create_draft'), (302, 'keuangan:view'), (302, 'arsip:read'),
  (303, 'surat:read'), (303, 'surat:create_draft'), (303, 'surat:agenda_access'), (303, 'kepegawaian:view'), (303, 'arsip:read'), (303, 'arsip:manage'),
  (304, 'surat:read'), (304, 'surat:create_draft'), (304, 'arsip:read'),
  (401, 'surat:read'), (401, 'surat:create_draft'), (401, 'arsip:read'),
  (402, 'surat:read'), (402, 'surat:create_draft'), (402, 'keuangan:view'), (402, 'arsip:read'),
  (403, 'surat:read'), (403, 'surat:create_draft'), (403, 'surat:agenda_access'), (403, 'kepegawaian:view'), (403, 'arsip:read'), (403, 'arsip:manage'),
  (404, 'surat:read'), (404, 'surat:create_draft'), (404, 'arsip:read')
ON CONFLICT (id_role, permission_key) DO NOTHING;

-- 4. Seed Default Klaster Prefix JRA per Role
INSERT INTO tbl_role_klasifikasi_access (id_role, prefix_jra, deskripsi) VALUES
  (7, 'PP', 'Pendidikan & Pengajaran'), (7, 'KM', 'Kemahasiswaan'),
  (8, 'PP', 'Pendidikan & Pengajaran'), (8, 'KU', 'Keuangan'), (8, 'KP', 'Kepegawaian'), (8, 'KR', 'Kerumahtanggaan'), (8, 'HM', 'Humas'),
  (101, 'PP', 'Pendidikan & Pengajaran'), (101, 'DL', 'Pendidikan & Pelatihan'),
  (102, 'KM', 'Kemahasiswaan'), (102, 'PP', 'Pendidikan & Pengajaran'),
  (103, 'PR', 'Perencanaan'), (103, 'KU', 'Keuangan & Anggaran'),
  (104, 'KS', 'Kerja Sama'), (104, 'HM', 'Humas & Protokol'),
  (105, 'KU', 'Keuangan & Perbendaharaan'), (105, 'PP.02.00', 'Keuangan Kemahasiswaan'),
  (106, 'KP', 'Kepegawaian & SDM'), (106, 'OT', 'Organisasi & Tata Laksana'),
  (107, 'HK', 'Hukum'), (107, 'OT', 'Organisasi & Tata Laksana'), (107, 'KA', 'Kearsipan & Ketatausahaan'),
  (108, 'HK', 'Hukum'), (108, 'OT', 'Organisasi & Tata Laksana'),
  (109, 'KA', 'Kearsipan'), (109, 'PP', 'Akademik'), (109, 'KU', 'Keuangan'), (109, 'KP', 'Kepegawaian'), (109, 'HM', 'Humas'),
  (110, 'KR', 'Kerumahtanggaan'), (110, 'PL', 'Perlengkapan & BMN'),
  (111, 'HM', 'Hubungan Masyarakat & Keprotokolan'), (111, 'TI', 'Informasi Publik'),
  (201, 'PP', 'Pendidikan & Pengajaran'), (201, 'KM', 'Kemahasiswaan & Alumni'),
  (202, 'PR', 'Perencanaan'), (202, 'KU', 'Keuangan'),
  (203, 'KP', 'Kepegawaian & SDM'),
  (204, 'KA', 'Ketatausahaan & Kearsipan'), (204, 'KR', 'Kerumahtanggaan'), (204, 'PL', 'Barang Milik Negara (BMN)'),
  (205, 'KS', 'Kerja Sama'), (205, 'HM', 'Hubungan Masyarakat'),
  (301, 'PN', 'Penelitian'), (301, 'PM', 'Pengabdian kepada Masyarakat'),
  (302, 'PR', 'Perencanaan LPPM'), (302, 'KU', 'Keuangan LPPM'),
  (303, 'KA', 'Ketatausahaan & Kearsipan'), (303, 'KP', 'Kepegawaian'), (303, 'PL', 'BMN & Perlengkapan'),
  (304, 'KS', 'Kerja Sama Riset'), (304, 'HM', 'Kehumasan LPPM'),
  (401, 'JM', 'Penjaminan Mutu'), (401, 'PP', 'Pengembangan Pembelajaran & MBKM'),
  (402, 'PR', 'Perencanaan LPMPP'), (402, 'KU', 'Keuangan LPMPP'),
  (403, 'KA', 'Ketatausahaan & Kearsipan'), (403, 'KP', 'Kepegawaian'), (403, 'PL', 'BMN & Perlengkapan'),
  (404, 'KS', 'Kerja Sama LPMPP'), (404, 'HM', 'Layanan Informasi Mutu')
ON CONFLICT (id_role, prefix_jra) DO NOTHING;

COMMIT;

