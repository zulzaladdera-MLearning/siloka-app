/**
 * Layanan Manajemen Alur Disposisi (Routing Matrix Service) SILOKA UNSIL
 * Mengatur hak delegasi naskah dinas: unit kerja -> jabatan pejabat -> target penerima disposisi.
 * Terintegrasi secara real-time dengan Manajemen Pengguna, Manajemen Unit Kerja, dan Modal Disposisi.
 */

import { findPositionOccupant } from '../utils/unitJabatanOptions';
import { isOfficialUserAccount } from '../utils/pejabatHelper';
import { matchesOfficialDisposisiPosition } from '../utils/disposisiStandards';

export const STORAGE_KEY_DISPOSISI_ROUTING = 'siloka_disposisi_routing_matrix';
export const DISPOSISI_ROUTING_CHANGE_EVENT = 'SILOKA_DISPOSISI_ROUTING_CHANGED';

/**
 * Katalog Pimpinan Pengirim Arahan Bawaan (Fallback)
 */
export const DISPOSISI_SENDER_CATALOG = [
  {
    key: 'REKTOR',
    label: 'Rektor Universitas Siliwangi',
    badge: 'Rektor',
    roleLabel: 'Pimpinan Tertinggi Universitas',
    description: 'Dapat mendisposisikan naskah dinas ke Wakil Rektor, Dekan, Kepala Biro, Lembaga, dan UPA.'
  },
  {
    key: 'WAREK_1',
    label: 'Wakil Rektor I (Bidang Akademik)',
    badge: 'WR I',
    roleLabel: 'Pimpinan Universitas',
    description: 'Mendisposisikan ke Dekan Fakultas, BAKPK, LPMPP, dan seluruh UPA penunjang akademik.'
  },
  {
    key: 'WAREK_2',
    label: 'Wakil Rektor II (Bidang Keuangan & Umum)',
    badge: 'WR II',
    roleLabel: 'Pimpinan Universitas',
    description: 'Mendisposisikan ke BKU, Keuangan, Kepegawaian, BMN, Hukum, Humas, Dekan, dan seluruh UPA.'
  },
  {
    key: 'WAREK_3',
    label: 'Wakil Rektor III (Bidang Kemahasiswaan & Alumni)',
    badge: 'WR III',
    roleLabel: 'Pimpinan Universitas',
    description: 'Mendisposisikan ke Ormawa/Kemahasiswaan BAKPK, Dekan Fakultas, dan seluruh UPA.'
  },
  {
    key: 'DEKAN',
    label: 'Para Dekan Fakultas & Direktur Pascasarjana',
    badge: 'Dekan',
    roleLabel: 'Pimpinan Fakultas',
    description: 'Mendisposisikan ke para Wakil Dekan, Ketua Jurusan/Kaprodi, Kabag TU, dan Laboratorium.'
  },
  {
    key: 'KA_BIRO_BKU',
    label: 'Kepala Biro Keuangan dan Umum (BKU)',
    badge: 'BKU',
    roleLabel: 'Kepala Biro',
    description: 'Mendisposisikan ke Kabag Umum, Tim Keuangan, Kepegawaian, BMN, Hukum, dan Humas.'
  },
  {
    key: 'KA_BIRO_BAKPK',
    label: 'Kepala Biro BAKPK',
    badge: 'BAKPK',
    roleLabel: 'Kepala Biro',
    description: 'Mendisposisikan ke Kabag Akademik, Tim Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama.'
  },
  {
    key: 'LEMBAGA_UPA',
    label: 'Pimpinan Lembaga & Kepala UPA',
    badge: 'Lembaga / UPA',
    roleLabel: 'Pimpinan Lembaga & Unit',
    description: 'Mendisposisikan ke Sekretaris Unit, Kepala Pusat, Subbagian TU, dan Staf Pelaksana.'
  },
  {
    key: 'KAJUR_KAPRODI',
    label: 'Ketua Jurusan & Koordinator Program Studi',
    badge: 'Jurusan / Prodi',
    roleLabel: 'Pimpinan Program Studi',
    description: 'Mendisposisikan ke Sekretaris Jurusan, Kepala Lab, Koordinator Skripsi/MBKM, dan Dosen Homebase.'
  }
];

/**
 * Daftar Target Standar Bawaan SOTK UNSIL per Profil Pengirim
 */
export const DEFAULT_ROUTING_TARGETS = {
  REKTOR: [
    { id: 'tgt-wr1', nama: 'Wakil Rektor Bidang Akademik', cluster: 'Pimpinan Universitas & Pengawas', badge: 'WR I', unit_id: 'UN58', enabled: true },
    { id: 'tgt-wr2', nama: 'Wakil Rektor Bidang Keuangan dan Umum', cluster: 'Pimpinan Universitas & Pengawas', badge: 'WR II', unit_id: 'UN58', enabled: true },
    { id: 'tgt-wr3', nama: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', cluster: 'Pimpinan Universitas & Pengawas', badge: 'WR III', unit_id: 'UN58', enabled: true },
    { id: 'tgt-senat', nama: 'Ketua Senat Universitas', cluster: 'Pimpinan Universitas & Pengawas', badge: 'Senat', unit_id: 'UN58.SENAT', enabled: true },
    { id: 'tgt-spi', nama: 'Ketua Satuan Pengawas Internal (SPI)', cluster: 'Pimpinan Universitas & Pengawas', badge: 'SPI', unit_id: 'UN58.SPI', enabled: true },
    { id: 'tgt-bakpk', nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)', cluster: 'Pelaksana Administrasi & Biro', badge: 'BAKPK', unit_id: 'UN58.5', enabled: true },
    { id: 'tgt-bku', nama: 'Kepala Biro Keuangan dan Umum (BKU)', cluster: 'Pelaksana Administrasi & Biro', badge: 'BKU', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-lppm', nama: 'Ketua Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)', cluster: 'Pimpinan Lembaga', badge: 'LPPM', unit_id: 'UN58.21', enabled: true },
    { id: 'tgt-lpmpp', nama: 'Ketua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)', cluster: 'Pimpinan Lembaga', badge: 'LPMPP', unit_id: 'UN58.22', enabled: true },
    { id: 'tgt-fkip', nama: 'Dekan FKIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FKIP', unit_id: 'UN58.10', enabled: true },
    { id: 'tgt-feb', nama: 'Dekan FEB', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FEB', unit_id: 'UN58.11', enabled: true },
    { id: 'tgt-fp', nama: 'Dekan FP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FP', unit_id: 'UN58.12', enabled: true },
    { id: 'tgt-ft', nama: 'Dekan FT', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FT', unit_id: 'UN58.13', enabled: true },
    { id: 'tgt-fai', nama: 'Dekan FAI', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FAI', unit_id: 'UN58.16', enabled: true },
    { id: 'tgt-fik', nama: 'Dekan FIK', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FIK', unit_id: 'UN58.15', enabled: true },
    { id: 'tgt-fisip', nama: 'Dekan FISIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FISIP', unit_id: 'UN58.14', enabled: true },
    { id: 'tgt-pasca', nama: 'Direktur Pascasarjana', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'Pasca', unit_id: 'UN58.17', enabled: true },
    { id: 'tgt-perpus', nama: 'Kepala UPA Perpustakaan', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.31', enabled: true },
    { id: 'tgt-tik', nama: 'Kepala UPA Teknologi Informasi dan Komunikasi (TIK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.32', enabled: true },
    { id: 'tgt-bahasa', nama: 'Kepala UPA Bahasa', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.33', enabled: true },
    { id: 'tgt-pkkm', nama: 'Kepala UPA Pengembangan Karier dan Kewirausahaan Mahasiswa (PKKM)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.34', enabled: true },
    { id: 'tgt-luk', nama: 'Kepala UPA Layanan Uji Kompetensi (LUK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.35', enabled: true },
    { id: 'tgt-humas', nama: 'Ketua Tim Keprotokolan dan Humas', cluster: 'Penugasan Khusus (Tim Kerja)', badge: 'Tim Humas', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-hukum', nama: 'Ketua Tim Hukum, Organisasi, dan Ketatalaksanaan', cluster: 'Penugasan Khusus (Tim Kerja)', badge: 'Tim HKOK', unit_id: 'UN58.6', enabled: true }
  ],
  WAREK_1: [
    { id: 'tgt-bakpk', nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)', cluster: 'Pelaksana Administrasi Akademik', badge: 'BAKPK', unit_id: 'UN58.5', enabled: true },
    { id: 'tgt-fkip', nama: 'Dekan FKIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FKIP', unit_id: 'UN58.10', enabled: true },
    { id: 'tgt-feb', nama: 'Dekan FEB', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FEB', unit_id: 'UN58.11', enabled: true },
    { id: 'tgt-fp', nama: 'Dekan FP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FP', unit_id: 'UN58.12', enabled: true },
    { id: 'tgt-ft', nama: 'Dekan FT', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FT', unit_id: 'UN58.13', enabled: true },
    { id: 'tgt-fai', nama: 'Dekan FAI', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FAI', unit_id: 'UN58.16', enabled: true },
    { id: 'tgt-fik', nama: 'Dekan FIK', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FIK', unit_id: 'UN58.15', enabled: true },
    { id: 'tgt-fisip', nama: 'Dekan FISIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FISIP', unit_id: 'UN58.14', enabled: true },
    { id: 'tgt-pasca', nama: 'Direktur Pascasarjana', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'Pasca', unit_id: 'UN58.17', enabled: true },
    { id: 'tgt-perpus', nama: 'Kepala UPA Perpustakaan', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.31', enabled: true },
    { id: 'tgt-tik', nama: 'Kepala UPA Teknologi Informasi dan Komunikasi (TIK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.32', enabled: true },
    { id: 'tgt-bahasa', nama: 'Kepala UPA Bahasa', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.33', enabled: true },
    { id: 'tgt-pkkm', nama: 'Kepala UPA Pengembangan Karier dan Kewirausahaan Mahasiswa (PKKM)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.34', enabled: true },
    { id: 'tgt-luk', nama: 'Kepala UPA Layanan Uji Kompetensi (LUK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.35', enabled: true },
    { id: 'tgt-lpmpp', nama: 'Ketua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)', cluster: 'Penjaminan Mutu & Kurikulum', badge: 'LPMPP', unit_id: 'UN58.22', enabled: true },
    { id: 'kbg_akademik', nama: 'Kepala Bagian Akademik', cluster: 'Pelaksana Administrasi Akademik', badge: 'Bagian', unit_id: 'UN58.5', enabled: true },
    { id: 'tim_akademik', nama: 'Ketua Tim Bidang Akademik', cluster: 'Pelaksana Administrasi Akademik', badge: 'Tim Kerja', unit_id: 'UN58.5', enabled: true },
    { id: 'tgt-perencanaan', nama: 'Ketua Tim Bidang Perencanaan', cluster: 'Pelaksana Administrasi Akademik', badge: 'Tim Kerja', unit_id: 'UN58.5', enabled: true },
    { id: 'tgt-kerjasama', nama: 'Ketua Tim Bidang Kerja Sama', cluster: 'Pelaksana Administrasi Akademik', badge: 'Tim Kerja', unit_id: 'UN58.5', enabled: true }
  ],
  WAREK_2: [
    { id: 'tgt-bku', nama: 'Kepala Biro Keuangan dan Umum (BKU)', cluster: 'Pelaksana Administrasi Keuangan & Umum', badge: 'BKU', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-fkip', nama: 'Dekan FKIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FKIP', unit_id: 'UN58.10', enabled: true },
    { id: 'tgt-feb', nama: 'Dekan FEB', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FEB', unit_id: 'UN58.11', enabled: true },
    { id: 'tgt-fp', nama: 'Dekan FP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FP', unit_id: 'UN58.12', enabled: true },
    { id: 'tgt-ft', nama: 'Dekan FT', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FT', unit_id: 'UN58.13', enabled: true },
    { id: 'tgt-fai', nama: 'Dekan FAI', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FAI', unit_id: 'UN58.16', enabled: true },
    { id: 'tgt-fik', nama: 'Dekan FIK', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FIK', unit_id: 'UN58.15', enabled: true },
    { id: 'tgt-fisip', nama: 'Dekan FISIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FISIP', unit_id: 'UN58.14', enabled: true },
    { id: 'tgt-pasca', nama: 'Direktur Pascasarjana', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'Pasca', unit_id: 'UN58.17', enabled: true },
    { id: 'tgt-perpus', nama: 'Kepala UPA Perpustakaan', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.31', enabled: true },
    { id: 'tgt-tik', nama: 'Kepala UPA Teknologi Informasi dan Komunikasi (TIK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.32', enabled: true },
    { id: 'tgt-bahasa', nama: 'Kepala UPA Bahasa', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.33', enabled: true },
    { id: 'tgt-pkkm', nama: 'Kepala UPA Pengembangan Karier dan Kewirausahaan Mahasiswa (PKKM)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.34', enabled: true },
    { id: 'tgt-luk', nama: 'Kepala UPA Layanan Uji Kompetensi (LUK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.35', enabled: true },
    { id: 'kbg_umum', nama: 'Kepala Bagian Umum', cluster: 'Pelaksana Administrasi Keuangan & Umum', badge: 'Bagian', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-keuangan', nama: 'Ketua Tim Keuangan', cluster: 'Tim Kerja BKU', badge: 'Tim Keuangan', unit_id: 'UN58.6', enabled: true },
    { id: 'tim_kepegawaian', nama: 'Ketua Tim Bidang Kepegawaian', cluster: 'Tim Kerja BKU', badge: 'Tim Kepegawaian', unit_id: 'UN58.6', enabled: true },
    { id: 'tim_kerumahtanggan_bmn', nama: 'Ketua Tim Kerumahtanggan dan BMN', cluster: 'Tim Kerja BKU', badge: 'Tim BMN', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-hukum', nama: 'Ketua Tim Hukum, Organisasi, dan Ketatalaksanaan', cluster: 'Tim Kerja BKU', badge: 'Tim HKOK', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-humas', nama: 'Ketua Tim Keprotokolan dan Humas', cluster: 'Tim Kerja BKU', badge: 'Tim Humas', unit_id: 'UN58.6', enabled: true }
  ],
  WAREK_3: [
    { id: 'tgt-bakpk', nama: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)', cluster: 'Pelaksana Administrasi Kemahasiswaan', badge: 'BAKPK', unit_id: 'UN58.5', enabled: true },
    { id: 'tgt-fkip', nama: 'Dekan FKIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FKIP', unit_id: 'UN58.10', enabled: true },
    { id: 'tgt-feb', nama: 'Dekan FEB', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FEB', unit_id: 'UN58.11', enabled: true },
    { id: 'tgt-fp', nama: 'Dekan FP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FP', unit_id: 'UN58.12', enabled: true },
    { id: 'tgt-ft', nama: 'Dekan FT', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FT', unit_id: 'UN58.13', enabled: true },
    { id: 'tgt-fai', nama: 'Dekan FAI', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FAI', unit_id: 'UN58.16', enabled: true },
    { id: 'tgt-fik', nama: 'Dekan FIK', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FIK', unit_id: 'UN58.15', enabled: true },
    { id: 'tgt-fisip', nama: 'Dekan FISIP', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'FISIP', unit_id: 'UN58.14', enabled: true },
    { id: 'tgt-pasca', nama: 'Direktur Pascasarjana', cluster: 'Pimpinan Fakultas & Pascasarjana', badge: 'Pasca', unit_id: 'UN58.17', enabled: true },
    { id: 'tgt-perpus', nama: 'Kepala UPA Perpustakaan', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.31', enabled: true },
    { id: 'tgt-tik', nama: 'Kepala UPA Teknologi Informasi dan Komunikasi (TIK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.32', enabled: true },
    { id: 'tgt-bahasa', nama: 'Kepala UPA Bahasa', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.33', enabled: true },
    { id: 'tgt-pkkm', nama: 'Kepala UPA Pengembangan Karier dan Kewirausahaan Mahasiswa (PKKM)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.34', enabled: true },
    { id: 'tgt-luk', nama: 'Kepala UPA Layanan Uji Kompetensi (LUK)', cluster: 'Pimpinan Unit Penunjang Akademik (UPA)', badge: 'UPA', unit_id: 'UN58.35', enabled: true },
    { id: 'tim_kemahasiswaan', nama: 'Ketua Tim Bidang Kemahasiswaan dan Alumni', cluster: 'Tim Kerja Kemahasiswaan', badge: 'Kemahasiswaan', unit_id: 'UN58.5', enabled: true }
  ],
  DEKAN: [
    { id: 'wadek-1', nama: 'Wakil Dekan Bidang Akademik', cluster: 'Pimpinan Fakultas', badge: 'Pimpinan', enabled: true },
    { id: 'wadek-2', nama: 'Wakil Dekan Bidang Keuangan dan Umum', cluster: 'Pimpinan Fakultas', badge: 'Pimpinan', enabled: true },
    { id: 'wadek-3', nama: 'Wakil Dekan Bidang Kemahasiswaan & Alumni', cluster: 'Pimpinan Fakultas', badge: 'Pimpinan', enabled: true },
    { id: 'kajur-prodi', nama: 'Para Ketua Jurusan / Koordinator Program Studi', cluster: 'Pelaksana Akademik', badge: 'Jurusan', enabled: true },
    { id: 'ktu-fak', nama: 'Kepala Bagian Tata Usaha Fakultas', cluster: 'Pelaksana Administrasi', badge: 'Tata Usaha', enabled: true },
    { id: 'gpm-fak', nama: 'Ketua Tim Gugus Penjaminan Mutu (GPM)', cluster: 'Penjaminan Mutu', badge: 'GPM', enabled: true },
    { id: 'lab-fak', nama: 'Kepala Laboratorium Terpadu Fakultas', cluster: 'Pelaksana Teknis', badge: 'Lab', enabled: true },
    { id: 'dosen-fak', nama: 'Tim Dosen & Tenaga Kependidikan', cluster: 'Pelaksana Teknis & Tridharma', badge: 'Pelaksana', enabled: true }
  ],
  KA_BIRO_BKU: [
    { id: 'kbg_umum', nama: 'Kepala Bagian Umum', cluster: 'Pelaksana Administrasi BKU', badge: 'Bagian', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-keuangan', nama: 'Ketua Tim Keuangan', cluster: 'Tim Kerja BKU', badge: 'Tim Keuangan', unit_id: 'UN58.6', enabled: true },
    { id: 'tim_kepegawaian', nama: 'Ketua Tim Bidang Kepegawaian', cluster: 'Tim Kerja BKU', badge: 'Tim Kepegawaian', unit_id: 'UN58.6', enabled: true },
    { id: 'tim_kerumahtanggan_bmn', nama: 'Ketua Tim Kerumahtanggan dan BMN', cluster: 'Tim Kerja BKU', badge: 'Tim BMN', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-hukum', nama: 'Ketua Tim Hukum, Organisasi, dan Ketatalaksanaan', cluster: 'Tim Kerja BKU', badge: 'Tim HKOK', unit_id: 'UN58.6', enabled: true },
    { id: 'tgt-humas', nama: 'Ketua Tim Keprotokolan dan Humas', cluster: 'Tim Kerja BKU', badge: 'Tim Humas', unit_id: 'UN58.6', enabled: true }
  ],
  KA_BIRO_BAKPK: [
    { id: 'kbg_akademik', nama: 'Kepala Bagian Akademik', cluster: 'Pelaksana Administrasi BAKPK', badge: 'Bagian', unit_id: 'UN58.5', enabled: true },
    { id: 'tim_akademik', nama: 'Ketua Tim Bidang Akademik', cluster: 'Pelaksana Administrasi BAKPK', badge: 'Tim', unit_id: 'UN58.5', enabled: true },
    { id: 'tim_kemahasiswaan', nama: 'Ketua Tim Bidang Kemahasiswaan & Alumni', cluster: 'Pelaksana Administrasi BAKPK', badge: 'Tim', unit_id: 'UN58.5', enabled: true },
    { id: 'tim_perencanaan', nama: 'Ketua Tim Bidang Perencanaan', cluster: 'Pelaksana Administrasi BAKPK', badge: 'Tim', unit_id: 'UN58.5', enabled: true },
    { id: 'tim_kerjasama', nama: 'Ketua Tim Bidang Kerjasama', cluster: 'Pelaksana Administrasi BAKPK', badge: 'Tim', unit_id: 'UN58.5', enabled: true }
  ],
  LEMBAGA_UPA: [
    { id: 'sek_lembaga', nama: 'Sekretaris Lembaga / Koordinator Unit', cluster: 'Pimpinan & Pelaksana Unit', badge: 'Sekretaris', enabled: true },
    { id: 'kapus_1', nama: 'Kepala Pusat / Koordinator Bidang I', cluster: 'Pusat Layanan', badge: 'Pusat', enabled: true },
    { id: 'kapus_2', nama: 'Kepala Pusat / Koordinator Bidang II', cluster: 'Pusat Layanan', badge: 'Pusat', enabled: true },
    { id: 'kasubbag_tu', nama: 'Kepala Subbagian / Tata Usaha Unit', cluster: 'Ketatausahaan', badge: 'Tata Usaha', enabled: true },
    { id: 'staf_pelaksana', nama: 'Staf Pelaksana Teknis & Fungsional', cluster: 'Pelaksana', badge: 'Pelaksana', enabled: true }
  ],
  KAJUR_KAPRODI: [
    { id: 'sekjur', nama: 'Sekretaris Jurusan / Program Studi', cluster: 'Pimpinan Jurusan', badge: 'Jurusan', enabled: true },
    { id: 'kalab', nama: 'Kepala / Koordinator Laboratorium Prodi', cluster: 'Laboratorium', badge: 'Lab', enabled: true },
    { id: 'koor-ta', nama: 'Koordinator Skripsi / Tugas Akhir', cluster: 'Akademik', badge: 'Akademik', enabled: true },
    { id: 'koor-mbkm', nama: 'Koordinator Kerja Praktik & MBKM', cluster: 'Akademik', badge: 'Akademik', enabled: true },
    { id: 'dosen-homebase', nama: 'Dosen Homebase Program Studi', cluster: 'Dosen', badge: 'Dosen', enabled: true },
    { id: 'staf-adm-jurusan', nama: 'Staf Administrasi Akademik Jurusan', cluster: 'Staf Administrasi', badge: 'Staf', enabled: true }
  ]
};

/**
 * Mengidentifikasi kunci profil pengirim umum dari data akun pengguna aktif
 */
export function resolveSenderKey(user) {
  if (!user) return null;
  const jabatan = String(user.jabatan || user.roleLabel || user.sotk_position_label || '').toLowerCase();
  const unitId = String(user.unit_kerja_id || user.kode_unit || '');
  const unitName = String(user.unit || '').toLowerCase();
  const role = String(user.role || '').toUpperCase();
  const subRoleKey = String(user.subRoleKey || '').toUpperCase();

  const isWarek =
    jabatan.includes('wakil rektor') ||
    jabatan.includes('warek') ||
    role === 'WAREK' ||
    subRoleKey.startsWith('WAREK');

  if (!isWarek && (jabatan.includes('rektor') || role === 'REKTOR')) {
    return 'REKTOR';
  }

  if (isWarek) {
    if (jabatan.includes('akademik') || jabatan.includes('wr1') || jabatan.includes('warek1') || subRoleKey === 'WAREK_1') {
      return 'WAREK_1';
    }
    if (jabatan.includes('keuangan') || jabatan.includes('umum') || jabatan.includes('wr2') || jabatan.includes('warek2') || subRoleKey === 'WAREK_2') {
      return 'WAREK_2';
    }
    if (jabatan.includes('kemahasiswaan') || jabatan.includes('alumni') || jabatan.includes('wr3') || jabatan.includes('warek3') || subRoleKey === 'WAREK_3') {
      return 'WAREK_3';
    }
    return 'WAREK_1';
  }

  if (
    jabatan.includes('dekan') ||
    jabatan.includes('direktur') ||
    unitName.includes('fakultas') ||
    unitName.includes('pascasarjana')
  ) {
    return 'DEKAN';
  }

  if (unitId === 'UN58.6' || unitName.includes('keuangan dan umum')) {
    return 'KA_BIRO_BKU';
  }

  if (unitId === 'UN58.5' || unitName.includes('bakpk')) {
    return 'KA_BIRO_BAKPK';
  }

  if (
    jabatan.includes('jurusan') ||
    jabatan.includes('prodi') ||
    jabatan.includes('kajur') ||
    jabatan.includes('kaprodi')
  ) {
    return 'KAJUR_KAPRODI';
  }

  if (
    unitName.includes('lppm') ||
    unitName.includes('lpmpp') ||
    unitName.includes('upa') ||
    unitId.startsWith('UN58.3')
  ) {
    return 'LEMBAGA_UPA';
  }

  return 'DEKAN';
}

/**
 * Mengidentifikasi kunci spesifik formasi jabatan di unit tertentu secara kanonikal
 * Contoh: UN58.10__pimpinan, UN58__rektor, UN58.6__kabag_umum, KA_BIRO_BKU
 */
export function resolveOfficialSenderKey(unitCode = '', positionName = '') {
  const cleanUnit = String(unitCode || '').toUpperCase().trim();
  const cleanPos = String(positionName || '').toLowerCase().trim();

  // Pimpinan Universitas
  if (cleanPos.includes('rektor') && !cleanPos.includes('wakil')) return 'REKTOR';
  if (cleanPos.includes('wakil rektor') || cleanPos.includes('warek')) {
    if (cleanPos.includes('akademik') || cleanPos.includes('1') || cleanPos.includes('wr1')) return 'WAREK_1';
    if (cleanPos.includes('keuangan') || cleanPos.includes('umum') || cleanPos.includes('2') || cleanPos.includes('wr2')) return 'WAREK_2';
    if (cleanPos.includes('kemahasiswaan') || cleanPos.includes('alumni') || cleanPos.includes('3') || cleanPos.includes('wr3')) return 'WAREK_3';
    return 'WAREK_1';
  }

  // Senat Universitas
  if (cleanUnit === 'UN58.SENAT') {
    if (cleanPos.includes('ketua')) return 'UN58.SENAT__ketua';
    if (cleanPos.includes('sekretaris')) return 'UN58.SENAT__sekretaris';
  }

  // Satuan Pengawas Internal (SPI)
  if (cleanUnit === 'UN58.SPI') {
    if (cleanPos.includes('ketua')) return 'UN58.SPI__ketua';
    if (cleanPos.includes('sekretaris')) return 'UN58.SPI__sekretaris';
  }

  // Biro BKU
  if (cleanUnit === 'UN58.6' || cleanPos.includes('biro keuangan')) {
    if (cleanPos.includes('kepala') || cleanPos.includes('biro') || cleanPos.includes('kabiro')) return 'KA_BIRO_BKU';
    if (cleanPos.includes('bagian') || cleanPos.includes('kabag')) return 'UN58.6__kabag_umum';
  }

  // Biro BAKPK
  if (cleanUnit === 'UN58.5' || cleanPos.includes('bakpk')) {
    if (cleanPos.includes('kepala') || cleanPos.includes('biro') || cleanPos.includes('kabiro')) return 'KA_BIRO_BAKPK';
    if (cleanPos.includes('bagian') || cleanPos.includes('kabag')) return 'UN58.5__kabag_akademik';
  }

  // Fakultas / Pascasarjana
  if (cleanUnit.startsWith('UN58.1') || cleanPos.includes('fakultas') || cleanPos.includes('pascasarjana')) {
    if ((cleanPos.includes('dekan') || cleanPos.includes('direktur')) && !cleanPos.includes('wakil')) {
      return cleanUnit ? `${cleanUnit}__pimpinan` : 'DEKAN';
    }
    if (cleanPos.includes('wakil dekan') || cleanPos.includes('wadek') || cleanPos.includes('wakil direktur') || cleanPos.includes('wadir')) {
      if (cleanPos.includes('akademik') || cleanPos.includes('1')) return cleanUnit ? `${cleanUnit}__wadek1` : 'DEKAN';
      if (cleanPos.includes('keuangan') || cleanPos.includes('umum') || cleanPos.includes('2')) return cleanUnit ? `${cleanUnit}__wadek2` : 'DEKAN';
      if (cleanPos.includes('kemahasiswaan') || cleanPos.includes('alumni') || cleanPos.includes('3')) return cleanUnit ? `${cleanUnit}__wadek3` : 'DEKAN';
    }
    if (cleanPos.includes('tata usaha') || cleanPos.includes('ktu') || cleanPos.includes('kabag')) {
      return cleanUnit ? `${cleanUnit}__ktu` : 'DEKAN';
    }
    if (cleanPos.includes('jurusan') || cleanPos.includes('prodi') || cleanPos.includes('kajur') || cleanPos.includes('kaprodi')) {
      const posSlug = cleanPos.replace(/[^a-z0-9]/g, '_').substring(0, 24);
      return cleanUnit ? `${cleanUnit}__kajur_${posSlug}` : 'KAJUR_KAPRODI';
    }
  }

  // Unit Penunjang Akademik (UPA)
  if (cleanUnit.startsWith('UN58.3') || cleanPos.includes('upa') || cleanPos.includes('upt')) {
    if (cleanPos.includes('kepala') || cleanPos.includes('ketua')) return cleanUnit ? `${cleanUnit}__kepala` : 'LEMBAGA_UPA';
    if (cleanPos.includes('tata usaha') || cleanPos.includes('kasubbag') || cleanPos.includes('subbag')) return cleanUnit ? `${cleanUnit}__kasubbag` : 'LEMBAGA_UPA';
  }

  // Lembaga (LPPM, LPMPP)
  if (cleanUnit.startsWith('UN58.2') || cleanPos.includes('lembaga')) {
    if (cleanPos.includes('ketua') || cleanPos.includes('kepala')) return cleanUnit ? `${cleanUnit}__ketua` : 'LEMBAGA_UPA';
    if (cleanPos.includes('sekretaris')) return cleanUnit ? `${cleanUnit}__sekretaris` : 'LEMBAGA_UPA';
  }

  // Unit-specific key jika ada kode unit
  const posSlug = cleanPos.replace(/[^a-z0-9]/g, '_').substring(0, 24);
  if (cleanUnit) {
    return `${cleanUnit}__${posSlug}`;
  }

  return posSlug || 'GENERAL';
}

/**
 * Mengambil matriks konfigurasi alur disposisi aktif dari penyimpanan lokal
 */
export function getRoutingMatrix() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_DISPOSISI_ROUTING);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_ROUTING_TARGETS));
}

/**
 * Menyimpan pembaruan matriks alur disposisi dan memancarkan sinyal reaktif
 */
export function saveRoutingMatrix(newMatrix) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DISPOSISI_ROUTING, JSON.stringify(newMatrix));
    }
  } catch (_) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DISPOSISI_ROUTING_CHANGE_EVENT, {
        detail: { matrix: newMatrix }
      })
    );
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Mengembalikan konfigurasi ke standar awal SOTK universitas
 */
export function resetRoutingMatrix() {
  const defaultMatrix = JSON.parse(JSON.stringify(DEFAULT_ROUTING_TARGETS));
  saveRoutingMatrix(defaultMatrix);
  return defaultMatrix;
}

/**
 * Mengambil daftar target untuk pengirim tertentu (Mendukung fallback key)
 */
export function getTargetsForSender(senderKey, fallbackKey = null) {
  const matrix = getRoutingMatrix();
  if (Array.isArray(matrix[senderKey])) {
    return matrix[senderKey];
  }
  if (fallbackKey && Array.isArray(matrix[fallbackKey])) {
    return matrix[fallbackKey];
  }
  return DEFAULT_ROUTING_TARGETS[senderKey] || DEFAULT_ROUTING_TARGETS[fallbackKey] || [];
}

/**
 * Mengubah status aktif/nonaktif suatu target penerima (Toggle Switch)
 */
export function toggleTargetStatus(senderKey, targetId, fallbackKey = null) {
  const matrix = getRoutingMatrix();
  const currentTargets = getTargetsForSender(senderKey, fallbackKey);

  const updatedTargets = currentTargets.map((t) => {
    if (t.id === targetId) {
      return { ...t, enabled: !t.enabled };
    }
    return t;
  });

  matrix[senderKey] = updatedTargets;
  saveRoutingMatrix(matrix);
  return updatedTargets;
}

/**
 * Menambahkan target penerima baru untuk pengirim tertentu
 */
export function addTargetToSender(senderKey, newTarget, fallbackKey = null) {
  const matrix = getRoutingMatrix();
  const currentTargets = getTargetsForSender(senderKey, fallbackKey);

  const targetId = newTarget.id || `custom-${Date.now()}`;
  const targetItem = {
    id: targetId,
    nama: newTarget.nama,
    cluster: newTarget.cluster || 'Target Tambahan',
    badge: newTarget.badge || 'Kustom',
    unit_id: newTarget.unit_id || '',
    deskripsi: newTarget.deskripsi || newTarget.nama,
    roleKey: newTarget.roleKey || '',
    userId: newTarget.userId || '',
    enabled: true,
    isCustom: true
  };

  const updatedTargets = [...currentTargets, targetItem];
  matrix[senderKey] = updatedTargets;
  saveRoutingMatrix(matrix);
  return updatedTargets;
}

/**
 * Memperbarui data target penerima yang sudah ada (Edit Target)
 */
export function updateTargetInSender(senderKey, targetId, updatedData, fallbackKey = null) {
  const matrix = getRoutingMatrix();
  const currentTargets = getTargetsForSender(senderKey, fallbackKey);

  const updatedTargets = currentTargets.map((t) => {
    if (t.id === targetId) {
      return {
        ...t,
        nama: updatedData.nama !== undefined ? updatedData.nama : t.nama,
        badge: updatedData.badge !== undefined ? updatedData.badge : t.badge,
        cluster: updatedData.cluster !== undefined ? updatedData.cluster : t.cluster,
        unit_id: updatedData.unit_id !== undefined ? updatedData.unit_id : t.unit_id,
        deskripsi: updatedData.deskripsi !== undefined ? updatedData.deskripsi : t.deskripsi,
        roleKey: updatedData.roleKey !== undefined ? updatedData.roleKey : t.roleKey,
        userId: updatedData.userId !== undefined ? updatedData.userId : t.userId,
        isCustom: true
      };
    }
    return t;
  });

  matrix[senderKey] = updatedTargets;
  saveRoutingMatrix(matrix);
  return updatedTargets;
}

/**
 * Menghapus target penerima dari pengirim tertentu
 */
export function removeTargetFromSender(senderKey, targetId, fallbackKey = null) {
  const matrix = getRoutingMatrix();
  const currentTargets = getTargetsForSender(senderKey, fallbackKey);

  const updatedTargets = currentTargets.filter((t) => t.id !== targetId);
  matrix[senderKey] = updatedTargets;
  saveRoutingMatrix(matrix);
  return updatedTargets;
}

/**
 * Mereset target spesifik suatu jabatan ke standar awalnya
 */
export function resetSenderTargets(senderKey, fallbackKey = null) {
  const matrix = getRoutingMatrix();
  const defaultTargets = DEFAULT_ROUTING_TARGETS[fallbackKey] || DEFAULT_ROUTING_TARGETS[senderKey] || [];
  matrix[senderKey] = JSON.parse(JSON.stringify(defaultTargets));
  saveRoutingMatrix(matrix);
  return matrix[senderKey];
}

/**
 * Menemukan akun pengguna aktif yang menjabat posisi tertentu di suatu unit
 * Terhubung dengan master data pengguna (allUsers)
 */
export function resolveOfficialOccupant(positionName = '', allUsers = [], unitCode = null, targetUserId = null) {
  if (!Array.isArray(allUsers) || allUsers.length === 0) return null;

  // 0. Prioritaskan jika target memiliki rujukan langsung userId dari Manajemen Pengguna
  if (targetUserId) {
    const directUser = allUsers.find(
      (u) =>
        u &&
        u.is_active !== false &&
        (String(u.id || '').toLowerCase() === String(targetUserId).toLowerCase() ||
          (u.nip && String(u.nip) === String(targetUserId)))
    );
    if (directUser) return directUser;
  }

  if (!positionName) return null;

  const targetName = String(positionName || '').toLowerCase().trim();
  const cleanUnit = String(unitCode || '').toUpperCase().trim();

  // Posisi non-pejabat (verifikator, arsiparis, drafter, pengadministrasi) mutlak tidak memiliki pemangku alur disposisi
  if (
    targetName.includes('verifikator') ||
    targetName.includes('arsiparis') ||
    targetName.includes('drafter') ||
    targetName.includes('konseptor') ||
    targetName.includes('pengadministrasi') ||
    targetName.startsWith('staf ')
  ) {
    return null;
  }

  // 1. Coba pencocokan standar
  const std = findPositionOccupant(positionName, allUsers, null, unitCode);
  if (std && isOfficialUserAccount(std)) return std;

  // 2. Pencocokan cerdas berdasarkan unit, jabatan, dan peran
  return (
    allUsers.find((u) => {
      if (!u || u.is_active === false || u.is_aktif === false || u.status_aktif === false) return false;
      // Hanya akun berwewenang pimpinan, penandatangan, atau pejabat yang sah
      if (!isOfficialUserAccount(u)) return false;

      const uUnit = String(u.unit_kerja_id || u.kode_unit || '').toUpperCase().trim();
      const uJabatan = String(u.jabatan || u.roleLabel || u.sotk_position_label || '').toLowerCase().trim();
      const uRole = String(u.role || '').toUpperCase().trim();

      // Rektor: wajib mencocokkan kata 'rektor' utuh (bukan rektorat / direktorat)
      if (/\brektor\b/i.test(targetName) && !/\b(wakil|warek)\b/i.test(targetName)) {
        return (/\brektor\b/i.test(uJabatan) && !/\b(wakil|warek)\b/i.test(uJabatan)) || uRole === 'REKTOR';
      }

      // Wakil Rektor
      if (/\b(wakil\s+rektor|warek)\b/i.test(targetName)) {
        if (targetName.includes('akademik') || targetName.includes('1') || targetName.includes('wr1')) {
          return (
            (uJabatan.includes('akademik') && (uJabatan.includes('wakil') || uJabatan.includes('warek'))) ||
            u.subRoleKey === 'WAREK_1'
          );
        }
        if (targetName.includes('keuangan') || targetName.includes('umum') || targetName.includes('2') || targetName.includes('wr2')) {
          return (
            ((uJabatan.includes('keuangan') || uJabatan.includes('umum')) && (uJabatan.includes('wakil') || uJabatan.includes('warek'))) ||
            u.subRoleKey === 'WAREK_2'
          );
        }
        if (targetName.includes('kemahasiswaan') || targetName.includes('alumni') || targetName.includes('3') || targetName.includes('wr3')) {
          return (
            ((uJabatan.includes('kemahasiswaan') || uJabatan.includes('alumni')) && (uJabatan.includes('wakil') || uJabatan.includes('warek'))) ||
            u.subRoleKey === 'WAREK_3'
          );
        }
      }

      // Senat
      if (cleanUnit === 'UN58.SENAT') {
        if (targetName.includes('ketua') && uJabatan.includes('ketua')) return true;
        if (targetName.includes('sekretaris') && uJabatan.includes('sekretaris')) return true;
      }

      // SPI
      if (cleanUnit === 'UN58.SPI') {
        if (targetName.includes('ketua') && uJabatan.includes('ketua')) return true;
        if (targetName.includes('sekretaris') && uJabatan.includes('sekretaris')) return true;
      }

      // Unit yang sama untuk Fakultas, UPA, Lembaga, Biro
      if (cleanUnit && uUnit === cleanUnit) {
        if (targetName.includes('dekan') && !targetName.includes('wakil')) {
          return (uJabatan.includes('dekan') && !uJabatan.includes('wakil')) || uRole === 'DEKAN';
        }
        if (targetName.includes('direktur') && !targetName.includes('wakil')) {
          return (uJabatan.includes('direktur') && !uJabatan.includes('wakil')) || uRole === 'DEKAN';
        }
        if (targetName.includes('wakil dekan') || targetName.includes('wadek')) {
          if (targetName.includes('akademik') || targetName.includes('1')) return uJabatan.includes('akademik');
          if (targetName.includes('keuangan') || targetName.includes('umum') || targetName.includes('2')) return uJabatan.includes('keuangan') || uJabatan.includes('umum');
          if (targetName.includes('kemahasiswaan') || targetName.includes('alumni') || targetName.includes('3')) return uJabatan.includes('kemahasiswaan') || uJabatan.includes('alumni');
        }
        if (targetName.includes('kepala biro') || targetName.includes('kabiro')) {
          return uJabatan.includes('kepala biro') || uJabatan.includes('kabiro') || uRole === 'KABIRO';
        }
        if (targetName.includes('kepala') || targetName.includes('ketua')) {
          return uJabatan.includes('kepala') || uJabatan.includes('ketua');
        }
        if (targetName.includes('sekretaris')) {
          return uJabatan.includes('sekretaris');
        }
        if (targetName.includes('kabag tu') || targetName.includes('kasubbag')) {
          return uJabatan.includes('tu') || uJabatan.includes('kasubbag');
        }
      }

      return false;
    }) || null
  );
}

/**
 * Memeriksa apakah dua nama formasi jabatan mengacu pada jabatan resmi struktural yang sama
 * untuk mencegah entri ganda akibat perbedaan singkatan/variasi (misal 'Wakil Rektor Bidang Kemahasiswaan' vs 'Wakil Rektor Bidang Kemahasiswaan dan Alumni').
 */
export function isSameOfficialPosition(posNameA = '', posNameB = '') {
  if (!posNameA || !posNameB) return false;
  const a = String(posNameA).toLowerCase().trim();
  const b = String(posNameB).toLowerCase().trim();
  if (a === b) return true;

  // Warek
  if (/\b(wakil\s+rektor|warek)\b/i.test(a) && /\b(wakil\s+rektor|warek)\b/i.test(b)) {
    if (a.includes('akademik') && b.includes('akademik')) return true;
    if ((a.includes('keuangan') || a.includes('umum')) && (b.includes('keuangan') || b.includes('umum'))) return true;
    if ((a.includes('kemahasiswaan') || a.includes('alumni')) && (b.includes('kemahasiswaan') || b.includes('alumni'))) return true;
  }

  // Rektor
  if (/\brektor\b/i.test(a) && !/\b(wakil|warek)\b/i.test(a) && /\brektor\b/i.test(b) && !/\b(wakil|warek)\b/i.test(b)) {
    return true;
  }

  // Senat
  if (a.includes('senat') && b.includes('senat')) {
    if (a.includes('ketua') && b.includes('ketua')) return true;
    if (a.includes('sekretaris') && b.includes('sekretaris')) return true;
  }

  // SPI
  if (a.includes('spi') && b.includes('spi')) {
    if (a.includes('ketua') && b.includes('ketua')) return true;
    if (a.includes('sekretaris') && b.includes('sekretaris')) return true;
  }

  return false;
}

/**
 * Mengambil daftar seluruh formasi pejabat resmi yang ada di suatu unit kerja
 * Terhubung dengan data akun riil Manajemen Pengguna (allUsers)
 */
export function getUnitOfficialPositions(unit, allUsers = [], onlyOccupied = false) {
  if (!unit) return [];
  const cleanCode = String(unit.kode_unit || unit.id || '').toUpperCase().trim();
  const tipe = String(unit.tipe_unit || unit.kategori || '').toUpperCase().trim();
  const unitSingkatan = unit.singkatan || unit.nama_unit || '';
  const positions = [];

  if (cleanCode === 'UN58' || cleanCode === 'UN58.REKTORAT') {
    positions.push(
      {
        id: 'pos-rektor',
        nama_jabatan: 'Rektor Universitas Siliwangi',
        singkat: 'Rektor',
        senderKey: 'REKTOR',
        fallbackKey: 'REKTOR'
      },
      {
        id: 'pos-wr1',
        nama_jabatan: 'Wakil Rektor Bidang Akademik',
        singkat: 'WR I',
        senderKey: 'WAREK_1',
        fallbackKey: 'WAREK_1'
      },
      {
        id: 'pos-wr2',
        nama_jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
        singkat: 'WR II',
        senderKey: 'WAREK_2',
        fallbackKey: 'WAREK_2'
      },
      {
        id: 'pos-wr3',
        nama_jabatan: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
        singkat: 'WR III',
        senderKey: 'WAREK_3',
        fallbackKey: 'WAREK_3'
      }
    );
  } else if (cleanCode === 'UN58.SENAT') {
    positions.push(
      {
        id: 'pos-senat-1',
        nama_jabatan: 'Ketua Senat Universitas Siliwangi',
        singkat: 'Ketua Senat',
        senderKey: 'UN58.SENAT__ketua',
        fallbackKey: 'REKTOR'
      },
      {
        id: 'pos-senat-2',
        nama_jabatan: 'Sekretaris Senat Universitas',
        singkat: 'Sekretaris Senat',
        senderKey: 'UN58.SENAT__sekretaris',
        fallbackKey: 'REKTOR'
      }
    );
  } else if (cleanCode === 'UN58.SPI') {
    positions.push(
      {
        id: 'pos-spi-1',
        nama_jabatan: 'Ketua Satuan Pengawas Internal (SPI)',
        singkat: 'Ketua SPI',
        senderKey: 'UN58.SPI__ketua',
        fallbackKey: 'REKTOR'
      },
      {
        id: 'pos-spi-2',
        nama_jabatan: 'Sekretaris Satuan Pengawas Internal (SPI)',
        singkat: 'Sekretaris SPI',
        senderKey: 'UN58.SPI__sekretaris',
        fallbackKey: 'REKTOR'
      }
    );
  } else if (cleanCode === 'UN58.DP') {
    positions.push({
      id: 'pos-dp-1',
      nama_jabatan: 'Ketua Dewan Penyantun',
      singkat: 'Ketua DP',
      senderKey: 'UN58.DP__ketua',
      fallbackKey: 'REKTOR'
    });
  } else if (cleanCode === 'UN58.6' || unit.nama_unit?.toLowerCase().includes('keuangan dan umum')) {
    positions.push(
      {
        id: 'pos-bku-1',
        nama_jabatan: 'Kepala Biro Keuangan dan Umum (BKU)',
        singkat: 'Kepala Biro',
        senderKey: 'KA_BIRO_BKU',
        fallbackKey: 'KA_BIRO_BKU'
      },
      {
        id: 'pos-bku-2',
        nama_jabatan: 'Kepala Bagian Umum',
        singkat: 'Kabag Umum',
        senderKey: 'UN58.6__kabag_umum',
        fallbackKey: 'KA_BIRO_BKU'
      }
    );
  } else if (cleanCode === 'UN58.5' || unit.nama_unit?.toLowerCase().includes('bakpk')) {
    positions.push(
      {
        id: 'pos-bakpk-1',
        nama_jabatan: 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama (BAKPK)',
        singkat: 'Kepala Biro',
        senderKey: 'KA_BIRO_BAKPK',
        fallbackKey: 'KA_BIRO_BAKPK'
      },
      {
        id: 'pos-bakpk-2',
        nama_jabatan: 'Kepala Bagian Akademik',
        singkat: 'Kabag Akademik',
        senderKey: 'UN58.5__kabag_akademik',
        fallbackKey: 'KA_BIRO_BAKPK'
      }
    );
  } else if (tipe === 'FAKULTAS' || tipe === 'PASCASARJANA' || cleanCode.startsWith('UN58.1')) {
    const isPasca = cleanCode === 'UN58.17' || tipe === 'PASCASARJANA';
    positions.push(
      {
        id: `pos-${cleanCode}-pimpinan`,
        nama_jabatan: isPasca ? `Direktur ${unit.nama_unit}` : `Dekan ${unitSingkatan}`,
        singkat: isPasca ? 'Direktur' : 'Dekan',
        senderKey: `${cleanCode}__pimpinan`,
        fallbackKey: 'DEKAN'
      },
      {
        id: `pos-${cleanCode}-wadek1`,
        nama_jabatan: `Wakil Dekan Bidang Akademik (${unitSingkatan})`,
        singkat: 'Wadek I',
        senderKey: `${cleanCode}__wadek1`,
        fallbackKey: 'DEKAN'
      },
      {
        id: `pos-${cleanCode}-wadek2`,
        nama_jabatan: `Wakil Dekan Bidang Keuangan dan Umum (${unitSingkatan})`,
        singkat: 'Wadek II',
        senderKey: `${cleanCode}__wadek2`,
        fallbackKey: 'DEKAN'
      },
      {
        id: `pos-${cleanCode}-wadek3`,
        nama_jabatan: `Wakil Dekan Bidang Kemahasiswaan & Alumni (${unitSingkatan})`,
        singkat: 'Wadek III',
        senderKey: `${cleanCode}__wadek3`,
        fallbackKey: 'DEKAN'
      },
      {
        id: `pos-${cleanCode}-ktu`,
        nama_jabatan: `Kepala Bagian Tata Usaha (${unitSingkatan})`,
        singkat: 'Kabag TU',
        senderKey: `${cleanCode}__ktu`,
        fallbackKey: 'DEKAN'
      }
    );

    // Jurusan jika ada
    if (Array.isArray(unit.jurusan) && unit.jurusan.length > 0) {
      unit.jurusan.forEach((j) => {
        const jKode = String(j.kode || j.nama || '').replace(/[^a-zA-Z0-9]/g, '');
        positions.push({
          id: `pos-jurusan-${jKode}`,
          nama_jabatan: `Ketua Jurusan / Koordinator Prodi ${j.nama} (${unitSingkatan})`,
          singkat: j.kode || 'Kajur',
          senderKey: `${cleanCode}__kajur_${jKode.toLowerCase()}`,
          fallbackKey: 'KAJUR_KAPRODI'
        });
      });
    }
  } else if (tipe === 'UPA' || cleanCode.startsWith('UN58.3')) {
    positions.push(
      {
        id: `pos-${cleanCode}-kepala`,
        nama_jabatan: unit.nama_unit?.toLowerCase().startsWith('kepala')
          ? unit.nama_unit
          : `Kepala ${unit.nama_unit}`,
        singkat: 'Kepala UPA',
        senderKey: `${cleanCode}__kepala`,
        fallbackKey: 'LEMBAGA_UPA'
      },
      {
        id: `pos-${cleanCode}-kasubbag`,
        nama_jabatan: `Kepala Subbagian Tata Usaha (${unitSingkatan})`,
        singkat: 'Subbag TU',
        senderKey: `${cleanCode}__kasubbag`,
        fallbackKey: 'LEMBAGA_UPA'
      }
    );
  } else if (tipe === 'LEMBAGA' || cleanCode.startsWith('UN58.2')) {
    positions.push(
      {
        id: `pos-${cleanCode}-ketua`,
        nama_jabatan: `Ketua ${unit.nama_unit}`,
        singkat: 'Ketua Lembaga',
        senderKey: `${cleanCode}__ketua`,
        fallbackKey: 'LEMBAGA_UPA'
      },
      {
        id: `pos-${cleanCode}-sekretaris`,
        nama_jabatan: `Sekretaris ${unit.nama_unit}`,
        singkat: 'Sekretaris',
        senderKey: `${cleanCode}__sekretaris`,
        fallbackKey: 'LEMBAGA_UPA'
      }
    );
  } else {
    positions.push({
      id: `pos-${cleanCode}-pimpinan`,
      nama_jabatan: `Pimpinan ${unit.nama_unit}`,
      singkat: 'Pimpinan',
      senderKey: `${cleanCode}__pimpinan`,
      fallbackKey: 'DEKAN'
    });
  }

  // Jika unit memiliki struktur_organisasi tersimpan di Manajemen Unit Kerja, sertakan posisi kustom
  if (Array.isArray(unit.struktur_organisasi) && unit.struktur_organisasi.length > 0) {
    unit.struktur_organisasi.forEach((item) => {
      if (item && item.nama_jabatan) {
        // HANYA sertakan jabatan yang berkategori pimpinan / pejabat struktural resmi (bukan staf/verifikator/drafter/tu)
        const isLeadership =
          item.kategori_peran === 'pimpinan' ||
          item.level_hirarki === 1 ||
          matchesOfficialDisposisiPosition(item.nama_jabatan);

        if (!isLeadership) return;

        const alreadyExists = positions.some(
          (p) =>
            p.nama_jabatan.toLowerCase().trim() === item.nama_jabatan.toLowerCase().trim() ||
            isSameOfficialPosition(p.nama_jabatan, item.nama_jabatan)
        );
        if (!alreadyExists) {
          // Khusus Rektorat (UN58), batasi formasi resmi sesuai SOTK Tata Naskah Dinas (Rektor & 3 Wakil Rektor)
          if (cleanCode === 'UN58' && /\b(wakil\s+rektor|warek)\b/i.test(item.nama_jabatan)) {
            return;
          }

          const posSlug = item.nama_jabatan.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 24);
          positions.push({
            id: `pos-${cleanCode}-${item.id || posSlug}`,
            nama_jabatan: item.nama_jabatan,
            singkat: item.nama_jabatan.length > 20 ? item.nama_jabatan.substring(0, 18) + '...' : item.nama_jabatan,
            senderKey: `${cleanCode}__${posSlug}`,
            fallbackKey: tipe === 'FAKULTAS' || tipe === 'PASCASARJANA' ? 'DEKAN' : 'LEMBAGA_UPA'
          });
        }
      }
    });
  }

  // Lengkapi dengan Pejabat Aktif dan Jumlah Target
  const resolvedPositions = positions.map((pos) => {
    const occupant = resolveOfficialOccupant(pos.nama_jabatan, allUsers, cleanCode);
    const targets = getTargetsForSender(pos.senderKey, pos.fallbackKey);
    const activeTargetsCount = targets.filter((t) => t.enabled !== false).length;
    const totalTargetsCount = targets.length;

    return {
      ...pos,
      occupant,
      activeTargetsCount,
      totalTargetsCount,
      targets
    };
  });

  if (onlyOccupied) {
    return resolvedPositions.filter((p) => Boolean(p.occupant));
  }

  return resolvedPositions;
}
