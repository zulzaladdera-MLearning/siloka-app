import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  FileText,
  UploadCloud,
  ShieldCheck,
  CheckCircle,
  Building,
  Printer,
  Eye,
  Columns,
  QrCode,
  RefreshCw,
  Mail,
  Send,
  Calendar,
  Layers,
  Search,
  Lock,
  ChevronDown,
  ShieldAlert,
  Loader2,
  Inbox,
  PenTool,
  AlertCircle,
  Trash2,
  CheckCircle2,
  ExternalLink,
  CheckSquare,
  SendHorizontal,
  Sparkles
} from 'lucide-react';
import {
  OFFICIAL_DISPOSISI_CHECKLIST_COL1,
  OFFICIAL_DISPOSISI_CHECKLIST_COL2,
  DISPOSISI_SLA_DAYS,
  getHierarchicalDisposisiTargets,
  isDisposisiAuthorizedOfficial
} from '../../utils/disposisiStandards';
import unitKerjaList from '../../data/unitKerja.json';
import { printDocument, getPaperSizeInfo } from '../../utils/printDocument';
import { determineKopSurat } from '../../utils/kopSuratHelper';
import {
  fetchKlasifikasiArsip,
  saveOutgoingLetter,
  saveInboundLetter,
  fetchPejabatByUnit,
  fetchAvailableLetterTypes,
  saveDraftLetter,
  FALLBACK_SCOPED_LETTER_TYPES
} from '../../services/letterService';
import {
  getPejabatByUnit,
  formatPejabatLabel,
  getAllOfficialsWithUserMapping
} from '../../utils/pejabatHelper';
import SmartKlasifikasiNumberingPanel from '../documents/SmartKlasifikasiNumberingPanel';
import { KopSuratUnsil } from '../documents/DocumentTemplates';
import { isDosenTanpaJabatan, isMandiriPersonalDocument } from '../../utils/authGuards';

// Daftar Template Standar Naskah Dinas Staf / Unit Kerja (13 Jenis Sesuai Tabel 1 Peraturan Rektor No. 3/2023)
const TEMPLATES = [
  {
    id: 'surat-dinas',
    kode_jenis_naskah: 'SURAT_DINAS',
    name: 'Surat Dinas',
    icon: Mail,
    desc: 'Surat resmi kedinasan eksternal/antar unit',
    defaultKlasifikasi: 'KU.01.04',
    defaultPerihal: 'Permohonan Koordinasi dan Fasilitasi Kerja Sama Program Penguatan Riset',
    defaultPembuka: 'Sehubungan dengan pelaksanaan program penguatan kerja sama riset dan tata kelola anggaran tahun anggaran berjalan, bersama ini kami sampaikan permohonan koordinasi dan fasilitasi terkait pelaksanaan kegiatan dimaksud yang akan diselenggarakan pada:',
    defaultIsi: '1. Hari/Tanggal : Senin, 21 September 2026\n2. Waktu : Pukul 09.00 WIB s.d. selesai\n3. Tempat : Ruang Rapat Unit Kerja Lantai 2 Kampus UNSIL\n4. Agenda : Koordinasi Penyusunan Laporan dan Verifikasi SPJ Keuangan Triwulan III',
    defaultPenutup: 'Mengingat pentingnya koordinasi tersebut, kami sangat mengharapkan kehadiran dan kerja sama Saudara. Atas perhatian dan perkenan yang diberikan, kami ucapkan terima kasih.',
    defaultTujuan: 'Kepala Biro Keuangan dan Umum Universitas Siliwangi',
    defaultAlamatTujuan: 'Kota Tasikmalaya'
  },
  {
    id: 'nota-dinas',
    kode_jenis_naskah: 'NOTA_DINAS',
    name: 'Nota Dinas',
    icon: FileText,
    desc: 'Komunikasi kedinasan internal antar pejabat dalam satu unit',
    defaultKlasifikasi: 'KU.01.04',
    defaultPerihal: 'Laporan Realisasi Penyerapan Anggaran BLU Triwulan III TA 2026',
    defaultPembuka: 'Bersama ini kami sampaikan dengan hormat laporan perkembangan realisasi belanja operasional dan belanja modal di lingkungan Universitas Siliwangi sampai dengan akhir Agustus 2026 sebagai bahan evaluasi pimpinan.',
    defaultIsi: '1. Realisasi penyerapan anggaran belanja pegawai dan operasional telah mencapai 78,4% dari pagu DIPA yang ditetapkan.\n2. Pengadaan sarana prasarana penunjang laboratorium melalui e-Katalog telah selesai diverifikasi oleh Pejabat Pembuat Komitmen (PPK).\n3. Seluruh berkas pertanggungjawaban (SPJ) telah terdigitalisasi penuh melalui modul kearsipan SILOKA sesuai standar Perka ANRI.',
    defaultPenutup: 'Demikian nota dinas ini kami sampaikan, atas perhatian dan arahan Bapak diucapkan terima kasih.',
    defaultTujuan: 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'undangan',
    kode_jenis_naskah: 'SURAT_UNDANGAN',
    name: 'Surat Undangan',
    icon: Calendar,
    desc: 'Undangan rapat dinas, sosialisasi, dan koordinasi kedinasan',
    defaultKlasifikasi: 'HM.00.01',
    defaultPerihal: 'Undangan Rapat Evaluasi Kinerja dan Tata Kelola Persuratan Digital',
    defaultPembuka: 'Dalam rangka meningkatkan tertib administrasi persuratan dan percepatan implementasi Tanda Tangan Elektronik (TTE) di lingkungan unit kerja, kami mengundang Saudara untuk hadir pada rapat yang diselenggarakan pada:',
    defaultIsi: 'Hari/Tanggal : Rabu, 16 September 2026\nWaktu        : Pukul 09.30 - 12.00 WIB\nTempat       : Ruang Sidang Utama Kampus UNSIL\nAcara        : Evaluasi Pengendalian Naskah Dinas Elektronik SILOKA',
    defaultPenutup: 'Kehadiran Saudara tepat pada waktunya sangat kami harapkan demi kelancaran agenda tersebut. Atas perhatian dan kerja sama Saudara, kami sampaikan terima kasih.',
    defaultTujuan: 'Para Ketua Jurusan / Koordinator Program Studi',
    defaultAlamatTujuan: 'Di Lingkungan Universitas Siliwangi'
  },
  {
    id: 'st_lembar',
    kode_jenis_naskah: 'SURAT_TUGAS',
    name: 'Surat Tugas (Format Lembar)',
    alias: 'Perorangan',
    icon: Layers,
    desc: 'Surat penugasan kedinasan untuk 1 orang (format lembaran identitas)',
    defaultKlasifikasi: 'KP.05.00',
    defaultPerihal: 'Penugasan Pelaksanaan Kegiatan Kedinasan',
    defaultPembuka: 'Pimpinan unit kerja dengan ini menugaskan kepada pejabat/pegawai di bawah ini,',
    defaultIsi: 'Nama : Dr. Nana Sujana, Drs., M.Si.\nNIP : 196808301989031004\nPangkat dan golongan : Pembina Utama Muda, IV/c\nJabatan : Kepala Biro Umum dan Keuangan\n\nUntuk : Menghadiri Rapat Koordinasi Nasional Tata Kelola Keuangan dan Kearsipan Perguruan Tinggi Negeri tanggal 15 s.d. 17 September 2026 di Hotel Grand Mercure, Jakarta Pusat',
    defaultPenutup: 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    defaultTujuan: 'Pegawai yang Bersangkutan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'st_kolom',
    kode_jenis_naskah: 'SURAT_TUGAS',
    name: 'Surat Tugas (Format Kolom)',
    alias: 'Kolektif / Tabel',
    icon: Layers,
    desc: 'Surat penugasan kedinasan tim/kelompok (format tabel matriks 3 kolom)',
    defaultKlasifikasi: 'KP.05.00',
    defaultPerihal: 'Penugasan Tim Pelaksanaan Kegiatan Kedinasan',
    defaultPembuka: 'Pimpinan unit kerja dengan ini menugaskan kepada pegawai yang namanya tercantum di bawah ini,',
    defaultIsi: '1. Dr. Nana Sujana, Drs., M.Si. | NIP 196808301989031004 | Pembina Utama Muda, IV/c | Kepala Biro Umum dan Keuangan\n2. Budi Santoso, S.E., M.Ak. | NIP 198203202008121002 | Penata Tk. I, III/d | Koordinator Keuangan & BMN\n3. Siti Rohmah, S.AP. | NIP 198809152014042001 | Penata Muda Tk. I, III/b | Staf Administrasi & Kearsipan\n\nUntuk : Mengikuti Bimbingan Teknis Standarisasi Naskah Dinas Elektronik dan Penerapan TTE Tersertifikasi BSSN tanggal 20 s.d. 22 September 2026 di Pusat Diklat Kemendikbudristek, Depok, Jawa Barat',
    defaultPenutup: 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    defaultTujuan: 'Para Pegawai yang Ditugaskan',
    defaultAlamatTujuan: 'Di Lingkungan Universitas Siliwangi'
  },
  {
    id: 'tugas',
    kode_jenis_naskah: 'SURAT_TUGAS',
    name: 'Surat Tugas',
    alias: 'Perorangan',
    icon: Layers,
    desc: 'Penugasan staf/pegawai untuk menjalankan kegiatan kedinasan',
    defaultKlasifikasi: 'KP.05.00',
    defaultPerihal: 'Penugasan Pelaksanaan Bimbingan Teknis Kearsipan dan TTE BSrE',
    defaultPembuka: 'Pimpinan unit kerja dengan ini menugaskan kepada pejabat/pegawai di bawah ini,',
    defaultIsi: 'Nama : Staf Pelaksana Administrasi Persuratan\nNIP : 198809152014042001\nPangkat dan golongan : Penata Muda Tk. I, III/b\nJabatan : Staf Pengelola Kearsipan\n\nUntuk : Mengikuti Bimbingan Teknis Pengelolaan Arsip Dinamis dan Penerapan TTE BSrE di Bandung pada tanggal 22-24 September 2026',
    defaultPenutup: 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    defaultTujuan: 'Pegawai yang Bersangkutan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'edaran',
    kode_jenis_naskah: 'SURAT_EDARAN',
    name: 'Surat Edaran',
    icon: FileText,
    desc: 'Petunjuk pelaksanaan kebijakan internal fakultas/unit',
    defaultKlasifikasi: 'OT.00.01',
    defaultPerihal: 'Petunjuk Teknis Pelaksanaan Ujian Akhir Semester Berbasis Digital',
    defaultPembuka: 'Dalam rangka menjamin kelancaran, objektivitas, dan standarisasi pelaksanaan evaluasi pembelajaran, bersama ini kami sampaikan petunjuk teknis sebagai berikut:',
    defaultIsi: '1. Seluruh dosen pengampu wajib mengunggah naskah soal melalui sistem akademik paling lambat H-3 pelaksanaan.\n2. Presensi kehadiran mahasiswa diverifikasi secara digital.\n3. Berita Acara Ujian diserahkan secara elektronik ke bagian akademik fakultas.',
    defaultPenutup: 'Demikian surat edaran ini disampaikan untuk menjadi pedoman dan dilaksanakan dengan penuh tanggung jawab.',
    defaultTujuan: 'Seluruh Dosen dan Mahasiswa di Lingkungan Fakultas',
    defaultAlamatTujuan: 'Di Lingkungan Fakultas'
  },
  {
    id: 'keterangan',
    kode_jenis_naskah: 'SURAT_KETERANGAN',
    name: 'Surat Keterangan',
    icon: CheckCircle,
    desc: 'Keterangan resmi keaktifan pegawai atau status kedinasan (Contoh 15 Gambar 4)',
    defaultKlasifikasi: 'PP.00.03',
    defaultPerihal: 'Surat Keterangan Keaktifan Pegawai / Status Kedinasan',
    defaultPembuka: 'Yang bertanda tangan di bawah ini,',
    defaultIsi: 'nama : Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.\nNIP : 196708161996031001\npangkat dan golongan : Pembina Utama Madya / IV/d\njabatan : Rektor Universitas Siliwangi\n\ndengan ini menerangkan bahwa,\nnama : Fajar Nugraha, S.T., M.Kom.\nNIP : 198805212015041002\npangkat dan golongan : Penata Muda Tingkat I / III/b\njabatan : Dosen Asisten Ahli pada Fakultas Teknik Universitas Siliwangi\n\nIsi Keterangan:\nBahwa yang bersangkutan adalah benar Pegawai Negeri Sipil / Tenaga Pendidik aktif pada Universitas Siliwangi dan saat ini sedang ditugaskan sebagai Koordinator Sistem Informasi dan Transformasi Digital (SILOKA) serta berkelakuan baik dan tidak sedang menjalani hukuman disiplin tingkat sedang maupun berat.',
    defaultPenutup: 'Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Pihak yang Berkepentingan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'pengantar',
    kode_jenis_naskah: 'SURAT_PENGANTAR',
    name: 'Surat Pengantar',
    icon: Send,
    desc: 'Pengantar pengiriman naskah, berkas SPJ, atau laporan dinas (Contoh 17 Gambar 5)',
    defaultKlasifikasi: 'KU.01.04',
    defaultPerihal: 'Surat Pengantar Pengiriman Berkas dan Dokumen Kedinasan',
    defaultPembuka: 'Bersama ini kami sampaikan:',
    defaultIsi: '1. Berkas Rekonsiliasi Laporan Keuangan Universitas Siliwangi Semester I Tahun Anggaran 2026 | 2 (dua) bundel | Disampaikan dengan hormat untuk diverifikasi dan diterbitkan Berita Acara Rekonsiliasi (BAR).\n2. Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Belanja Modal TA 2026 | 1 (satu) berkas | Sebagai kelengkapan berkas rekonsiliasi pengesahan belanja modal.',
    defaultPenutup: 'Demikian surat pengantar ini kami sampaikan untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.',
    defaultTujuan: 'Kepala Kantor Pelayanan Perbendaharaan Negara (KPPN) Tasikmalaya',
    defaultAlamatTujuan: 'Jalan Otto Iskandardinata Nomor 12 Kota Tasikmalaya'
  },
  {
    id: 'pernyataan',
    kode_jenis_naskah: 'SURAT_PERNYATAAN',
    name: 'Surat Pernyataan',
    icon: PenTool,
    desc: 'Pernyataan kedinasan atau kebenaran administratif tertulis',
    defaultKlasifikasi: 'KP.02.01',
    defaultPerihal: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
    defaultPembuka: 'Yang bertanda tangan di bawah ini,',
    defaultIsi: 'nama : Dr. Ade Rustiana, Drs., M.Si.\nNIP : 196801021992031002\npangkat dan golongan : Pembina Utama Muda / IV/c\njabatan : Wakil Rektor Bidang Umum dan Keuangan\nalamat : Jalan Siliwangi Nomor 24 Kota Tasikmalaya\n\nIsi Pernyataan:\nDengan ini menyatakan dengan sesungguhnya bahwa seluruh data, laporan rekonsiliasi belanja modal, dan dokumen pertanggungjawaban keuangan Universitas Siliwangi Tahun Anggaran 2026 telah disusun secara benar, objektif, dan sesuai dengan Standar Akuntansi Pemerintahan (SAP). Apabila di kemudian hari ditemukan ketidaksesuaian atau kekeliruan data, saya bersedia bertanggung jawab sepenuhnya sesuai ketentuan hukum yang berlaku.',
    defaultPenutup: 'Surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Pimpinan Universitas Siliwangi',
    defaultAlamatTujuan: 'Tasikmalaya'
  },
  {
    id: 'kuasa',
    kode_jenis_naskah: 'SURAT_KUASA',
    name: 'Surat Kuasa',
    icon: Lock,
    desc: 'Pelimpahan wewenang kedinasan tertentu dalam koridor tupoksi',
    defaultKlasifikasi: 'HK.01.02',
    defaultPerihal: 'Surat Kuasa Penanganan Berkas Administrasi',
    defaultPembuka: 'Yang bertanda tangan di bawah ini memberi kuasa kedinasan kepada pegawai di bawah ini:',
    defaultIsi: 'Penerima Kuasa diberi wewenang untuk mewakili pemberi kuasa dalam menghadiri koordinasi teknis serta menandatangani bukti serah terima administrasi kegiatan triwulan berjalan.',
    defaultPenutup: 'Surat kuasa ini diberikan untuk dipergunakan sebagaimana mestinya dan berlaku sampai agenda selesai.',
    defaultTujuan: 'Penerima Kuasa',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'pengumuman',
    kode_jenis_naskah: 'PENGUMUMAN',
    name: 'Pengumuman',
    icon: Mail,
    desc: 'Pemberitahuan resmi internal lingkup fakultas/jurusan',
    defaultKlasifikasi: 'HM.00.01',
    defaultPerihal: 'Pengumuman Jadwal Pelayanan Administrasi Akademik',
    defaultPembuka: 'Diberitahukan kepada seluruh sivitas akademika bahwa pelayanan administrasi akademik diselenggarakan dengan ketentuan:',
    defaultIsi: '1. Pelayanan luring: Senin s.d. Jumat pukul 08.00 - 15.30 WIB.\n2. Layanan persuratan digital tetap dilayani 24 jam melalui aplikasi SILOKA UNSIL.',
    defaultPenutup: 'Demikian pengumuman ini disampaikan untuk diketahui dan dipedomani bersama.',
    defaultTujuan: 'Seluruh Sivitas Akademika',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'berita-acara',
    kode_jenis_naskah: 'BERITA_ACARA',
    name: 'Berita Acara',
    icon: FileText,
    desc: 'Catatan resmi pelaksanaan kegiatan/serah terima fakultas',
    defaultKlasifikasi: 'PL.01.02',
    defaultPerihal: 'Berita Acara Serah Terima Pengadaan Perangkat Komputer Server dan Jaringan Terpusat',
    defaultPembuka: 'Pada hari ini, Selasa, tanggal 08, bulan September, tahun 2026, kami masing-masing:',
    defaultIsi: '1. Dr. Kurnia, S.P., M.P., NIP 197503122002121001 dan Kepala Biro Perencanaan, Keuangan, dan Umum, selanjutnya disebut Pihak Pertama, dan\n2. Ir. Hendra Gunawan, M.T. (Pejabat Pembuat Komitmen Sarana dan Prasarana), selanjutnya disebut Pihak Kedua,\n\ntelah melaksanakan:\n1. Pemeriksaan fisik dan uji fungsi terhadap Pengadaan Perangkat Komputer Server dan Jaringan Terpusat SILOKA Tahun Anggaran 2026.\n2. Serah terima barang operasional teknologi informasi dalam kondisi baik, lengkap, dan memenuhi spesifikasi teknis Kerangka Acuan Kerja (KAK).\n\nBerita acara ini dibuat dengan sesungguhnya berdasarkan Surat Keputusan Rektor Universitas Siliwangi Nomor 142/UN58/KP.02/2026 tanggal 15 Januari 2026 tentang Penetapan Tim Pemeriksa dan Penerima Hasil Pekerjaan Pengadaan Barang/Jasa di Lingkungan Universitas Siliwangi.',
    defaultPenutup: 'Berita acara ini dibuat rangkap dua (2) untuk dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Ir. Hendra Gunawan, M.T.',
    defaultAlamatTujuan: 'Tasikmalaya'
  },
  {
    id: 'pos',
    kode_jenis_naskah: 'POS',
    name: 'POS / SOP',
    icon: Layers,
    desc: 'Prosedur operasional standar lingkup fakultas (Dekan)',
    defaultKlasifikasi: 'OT.00.01',
    defaultPerihal: 'Prosedur Operasional Standar Pelayanan Tugas Akhir Mahasiswa',
    defaultPembuka: 'Prosedur Operasional Standar ini ditetapkan guna memberikan kepastian alur layanan dengan standar berikut:',
    defaultIsi: '1. Pengajuan judul melalui portal akademik jurusan.\n2. Verifikasi berkas oleh koordinator program studi dalam waktu 2x24 jam.\n3. Penetapan dosen pembimbing oleh Dekan.',
    defaultPenutup: 'POS ini berlaku sejak tanggal ditetapkan dan akan dievaluasi secara berkala.',
    defaultTujuan: 'Seluruh Sivitas Akademika Fakultas',
    defaultAlamatTujuan: 'Di Lingkungan Fakultas'
  },
  {
    id: 'pks-dn',
    kode_jenis_naskah: 'PKS_DN',
    name: 'PKS Dalam Negeri',
    icon: FileText,
    desc: 'Perjanjian kerja sama dalam negeri tingkat universitas/fakultas',
    defaultKlasifikasi: 'HM.02.00',
    defaultPerihal: 'Perjanjian Kerja Sama Program Magang dan Riset Industri',
    defaultPembuka: 'Perjanjian Kerja Sama ini disepakati oleh dan antara Universitas Siliwangi dengan Mitra Kerja Sama dalam negeri:',
    defaultIsi: '1. Kerja sama mencakup penempatan magang mahasiswa, riset bersama, dan dosen praktisi industri.\n2. Jangka waktu kerja sama berlaku selama 3 (tiga) tahun kalender.',
    defaultPenutup: 'Perjanjian ini ditandatangani oleh para pihak yang berwenang pada hari dan tanggal yang telah disepakati.',
    defaultTujuan: 'Pimpinan Mitra Kerja Sama',
    defaultAlamatTujuan: 'Indonesia'
  },
  {
    id: 'keputusan-rektor',
    kode_jenis_naskah: 'KEPUTUSAN',
    name: 'Keputusan Rektor',
    icon: ShieldCheck,
    desc: 'Keputusan Rektor Universitas Siliwangi (Eksklusif Rektor — Tabel 1 No. 5)',
    defaultKlasifikasi: 'OT.01.00',
    defaultPerihal: 'Penetapan Tim Kerja Transformasi Digital dan Pengelolaan Kearsipan JRA/SKKAAD Universitas Siliwangi',
    defaultPembuka: 'REKTOR UNIVERSITAS SILIWANGI, Menimbang bahwa dalam rangka mewujudkan akuntabilitas pengelolaan naskah dinas elektronik di lingkungan Universitas Siliwangi, perlu menetapkan Keputusan Rektor:',
    defaultIsi: 'KESATU: Membentuk Tim Kerja Transformasi Digital dan Pengelolaan Kearsipan JRA/SKKAAD Universitas Siliwangi.\nKEDUA: Keputusan Rektor ini mulai berlaku pada tanggal ditetapkan.',
    defaultPenutup: 'Ditetapkan di Tasikmalaya pada tanggal berjalan oleh Rektor Universitas Siliwangi.',
    defaultTujuan: 'Seluruh Pejabat dan Unit Kerja di Lingkungan Universitas Siliwangi',
    defaultAlamatTujuan: 'Kota Tasikmalaya'
  },
  {
    id: 'surat-perintah',
    kode_jenis_naskah: 'SURAT_PERINTAH',
    name: 'Surat Perintah',
    icon: ShieldCheck,
    desc: 'Surat Perintah pelaksanaan tugas khusus tingkat universitas (Eksklusif Rektor — Tabel 1 No. 6)',
    defaultKlasifikasi: 'KP.05.00',
    defaultPerihal: 'Perintah Pelaksanaan Audit Kepatuhan Kearsipan dan Rekonsiliasi BMN Universitas Siliwangi',
    defaultPembuka: 'REKTOR UNIVERSITAS SILIWANGI memberikan perintah kedinasan kepada pejabat/pegawai tersebut di bawah ini untuk:',
    defaultIsi: '1. Melaksanakan verifikasi kepatuhan tata naskah dinas dan JRA/SKKAAD pada seluruh unit kerja.\n2. Melaporkan hasil pelaksanaan perintah kedinasan kepada Rektor secara tertulis.',
    defaultPenutup: 'Surat perintah ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.',
    defaultTujuan: 'Pejabat/Pegawai yang Diperintahkan',
    defaultAlamatTujuan: 'Di Lingkungan Universitas Siliwangi'
  },
  {
    id: 'mou',
    kode_jenis_naskah: 'MOU',
    name: 'Nota Kesepahaman (MoU)',
    icon: Layers,
    desc: 'Nota Kesepahaman tingkat universitas / pendelegasian Rektor (Tabel 1 No. 11 & 19b)',
    defaultKlasifikasi: 'HM.02.00',
    defaultPerihal: 'Nota Kesepahaman Penyelenggaraan Tridharma Perguruan Tinggi dan Program MBKM',
    defaultPembuka: 'Nota Kesepahaman ini dibuat dan ditandatangani oleh Universitas Siliwangi dan Mitra Strategis:',
    defaultIsi: '1. Sinergi penyelenggaraan pendidikan, penelitian, dan pengabdian kepada masyarakat.\n2. Pengembangan sumber daya manusia dan jejaring kerja sama kelembagaan.',
    defaultPenutup: 'Nota Kesepahaman ini berlaku untuk jangka waktu 5 (lima) tahun sejak ditandatangani.',
    defaultTujuan: 'Pimpinan Instansi Mitra Nota Kesepahaman',
    defaultAlamatTujuan: 'Indonesia'
  },
  {
    id: 'notula',
    kode_jenis_naskah: 'NOTULA',
    name: 'Notula Rapat',
    icon: FileText,
    desc: 'Catatan ringkas jalannya rapat pimpinan (Contoh 19 Gambar 1)',
    defaultKlasifikasi: 'HM.00.01',
    defaultPerihal: 'Rapat Koordinasi Evaluasi Implementasi Tata Naskah Dinas Elektronik SILOKA',
    defaultPembuka: '',
    defaultIsi: 'Nama rapat : Rapat Koordinasi Evaluasi Implementasi Tata Naskah Dinas Elektronik SILOKA\nHari, tanggal : Selasa, 08 September 2026\nPukul : 09.00 - 12.00 WIB\nTempat : Ruang Sidang Rektorat Lt. 2 Universitas Siliwangi\nSusunan acara :\n1. Pembukaan oleh Pembawa Acara\n2. Pengarahan Rektor Universitas Siliwangi\n3. Pemaparan Laporan Kemajuan Penerapan TTE BSrE oleh Tim SILOKA\n4. Diskusi dan Tanggapan Dekan serta Kepala Biro\n5. Perumusan Simpulan dan Penutup\n\nPemimpin rapat : Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng. (Rektor)\nPencatat/notulis : Rina Permatasari, S.Sos. (Pranata Humas)\nPeserta rapat :\n1. Wakil Rektor Bidang Akademik\n2. Wakil Rektor Bidang Umum dan Keuangan\n3. Wakil Rektor Bidang Kemahasiswaan dan Alumni\n4. Para Dekan Fakultas di lingkungan UNSIL\n5. Kepala Lembaga (LPPM dan LP3M)\n6. Koordinator Pusat Teknologi Informasi dan Pangkalan Data\n\n1. Persoalan yang dibahas : Integrasi menyeluruh modul tanda tangan digital bersertifikat BSrE BSSN ke seluruh 20 format tata naskah dinas resmi SILOKA serta penguatan validasi QR-Code verifikasi dokumen kedinasan.\n2. Tanggapan peserta rapat : Para Dekan menyetujui percepatan implementasi template resmi naskah dinas per September 2026 dan meminta pelatihan teknis (Bimtek) bagi seluruh staf tata usaha fakultas.\n3. Simpulan : Seluruh fakultas dan biro diwajibkan menggunakan aplikasi SILOKA untuk pembuatan dan pengesahan seluruh naskah dinas resmi mulai pekan depan. Bimtek tata persuratan elektronik diagendakan pada hari Jumat, 11 September 2026.',
    defaultPenutup: '',
    defaultTujuan: 'Seluruh Peserta Rapat',
    defaultAlamatTujuan: 'Universitas Siliwangi'
  },
  {
    id: 'laporan',
    kode_jenis_naskah: 'LAPORAN',
    name: 'Laporan',
    icon: FileText,
    desc: 'Laporan pelaksanaan kegiatan kedinasan (Contoh 20 Gambar 2)',
    defaultKlasifikasi: 'PR.04.01',
    defaultPerihal: 'PELAKSANAAN AUDIT KESIAPAN TEKNOLOGI DAN IMPLEMENTASI TATA NASKAH DINAS ELEKTRONIK APLIKASI SILOKA UNIVERSITAS SILIWANGI TAHUN 2026',
    defaultPembuka: '',
    defaultIsi: 'A. Pendahuluan\n1. Latar Belakang: Dalam rangka reformasi birokrasi dan percepatan transformasi digital persuratan kedinasan di lingkungan Universitas Siliwangi sesuai Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi tentang Tata Naskah Dinas serta Peraturan Rektor Nomor 3 Tahun 2023, dipandang perlu menyusun laporan pelaksanaan audit kesiapan sistem SILOKA.\n2. Dasar: 1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional; 2. Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan; 3. Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi; 4. Surat Tugas Rektor Universitas Siliwangi Nomor 042/UN58/KP.03/2026 tanggal 01 September 2026.\n3. Ruang Lingkup: Ruang lingkup pelaksanaan kegiatan meliputi pengujian 20 format naskah dinas resmi, integrasi Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN, keandalan server basis data surat dinas, serta pelatihan operasional bagi staf pengadministrasi persuratan.\n\nB. Kegiatan yang Dilaksanakan\n1. Melakukan validasi kesesuaian layout visual 20 format naskah dinas dengan pedoman tata naskah dinas resmi UNSIL.\n2. Melaksanakan uji coba penerbitan TTE BSrE dengan enkripsi hash dokumen dan stempel QR-Code verifikasi dinas.\n3. Menyelenggarakan bimbingan teknis (Bimtek) administrasi naskah dinas elektronik kepada seluruh perwakilan fakultas dan unit kerja.\n\nC. Hasil yang Dicapai\n1. Sebanyak 20 format naskah dinas resmi berhasil diintegrasikan dengan sempurna ke dalam aplikasi SILOKA.\n2. Tingkat kepatuhan format persuratan kedinasan mencapai 100% dan siap dioperasikan penuh pada semester ganjil TA 2026/2027.\n3. Telah tersertifikasi secara elektronik dan aman dari risiko pemalsuan dokumen kedinasan.\n\nD. Penutup\nDemikian laporan ini dibuat dengan sebenarnya sebagai bahan evaluasi dan pertanggungjawaban pelaksanaan kegiatan. Atas perhatian dan dukungan pimpinan Universitas Siliwangi, diucapkan terima kasih.',
    defaultPenutup: 'Demikian laporan ini dibuat dengan sebenarnya sebagai bahan evaluasi dan pertanggungjawaban pelaksanaan kegiatan.',
    defaultTujuan: 'Rektor Universitas Siliwangi',
    defaultAlamatTujuan: 'Tasikmalaya'
  },
  {
    id: 'telaah-staf',
    kode_jenis_naskah: 'TELAAH_STAF',
    name: 'Telaah Staf',
    icon: FileText,
    desc: 'Kajian analisis permasalahan dan saran kebijakan (Contoh 21 Gambar 3)',
    defaultKlasifikasi: 'OT.01.00',
    defaultPerihal: 'OPTIMALISASI KEAMANAN DATA KEARSIPAN DAN IMPLEMENTASI TATA NASKAH DINAS ELEKTRONIK PADA APLIKASI SILOKA UNIVERSITAS SILIWANGI',
    defaultPembuka: '',
    defaultIsi: 'Kepada : Rektor Universitas Siliwangi\nDari : Kepala Biro Umum dan Keuangan\nTanggal : 08 September 2026\nNomor : \nLampiran : 1 (satu) Berkas\nHal : Telaah Staf Peningkatan Keandalan Server dan Sertifikasi TTE BSrE SILOKA\n\nI. Persoalan\nBagian persoalan memuat pernyataan singkat dan jelas tentang persoalan yang akan dipecahkan.\n\nII. Praanggapan\nPraanggapan memuat dugaan yang beralasan berdasarkan data dan saling berhubungan sesuai dengan situasi yang dihadapi dan merupakan kemungkinan kejadian di masa mendatang.\n\nIII. Fakta-fakta yang mempengaruhi\nBagian fakta yang mempengaruhi memuat fakta yang merupakan landasan analisis dan pemecahan persoalan.\n\nIV. Analisis\nBagian ini memuat analisis pengaruh praanggapan dan fakta terhadap persoalan serta akibatnya, hambatan serta keuntungan dan kerugiannya, serta pemecahan atau cara bertindak yang mungkin atau dapat dilakukan.\n\nV. Simpulan\nBagian simpulan memuat intisari hasil analisis dan pilihan satu cara bertindak atau jalan keluar sebagai pemecahan persoalan yang dihadapi.\n\nVI. Saran\nBagian saran memuat secara ringkas dan jelas tentang saran tindakan untuk mengatasi persoalan yang dihadapi.',
    defaultPenutup: '',
    defaultTujuan: 'Rektor Universitas Siliwangi',
    defaultAlamatTujuan: 'Tasikmalaya'
  },
  {
    id: 'disposisi-rektor',
    kode_jenis_naskah: 'DISPOSISI_REKTOR',
    name: 'Disposisi Rektor',
    icon: Send,
    desc: 'Lembar Disposisi Rektor Universitas Siliwangi (Eksklusif Rektor — Pasal 55 ayat (3) Contoh 21)',
    defaultKlasifikasi: 'HM.00.00',
    defaultPerihal: 'Instruksi dan Disposisi Rektor atas Surat Masuk Strategis Kementerian',
    defaultPembuka: 'Lembar Disposisi Rektor Universitas Siliwangi diteruskan kepada Wakil Rektor / Dekan / Ketua Lembaga / Kepala Biro terkait:',
    defaultIsi: 'Instruksi Rektor: Segera telaah, koordinasikan lintas bidang, dan siapkan konsep tindak lanjut sesuai ketentuan peraturan perundang-undangan.',
    defaultPenutup: 'Harap dilaksanakan dengan penuh tanggung jawab dan dilaporkan hasilnya kepada Rektor.',
    defaultTujuan: 'Para Wakil Rektor / Dekan / Kepala Biro Terkait',
    defaultAlamatTujuan: 'Di Lingkungan Universitas Siliwangi'
  },
  {
    id: 'penggunaan-tte',
    kode_jenis_naskah: 'PENGGUNAAN_TTE',
    name: 'Penggunaan TTE',
    icon: QrCode,
    desc: 'Naskah dinas bersertifikasi Tanda Tangan Elektronik BSrE (Pasal 61 Contoh 20)',
    defaultKlasifikasi: 'TI.01.00',
    defaultPerihal: 'Penerbitan Naskah Dinas Elektronik Tersertifikasi TTE BSrE BSSN',
    defaultPembuka: 'Sehubungan dengan penerapan Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN pada sistem SILOKA Universitas Siliwangi:',
    defaultIsi: '1. Dokumen ini ditandatangani secara elektronik dan memiliki kekuatan hukum yang sah.\n2. Verifikasi keaslian dokumen dapat dilakukan melalui pemindaian QR-Code resmi pada naskah.',
    defaultPenutup: 'Demikian naskah dinas elektronik ini diterbitkan untuk dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Seluruh Unit Kerja dan Mitra Universitas Siliwangi',
    defaultAlamatTujuan: 'Kota Tasikmalaya'
  }
];

// Helper pemetaan ID template ke kode template resmi SILOKA
const mapTemplateIdToType = (tplId) => {
  if (!tplId) return 'sd';
  const idStr = String(tplId).toLowerCase();
  if (idStr === 'nota-dinas' || idStr === 'nota_dinas' || idStr === 'nd') return 'nd';
  if (idStr === 'surat-dinas' || idStr === 'surat_dinas' || idStr === 'sd') return 'sd';
  if (idStr === 'undangan' || idStr === 'surat_undangan' || idStr === 'surat-undangan') return 'undangan_lembar';
  if (idStr === 'st_kolom' || idStr === 'st-kolom') return 'st_kolom';
  if (idStr === 'st_lembar' || idStr === 'st-lembar' || idStr === 'tugas' || idStr === 'surat_tugas' || idStr === 'surat-tugas' || idStr === 'st') return 'st_lembar';
  if (idStr === 'edaran' || idStr === 'surat_edaran' || idStr === 'surat-edaran' || idStr === 'se') return 'se';
  if (idStr === 'perintah' || idStr === 'surat_perintah' || idStr === 'surat-perintah' || idStr === 'sp') return 'sp';
  if (idStr === 'keputusan' || idStr === 'sk') return 'sk';
  if (idStr === 'pengumuman' || idStr === 'peng') return 'peng';
  if (idStr === 'laporan' || idStr === 'lap') return 'lap';
  if (idStr === 'berita-acara' || idStr === 'berita_acara' || idStr === 'ba') return 'ba';
  if (idStr === 'kuasa' || idStr === 'surat-kuasa' || idStr === 'skua') return 'skua';
  if (idStr === 'keterangan' || idStr === 'surat-keterangan' || idStr === 'sket') return 'sket';
  if (idStr === 'pernyataan' || idStr === 'surat-pernyataan' || idStr === 'sper') return 'sper';
  if (idStr === 'pengantar' || idStr === 'surat-pengantar' || idStr === 'speng') return 'speng';
  if (idStr === 'notula') return 'notula';
  if (idStr === 'telaah-staf' || idStr === 'telaah_staf' || idStr === 'ts') return 'ts';
  return 'sd';
};

export const CreateLetterModal = ({
  isOpen,
  onClose,
  onSaveLetter,
  currentUser,
  initialMode = 'surat-keluar',
  allLetters = [],
  allUsers = [],
  followUpDisposisi = null,
  onClearFollowUp = null
}) => {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const generateRandomSeq = () => String(Math.floor(100 + Math.random() * 900)).padStart(4, '0');

  // Mode Dokumen: 'surat-keluar' (Penyusunan naskah kedinasan) | 'surat-masuk' (Registrasi surat masuk eksternal)
  const [letterType, setLetterType] = useState(() => (followUpDisposisi ? 'surat-keluar' : initialMode || 'surat-keluar'));

  useEffect(() => {
    if (followUpDisposisi && isOpen) {
      setLetterType('surat-keluar');
      setSelectedTemplateId('nota-dinas');
      setPerihal(`Tindak Lanjut E-Disposisi: ${followUpDisposisi.perihal || 'Naskah Dinas'}`);
      setNomorSuratAsal(followUpDisposisi.nomorSurat || followUpDisposisi.nomorAgenda || '');
      setTujuan(followUpDisposisi.pemberiDisposisi || TEMPLATES[0].defaultTujuan);
      setKalimatPembuka(
        `Menindaklanjuti E-Disposisi Nomor Agenda ${followUpDisposisi.nomorAgenda || '-'} perihal "${followUpDisposisi.perihal || '-'}" dengan arahan: "${followUpDisposisi.instruksi || 'Tindak lanjuti sesuai arahan'}", bersama ini kami sampaikan:`
      );
    } else if (initialMode && isOpen) {
      setLetterType(initialMode);
    }
  }, [followUpDisposisi, initialMode, isOpen]);

  // Mode Tampilan: 'split' (Form & Pratinjau berdampingan) | 'form' (Hanya Formulir) | 'preview' (Hanya Pratinjau A4)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'form';
    }
    return 'split';
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => (followUpDisposisi ? 'nota-dinas' : 'surat-dinas'));

  // Auto-fill kode unit berdasarkan unit kerja user yang login
  const defaultUnit =
    unitKerjaList.find((u) => u.kode_unit === currentUser?.unit_kerja_id || u.id === currentUser?.unit_kerja_id) ||
    unitKerjaList.find((u) => u.kode_unit === 'UN58.6') ||
    unitKerjaList[0];

  const [selectedUnitCode, setSelectedUnitCode] = useState(defaultUnit.kode_unit);
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState('KU.01.04');
  const [klasifikasiList, setKlasifikasiList] = useState([]);
  const [searchKlasifikasi, setSearchKlasifikasi] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [tingkatKeamanan, setTingkatKeamanan] = useState('B'); // 'B' (Biasa), 'R' (Rahasia), 'SR' (Sangat Rahasia)
  const [isSaving, setIsSaving] = useState(false);
  const searchDropdownRef = useRef(null);

  // Field Surat Keluar
  const [nomorSuratAsal, setNomorSuratAsal] = useState(() => {
    if (followUpDisposisi) {
      return followUpDisposisi.nomorSurat || followUpDisposisi.nomorAgenda || '';
    }
    return '';
  });
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [perihal, setPerihal] = useState(() => {
    if (followUpDisposisi) {
      return `Tindak Lanjut E-Disposisi: ${followUpDisposisi.perihal || 'Naskah Dinas'}`;
    }
    return '';
  });
  const [kategori, setKategori] = useState('Surat Keluar');
  const [sifatSurat, setSifatSurat] = useState(() => {
    if (followUpDisposisi?.sifatInstruksi) {
      return followUpDisposisi.sifatInstruksi.includes('Segera') ? 'Segera' : 'Biasa';
    }
    return 'Biasa';
  });
  const [lampiran, setLampiran] = useState('-');
  const [pengirim, setPengirim] = useState(defaultUnit.nama_unit);
  const [tujuan, setTujuan] = useState(() => {
    if (followUpDisposisi) {
      return followUpDisposisi.pemberiDisposisi || '';
    }
    return '';
  });
  const [alamatTujuan, setAlamatTujuan] = useState('');
  const [kalimatPembuka, setKalimatPembuka] = useState(() => {
    if (followUpDisposisi) {
      return `Menindaklanjuti E-Disposisi Nomor Agenda ${followUpDisposisi.nomorAgenda || '-'} perihal "${followUpDisposisi.perihal || '-'}" dengan arahan: "${followUpDisposisi.instruksi || 'Tindak lanjuti sesuai arahan'}", bersama ini kami sampaikan:`;
    }
    return '';
  });
  const [isiPokok, setIsiPokok] = useState('');
  const [kalimatPenutup, setKalimatPenutup] = useState('');

  // Field Khusus Registrasi Surat Masuk Eksternal
  const [nomorSuratAsalMasuk, setNomorSuratAsalMasuk] = useState('1204/B/LLDIKTI4/KL/2026');
  const [pengirimMasuk, setPengirimMasuk] = useState('Kementerian Pendidikan Tinggi, Sains, dan Teknologi');
  const [tujuanMasuk, setTujuanMasuk] = useState('Rektor Universitas Siliwangi');
  const [tanggalSuratMasuk, setTanggalSuratMasuk] = useState(new Date().toISOString().slice(0, 10));
  const [tanggalTerimaMasuk, setTanggalTerimaMasuk] = useState(new Date().toISOString().slice(0, 10));
  const [perihalMasuk, setPerihalMasuk] = useState('Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU');
  const [ringkasanMasuk, setRingkasanMasuk] = useState('Permohonan data dukung dan kehadiran pimpinan dalam rangka rekonsiliasi laporan keuangan dan aset');
  const [sifatSuratMasuk, setSifatSuratMasuk] = useState('Penting');

  // Master Pejabat Struktural UNSIL untuk Pilihan Dropdown & Direct Account Routing (Terintegrasi Manajemen Pengguna)
  const allOfficialsList = useMemo(() => getAllOfficialsWithUserMapping(allUsers), [allUsers]);
  const [tujuanPejabatMode, setTujuanPejabatMode] = useState('SELECT'); // 'SELECT' | 'MANUAL'
  const [selectedPejabatMasukId, setSelectedPejabatMasukId] = useState(() => {
    return allOfficialsList[0]?.id || 'usr-01';
  });
  const [customTujuanMasuk, setCustomTujuanMasuk] = useState('');

  const selectedPejabatObj = useMemo(() => {
    if (tujuanPejabatMode === 'MANUAL') return null;
    return (
      allOfficialsList.find((p) => String(p.id) === String(selectedPejabatMasukId)) ||
      allOfficialsList.find((p) => String(p.user_id) === String(selectedPejabatMasukId)) ||
      allOfficialsList.find((p) => p.id === 'usr-01' || p.user_id === 'usr-01') ||
      allOfficialsList[0] ||
      null
    );
  }, [allOfficialsList, selectedPejabatMasukId, tujuanPejabatMode]);

  // Sinkronisasi otomatis saat daftar pejabat Manajemen Pengguna berubah
  useEffect(() => {
    if (allOfficialsList.length > 0 && tujuanPejabatMode === 'SELECT') {
      const exists = allOfficialsList.some(
        (p) => String(p.id) === String(selectedPejabatMasukId) || String(p.user_id) === String(selectedPejabatMasukId)
      );
      if (!exists) {
        const defaultOfficial =
          allOfficialsList.find((p) => p.id === 'usr-01' || p.user_id === 'usr-01') || allOfficialsList[0];
        if (defaultOfficial) {
          setSelectedPejabatMasukId(defaultOfficial.id);
          setTujuanMasuk(defaultOfficial.jabatan);
        }
      }
    }
  }, [allOfficialsList, selectedPejabatMasukId, tujuanPejabatMode]);

  // Profil Pengguna Aktif yang Disinkronkan dengan Manajemen Pengguna (allUsers)
  const effectiveCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    if (Array.isArray(allUsers) && allUsers.length > 0) {
      const matched = allUsers.find(
        (u) =>
          (u.id && currentUser.id && String(u.id) === String(currentUser.id)) ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (u.nip && currentUser.nip && u.nip === currentUser.nip)
      );
      if (matched) return { ...currentUser, ...matched };
    }
    return currentUser;
  }, [currentUser, allUsers]);

  // Target Disposisi Berjenjang Top-Down sesuai Matriks Kewenangan OTK UNSIL
  const hierarchicalDisposisiTargets = useMemo(() => {
    return getHierarchicalDisposisiTargets(effectiveCurrentUser);
  }, [effectiveCurrentUser]);

  // Cek apakah pengguna aktif memiliki kewenangan pimpinan/pejabat struktural untuk disposisi
  // STRICT: Wajib ada jika role Pejabat SOTK UNSIL (Gambar 2), Dilarang Keras jika Bukan Pejabat
  const isOfficialAuthorizedForDisposisi = useMemo(() => {
    return isDisposisiAuthorizedOfficial(effectiveCurrentUser, allUsers);
  }, [effectiveCurrentUser, allUsers]);

  // State Checklist Instruksi Disposisi Surat Masuk (Contoh 21)
  const [disposisiActionsMasuk, setDisposisiActionsMasuk] = useState([]);
  const [disposisiKoordinasiDetail, setDisposisiKoordinasiDetail] = useState('');
  const [disposisiLainnyaDetail, setDisposisiLainnyaDetail] = useState('');
  const [disposisiTargetUnit, setDisposisiTargetUnit] = useState('');
  const [disposisiCatatanTambahan, setDisposisiCatatanTambahan] = useState('');
  const [disposisiDueDate, setDisposisiDueDate] = useState(() => {
    const d = new Date();
    const days = DISPOSISI_SLA_DAYS['Penting'] || 2;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  });

  const handleToggleDisposisiAction = (label) => {
    if (disposisiActionsMasuk.includes(label)) {
      setDisposisiActionsMasuk(disposisiActionsMasuk.filter((a) => a !== label));
    } else {
      setDisposisiActionsMasuk([...disposisiActionsMasuk, label]);
    }
  };

  const handleSelectAllDisposisi = () => {
    const allLabels = [
      ...OFFICIAL_DISPOSISI_CHECKLIST_COL1.map((c) => c.label),
      ...OFFICIAL_DISPOSISI_CHECKLIST_COL2.map((c) => c.label)
    ];
    setDisposisiActionsMasuk(allLabels);
  };

  const handleClearAllDisposisi = () => {
    setDisposisiActionsMasuk([]);
    setDisposisiKoordinasiDetail('');
    setDisposisiLainnyaDetail('');
  };

  // Format ukuran berkas (B, KB, MB)
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Berkas Lampiran Pindaian Surat Masuk
  const [uploadedFileMasuk, setUploadedFileMasuk] = useState(null);
  const [uploadedFileNameMasuk, setUploadedFileNameMasuk] = useState('');
  const [uploadedFileSizeMasuk, setUploadedFileSizeMasuk] = useState('');
  const [uploadedFileUrlMasuk, setUploadedFileUrlMasuk] = useState(null);
  const [uploadedFileDataUrlMasuk, setUploadedFileDataUrlMasuk] = useState(null);
  const [isDraggingMasuk, setIsDraggingMasuk] = useState(false);
  const [uploadErrorMasuk, setUploadErrorMasuk] = useState('');
  const fileInputMasukRef = useRef(null);

  const handleProcessFileMasuk = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadErrorMasuk('Format berkas tidak sesuai. Harap unggah dokumen pindaian berformat PDF (.pdf).');
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadErrorMasuk(`Ukuran berkas (${formatFileSize(file.size)}) melebihi batas 5MB. Harap kompres dokumen pindaian terlebih dahulu.`);
      return;
    }
    setUploadErrorMasuk('');
    setUploadedFileMasuk(file);
    setUploadedFileNameMasuk(file.name);
    setUploadedFileSizeMasuk(formatFileSize(file.size));

    try {
      const objUrl = URL.createObjectURL(file);
      setUploadedFileUrlMasuk(objUrl);
    } catch {
      // fallback
    }

    if (file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFileDataUrlMasuk(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputMasuk = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFileMasuk(file);
    }
  };

  const handleRemoveFileMasuk = () => {
    setUploadedFileMasuk(null);
    setUploadedFileNameMasuk('');
    setUploadedFileSizeMasuk('');
    setUploadedFileUrlMasuk(null);
    setUploadedFileDataUrlMasuk(null);
    setUploadErrorMasuk('');
    if (fileInputMasukRef.current) {
      fileInputMasukRef.current.value = '';
    }
  };

  const handlePreviewFileMasuk = () => {
    if (uploadedFileUrlMasuk) {
      window.open(uploadedFileUrlMasuk, '_blank', 'noopener,noreferrer');
    } else if (uploadedFileNameMasuk) {
      window.alert(`Pratinjau Berkas: "${uploadedFileNameMasuk}" (${uploadedFileSizeMasuk})\n\nDokumen pindaian resmi siap diarsipkan ke Buku Agenda Masuk SILOKA.`);
    }
  };

  // Sinkronkan mode awal saat modal dibuka
  useEffect(() => {
    if (initialMode) {
      setLetterType(initialMode);
    }
  }, [initialMode, isOpen]);

  // =========================================================================
  // SIGNATORY AUTHORITY SCOPING ENGINE (TABEL 1 PERATURAN REKTOR NO. 3/2023)
  // =========================================================================
  const [availableNaskahTypes, setAvailableNaskahTypes] = useState(FALLBACK_SCOPED_LETTER_TYPES);
  const [selectedKodeNaskah, setSelectedKodeNaskah] = useState('SURAT_DINAS');
  const [selectedSignatoryRole, setSelectedSignatoryRole] = useState('DEKAN'); // 'KETUA_JURUSAN' | 'DEKAN'
  const [isLoadingScoping, setIsLoadingScoping] = useState(false);

  // Penandatangan Kedinasan (Automated Hierarchy Routing: Auto-Fill & Locked)
  const [selectedPejabatId, setSelectedPejabatId] = useState('');
  const [namaJabatanSigner, setNamaJabatanSigner] = useState('');
  const [namaPejabatSigner, setNamaPejabatSigner] = useState('');
  const [gelarSigner, setGelarSigner] = useState('');
  const [nipSigner, setNipSigner] = useState('');
  const [tteVerified, setTteVerified] = useState(false);
  const [tembusanText, setTembusanText] = useState('');

  // 1. Deteksi 'kode_unit' dan 'jabatan' dari user (Dosen/Staf) yang sedang login (Session User)
  const sessionUserUnit = currentUser?.unit_kerja_id || currentUser?.kode_unit || 'UN58.13.1';
  const sessionUserJabatan =
    currentUser?.roleLabel ||
    currentUser?.jabatan ||
    (currentUser?.role === 'PEJABAT' ? 'Pejabat Struktural' : 'Dosen Biasa (Tanpa Tugas Tambahan)');
  const sessionUserName = currentUser?.nama_lengkap || currentUser?.name || 'Dosen / Staf Pengusul';

  // Deteksi apakah pengguna yang aktif adalah dosen (fungsional / tanpa jabatan struktural)
  const isDosen = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.is_pejabat === true) return false;
    if (isDosenTanpaJabatan(currentUser)) return true;
    const role = String(currentUser?.role || '').toUpperCase();
    const roleLabel = String(currentUser?.roleLabel || currentUser?.jabatan || sessionUserJabatan || '').toLowerCase();
    const isStructural = roleLabel.includes('dekan') || roleLabel.includes('rektor') || roleLabel.includes('kepala biro');
    return !isStructural && (role === 'DOSEN' || roleLabel.includes('dosen'));
  }, [currentUser, sessionUserJabatan]);

  // Berkas Lampiran Pindaian Surat Keluar
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('Naskah_Dinas_Resmi.pdf');
  const [uploadedFileSize, setUploadedFileSize] = useState('2.4 MB');
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState(null);
  const [isDraggingKeluar, setIsDraggingKeluar] = useState(false);
  const [uploadErrorKeluar, setUploadErrorKeluar] = useState('');
  const fileInputKeluarRef = useRef(null);

  const handleProcessFileKeluar = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadErrorKeluar('Format berkas tidak sesuai. Harap unggah lampiran berformat PDF (.pdf).');
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadErrorKeluar(`Ukuran berkas (${formatFileSize(file.size)}) melebihi batas 5MB. Harap kompres dokumen lampiran terlebih dahulu.`);
      return;
    }
    setUploadErrorKeluar('');
    setUploadedFile(file);
    setUploadedFileName(file.name);
    setUploadedFileSize(formatFileSize(file.size));

    try {
      const objUrl = URL.createObjectURL(file);
      setUploadedFileUrl(objUrl);
    } catch {
      // fallback
    }

    if (file.size <= 2.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFileDataUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputKeluar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFileKeluar(file);
    }
  };

  const handleRemoveFileKeluar = () => {
    setUploadedFile(null);
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedFileUrl(null);
    setUploadedFileDataUrl(null);
    setUploadErrorKeluar('');
    if (fileInputKeluarRef.current) {
      fileInputKeluarRef.current.value = '';
    }
  };

  const handlePreviewFileKeluar = () => {
    if (uploadedFileUrl) {
      window.open(uploadedFileUrl, '_blank', 'noopener,noreferrer');
    } else if (uploadedFileName) {
      window.alert(`Pratinjau Lampiran: "${uploadedFileName}" (${uploadedFileSize})\n\nDokumen lampiran resmi terverifikasi.`);
    }
  };

  // Fetch data master klasifikasi arsip dari backend secara dinamis
  useEffect(() => {
    let isMounted = true;
    fetchKlasifikasiArsip().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setKlasifikasiList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Tutup dropdown pencarian saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sinkronkan unit kerja awal berdasarkan pengguna aktif
  useEffect(() => {
    if (currentUser?.unit_kerja_id) {
      const found = unitKerjaList.find(
        (u) => u.kode_unit === currentUser.unit_kerja_id || u.id === currentUser.unit_kerja_id
      );
      if (found) {
        setSelectedUnitCode(found.kode_unit);
        setPengirim(found.nama_unit);
      }
    }
  }, [currentUser]);

  // Reactive Signatory Binding
  const applySignatory = (typeMeta, preferredRoleOrId = null) => {
    if (!typeMeta || !Array.isArray(typeMeta.available_signatories) || typeMeta.available_signatories.length === 0) {
      return;
    }

    let targetSigner = null;
    const isMandiri = typeMeta.is_mandiri || isMandiriPersonalDocument({
      jenis_naskah: typeMeta.kode_jenis_naskah,
      kode_jenis_naskah: typeMeta.kode_jenis_naskah,
      templateId: selectedTemplateId
    });

    if (preferredRoleOrId) {
      targetSigner = typeMeta.available_signatories.find(
        (s) => String(s.id) === String(preferredRoleOrId) || s.role_penandatangan === preferredRoleOrId
      );
    }

    if (!targetSigner) {
      if (isMandiri) {
        targetSigner =
          typeMeta.available_signatories.find((s) => s.role_penandatangan === 'DOSEN_MANDIRI') ||
          typeMeta.available_signatories[0];
      } else {
        targetSigner =
          typeMeta.default_signatory ||
          typeMeta.available_signatories.find((s) => s.role_penandatangan === 'DEKAN') ||
          typeMeta.available_signatories[0];
      }
    }

    if (targetSigner) {
      setSelectedSignatoryRole(targetSigner.role_penandatangan);
      setSelectedPejabatId(String(targetSigner.id));
      setNamaJabatanSigner(targetSigner.format_an || targetSigner.jabatan);
      setNamaPejabatSigner(targetSigner.nama);
      setGelarSigner(targetSigner.gelar);
      setNipSigner(targetSigner.nip);
    }
  };

  // 2. Fetch Jenis Naskah & Hierarki Penandatanganan Sesuai Tabel 1 dari Backend
  useEffect(() => {
    let isMounted = true;
    setIsLoadingScoping(true);

    fetchAvailableLetterTypes(currentUser, allUsers)
      .then((data) => {
        if (!isMounted) return;
        const types = (data && Array.isArray(data.types) && data.types.length > 0)
          ? data.types
          : FALLBACK_SCOPED_LETTER_TYPES;
        setAvailableNaskahTypes(types);
        setIsLoadingScoping(false);

        // Cari tipe naskah yang aktif berdasarkan selectedTemplateId atau fallback
        const activeTpl = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
        const targetKode = activeTpl?.kode_jenis_naskah;
        const currentMeta =
          types.find((t) => {
            if (selectedTemplateId === 'st_lembar') {
              return t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR' || t.kode_jenis_naskah === 'SURAT_TUGAS';
            }
            if (selectedTemplateId === 'st_kolom') {
              return t.kode_jenis_naskah === 'SURAT_TUGAS_KOLOM' || t.kode_jenis_naskah === 'SURAT_TUGAS';
            }
            return t.kode_jenis_naskah === targetKode;
          }) ||
          types.find((t) => t.kode_jenis_naskah === selectedKodeNaskah) ||
          types[0];

        if (currentMeta) {
          setSelectedKodeNaskah(currentMeta.kode_jenis_naskah);
          applySignatory(currentMeta, selectedSignatoryRole);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Error fetchAvailableLetterTypes:', err);
        setAvailableNaskahTypes(FALLBACK_SCOPED_LETTER_TYPES);
        setIsLoadingScoping(false);
        const activeTpl = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
        const targetKode = activeTpl?.kode_jenis_naskah;
        const currentMeta =
          FALLBACK_SCOPED_LETTER_TYPES.find((t) => {
            if (selectedTemplateId === 'st_lembar') {
              return t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR' || t.kode_jenis_naskah === 'SURAT_TUGAS';
            }
            if (selectedTemplateId === 'st_kolom') {
              return t.kode_jenis_naskah === 'SURAT_TUGAS_KOLOM' || t.kode_jenis_naskah === 'SURAT_TUGAS';
            }
            return t.kode_jenis_naskah === targetKode;
          }) ||
          FALLBACK_SCOPED_LETTER_TYPES.find((t) => t.kode_jenis_naskah === selectedKodeNaskah) ||
          FALLBACK_SCOPED_LETTER_TYPES[0];

        if (currentMeta) {
          applySignatory(currentMeta, selectedSignatoryRole);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, selectedUnitCode, allUsers]);

  const currentTypeMeta = useMemo(() => {
    return (
      availableNaskahTypes.find((t) => t.kode_jenis_naskah === selectedKodeNaskah) ||
      availableNaskahTypes[0] ||
      FALLBACK_SCOPED_LETTER_TYPES[0]
    );
  }, [availableNaskahTypes, selectedKodeNaskah]);

  const isMandiriDoc = useMemo(() => {
    if (!isDosen) return false;
    if (currentTypeMeta?.is_mandiri) return true;
    return isMandiriPersonalDocument({
      jenis_naskah: selectedKodeNaskah,
      kode_jenis_naskah: selectedKodeNaskah,
      templateId: selectedTemplateId
    });
  }, [isDosen, currentTypeMeta, selectedKodeNaskah, selectedTemplateId]);

  const dekanSignatory = useMemo(() => {
    return currentTypeMeta?.available_signatories?.find((s) => s.role_penandatangan === 'DEKAN');
  }, [currentTypeMeta]);

  const kajurSignatory = useMemo(() => {
    return currentTypeMeta?.available_signatories?.find((s) => s.role_penandatangan === 'KETUA_JURUSAN');
  }, [currentTypeMeta]);

  const rektorSignatory = useMemo(() => {
    return currentTypeMeta?.available_signatories?.find((s) => s.role_penandatangan === 'REKTOR');
  }, [currentTypeMeta]);

  const currentSignatoryObj = useMemo(() => {
    if (!currentTypeMeta?.available_signatories) return null;
    return (
      currentTypeMeta.available_signatories.find((s) => String(s.id) === String(selectedPejabatId)) ||
      currentTypeMeta.available_signatories.find((s) => s.role_penandatangan === selectedSignatoryRole) ||
      currentTypeMeta.available_signatories[0] ||
      null
    );
  }, [currentTypeMeta, selectedPejabatId, selectedSignatoryRole]);

  // Handler pemilihan pejabat penandatangan via dropdown select
  const handleSelectSignatory = (signerId) => {
    if (!currentTypeMeta?.available_signatories) return;
    const found = currentTypeMeta.available_signatories.find((s) => String(s.id) === String(signerId));
    if (found) {
      setSelectedSignatoryRole(found.role_penandatangan);
      setSelectedPejabatId(String(found.id));
      setNamaJabatanSigner(found.format_an || found.jabatan);
      setNamaPejabatSigner(found.nama);
      setGelarSigner(found.gelar);
      setNipSigner(found.nip);
    }
  };

  // Handler pemilihan peran penandatangan (kompatibilitas role string)
  const handleSelectSignatoryRole = (role) => {
    setSelectedSignatoryRole(role);
    if (currentTypeMeta) {
      applySignatory(currentTypeMeta, role);
    }
  };

  const activeUnitObj = useMemo(() => {
    return unitKerjaList.find((u) => u.kode_unit === selectedUnitCode) || defaultUnit;
  }, [selectedUnitCode, defaultUnit]);

  const isUnitLocked =
    currentUser?.role === 'OPERATOR_UNIT' || currentUser?.role === 'STAF_PERSURATAN';

  // Rumus Penomoran Resmi Tata Naskah Dinas UNSIL:
  // [nomor_urut_baru]/[kode_unit_kerja]/[tingkat_keamanan]/[kode_klasifikasi]/[tahun]
  const previewNomorSurat = `[No. Otomatis]/${activeUnitObj.kode_unit}/${tingkatKeamanan}/${kodeKlasifikasi}/${currentYear}`;
  const previewNomorAgenda = `AGD-${currentYear}/${activeUnitObj.kode_unit}/[No. Otomatis]`;

  // Filter klasifikasi arsip berdasarkan wewenang klaster JRA pengguna (RBAC Tupoksi) dan pencarian
  const filteredKlasifikasi = useMemo(() => {
    let list = klasifikasiList;
    const allowedPrefixes = currentUser?.allowed_prefixes;
    const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'SUPER_ADMIN';

    // Batasi pilihan JRA hanya pada kode yang diawali oleh salah satu prefix dalam allowed_prefixes
    if (!isSuperAdmin && Array.isArray(allowedPrefixes) && !allowedPrefixes.includes('*') && allowedPrefixes.length > 0) {
      list = list.filter((k) => {
        const code = k.kode_klasifikasi || k.kode_jra || k.kode || '';
        return allowedPrefixes.some((prefix) => code.startsWith(prefix));
      });
    }

    if (!searchKlasifikasi.trim()) return list;
    const q = searchKlasifikasi.toLowerCase();
    return list.filter(
      (k) =>
        k.kode_klasifikasi.toLowerCase().includes(q) ||
        (k.keterangan_klasifikasi && k.keterangan_klasifikasi.toLowerCase().includes(q)) ||
        (k.nama_klasifikasi && k.nama_klasifikasi.toLowerCase().includes(q))
    );
  }, [klasifikasiList, searchKlasifikasi, currentUser]);

  // Deteksi otomatis ukuran kertas PDF berdasarkan jenis naskah (F4 untuk Arahan, A4 untuk lainnya)
  const currentPaperInfo = useMemo(() => {
    return getPaperSizeInfo(selectedTemplateId);
  }, [selectedTemplateId]);

  // Deteksi format khusus naskah dinas resmi UNSIL
  const isStLembar = selectedTemplateId === 'st_lembar' || selectedTemplateId === 'tugas';
  const isStKolom = selectedTemplateId === 'st_kolom';
  const isSuratTugas = isStLembar || isStKolom;
  const isNotaDinas = selectedTemplateId === 'nota-dinas' || selectedTemplateId === 'nd';
  const isSuratPernyataan = selectedTemplateId === 'pernyataan' || selectedTemplateId === 'surat-pernyataan' || selectedTemplateId === 'sper';
  const isBeritaAcara = selectedTemplateId === 'berita-acara' || selectedTemplateId === 'berita_acara' || selectedTemplateId === 'ba';
  const isNotula = selectedTemplateId === 'notula';
  const isLaporan = selectedTemplateId === 'laporan' || selectedTemplateId === 'lap';
  const isTelaahStaf = selectedTemplateId === 'telaah-staf' || selectedTemplateId === 'telaah_staf' || selectedTemplateId === 'ts';
  const isSuratKeterangan = selectedTemplateId === 'keterangan' || selectedTemplateId === 'surat-keterangan' || selectedTemplateId === 'sket';
  const isSuratPengantar = selectedTemplateId === 'pengantar' || selectedTemplateId === 'surat-pengantar' || selectedTemplateId === 'speng';

  // Format tanggal Bahasa Indonesia untuk lembar A4
  const formattedDateA4 = useMemo(() => {
    try {
      const d = new Date(tanggal);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return tanggal;
    }
  }, [tanggal]);

  // Smart Parser untuk Surat Pernyataan (Sesuai Image 2 / Contoh 14 Spesimen Resmi)
  const sperParsed = useMemo(() => {
    if (!isSuratPernyataan) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let nama = '';
    let nip = '';
    let pangkatGolongan = '';
    let jabatan = '';
    let alamat = '';
    const isiLines = [];
    let readingIsi = false;

    lines.forEach((l) => {
      if (/^nama\s*:/i.test(l)) {
        nama = l.replace(/^nama\s*:\s*/i, '');
      } else if (/^nip\s*:/i.test(l)) {
        nip = l.replace(/^nip\s*:\s*/i, '');
      } else if (/^pangkat(?:\s+dan\s+golongan)?\s*:/i.test(l)) {
        pangkatGolongan = l.replace(/^pangkat(?:\s+dan\s+golongan)?\s*:\s*/i, '');
      } else if (/^jabatan\s*:/i.test(l)) {
        jabatan = l.replace(/^jabatan\s*:\s*/i, '');
      } else if (/^alamat\s*:/i.test(l)) {
        alamat = l.replace(/^alamat\s*:\s*/i, '');
      } else if (/^isi(?:\s+pernyataan)?\s*:?/i.test(l)) {
        readingIsi = true;
        const remaining = l.replace(/^isi(?:\s+pernyataan)?\s*:?\s*/i, '');
        if (remaining) isiLines.push(remaining);
      } else if (readingIsi) {
        isiLines.push(l);
      } else {
        isiLines.push(l);
      }
    });

    return {
      nama: nama || (isiLines.length === 0 ? '' : currentUser?.nama_lengkap || ''),
      nip: nip || (isiLines.length === 0 ? '' : currentUser?.nip || ''),
      pangkatGolongan: pangkatGolongan || '',
      jabatan: jabatan || '',
      alamat: alamat || '',
      isiPernyataan: isiLines.join('\n')
    };
  }, [isSuratPernyataan, isiPokok, currentUser]);

  // Smart Parser untuk Berita Acara (Sesuai Contoh 12 Spesimen Resmi)
  const baParsed = useMemo(() => {
    if (!isBeritaAcara) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let pihak1 = '';
    let pihak2 = '';
    const kegiatanList = [];
    let dasar = '';
    let readingKegiatan = false;
    let readingDasar = false;

    lines.forEach((l) => {
      if (/^1[\.\)]\s+/i.test(l) && /pihak\s+pertama/i.test(l)) {
        pihak1 = l.replace(/^1[\.\)]\s+/i, '');
        return;
      }
      if (/^2[\.\)]\s+/i.test(l) && /pihak\s+kedua/i.test(l)) {
        pihak2 = l.replace(/^2[\.\)]\s+/i, '');
        return;
      }
      if (/^telah\s+melaksanakan/i.test(l)) {
        readingKegiatan = true;
        readingDasar = false;
        const s = l.replace(/^telah\s+melaksanakan\s*:?\s*/i, '');
        if (s) kegiatanList.push(s);
        return;
      }
      if (/^berdasarkan\s*:/i.test(l) || /berita\s+acara\s+ini\s+dibuat\s+dengan\s+sesungguhnya\s+berdasarkan/i.test(l)) {
        readingDasar = true;
        readingKegiatan = false;
        dasar = l.replace(/^(?:berdasarkan|berita\s+acara\s+ini\s+dibuat\s+dengan\s+sesungguhnya\s+berdasarkan)\s*:?\s*/i, '');
        return;
      }

      if (readingDasar) {
        dasar += ` ${l}`;
      } else if (readingKegiatan) {
        kegiatanList.push(l);
      } else {
        if (/pihak\s+pertama/i.test(l)) pihak1 = l;
        else if (/pihak\s+kedua/i.test(l)) pihak2 = l;
        else kegiatanList.push(l);
      }
    });

    return {
      pihak1,
      pihak2,
      kegiatanList,
      dasar: dasar || perihal
    };
  }, [isBeritaAcara, isiPokok, perihal]);

  // Smart Parser untuk Surat Tugas Format Lembaran (Image 1 / Gambar 2 Spesimen Resmi)
  const stLembarParsed = useMemo(() => {
    if (!isStLembar) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let nama = '';
    let nip = '';
    let pangkatGolongan = '';
    let jabatan = '';
    let untukTugas = '';
    const otherLines = [];

    lines.forEach((l) => {
      if (/^nama\s*:/i.test(l)) {
        nama = l.replace(/^nama\s*:\s*/i, '');
      } else if (/^nip\s*:/i.test(l)) {
        nip = l.replace(/^nip\s*:\s*/i, '');
      } else if (/^pangkat(?:\s+dan\s+golongan)?\s*:/i.test(l)) {
        pangkatGolongan = l.replace(/^pangkat(?:\s+dan\s+golongan)?\s*:\s*/i, '');
      } else if (/^jabatan\s*:/i.test(l)) {
        jabatan = l.replace(/^jabatan\s*:\s*/i, '');
      } else if (/^untuk\s*:/i.test(l)) {
        untukTugas = l.replace(/^untuk\s*:\s*/i, '');
      } else {
        otherLines.push(l);
      }
    });

    // Fallback jika diketik teks berurutan tanpa label
    if (!nama && otherLines[0]) nama = otherLines[0];
    if (!nip && otherLines[1]) nip = otherLines[1];
    if (!pangkatGolongan && otherLines[2]) pangkatGolongan = otherLines[2];
    if (!jabatan && otherLines[3]) jabatan = otherLines[3];
    if (!untukTugas && otherLines.length > 4) {
      untukTugas = otherLines.slice(4).join(' ');
    } else if (!untukTugas && otherLines.length > 0 && (nama || nip || pangkatGolongan || jabatan)) {
      const remaining = otherLines.filter(
        (line) => line !== nama && line !== nip && line !== pangkatGolongan && line !== jabatan
      );
      if (remaining.length > 0) untukTugas = remaining.join(' ');
    }

    return {
      nama,
      nip,
      pangkatGolongan,
      jabatan,
      untukTugas: untukTugas || (otherLines.length === 0 && !nama ? '' : '')
    };
  }, [isStLembar, isiPokok]);

  // Smart Parser untuk Surat Tugas Format Kolom (Image 2 / Gambar 3 Spesimen Resmi)
  const stKolomParsed = useMemo(() => {
    if (!isStKolom) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    const pesertaList = [];
    let untukTugas = '';
    const nonTableLines = [];

    lines.forEach((l) => {
      if (/^untuk\s*:/i.test(l)) {
        untukTugas = l.replace(/^untuk\s*:\s*/i, '');
        return;
      }

      // Baris tabel dengan delimiter pipe: "1. Nama | NIP | Pangkat | Jabatan"
      if (l.includes('|')) {
        const parts = l.split('|').map((p) => p.trim());
        const rawNoAndName = parts[0] || '';
        const noMatch = rawNoAndName.match(/^(\d+)[\.\)]\s*(.+)$/);
        const no = noMatch ? parseInt(noMatch[1], 10) : pesertaList.length + 1;
        const nama = noMatch ? noMatch[2] : rawNoAndName;
        const nip = (parts[1] || '').replace(/^nip\s*/i, '');
        const pangkatGolongan = parts[2] || '';
        const jabatan = parts[3] || '';

        pesertaList.push({
          no,
          nama,
          nip,
          pangkatGolongan,
          jabatan
        });
      } else {
        const listMatch = l.match(/^(\d+)[\.\)]\s*(.+)$/);
        if (listMatch) {
          pesertaList.push({
            no: parseInt(listMatch[1], 10),
            nama: listMatch[2],
            nip: '',
            pangkatGolongan: '',
            jabatan: ''
          });
        } else {
          nonTableLines.push(l);
        }
      }
    });

    if (!untukTugas && nonTableLines.length > 0) {
      untukTugas = nonTableLines.join(' ');
    }

    return {
      pesertaList,
      untukTugas
    };
  }, [isStKolom, isiPokok]);

  // Smart Parser untuk Surat Keterangan (Sesuai Contoh 15 / Gambar 4 Spesimen Resmi)
  const sketParsed = useMemo(() => {
    if (!isSuratKeterangan) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let pejabatNama = '';
    let pejabatNip = '';
    let pejabatPangkatGol = '';
    let pejabatJabatan = '';
    let pegawaiNama = '';
    let pegawaiNip = '';
    let pegawaiPangkatGol = '';
    let pegawaiJabatan = '';
    const isiLines = [];
    let phase = 'pejabat'; // 'pejabat' | 'pegawai' | 'isi'

    lines.forEach((l) => {
      if (/^dengan ini menerangkan bahwa/i.test(l)) {
        phase = 'pegawai';
        return;
      }
      if (/^isi(?:\s+keterangan)?\s*:?/i.test(l)) {
        phase = 'isi';
        const remaining = l.replace(/^isi(?:\s+keterangan)?\s*:?\s*/i, '');
        if (remaining) isiLines.push(remaining);
        return;
      }

      if (phase === 'pejabat') {
        if (/^nama\s*:/i.test(l)) pejabatNama = l.replace(/^nama\s*:\s*/i, '');
        else if (/^nip\s*:/i.test(l)) pejabatNip = l.replace(/^nip\s*:\s*/i, '');
        else if (/^pangkat(?:\s+dan\s+golongan)?\s*:/i.test(l)) pejabatPangkatGol = l.replace(/^pangkat(?:\s+dan\s+golongan)?\s*:\s*/i, '');
        else if (/^jabatan\s*:/i.test(l)) pejabatJabatan = l.replace(/^jabatan\s*:\s*/i, '');
        else isiLines.push(l);
      } else if (phase === 'pegawai') {
        if (/^nama\s*:/i.test(l)) pegawaiNama = l.replace(/^nama\s*:\s*/i, '');
        else if (/^nip\s*:/i.test(l)) pegawaiNip = l.replace(/^nip\s*:\s*/i, '');
        else if (/^pangkat(?:\s+dan\s+golongan)?\s*:/i.test(l)) pegawaiPangkatGol = l.replace(/^pangkat(?:\s+dan\s+golongan)?\s*:\s*/i, '');
        else if (/^jabatan\s*:/i.test(l)) pegawaiJabatan = l.replace(/^jabatan\s*:\s*/i, '');
        else isiLines.push(l);
      } else {
        isiLines.push(l);
      }
    });

    return {
      pejabatNama: pejabatNama || namaPejabatSigner || '',
      pejabatNip: pejabatNip || nipSigner || '',
      pejabatPangkatGol: pejabatPangkatGol || '',
      pejabatJabatan: pejabatJabatan || namaJabatanSigner || '',
      pegawaiNama: pegawaiNama || (tujuan && tujuan !== 'Pihak yang Berkepentingan' ? tujuan : ''),
      pegawaiNip: pegawaiNip || '',
      pegawaiPangkatGol: pegawaiPangkatGol || '',
      pegawaiJabatan: pegawaiJabatan || '',
      isiKeterangan: isiLines.join('\n')
    };
  }, [isSuratKeterangan, isiPokok, namaPejabatSigner, nipSigner, namaJabatanSigner, tujuan]);

  // Smart Parser untuk Surat Pengantar (Sesuai Contoh 17 / Gambar 5 Spesimen Resmi)
  const spengParsed = useMemo(() => {
    if (!isSuratPengantar) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    const items = [];

    lines.forEach((l) => {
      if (l.includes('|')) {
        const parts = l.split('|').map((p) => p.trim());
        const rawJenis = parts[0] || '';
        const cleanJenis = rawJenis.replace(/^\d+[\.\)]\s*/, '');
        const jumlah = parts[1] || '';
        const keterangan = parts[2] || '';
        items.push({ jenis: cleanJenis, jumlah, keterangan });
      } else if (l.includes(' - ')) {
        const parts = l.split(' - ').map((p) => p.trim());
        const rawJenis = parts[0] || '';
        const cleanJenis = rawJenis.replace(/^\d+[\.\)]\s*/, '');
        const jumlah = parts[1] || '';
        const keterangan = parts.slice(2).join(' - ') || '';
        items.push({ jenis: cleanJenis, jumlah, keterangan });
      } else if (/^\d+[\.\)]\s*/.test(l)) {
        const cleanJenis = l.replace(/^\d+[\.\)]\s*/, '');
        items.push({ jenis: cleanJenis, jumlah: '1 (satu) berkas', keterangan: '-' });
      } else if (l.length > 5) {
        items.push({ jenis: l, jumlah: '1 (satu) berkas', keterangan: '-' });
      }
    });

    return { items };
  }, [isSuratPengantar, isiPokok]);

  // Smart Parser untuk Notula (Sesuai Contoh 19 / Gambar 1 Spesimen Resmi)
  const notulaParsed = useMemo(() => {
    if (!isNotula) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let namaRapat = '';
    let hariTanggal = '';
    let pukul = '';
    let tempat = '';
    const susunanAcara = [];
    let pemimpinRapat = '';
    let notulis = '';
    const pesertaRapat = [];
    let persoalanDibahas = '';
    let tanggapanPeserta = '';
    let simpulan = '';

    let section = 'meta';

    lines.forEach((l) => {
      if (/^nama\s*rapat\s*:/i.test(l)) {
        namaRapat = l.replace(/^nama\s*rapat\s*:\s*/i, '');
        return;
      }
      if (/^hari[,\s]+tanggal\s*:/i.test(l)) {
        hariTanggal = l.replace(/^hari[,\s]+tanggal\s*:\s*/i, '');
        return;
      }
      if (/^pukul\s*:/i.test(l)) {
        pukul = l.replace(/^pukul\s*:\s*/i, '');
        return;
      }
      if (/^tempat\s*:/i.test(l)) {
        tempat = l.replace(/^tempat\s*:\s*/i, '');
        return;
      }
      if (/^susunan\s*acara\s*:?/i.test(l)) {
        section = 'susunan';
        return;
      }
      if (/^pemimpin\s*rapat\s*:/i.test(l)) {
        pemimpinRapat = l.replace(/^pemimpin\s*rapat\s*:\s*/i, '');
        section = 'meta';
        return;
      }
      if (/^(?:pencatat\/notulis|notulis)\s*:/i.test(l)) {
        notulis = l.replace(/^(?:pencatat\/notulis|notulis)\s*:\s*/i, '');
        section = 'meta';
        return;
      }
      if (/^peserta\s*rapat\s*:?/i.test(l)) {
        section = 'peserta';
        return;
      }
      if (/^1[\.\)]\s*persoalan\s*(?:yang\s+dibahas)?\s*:/i.test(l)) {
        persoalanDibahas = l.replace(/^1[\.\)]\s*persoalan\s*(?:yang\s+dibahas)?\s*:\s*/i, '');
        section = 'persoalan';
        return;
      }
      if (/^2[\.\)]\s*tanggapan\s*(?:peserta\s*rapat)?\s*:/i.test(l)) {
        tanggapanPeserta = l.replace(/^2[\.\)]\s*tanggapan\s*(?:peserta\s*rapat)?\s*:\s*/i, '');
        section = 'tanggapan';
        return;
      }
      if (/^3[\.\)]\s*simpulan\s*:/i.test(l)) {
        simpulan = l.replace(/^3[\.\)]\s*simpulan\s*:\s*/i, '');
        section = 'simpulan';
        return;
      }

      if (section === 'susunan') {
        susunanAcara.push(l.replace(/^\d+[\.\)]\s*/, ''));
      } else if (section === 'peserta') {
        pesertaRapat.push(l.replace(/^\d+[\.\)]\s*/, ''));
      } else if (section === 'persoalan') {
        persoalanDibahas += (persoalanDibahas ? ' ' : '') + l;
      } else if (section === 'tanggapan') {
        tanggapanPeserta += (tanggapanPeserta ? ' ' : '') + l;
      } else if (section === 'simpulan') {
        simpulan += (simpulan ? ' ' : '') + l;
      }
    });

    return {
      namaRapat: namaRapat || perihal,
      hariTanggal: hariTanggal || formattedDateA4,
      pukul: pukul || '09.00 - 12.00 WIB',
      tempat: tempat || (alamatTujuan || 'Universitas Siliwangi'),
      susunanAcara,
      pemimpinRapat: pemimpinRapat || namaPejabatSigner || '',
      notulis: notulis || currentUser?.nama_lengkap || '',
      pesertaRapat,
      persoalanDibahas,
      tanggapanPeserta,
      simpulan
    };
  }, [isNotula, isiPokok, perihal, formattedDateA4, alamatTujuan, namaPejabatSigner, currentUser]);

  // Smart Parser untuk Laporan (Sesuai Contoh 20 / Gambar 2 Spesimen Resmi)
  const lapParsed = useMemo(() => {
    if (!isLaporan) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let latarBelakang = '';
    let dasar = '';
    let ruangLingkup = '';
    let kegiatanDilaksanakan = '';
    let hasilDicapai = '';
    let penutup = '';

    let curSec = '';

    lines.forEach((l) => {
      if (/^1[\.\)]\s*latar\s*belakang\s*:?/i.test(l)) {
        curSec = 'latarBelakang';
        const rem = l.replace(/^1[\.\)]\s*latar\s*belakang\s*:?\s*/i, '');
        if (rem) latarBelakang = rem;
        return;
      }
      if (/^2[\.\)]\s*dasar\s*:?/i.test(l)) {
        curSec = 'dasar';
        const rem = l.replace(/^2[\.\)]\s*dasar\s*:?\s*/i, '');
        if (rem) dasar = rem;
        return;
      }
      if (/^3[\.\)]\s*ruang\s*lingkup\s*:?/i.test(l)) {
        curSec = 'ruangLingkup';
        const rem = l.replace(/^3[\.\)]\s*ruang\s*lingkup\s*:?\s*/i, '');
        if (rem) ruangLingkup = rem;
        return;
      }
      if (/^[bB][\.\)]\s*kegiatan/i.test(l)) {
        curSec = 'kegiatan';
        const rem = l.replace(/^[bB][\.\)]\s*kegiatan(?:\s+yang\s+dilaksanakan)?\s*:?\s*/i, '');
        if (rem) kegiatanDilaksanakan = rem;
        return;
      }
      if (/^[cC][\.\)]\s*hasil/i.test(l)) {
        curSec = 'hasil';
        const rem = l.replace(/^[cC][\.\)]\s*hasil(?:\s+yang\s+dicapai)?\s*:?\s*/i, '');
        if (rem) hasilDicapai = rem;
        return;
      }
      if (/^[dD][\.\)]\s*penutup/i.test(l)) {
        curSec = 'penutup';
        const rem = l.replace(/^[dD][\.\)]\s*penutup\s*:?\s*/i, '');
        if (rem) penutup = rem;
        return;
      }

      if (curSec === 'latarBelakang') latarBelakang += (latarBelakang ? '\n' : '') + l;
      else if (curSec === 'dasar') dasar += (dasar ? '\n' : '') + l;
      else if (curSec === 'ruangLingkup') ruangLingkup += (ruangLingkup ? '\n' : '') + l;
      else if (curSec === 'kegiatan') kegiatanDilaksanakan += (kegiatanDilaksanakan ? '\n' : '') + l;
      else if (curSec === 'hasil') hasilDicapai += (hasilDicapai ? '\n' : '') + l;
      else if (curSec === 'penutup') penutup += (penutup ? '\n' : '') + l;
      else {
        if (!latarBelakang) latarBelakang = l;
      }
    });

    return {
      tentang: perihal,
      latarBelakang,
      dasar,
      ruangLingkup,
      kegiatanDilaksanakan,
      hasilDicapai,
      penutup: penutup || kalimatPenutup
    };
  }, [isLaporan, isiPokok, perihal, kalimatPenutup]);

  // Smart Parser untuk Telaah Staf (Sesuai Contoh 21 / Gambar 3 Spesimen Resmi)
  const tsParsed = useMemo(() => {
    if (!isTelaahStaf) return null;
    const lines = isiPokok ? isiPokok.split('\n').map((l) => l.trim()).filter(Boolean) : [];
    let kepada = '';
    let dari = '';
    let tanggal = '';
    let nomor = '';
    let lampiranStr = '';
    let hal = '';
    let persoalan = '';
    let pranggapan = '';
    let faktaMempengaruhi = '';
    let analisis = '';
    let simpulan = '';
    let saran = '';

    let curSec = '';

    lines.forEach((l) => {
      if (/^kepada\s*:/i.test(l)) {
        kepada = l.replace(/^kepada\s*:\s*/i, '');
        return;
      }
      if (/^dari\s*:/i.test(l)) {
        dari = l.replace(/^dari\s*:\s*/i, '');
        return;
      }
      if (/^tanggal\s*:/i.test(l)) {
        tanggal = l.replace(/^tanggal\s*:\s*/i, '');
        return;
      }
      if (/^nomor\s*:/i.test(l)) {
        nomor = l.replace(/^nomor\s*:\s*/i, '');
        return;
      }
      if (/^lampiran\s*:/i.test(l)) {
        lampiranStr = l.replace(/^lampiran\s*:\s*/i, '');
        return;
      }
      if (/^hal\s*:/i.test(l)) {
        hal = l.replace(/^hal\s*:\s*/i, '');
        return;
      }

      if (/^I[\.\)]\s*persoalan/i.test(l)) {
        curSec = 'persoalan';
        const rem = l.replace(/^I[\.\)]\s*persoalan\s*:?\s*/i, '');
        if (rem) persoalan = rem;
        return;
      }
      if (/^II[\.\)]\s*pra?anggapan/i.test(l)) {
        curSec = 'pranggapan';
        const rem = l.replace(/^II[\.\)]\s*pra?anggapan\s*:?\s*/i, '');
        if (rem) pranggapan = rem;
        return;
      }
      if (/^III[\.\)]\s*fakta/i.test(l)) {
        curSec = 'fakta';
        const rem = l.replace(/^III[\.\)]\s*fakta(?:-fakta)?(?:\s+yang\s+mempengaruhi)?\s*:?\s*/i, '');
        if (rem) faktaMempengaruhi = rem;
        return;
      }
      if (/^IV[\.\)]\s*analisis/i.test(l)) {
        curSec = 'analisis';
        const rem = l.replace(/^IV[\.\)]\s*analisis\s*:?\s*/i, '');
        if (rem) analisis = rem;
        return;
      }
      if (/^V[\.\)]\s*simpulan/i.test(l)) {
        curSec = 'simpulan';
        const rem = l.replace(/^V[\.\)]\s*simpulan\s*:?\s*/i, '');
        if (rem) simpulan = rem;
        return;
      }
      if (/^VI[\.\)]\s*saran/i.test(l)) {
        curSec = 'saran';
        const rem = l.replace(/^VI[\.\)]\s*saran\s*:?\s*/i, '');
        if (rem) saran = rem;
        return;
      }

      if (curSec === 'persoalan') persoalan += (persoalan ? '\n' : '') + l;
      else if (curSec === 'pranggapan') pranggapan += (pranggapan ? '\n' : '') + l;
      else if (curSec === 'fakta') faktaMempengaruhi += (faktaMempengaruhi ? '\n' : '') + l;
      else if (curSec === 'analisis') analisis += (analisis ? '\n' : '') + l;
      else if (curSec === 'simpulan') simpulan += (simpulan ? '\n' : '') + l;
      else if (curSec === 'saran') saran += (saran ? '\n' : '') + l;
    });

    return {
      tentang: perihal,
      kepada: kepada || tujuan,
      dari: dari || pengirim,
      tanggal: tanggal || formattedDateA4,
      nomor: nomor || previewNomorSurat,
      lampiran: lampiranStr || lampiran,
      hal: hal || perihal,
      persoalan,
      pranggapan,
      faktaMempengaruhi,
      analisis,
      simpulan,
      saran
    };
  }, [isTelaahStaf, isiPokok, perihal, tujuan, pengirim, formattedDateA4, previewNomorSurat, lampiran]);

  // Format Kop Surat Dinamis resmi sesuai Pasal 30(2) & Pasal 31(1,2,6) Peraturan Rektor No. 3/2023
  const kopConfig = useMemo(() => {
    return determineKopSurat(activeUnitObj || currentUser);
  }, [activeUnitObj, currentUser]);

  // Handler pergantian template (hanya menyinkronkan metadata template, tidak menimpa teks yang telah diketik)
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.defaultKlasifikasi) {
      setKodeKlasifikasi(tpl.defaultKlasifikasi);
    }
    if (tpl.kode_jenis_naskah) {
      const meta = availableNaskahTypes.find((t) => {
        if (tpl.id === 'st_lembar') {
          return t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR' || t.kode_jenis_naskah === 'SURAT_TUGAS';
        }
        if (tpl.id === 'st_kolom') {
          return t.kode_jenis_naskah === 'SURAT_TUGAS_KOLOM' || t.kode_jenis_naskah === 'SURAT_TUGAS';
        }
        return (
          t.kode_jenis_naskah === tpl.kode_jenis_naskah ||
          (tpl.kode_jenis_naskah === 'SURAT_TUGAS' && t.kode_jenis_naskah.startsWith('SURAT_TUGAS'))
        );
      });
      if (meta) {
        setSelectedKodeNaskah(meta.kode_jenis_naskah);
        applySignatory(meta, selectedSignatoryRole);
      } else {
        setSelectedKodeNaskah(tpl.kode_jenis_naskah);
      }
    }
  };

  // Helper memuat draf contoh kalimat resmi UNSIL atau mengosongkan kembali form
  const hasCustomContent = Boolean(perihal || kalimatPembuka || isiPokok || tujuan || alamatTujuan);

  const loadSampleDraft = () => {
    const activeTpl = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
    setPerihal(activeTpl.defaultPerihal || '');
    setTujuan(activeTpl.defaultTujuan || '');
    setAlamatTujuan(activeTpl.defaultAlamatTujuan || '');
    setKalimatPembuka(activeTpl.defaultPembuka || '');
    setIsiPokok(activeTpl.defaultIsi || '');
    setKalimatPenutup(activeTpl.defaultPenutup || '');
    if (isSuratTugas || isSuratPernyataan || isBeritaAcara) {
      setLampiran('-');
      setTembusanText('');
    } else if (isNotaDinas) {
      setLampiran('-');
      setTembusanText('Wakil Rektor Bidang Keuangan dan Umum\nKetua Satuan Pengawas Internal (SPI)');
    } else {
      setLampiran('1 (satu) Berkas');
      setTembusanText('Rektor Universitas Siliwangi (sebagai laporan)\nKepala Satuan Pengawas Internal (SPI)');
    }
  };

  const clearDraft = () => {
    setPerihal('');
    setTujuan('');
    setAlamatTujuan('');
    setKalimatPembuka('');
    setIsiPokok('');
    setKalimatPenutup('');
    setLampiran('-');
    setTembusanText('');
  };

  const [securityTriggerMeta, setSecurityTriggerMeta] = useState({
    isRestrictedSecret: false,
    tingkatKeamanan: 'B',
    isPrintBlocked: false,
    authorizedPrintOverride: false
  });

  const handlePrint = () => {
    const activeSecret = securityTriggerMeta.isPrintBlocked || (tingkatKeamanan !== 'B' && !securityTriggerMeta.authorizedPrintOverride);
    if (activeSecret) {
      window.alert(
        `PEMBLOKIRAN OPSI CETAK UMUM AKTIF (${
          tingkatKeamanan === 'SR' ? 'SANGAT RAHASIA - SR' : 'RAHASIA - R'
        }):\n\nSesuai SK Rektor UNSIL Nomor 2803 Tahun 2023 (SKKAAD), dokumen berkategori Rahasia/Sangat Rahasia wajib menggunakan Amplop Rangkap Dua dan dibatasi hak akses cetaknya.\n\nAktifkan centang "Otorisasi Cetak Khusus Pejabat Berwenang" pada Panel Pengamanan terlebih dahulu.`
      );
      return;
    }

    printDocument(
      'siloka-create-letter-a4-preview',
      `Naskah_Dinas_${previewNomorSurat.replace(/\//g, '_')}`,
      {
        paperSize: currentPaperInfo.code,
        templateId: selectedTemplateId
      }
    );
  };

  const handleSubmit = async (e, targetStatus = 'Dikirim') => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. REGISTRASI SURAT MASUK (EKSTERNAL)
    if (letterType === 'surat-masuk') {
      const finalNomorSuratAsal = nomorSuratAsalMasuk.trim() || '1204/B/LLDIKTI4/KL/2026';
      const finalPengirim = pengirimMasuk.trim() || 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi';
      const finalPerihal = perihalMasuk.trim() || 'Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU';
      const targetPejabat = tujuanPejabatMode === 'SELECT' ? selectedPejabatObj : null;
      const finalTujuanMasuk = tujuanPejabatMode === 'SELECT'
        ? (selectedPejabatObj?.jabatan || 'Rektor Universitas Siliwangi')
        : (customTujuanMasuk.trim() || tujuanMasuk.trim() || 'Rektor Universitas Siliwangi');

      const isTujuanRektor =
        (finalTujuanMasuk.toLowerCase().includes('rektor') &&
          !finalTujuanMasuk.toLowerCase().includes('wakil') &&
          !finalTujuanMasuk.toLowerCase().includes('warek')) ||
        selectedPejabatObj?.id === 'usr-01' ||
        selectedPejabatObj?.user_id === 'usr-01';

      const resolvedTargetUserId = targetPejabat?.user_id || targetPejabat?.id || (isTujuanRektor ? 'usr-01' : null);
      const resolvedTargetEmail = targetPejabat?.user_email || (isTujuanRektor ? 'aripin@unsil.ac.id' : null);
      const resolvedTargetNip = targetPejabat?.nip || (isTujuanRektor ? '196708161996031001' : null);
      const resolvedTargetNama = targetPejabat?.nama_gelar || (isTujuanRektor ? 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.' : null);
      const resolvedTargetRole = targetPejabat?.role || (isTujuanRektor ? 'REKTOR' : 'PEJABAT');
      const resolvedTargetRoleSlug = targetPejabat?.role_slug || (isTujuanRektor ? 'rektor' : 'pimpinan');
      const resolvedTargetUnitCode = targetPejabat?.kode_unit || (isTujuanRektor ? 'UN58' : (activeUnitObj.kode_unit || 'UN58'));
      const resolvedTargetUnitNama = targetPejabat?.unit_nama || (isTujuanRektor ? 'Universitas Siliwangi (Rektorat)' : (activeUnitObj.nama_unit || 'UNSIL'));

      const creatorId = String(currentUser?.id || currentUser?.id_user || 'usr-ac-01');
      const creatorName = currentUser?.nama_lengkap || currentUser?.nama || currentUser?.name || 'Agung Cahya Nur, S.Pd., M.Pd.';
      const creatorJabatan = currentUser?.jabatan || currentUser?.roleLabel || 'Pengadministrasi Persuratan / Tata Usaha';

      setIsSaving(true);
      try {
        const targetUnitCode = resolvedTargetUnitCode;
        const res = await saveInboundLetter(
          {
            tingkat_keamanan: tingkatKeamanan,
            kode_klasifikasi: kodeKlasifikasi,
            perihal: finalPerihal,
            pengirim: finalPengirim,
            tujuan: finalTujuanMasuk,
            target_user_id: resolvedTargetUserId,
            target_user_email: resolvedTargetEmail,
            target_pejabat_id: resolvedTargetUserId,
            target_pejabat_nip: resolvedTargetNip,
            target_pejabat_nama: resolvedTargetNama,
            target_jabatan: finalTujuanMasuk,
            target_role: resolvedTargetRole,
            target_role_slug: resolvedTargetRoleSlug,
            target_unit_id: targetUnitCode,
            target_unit_nama: resolvedTargetUnitNama,
            nomor_surat_asal: finalNomorSuratAsal,
            tujuan_aksi: 'DISPOSISI',
            tahun: currentYear,
            unit_kerja_id: targetUnitCode,
            loket_unit_id: activeUnitObj.kode_unit || 'UN58'
          },
          currentUser
        );

        const savedData = res?.data || {
          id_surat: Date.now(),
          nomor_urut: 1,
          nomor_agenda: `AGD-${currentYear}/${targetUnitCode}/0001`
        };
        const officialAgenda = savedData.nomor_agenda;
        const seqStr = String(savedData.nomor_urut || 1).padStart(4, '0');

        // Menyiapkan lembar instruksi disposisi HANYA jika pengguna adalah Pejabat/Pimpinan yang berwenang
        const finalizedDisposisiActions = isOfficialAuthorizedForDisposisi
          ? disposisiActionsMasuk.map((act) => {
              if (act.includes('Koordinasikan dengan') && disposisiKoordinasiDetail.trim()) {
                return `Koordinasikan dengan ${disposisiKoordinasiDetail.trim()}`;
              }
              if ((act.includes('Lainnya') || act.startsWith('...')) && disposisiLainnyaDetail.trim()) {
                return `Instruksi Lainnya: ${disposisiLainnyaDetail.trim()}`;
              }
              return act;
            })
          : [];

        const hasDisposisi = isOfficialAuthorizedForDisposisi && finalizedDisposisiActions.length > 0;
        const targetDisposisiFinal = disposisiTargetUnit || finalTujuanMasuk || 'Pimpinan Unit';
        const disposisiPayload = hasDisposisi ? {
          nomorAgenda: officialAgenda,
          tujuanDisposisi: targetDisposisiFinal,
          targetUnit: targetDisposisiFinal,
          actions: finalizedDisposisiActions,
          instruksi: finalizedDisposisiActions.join(', ') + (disposisiCatatanTambahan.trim() ? ' — Catatan: ' + disposisiCatatanTambahan.trim() : ''),
          batasWaktu: disposisiDueDate,
          sifatInstruksi: sifatSuratMasuk,
          customNote: disposisiCatatanTambahan.trim() || null,
          pemberiDisposisi: effectiveCurrentUser?.nama_lengkap || effectiveCurrentUser?.name || currentUser?.nama_lengkap || currentUser?.name || 'Pimpinan Unit',
          jabatanPemberi: effectiveCurrentUser?.jabatan || effectiveCurrentUser?.roleLabel || currentUser?.jabatan || 'Pejabat Penerima',
          tanggalDisposisi: new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
        } : null;

        let fileDataUrlMasuk = uploadedFileDataUrlMasuk || uploadedFileUrlMasuk || null;
        if (uploadedFileMasuk && !fileDataUrlMasuk) {
          try {
            fileDataUrlMasuk = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(uploadedFileMasuk);
            });
          } catch (e) {
            console.warn('Could not read uploadedFileMasuk as dataUrl:', e);
          }
        }

        const finalLampiranName = uploadedFileNameMasuk || (uploadedFileMasuk ? uploadedFileMasuk.name : 'Naskah_Surat_Masuk_Eksternal.pdf');
        const finalLampiranSize = uploadedFileSizeMasuk || '2.4 MB';

        onSaveLetter({
          id: `SRT-IN-${currentYear}-${seqStr}`,
          id_surat: savedData.id_surat || Date.now(),
          nomorSurat: officialAgenda,
          nomorAgenda: officialAgenda,
          nomor_urut: savedData.nomor_urut || 1,
          nomorSuratAsal: finalNomorSuratAsal,
          nomor_surat_asal: finalNomorSuratAsal,
          tanggal: tanggalSuratMasuk,
          tanggalTerima: tanggalTerimaMasuk,
          tanggalRegistrasi: tanggalTerimaMasuk || tanggalSuratMasuk,
          perihal: finalPerihal,
          kategori: 'Surat Masuk',
          templateType: 'surat-masuk',
          isSuratMasuk: true,
          sifat: sifatSuratMasuk,
          kategoriKeamanan: tingkatKeamanan === 'B' ? 'Biasa/Terbuka' : tingkatKeamanan === 'R' ? 'Rahasia' : 'Sangat Rahasia',
          tingkat_keamanan: tingkatKeamanan,
          kodeKlasifikasi,
          subKlasifikasi: kodeKlasifikasi,
          pengirim: finalPengirim,
          asal_surat: finalPengirim,
          tujuan: finalTujuanMasuk,
          penerima: finalTujuanMasuk,
          target_user_id: resolvedTargetUserId,
          target_user_email: resolvedTargetEmail,
          target_pejabat_id: resolvedTargetUserId,
          target_pejabat_nip: resolvedTargetNip,
          target_pejabat_nama: resolvedTargetNama,
          target_jabatan: finalTujuanMasuk,
          target_role: resolvedTargetRole,
          target_role_slug: resolvedTargetRoleSlug,
          target_unit_id: targetUnitCode,
          target_unit_nama: resolvedTargetUnitNama,
          ringkasan: ringkasanMasuk.trim() || finalPerihal,
          lampiran: `${finalLampiranName} (${finalLampiranSize})`,
          lampiranUrl: fileDataUrlMasuk,
          lampiranName: finalLampiranName,
          lampiranSize: finalLampiranSize,
          status: hasDisposisi ? 'Didisposisikan' : 'Diterima',
          statusTimestamp: hasDisposisi
            ? `Didisposisikan kepada ${targetDisposisiFinal} (Arahan: ${finalizedDisposisiActions.slice(0, 2).join(', ')})`
            : `Surat Masuk terdaftar pada Buku Agenda SILOKA — Diteruskan ke ${finalTujuanMasuk}`,
          tujuan_aksi: 'DISPOSISI',
          isSignatureRequest: false,
          tteVerified: false,
          unit_kerja_id: targetUnitCode,
          loket_unit_id: activeUnitObj.kode_unit || 'UN58',
          created_by_user_id: creatorId,
          creator_id: creatorId,
          creator_name: creatorName,
          creator_jabatan: creatorJabatan,
          created_at: new Date().toISOString(),
          riwayatParaf: [
            {
              nama: creatorName,
              jabatan: creatorJabatan,
              waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
              catatan: `Registrasi Surat Masuk Eksternal (No. Asal: ${finalNomorSuratAsal}) - Agenda: ${officialAgenda} - Sifat: ${sifatSuratMasuk} [Tujuan: ${finalTujuanMasuk}]` + (hasDisposisi ? ` — Lembar Disposisi Diterbitkan ke ${targetDisposisiFinal}` : '')
            }
          ],
          disposisi: disposisiPayload
        });

        onClose();
      } catch (err) {
        console.error('[SUBMIT-SURAT-MASUK-ERROR]', err);
        // Fallback pendaftaran darurat lokal agar tidak pernah crash
        const targetUnitCode = resolvedTargetUnitCode || 'UN58';
        const fallbackAgenda = `AGD-${currentYear}/${targetUnitCode}/${String(Date.now()).slice(-4)}`;
        onSaveLetter({
          id: `SRT-IN-${Date.now()}`,
          id_surat: Date.now(),
          nomorSurat: fallbackAgenda,
          nomorAgenda: fallbackAgenda,
          nomor_urut: 1,
          nomorSuratAsal: finalNomorSuratAsal,
          nomor_surat_asal: finalNomorSuratAsal,
          tanggal: tanggalSuratMasuk,
          tanggalTerima: tanggalTerimaMasuk,
          perihal: finalPerihal,
          kategori: 'Surat Masuk',
          isSuratMasuk: true,
          sifat: sifatSuratMasuk,
          kodeKlasifikasi,
          pengirim: finalPengirim,
          tujuan: finalTujuanMasuk,
          target_user_id: resolvedTargetUserId,
          target_user_email: resolvedTargetEmail,
          target_pejabat_id: resolvedTargetUserId,
          target_pejabat_nip: resolvedTargetNip,
          target_pejabat_nama: resolvedTargetNama,
          target_jabatan: finalTujuanMasuk,
          target_role: resolvedTargetRole,
          target_role_slug: resolvedTargetRoleSlug,
          target_unit_id: targetUnitCode,
          target_unit_nama: resolvedTargetUnitNama,
          ringkasan: ringkasanMasuk.trim() || finalPerihal,
          lampiran: `${uploadedFileNameMasuk || 'Naskah_Surat_Masuk.pdf'} (${uploadedFileSizeMasuk || '2.4 MB'})`,
          lampiranUrl: uploadedFileUrlMasuk || uploadedFileDataUrlMasuk || null,
          lampiranName: uploadedFileNameMasuk || 'Naskah_Surat_Masuk.pdf',
          lampiranSize: uploadedFileSizeMasuk || '2.4 MB',
          status: 'Diterima',
          tujuan_aksi: 'DISPOSISI',
          unit_kerja_id: targetUnitCode,
          loket_unit_id: activeUnitObj.kode_unit || 'UN58',
          created_by_user_id: creatorId,
          creator_id: creatorId,
          creator_name: creatorName,
          creator_jabatan: creatorJabatan,
          created_at: new Date().toISOString()
        });
        onClose();
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // 2. REGISTRASI SURAT KELUAR / NOTA DINAS / PENYUSUNAN DRAF
    if (!perihal.trim() || !pengirim.trim()) {
      alert('Mohon lengkapi perihal dan instansi pengirim!');
      return;
    }

    // Alur Penyusunan Draf (Tabel 1: Status DRAFT_MENUNGGU_PARAF, nomor surat null)
    if (targetStatus === 'Draft') {
      setIsSaving(true);
      try {
        const draftRes = await saveDraftLetter(
          {
            kode_jenis_naskah: selectedKodeNaskah,
            id_penandatangan: selectedPejabatId,
            perihal: perihal.trim(),
            isi_surat: `${kalimatPembuka}\n${isiPokok}\n${kalimatPenutup}`,
            tujuan: tujuan.trim(),
            kode_jra: kodeKlasifikasi,
            kode_unit_kerja: activeUnitObj.kode_unit
          },
          currentUser
        );

        const savedDraft = draftRes.data;
        const activeTplType = mapTemplateIdToType(selectedTemplateId || selectedKodeNaskah);
        onSaveLetter({
          id: `SRT-DRAFT-${Date.now()}`,
          id_surat: savedDraft?.id_surat || Date.now(),
          nomorSurat: null,
          nomor_surat: null,
          nomor_urut: null,
          nomorSuratAsal: nomorSuratAsal || '-',
          tanggal,
          perihal,
          kategori: currentTypeMeta?.nama_jenis_naskah || kategori,
          sifat: sifatSurat,
          kategoriKeamanan: tingkatKeamanan === 'B' ? 'Biasa/Terbuka' : tingkatKeamanan === 'R' ? 'Rahasia' : 'Sangat Rahasia',
          tingkat_keamanan: tingkatKeamanan,
          kodeKlasifikasi,
          subKlasifikasi: kodeKlasifikasi,
          pengirim,
          tujuan,
          alamatTujuan,
          kalimatPembuka,
          isiPokok,
          kalimatPenutup,
          templateType: activeTplType,
          templateData: {
            nomorSurat: 'Draf Naskah (Menunggu Penomoran Resmi)',
            tanggal,
            perihal,
            hal: perihal,
            tentang: perihal,
            tujuan,
            yth: tujuan,
            alamatTujuan,
            pengirim,
            dari: pengirim,
            kalimatPembuka,
            isiPokok,
            isiSurat: typeof isiPokok === 'string' ? isiPokok.split('\n').filter(Boolean) : isiPokok,
            kalimatPenutup,
            namaJabatan: namaJabatanSigner,
            namaPejabat: namaPejabatSigner,
            gelarPejabat: gelarSigner,
            nip: nipSigner,
            unitKerja: activeUnitObj.kode_unit,
            unit_kerja_id: activeUnitObj.kode_unit,
            tteVerified: false,
            // Properti khusus Surat Tugas (Lembar / Kolom)
            nama: stLembarParsed?.nama || '',
            nipPegawai: stLembarParsed?.nip || '',
            pangkatGolongan: stLembarParsed?.pangkatGolongan || '',
            jabatanPegawai: stLembarParsed?.jabatan || '',
            untukTugas: (isStLembar ? stLembarParsed?.untukTugas : stKolomParsed?.untukTugas) || perihal,
            pesertaList: stKolomParsed?.pesertaList || []
          },
          status: 'DRAFT_MENUNGGU_PARAF',
          status_progres: 'DRAFT_MENUNGGU_PARAF',
          statusTimestamp: 'Tersimpan sebagai Draf Naskah (Nomor Resmi Ditunda Hingga TTE Final)',
          tujuan_aksi: 'DISPOSISI',
          isSignatureRequest: false,
          ringkasan: `${kalimatPembuka} ${isiPokok.replace(/\n/g, ' ')}`,
          lampiran: uploadedFileName ? `${uploadedFileName} (${uploadedFileSize})` : null,
          lampiranUrl: uploadedFileDataUrl || uploadedFileUrl || null,
          lampiranName: uploadedFileName || null,
          lampiranSize: uploadedFileSize || null,
          tteVerified: false,
          jabatanPenandatangan: namaJabatanSigner,
          namaPenandatangan: `${namaPejabatSigner}${gelarSigner ? `, ${gelarSigner}` : ''}`,
          namaPejabat: namaPejabatSigner,
          gelarPejabat: gelarSigner,
          nipPenandatangan: nipSigner,
          signerId: selectedPejabatId,
          unit_kerja_id: activeUnitObj.kode_unit,
          created_by_user_id: currentUser?.id || 'usr-02',
          created_at: new Date().toISOString(),
          parentLetterId: followUpDisposisi?.letterId || null,
          parentNomorAgenda: followUpDisposisi?.nomorAgenda || null,
          parentDispositionId: followUpDisposisi?.dispositionId || null,
          isFollowUpDisposisi: Boolean(followUpDisposisi),
          riwayatParaf: [
            {
              nama: currentUser?.nama_lengkap || currentUser?.name || 'Staf Pelaksana Persuratan',
              jabatan: currentUser?.roleLabel || 'Pembuat Naskah / Konseptor',
              waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
              catatan: `Penyusunan Draf ${currentTypeMeta?.nama_jenis_naskah}${
                followUpDisposisi ? ` (Tindak Lanjut E-Disposisi Agenda ${followUpDisposisi.nomorAgenda})` : ''
              } - Diajukan untuk verifikasi paraf sebelum TTE oleh ${namaJabatanSigner}`
            }
          ],
          disposisi: null
        });

        onClose();
      } catch (err) {
        console.error('[SUBMIT-DRAFT-ERROR]', err);
        alert(err.message || 'Gagal menyimpan draf surat!');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      // 1. Eksekusi API Backend / Service untuk mendapatkan nomor surat resmi (dengan concurrency locking)
      const res = await saveOutgoingLetter(
        {
          tingkat_keamanan: tingkatKeamanan,
          kode_klasifikasi: kodeKlasifikasi,
          perihal: perihal.trim(),
          tujuan: tujuan.trim(),
          tahun: currentYear,
          unit_kerja_id: activeUnitObj.kode_unit
        },
        currentUser
      );

      const savedData = res.data;
      const officialNomorSurat = savedData.nomor_surat_lengkap;
      const seqStr = String(savedData.nomor_urut).padStart(4, '0');

      // 2. Teruskan payload naskah dinas lengkap ke state aplikasi
      const activeTplType = mapTemplateIdToType(selectedTemplateId || selectedKodeNaskah);
      onSaveLetter({
        id: `SRT-${currentYear}-${seqStr}`,
        id_surat: savedData.id_surat,
        nomorSurat: officialNomorSurat,
        nomor_urut: savedData.nomor_urut,
        nomorSuratAsal: nomorSuratAsal || '-',
        tanggal,
        perihal,
        kategori,
        sifat: sifatSurat,
        kategoriKeamanan: tingkatKeamanan === 'B' ? 'Biasa/Terbuka' : tingkatKeamanan === 'R' ? 'Rahasia' : 'Sangat Rahasia',
        tingkat_keamanan: tingkatKeamanan,
        kodeKlasifikasi,
        subKlasifikasi: kodeKlasifikasi,
        pengirim,
        tujuan,
        alamatTujuan,
        kalimatPembuka,
        isiPokok,
        kalimatPenutup,
        templateType: activeTplType,
        templateData: {
          nomorSurat: officialNomorSurat,
          tanggal,
          perihal,
          hal: perihal,
          tentang: perihal,
          tujuan,
          yth: tujuan,
          alamatTujuan,
          pengirim,
          dari: pengirim,
          kalimatPembuka,
          isiPokok,
          isiSurat: typeof isiPokok === 'string' ? isiPokok.split('\n').filter(Boolean) : isiPokok,
          kalimatPenutup,
          namaJabatan: namaJabatanSigner,
          namaPejabat: namaPejabatSigner,
          gelarPejabat: gelarSigner,
          nip: nipSigner,
          unitKerja: activeUnitObj.kode_unit,
          unit_kerja_id: activeUnitObj.kode_unit,
          tteVerified: isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI' && targetStatus !== 'Draft',
          // Properti khusus Surat Tugas (Lembar / Kolom)
          nama: stLembarParsed?.nama || '',
          nipPegawai: stLembarParsed?.nip || '',
          pangkatGolongan: stLembarParsed?.pangkatGolongan || '',
          jabatanPegawai: stLembarParsed?.jabatan || '',
          untukTugas: (isStLembar ? stLembarParsed?.untukTugas : stKolomParsed?.untukTugas) || perihal,
          pesertaList: stKolomParsed?.pesertaList || []
        },
        status: targetStatus === 'Draft'
          ? 'Draft'
          : isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI'
          ? 'Disetujui'
          : 'DRAFT_MENUNGGU_PARAF',
        statusTimestamp: targetStatus === 'Draft'
          ? 'Tersimpan sebagai Draf Naskah'
          : isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI'
          ? 'Naskah Mandiri Resmi Diterbitkan & Ditandatangani'
          : `Diajukan untuk Paraf Berjenjang & TTE ${namaJabatanSigner || 'Pimpinan'}`,
        tujuan_aksi: 'DISPOSISI',
        isSignatureRequest: false,
        ringkasan: `${kalimatPembuka} ${isiPokok.replace(/\n/g, ' ')}`,
        lampiran: uploadedFileName ? `${uploadedFileName} (${uploadedFileSize})` : null,
        lampiranUrl: uploadedFileDataUrl || uploadedFileUrl || null,
        lampiranName: uploadedFileName || null,
        lampiranSize: uploadedFileSize || null,
        tteVerified: isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI' && targetStatus !== 'Draft',
        jabatanPenandatangan: namaJabatanSigner,
        namaPenandatangan: `${namaPejabatSigner}${gelarSigner ? `, ${gelarSigner}` : ''}`,
        namaPejabat: namaPejabatSigner,
        gelarPejabat: gelarSigner,
        nipPenandatangan: nipSigner,
        signerId: selectedPejabatId,
        unit_kerja_id: activeUnitObj.kode_unit,
        created_by_user_id: currentUser?.id || 'usr-02',
        created_at: new Date().toISOString(),
        parentLetterId: followUpDisposisi?.letterId || null,
        parentNomorAgenda: followUpDisposisi?.nomorAgenda || null,
        parentDispositionId: followUpDisposisi?.dispositionId || null,
        isFollowUpDisposisi: Boolean(followUpDisposisi),
        riwayatParaf: [
          {
            nama: currentUser?.nama_lengkap || currentUser?.name || 'Staf Pelaksana Persuratan',
            jabatan: currentUser?.roleLabel || (isMandiriDoc ? 'Dosen Pembuat Naskah' : 'Operator Unit'),
            waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            catatan: isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI'
              ? `Naskah Mandiri ${currentTypeMeta?.nama_jenis_naskah || 'Naskah Dinas'} ditandatangani mandiri oleh pembuat - Diterbitkan Nomor Resmi: ${officialNomorSurat}`
              : `${targetStatus === 'Draft' ? 'Penyusunan Draf' : 'Registrasi naskah'} ${
                  TEMPLATES.find((t) => t.id === selectedTemplateId)?.name || 'Surat Keluar'
                }${
                  followUpDisposisi ? ` (Tindak Lanjut E-Disposisi Agenda ${followUpDisposisi.nomorAgenda})` : ''
                } - Diterbitkan Nomor Resmi: ${officialNomorSurat}`
          }
        ],
        disposisi: null
      });

      onClose();
    } catch (err) {
      console.error('[SUBMIT-SURAT-KELUAR-ERROR]', err);
      alert('Gagal menerbitkan nomor surat otomatis: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tembusanList = useMemo(() => {
    return tembusanText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\d+[\.\)]\s*/, ''));
  }, [tembusanText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
          viewMode === 'split'
            ? 'w-full max-w-7xl h-full sm:h-[94vh]'
            : viewMode === 'preview'
            ? 'w-full max-w-4xl h-full sm:h-[94vh]'
            : 'w-full max-w-3xl h-full sm:max-h-[92vh]'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-unsil-green-950 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-unsil-gold-500/20 border border-unsil-gold-400/40 flex items-center justify-center shadow-inner shrink-0">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-unsil-gold-300" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">
                  {letterType === 'surat-masuk' ? 'Registrasi Surat Masuk' : 'Penyusunan Surat Keluar / Nota Dinas'}
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-100 border border-emerald-700">
                  {activeUnitObj.singkatan}
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 hidden sm:block">
                {letterType === 'surat-masuk'
                  ? 'Pencatatan naskah masuk resmi dan penerusan instruksi disposisi pimpinan'
                  : 'Formula Rumus Penomoran: [No]/UN58/[Unit]/[Klasifikasi]/[Tahun]'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-unsil-green-900/80 p-0.5 sm:p-1 rounded-lg border border-unsil-green-700/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-unsil-gold-500 text-unsil-green-950 shadow-xs'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
                title="Tampilan Berdampingan Formulir & Pratinjau A4"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
                  viewMode === 'form'
                    ? 'bg-unsil-gold-500 text-unsil-green-950 shadow-xs'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
                title="Tampilan Formulir Saja"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Form</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
                  viewMode === 'preview'
                    ? 'bg-unsil-gold-500 text-unsil-green-950 shadow-xs'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
                title={`Tampilan Pratinjau Kertas ${currentPaperInfo.code}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>
            </div>

            {/* Tombol Cetak Dokumen PDF Otomatis (F4 / A4) */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors shadow-xs"
              title={`Cetak Langsung Lembar ${currentPaperInfo.code} (${currentPaperInfo.width} × ${currentPaperInfo.height}) - Ctrl+P`}
            >
              <Printer className="w-3.5 h-3.5 text-unsil-gold-300" />
              <span className="hidden md:inline">Cetak {currentPaperInfo.code}</span>
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TEMPLATE SELECTOR DROPDOWN (KHUSUS SURAT KELUAR) */}
        {letterType === 'surat-keluar' && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Template:
              </span>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const tpl = TEMPLATES.find((t) => t.id === e.target.value);
                  if (tpl) handleSelectTemplate(tpl);
                }}
                className="w-full max-w-md bg-white border border-amber-400 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300/50 transition cursor-pointer font-medium"
              >
                {isDosen ? (
                  <>
                    <optgroup label="Naskah Mandiri / Fungsional (TTD Dosen Sendiri)">
                      {TEMPLATES.filter((tpl) =>
                        isMandiriPersonalDocument({ jenis_naskah: tpl.kode_jenis_naskah, templateId: tpl.id }) &&
                        availableNaskahTypes.some((t) =>
                          t.kode_jenis_naskah === tpl.kode_jenis_naskah ||
                          (tpl.kode_jenis_naskah === 'SURAT_TUGAS' && t.kode_jenis_naskah.startsWith('SURAT_TUGAS'))
                        )
                      ).map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} {tpl.alias ? `(${tpl.alias})` : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Naskah Konsep / Draf Usulan (Diajukan untuk TTE Pimpinan)">
                      {TEMPLATES.filter((tpl) =>
                        !isMandiriPersonalDocument({ jenis_naskah: tpl.kode_jenis_naskah, templateId: tpl.id }) &&
                        availableNaskahTypes.some((t) =>
                          t.kode_jenis_naskah === tpl.kode_jenis_naskah ||
                          (tpl.kode_jenis_naskah === 'SURAT_TUGAS' && t.kode_jenis_naskah.startsWith('SURAT_TUGAS'))
                        )
                      ).map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} {tpl.alias ? `(${tpl.alias})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  TEMPLATES.filter((tpl) =>
                    availableNaskahTypes.some((t) =>
                      t.kode_jenis_naskah === tpl.kode_jenis_naskah ||
                      (tpl.kode_jenis_naskah === 'SURAT_TUGAS' && t.kode_jenis_naskah.startsWith('SURAT_TUGAS'))
                    )
                  ).map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.alias ? `(${tpl.alias})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={hasCustomContent ? clearDraft : loadSampleDraft}
              className="text-[11px] font-medium text-slate-600 hover:text-unsil-green-900 border border-slate-300 hover:border-unsil-green-700 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-2xs"
              title={hasCustomContent ? "Kosongkan seluruh isian naskah" : "Muat draf contoh kalimat resmi UNSIL"}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{hasCustomContent ? 'Kosongkan Form' : 'Gunakan Contoh Kalimat'}</span>
            </button>
          </div>
        )}

        {/* MODAL BODY (SPLIT VIEW / FORM / PREVIEW) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* SISI KIRI: FORMULIR INPUT */}
          {(viewMode === 'split' || viewMode === 'form') && (
            <div
              className={`overflow-y-auto p-5 space-y-4 text-xs text-slate-700 border-r border-slate-200 bg-white ${
                viewMode === 'split' ? 'w-full md:w-[46%] shrink-0' : 'w-full'
              }`}
            >
              {letterType === 'surat-masuk' ? (
                /* ========================================================================= */
                /* FORM REGISTRASI SURAT MASUK (EKSTERNAL)                                  */
                /* ========================================================================= */
                <div className="space-y-4">
                  {/* Rumus Penomoran Agenda Otomatis */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-unsil-green-900 flex items-center gap-1.5">
                        <Inbox className="w-3.5 h-3.5 text-emerald-700" />
                        Nomor Agenda Surat Masuk (Otomatis)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-semibold border border-emerald-300/60">
                        Buku Agenda SILOKA
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs select-all">
                        {previewNomorAgenda}
                      </span>
                      <span className="text-[10px] text-slate-500 italic">
                        Dicatat secara sah dalam buku agenda registrasi masuk UNSIL.
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-unsil-green-700 shrink-0" />
                    <span>Jalur Disposisi: Surat masuk akan diteruskan ke pimpinan untuk penerbitan lembar instruksi disposisi online.</span>
                  </div>

                  {/* Row 1: Nomor Surat Asal & Tanggal Surat Asal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Nomor Surat Asal (Pengirim Luar) *
                      </label>
                      <input
                        type="text"
                        value={nomorSuratAsalMasuk}
                        onChange={(e) => setNomorSuratAsalMasuk(e.target.value)}
                        placeholder="Contoh: 1204/B/LLDIKTI4/KL/2026"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Tanggal Surat Asal *
                      </label>
                      <input
                        type="date"
                        value={tanggalSuratMasuk}
                        onChange={(e) => setTanggalSuratMasuk(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 2: Pengirim (Instansi Luar) & Tujuan (Pejabat Internal UNSIL) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Instansi Pengirim (Eksternal) *
                      </label>
                      <input
                        type="text"
                        value={pengirimMasuk}
                        onChange={(e) => setPengirimMasuk(e.target.value)}
                        placeholder="Contoh: Kemendikbudristek / Pemkot Tasikmalaya"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          Tujuan Surat (Pejabat UNSIL) *
                        </label>
                        <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-emerald-100/70 text-unsil-green-900 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-unsil-green-700" />
                          <span>Terintegrasi Manajemen Pengguna & SOTK</span>
                        </span>
                      </div>
                      
                      {/* Pilihan Dropdown Pejabat Resmi UNSIL */}
                      <select
                        value={tujuanPejabatMode === 'MANUAL' ? 'MANUAL' : selectedPejabatMasukId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'MANUAL') {
                            setTujuanPejabatMode('MANUAL');
                            if (!customTujuanMasuk) {
                              setCustomTujuanMasuk(tujuanMasuk);
                            }
                          } else {
                            setTujuanPejabatMode('SELECT');
                            setSelectedPejabatMasukId(val);
                            const p = allOfficialsList.find((item) => String(item.id) === String(val));
                            if (p) {
                              setTujuanMasuk(p.jabatan);
                              if (!disposisiTargetUnit) {
                                setDisposisiTargetUnit(p.jabatan);
                              }
                            }
                          }
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 shadow-2xs"
                      >
                        {Array.from(new Set(allOfficialsList.map((p) => p.kategori))).map((kategori) => (
                          <optgroup key={kategori} label={`── ${kategori} ──`}>
                            {allOfficialsList
                              .filter((p) => p.kategori === kategori)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.jabatan}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                        <optgroup label="── Pilihan Lainnya ──">
                          <option value="MANUAL">Ketik Manual Tujuan Lain / Non-Pejabat...</option>
                        </optgroup>
                      </select>

                      {/* Input teks khusus jika mode Manual dipilih */}
                      {tujuanPejabatMode === 'MANUAL' ? (
                        <div className="mt-2 animate-in fade-in duration-150">
                          <input
                            type="text"
                            value={customTujuanMasuk}
                            onChange={(e) => {
                              setCustomTujuanMasuk(e.target.value);
                              setTujuanMasuk(e.target.value);
                            }}
                            placeholder="Ketik nama jabatan / pimpinan / unit tujuan surat masuk..."
                            className="w-full p-2 bg-amber-50/60 border border-amber-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20"
                            autoFocus
                            required
                          />
                        </div>
                      ) : (
                        selectedPejabatObj && (
                          <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-bold text-unsil-green-950 text-[11.5px] truncate">
                                {selectedPejabatObj.jabatan}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-unsil-green-900 border border-emerald-200">
                                {selectedPejabatObj.unit_nama || selectedPejabatObj.kode_unit}
                              </span>
                            </div>

                            {/* Informasi Aliran Distribusi Langsung ke Akun Pejabat */}
                            <div className="pt-1 flex flex-wrap items-center justify-between gap-1.5 text-[10.5px] border-t border-emerald-100/80">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  Surat Masuk langsung masuk ke Kotak Masuk akun: <strong className="text-emerald-950">{selectedPejabatObj.jabatan}</strong>
                                </span>
                              </div>
                              <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white text-emerald-900 border border-emerald-200 shrink-0">
                                Unit: {selectedPejabatObj.kode_unit}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Row 3: Tanggal Diterima, Sifat Surat, Tingkat Keamanan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Tanggal Diterima
                      </label>
                      <input
                        type="date"
                        value={tanggalTerimaMasuk}
                        onChange={(e) => setTanggalTerimaMasuk(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Sifat Surat
                      </label>
                      <select
                        value={sifatSuratMasuk}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSifatSuratMasuk(val);
                          const d = new Date();
                          const days = DISPOSISI_SLA_DAYS[val] || 2;
                          d.setDate(d.getDate() + days);
                          setDisposisiDueDate(d.toISOString().slice(0, 10));
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                      >
                        <option value="Biasa">Biasa</option>
                        <option value="Penting">Penting</option>
                        <option value="Segera">Segera</option>
                        <option value="Amat Segera">Amat Segera</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Tingkat Keamanan
                      </label>
                      <select
                        value={tingkatKeamanan}
                        onChange={(e) => setTingkatKeamanan(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                      >
                        <option value="B">Biasa / Terbuka</option>
                        <option value="R">Rahasia</option>
                        <option value="SR">Sangat Rahasia</option>
                      </select>
                    </div>
                  </div>

                  {/* Klasifikasi Arsip Dropdown */}
                  <div className="relative" ref={searchDropdownRef}>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                      <span>Klasifikasi Arsip</span>
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-bold">
                        {kodeKlasifikasi}
                      </span>
                    </label>
                    <div
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-unsil-green-900 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                          {kodeKlasifikasi}
                        </span>
                        <span className="truncate text-slate-700 text-[11px]">
                          {klasifikasiList.find((k) => k.kode_klasifikasi === kodeKlasifikasi)?.keterangan_klasifikasi ||
                            'Pilih Klasifikasi Arsip'}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isSearchOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        {Array.isArray(currentUser?.allowed_prefixes) && !currentUser.allowed_prefixes.includes('*') && currentUser.allowed_prefixes.length > 0 && (
                          <div className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-unsil-green-950 flex items-center justify-between font-medium">
                            <span>Klaster JRA Wewenang Tupoksi:</span>
                            <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                              {currentUser.allowed_prefixes.join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Cari kode (PP.00.03) atau perihal..."
                            value={searchKlasifikasi}
                            onChange={(e) => setSearchKlasifikasi(e.target.value)}
                            autoFocus
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-unsil-green-800"
                          />
                        </div>
                        <div className="space-y-0.5">
                          {filteredKlasifikasi.map((k) => (
                            <button
                              key={k.kode_klasifikasi || k.id}
                              type="button"
                              onClick={() => {
                                setKodeKlasifikasi(k.kode_klasifikasi);
                                setIsSearchOpen(false);
                                setSearchKlasifikasi('');
                              }}
                              className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                                kodeKlasifikasi === k.kode_klasifikasi
                                  ? 'bg-unsil-green-50 text-unsil-green-950 font-semibold border border-emerald-200'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="font-mono font-bold text-unsil-green-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10.5px] shrink-0">
                                {k.kode_klasifikasi}
                              </span>
                              <span className="line-clamp-2 text-[11px] leading-snug">
                                {k.keterangan_klasifikasi || k.nama_klasifikasi}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Perihal Surat Masuk */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Perihal Surat Masuk *
                    </label>
                    <input
                      type="text"
                      value={perihalMasuk}
                      onChange={(e) => setPerihalMasuk(e.target.value)}
                      placeholder="Isi perihal surat masuk..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20"
                      required
                    />
                  </div>

                  {/* Ringkasan Surat Masuk */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Ringkasan Isi / Catatan Surat Masuk
                    </label>
                    <textarea
                      rows={3}
                      value={ringkasanMasuk}
                      onChange={(e) => setRingkasanMasuk(e.target.value)}
                      placeholder="Tuliskan ringkasan pokok isi surat masuk..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white leading-relaxed"
                    />
                  </div>

                  {/* Input Berkas PDF Tersembunyi (Pemicu Unggah Terintegrasi di Panel Pratinjau Kanan) */}
                  <input
                    type="file"
                    ref={fileInputMasukRef}
                    accept="application/pdf,.pdf"
                    onChange={handleFileInputMasuk}
                    className="hidden"
                  />

                  {/* PANEL INSTRUKSI DISPOSISI: HANYA DITAMPILKAN UNTUK PEJABAT STRUKTURAL (33 PEJABAT CONTOH 21 + REKTOR) */}
                  {isOfficialAuthorizedForDisposisi ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/70 p-4 space-y-3.5 shadow-2xs">
                      {/* Header Panel */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckSquare className="w-4 h-4 text-unsil-green-800" />
                              <span>Instruksi Tindak Lanjut / Disposisi (Untuk :)</span>
                            </label>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-unsil-green-900 font-semibold border border-emerald-300">
                              Contoh 21
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            Centang butir instruksi resmi di bawah ini untuk langsung diteruskan ke sistem SILOKA saat pendaftaran:
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px]">
                          <button
                            type="button"
                            onClick={handleSelectAllDisposisi}
                            className="text-unsil-green-800 hover:text-unsil-green-950 font-bold hover:underline cursor-pointer"
                          >
                            Pilih Semua
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={handleClearAllDisposisi}
                            className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </div>
                      </div>

                      {/* Tujuan Disposisi (Diteruskan Kepada) & Tenggat Waktu (SLA) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Diteruskan Kepada (Tujuan Disposisi)
                          </label>
                          <select
                            value={disposisiTargetUnit}
                            onChange={(e) => setDisposisiTargetUnit(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                          >
                            <option value="">-- Diteruskan ke Pimpinan/Tujuan: {tujuanMasuk.slice(0, 32)}... --</option>
                            {hierarchicalDisposisiTargets.map((tgt) => (
                              <option key={tgt.id} value={tgt.nama}>
                                {tgt.nama} {tgt.badge ? `[${tgt.badge}]` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Tenggat Waktu Penyelesaian (SLA)
                          </label>
                          <input
                            type="date"
                            value={disposisiDueDate}
                            onChange={(e) => setDisposisiDueDate(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                          />
                        </div>
                      </div>

                      {/* TABEL CHECKLIST 2 KOLOM (Format Disposisi Resmi UNSIL Sesuai Gambar) */}
                      <div className="border border-slate-200 rounded-xl bg-white p-3 space-y-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 md:divide-x md:divide-dashed md:divide-slate-200 text-xs">
                          {/* Kolom Kiri */}
                          <div className="space-y-1">
                            {OFFICIAL_DISPOSISI_CHECKLIST_COL1.map((item) => {
                              const isChecked = disposisiActionsMasuk.includes(item.label);
                              return (
                                <label
                                  key={item.id}
                                  className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition select-none ${
                                    isChecked
                                      ? 'bg-emerald-100/70 text-unsil-green-950 font-semibold shadow-2xs'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleDisposisiAction(item.label)}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-800/30 cursor-pointer"
                                  />
                                  <span className="text-[11.5px] leading-tight">{item.label}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Kolom Kanan */}
                          <div className="space-y-1 md:pl-6 pt-2 md:pt-0">
                            {OFFICIAL_DISPOSISI_CHECKLIST_COL2.map((item) => {
                              const isChecked = disposisiActionsMasuk.includes(item.label);
                              return (
                                <div key={item.id} className="space-y-1">
                                  <label
                                    className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition select-none ${
                                      isChecked
                                        ? 'bg-emerald-100/70 text-unsil-green-950 font-semibold shadow-2xs'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleDisposisiAction(item.label)}
                                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-800/30 cursor-pointer"
                                    />
                                    <span className="text-[11.5px] leading-tight">
                                      {item.id === 'lainnya' ? '.............................................................. (Lainnya)' : item.label}
                                    </span>
                                  </label>

                                  {/* Input khusus bila "Koordinasikan dengan..." dicentang */}
                                  {item.id === 'koordinasikan_dengan' && isChecked && (
                                    <div className="pl-6 pb-1">
                                      <input
                                        type="text"
                                        value={disposisiKoordinasiDetail}
                                        onChange={(e) => setDisposisiKoordinasiDetail(e.target.value)}
                                        placeholder="Sebutkan pihak / unit kerja koordinasi..."
                                        className="w-full text-[11px] p-1.5 bg-slate-50 border border-emerald-300 rounded focus:ring-1 focus:ring-unsil-green-800 outline-none"
                                        autoFocus
                                      />
                                    </div>
                                  )}

                                  {/* Input khusus bila "Lainnya" dicentang */}
                                  {item.id === 'lainnya' && isChecked && (
                                    <div className="pl-6 pb-1">
                                      <input
                                        type="text"
                                        value={disposisiLainnyaDetail}
                                        onChange={(e) => setDisposisiLainnyaDetail(e.target.value)}
                                        placeholder="Tuliskan arahan spesifik lainnya..."
                                        className="w-full text-[11px] p-1.5 bg-slate-50 border border-emerald-300 rounded focus:ring-1 focus:ring-unsil-green-800 outline-none"
                                        autoFocus
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Catatan Khusus Tambahan */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Catatan Tambahan Instruksi (Opsional)
                        </label>
                        <input
                          type="text"
                          value={disposisiCatatanTambahan}
                          onChange={(e) => setDisposisiCatatanTambahan(e.target.value)}
                          placeholder="Contoh: Harap koordinasikan dengan staf pengelola keuangan terkait SPJ..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
                        />
                      </div>

                      {disposisiActionsMasuk.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-unsil-green-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-unsil-green-800 shrink-0" />
                            <span>
                              <strong>{disposisiActionsMasuk.length}</strong> butir instruksi tindak lanjut terpilih siap dikirim ke sistem SILOKA.
                            </span>
                          </span>
                          <span className="font-semibold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 self-start sm:self-auto text-[10.5px]">
                            Status: Otomatis Didisposisikan
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CARD ALUR KERJA LOKET PERSURATAN: PERUTEAN OTOMATIS KE AKUN PEJABAT TUJUAN (UNTUK STAF) */
                    <div className="p-4 rounded-xl bg-linear-to-br from-emerald-50/90 via-slate-50 to-teal-50/70 border border-emerald-200/90 shadow-2xs space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-unsil-green-800 text-unsil-gold-300 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <SendHorizontal className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              Perutean Langsung ke Akun Pejabat
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-unsil-green-900 border border-emerald-300">
                              ⚡ Otomatis Terhubung
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Sebagai staf pencatat surat masuk di loket TU, naskah ini akan langsung terdistribusi ke kotak masuk akun pejabat tujuan dengan status <strong className="text-unsil-green-950">Diterima</strong>. Pejabat bersangkutan memiliki wewenang penuh untuk memberikan arahan dan lembar disposisi resmi (Format Contoh 21).
                          </p>
                        </div>
                      </div>

                      {/* Detail Akun Pejabat Penerima Terhubung */}
                      <div className="p-3 rounded-lg bg-white/95 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-unsil-green-800 shrink-0 font-bold text-sm shadow-2xs">
                            <Building className="w-4 h-4 text-unsil-green-800" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              Akun Pejabat Penerima Terhubung:
                            </div>
                            <div className="font-bold text-slate-900 truncate">
                              {selectedPejabatObj ? selectedPejabatObj.nama_gelar : (tujuanMasuk || 'Pejabat Struktural UNSIL')}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {selectedPejabatObj ? selectedPejabatObj.jabatan : 'Tujuan Naskah Masuk'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {selectedPejabatObj?.nip && (
                            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              NIP: {selectedPejabatObj.nip}
                            </span>
                          )}
                          <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded bg-unsil-green-800 text-white shadow-2xs flex items-center gap-1">
                            <span>Inbox Pejabat</span>
                            <span className="text-unsil-gold-300">✓</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ========================================================================= */
                /* FORM SURAT KELUAR / NOTA DINAS                                           */
                /* ========================================================================= */
                <div className="space-y-4">
                  {/* Banner Mode Tindak Lanjut E-Disposisi */}
                  {followUpDisposisi && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-unsil-green-950 block">
                            ⚡ Mode Tindak Lanjut E-Disposisi Resmi UNSIL
                          </span>
                          <p className="text-slate-700 mt-0.5">
                            Menindaklanjuti Agenda <strong className="font-mono text-unsil-green-950">{followUpDisposisi.nomorAgenda}</strong>: "{followUpDisposisi.instruksi}"
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Naskah balasan ini otomatis menautkan referensi surat asal. Lembar disposisi akan otomatis selesai saat naskah disahkan melalui TTE pimpinan.
                          </p>
                        </div>
                      </div>
                      {onClearFollowUp && (
                        <button
                          type="button"
                          onClick={onClearFollowUp}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shrink-0 cursor-pointer"
                          title="Buat naskah baru tanpa menautkan ke disposisi"
                        >
                          Lepas Tautan
                        </button>
                      )}
                    </div>
                  )}

                  {/* PANEL SISTEM PENOMORAN OTOMATIS & KLASIFIKASI JRA/SKKAAD (PENCEGAH HUMAN ERROR) */}
                  <SmartKlasifikasiNumberingPanel
                    templateKey={selectedTemplateId || selectedKodeNaskah}
                    templateLabel={
                      TEMPLATES.find((t) => t.id === selectedTemplateId)?.name ||
                      currentTypeMeta?.nama_jenis_naskah ||
                      'Naskah Dinas Keluar'
                    }
                    currentUser={currentUser}
                    existingLetters={allLetters}
                    onNumberChange={(meta) => {
                      if (meta.kodeKlasifikasi && meta.kodeKlasifikasi !== kodeKlasifikasi) {
                        setKodeKlasifikasi(meta.kodeKlasifikasi);
                      }
                      if (meta.tingkatKeamanan && meta.tingkatKeamanan !== tingkatKeamanan) {
                        setTingkatKeamanan(meta.tingkatKeamanan);
                      }
                      if (meta.kodeUnit && !isUnitLocked && meta.kodeUnit !== selectedUnitCode) {
                        setSelectedUnitCode(meta.kodeUnit);
                      }
                    }}
                    onSecurityTriggerChange={setSecurityTriggerMeta}
                  />

                  {/* Nomor Surat Keluar (Otomatis) */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-unsil-green-950 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        Nomor Surat Keluar (Otomatis)
                      </span>
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60">
                        Format Baku UNSIL
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        readOnly
                        value={previewNomorSurat}
                        className="font-mono font-bold text-xs sm:text-sm text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs select-all cursor-default w-full sm:w-auto"
                        title="Format nomor surat dirakit otomatis sesuai tata naskah dinas resmi UNSIL"
                      />
                      <span className="text-[11px] text-slate-600">
                        💡 Anda tidak perlu mengetik nomor manual. Nomor resmi akan otomatis terbit saat surat disimpan.
                      </span>
                    </div>
                  </div>

                  {/* Grid Metadata Surat: Unit Kerja, Klasifikasi Arsip, Tingkat Keamanan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Unit Kerja Asal */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                        <span>Unit Kerja Asal</span>
                    {isUnitLocked && (
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-normal">
                        Terkunci
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedUnitCode}
                    disabled={isUnitLocked}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedUnitCode(code);
                      const u = unitKerjaList.find((x) => x.kode_unit === code);
                      if (u) {
                        setPengirim(u.nama_unit);
                        setNamaJabatanSigner(u.tipe_unit === 'FAKULTAS' ? `Dekan ${u.nama_unit}` : `Kepala ${u.nama_unit}`);
                      }
                    }}
                    className={`w-full p-2 border rounded-lg text-xs font-semibold ${
                      isUnitLocked
                        ? 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20'
                    }`}
                  >
                    {unitKerjaList.map((u) => (
                      <option key={u.kode_unit} value={u.kode_unit}>
                        {u.kode_unit} - {u.singkatan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Dropdown Pencarian Kategori Klasifikasi Arsip (Dinamis dari API) */}
                <div className="relative" ref={searchDropdownRef}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                    <span>Klasifikasi Arsip</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-bold">
                      {kodeKlasifikasi}
                    </span>
                  </label>

                  <div
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-unsil-green-800/20"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-unsil-green-900 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                        {kodeKlasifikasi}
                      </span>
                      <span className="truncate text-slate-700 text-[11px]">
                        {klasifikasiList.find((k) => k.kode_klasifikasi === kodeKlasifikasi)?.keterangan_klasifikasi ||
                          'Pilih Klasifikasi Arsip'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isSearchOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari kode (PP.00.03) atau perihal..."
                          value={searchKlasifikasi}
                          onChange={(e) => setSearchKlasifikasi(e.target.value)}
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-unsil-green-800"
                        />
                      </div>
                      <div className="space-y-0.5">
                        {filteredKlasifikasi.length > 0 ? (
                          filteredKlasifikasi.map((k) => (
                            <button
                              key={k.kode_klasifikasi || k.id}
                              type="button"
                              onClick={() => {
                                setKodeKlasifikasi(k.kode_klasifikasi);
                                setIsSearchOpen(false);
                                setSearchKlasifikasi('');
                              }}
                              className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                                kodeKlasifikasi === k.kode_klasifikasi
                                  ? 'bg-unsil-green-50 text-unsil-green-950 font-semibold border border-emerald-200'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="font-mono font-bold text-unsil-green-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10.5px] shrink-0">
                                {k.kode_klasifikasi}
                              </span>
                              <span className="line-clamp-2 text-[11px] leading-snug">
                                {k.keterangan_klasifikasi || k.nama_klasifikasi}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-center text-slate-400 py-3 text-[11px]">Tidak ada klasifikasi yang cocok.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Dropdown Tingkat Keamanan ('B', 'R', 'SR') */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tingkat Keamanan
                  </label>
                  <select
                    value={tingkatKeamanan}
                    onChange={(e) => setTingkatKeamanan(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                  >
                    <option value="B">B (Biasa / Terbuka)</option>
                    <option value="R">R (Rahasia)</option>
                    <option value="SR">SR (Sangat Rahasia)</option>
                  </select>
                </div>
              </div>

              {/* Baris Tanggal, Sifat & Lampiran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Sifat Surat
                  </label>
                  <select
                    value={sifatSurat}
                    onChange={(e) => setSifatSurat(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Segera">Segera</option>
                    <option value="Amat Segera">Amat Segera</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={lampiran}
                    onChange={(e) => setLampiran(e.target.value)}
                    placeholder="Contoh: 1 (satu) Berkas"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Asal Surat & Nomor Surat Asal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Asal Surat (Instansi / Unit)
                  </label>
                  <input
                    type="text"
                    value={pengirim}
                    onChange={(e) => setPengirim(e.target.value)}
                    placeholder="Contoh: Fakultas Keguruan dan Ilmu Pendidikan"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nomor Surat Asal (Rujukan Pengirim)
                  </label>
                  <input
                    type="text"
                    value={nomorSuratAsal}
                    onChange={(e) => setNomorSuratAsal(e.target.value)}
                    placeholder="Contoh: 042/FT-UNSIL/TU/2026"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Tujuan & Alamat Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {isSuratTugas
                      ? 'Penerima / Pegawai yang Ditugaskan'
                      : isNotaDinas
                      ? 'Penerima Nota Dinas (Yth.)'
                      : isSuratPernyataan
                      ? 'Tujuan Penggunaan Pernyataan'
                      : isBeritaAcara
                      ? 'Pihak Kedua / Rekanan'
                      : 'Tujuan / Penerima (Yth.)'}
                  </label>
                  <input
                    type="text"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    placeholder={
                      isSuratTugas
                        ? 'Contoh: Pegawai yang Bersangkutan / Tim Pelaksana'
                        : isNotaDinas
                        ? 'Contoh: Kepala Biro Perencanaan, Keuangan, dan Umum'
                        : isSuratPernyataan
                        ? 'Contoh: Pimpinan Universitas Siliwangi'
                        : isBeritaAcara
                        ? 'Contoh: Ir. Hendra Gunawan, M.T. (PPK Sarana dan Prasarana)'
                        : 'Contoh: Kepala Biro Keuangan dan Umum'
                    }
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {isSuratTugas
                      ? 'Unit / Lokasi Pegawai'
                      : isNotaDinas
                      ? 'Tempat / Lokasi Penerima'
                      : isSuratPernyataan
                      ? 'Kota Penandatanganan'
                      : isBeritaAcara
                      ? 'Tempat Pembuatan (Dibuat di)'
                      : 'Alamat / Tempat Tujuan'}
                  </label>
                  <input
                    type="text"
                    value={alamatTujuan}
                    onChange={(e) => setAlamatTujuan(e.target.value)}
                    placeholder={
                      isSuratTugas
                        ? 'Contoh: Di Lingkungan Universitas Siliwangi / Di Tempat'
                        : isNotaDinas
                        ? 'Contoh: Di Tempat'
                        : isSuratPernyataan || isBeritaAcara
                        ? 'Contoh: Tasikmalaya'
                        : 'Contoh: Kota Tasikmalaya / Di Tempat'
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Hal / Perihal */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {isSuratTugas
                    ? 'Hal / Perihal Penugasan'
                    : isNotaDinas
                    ? 'Hal Nota Dinas'
                    : isSuratPernyataan
                    ? 'Perihal / Judul Pernyataan'
                    : isBeritaAcara
                    ? 'Uraian Singkat / Perihal Berita Acara'
                    : 'Hal / Perihal Naskah Dinas'}
                </label>
                <input
                  type="text"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder={
                    isSuratTugas
                      ? 'Contoh: Penugasan Pelaksanaan Bimbingan Teknis Kearsipan dan TTE BSrE'
                      : isNotaDinas
                      ? 'Contoh: Laporan Realisasi Penyerapan Anggaran BLU Triwulan III TA 2026'
                      : isSuratPernyataan
                      ? 'Contoh: Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)'
                      : isBeritaAcara
                      ? 'Contoh: Berita Acara Serah Terima Pengadaan Perangkat Komputer Server...'
                      : 'Contoh: Permohonan Koordinasi dan Fasilitasi...'
                  }
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
                />
              </div>

              {/* Paragraf Pembuka */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {isSuratTugas
                    ? 'Kalimat Pembuka Penugasan (Diakhiri Koma)'
                    : isNotaDinas
                    ? 'Kalimat Pembuka Nota Dinas'
                    : isSuratPernyataan
                    ? 'Kalimat Pembuka (Default: Yang bertanda tangan di bawah ini,)'
                    : isBeritaAcara
                    ? 'Komparisi Waktu Pelaksanaan'
                    : 'Kalimat / Paragraf Pembuka'}
                </label>
                <textarea
                  rows={2}
                  value={kalimatPembuka}
                  onChange={(e) => setKalimatPembuka(e.target.value)}
                  placeholder={
                    isSuratTugas
                      ? 'Contoh: Rektor Universitas Siliwangi dengan ini menugaskan kepada pejabat/pegawai di bawah ini,'
                      : isNotaDinas
                      ? 'Contoh: Bersama ini kami sampaikan dengan hormat laporan perkembangan realisasi belanja operasional dan belanja modal di lingkungan Universitas Siliwangi sampai dengan akhir Agustus 2026 sebagai bahan evaluasi pimpinan.'
                      : isSuratPernyataan
                      ? 'Contoh: Yang bertanda tangan di bawah ini,'
                      : isBeritaAcara
                      ? 'Contoh: Pada hari ini, Selasa, tanggal 08, bulan September, tahun 2026, kami masing-masing:'
                      : 'Tuliskan kalimat pembuka naskah dinas...&#10;Contoh: Sehubungan dengan pelaksanaan program kerja sama riset, bersama ini kami sampaikan permohonan koordinasi:'
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                />
              </div>

              {/* Batang Tubuh / Isi Pokok */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {isStLembar
                      ? 'Identitas Pegawai & Rincian Tugas (Format Lembaran)'
                      : isStKolom
                      ? 'Daftar Pegawai & Rincian Tugas (Format Kolom / Tabel)'
                      : isNotaDinas
                      ? 'Isi Pokok Nota Dinas (Multi-Baris)'
                      : isSuratPernyataan
                      ? 'Identitas Pembuat & Isi Pernyataan (Format: nama : ..., NIP : ..., Isi Pernyataan: ...)'
                      : isBeritaAcara
                      ? 'Para Pihak, Uraian Kegiatan, dan Dasar Berita Acara'
                      : 'Isi Pokok / Rincian Naskah (Multi-Baris)'}
                  </label>
                  {(isSuratTugas || isSuratPernyataan || isBeritaAcara || isSuratKeterangan || isSuratPengantar || isNotula || isLaporan || isTelaahStaf) && (
                    <span className="text-[10px] text-unsil-green-800 font-medium">
                      {isStLembar
                        ? 'Format 1 Pegawai'
                        : isStKolom
                        ? 'Format Kolektif / Pemisah |'
                        : isSuratPernyataan
                        ? 'Format Spesimen Gambar 14'
                        : isBeritaAcara
                        ? 'Format Spesimen Gambar 12'
                        : isSuratKeterangan
                        ? 'Format Spesimen Gambar 4'
                        : isSuratPengantar
                        ? 'Format Tabel Gambar 5'
                        : isNotula
                        ? 'Format Spesimen Gambar 1'
                        : isLaporan
                        ? 'Format Spesimen Gambar 2'
                        : 'Format Spesimen Gambar 3'}
                    </span>
                  )}
                </div>
                <textarea
                  rows={isSuratTugas || isSuratPernyataan || isBeritaAcara || isSuratKeterangan || isSuratPengantar || isNotula || isLaporan || isTelaahStaf ? 6 : 4}
                  value={isiPokok}
                  onChange={(e) => setIsiPokok(e.target.value)}
                  placeholder={
                    isStLembar
                      ? 'Tuliskan identitas pegawai dan tugas...&#10;Contoh:&#10;Nama : Dr. Nana Sujana, Drs., M.Si.&#10;NIP : 196808301989031004&#10;Pangkat dan golongan : Pembina Utama Muda, IV/c&#10;Jabatan : Kepala Biro Umum dan Keuangan&#10;&#10;Untuk : Menghadiri Rapat Koordinasi Nasional... pada tanggal 15 s.d. 17 September 2026 bertempat di Hotel Grand Mercure, Jakarta Pusat.'
                      : isStKolom
                      ? 'Tuliskan daftar pegawai dan tugas (gunakan pemisah |)...&#10;Contoh:&#10;1. Dr. Nana Sujana, Drs., M.Si. | NIP 196808301989031004 | Pembina Utama Muda, IV/c | Kepala Biro Umum dan Keuangan&#10;2. Budi Santoso, S.E., M.Ak. | NIP 198203202008121002 | Penata Tk. I, III/d | Koordinator Keuangan & BMN&#10;&#10;Untuk : Mengikuti Bimbingan Teknis... pada tanggal 20 s.d. 22 September 2026 bertempat di Depok, Jawa Barat.'
                      : isNotaDinas
                      ? 'Tuliskan butir-butir laporan atau isi pokok nota dinas...&#10;Contoh:&#10;1. Realisasi penyerapan anggaran belanja pegawai dan operasional telah mencapai 78,4% dari pagu DIPA yang ditetapkan.&#10;2. Pengadaan sarana prasarana penunjang laboratorium melalui e-Katalog telah selesai diverifikasi oleh PPK.&#10;3. Seluruh berkas pertanggungjawaban (SPJ) telah terdigitalisasi penuh melalui modul kearsipan SILOKA.'
                      : isSuratPernyataan
                      ? 'Tuliskan identitas dan isi pernyataan...&#10;Contoh:&#10;nama : Dr. Ade Rustiana, Drs., M.Si.&#10;NIP : 196801021992031002&#10;pangkat dan golongan : Pembina Utama Muda / IV/c&#10;jabatan : Wakil Rektor Bidang Umum dan Keuangan&#10;alamat : Jalan Siliwangi Nomor 24 Kota Tasikmalaya&#10;&#10;Isi Pernyataan:&#10;Dengan ini menyatakan dengan sesungguhnya bahwa seluruh data, laporan rekonsiliasi belanja modal, dan dokumen pertanggungjawaban keuangan Universitas Siliwangi Tahun Anggaran 2026 telah disusun secara benar, objektif, dan sesuai dengan Standar Akuntansi Pemerintahan (SAP).'
                      : isBeritaAcara
                      ? 'Tuliskan komparisi para pihak, kegiatan, dan dasar pelaksanaan...&#10;Contoh:&#10;1. Dr. Kurnia, S.P., M.P., NIP 197503122002121001 dan Kepala Biro Perencanaan, Keuangan, dan Umum, selanjutnya disebut Pihak Pertama, dan&#10;2. Ir. Hendra Gunawan, M.T. (Pejabat Pembuat Komitmen Sarana dan Prasarana), selanjutnya disebut Pihak Kedua,&#10;&#10;telah melaksanakan:&#10;1. Pemeriksaan fisik dan uji fungsi terhadap Pengadaan Perangkat Komputer Server...&#10;2. Serah terima barang operasional teknologi informasi dalam kondisi baik...&#10;&#10;Berita acara ini dibuat dengan sesungguhnya berdasarkan Surat Keputusan Rektor Universitas Siliwangi Nomor 142/UN58/KP.02/2026 tanggal 15 Januari 2026...'
                      : isSuratKeterangan
                      ? 'Tuliskan data pejabat, pihak yang diterangkan, dan isi keterangan...&#10;Contoh:&#10;nama : Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.&#10;NIP : 196708161996031001&#10;pangkat dan golongan : Pembina Utama Madya / IV/d&#10;jabatan : Rektor Universitas Siliwangi&#10;&#10;dengan ini menerangkan bahwa,&#10;nama : Fajar Nugraha, S.T., M.Kom.&#10;NIP : 198805212015041002&#10;pangkat dan golongan : Penata Muda Tingkat I / III/b&#10;jabatan : Dosen Asisten Ahli pada Fakultas Teknik Universitas Siliwangi&#10;&#10;Isi Keterangan:&#10;Bahwa yang bersangkutan adalah benar Pegawai Negeri Sipil / Tenaga Pendidik aktif pada Universitas Siliwangi dan saat ini sedang ditugaskan sebagai Koordinator Sistem Informasi dan Transformasi Digital (SILOKA) serta berkelakuan baik.'
                      : isSuratPengantar
                      ? 'Tuliskan daftar dokumen/barang (gunakan pemisah | atau -)...&#10;Contoh:&#10;1. Berkas Rekonsiliasi Laporan Keuangan Universitas Siliwangi Semester I TA 2026 | 2 (dua) bundel | Disampaikan dengan hormat untuk diverifikasi dan diterbitkan BAR.&#10;2. Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Belanja Modal TA 2026 | 1 (satu) berkas | Sebagai kelengkapan berkas rekonsiliasi pengesahan belanja modal.'
                      : isNotula
                      ? 'Tuliskan metadata, susunan acara, peserta, dan substansi rapat...&#10;Contoh:&#10;Nama rapat : Rapat Koordinasi Evaluasi Implementasi Tata Naskah Dinas Elektronik SILOKA&#10;Hari, tanggal : Selasa, 08 September 2026&#10;Pukul : 09.00 - 12.00 WIB&#10;Tempat : Ruang Sidang Rektorat Lt. 2 Universitas Siliwangi&#10;Susunan acara :&#10;1. Pembukaan oleh Pembawa Acara&#10;2. Pengarahan Rektor Universitas Siliwangi&#10;3. Pemaparan Laporan Kemajuan Penerapan TTE BSrE oleh Tim SILOKA&#10;&#10;Pemimpin rapat : Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng. (Rektor)&#10;Pencatat/notulis : Rina Permatasari, S.Sos. (Pranata Humas)&#10;Peserta rapat :&#10;1. Wakil Rektor Bidang Akademik&#10;2. Para Dekan Fakultas di lingkungan UNSIL&#10;&#10;1. Persoalan yang dibahas : Integrasi menyeluruh modul tanda tangan digital bersertifikat BSrE BSSN...&#10;2. Tanggapan peserta rapat : Para Dekan menyetujui percepatan implementasi...&#10;3. Simpulan : Seluruh fakultas dan biro diwajibkan menggunakan aplikasi SILOKA...'
                      : isLaporan
                      ? 'Tuliskan sistematika laporan A s.d. D...&#10;Contoh:&#10;A. Pendahuluan&#10;1. Latar Belakang: Dalam rangka reformasi birokrasi dan percepatan transformasi digital persuratan kedinasan...&#10;2. Dasar: 1. Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas...&#10;3. Ruang Lingkup: Ruang lingkup pelaksanaan kegiatan meliputi pengujian 20 format naskah dinas resmi...&#10;&#10;B. Kegiatan yang Dilaksanakan&#10;1. Melakukan validasi kesesuaian layout visual 20 format naskah dinas dengan pedoman tata naskah dinas resmi UNSIL.&#10;2. Melaksanakan uji coba penerbitan TTE BSrE dengan enkripsi hash dokumen dan stempel QR-Code verifikasi dinas.&#10;&#10;C. Hasil yang Dicapai&#10;1. Sebanyak 20 format naskah dinas resmi berhasil diintegrasikan dengan sempurna ke dalam aplikasi SILOKA.&#10;&#10;D. Penutup&#10;Demikian laporan ini dibuat dengan sebenarnya sebagai bahan evaluasi dan pertanggungjawaban pelaksanaan kegiatan.'
                      : isTelaahStaf
                      ? 'Tuliskan memo dan kajian telaah I s.d. VI...&#10;Contoh:&#10;Kepada : Rektor Universitas Siliwangi&#10;Dari : Kepala Biro Umum dan Keuangan&#10;Tanggal : 08 September 2026&#10;Nomor : &#10;Lampiran : 1 (satu) Berkas&#10;Hal : Telaah Staf Peningkatan Keandalan Server dan Sertifikasi TTE BSrE SILOKA&#10;&#10;I. Persoalan&#10;Bagian persoalan memuat pernyataan singkat dan jelas tentang persoalan yang akan dipecahkan.&#10;&#10;II. Praanggapan&#10;Praanggapan memuat dugaan yang beralasan berdasarkan data dan saling berhubungan sesuai dengan situasi yang dihadapi.&#10;&#10;III. Fakta-fakta yang mempengaruhi&#10;Bagian fakta yang mempengaruhi memuat fakta yang merupakan landasan analisis dan pemecahan persoalan.&#10;&#10;IV. Analisis&#10;Bagian ini memuat analisis pengaruh praanggapan dan fakta terhadap persoalan serta akibatnya.&#10;&#10;V. Simpulan&#10;Bagian simpulan memuat intisari hasil analisis dan pilihan satu cara bertindak sebagai pemecahan persoalan.&#10;&#10;VI. Saran&#10;Bagian saran memuat secara ringkas dan jelas tentang saran tindakan untuk mengatasi persoalan yang dihadapi.'
                      : 'Tuliskan rincian kegiatan atau muatan pokok isi surat...&#10;Contoh:&#10;1. Hari/Tanggal : Senin, 21 September 2026&#10;2. Waktu : Pukul 09.00 WIB s.d. selesai&#10;3. Tempat : Ruang Rapat Rektorat Lantai 2 Kampus UNSIL'
                  }
                  className="w-full p-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                />
              </div>

              {/* Paragraf Penutup */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Kalimat Penutup
                </label>
                <textarea
                  rows={2}
                  value={kalimatPenutup}
                  onChange={(e) => setKalimatPenutup(e.target.value)}
                  placeholder={
                    isSuratTugas
                      ? 'Contoh: Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.'
                      : isNotaDinas
                      ? 'Contoh: Demikian nota dinas ini kami sampaikan, atas perhatian dan arahan Bapak diucapkan terima kasih.'
                      : isSuratPernyataan
                      ? 'Contoh: Surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.'
                      : isBeritaAcara
                      ? 'Contoh: Berita acara ini dibuat rangkap dua (2) untuk dipergunakan sebagaimana mestinya.'
                      : isSuratKeterangan
                      ? 'Contoh: Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.'
                      : isSuratPengantar
                      ? 'Contoh: Demikian surat pengantar ini kami sampaikan untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.'
                      : isLaporan
                      ? 'Contoh: Demikian laporan ini dibuat dengan sebenarnya sebagai bahan evaluasi dan pertanggungjawaban pelaksanaan kegiatan.'
                      : 'Tuliskan kalimat penutup naskah dinas...&#10;Contoh: Mengingat pentingnya agenda tersebut, kami mengharapkan kehadiran Saudara tepat waktu. Atas perhatian dan kerja sama yang baik, diucapkan terima kasih.'
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                />
              </div>

              {/* Penandatangan Kedinasan */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Penandatangan Naskah Dinas
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    {isMandiriDoc ? 'Tanda Tangan Mandiri' : 'TTE Resmi Pasca-Paraf'}
                  </span>
                </div>

                {/* 1. Deteksi Pengguna Aktif */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] bg-slate-100/90 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600">
                    Pengguna Aktif: <strong className="text-slate-900">{sessionUserName}</strong>
                  </span>
                  <span className="text-unsil-green-900 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Jabatan: {sessionUserJabatan} | Unit: {activeUnitObj.kode_unit} ({activeUnitObj.singkatan})
                  </span>
                </div>

                {/* 2 & 3. Kontrol Otoritas Penandatangan via Dropdown Select */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="signatory-select-authority" className="text-[10.5px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      {isMandiriDoc
                        ? 'Pilih Penandatangan / Pengesah Naskah:'
                        : 'Pilih Pejabat Penandatangan Akhir (TTE Pimpinan):'}
                    </label>
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      {selectedSignatoryRole === 'DOSEN_MANDIRI' ? 'TTD Mandiri Dosen' : 'TTE Resmi Pimpinan'}
                    </span>
                  </div>

                  {/* Dropdown Select Penandatangan */}
                  {(!currentTypeMeta?.available_signatories || currentTypeMeta.available_signatories.length === 0) ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        Pejabat Struktural Belum Terdaftar
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Belum ada akun pimpinan aktif untuk unit kerja ini di Manajemen Pengguna. Silakan koordinasikan dengan Administrator untuk menambahkan data pejabat terkait.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <select
                        id="signatory-select-authority"
                        value={selectedPejabatId || currentSignatoryObj?.id || ''}
                        onChange={(e) => handleSelectSignatory(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 shadow-2xs cursor-pointer"
                      >
                        {currentTypeMeta.available_signatories.map((sig) => (
                          <option key={sig.id} value={sig.id}>
                            {sig.nama_opsi || `${sig.display_role_label || sig.role_penandatangan}: ${sig.nama_gelar || sig.nama} (${sig.jabatan})`}
                          </option>
                        ))}
                      </select>

                      <p className="text-[10px] text-emerald-900/90 leading-relaxed">
                        {isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI'
                          ? 'Sesuai Peraturan Rektor No. 3 Tahun 2023, naskah mandiri ditandatangani langsung oleh dosen pembuat tanpa alur paraf berjenjang.'
                          : isMandiriDoc
                          ? 'Naskah mandiri ini dialirkan untuk diverifikasi dan disahkan oleh atasan langsung / pejabat berwenang terkait.'
                          : 'Naskah konsep draf usulan dialirkan berjenjang untuk paraf verifikasi dan penandatanganan elektronik (TTE) pimpinan.'}
                      </p>
                    </div>
                  )}

                  {/* Kartu Ringkas Profil Penandatangan Terpilih */}
                  {currentSignatoryObj && (
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] flex items-center justify-between shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-unsil-green-800 block">
                          {currentSignatoryObj.display_role_label || currentSignatoryObj.role_penandatangan}
                        </span>
                        <p className="font-bold text-slate-900">{currentSignatoryObj.nama_gelar || currentSignatoryObj.nama}</p>
                        <p className="text-slate-500 text-[10px]">{currentSignatoryObj.jabatan}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9.5px] font-mono font-bold text-unsil-green-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                          NIP: {currentSignatoryObj.nip || '-'}
                        </span>
                        <span className="text-[8.5px] text-slate-400 mt-0.5 block">
                          SSOT Manajemen Pengguna
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Tiga Input Terpisah: "Nama Pejabat", "Gelar", dan "NIP" (Terisi Otomatis) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Input 1: Nama Pejabat */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-slate-500 font-semibold">
                        Nama Penandatangan
                      </label>
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        Otomatis
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={namaPejabatSigner}
                        placeholder="Nama Penandatangan"
                        title="Nama penandatangan terisi otomatis sesuai pilihan."
                        className="w-full p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-not-allowed select-all focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Input 2: Gelar */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-slate-500 font-semibold">
                        Gelar
                      </label>
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        Otomatis
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={gelarSigner}
                        placeholder="Gelar Resmi"
                        title="Gelar akademik/profesi terisi otomatis."
                        className="w-full p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-not-allowed select-all focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Input 3: NIP */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-slate-500 font-semibold">
                        NIP
                      </label>
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        Otomatis
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={nipSigner}
                        placeholder="NIP 18 Digit"
                        title="NIP penandatangan terisi otomatis."
                        className="w-full p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 cursor-not-allowed select-all focus:outline-none tracking-wide"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Pedoman Tata Naskah Dinas */}
                {!isDosen && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-300 flex items-start gap-2 text-[10px] text-emerald-950 leading-relaxed shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Kewenangan Penandatanganan Sesuai Tata Naskah Dinas UNSIL:</strong> Pejabat penandatangan, gelar, dan NIP terisi secara otomatis sesuai hierarki unit kerja untuk memastikan kepatuhan tata kelola persuratan resmi.
                    </span>
                  </div>
                )}
              </div>

              {/* Tembusan (Hanya untuk naskah yang memiliki klausul tembusan seperti Surat Dinas) */}
              {!isSuratTugas ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tembusan (Satu per baris)
                  </label>
                  <textarea
                    rows={2}
                    value={tembusanText}
                    onChange={(e) => setTembusanText(e.target.value)}
                    placeholder="Tuliskan pihak tembusan tanpa nomor manual (satu per baris).&#10;Contoh:&#10;Rektor Universitas Siliwangi (sebagai laporan)&#10;Kepala Satuan Pengawas Internal (SPI)"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Sesuai spesimen resmi Gambar 2 & 3 Peraturan Rektor No. 3/2023, <strong>Surat Tugas tidak mencantumkan klausul tembusan</strong>.</span>
                  <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-300">Otomatis Tanpa Tembusan</span>
                </div>
              )}

              {/* Unggah Dokumen Lampiran Resmi PDF */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Unggah Dokumen Lampiran Resmi (PDF Maks. 5MB)
                  </label>
                  {uploadedFileName && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Lampiran Terlampir
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputKeluarRef}
                  accept="application/pdf,.pdf"
                  onChange={handleFileInputKeluar}
                  className="hidden"
                />

                {uploadedFileName ? (
                  /* Kartu Lampiran PDF Aktif & Fungsional */
                  <div className="border border-slate-200 bg-white rounded-xl p-3 shadow-xs hover:border-unsil-green-700/60 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={uploadedFileName}>
                            {uploadedFileName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{uploadedFileSize}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">Keaslian digital terverifikasi</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={handlePreviewFileKeluar}
                          title="Lihat Pratinjau Dokumen PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Pratinjau</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputKeluarRef.current?.click()}
                          title="Ganti Berkas PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-unsil-green-800 bg-unsil-green-50 hover:bg-unsil-green-100 border border-unsil-green-200 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-unsil-green-700" />
                          <span>Ganti</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFileKeluar}
                          title="Hapus Berkas"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Area Dropzone Unggah Lampiran Saat Kosong */
                  <div
                    onClick={() => fileInputKeluarRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingKeluar(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingKeluar(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingKeluar(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessFileKeluar(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                      isDraggingKeluar
                        ? 'border-emerald-600 bg-emerald-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-unsil-green-700 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <UploadCloud className={`w-7 h-7 mx-auto mb-1.5 transition-colors ${isDraggingKeluar ? 'text-emerald-700' : 'text-unsil-green-800'}`} />
                    <p className="text-xs font-semibold text-slate-800">
                      {isDraggingKeluar ? 'Lepaskan Berkas PDF di Sini' : 'Klik untuk Memilih Berkas atau Seret PDF ke Sini'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Khusus berkas lampiran naskah dinas resmi (PDF Maks. 5MB)
                    </p>
                  </div>
                )}

                {/* Alert Kesalahan Unggah */}
                {uploadErrorKeluar && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{uploadErrorKeluar}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadErrorKeluar('')}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          )}

          {/* SISI KANAN: PRATINJAU LEMBAR KERTAS (OTOMATIS F4 / A4 / LEMBAR AGENDA) */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div
              className={`flex-1 overflow-y-auto overflow-x-auto bg-slate-200/90 p-2 sm:p-8 flex flex-col items-center shadow-inner ${
                viewMode === 'split' ? 'w-full md:w-[54%]' : 'w-full'
              }`}
            >
              {letterType === 'surat-masuk' ? (
                /* ========================================================================= */
                /* PRATINJAU DOKUMEN PDF SURAT MASUK (LANGSUNG PDF)                          */
                /* ========================================================================= */
                (uploadedFileUrlMasuk || uploadedFileDataUrlMasuk) ? (
                  <div className="w-full max-w-[210mm] flex-1 flex flex-col relative rounded-xl overflow-hidden shadow-lg border border-slate-300 bg-white min-h-[680px] mb-4">
                    {/* Floating discreet action bar */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-md rounded-lg p-1">
                      <button
                        type="button"
                        onClick={handlePreviewFileMasuk}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold transition cursor-pointer"
                        title="Buka Dokumen PDF di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tab Baru</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputMasukRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-unsil-green-900 rounded-md text-[11px] font-bold border border-emerald-200 transition cursor-pointer"
                        title="Ganti Berkas PDF"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Ganti Berkas</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFileMasuk}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                        title="Hapus Berkas PDF"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Langsung PDF - Full Frame, No Navpanes, No Toolbar, Fit Width */}
                    <iframe
                      src={`${uploadedFileUrlMasuk || uploadedFileDataUrlMasuk}#toolbar=0&navpanes=0&view=FitH`}
                      title="Dokumen PDF Surat Masuk"
                      className="w-full h-full min-h-[680px] border-0"
                    />
                  </div>
                ) : (
                  /* Area Dropzone Unggah Interaktif Saat Kosong */
                  <div
                    onClick={() => fileInputMasukRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingMasuk(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingMasuk(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingMasuk(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessFileMasuk(file);
                    }}
                    className={`w-full max-w-[210mm] flex-1 p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[580px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                      isDraggingMasuk
                        ? 'border-emerald-600 bg-emerald-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-unsil-green-700 bg-white hover:bg-emerald-50/20 shadow-sm'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-unsil-green-800 flex items-center justify-center mb-4 border border-emerald-200 shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">
                      {isDraggingMasuk ? 'Lepaskan Berkas PDF di Sini' : 'Pilih Berkas PDF Surat Masuk'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
                      Pilih berkas atau seret dokumen PDF surat masuk fisik ke sini (Maksimal 5MB) untuk langsung menampilkan dokumen secara utuh.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputMasukRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-unsil-gold-400" />
                      <span>Pilih Berkas PDF Surat Masuk</span>
                    </button>
                    {uploadErrorMasuk && (
                      <div className="mt-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{uploadErrorMasuk}</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* ========================================================================= */
                /* PRATINJAU SURAT KELUAR / NOTA DINAS (A4 / F4)                             */
                /* ========================================================================= */
                <>
                  {/* Header Status Ukuran Kertas Otomatis */}
                  <div className="w-full max-w-[210mm] mb-2.5 flex items-center justify-between text-xs text-slate-600 px-1">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-unsil-green-800" />
                      Pratinjau Lembar {currentPaperInfo.code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-xs flex items-center gap-1.5 ${
                      currentPaperInfo.isF4
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentPaperInfo.isF4 ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'}`} />
                      Kertas Otomatis: {currentPaperInfo.badgeLabel} • {currentPaperInfo.isF4 ? 'Naskah Arahan' : 'Korespondensi/Lainnya'}
                    </span>
                  </div>

                  <div
                    id="siloka-create-letter-a4-preview"
                    data-paper-size={currentPaperInfo.code}
                    data-template-id={selectedTemplateId}
                    className={`printable-document bg-white w-full max-w-[210mm] p-8 sm:p-12 border border-black rounded-none shadow-none text-black font-serif text-[11.5px] leading-relaxed flex flex-col justify-between print:border-none print:shadow-none ${
                      isTelaahStaf ? 'pasal47-without-kop' : 'pasal47-with-kop'
                    } ${
                      currentPaperInfo.isF4 ? 'f4-sheet min-h-[330mm]' : 'a4-sheet min-h-[297mm]'
                    }`}
                    style={{ minHeight: currentPaperInfo.height }}
                  >
                    {/* BAGIAN ATAS DOKUMEN */}
                    <div>
                      {/* Kop Surat Resmi Universitas Siliwangi (Sesuai Gambar 3: Disembunyikan untuk Telaah Staf) */}
                      {!isTelaahStaf && (
                        <KopSuratUnsil
                          unit={activeUnitObj || currentUser}
                          hideUnit={selectedTemplateId === 'surat-dinas' || isSuratTugas}
                          forceUniversityHeader={selectedTemplateId === 'surat-dinas' || isSuratTugas}
                        />
                      )}

                      {/* Header Tabel Naskah Standar atau Format Khusus Sesuai Spesimen Resmi UNSIL */}
                      {isNotaDinas ? (
                        /* ========================================================================= */
                        /* FORMAT NOTA DINAS (SESUAI IMAGE 1 / CONTOH 06 PERATURAN REKTOR NO. 3/2023)*/
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul Nota Dinas (Tanpa Garis Bawah, Nomor Tanpa Titik Dua) */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              NOTA DINAS
                            </h2>
                            <p className="font-serif text-xs text-black mt-0.5">
                              Nomor {previewNomorSurat || '............/............/............/............'}
                            </p>
                          </div>

                          {/* Header Memo Yth / Dari / Hal (Sesuai Gambar 1: Tanpa Border Kotak/Garis) */}
                          <div className="my-4 font-serif text-[11.5px] space-y-1 text-black">
                            <div className="flex items-start">
                              <span className="w-16 shrink-0 font-normal">Yth.</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tujuan || <span className="text-slate-400 select-none">........................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-16 shrink-0 font-normal">Dari</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {pengirim || <span className="text-slate-400 select-none">........................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-16 shrink-0 font-normal">Hal</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {perihal || <span className="text-slate-400 select-none">........................................................</span>}
                              </span>
                            </div>
                          </div>

                          {/* Batang Tubuh Isi Nota Dinas */}
                          <div className="my-5 text-justify font-serif text-[11.5px] leading-relaxed text-black space-y-3.5">
                            {!kalimatPembuka && !isiPokok && !kalimatPenutup ? (
                              /* Tampilan Spesimen Blangko Resmi Saat Form Masih Kosong Sesuai Gambar 1 */
                              <div className="space-y-3 text-slate-400 font-serif select-none">
                                <div className="space-y-1">
                                  <p className="leading-relaxed">
                                    Kalimat pembuka <span className="tracking-widest">...........................................................................................................</span>
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ................................................................................................................................
                                  </p>
                                </div>
                                <div className="space-y-1 my-2">
                                  <p className="leading-relaxed">
                                    Isi Pokok <span className="tracking-widest">...................................................................................................................</span>
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ................................................................................................................................
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ................................................................................................................................
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ................................................................................................................................
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="leading-relaxed">
                                    Kalimat penutup <span className="tracking-widest">...........................................................................................................</span>
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ................................................................................................................................
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                {kalimatPembuka && (
                                  <p className="indent-8 sm:indent-10 leading-relaxed">{kalimatPembuka}</p>
                                )}
                                {isiPokok && (
                                  <div className="space-y-1 leading-relaxed">
                                    {isiPokok.split('\n').map((line, idx) => {
                                      const trimmed = line.trim();
                                      if (!trimmed) return <div key={idx} className="h-1.5" />;
                                      return (
                                        <p key={idx} className="indent-8 sm:indent-10 leading-relaxed">
                                          {line}
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}
                                {kalimatPenutup && (
                                  <p className="indent-8 sm:indent-10 leading-relaxed">{kalimatPenutup}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ) : isSuratPernyataan ? (
                        /* ========================================================================= */
                        /* FORMAT SURAT PERNYATAAN (SESUAI IMAGE 2 / CONTOH 14 PERATURAN REKTOR 3/23)*/
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul & Nomor Surat Pernyataan */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              SURAT PERNYATAAN
                            </h2>
                            <p className="font-serif text-xs text-black mt-0.5">
                              Nomor {previewNomorSurat || '........../...../...../.........'}
                            </p>
                          </div>

                          {/* Pembuka Yang Bertanda Tangan di Bawah Ini */}
                          <div className="text-xs text-black font-serif space-y-3 leading-relaxed">
                            <p>
                              {kalimatPembuka ? (
                                kalimatPembuka.endsWith(',') ? kalimatPembuka : `${kalimatPembuka},`
                              ) : (
                                'Yang bertanda tangan di bawah ini,'
                              )}
                            </p>

                            {/* Identitas Diri (Sesuai Image 2: Label Huruf Kecil & Kolon Sejajar) */}
                            <div className="space-y-1 text-xs">
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">nama</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sperParsed?.nama || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">NIP</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sperParsed?.nip || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">pangkat dan golongan</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sperParsed?.pangkatGolongan || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">jabatan</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sperParsed?.jabatan || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">alamat</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sperParsed?.alamat || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                            </div>

                            {/* Isi Pernyataan Sesuai Image 2 */}
                            <div className="pt-2 text-justify font-serif leading-relaxed">
                              {sperParsed?.isiPernyataan ? (
                                <div className="space-y-2 whitespace-pre-line">
                                  {sperParsed.isiPernyataan.toLowerCase().startsWith('isi pernyataan') ? (
                                    <p>{sperParsed.isiPernyataan}</p>
                                  ) : (
                                    <p>
                                      <span className="font-normal">Isi Pernyataan </span>
                                      {sperParsed.isiPernyataan}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5 text-slate-400 select-none">
                                  <p className="leading-relaxed">
                                    Isi Pernyataan <span className="tracking-widest">........................................................................................................................</span>
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ...................................................................................................................................................
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ...................................................................................................................................................
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ...................................................................................................................................................
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ...................................................................................................................................................
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Penutup Baku Sesuai Image 2 */}
                            <p className="pt-2">
                              {kalimatPenutup || 'Surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.'}
                            </p>
                          </div>
                        </div>
                      ) : isBeritaAcara ? (
                        /* ========================================================================= */
                        /* FORMAT BERITA ACARA (SESUAI CONTOH 12 PERATURAN REKTOR NO. 3/2023)        */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul & Nomor Berita Acara */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              BERITA ACARA
                            </h2>
                            <p className="font-serif text-xs text-black mt-0.5">
                              Nomor {previewNomorSurat || '........../...../...../.........'}
                            </p>
                          </div>

                          {/* Komparisi Para Pihak Sesuai Contoh 12 */}
                          <div className="text-xs text-justify font-serif text-black space-y-3 leading-relaxed">
                            <p>
                              {kalimatPembuka || (
                                <>
                                  Pada hari ini, <span className="font-semibold">....................</span>, tanggal{' '}
                                  <span className="font-semibold">....................</span>, bulan{' '}
                                  <span className="font-semibold">....................</span>, tahun{' '}
                                  <span className="font-semibold">....................</span>, kami masing-masing:
                                </>
                              )}
                            </p>

                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="shrink-0 font-normal">1.</span>
                                <p className="flex-1 leading-relaxed">
                                  {baParsed?.pihak1 ? (
                                    baParsed.pihak1.toLowerCase().includes('pihak pertama') ? (
                                      baParsed.pihak1
                                    ) : (
                                      <>
                                        {baParsed.pihak1}, selanjutnya disebut <span className="font-bold">Pihak Pertama</span>, dan
                                      </>
                                    )
                                  ) : (
                                    <span className="text-slate-400 select-none">
                                      ..................................................................................................................................................................................
                                      <br />
                                      selanjutnya disebut Pihak Pertama, dan
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="shrink-0 font-normal">2.</span>
                                <p className="flex-1 leading-relaxed">
                                  {baParsed?.pihak2 ? (
                                    baParsed.pihak2.toLowerCase().includes('pihak kedua') ? (
                                      baParsed.pihak2
                                    ) : (
                                      <>
                                        {baParsed.pihak2}, selanjutnya disebut <span className="font-bold">Pihak Kedua</span>,
                                      </>
                                    )
                                  ) : (
                                    <span className="text-slate-400 select-none">
                                      ..................................................................................................................................................................................
                                      <br />
                                      selanjutnya disebut Pihak Kedua,
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Uraian Kegiatan */}
                            <div>
                              <p>
                                telah melaksanakan{' '}
                                {baParsed?.kegiatanList && baParsed.kegiatanList.length > 0
                                  ? ''
                                  : '..................................................................................................................................................................................................................................................................................................................................................................................................'}
                              </p>
                              {baParsed?.kegiatanList && baParsed.kegiatanList.length > 0 && (
                                <div className="pl-6 space-y-1 pt-1">
                                  {baParsed.kegiatanList.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <span className="shrink-0 font-normal">{idx + 1}.</span>
                                      <p className="leading-relaxed">{item}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Dasar & Jumlah Rangkap Sesuai Contoh 12 */}
                            <div className="pt-2 space-y-2">
                              <p>
                                Berita acara ini dibuat dengan sesungguhnya berdasarkan{' '}
                                {baParsed?.dasar ||
                                  '....................................................................................................................................................................................................................................................................................................................................................'}
                                .
                              </p>
                              <p>
                                {kalimatPenutup ||
                                  'Berita acara ini dibuat rangkap dua (2) untuk dipergunakan sebagaimana mestinya.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : isStLembar ? (
                        /* ========================================================================= */
                        /* FORMAT SURAT TUGAS - BENTUK LEMBARAN (SESUAI IMAGE 1 / GAMBAR 2 RESMI)    */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul Surat Tugas (Font Normal Serif, Uppercase Sesuai Image 1) */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-normal tracking-wider uppercase text-black">
                              SURAT TUGAS
                            </h2>
                            <p className="font-serif text-[11px] text-black mt-0.5">
                              Nomor {previewNomorSurat || '......./......../......../.......'}
                            </p>
                          </div>

                          {/* Kalimat Pembuka */}
                          <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
                            <p>
                              {kalimatPembuka ? (
                                kalimatPembuka.endsWith(',') ? kalimatPembuka : `${kalimatPembuka},`
                              ) : (
                                <span className="text-slate-400 select-none">
                                  (Kalimat pembuka) <span className="tracking-widest">.........................................................................................................................</span>
                                  <br />
                                  <span className="tracking-widest">....................................................................................................................,</span>
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Identitas Personal Bentuk Lembaran (Sesuai Image 1) */}
                          <div className="my-5 font-serif text-[11.5px] space-y-1.5 text-black">
                            <div className="flex items-baseline">
                              <span className="w-44 sm:w-48 shrink-0">Nama</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="text-black flex-1 font-serif">
                                {stLembarParsed?.nama || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-44 sm:w-48 shrink-0">NIP</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="text-black flex-1 font-serif">
                                {stLembarParsed?.nip || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-44 sm:w-48 shrink-0">Pangkat dan golongan</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="text-black flex-1 font-serif">
                                {stLembarParsed?.pangkatGolongan || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-44 sm:w-48 shrink-0">Jabatan</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="text-black flex-1 font-serif">
                                {stLembarParsed?.jabatan || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
                              </span>
                            </div>
                          </div>

                          {/* Uraian Tugas, Tanggal, dan Tempat */}
                          <div className="my-5 text-justify font-serif text-[11.5px] leading-relaxed text-black">
                            {stLembarParsed?.untukTugas ? (
                              <p>
                                {stLembarParsed.untukTugas.toLowerCase().startsWith('untuk')
                                  ? stLembarParsed.untukTugas
                                  : `Untuk ${stLembarParsed.untukTugas}`}
                              </p>
                            ) : (
                              <div className="space-y-1 text-slate-400 select-none">
                                <p className="leading-relaxed">
                                  Untuk <span className="tracking-widest">.........................................................................</span> tanggal <span className="tracking-widest">..........................</span> di
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ...............................................................................................................................
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ...............................................................................................................................
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Kalimat Penutup Baku Sesuai Spesimen Image 1 */}
                          <div className="my-5 text-justify font-serif text-[11.5px] leading-relaxed text-black">
                            <p>
                              {kalimatPenutup || 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.'}
                            </p>
                          </div>
                        </div>
                      ) : isStKolom ? (
                        /* ========================================================================= */
                        /* FORMAT SURAT TUGAS - BENTUK KOLOM (SESUAI IMAGE 2 / GAMBAR 3 RESMI)       */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul Surat Tugas Kolom (Sesuai Image 2: "Nomor: ") */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-normal tracking-wider uppercase text-black">
                              SURAT TUGAS
                            </h2>
                            <p className="font-serif text-[11px] text-black mt-0.5">
                              Nomor: {previewNomorSurat || '......./......../......../.......'}
                            </p>
                          </div>

                          {/* Kalimat Pembuka */}
                          <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
                            <p>
                              {kalimatPembuka ? (
                                kalimatPembuka.endsWith(',') ? kalimatPembuka : `${kalimatPembuka},`
                              ) : (
                                <span className="text-slate-400 select-none">
                                  (Kalimat pembuka) <span className="tracking-widest">.........................................................................................................................</span>
                                  <br />
                                  <span className="tracking-widest">....................................................................................................................,</span>
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Tabel Kolom Bergaris Tegas (Sesuai Image 2) */}
                          <div className="my-4 overflow-x-auto font-serif text-black">
                            <table className="w-full border-collapse border border-black text-[11px]">
                              <thead>
                                <tr className="border-b border-black font-normal text-black text-center">
                                  <th className="border-r border-black p-2 w-12 text-center font-normal">No.</th>
                                  <th className="border-r border-black p-2 text-center font-normal">Nama, NIP, Pangkat dan Golongan</th>
                                  <th className="p-2 text-center font-normal">Jabatan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black text-black">
                                {stKolomParsed?.pesertaList && stKolomParsed.pesertaList.length > 0 ? (
                                  stKolomParsed.pesertaList.map((p, idx) => (
                                    <tr key={idx}>
                                      <td className="border-r border-black p-2 text-center align-top">{p.no || idx + 1}.</td>
                                      <td className="border-r border-black p-2 align-top space-y-0.5">
                                        <p className="font-normal text-black">{p.nama}</p>
                                        {p.nip && <p className="text-[10.5px] text-black">NIP {p.nip}</p>}
                                        {p.pangkatGolongan && <p className="text-[10.5px] text-black">{p.pangkatGolongan}</p>}
                                      </td>
                                      <td className="p-2 align-top text-black">{p.jabatan}</td>
                                    </tr>
                                  ))
                                ) : (
                                  /* Baris Blangko Kosong Sesuai Gambar 3 / Image 2 */
                                  <tr>
                                    <td className="border-r border-black p-4 h-28 text-center align-top">&nbsp;</td>
                                    <td className="border-r border-black p-4 h-28 align-top">&nbsp;</td>
                                    <td className="p-4 h-28 align-top">&nbsp;</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Uraian Tugas, Tanggal, dan Tempat */}
                          <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
                            {stKolomParsed?.untukTugas ? (
                              <p>
                                {stKolomParsed.untukTugas.toLowerCase().startsWith('untuk')
                                  ? stKolomParsed.untukTugas
                                  : `Untuk ${stKolomParsed.untukTugas}`}
                              </p>
                            ) : (
                              <div className="space-y-1 text-slate-400 select-none">
                                <p className="leading-relaxed">
                                  Untuk <span className="tracking-widest">.........................................................................</span> tanggal <span className="tracking-widest">..........................</span> di
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ...............................................................................................................................
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Kalimat Penutup Baku */}
                          <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
                            <p>
                              {kalimatPenutup || 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.'}
                            </p>
                          </div>
                        </div>
                      ) : isSuratKeterangan ? (
                        /* ========================================================================= */
                        /* FORMAT SURAT KETERANGAN (SESUAI CONTOH 15 / GAMBAR 4 SPESIMEN RESMI)     */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul & Nomor Surat Keterangan (Nomor Tanpa Titik Dua) */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              SURAT KETERANGAN
                            </h2>
                            <p className="font-serif text-xs text-black mt-0.5">
                              Nomor {previewNomorSurat || '........../...../...../.........'}
                            </p>
                          </div>

                          {/* Isi Surat Keterangan */}
                          <div className="text-xs text-black font-serif space-y-3 leading-relaxed">
                            <p>Yang bertanda tangan di bawah ini,</p>

                            {/* Pejabat yang menerangkan */}
                            <div className="space-y-1 text-xs">
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">nama</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pejabatNama || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">NIP</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pejabatNip || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">pangkat dan golongan</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pejabatPangkatGol || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">jabatan</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pejabatJabatan || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                            </div>

                            <p className="pt-2">dengan ini menerangkan bahwa,</p>

                            {/* Pegawai yang diterangkan */}
                            <div className="space-y-1 text-xs">
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">nama</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pegawaiNama || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">NIP</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pegawaiNip || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">pangkat dan golongan</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pegawaiPangkatGol || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-40 sm:w-44 shrink-0 font-normal">jabatan</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="flex-1 font-serif text-black">
                                  {sketParsed?.pegawaiJabatan || <span className="text-slate-400 select-none">...........................................................................</span>}
                                </span>
                              </div>
                            </div>

                            {/* Narasi Isi Keterangan */}
                            <div className="pt-2 text-justify font-serif leading-relaxed">
                              {sketParsed?.isiKeterangan ? (
                                <div className="space-y-2 whitespace-pre-line">
                                  {sketParsed.isiKeterangan.toLowerCase().startsWith('isi keterangan') ? (
                                    <p>{sketParsed.isiKeterangan}</p>
                                  ) : (
                                    <p>
                                      <span className="font-normal">Isi Keterangan </span>
                                      {sketParsed.isiKeterangan}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5 text-slate-400 select-none">
                                  <p className="leading-relaxed">
                                    Isi Keterangan <span className="tracking-widest">........................................................................................................................</span>
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ...................................................................................................................................................
                                  </p>
                                  <p className="leading-relaxed tracking-widest">
                                    ...................................................................................................................................................
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Penutup Baku Sesuai Gambar 4 */}
                            <p className="pt-2">
                              {kalimatPenutup || 'Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.'}
                            </p>
                          </div>
                        </div>
                      ) : isSuratPengantar ? (
                        /* ========================================================================= */
                        /* FORMAT SURAT PENGANTAR (SESUAI CONTOH 17 / GAMBAR 5 SPESIMEN RESMI)       */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul & Nomor Surat Pengantar (Nomor Tanpa Titik Dua) */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              SURAT PENGANTAR
                            </h2>
                            <p className="font-serif text-xs text-black mt-0.5">
                              Nomor {previewNomorSurat || '........./...../...../.........'}
                            </p>
                          </div>

                          {/* Tujuan Surat */}
                          <div className="text-xs font-serif text-black mb-4 space-y-0.5">
                            <p>
                              Yth. {tujuan || <span className="text-slate-400 select-none">...................................................</span>}
                            </p>
                            <p className="text-black">
                              {alamatTujuan || (tujuan ? '' : <span className="text-slate-400 select-none">...................................................</span>)}
                            </p>
                          </div>

                          {/* Pembuka */}
                          <p className="text-xs font-serif text-black mb-2">
                            {kalimatPembuka || 'Bersama ini kami sampaikan:'}
                          </p>

                          {/* Tabel 4 Kolom: No. | Jenis Dokumen/Barang | Jumlah | Keterangan */}
                          <div className="mb-4 overflow-x-auto">
                            <table className="w-full border-collapse border border-black text-xs font-serif">
                              <thead>
                                <tr className="border-b border-black text-center font-normal text-black">
                                  <th className="border-r border-black p-2 w-10 text-center font-normal">No.</th>
                                  <th className="border-r border-black p-2 text-center font-normal">Jenis Dokumen/Barang</th>
                                  <th className="border-r border-black p-2 w-28 text-center font-normal">Jumlah</th>
                                  <th className="p-2 w-44 text-center font-normal">Keterangan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black text-black">
                                {spengParsed?.items && spengParsed.items.length > 0 ? (
                                  spengParsed.items.map((item, idx) => (
                                    <tr key={idx} className="align-top">
                                      <td className="border-r border-black p-2 text-center">{idx + 1}.</td>
                                      <td className="border-r border-black p-2 leading-relaxed">{item.jenis}</td>
                                      <td className="border-r border-black p-2 text-center leading-relaxed">{item.jumlah}</td>
                                      <td className="p-2 leading-relaxed">{item.keterangan}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <>
                                    <tr className="h-16">
                                      <td className="border-r border-black p-2 text-center text-slate-400"></td>
                                      <td className="border-r border-black p-2"></td>
                                      <td className="border-r border-black p-2"></td>
                                      <td className="p-2"></td>
                                    </tr>
                                    <tr className="h-16">
                                      <td className="border-r border-black p-2 text-center text-slate-400"></td>
                                      <td className="border-r border-black p-2"></td>
                                      <td className="border-r border-black p-2"></td>
                                      <td className="p-2"></td>
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Kalimat Penutup */}
                          <div className="text-xs font-serif text-black mb-4 text-justify leading-relaxed">
                            {kalimatPenutup ? (
                              <p>{kalimatPenutup}</p>
                            ) : (
                              <p className="text-slate-400 select-none">
                                Kalimat penutup <span className="tracking-widest">........................................................................................................................</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : isNotula ? (
                        /* ========================================================================= */
                        /* FORMAT NOTULA (SESUAI CONTOH 19 / GAMBAR 1 SPESIMEN RESMI)                */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul Notula (Kapital Bold Tanpa Garis Bawah, Tanpa Nomor) */}
                          <div className="naskah-judul-block text-center my-4 font-serif text-black">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              NOTULA
                            </h2>
                          </div>

                          {/* Metadata Rapat (Titik Dua Sejajar Tanpa Garis Pembatas Sesuai Gambar 1) */}
                          <div className="text-xs font-serif text-black space-y-1.5 mb-4">
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Nama rapat</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {notulaParsed?.namaRapat || <span className="text-slate-400 select-none">...........................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Hari, tanggal</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {notulaParsed?.hariTanggal || <span className="text-slate-400 select-none">...........................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Pukul</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {notulaParsed?.pukul || <span className="text-slate-400 select-none">...........................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Tempat</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {notulaParsed?.tempat || <span className="text-slate-400 select-none">...........................................................................</span>}
                              </span>
                            </div>

                            {/* Susunan Acara */}
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Susunan acara</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <div className="flex-1 font-serif text-black space-y-0.5">
                                {notulaParsed?.susunanAcara && notulaParsed.susunanAcara.length > 0 ? (
                                  notulaParsed.susunanAcara.map((acara, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <span className="w-4">{idx + 1}.</span>
                                      <span>{acara}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-slate-400 select-none space-y-0.5">
                                    <p>1. .....................................................................................</p>
                                    <p className="pl-4">2. dan seterusnya.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Pemimpin, Notulis, Peserta Rapat */}
                          <div className="text-xs font-serif text-black space-y-1.5 my-4">
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Pemimpin rapat</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {notulaParsed?.pemimpinRapat || <span className="text-slate-400 select-none">...........................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Pencatat/notulis</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {notulaParsed?.notulis || <span className="text-slate-400 select-none">...........................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-36 sm:w-40 shrink-0 font-normal">Peserta rapat</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <div className="flex-1 font-serif text-black space-y-0.5">
                                {notulaParsed?.pesertaRapat && notulaParsed.pesertaRapat.length > 0 ? (
                                  notulaParsed.pesertaRapat.map((peserta, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <span className="w-4">{idx + 1}.</span>
                                      <span>{peserta}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-slate-400 select-none space-y-0.5">
                                    <p>1. .....................................................................................</p>
                                    <p className="pl-4">2. dan seterusnya.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Substansi Rapat: Persoalan, Tanggapan, Simpulan */}
                          <div className="text-xs font-serif text-black space-y-2.5 my-4 text-justify leading-relaxed">
                            <div className="flex items-start">
                              <span className="w-48 sm:w-52 shrink-0 font-normal">1. Persoalan yang dibahas</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <div className="flex-1 font-serif text-black">
                                {notulaParsed?.persoalanDibahas || (
                                  <span className="text-slate-400 select-none">...................................................................................................................</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start">
                              <span className="w-48 sm:w-52 shrink-0 font-normal">2. Tanggapan peserta rapat</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <div className="flex-1 font-serif text-black">
                                {notulaParsed?.tanggapanPeserta || (
                                  <span className="text-slate-400 select-none">...................................................................................................................</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start">
                              <span className="w-48 sm:w-52 shrink-0 font-normal">3. Simpulan</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <div className="flex-1 font-serif text-black">
                                {notulaParsed?.simpulan || (
                                  <span className="text-slate-400 select-none">...................................................................................................................</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isLaporan ? (
                        /* ========================================================================= */
                        /* FORMAT LAPORAN (SESUAI CONTOH 20 / GAMBAR 2 SPESIMEN RESMI)               */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Judul Laporan (LAPORAN / TENTANG / Titik-titik judul, Tanpa Nomor) */}
                          <div className="naskah-judul-block text-center font-serif text-black my-4 space-y-0.5">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              LAPORAN
                            </h2>
                            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-black">
                              TENTANG
                            </h3>
                            <div className="pt-1 max-w-xl mx-auto">
                              {lapParsed?.tentang ? (
                                <p className="text-xs sm:text-sm font-normal uppercase tracking-wide leading-relaxed">
                                  {lapParsed.tentang}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 select-none tracking-widest">
                                  ........................................................................................................
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Sistematika Laporan A-D Sesuai Gambar 2 */}
                          <div className="text-xs font-serif text-black space-y-3.5 text-justify leading-relaxed my-5">
                            {/* A. Pendahuluan */}
                            <div className="space-y-1.5">
                              <p className="font-normal text-black">A. Pendahuluan</p>
                              <div className="pl-6 space-y-1.5">
                                <div>
                                  <p className="font-normal text-black">1. Latar Belakang</p>
                                  {lapParsed?.latarBelakang ? (
                                    <p className="pl-4 mt-0.5 whitespace-pre-line">{lapParsed.latarBelakang}</p>
                                  ) : (
                                    <p className="pl-4 text-slate-400 select-none tracking-widest">........................................................................................................................</p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-normal text-black">2. Dasar</p>
                                  {lapParsed?.dasar ? (
                                    <p className="pl-4 mt-0.5 whitespace-pre-line">{lapParsed.dasar}</p>
                                  ) : (
                                    <p className="pl-4 text-slate-400 select-none tracking-widest">........................................................................................................................</p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-normal text-black">3. Ruang Lingkup</p>
                                  {lapParsed?.ruangLingkup ? (
                                    <p className="pl-4 mt-0.5 whitespace-pre-line">{lapParsed.ruangLingkup}</p>
                                  ) : (
                                    <p className="pl-4 text-slate-400 select-none tracking-widest">........................................................................................................................</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* B. Kegiatan yang Dilaksanakan */}
                            <div className="space-y-1">
                              <p className="font-normal text-black">B. Kegiatan yang Dilaksanakan</p>
                              <div className="pl-6">
                                {lapParsed?.kegiatanDilaksanakan ? (
                                  <p className="whitespace-pre-line">{lapParsed.kegiatanDilaksanakan}</p>
                                ) : (
                                  <div className="space-y-1 text-slate-400 select-none tracking-widest">
                                    <p>....................................................................................................................................</p>
                                    <p>....................................................................................................................................</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* C. Hasil yang Dicapai */}
                            <div className="space-y-1">
                              <p className="font-normal text-black">C. Hasil yang Dicapai</p>
                              <div className="pl-6">
                                {lapParsed?.hasilDicapai ? (
                                  <p className="whitespace-pre-line">{lapParsed.hasilDicapai}</p>
                                ) : (
                                  <div className="space-y-1 text-slate-400 select-none tracking-widest">
                                    <p>....................................................................................................................................</p>
                                    <p>....................................................................................................................................</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* D. Penutup Sesuai Gambar 2 */}
                            <div className="space-y-1">
                              <p className="font-normal text-black">D. Penutup</p>
                              <div className="pl-6">
                                {lapParsed?.penutup ? (
                                  <p className="whitespace-pre-line">{lapParsed.penutup}</p>
                                ) : (
                                  <p className="text-slate-400 select-none tracking-widest">....................................................................................................................................</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isTelaahStaf ? (
                        /* ========================================================================= */
                        /* FORMAT TELAAH STAF (SESUAI CONTOH 21 / GAMBAR 3 SPESIMEN RESMI)           */
                        /* ========================================================================= */
                        <div className="font-serif text-black">
                          {/* Header Judul (TELAAH STAF / TENTANG / Titik-titik) */}
                          <div className="naskah-judul-block text-center font-serif text-black my-4 space-y-0.5">
                            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
                              TELAAH STAF
                            </h2>
                            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-black">
                              TENTANG
                            </h3>
                            <div className="pt-1 max-w-xl mx-auto">
                              {tsParsed?.tentang ? (
                                <p className="text-xs sm:text-sm font-normal uppercase tracking-wide leading-relaxed">
                                  {tsParsed.tentang}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 select-none tracking-widest">
                                  ........................................................................................................
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Metadata Memo: Kepada, Dari, Tanggal, Nomor, Lampiran, Hal (Titik Dua Sejajar) */}
                          <div className="text-xs font-serif text-black my-5 space-y-1.5 max-w-xl">
                            <div className="flex items-baseline">
                              <span className="w-24 sm:w-28 shrink-0 font-normal">Kepada</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tsParsed?.kepada || <span className="text-slate-400 select-none">................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-24 sm:w-28 shrink-0 font-normal">Dari</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tsParsed?.dari || <span className="text-slate-400 select-none">................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-24 sm:w-28 shrink-0 font-normal">Tanggal</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tsParsed?.tanggal || <span className="text-slate-400 select-none">................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-24 sm:w-28 shrink-0 font-normal">Nomor</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tsParsed?.nomor || <span className="text-slate-400 select-none">................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-24 sm:w-28 shrink-0 font-normal">Lampiran</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tsParsed?.lampiran || <span className="text-slate-400 select-none">................................................................</span>}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-24 sm:w-28 shrink-0 font-normal">Hal</span>
                              <span className="w-4 shrink-0 text-center">:</span>
                              <span className="flex-1 font-serif text-black">
                                {tsParsed?.hal || <span className="text-slate-400 select-none">................................................................</span>}
                              </span>
                            </div>
                          </div>

                          {/* Sistematika I s.d. VI */}
                          <div className="text-xs font-serif text-black space-y-3.5 text-justify leading-relaxed mb-6">
                            <div className="space-y-1">
                              <div className="flex gap-2.5 font-normal text-black">
                                <span className="w-6 shrink-0">I.</span>
                                <span>Persoalan</span>
                              </div>
                              <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
                                {tsParsed?.persoalan || (
                                  <p className="text-slate-400 select-none">
                                    Bagian persoalan memuat pernyataan singkat dan jelas tentang persoalan yang akan dipecahkan.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex gap-2.5 font-normal text-black">
                                <span className="w-6 shrink-0">II.</span>
                                <span>Pranggapan</span>
                              </div>
                              <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
                                {tsParsed?.pranggapan || (
                                  <p className="text-slate-400 select-none">
                                    Pranggapan memuat dugaan yang beralasan berdasarkan data dan saling berhubungan sesuai dengan situasi yang dihadapi dan merupakan kemungkinan kejadian di masa mendatang.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex gap-2.5 font-normal text-black">
                                <span className="w-6 shrink-0">III.</span>
                                <span>Fakta-fakta yang mempengaruhi</span>
                              </div>
                              <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
                                {tsParsed?.faktaMempengaruhi || (
                                  <p className="text-slate-400 select-none">
                                    Bagian fakta yang mempengaruhi memuat fakta yang merupakan landasan analisis dan pemecahan persoalan.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex gap-2.5 font-normal text-black">
                                <span className="w-6 shrink-0">IV.</span>
                                <span>Analisis</span>
                              </div>
                              <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
                                {tsParsed?.analisis || (
                                  <p className="text-slate-400 select-none">
                                    Bagian ini memuat analisis pengaruh pranggapan dan fakta terhadap persoalan serta akibatnya, hambatan serta keuntungan dan kerugiannya, serta pemecahan atau cara bertindak yang mungkin atau dapat dilakukan.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex gap-2.5 font-normal text-black">
                                <span className="w-6 shrink-0">V.</span>
                                <span>Simpulan</span>
                              </div>
                              <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
                                {tsParsed?.simpulan || (
                                  <p className="text-slate-400 select-none">
                                    Bagian simpulan memuat intisari hasil analisis dan pilihan satu cara bertindak atau jalan keluar sebagai pemecahan persoalan yang dihadapi.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex gap-2.5 font-normal text-black">
                                <span className="w-6 shrink-0">VI.</span>
                                <span>Saran</span>
                              </div>
                              <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
                                {tsParsed?.saran || (
                                  <p className="text-slate-400 select-none">
                                    Bagian saran memuat secara ringkas dan jelas tentang saran tindakan untuk mengatasi persoalan yang dihadapi.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* FORMAT SURAT DINAS RESMI (SESUAI GAMBAR SPESIMEN PERATURAN REKTOR UNSIL NO. 3/2023) */
                        <div className="my-3 font-serif text-[11px] text-black">
                          {/* Baris Nomor, Lampiran, Hal di Kiri dan Tanggal di Kanan (Sejajar Baris Nomor) */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-baseline">
                                <span className="w-20 font-normal shrink-0">Nomor</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="font-serif text-black">{previewNomorSurat}</span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-20 font-normal shrink-0">Lampiran</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="font-serif text-black">{lampiran}</span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="w-20 font-normal shrink-0">Hal</span>
                                <span className="w-4 shrink-0 text-center">:</span>
                                <span className="font-serif text-black">
                                  {perihal || (
                                    <span className="text-slate-400 font-serif tracking-widest select-none">
                                      ...................................................
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="text-right font-serif text-[11px] text-black pt-0.5 shrink-0 pl-4">
                              <p>{formattedDateA4}</p>
                            </div>
                          </div>

                          {/* Tujuan Surat (Yth.) Terletak di Sisi Kiri di Bawah Hal Sesuai Spesimen Resmi */}
                          <div className="mt-5 text-left font-serif text-[11.5px] leading-snug text-black">
                            <p className="font-normal text-black">
                              Yth. {tujuan || (
                                <span className="text-slate-400 font-serif tracking-widest select-none">
                                  ...................................................
                                </span>
                              )}
                            </p>
                            {alamatTujuan ? (
                              <p className="text-black">{alamatTujuan}</p>
                            ) : !tujuan ? (
                              <p className="text-slate-400 font-serif tracking-widest select-none">
                                ...................................................
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Batang Tubuh Isi Naskah Dinas (Hanya untuk Surat Dinas / Naskah Standar Non-Khusus) */}
                      {!isSuratTugas && !isNotaDinas && !isSuratPernyataan && !isBeritaAcara && !isSuratKeterangan && !isSuratPengantar && !isNotula && !isLaporan && !isTelaahStaf && (
                        <div className="mt-5 space-y-3.5 text-justify text-[11.5px] leading-relaxed font-serif text-black">
                          {!kalimatPembuka && !isiPokok && !kalimatPenutup ? (
                            /* Tampilan Spesimen Blangko Resmi (Peraturan Rektor No. 3/2023 Gambar 5) Saat Form Masih Kosong */
                            <div className="space-y-3 text-slate-400 font-serif select-none">
                              <div className="space-y-1">
                                <p className="leading-relaxed">
                                  Kalimat pembuka <span className="tracking-widest">...........................................................................................................</span>
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ................................................................................................................................
                                </p>
                              </div>
                              <div className="space-y-1 my-2">
                                <p className="leading-relaxed">
                                  Isi surat <span className="tracking-widest">...................................................................................................................</span>
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ................................................................................................................................
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ................................................................................................................................
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="leading-relaxed">
                                  Kalimat penutup <span className="tracking-widest">...........................................................................................................</span>
                                </p>
                                <p className="leading-relaxed tracking-widest">
                                  ................................................................................................................................
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {kalimatPembuka && (
                                <p className="indent-8 sm:indent-10 leading-relaxed">{kalimatPembuka}</p>
                              )}
                              {isiPokok && (
                                <div className="font-serif text-[11.5px] leading-relaxed text-justify space-y-1">
                                  {isiPokok.split('\n').map((line, idx) => {
                                    const trimmed = line.trim();
                                    if (!trimmed) {
                                      return <div key={idx} className="h-1.5" />;
                                    }

                                    // Deteksi apakah baris rincian memiliki titik dua (contoh: "1. Hari/Tanggal : Senin...")
                                    const colonMatch = line.match(/^(\s*(?:\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])?\s*[^:\n]{2,35})\s*:\s*(.+)$/);
                                    if (colonMatch) {
                                      const [, label, val] = colonMatch;
                                      return (
                                        <div key={idx} className="ml-8 sm:ml-10 flex items-baseline">
                                          <span className="w-28 sm:w-32 shrink-0">{label.trim()}</span>
                                          <span className="w-4 shrink-0 text-center">:</span>
                                          <span className="flex-1">{val.trim()}</span>
                                        </div>
                                      );
                                    }

                                    // Deteksi apakah baris berbutir / berangka tanpa titik dua (contoh: "1. Melakukan koordinasi...")
                                    const isListItem = /^\s*(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s+/.test(line);
                                    if (isListItem) {
                                      return (
                                        <div key={idx} className="ml-8 sm:ml-10">
                                          <p className="leading-relaxed">{line.trim()}</p>
                                        </div>
                                      );
                                    }

                                    // Paragraf naratif biasa dengan indentasi awal alinea
                                    return (
                                      <p key={idx} className="indent-8 sm:indent-10 leading-relaxed">
                                        {line}
                                      </p>
                                    );
                                  })}
                                </div>
                              )}
                              {kalimatPenutup && (
                                <p className="indent-8 sm:indent-10 leading-relaxed">{kalimatPenutup}</p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* BAGIAN BAWAH DOKUMEN: PENANDATANGAN & TEMBUSAN SESUAI SPESIMEN RESMI */}
                    <div className="mt-8 font-serif text-black">
                      {isSuratTugas ? (
                        /* Surat Tugas: Tanpa Tembusan, Tanda Tangan Resmi di Kanan Bawah Sesuai Image 1 & 2 */
                        <div className="flex justify-end">
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs font-normal text-black leading-tight">
                              {formattedDateA4 || 'Tanggal'}
                            </p>
                            <p className="text-xs font-normal text-black leading-tight mt-0.5">
                              {(() => {
                                const raw = namaJabatanSigner || 'Rektor';
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[52px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Pejabat Struktural'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI' ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Dosen Pembuat Naskah'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Tanda Tangan Mandiri Dosen</p>
                                </div>
                              ) : (
                                <div className="h-12 flex items-center justify-center text-black/80 italic text-[11px] font-serif">
                                  tanda tangan dan cap dinas
                                </div>
                              )}
                            </div>

                            <p className="text-xs font-normal text-black">
                              {namaPejabatSigner ? `${namaPejabatSigner}${gelarSigner ? `, ${gelarSigner}` : ''}` : 'Nama Pejabat'}
                            </p>
                            <p className="font-serif text-[11px] text-black mt-0.5">
                              {nipSigner ? `NIP ${nipSigner}` : 'NIP'}
                            </p>
                          </div>
                        </div>
                      ) : isNotaDinas ? (
                        /* Nota Dinas: Sesuai Gambar 1 (Kanan: Tanggal, Jabatan, Tanda Tangan, Nama, NIP; Kiri: Tembusan) */
                        <div className="font-serif text-black">
                          <div className="flex justify-end">
                            <div className="w-64 sm:w-72 text-left">
                              <p className="text-xs mb-0.5 font-normal">{formattedDateA4 || 'tanggal'}</p>
                              <p className="text-xs font-normal">
                                {(() => {
                                  const raw = namaJabatanSigner || `Pimpinan ${activeUnitObj?.nama_unit || 'Unit Kerja'}`;
                                  return raw.endsWith(',') ? raw : `${raw},`;
                                })()}
                              </p>

                              <div className="my-2 min-h-[48px] flex flex-col justify-center">
                                {tteVerified ? (
                                  <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                    <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                    <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Pejabat Struktural'}</p>
                                    <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                  </div>
                                ) : (
                                  <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                                    Tanda tangan dan cap dinas
                                  </div>
                                )}
                              </div>

                              <p className="font-normal text-xs text-black">
                                {namaPejabatSigner ? `${namaPejabatSigner}${gelarSigner ? `, ${gelarSigner}` : ''}` : 'Nama Pejabat'}
                              </p>
                              <p className="text-[10.5px] text-black mt-0.5 font-serif">{nipSigner ? `NIP ${nipSigner}` : 'NIP'}</p>
                            </div>
                          </div>

                          {/* Tembusan di Sisi Kiri Bawah Sesuai Gambar 1 */}
                          <div className="text-left text-[11px] mt-2">
                            <p className="font-normal text-black">Tembusan:</p>
                            {tembusanList.length > 0 ? (
                              <div className="text-left text-[10.5px] text-black max-w-md mt-0.5 font-serif space-y-0.5">
                                {tembusanList.map((t, idx) => (
                                  <p key={idx}>{tembusanList.length > 1 ? `${idx + 1}. ${t}` : t}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 select-none tracking-widest mt-0.5">...............................</p>
                            )}
                          </div>
                        </div>
                      ) : isSuratPernyataan ? (
                        /* Surat Pernyataan: Sesuai Image 2 (Kanan: Tanggal, Nama Jabatan, Materai & TTD, Nama Pejabat, NIP) */
                        <div className="flex justify-end font-serif text-black">
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs mb-0.5 font-normal">{formattedDateA4 || 'Tanggal'}</p>
                            <p className="text-xs mb-1 font-normal">{namaJabatanSigner || 'Yang Menyatakan,'}</p>

                            <div className="my-2 min-h-[52px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{sperParsed?.nama || namaPejabatSigner || 'Nama Pejabat'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-12 flex flex-col items-center justify-center text-black/60 italic text-[10px] font-serif leading-tight text-center">
                                  <span>Materai, tanda tangan dan</span>
                                  <span>Cap dinas/jabatan</span>
                                </div>
                              )}
                            </div>

                            <p className="font-normal text-xs text-black">{sperParsed?.nama || namaPejabatSigner || 'Nama Pejabat'}</p>
                            <p className="text-[10.5px] text-black mt-0.5 font-serif">
                              {sperParsed?.nip || nipSigner ? `NIP ${sperParsed?.nip || nipSigner}` : 'NIP'}
                            </p>
                          </div>
                        </div>
                      ) : isBeritaAcara ? (
                        /* Berita Acara: Sesuai Contoh 12 (Dibuat di... Pihak Kedua kiri, Pihak Pertama kanan, Mengetahui/Mengesahkan tengah bawah) */
                        <div className="font-serif text-black">
                          <div className="flex justify-end mb-2">
                            <p className="text-xs">Dibuat di {alamatTujuan || 'Tasikmalaya'}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-8 text-center">
                            {/* Pihak Kedua (Sisi Kiri Sesuai Contoh 12) */}
                            <div className="flex flex-col justify-between min-h-[130px]">
                              <p className="font-normal">Pihak Kedua,</p>
                              <div className="my-2 min-h-[44px] flex items-center justify-center">
                                <span className="text-[10px] text-black/60 italic font-serif">Tanda tangan</span>
                              </div>
                              <div>
                                <p className="font-normal text-xs text-black">
                                  {tujuan || 'Nama Pejabat'}
                                </p>
                                <p className="text-[10.5px] text-black mt-0.5 font-serif">
                                  NIP ....................
                                </p>
                              </div>
                            </div>

                            {/* Pihak Pertama (Sisi Kanan Sesuai Contoh 12) */}
                            <div className="flex flex-col justify-between min-h-[130px]">
                              <p className="font-normal">Pihak Pertama,</p>
                              <div className="my-2 min-h-[44px] flex items-center justify-center">
                                <span className="text-[10px] text-black/60 italic font-serif">Tanda tangan</span>
                              </div>
                              <div>
                                <p className="font-normal text-xs text-black">
                                  {pengirim || currentUser?.nama_lengkap || 'Nama Pejabat'}
                                </p>
                                <p className="text-[10.5px] text-black mt-0.5 font-serif">
                                  {currentUser?.nip ? `NIP ${currentUser.nip}` : 'NIP ....................'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Mengetahui / Mengesahkan (Tengah Bawah Sesuai Contoh 12) */}
                          <div className="mt-7 text-center flex flex-col items-center justify-center">
                            <p className="font-normal text-xs">Mengetahui/Mengesahkan</p>
                            <p className="text-xs text-black">{namaJabatanSigner || 'Rektor Universitas Siliwangi'}</p>

                            <div className="my-2 min-h-[48px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight max-w-[200px]">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                                  Tanda tangan dan cap dinas
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-normal text-xs text-black">
                                {namaPejabatSigner || 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.'}
                              </p>
                              <p className="text-[10.5px] text-black mt-0.5 font-serif">
                                {nipSigner ? `NIP ${nipSigner}` : 'NIP 196708161996031001'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : isSuratKeterangan ? (
                        /* Surat Keterangan: Sesuai Gambar 4 (Kanan Bawah: Tanggal, Nama Pejabat, Tanda Tangan & Cap, Nama, NIP) */
                        <div className="flex justify-end font-serif text-black">
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs mb-0.5 font-normal">{formattedDateA4 || 'Tanggal'}</p>
                            <p className="text-xs mb-1 font-normal">
                              {(() => {
                                const raw = sketParsed?.pejabatJabatan || namaJabatanSigner || 'Rektor Universitas Siliwangi';
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[52px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{sketParsed?.pejabatNama || namaPejabatSigner || 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-12 flex flex-col items-center justify-center text-black/60 italic text-[10px] font-serif leading-tight text-center">
                                  <span>tanda tangan dan</span>
                                  <span>cap dinas</span>
                                </div>
                              )}
                            </div>

                            <p className="font-normal text-xs text-black">{sketParsed?.pejabatNama || namaPejabatSigner || 'Nama Pejabat'}</p>
                            <p className="text-[10.5px] text-black mt-0.5 font-serif">
                              {sketParsed?.pejabatNip || nipSigner ? `NIP ${sketParsed?.pejabatNip || nipSigner}` : 'NIP'}
                            </p>
                          </div>
                        </div>
                      ) : isSuratPengantar ? (
                        /* Surat Pengantar: Sesuai Gambar 5 (Kiri: Penerima Naskah; Kanan: Pengirim Naskah) */
                        <div className="flex justify-between items-start gap-8 pt-1 text-black font-serif text-xs">
                          {/* Kolom Kiri Bawah: Penerima Naskah Sesuai Gambar 5 */}
                          <div className="w-64 text-left space-y-1">
                            <p className="text-xs">
                              Diterima tanggal <span className="text-slate-400 select-none">.........................</span>
                            </p>
                            <p className="text-xs">
                              Jabatan <span className="text-slate-400 select-none">.........................</span>
                            </p>

                            <div className="my-2 min-h-[48px] flex items-center text-[10px] text-black/60 italic font-serif">
                              tanda tangan dan cap dinas
                            </div>

                            <div>
                              <p className="text-xs text-black">
                                Nama <span className="text-slate-400 select-none">.........................</span>
                              </p>
                              <p className="text-[10.5px] text-black mt-0.5 font-serif">
                                NIP <span className="text-slate-400 select-none">.........................</span>
                              </p>
                            </div>
                          </div>

                          {/* Kolom Kanan Bawah: Pengirim Naskah Dinas Sesuai Gambar 5 */}
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs mb-0.5 font-normal">{formattedDateA4 || 'Tanggal'}</p>
                            <p className="text-xs mb-1 font-normal">
                              {(() => {
                                const raw = namaJabatanSigner || 'Kepala Biro Umum dan Keuangan';
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[48px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Dr. Nana Sujana, Drs., M.Si.'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                                  tanda tangan dan cap dinas
                                </div>
                              )}
                            </div>

                            <p className="font-normal text-xs text-black">{namaPejabatSigner || 'Dr. Nana Sujana, Drs., M.Si.'}</p>
                            <p className="text-[10.5px] text-black mt-0.5 font-serif">
                              {nipSigner ? `NIP ${nipSigner}` : 'NIP 196808301989031004'}
                            </p>
                          </div>
                        </div>
                      ) : isNotula ? (
                        /* Notula: Sesuai Gambar 1 (Kanan Bawah: Nama Jabatan, Tanda Tangan, Nama Pejabat, NIP) */
                        <div className="flex justify-end font-serif text-black">
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs mb-1 font-normal">
                              {(() => {
                                const raw = notulaParsed?.pemimpinRapat ? 'Pemimpin Rapat' : (namaJabatanSigner || 'Pemimpin Rapat');
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[48px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{notulaParsed?.pemimpinRapat || namaPejabatSigner || 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                                  tanda tangan
                                </div>
                              )}
                            </div>

                            <p className="font-normal text-xs text-black">
                              {notulaParsed?.pemimpinRapat || namaPejabatSigner || 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.'}
                            </p>
                            <p className="text-[10.5px] text-black mt-0.5 font-serif">
                              {nipSigner ? `NIP ${nipSigner}` : 'NIP 196708161996031001'}
                            </p>
                          </div>
                        </div>
                      ) : isLaporan ? (
                        /* Laporan: Sesuai Gambar 2 (Kanan Bawah: Dibuat di, pada tanggal, Nama jabatan, Tanda Tangan & Cap, Nama, NIP) */
                        <div className="flex justify-end font-serif text-black">
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs">
                              Dibuat di {alamatTujuan || 'Tasikmalaya'}
                            </p>
                            <p className="text-xs mb-1">
                              pada tanggal {formattedDateA4 || '08 September 2026'}
                            </p>
                            <p className="text-xs mb-1 font-normal">
                              {(() => {
                                const raw = namaJabatanSigner || 'Nama Jabatan Pembuat Laporan';
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[52px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Dr. Ade Rustiana, Drs., M.Si.'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-12 flex flex-col items-center justify-center text-black/60 italic text-[10px] font-serif leading-tight text-center">
                                  <span>Tanda tangan, cap jabatan atau</span>
                                  <span>cap dinas</span>
                                </div>
                              )}
                            </div>

                            <p className="font-normal text-xs text-black">{namaPejabatSigner || 'Dr. Ade Rustiana, Drs., M.Si.'}</p>
                            <p className="text-[10.5px] text-black mt-0.5 font-serif">
                              {nipSigner ? `NIP ${nipSigner}` : 'NIP 196801021992031002'}
                            </p>
                          </div>
                        </div>
                      ) : isTelaahStaf ? (
                        /* Telaah Staf: Sesuai Gambar 3 (Kanan Bawah: Nama Jabatan, Tanda Tangan, Nama Lengkap) */
                        <div className="flex justify-end font-serif text-black">
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs mb-1 font-normal">
                              {(() => {
                                const raw = namaJabatanSigner || tsParsed?.dari || 'Kepala Biro Umum dan Keuangan';
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[48px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || tsParsed?.dari || 'Dr. Nana Sujana, Drs., M.Si.'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                                  tanda tangan
                                </div>
                              )}
                            </div>

                            <p className="font-normal text-xs text-black">
                              {namaPejabatSigner || tsParsed?.dari || 'Dr. Nana Sujana, Drs., M.Si.'}
                            </p>
                            {nipSigner ? (
                              <p className="text-[10.5px] text-black mt-0.5 font-serif">
                                NIP {nipSigner}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        /* Format Surat Dinas: Tembusan di Sisi Kiri Bawah dan Tanda Tangan di Kanan Bawah */
                        <div className="flex justify-between items-end gap-6">
                          {/* Tembusan di Sisi Kiri Bawah (Sejajar Bagian Bawah Tanda Tangan Sesuai Spesimen Resmi) */}
                          <div className="text-left text-[11px] space-y-0.5 text-black max-w-xs">
                            {tembusanList.length > 0 ? (
                              <>
                                <p className="font-normal text-black">Tembusan:</p>
                                <div className="space-y-0.5">
                                  {tembusanList.map((t, idx) => (
                                    <p key={idx}>
                                      {tembusanList.length > 1 ? `${idx + 1}. ${t}` : t}
                                    </p>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-black font-normal">Tembusan:</p>
                            )}
                          </div>

                          {/* Pejabat Penandatangan Resmi di Sisi Kanan Bawah */}
                          <div className="w-64 sm:w-72 text-left">
                            <p className="text-xs font-normal text-black leading-tight">
                              {(() => {
                                const raw = namaJabatanSigner || `Pimpinan ${activeUnitObj?.nama_unit || 'Unit Kerja'}`;
                                return raw.endsWith(',') ? raw : `${raw},`;
                              })()}
                            </p>

                            <div className="my-2 min-h-[52px] flex items-center justify-center">
                              {tteVerified ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Pejabat Struktural'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                                </div>
                              ) : isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI' ? (
                                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabatSigner || 'Dosen Pembuat Naskah'}</p>
                                  <p className="text-[9px] italic text-stone-700 mt-0.5">Tanda Tangan Mandiri Dosen</p>
                                </div>
                              ) : (
                                <div className="h-12 flex items-center justify-center text-black/80 italic text-[11px] font-serif">
                                  tanda tangan dan cap jabatan
                                </div>
                              )}
                            </div>

                            <p className="text-xs font-normal text-black">
                              {namaPejabatSigner ? `${namaPejabatSigner}${gelarSigner ? `, ${gelarSigner}` : ''}` : 'Nama Pejabat'}
                            </p>
                            <p className="font-serif text-[11px] text-black mt-0.5">
                              {nipSigner ? `NIP ${nipSigner}` : 'NIP ....................'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {letterType === 'surat-masuk' ? (
              <>
                <span className="truncate">Jenis: <strong>Registrasi Surat Masuk</strong></span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="hidden sm:inline">Agenda: <strong className="font-mono text-slate-800">{previewNomorAgenda}</strong></span>
              </>
            ) : (
              <>
                <span className="truncate">Format: <strong>{TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}</strong></span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="hidden sm:inline">Nomor: <strong className="font-mono text-slate-800">{previewNomorSurat}</strong></span>
              </>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-center disabled:opacity-50"
            >
              Batal
            </button>
            {letterType !== 'surat-masuk' && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={isSaving}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50"
                title={`Cetak Pratinjau Kertas ${currentPaperInfo.code}`}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak ({currentPaperInfo.code})</span>
              </button>
            )}

            {letterType === 'surat-masuk' ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Dikirim')}
                disabled={isSaving}
                className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg text-xs font-bold bg-unsil-green-900 hover:bg-unsil-green-950 text-white shadow-md shadow-unsil-green-950/20 transition-all disabled:opacity-75 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 text-unsil-gold-400 animate-spin" />
                    <span>Mencatat Agenda...</span>
                  </>
                ) : (
                  <>
                    <Inbox className="w-4 h-4 text-unsil-gold-400" />
                    <span>Daftarkan Surat Masuk</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'Draft')}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all disabled:opacity-50"
                  title="Simpan sebagai Draf (Belum diajukan untuk review pimpinan)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Simpan Draf</span>
                </button>
                <button
                  type="button"
                  onClick={(e) =>
                    handleSubmit(
                      e,
                      isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI'
                        ? 'Disetujui'
                        : 'DRAFT_MENUNGGU_PARAF'
                    )
                  }
                  disabled={
                    isSaving ||
                    (!isMandiriDoc &&
                      (!currentTypeMeta?.available_signatories ||
                        currentTypeMeta.available_signatories.length === 0))
                  }
                  className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg text-xs font-bold bg-unsil-green-900 hover:bg-unsil-green-950 text-white shadow-md shadow-unsil-green-950/20 transition-all disabled:opacity-50 cursor-pointer"
                  title={
                    !isMandiriDoc &&
                    (!currentTypeMeta?.available_signatories ||
                      currentTypeMeta.available_signatories.length === 0)
                      ? 'Belum ada pejabat struktural yang terdaftar di sistem untuk naskah ini'
                      : undefined
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 text-unsil-gold-400 animate-spin" />
                      <span>
                        {isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI'
                          ? 'Menerbitkan Naskah...'
                          : 'Mengajukan Draf...'}
                      </span>
                    </>
                  ) : isMandiriDoc && selectedSignatoryRole === 'DOSEN_MANDIRI' ? (
                    <>
                      <PenTool className="w-4 h-4 text-unsil-gold-400" />
                      <span>Terbitkan Naskah (TTD Mandiri)</span>
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4 text-unsil-gold-400" />
                      <span>Ajukan Paraf & TTE Pimpinan</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
