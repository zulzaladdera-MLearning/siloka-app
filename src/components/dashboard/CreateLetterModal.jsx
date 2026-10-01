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
  Sparkles,
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
  ExternalLink
} from 'lucide-react';
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
import { getPejabatByUnit, formatPejabatLabel } from '../../utils/pejabatHelper';
import SmartKlasifikasiNumberingPanel from '../documents/SmartKlasifikasiNumberingPanel';

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
    defaultPerihal: 'Laporan Pertanggungjawaban Realisasi Anggaran Operasional Unit',
    defaultPembuka: 'Bersama ini kami laporkan perkembangan realisasi anggaran operasional dan belanja pemeliharaan sarana prasarana unit kerja dengan rincian sebagai berikut:',
    defaultIsi: '1. Seluruh berkas kuitansi dan dokumen perpajakan telah diverifikasi oleh staf pengelola keuangan unit.\n2. Alokasi belanja kegiatan telah sesuai dengan Rencana Kerja dan Anggaran (RKA) tahun berjalan.\n3. Berkas digital SPJ telah terunggah secara lengkap pada sistem kearsipan SILOKA.',
    defaultPenutup: 'Demikian nota dinas ini kami sampaikan sebagai bahan pertimbangan dan arahan lebih lanjut dari Bapak. Atas arahan dan perkenan yang diberikan, kami haturkan terima kasih.',
    defaultTujuan: 'Pimpinan Unit Kerja / Dekan',
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
    id: 'tugas',
    kode_jenis_naskah: 'SURAT_TUGAS',
    name: 'Surat Tugas',
    icon: Layers,
    desc: 'Penugasan staf/pegawai untuk menjalankan kegiatan kedinasan',
    defaultKlasifikasi: 'KP.05.00',
    defaultPerihal: 'Penugasan Pelaksanaan Bimbingan Teknis Kearsipan dan TTE BSrE',
    defaultPembuka: 'Pimpinan unit kerja dengan ini menugaskan kepada pegawai yang namanya tercantum di bawah ini:',
    defaultIsi: 'Nama : Staf Pelaksana Administrasi Persuratan\nNIP  : 198809152014042001\nUntuk : Mengikuti Bimbingan Teknis Pengelolaan Arsip Dinamis dan Penerapan TTE BSrE di Bandung pada tanggal 22-24 September 2026.',
    defaultPenutup: 'Surat tugas ini diberikan untuk dilaksanakan dengan penuh rasa tanggung jawab dan setelah selesai melaksanakan tugas agar segera menyampaikan laporan tertulis.',
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
    desc: 'Keterangan resmi keaktifan pegawai atau status kedinasan',
    defaultKlasifikasi: 'PP.00.03',
    defaultPerihal: 'Surat Keterangan Bebas Administrasi dan Perlengkapan',
    defaultPembuka: 'Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa:',
    defaultIsi: 'Nama      : Siti Rohmah, S.AP.\nNIP       : 198809152014042001\nJabatan   : Staf Persuratan dan Kearsipan\nUnit Kerja: Biro Keuangan dan Umum UNSIL\n\nAdalah benar telah menyelesaikan seluruh kewajiban administrasi persuratan dan inventaris BMN dengan baik dan tidak memiliki tanggungan dinas.',
    defaultPenutup: 'Demikian surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Pihak yang Berkepentingan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'pengantar',
    kode_jenis_naskah: 'SURAT_PENGANTAR',
    name: 'Surat Pengantar',
    icon: Send,
    desc: 'Pengantar pengiriman naskah, berkas SPJ, atau laporan dinas',
    defaultKlasifikasi: 'KU.01.04',
    defaultPerihal: 'Penyampaian Berkas Usulan Pencairan Anggaran Operasional',
    defaultPembuka: 'Bersama surat ini, kami sampaikan berkas usulan pencairan anggaran operasional dengan perincian berkas sebagai berikut:',
    defaultIsi: '1. Rencana Penggunaan Dana (RPD) Triwulan III - 1 (satu) Berkas (Asli)\n2. Bukti Kuitansi Pengeluaran Riil - 1 (satu) Berkas (Asli)\n3. Berita Acara Verifikasi Internal - 1 (satu) Lembar (Asli)',
    defaultPenutup: 'Demikian untuk diketahui dan diproses sesuai dengan peraturan perundang-undangan yang berlaku. Atas kerja sama yang baik, kami sampaikan terima kasih.',
    defaultTujuan: 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    defaultAlamatTujuan: 'Universitas Siliwangi'
  },
  {
    id: 'pernyataan',
    kode_jenis_naskah: 'SURAT_PERNYATAAN',
    name: 'Surat Pernyataan',
    icon: PenTool,
    desc: 'Pernyataan kedinasan atau kebenaran administratif tertulis',
    defaultKlasifikasi: 'KP.02.01',
    defaultPerihal: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
    defaultPembuka: 'Yang bertanda tangan di bawah ini dengan ini menyatakan dengan sesungguhnya bahwa:',
    defaultIsi: '1. Seluruh data dan dokumen pendukung yang diajukan adalah benar dan sah sesuai fakta integritas kedinasan.\n2. Apabila di kemudian hari ditemukan ketidaksesuaian, kami bersedia bertanggung jawab penuh sesuai ketentuan peraturan perundang-undangan yang berlaku.',
    defaultPenutup: 'Demikian pernyataan ini kami buat secara sadar tanpa paksaan dari pihak manapun.',
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
    defaultPerihal: 'Berita Acara Serah Terima Pengelolaan Aset Laboratorium',
    defaultPembuka: 'Pada hari ini, Senin tanggal 21 September 2026, telah dilaksanakan serah terima aset dengan hasil:',
    defaultIsi: '1. Telah dilakukan pengecekan fisik 30 unit komputer laboratorium dalam kondisi baik dan berfungsi normal.\n2. Seluruh aset telah terdaftar dalam sistem pencatatan BMN SILOKA.',
    defaultPenutup: 'Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Arsip Subbagian Umum & Aset BMN',
    defaultAlamatTujuan: 'Fakultas Teknik'
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
    desc: 'Catatan ringkas resmi jalannya sidang atau rapat pimpinan (Tabel 1 No. 20)',
    defaultKlasifikasi: 'HM.00.01',
    defaultPerihal: 'Notula Rapat Pimpinan Evaluasi Kinerja dan Program Kerja Universitas Siliwangi',
    defaultPembuka: 'Risalah dan catatan resmi jalannya rapat pimpinan Universitas Siliwangi dengan pokok bahasan:',
    defaultIsi: '1. Evaluasi capaian indikator kinerja utama (IKU) universitas dan unit kerja.\n2. Tindak lanjut percepatan layanan akademik, keuangan, dan kemahasiswaan.',
    defaultPenutup: 'Demikian notula rapat ini disahkan oleh Pemimpin Rapat untuk ditindaklanjuti.',
    defaultTujuan: 'Seluruh Peserta Rapat Pimpinan',
    defaultAlamatTujuan: 'Universitas Siliwangi'
  },
  {
    id: 'laporan',
    kode_jenis_naskah: 'LAPORAN',
    name: 'Laporan',
    icon: FileText,
    desc: 'Laporan pertanggungjawaban pelaksanaan tugas kedinasan (Pasal 26 Per. Rektor No. 3/2023)',
    defaultKlasifikasi: 'PR.04.01',
    defaultPerihal: 'Laporan Capaian Pelaksanaan Program Kerja dan Evaluasi Kinerja Bidang',
    defaultPembuka: 'Bersama ini disampaikan Laporan Pelaksanaan Program Kerja dan Evaluasi Kinerja di lingkungan Universitas Siliwangi:',
    defaultIsi: '1. Latar Belakang dan Dasar Pelaksanaan.\n2. Ruang Lingkup dan Kegiatan yang Dilaksanakan.\n3. Hasil yang Dicapai dan Rekomendasi Tindak Lanjut.',
    defaultPenutup: 'Demikian laporan ini disusun dengan sebenarnya sebagai bentuk akuntabilitas kinerja.',
    defaultTujuan: 'Rektor Universitas Siliwangi',
    defaultAlamatTujuan: 'Kota Tasikmalaya'
  },
  {
    id: 'telaah-staf',
    kode_jenis_naskah: 'TELAAH_STAF',
    name: 'Telaah Staf',
    icon: FileText,
    desc: 'Kajian analisis permasalahan dan saran kebijakan (Pasal 27 Per. Rektor No. 3/2023)',
    defaultKlasifikasi: 'OT.01.00',
    defaultPerihal: 'Telaah Staf Optimalisasi Tata Kelola Layanan dan Kebijakan Strategis Universitas Siliwangi',
    defaultPembuka: 'I. PERSOALAN: Kebutuhan penguatan integrasi layanan akademik, keuangan, dan kemahasiswaan berbasis digital.',
    defaultIsi: 'II. PRAANGGAPAN & FAKTA YANG MEMENGARUHI: Sesuai Peraturan Rektor No. 3 Tahun 2023 dan SK Rektor No. 2803 Tahun 2023.\nIII. ANALISIS & SIMPULAN: Diperlukan penetapan kebijakan terpadu lintas unit kerja.',
    defaultPenutup: 'IV. SARAN: Mohon perkenan arahan dan persetujuan pimpinan atas rekomendasi kebijakan di atas.',
    defaultTujuan: 'Rektor Universitas Siliwangi',
    defaultAlamatTujuan: 'Kota Tasikmalaya'
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

export const CreateLetterModal = ({
  isOpen,
  onClose,
  onSaveLetter,
  currentUser,
  initialMode = 'surat-keluar',
  allLetters = []
}) => {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const generateRandomSeq = () => String(Math.floor(100 + Math.random() * 900)).padStart(4, '0');

  // Mode Dokumen: 'surat-keluar' (Penyusunan naskah kedinasan) | 'surat-masuk' (Registrasi surat masuk eksternal)
  const [letterType, setLetterType] = useState(() => initialMode || 'surat-keluar');

  // Tujuan Aksi Dokumen: 'DISPOSISI' vs 'TTD' (Permohonan Tanda Tangan)
  const [tujuanAksi, setTujuanAksi] = useState('DISPOSISI');

  // Mode Tampilan: 'split' (Form & Pratinjau berdampingan) | 'form' (Hanya Formulir) | 'preview' (Hanya Pratinjau A4)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'form';
    }
    return 'split';
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState('surat-dinas');

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
  const [nomorSuratAsal, setNomorSuratAsal] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [perihal, setPerihal] = useState(TEMPLATES[0].defaultPerihal);
  const [kategori, setKategori] = useState('Surat Keluar');
  const [sifatSurat, setSifatSurat] = useState('Biasa');
  const [lampiran, setLampiran] = useState('1 (satu) Berkas');
  const [pengirim, setPengirim] = useState(defaultUnit.nama_unit);
  const [tujuan, setTujuan] = useState(TEMPLATES[0].defaultTujuan);
  const [alamatTujuan, setAlamatTujuan] = useState(TEMPLATES[0].defaultAlamatTujuan);
  const [kalimatPembuka, setKalimatPembuka] = useState(TEMPLATES[0].defaultPembuka);
  const [isiPokok, setIsiPokok] = useState(TEMPLATES[0].defaultIsi);
  const [kalimatPenutup, setKalimatPenutup] = useState(TEMPLATES[0].defaultPenutup);

  // Field Khusus Registrasi Surat Masuk Eksternal
  const [nomorSuratAsalMasuk, setNomorSuratAsalMasuk] = useState('');
  const [pengirimMasuk, setPengirimMasuk] = useState('Kementerian Pendidikan Tinggi, Sains, dan Teknologi');
  const [tujuanMasuk, setTujuanMasuk] = useState('Rektor Universitas Siliwangi');
  const [tanggalSuratMasuk, setTanggalSuratMasuk] = useState(new Date().toISOString().slice(0, 10));
  const [tanggalTerimaMasuk, setTanggalTerimaMasuk] = useState(new Date().toISOString().slice(0, 10));
  const [perihalMasuk, setPerihalMasuk] = useState('Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU');
  const [ringkasanMasuk, setRingkasanMasuk] = useState('Permohonan data dukung dan kehadiran pimpinan dalam rangka rekonsiliasi laporan keuangan dan aset');
  const [sifatSuratMasuk, setSifatSuratMasuk] = useState('Penting');

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
  const [uploadedFileNameMasuk, setUploadedFileNameMasuk] = useState('Surat_Masuk_Eksternal.pdf');
  const [uploadedFileSizeMasuk, setUploadedFileSizeMasuk] = useState('1.8 MB');
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

    if (file.size <= 2.5 * 1024 * 1024) {
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
  const [tembusanText, setTembusanText] = useState(
    '1. Rektor Universitas Siliwangi (sebagai laporan)\n2. Kepala Satuan Pengawas Internal (SPI)'
  );

  // 1. Deteksi 'kode_unit' dan 'jabatan' dari user (Dosen/Staf) yang sedang login (Session User)
  const sessionUserUnit = currentUser?.unit_kerja_id || currentUser?.kode_unit || 'UN58.13.1';
  const sessionUserJabatan =
    currentUser?.roleLabel ||
    currentUser?.jabatan ||
    (currentUser?.role === 'PEJABAT' ? 'Pejabat Struktural' : 'Dosen Biasa (Tanpa Tugas Tambahan)');
  const sessionUserName = currentUser?.nama_lengkap || currentUser?.name || 'Dosen / Staf Pengusul';

  // Deteksi apakah pengguna yang aktif adalah dosen (sesuai instruksi: sembunyikan label/banner Tabel 1)
  const isDosen = useMemo(() => {
    const role = String(currentUser?.role || '').toUpperCase();
    const roleLabel = String(currentUser?.roleLabel || currentUser?.jabatan || sessionUserJabatan || '').toLowerCase();
    return role === 'DOSEN' || roleLabel.includes('dosen');
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
  const applySignatory = (typeMeta, preferredRole = null) => {
    if (!typeMeta || !Array.isArray(typeMeta.available_signatories) || typeMeta.available_signatories.length === 0) {
      return;
    }

    let targetSigner = null;
    if (!typeMeta.can_choose_signatory) {
      // Only DEKAN is authorized per Tabel 1!
      targetSigner = typeMeta.available_signatories.find((s) => s.role_penandatangan === 'DEKAN') || typeMeta.available_signatories[0];
      setSelectedSignatoryRole('DEKAN');
    } else {
      // Kajur or Dekan is authorized
      const roleToUse = preferredRole || selectedSignatoryRole || 'KETUA_JURUSAN';
      targetSigner = typeMeta.available_signatories.find((s) => s.role_penandatangan === roleToUse) || typeMeta.default_signatory || typeMeta.available_signatories[0];
      setSelectedSignatoryRole(targetSigner?.role_penandatangan || 'KETUA_JURUSAN');
    }

    if (targetSigner) {
      setSelectedPejabatId(String(targetSigner.id));
      setNamaJabatanSigner(targetSigner.jabatan);
      setNamaPejabatSigner(targetSigner.nama);
      setGelarSigner(targetSigner.gelar);
      setNipSigner(targetSigner.nip);
    }
  };

  // 2. Fetch Jenis Naskah & Hierarki Penandatanganan Sesuai Tabel 1 dari Backend
  useEffect(() => {
    let isMounted = true;
    setIsLoadingScoping(true);

    fetchAvailableLetterTypes(currentUser)
      .then((data) => {
        if (!isMounted) return;
        const types = (data && Array.isArray(data.types) && data.types.length > 0)
          ? data.types
          : FALLBACK_SCOPED_LETTER_TYPES;
        setAvailableNaskahTypes(types);
        setIsLoadingScoping(false);

        // Cari tipe naskah yang aktif atau fallback ke tipe pertama
        const currentMeta = types.find((t) => t.kode_jenis_naskah === selectedKodeNaskah) || types[0];
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
        const currentMeta = FALLBACK_SCOPED_LETTER_TYPES.find((t) => t.kode_jenis_naskah === selectedKodeNaskah) || FALLBACK_SCOPED_LETTER_TYPES[0];
        if (currentMeta) {
          applySignatory(currentMeta, selectedSignatoryRole);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, selectedUnitCode]);

  const currentTypeMeta = useMemo(() => {
    return (
      availableNaskahTypes.find((t) => t.kode_jenis_naskah === selectedKodeNaskah) ||
      availableNaskahTypes[0] ||
      FALLBACK_SCOPED_LETTER_TYPES[0]
    );
  }, [availableNaskahTypes, selectedKodeNaskah]);

  const dekanSignatory = useMemo(() => {
    return currentTypeMeta?.available_signatories?.find((s) => s.role_penandatangan === 'DEKAN');
  }, [currentTypeMeta]);

  const kajurSignatory = useMemo(() => {
    return currentTypeMeta?.available_signatories?.find((s) => s.role_penandatangan === 'KETUA_JURUSAN');
  }, [currentTypeMeta]);

  // Handler pemilihan jenis naskah (two-way reactive binding)
  const handleSelectKodeNaskah = (kode) => {
    setSelectedKodeNaskah(kode);
    const meta = availableNaskahTypes.find((t) => t.kode_jenis_naskah === kode);
    if (meta) {
      applySignatory(meta, selectedSignatoryRole);
      // Sinkronkan data form dari template jika cocok
      const matchingTpl = TEMPLATES.find((tpl) => tpl.kode_jenis_naskah === kode);
      if (matchingTpl) {
        setSelectedTemplateId(matchingTpl.id);
        setPerihal(matchingTpl.defaultPerihal);
        setKalimatPembuka(matchingTpl.defaultPembuka);
        setIsiPokok(matchingTpl.defaultIsi);
        setKalimatPenutup(matchingTpl.defaultPenutup);
        setTujuan(matchingTpl.defaultTujuan);
        setAlamatTujuan(matchingTpl.defaultAlamatTujuan);
        if (matchingTpl.defaultKlasifikasi) {
          setKodeKlasifikasi(matchingTpl.defaultKlasifikasi);
        }
      }
    }
  };

  // Handler pemilihan peran penandatangan (Ketua Jurusan vs Dekan)
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

  // Format Kop Surat Dinamis resmi sesuai Pasal 30(2) & Pasal 31(1,2,6) Peraturan Rektor No. 3/2023
  const kopConfig = useMemo(() => {
    return determineKopSurat(activeUnitObj || currentUser);
  }, [activeUnitObj, currentUser]);

  // Handler pergantian template
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setPerihal(tpl.defaultPerihal);
    setKalimatPembuka(tpl.defaultPembuka);
    setIsiPokok(tpl.defaultIsi);
    setKalimatPenutup(tpl.defaultPenutup);
    setTujuan(tpl.defaultTujuan);
    setAlamatTujuan(tpl.defaultAlamatTujuan);
    if (tpl.defaultKlasifikasi) {
      setKodeKlasifikasi(tpl.defaultKlasifikasi);
    }
    if (tpl.kode_jenis_naskah) {
      setSelectedKodeNaskah(tpl.kode_jenis_naskah);
      const meta = availableNaskahTypes.find((t) => t.kode_jenis_naskah === tpl.kode_jenis_naskah);
      if (meta) {
        applySignatory(meta, selectedSignatoryRole);
      }
    }
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
      if (!nomorSuratAsalMasuk.trim() || !pengirimMasuk.trim() || !perihalMasuk.trim()) {
        alert('Mohon lengkapi Nomor Surat Asal, Instansi Pengirim, dan Perihal Surat Masuk!');
        return;
      }

      setIsSaving(true);
      try {
        const res = await saveInboundLetter(
          {
            tingkat_keamanan: tingkatKeamanan,
            kode_klasifikasi: kodeKlasifikasi,
            perihal: perihalMasuk.trim(),
            pengirim: pengirimMasuk.trim(),
            tujuan: tujuanMasuk.trim(),
            nomor_surat_asal: nomorSuratAsalMasuk.trim(),
            tujuan_aksi: tujuanAksi,
            tahun: currentYear,
            unit_kerja_id: activeUnitObj.kode_unit
          },
          currentUser
        );

        const savedData = res.data;
        const officialAgenda = savedData.nomor_agenda;
        const seqStr = String(savedData.nomor_urut).padStart(4, '0');

        onSaveLetter({
          id: `SRT-IN-${currentYear}-${seqStr}`,
          id_surat: savedData.id_surat,
          nomorSurat: officialAgenda,
          nomor_urut: savedData.nomor_urut,
          nomorSuratAsal: nomorSuratAsalMasuk.trim(),
          tanggal: tanggalSuratMasuk,
          tanggalTerima: tanggalTerimaMasuk,
          perihal: perihalMasuk.trim(),
          kategori: 'Surat Masuk',
          sifat: sifatSuratMasuk,
          kategoriKeamanan: tingkatKeamanan === 'B' ? 'Biasa/Terbuka' : tingkatKeamanan === 'R' ? 'Rahasia' : 'Sangat Rahasia',
          tingkat_keamanan: tingkatKeamanan,
          kodeKlasifikasi,
          subKlasifikasi: kodeKlasifikasi,
          pengirim: pengirimMasuk.trim(),
          tujuan: tujuanMasuk.trim(),
          ringkasan: ringkasanMasuk.trim() || perihalMasuk.trim(),
          lampiran: uploadedFileNameMasuk ? `${uploadedFileNameMasuk} (${uploadedFileSizeMasuk})` : null,
          lampiranUrl: uploadedFileDataUrlMasuk || uploadedFileUrlMasuk || null,
          lampiranName: uploadedFileNameMasuk || null,
          lampiranSize: uploadedFileSizeMasuk || null,
          status: 'Diterima',
          statusTimestamp: 'Surat Masuk terdaftar pada Buku Agenda SILOKA',
          tujuan_aksi: tujuanAksi,
          isSignatureRequest: tujuanAksi === 'TTD',
          tteVerified: false,
          unit_kerja_id: activeUnitObj.kode_unit,
          created_by_user_id: currentUser?.id || 'usr-02',
          created_at: new Date().toISOString(),
          riwayatParaf: [
            {
              nama: currentUser?.nama_lengkap || currentUser?.name || 'Staf Pelaksana Persuratan',
              jabatan: currentUser?.roleLabel || 'Operator Unit',
              waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
              catatan: `Registrasi Surat Masuk Eksternal (No. Asal: ${nomorSuratAsalMasuk.trim()}) - Agenda: ${officialAgenda} - Sifat: ${sifatSuratMasuk} [Tujuan Aksi: ${tujuanAksi === 'TTD' ? 'Permohonan Tanda Tangan Pejabat' : 'Disposisi Pimpinan'}]`
            }
          ],
          disposisi: null
        });

        onClose();
      } catch (err) {
        console.error('[SUBMIT-SURAT-MASUK-ERROR]', err);
        alert('Gagal meregistrasi surat masuk: ' + err.message);
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
          status: 'DRAFT_MENUNGGU_PARAF',
          status_progres: 'DRAFT_MENUNGGU_PARAF',
          statusTimestamp: 'Tersimpan sebagai Draf Naskah (Nomor Resmi Ditunda Hingga TTE Final)',
          tujuan_aksi: tujuanAksi,
          isSignatureRequest: tujuanAksi === 'TTD',
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
          riwayatParaf: [
            {
              nama: currentUser?.nama_lengkap || currentUser?.name || 'Staf Pelaksana Persuratan',
              jabatan: currentUser?.roleLabel || 'Pembuat Naskah / Konseptor',
              waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
              catatan: `Penyusunan Draf ${currentTypeMeta?.nama_jenis_naskah} - Diajukan untuk verifikasi paraf sebelum TTE oleh ${namaJabatanSigner}`
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
        status: targetStatus === 'Draft' ? 'Draft' : 'DRAFT_MENUNGGU_PARAF',
        statusTimestamp: targetStatus === 'Draft' ? 'Tersimpan sebagai Draf Naskah' : 'Diajukan untuk Paraf Berjenjang (Pasal 59) & TTE Pimpinan',
        tujuan_aksi: tujuanAksi,
        isSignatureRequest: tujuanAksi === 'TTD',
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
        riwayatParaf: [
          {
            nama: currentUser?.nama_lengkap || currentUser?.name || 'Staf Pelaksana Persuratan',
            jabatan: currentUser?.roleLabel || 'Operator Unit',
            waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            catatan: `${targetStatus === 'Draft' ? 'Penyusunan Draf' : 'Registrasi naskah'} ${TEMPLATES.find((t) => t.id === selectedTemplateId)?.name || 'Surat Keluar'} - Diterbitkan Nomor Resmi: ${officialNomorSurat} [Tujuan Aksi: ${tujuanAksi === 'TTD' ? 'Permohonan TTD Pejabat' : 'Disposisi'}]`
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

  const tembusanList = useMemo(() => {
    return tembusanText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
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
                <span className="truncate">Registrasi Surat</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-100 border border-emerald-700">
                  {activeUnitObj.singkatan}
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 hidden sm:block">
                Formula Rumus Penomoran: [No]/UN58/[Unit]/[Klasifikasi]/[Tahun]
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

        {/* SEGMENTED MODE SWITCHER: SURAT KELUAR VS SURAT MASUK */}
        <div className="px-4 sm:px-5 py-2 bg-slate-100/95 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setLetterType('surat-keluar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                letterType === 'surat-keluar'
                  ? 'bg-unsil-green-800 text-white shadow-xs ring-1 ring-unsil-green-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-unsil-gold-400" />
              <span>📤 Surat Keluar / Nota Dinas</span>
            </button>
            <button
              type="button"
              onClick={() => setLetterType('surat-masuk')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                letterType === 'surat-masuk'
                  ? 'bg-unsil-green-800 text-white shadow-xs ring-1 ring-unsil-green-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Inbox className="w-3.5 h-3.5 text-emerald-400" />
              <span>📥 Registrasi Surat Masuk</span>
            </button>
          </div>

          {/* Sifat & Tujuan Aksi Selector: Disposisi vs Permohonan TTD */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline">
              Tujuan Aksi:
            </span>
            <div className="inline-flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setTujuanAksi('DISPOSISI')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  tujuanAksi === 'DISPOSISI'
                    ? 'bg-emerald-100 text-unsil-green-950 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dapat didisposisikan kepada unit bawahan"
              >
                <span>📋 Disposisi Pimpinan</span>
              </button>
              <button
                type="button"
                onClick={() => setTujuanAksi('TTD')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  tujuanAksi === 'TTD'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Permohonan Tanda Tangan Pejabat (Fitur Disposisi DILARANG/DISEMBUNYIKAN)"
              >
                <span>✍️ Permohonan TTD (Strict)</span>
              </button>
            </div>
          </div>
        </div>

        {/* TEMPLATE SELECTOR BAR (KHUSUS SURAT KELUAR) */}
        {letterType === 'surat-keluar' && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-unsil-green-800" />
              Template:
            </span>
            <div className="flex items-center gap-1.5">
              {TEMPLATES.filter((tpl) => availableNaskahTypes.some((t) => t.kode_jenis_naskah === tpl.kode_jenis_naskah)).map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-unsil-green-900 text-white shadow-xs ring-2 ring-unsil-gold-400/50'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-unsil-gold-300' : 'text-slate-500'}`} />
                    <span>{tpl.name}</span>
                  </button>
                );
              })}
            </div>
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

                  {/* Notice Aturan Ketat Permohonan TTD jika tujuanAksi === 'TTD' */}
                  {tujuanAksi === 'TTD' ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Aturan Bisnis: Permohonan Tanda Tangan Pejabat (Tujuan TTD)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-900">
                        Surat masuk ini diajukan <strong>khusus untuk penandatanganan pejabat (TTE)</strong>. Pejabat penerima <strong>hanya dapat Menandatangani (TTE) atau Menolak/Minta Revisi</strong>. Fitur Disposisi akan <strong>otomatis dinonaktifkan & disembunyikan sepenuhnya</strong> dari layar.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-unsil-green-700 shrink-0" />
                      <span>Jalur Disposisi: Surat masuk akan diteruskan ke pimpinan untuk penerbitan lembar instruksi disposisi online.</span>
                    </div>
                  )}

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
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Tujuan Surat (Pimpinan / Unit UNSIL) *
                      </label>
                      <input
                        type="text"
                        value={tujuanMasuk}
                        onChange={(e) => setTujuanMasuk(e.target.value)}
                        placeholder="Contoh: Rektor Universitas Siliwangi"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20"
                        required
                      />
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
                        onChange={(e) => setSifatSuratMasuk(e.target.value)}
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

                  {/* Unggah Pindaian Dokumen PDF */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Unggah Pindaian Surat Fisik (PDF Maks. 5MB)
                      </label>
                      {uploadedFileNameMasuk && (
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Berkas Terverifikasi
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputMasukRef}
                      accept="application/pdf,.pdf"
                      onChange={handleFileInputMasuk}
                      className="hidden"
                    />

                    {uploadedFileNameMasuk ? (
                      /* Kartu Berkas Pindaian PDF Aktif & Fungsional */
                      <div className="border border-slate-200 bg-white rounded-xl p-3 shadow-xs hover:border-unsil-green-700/60 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate" title={uploadedFileNameMasuk}>
                                {uploadedFileNameMasuk}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-slate-700">{uploadedFileSizeMasuk}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">Keaslian digital terverifikasi</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={handlePreviewFileMasuk}
                              title="Lihat Pratinjau Dokumen PDF"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Pratinjau</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputMasukRef.current?.click()}
                              title="Ganti Berkas PDF"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-unsil-green-800 bg-unsil-green-50 hover:bg-unsil-green-100 border border-unsil-green-200 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-unsil-green-700" />
                              <span>Ganti</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveFileMasuk}
                              title="Hapus Berkas"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Area Dropzone Unggah Saat Kosong */
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
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                          isDraggingMasuk
                            ? 'border-emerald-600 bg-emerald-50/80 scale-[0.99]'
                            : 'border-slate-300 hover:border-unsil-green-700 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <UploadCloud className={`w-7 h-7 mx-auto mb-1.5 transition-colors ${isDraggingMasuk ? 'text-emerald-700' : 'text-unsil-green-800'}`} />
                        <p className="text-xs font-semibold text-slate-800">
                          {isDraggingMasuk ? 'Lepaskan Berkas PDF di Sini' : 'Klik untuk Memilih Berkas atau Seret PDF ke Sini'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Format pindaian naskah dinas resmi (PDF Maks. 5MB)
                        </p>
                      </div>
                    )}

                    {/* Alert Kesalahan Unggah */}
                    {uploadErrorMasuk && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{uploadErrorMasuk}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadErrorMasuk('')}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* FORM SURAT KELUAR / NOTA DINAS                                           */
                /* ========================================================================= */
                <div className="space-y-4">
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

                  {/* Rumus Penomoran Otomatis Display (Readonly / Generated Automatically) */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-unsil-green-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        Nomor Surat Keluar (Generated Automatically — Read-Only)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-semibold border border-emerald-300/60">
                        Tata Naskah Dinas UNSIL
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        readOnly
                        value={previewNomorSurat}
                        className="font-mono font-bold text-xs sm:text-sm text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs select-all cursor-not-allowed w-full sm:w-auto"
                        title="Read-only: Format penomoran dirakit otomatis sesuai aturan Tata Naskah Dinas & SK Rektor No. 2803/2023"
                      />
                      <span className="text-[10px] text-slate-500 italic">
                        Nomor urut resmi diterbitkan & dikunci secara atomik saat tombol simpan ditekan.
                      </span>
                    </div>
                  </div>

                  {/* Warning Aturan Ketat Permohonan TTD jika tujuanAksi === 'TTD' */}
                  {tujuanAksi === 'TTD' && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Aturan Bisnis: Permohonan Tanda Tangan Pejabat (Tujuan TTD)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-900">
                        Naskah ini ditujukan khusus kepada Pejabat Penandatangan untuk dibubuhi TTE BSrE. Sesuai aturan bisnis, pejabat penerima <strong>hanya dapat Menandatangani (TTE) atau Menolak/Minta Revisi</strong>. Fitur Disposisi akan <strong>otomatis disembunyikan total</strong> dari layar.
                      </p>
                    </div>
                  )}

                  {/* SELEKSI JENIS NASKAH DINAS (TABEL 1 PERATURAN REKTOR NO. 3/2023) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-unsil-green-800" />
                        Jenis Naskah Dinas (Tabel 1) *
                      </label>
                      {!isDosen && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-unsil-green-950 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          Kewenangan Penandatanganan Sesuai Tabel 1 Tata Naskah Dinas UNSIL
                        </span>
                      )}
                    </div>

                    <select
                      value={selectedKodeNaskah}
                      onChange={(e) => handleSelectKodeNaskah(e.target.value)}
                      disabled={isLoadingScoping}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition shadow-xs cursor-pointer"
                    >
                      {availableNaskahTypes.map((t) => (
                        <option key={t.kode_jenis_naskah} value={t.kode_jenis_naskah}>
                          {t.nama_jenis_naskah} ({t.can_choose_signatory ? 'Wewenang: Ketua Jurusan / Dekan' : 'Wewenang Khusus: Dekan'})
                        </option>
                      ))}
                    </select>

                    {currentTypeMeta && (
                      <div
                        className={`p-2 rounded-lg text-[10.5px] leading-relaxed flex items-start gap-2 border ${
                          currentTypeMeta.can_choose_signatory
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}
                      >
                        {currentTypeMeta.can_choose_signatory ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold">{currentTypeMeta.badge_keterangan}</p>
                          <p className="text-[10px] opacity-90 mt-0.5">{currentTypeMeta.catatan_kewenangan}</p>
                        </div>
                      </div>
                    )}
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
                    Tujuan / Penerima (Yth.)
                  </label>
                  <input
                    type="text"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    placeholder="Contoh: Kepala Biro Keuangan dan Umum"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Alamat / Tempat Tujuan
                  </label>
                  <input
                    type="text"
                    value={alamatTujuan}
                    onChange={(e) => setAlamatTujuan(e.target.value)}
                    placeholder="Contoh: Kota Tasikmalaya / Di Tempat"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Hal / Perihal */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hal / Perihal Naskah Dinas
                </label>
                <input
                  type="text"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Contoh: Permohonan Koordinasi dan Fasilitasi..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
                />
              </div>

              {/* Paragraf Pembuka */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Kalimat / Paragraf Pembuka
                </label>
                <textarea
                  rows={2}
                  value={kalimatPembuka}
                  onChange={(e) => setKalimatPembuka(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                />
              </div>

              {/* Batang Tubuh / Isi Pokok */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Isi Pokok / Rincian Naskah (Multi-Baris)
                </label>
                <textarea
                  rows={4}
                  value={isiPokok}
                  onChange={(e) => setIsiPokok(e.target.value)}
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
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20"
                />
              </div>

              {/* Penandatangan Kedinasan (Auto-Fill & Locked) */}
              {/* Penandatangan Kedinasan (Automated Hierarchy Routing: Auto-Fill & Locked) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Pejabat Penandatangan &amp; Otoritas TTE BSrE
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    TTE Otomatis Pasca-Paraf (Pasal 61)
                  </span>
                </div>

                {/* 1. Deteksi Session User (Dosen/Staf Login) */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] bg-slate-100/90 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600">
                    Session User: <strong className="text-slate-900">{sessionUserName}</strong>
                  </span>
                  <span className="text-unsil-green-900 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Jabatan: {sessionUserJabatan} | Unit: {activeUnitObj.kode_unit} ({activeUnitObj.singkatan})
                  </span>
                </div>

                {/* 2 & 3. Kontrol Otoritas Penandatangan: Selektor Radio Kajur vs Dekan & Kunci Dekan (Tabel 1) */}
                {currentTypeMeta?.can_choose_signatory ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-bold text-emerald-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        Pilih Pejabat Penandatangan (Kewenangan Bersama Sesuai Tabel 1):
                      </label>
                      <span className="text-[9.5px] bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                        Kajur / Dekan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Pilihan 1: Ketua Jurusan */}
                      {kajurSignatory && (
                        <label
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            selectedSignatoryRole === 'KETUA_JURUSAN'
                              ? 'bg-white border-unsil-green-700 ring-2 ring-unsil-green-700/20 shadow-xs'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="signatoryRoleChoice"
                            value="KETUA_JURUSAN"
                            checked={selectedSignatoryRole === 'KETUA_JURUSAN'}
                            onChange={() => handleSelectSignatoryRole('KETUA_JURUSAN')}
                            className="mt-0.5 text-unsil-green-800 focus:ring-unsil-green-800"
                          />
                          <div className="text-[11px] leading-tight">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-unsil-green-800 block mb-0.5">
                              Ketua Jurusan (Unit Pemohon)
                            </span>
                            <p className="font-bold text-slate-900">{kajurSignatory.nama_gelar || kajurSignatory.nama}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">{kajurSignatory.jabatan}</p>
                            <span className="text-[9px] font-mono text-emerald-700 font-semibold">NIP: {kajurSignatory.nip}</span>
                          </div>
                        </label>
                      )}

                      {/* Pilihan 2: Dekan Fakultas */}
                      {dekanSignatory && (
                        <label
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            selectedSignatoryRole === 'DEKAN'
                              ? 'bg-white border-unsil-green-700 ring-2 ring-unsil-green-700/20 shadow-xs'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="signatoryRoleChoice"
                            value="DEKAN"
                            checked={selectedSignatoryRole === 'DEKAN'}
                            onChange={() => handleSelectSignatoryRole('DEKAN')}
                            className="mt-0.5 text-unsil-green-800 focus:ring-unsil-green-800"
                          />
                          <div className="text-[11px] leading-tight">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-unsil-green-800 block mb-0.5">
                              Dekan Fakultas (Pimpinan Induk)
                            </span>
                            <p className="font-bold text-slate-900">{dekanSignatory.nama_gelar || dekanSignatory.nama}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">{dekanSignatory.jabatan}</p>
                            <span className="text-[9px] font-mono text-emerald-700 font-semibold">NIP: {dekanSignatory.nip}</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        Penandatangan Terkunci: Dekan Fakultas
                      </label>
                      <span className="text-[9.5px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        Khusus Dekan (Tabel 1)
                      </span>
                    </div>

                    <p className="text-[10.5px] text-amber-900 leading-relaxed">
                      Sesuai <strong>Tabel 1 Peraturan Rektor No. 3 Tahun 2023</strong>, dokumen <strong>{currentTypeMeta?.nama_jenis_naskah}</strong> merupakan wewenang hukum Dekan Fakultas. Pilihan Ketua Jurusan dinonaktifkan secara otomatis.
                    </p>

                    {dekanSignatory && (
                      <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] flex items-center justify-between shadow-2xs">
                        <div>
                          <p className="font-bold text-slate-900">{dekanSignatory.nama_gelar || dekanSignatory.nama}</p>
                          <p className="text-slate-500 text-[10px]">{dekanSignatory.jabatan}</p>
                        </div>
                        <span className="text-[9.5px] font-mono font-bold text-unsil-green-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          NIP: {dekanSignatory.nip}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Tiga Input Terpisah: "Nama Pejabat", "Gelar", dan "NIP" (Auto-Fill & ReadOnly Locked) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Input 1: Nama Pejabat */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-slate-500 font-semibold">
                        Nama Pejabat
                      </label>
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        Readonly
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={namaPejabatSigner}
                        placeholder="Nama Pejabat"
                        title="Nama Pejabat terisi otomatis dan dikunci (readonly)."
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
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        Readonly
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={gelarSigner}
                        placeholder="Gelar Resmi"
                        title="Gelar akademik/profesi terisi otomatis dan dikunci (readonly)."
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
                      <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        Readonly
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={nipSigner}
                        placeholder="NIP 18 Digit"
                        title="NIP pejabat terisi otomatis dan dikunci (readonly)."
                        className="w-full p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 cursor-not-allowed select-all focus:outline-none tracking-wide"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Safeguard Automated Hierarchy Routing Sesuai Tabel 1 */}
                {!isDosen && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-300 flex items-start gap-2 text-[10px] text-emerald-950 leading-relaxed shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Kewenangan Penandatanganan Sesuai Tabel 1 Tata Naskah Dinas UNSIL:</strong> Penandatangan dibatasi secara kaku sesuai hierarki unit pembuat (Fakultas / Jurusan). Kolom <em>Nama Pejabat</em>, <em>Gelar</em>, dan <em>NIP</em> dikunci secara otomatis (<em>readonly</em>) untuk mencegah ketidaksesuaian tata kelola kedinasan.
                    </span>
                  </div>
                )}
              </div>

              {/* Tembusan */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tembusan (Satu per baris)
                </label>
                <textarea
                  rows={2}
                  value={tembusanText}
                  onChange={(e) => setTembusanText(e.target.value)}
                  placeholder="1. Rektor Universitas Siliwangi&#10;2. ..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

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
                /* PRATINJAU LEMBAR AGENDA SURAT MASUK                                      */
                /* ========================================================================= */
                <>
                  <div className="w-full max-w-[210mm] mb-2.5 flex items-center justify-between text-xs text-slate-600 px-1">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-unsil-green-800" />
                      Pratinjau Lembar Kendali & Agenda Surat Masuk
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-xs flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Format: A4 Agenda Kedinasan
                    </span>
                  </div>

                  <div
                    id="siloka-create-letter-a4-preview"
                    data-paper-size="A4"
                    className="printable-document bg-white w-full max-w-[210mm] p-8 sm:p-12 shadow-2xl border border-slate-300 rounded-xs text-black font-serif text-[11.5px] leading-relaxed flex flex-col justify-between a4-sheet min-h-[297mm]"
                  >
                    <div>
                      {/* Kop Surat Resmi UNSIL */}
                      <div className="mb-4 pb-0 text-black font-serif">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] shrink-0 flex items-center justify-center select-none protected-asset">
                            <img
                              src="/unsil-logo.png"
                              alt="Logo Resmi Universitas Siliwangi"
                              className="w-full h-full object-contain select-none pointer-events-none protected-asset"
                              draggable="false"
                            />
                          </div>
                          <div className="flex-1 text-center font-serif leading-tight pr-2">
                            <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-normal text-black leading-snug">
                              {kopConfig.kementerianText}
                            </p>
                            <h2 className="text-[12.5px] sm:text-[14.5px] font-bold uppercase tracking-normal text-black mt-0.5 leading-snug">
                              {kopConfig.universitasText}
                            </h2>
                            <p className="text-[10px] sm:text-[11.5px] font-medium text-black mt-1 leading-snug">
                              {kopConfig.alamatText}
                            </p>
                            <p className="text-[9.5px] sm:text-[10.5px] font-medium text-black leading-tight">
                              Laman: {kopConfig.lamanText} | Pos-el: {kopConfig.emailText}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 border-b-2 border-black" />
                        <div className="mt-[1.5px] border-b border-black" />
                      </div>

                      {/* Judul Lembar Agenda */}
                      <div className="text-center my-4">
                        <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-black underline">
                          LEMBAR PENGENDALIAN & REGISTRASI SURAT MASUK
                        </h3>
                        <p className="text-xs font-mono font-bold mt-1 text-slate-800">
                          Nomor Agenda: {previewNomorAgenda}
                        </p>
                      </div>

                      {/* Tabel Rincian Surat Masuk */}
                      <table className="w-full border-collapse border border-black text-xs mt-3 mb-4">
                        <tbody>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 w-1/3">Nomor Surat Asal</td>
                            <td className="border border-black p-2 font-mono font-bold">{nomorSuratAsalMasuk || '[Nomor Asal Belum Diisi]'}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Tanggal Surat Asal</td>
                            <td className="border border-black p-2">{tanggalSuratMasuk}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Tanggal Diterima</td>
                            <td className="border border-black p-2">{tanggalTerimaMasuk}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Instansi Pengirim</td>
                            <td className="border border-black p-2 font-semibold">{pengirimMasuk}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Ditujukan Kepada</td>
                            <td className="border border-black p-2 font-semibold">{tujuanMasuk}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Klasifikasi Arsip</td>
                            <td className="border border-black p-2 font-mono">{kodeKlasifikasi} - {klasifikasiList.find((k) => k.kode_klasifikasi === kodeKlasifikasi)?.keterangan_klasifikasi || 'Umum'}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Sifat / Keamanan</td>
                            <td className="border border-black p-2">{sifatSuratMasuk} ({tingkatKeamanan === 'B' ? 'Biasa/Terbuka' : tingkatKeamanan === 'R' ? 'Rahasia' : 'Sangat Rahasia'})</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 align-top">Perihal</td>
                            <td className="border border-black p-2 font-bold leading-relaxed">{perihalMasuk}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 align-top">Ringkasan / Catatan</td>
                            <td className="border border-black p-2 leading-relaxed">{ringkasanMasuk || perihalMasuk}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 align-top">Tujuan Aksi Naskah</td>
                            <td className="border border-black p-2">
                              {tujuanAksi === 'TTD' ? (
                                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                  ✍️ JALUR KHUSUS PERMOHONAN TANDA TANGAN (Tujuan TTD) — Disposisi Dinonaktifkan
                                </span>
                              ) : (
                                <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                                  📋 JALUR DISPOSISI PIMPINAN
                                </span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Kotak Instruksi Pimpinan / Disposisi */}
                      <div className="border border-black p-3.5 mt-4 rounded-xs">
                        <div className="font-bold uppercase text-[11px] mb-2 border-b border-black pb-1">
                          {tujuanAksi === 'TTD' ? 'CATATAN PERMOHONAN TANDA TANGAN ELEKTRONIK (TTE PEJABAT)' : 'LEMBAR INSTRUKSI DISPOSISI PIMPINAN'}
                        </div>
                        {tujuanAksi === 'TTD' ? (
                          <p className="text-xs italic text-slate-700 leading-relaxed">
                            Naskah ini diajukan secara khusus kepada Pejabat berwenang untuk dibubuhi Tanda Tangan Elektronik (TTE BSrE). Pejabat hanya berwenang Menandatangani atau Menolak/Minta Revisi naskah ini. Fitur disposisi staf ditiadakan.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                            <div>[ ] Tindak Lanjuti Segera</div>
                            <div>[ ] Koordinasikan dengan Unit</div>
                            <div>[ ] Pelajari / Telaah Staf</div>
                            <div>[ ] Hadiri / Wakilkan</div>
                            <div>[ ] Siapkan Tanggapan / Draft</div>
                            <div>[ ] Simpan / Arsipkan di JRA</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kaki Dokumen: QR Code Verifikasi */}
                    <div className="pt-6 mt-6 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-9 h-9 text-slate-800" />
                        <div>
                          <p className="font-bold text-slate-800">SISTEM INFORMASI PERSURATAN & KEARSIPAN SILOKA</p>
                          <p>Autentikasi Agenda: {previewNomorAgenda}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
                        <p>BSSN Tier-4 Certified</p>
                      </div>
                    </div>
                  </div>
                </>
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
                    className={`printable-document bg-white w-full max-w-[210mm] p-8 sm:p-12 shadow-2xl border border-slate-300 rounded-xs text-black font-serif text-[11.5px] leading-relaxed flex flex-col justify-between ${
                      currentPaperInfo.isF4 ? 'f4-sheet min-h-[330mm]' : 'a4-sheet min-h-[297mm]'
                    }`}
                    style={{ minHeight: currentPaperInfo.height }}
                  >
                    {/* BAGIAN ATAS DOKUMEN */}
                    <div>
                      {/* Kop Surat Resmi Universitas Siliwangi */}
                      <div className="mb-4 pb-0 text-black font-serif">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] shrink-0 flex items-center justify-center select-none protected-asset">
                            <img
                              src="/unsil-logo.png"
                              alt="Logo Resmi Universitas Siliwangi"
                              className="w-full h-full object-contain select-none pointer-events-none protected-asset"
                              draggable="false"
                            />
                          </div>

                          <div className="flex-1 text-center font-serif leading-tight pr-2">
                            <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-normal text-black leading-snug">
                              {kopConfig.kementerianText}
                            </p>
                            <h2 className="text-[12.5px] sm:text-[14.5px] font-bold uppercase tracking-normal text-black mt-0.5 leading-snug">
                              {kopConfig.universitasText}
                            </h2>

                            {kopConfig.unitText && (
                              <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-normal text-black mt-0.5 leading-snug font-serif">
                                {kopConfig.unitText}
                              </h3>
                            )}

                            <p className="text-[10px] sm:text-[11.5px] font-medium text-black mt-1 leading-snug">
                              {kopConfig.alamatText}
                            </p>
                            <p className="text-[9.5px] sm:text-[10.5px] font-medium text-black leading-tight">
                              Laman: {kopConfig.lamanText} | Pos-el: {kopConfig.emailText}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 border-b-2 border-black" />
                        <div className="mt-[1.5px] border-b border-black" />
                      </div>

                      {/* Header Tabel Naskah Standar atau Format Khusus */}
                      {selectedTemplateId === 'nota-dinas' ? (
                        <div className="mb-4 text-center">
                          <h3 className="text-base font-bold uppercase tracking-wider text-black underline">
                            NOTA DINAS
                          </h3>
                          <p className="text-xs font-mono font-bold mt-1 text-slate-800">
                            Nomor: {previewNomorSurat}
                          </p>

                          <div className="mt-4 text-left border-y border-black py-2 space-y-1 text-xs">
                            <div className="grid grid-cols-6 gap-1">
                              <span className="font-bold col-span-1">Yth.</span>
                              <span className="col-span-5">: {tujuan}</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              <span className="font-bold col-span-1">Dari</span>
                              <span className="col-span-5">: {pengirim}</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              <span className="font-bold col-span-1">Hal</span>
                              <span className="col-span-5 font-bold">: {perihal}</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              <span className="font-bold col-span-1">Tanggal</span>
                              <span className="col-span-5">: {formattedDateA4}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold">Nomor</span>
                              <span className="font-mono font-bold">: {previewNomorSurat}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold">Sifat</span>
                              <span>: {sifatSurat} ({tingkatKeamanan === 'B' ? 'Biasa' : tingkatKeamanan === 'R' ? 'Rahasia' : 'Sangat Rahasia'})</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold">Lampiran</span>
                              <span>: {lampiran}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold">Hal</span>
                              <span className="font-bold leading-tight">: {perihal}</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <p>{kopConfig.kotaText}, {formattedDateA4}</p>
                            <div className="mt-4 text-left inline-block">
                              <p className="font-semibold">Yth. {tujuan}</p>
                              <p>{alamatTujuan}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Batang Tubuh Isi Naskah Dinas */}
                      <div className="mt-4 space-y-3 text-justify text-[11.5px] leading-relaxed">
                        <p>{kalimatPembuka}</p>
                        <div className="whitespace-pre-line pl-2">{isiPokok}</div>
                        <p>{kalimatPenutup}</p>
                      </div>
                    </div>

                    {/* BAGIAN BAWAH DOKUMEN: PENANDATANGAN & TEMBUSAN */}
                    <div className="mt-6 pt-4">
                      <div className="flex justify-between items-end">
                        {/* Tembusan */}
                        <div className="text-[10px] space-y-0.5 text-slate-700 max-w-xs">
                          {tembusanList.length > 0 && (
                            <>
                              <p className="font-bold underline text-black">Tembusan Yth:</p>
                              {tembusanList.map((t, idx) => (
                                <p key={idx}>{t}</p>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Pejabat Penandatangan Resmi */}
                        <div className="text-center min-w-[220mm] max-w-xs ml-auto">
                          <p className="font-bold text-black">{namaJabatanSigner || `Pimpinan ${activeUnitObj.nama_unit}`}</p>
                          {tteVerified ? (
                            <div className="my-2 p-2 rounded border border-emerald-500/80 bg-emerald-50/50 flex items-center justify-center gap-2">
                              <QrCode className="w-10 h-10 text-emerald-800" />
                              <div className="text-left text-[9px] text-emerald-950 font-sans leading-tight">
                                <p className="font-bold">Ditandatangani secara elektronik oleh:</p>
                                <p className="font-semibold">{namaPejabatSigner || 'Pejabat Struktural'}</p>
                                <p className="text-[8px] text-emerald-800">Balai Sertifikasi Elektronik (BSrE BSSN)</p>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                              [Menunggu Pembubuhan TTE]
                            </div>
                          )}
                          <p className="font-bold text-black underline">
                            {namaPejabatSigner ? `${namaPejabatSigner}${gelarSigner ? `, ${gelarSigner}` : ''}` : '(Nama Pejabat Penandatangan)'}
                          </p>
                          <p className="font-mono text-[10.5px] text-slate-800">
                            {nipSigner ? `NIP ${nipSigner}` : 'NIP. ....................'}
                          </p>
                        </div>
                      </div>

                      {/* Footer Catatan Kaki */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                        <span>SILOKA UNSIL - Sistem Informasi Layanan Otomasi Kearsipan & Persuratan</span>
                        <span>Sesuai Standar Tata Naskah Dinas Perpres & Perka ANRI</span>
                      </div>
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
            <button
              type="button"
              onClick={handlePrint}
              disabled={isSaving}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50"
              title={letterType === 'surat-masuk' ? 'Cetak Lembar Agenda Surat Masuk' : `Cetak Pratinjau Kertas ${currentPaperInfo.code}`}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak {letterType === 'surat-masuk' ? 'Agenda' : `(${currentPaperInfo.code})`}</span>
            </button>

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
                  onClick={(e) => handleSubmit(e, 'DRAFT_MENUNGGU_PARAF')}
                  disabled={isSaving}
                  className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg text-xs font-bold bg-unsil-green-900 hover:bg-unsil-green-950 text-white shadow-md shadow-unsil-green-950/20 transition-all disabled:opacity-75 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 text-unsil-gold-400 animate-spin" />
                      <span>Mendaftarkan Naskah...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-unsil-gold-400" />
                      <span>Ajukan Paraf & TTE (Pasal 59)</span>
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
