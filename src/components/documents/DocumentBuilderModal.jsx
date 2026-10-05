import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Printer,
  Sparkles,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  Layers,
  HelpCircle,
  Eye,
  Building,
  FileSignature,
  FileCheck,
  UserCheck,
  Users,
  Mail,
  CreditCard,
  Calendar,
  Handshake,
  Upload,
  Image,
  RotateCcw,
  Key,
  FileSpreadsheet,
  FileBadge,
  PenTool,
  Send,
  Megaphone,
  ClipboardList,
  FileBarChart,
  FileSearch,
  SendHorizontal,
  QrCode
} from 'lucide-react';
import {
  PosTemplateView,
  SuratEdaranTemplateView,
  KeputusanTemplateView,
  SuratPerintahTemplateView,
  SuratTugasLembaranTemplateView,
  SuratTugasKolomTemplateView,
  NotaDinasTemplateView,
  SuratDinasTemplateView,
  SuratUndanganLembaranTemplateView,
  LampiranSuratUndanganTemplateView,
  SuratUndanganKartuTemplateView,
  NotaKesepahamanTemplateView,
  PerjanjianKerjaSamaTemplateView,
  SuratKuasaTemplateView,
  BeritaAcaraTemplateView,
  SuratKeteranganTemplateView,
  SuratPernyataanTemplateView,
  SuratPengantarTemplateView,
  PengumumanTemplateView,
  NotulaTemplateView,
  LaporanTemplateView,
  TelaahStafTemplateView,
  DisposisiRektorTemplateView,
  DAFTAR_PENERUSAN_REKTOR,
  DAFTAR_INSTRUKSI_REKTOR,
  PenggunaanTteTemplateView,
  DOCUMENT_TEMPLATES
} from './DocumentTemplates';
import { printDocument, getPaperSizeInfo } from '../../utils/printDocument';
import { determineKopSurat } from '../../utils/kopSuratHelper';
import {
  getAuthorizedTemplates,
  getDefaultTemplateForUser,
  getLecturerTemplateSopMetadata,
  getRektoratOfficialSopProfile,
  isTemplateAllowedForUser,
  normalizeUserRole
} from '../../config/documentFormats';
import { getPejabatByUnit } from '../../utils/pejabatHelper';
import SmartKlasifikasiNumberingPanel from './SmartKlasifikasiNumberingPanel';

// Daftar 9 Unit Penerima & Tembusan (3 Kolom Sesuai Gambar 1)
const DISTRIBUSI_GRID_UNITS = [
  // Kolom 1 (Index 0), Kolom 2 (Index 1), Kolom 3 (Index 2)
  { id: 'sekretariat_rektor', label: 'Sekretariat Rektor' },
  { id: 'bku', label: 'BKU' },
  { id: 'fkip', label: 'FKIP' },
  // Baris 2
  { id: 'jurusan', label: 'Jurusan' },
  { id: 'lppm', label: 'LPPM' },
  { id: 'upa_tik', label: 'UPA TIK' },
  // Baris 3
  { id: 'senat', label: 'Senat' },
  { id: 'spi', label: 'SPI' },
  { id: 'dewan_pengawas', label: 'Dewan Pengawas' }
];

export const DocumentBuilderModal = ({ isOpen, onClose, onSaveLetter, currentUser }) => {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    const isSdAllowed = isTemplateAllowedForUser('sd', currentUser);
    return isSdAllowed ? 'sd' : getDefaultTemplateForUser(currentUser);
  });
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'form' | 'preview'

  // State Penerima dan Distribusi (Gambar 1 & Gambar 2)
  const [distribusiData, setDistribusiData] = useState({
    unitPenerima: [],
    masukSebagai: 'Disposisi',
    tembusanUnit: [],
    sivitasAkademika: {
      dosen: false,
      tendik: false,
      mahasiswa: false
    },
    umumPosel: '',
    jugaDikirimFisik: false
  });

  const toggleDistribusiUnitPenerima = (unitLabel) => {
    setDistribusiData((prev) => {
      const exists = prev.unitPenerima.includes(unitLabel);
      return {
        ...prev,
        unitPenerima: exists
          ? prev.unitPenerima.filter((u) => u !== unitLabel)
          : [...prev.unitPenerima, unitLabel]
      };
    });
  };

  const toggleDistribusiTembusanUnit = (unitLabel) => {
    setDistribusiData((prev) => {
      const exists = prev.tembusanUnit.includes(unitLabel);
      return {
        ...prev,
        tembusanUnit: exists
          ? prev.tembusanUnit.filter((u) => u !== unitLabel)
          : [...prev.tembusanUnit, unitLabel]
      };
    });
  };
  const [smartNumberingMeta, setSmartNumberingMeta] = useState({
    nomorSuratAkhir: '',
    kodeKlasifikasi: 'KP.05.00',
    namaKlasifikasi: 'Administrasi Pegawai: Surat perintah dinas/Surat tugas',
    tingkatKeamanan: 'B',
    kodeUnit: 'UN58',
    nomorUrut: 1,
    tahun: currentYear,
    jraMetadata: null
  });
  const [securityTriggerMeta, setSecurityTriggerMeta] = useState({
    isRestrictedSecret: false,
    tingkatKeamanan: 'B',
    isPrintBlocked: false,
    authorizedPrintOverride: false,
    jraMetadata: null
  });

  // Profil SOP khusus bagi akun Rektor (23 Template) dan Wakil Rektor (16 Template) sesuai Peraturan Rektor No. 3/2023 & SK No. 2803/2023
  const rektoratSopProfile = useMemo(() => {
    return getRektoratOfficialSopProfile(currentUser);
  }, [currentUser]);

  // Daftar opsi jenis naskah sesuai Permendikbudristek No. 2/2024 & Peraturan Rektor No. 3/2023 (Gambar 1)
  const authorizedTemplatesList = useMemo(() => {
    return getAuthorizedTemplates(currentUser, { includeConditional: true });
  }, [currentUser]);

  const authorizedTemplateIdSet = useMemo(() => {
    return new Set(authorizedTemplatesList.map((t) => t.id));
  }, [authorizedTemplatesList]);

  const jenisNaskahOptions = useMemo(() => {
    const order = [
      'sd',
      'nd',
      'st_lembar',
      'st_kolom',
      'undangan_lembar',
      'undangan_kartu',
      'speng',
      'sket',
      'sper',
      'skua',
      'ba',
      'peng',
      'notula',
      'lap',
      'ts',
      'mou',
      'pks',
      'pos',
      'sk',
      'se',
      'sp',
      'disp_rektor',
      'tte_doc'
    ];

    const labels = {
      sd: 'Surat Dinas · Korespondensi biasa',
      nd: 'Nota Dinas · Internal unit',
      st_lembar: 'Surat Tugas (Format Lembar)',
      st_kolom: 'Surat Tugas (Format Kolom)',
      undangan_lembar: 'Surat Undangan (Format Lembar)',
      undangan_kartu: 'Surat Undangan (Format Kartu)',
      speng: 'Surat Pengantar',
      sket: 'Surat Keterangan',
      sper: 'Surat Pernyataan',
      skua: 'Surat Kuasa',
      ba: 'Berita Acara',
      peng: 'Pengumuman',
      notula: 'Notula Rapat',
      lap: 'Laporan',
      ts: 'Telaah Staf',
      mou: 'Nota Kesepahaman (MoU)',
      pks: 'Perjanjian Kerja Sama (PKS)',
      pos: 'Prosedur Operasional Standar (POS/SOP)',
      sk: 'Surat Keputusan (SK) [Khusus Rektor]',
      se: 'Surat Edaran [Khusus Rektor]',
      sp: 'Surat Perintah [Khusus Rektor]',
      disp_rektor: 'Disposisi Rektor [Khusus Rektor]',
      tte_doc: 'Lembar Pengesahan TTE'
    };

    return order
      .filter((id) => authorizedTemplateIdSet.has(id))
      .map((id) => ({
        id,
        label: labels[id] || id
      }));
  }, [authorizedTemplateIdSet]);

  // Deteksi akun Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan) — 8 Template Utama + 2 Template Kondisional
  const isLecturerWithoutStructuralPosition = useMemo(() => {
    return normalizeUserRole(currentUser) === 'DOSEN_NON_JABATAN';
  }, [currentUser]);

  const currentLecturerSopMeta = useMemo(() => {
    if (!isLecturerWithoutStructuralPosition) return null;
    return getLecturerTemplateSopMetadata(selectedTemplate);
  }, [isLecturerWithoutStructuralPosition, selectedTemplate]);

  const lecturerLeaderOptions = useMemo(() => {
    if (!isLecturerWithoutStructuralPosition) return [];
    const unitLeaders = getPejabatByUnit(currentUser).map((p) => ({
      id: `unit-${p.id}`,
      jabatan: p.jabatan,
      signerTitle: `${p.jabatan},`,
      namaLengkap: `${p.nama}${p.gelar ? `, ${p.gelar}` : ''}`,
      nip: p.nip,
      pangkatGol: 'Pembina Utama Muda / IV/c'
    }));
    const kajurOption = {
      id: 'kajur-unit',
      jabatan: `Ketua Jurusan pada ${currentUser?.unit_kerja_nama || 'Fakultas'}`,
      signerTitle: `Ketua Jurusan,`,
      namaLengkap: unitLeaders[1]?.namaLengkap || 'Dr. Ir. H. Budi Santoso, M.T.',
      nip: unitLeaders[1]?.nip || '197504122001121002',
      pangkatGol: 'Pembina / IV/a'
    };
    const rektorOption = {
      id: 'rektor-unsil',
      jabatan: 'Rektor Universitas Siliwangi',
      signerTitle: 'Rektor,',
      namaLengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      nip: '196708161996031001',
      pangkatGol: 'Pembina Utama Madya / IV/d'
    };
    return [...unitLeaders, kajurOption, rektorOption];
  }, [isLecturerWithoutStructuralPosition, currentUser]);

  const [selectedLecturerLeaderId, setSelectedLecturerLeaderId] = useState('');

  const activeLecturerLeader = useMemo(() => {
    if (!lecturerLeaderOptions.length) return null;
    return (
      lecturerLeaderOptions.find((l) => l.id === selectedLecturerLeaderId) ||
      lecturerLeaderOptions[0]
    );
  }, [lecturerLeaderOptions, selectedLecturerLeaderId]);

  // Deteksi otomatis ukuran kertas PDF resmi (F4 untuk Arahan, A4 untuk Korespondensi/Lainnya)
  const currentPaperInfo = useMemo(() => {
    return getPaperSizeInfo(selectedTemplate);
  }, [selectedTemplate]);

  // Format Kop Surat Dinamis resmi sesuai Pasal 30(2) & Pasal 31(1,2,6) Peraturan Rektor No. 3/2023
  const kopConfig = useMemo(() => {
    return determineKopSurat(currentUser);
  }, [currentUser]);

  // Deteksi peran konseptor fakultas / jurusan berdasarkan Peraturan Rektor No. 3/2023 Tabel 1
  const isFacultyDrafter = useMemo(() => {
    if (!currentUser) return true; // Default safe: batasi ke wewenang fakultas/jurusan
    if (rektoratSopProfile) return false;
    const role = (currentUser.role || '').toUpperCase();
    const unit = (currentUser.kode_unit_kerja || currentUser.unit_kerja_id || currentUser.kode_unit || '').toUpperCase();

    // Super admin dan pimpinan universitas (Rektorat) memiliki akses penuh sesuai Tabel 1
    if (role === 'SUPER_ADMIN' || role === 'SUPER ADMIN') return false;
    if (unit === 'UN58' || (role === 'PEJABAT' && unit === 'UN58')) return false;

    // Dosen tanpa jabatan struktural universitas dan staf fakultas dibatasi sesuai Tabel 1
    return true;
  }, [currentUser, rektoratSopProfile]);

  // Auto-redirect jika pengguna tidak berwenang pada template aktif (Tabel 1 Peraturan Rektor No. 3/2023)
  useEffect(() => {
    if (!isTemplateAllowedForUser(selectedTemplate, currentUser)) {
      setSelectedTemplate(getDefaultTemplateForUser(currentUser));
    }
  }, [currentUser, selectedTemplate]);

  // --- STATE FOR POS (PermenPAN-RB / Kemendikbudristek) ---
  const [posData, setPosData] = useState({
    unitKerja: 'Universitas Siliwangi (Rektorat)',
    nomorPos: `1/UN58/OT.01.01/${currentYear}`,
    tglPembuatan: '08 September 2026',
    tglRevisi: '08 September 2026',
    tglEfektif: '15 September 2026',
    disahkanOlehJabatan: 'Kepala Biro Umum dan Keuangan',
    disahkanOlehNama: 'Dr. Nana Sujana, Drs., M.Si.',
    disahkanOlehNip: '196808301989031004',
    namaPos: 'PROSEDUR OPERASIONAL STANDAR PENERBITAN SPJ DAN SURAT PERTANGGUNGJAWABAN KEUANGAN BKU',
    dasarHukumText:
      'Undang-Undang Nomor 17 Tahun 2003 tentang Keuangan Negara\nPeraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 24 Tahun 2024 tentang Statuta Universitas Siliwangi\nPeraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi',
    kualifikasiText:
      'Pendidikan minimal D3 / S1 Akuntansi atau Manajemen Keuangan\nMemahami regulasi perpajakan dan aplikasi SILOKA BKU UNSIL',
    keterkaitanText:
      'POS Pengajuan Anggaran Belanja Operasional BMN\nPOS Penerbitan Surat Perintah Membayar (SPM)',
    peralatanText:
      'Aplikasi SILOKA Intranet Kampus UNSIL\nKomputer & Jaringan Terenkripsi\nSertifikat Elektronik TTE BSrE',
    peringatanText:
      'Apabila SPJ tidak dilengkapi bukti sah dalam waktu 3 hari kerja, pengajuan ditunda\nPenyalahgunaan naskah keuangan diproses sesuai peraturan perundang-undangan',
    pencatatan:
      'Dicatat dan didata dalam berkas kearsipan Subbag Keuangan secara elektronik dan/atau manual sesuai kaidah retensi ANRI.',
    flowchartSteps: [
      {
        no: 1,
        kegiatan: 'Staf Unit Pengusul menginput berkas pertanggungjawaban melalui modul SILOKA',
        pelaksana: ['✓', '', ''],
        kelengkapan: 'Bukti kuitansi fisik & e-Kuitansi',
        waktu: '30 Menit',
        output: 'Draf Registrasi SPJ',
        ket: 'Sistem Siloka'
      },
      {
        no: 2,
        kegiatan: 'Koordinator Keuangan memverifikasi kelengkapan bukti dan kepatuhan anggaran',
        pelaksana: ['', '✓', ''],
        kelengkapan: 'Draf SPJ & Lembar Verifikasi',
        waktu: '1 Jam',
        output: 'Paraf E-Paraf Berjenjang',
        ket: 'Validasi Akuntansi'
      },
      {
        no: 3,
        kegiatan: 'Kepala Biro menyetujui dan menandatangani secara elektronik (TTE BSrE)',
        pelaksana: ['', '', '✓'],
        kelengkapan: 'Naskah SPJ Sah',
        waktu: '15 Menit',
        output: 'Barcode TTE BSrE',
        ket: 'Disetujui Final'
      }
    ]
  });

  // --- STATE FOR SURAT EDARAN ---
  const [seData, setSeData] = useState({
    nomorSurat: `03/UN58/SE/TU.00.01/${currentYear}`,
    tahun: currentYear,
    tentang:
      'PENERAPAN TATA NASKAH DINAS ELEKTRONIK DAN TANDA TANGAN ELEKTRONIK (TTE) DI LINGKUNGAN UNIVERSITAS SILIWANGI',
    tujuanText:
      'Para Dekan Fakultas\nPara Ketua Lembaga\nPara Kepala Biro dan Unit Kerja\nCivitas Academica Universitas Siliwangi',
    dasarHukum:
      'Berdasarkan Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi serta percepatan transformasi birokrasi digital kampus, dengan ini kami sampaikan ketentuan teknis persuratan dinas sebagai berikut:',
    isiText:
      '1. Seluruh persuratan kedinasan, lembar disposisi, dan pertanggungjawaban anggaran wajib dicatat secara terpusat melalui Sistem Informasi SILOKA BKU UNSIL.\n2. Mulai tanggal 1 Oktober 2026, dokumen dinas resmi diterbitkan menggunakan Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN dan tidak lagi menggunakan cap basah stempel fisik.\n3. Pengarsipan surat dinas wajib mengikuti Jadwal Retensi Arsip (JRA) yang berlaku demi mencegah penumpukan arsip inaktif kedaluwarsa.\n4. Surat Edaran ini berlaku sejak tanggal ditetapkan untuk dipedomani dan dilaksanakan dengan penuh tanggung jawab.',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    namaJabatan: 'Kepala Biro Umum dan Keuangan,',
    namaPejabat: 'Dr. Nana Sujana, Drs., M.Si.',
    nip: '196808301989031004',
    tteVerified: true
  });

  // --- STATE FOR KEPUTUSAN REKTOR (SK) ---
  const [skData, setSkData] = useState({
    nomorSk: `012/UN58/KU/${currentYear}`,
    tahun: currentYear,
    tentang:
      'PENETAPAN TIM KERJA REFORMASI BIROKRASI DAN TATA KELOLA KEARSIPAN DIGITAL BIRO PERENCANAAN, KEUANGAN, DAN UMUM UNIVERSITAS SILIWANGI',
    pejabatPenetap: 'REKTOR UNIVERSITAS SILIWANGI,',
    menimbangText:
      'bahwa dalam rangka mewujudkan akuntabilitas pengelolaan kearsipan dan percepatan naskah dinas elektronik di lingkungan Universitas Siliwangi, dipandang perlu membentuk Tim Kerja Khusus;\nbahwa mereka yang namanya tercantum dalam Lampiran Keputusan ini dipandang cakap dan memenuhi syarat untuk diangkat dalam tim kerja dimaksud;\nbahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a dan b, perlu menetapkan Keputusan Rektor Universitas Siliwangi.',
    mengingatText:
      'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\nUndang-Undang Nomor 43 Tahun 2009 tentang Kearsipan;\nPeraturan Pemerintah Nomor 4 Tahun 2014 tentang Penyelenggaraan Pendidikan Tinggi dan Pengelolaan Perguruan Tinggi;\nPeraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi.',
    menetapkan:
      'KEPUTUSAN REKTOR UNIVERSITAS SILIWANGI TENTANG PENETAPAN TIM KERJA REFORMASI BIROKRASI DAN TATA KELOLA KEARSIPAN DIGITAL BKU.',
    diktum: [
      {
        poin: 'KESATU',
        teks: 'Membentuk Tim Kerja Reformasi Birokrasi dan Tata Kelola Kearsipan Digital Biro Keuangan dan Umum Universitas Siliwangi dengan susunan personalia sebagaimana tercantum dalam Lampiran Keputusan ini.'
      },
      {
        poin: 'KEDUA',
        teks: 'Tim Kerja sebagaimana dimaksud pada Diktum KESATU bertugas menyusun SOP, memantau siklus hidup retensi arsip, dan mengawal penerapan TTE BSrE.'
      },
      {
        poin: 'KETIGA',
        teks: 'Segala biaya yang timbul sebagai akibat ditetapkannya Keputusan ini dibebankan pada Daftar Isian Pelaksanaan Anggaran (DIPA) Universitas Siliwangi.'
      },
      {
        poin: 'KEEMPAT',
        teks: 'Keputusan Rektor ini mulai berlaku pada tanggal ditetapkan.'
      }
    ],
    tempatTanggal: `Ditetapkan di Tasikmalaya pada tanggal 8 September ${currentYear}`,
    namaJabatan: 'REKTOR,',
    namaRektor: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipRektor: '196708161996031001',
    tteVerified: true,
    hasLampiran: false,
    lampiranRows: [
      { no: 1, nama: 'Dr. Nana Sujana, Drs., M.Si.', nip: '196808301989031004', jabatan: 'Kepala Biro Umum dan Keuangan', peranTim: 'Penanggung Jawab Tim' },
      { no: 2, nama: 'Budi Santoso, S.E., M.Ak.', nip: '198203202008121002', jabatan: 'Koordinator Keuangan & BMN', peranTim: 'Ketua Pelaksana' },
      { no: 3, nama: 'Siti Rohmah, S.AP.', nip: '198809152014042001', jabatan: 'Staf Administrasi & Kearsipan', peranTim: 'Sekretaris & Administrator SILOKA' },
      { no: 4, nama: 'Hendra Pratama, S.E., Ak., C.A.', nip: '198007112005011002', jabatan: 'Auditor SPI', peranTim: 'Pengawas Internal' }
    ]
  });

  // --- STATE FOR SURAT PERINTAH (SP) ---
  const [spData, setSpData] = useState({
    nomorSurat: `028/UN58/KP.08.00/${currentYear}`,
    pejabatPemberi: 'REKTOR UNIVERSITAS SILIWANGI,',
    menimbangText:
      'bahwa dalam rangka menjamin kelancaran pelaksanaan penatausahaan anggaran dan akuntabilitas keuangan BLU Universitas Siliwangi, dipandang perlu menerbitkan surat perintah ini;\nbahwa pegawai yang namanya tercantum di bawah ini dipandang cakap dan memenuhi syarat untuk melaksanakan perintah tersebut.',
    dasarText:
      'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\nPeraturan Pemerintah Nomor 4 Tahun 2014 tentang Penyelenggaraan Pendidikan Tinggi;\nPeraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi.',
    kepadaText:
      'Dr. Nana Sujana, Drs., M.Si. / NIP. 196808301989031004 / Kepala Biro Umum dan Keuangan',
    untukText:
      'Melaksanakan verifikasi lapangan, penataan rekonsiliasi kas, dan percepatan dokumen pertanggungjawaban keuangan;\nMelakukan koordinasi dengan Satuan Pengawas Internal (SPI) dan instansi pembina keuangan negara;\nMelaporkan hasil pelaksanaan perintah kedinasan kepada Rektor secara tertulis dan berkala.',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    namaJabatan: 'Rektor,',
    namaPejabat: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip: '196708161996031001',
    tteVerified: true
  });

  // --- STATE FOR SURAT TUGAS LEMBARAN (ST-LEMBAR) ---
  const [stLembarData, setStLembarData] = useState({
    nomorSurat: `044/UN58/ST/KP.03.00/${currentYear}`,
    kalimatPembuka: 'Rektor Universitas Siliwangi dengan ini menugaskan kepada pejabat/pegawai:',
    nama: 'Dr. Nana Sujana, Drs., M.Si.',
    nip: '196808301989031004',
    pangkatGolongan: 'Pembina Utama Muda, IV/c',
    jabatan: 'Kepala Biro Umum dan Keuangan',
    untukTugas: 'menghadiri Rapat Koordinasi Nasional Tata Kelola Keuangan dan Kearsipan Perguruan Tinggi Negeri',
    tanggalKegiatan: '15 s.d. 17 September 2026',
    tempatKegiatan: 'Hotel Grand Mercure, Jakarta Pusat',
    kalimatPenutup: 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    namaJabatan: 'Rektor,',
    namaPejabat: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipPejabat: '196708161996031001',
    tteVerified: true
  });

  // --- STATE FOR SURAT TUGAS KOLOM (ST-KOLOM) ---
  const [stKolomData, setStKolomData] = useState({
    nomorSurat: `045/UN58/ST/KP.03.00/${currentYear}`,
    kalimatPembuka: 'Dalam rangka optimalisasi tata kelola administrasi dan integrasi kearsipan digital, Rektor Universitas Siliwangi menugaskan kepada pegawai yang namanya tercantum di bawah ini:',
    pesertaList: [
      {
        no: 1,
        nama: 'Dr. Nana Sujana, Drs., M.Si.',
        nip: '196808301989031004',
        pangkatGolongan: 'Pembina Utama Muda, IV/c',
        jabatan: 'Kepala Biro Umum dan Keuangan'
      },
      {
        no: 2,
        nama: 'Budi Santoso, S.E., M.Ak.',
        nip: '198203202008121002',
        pangkatGolongan: 'Penata Tk. I, III/d',
        jabatan: 'Koordinator Keuangan & BMN'
      },
      {
        no: 3,
        nama: 'Siti Rohmah, S.AP.',
        nip: '198809152014042001',
        pangkatGolongan: 'Penata Muda Tk. I, III/b',
        jabatan: 'Staf Administrasi & Kearsipan'
      }
    ],
    untukTugas: 'mengikuti Bimbingan Teknis Standarisasi Naskah Dinas Elektronik dan Penerapan TTE Tersertifikasi BSSN',
    tanggalKegiatan: '20 s.d. 22 September 2026',
    tempatKegiatan: 'Pusat Diklat Kemendikbudristek, Depok, Jawa Barat',
    kalimatPenutup: 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    namaJabatan: 'Rektor,',
    namaPejabat: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipPejabat: '196708161996031001',
    tteVerified: true
  });

  // --- STATE FOR NOTA DINAS (ND) ---
  const [ndData, setNdData] = useState({
    nomorSurat: `018/UN58/KU.01.00/ND/${currentYear}`,
    yth: 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    dari: 'Koordinator Subbagian Keuangan dan BMN',
    hal: 'Laporan Realisasi Penyerapan Anggaran BLU Triwulan III TA 2026',
    kalimatPembuka: 'Bersama ini kami sampaikan dengan hormat laporan perkembangan realisasi belanja operasional dan belanja modal di lingkungan Universitas Siliwangi sampai dengan akhir Agustus 2026 sebagai bahan evaluasi pimpinan.',
    isiPokokText:
      '1. Realisasi penyerapan anggaran belanja pegawai dan operasional telah mencapai 78,4% dari pagu DIPA yang ditetapkan.\n2. Pengadaan sarana prasarana penunjang laboratorium melalui e-Katalog telah selesai diverifikasi oleh Pejabat Pembuat Komitmen (PPK).\n3. Seluruh berkas pertanggungjawaban (SPJ) telah terdigitalisasi penuh melalui modul kearsipan SILOKA sesuai standar Perka ANRI.',
    kalimatPenutup: 'Demikian nota dinas ini kami sampaikan, atas perhatian dan arahan Bapak diucapkan terima kasih.',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    namaJabatan: 'Koordinator Keuangan & BMN,',
    namaPejabat: 'Budi Santoso, S.E., M.Ak.',
    nip: '198203202008121002',
    tembusanText:
      'Wakil Rektor Bidang Keuangan dan Umum\nKetua Satuan Pengawas Internal (SPI)',
    tteVerified: true
  });

  // --- STATE FOR SURAT DINAS (SD) ---
  const [sdData, setSdData] = useState({
    nomorSurat: `092/UN58/TU.00.01/${currentYear}`,
    lampiran: '-',
    hal: 'Undangan Rapat Koordinasi Tindak Lanjut Hasil Pengawasan Kearsipan',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    yth: 'Para Dekan dan Kepala Biro di Lingkungan Universitas Siliwangi',
    alamatTujuan: 'Kota Tasikmalaya',
    kalimatPembuka: 'Sehubungan dengan agenda tindak lanjut evaluasi kearsipan dinas tahun 2026, bersama ini kami mengundang Saudara untuk menghadiri rapat koordinasi yang akan dilaksanakan pada:',
    isiSuratText:
      'Hari/Tanggal : Senin, 14 September 2026\nWaktu        : Pukul 09.00 WIB s.d. selesai\nTempat       : Ruang Rapat Rektorat Lt. 2 Kampus Siliwangi\nAgenda       : Sosialisasi Penerapan Tata Naskah Dinas Elektronik dan TTE BSrE BSSN pada SILOKA',
    kalimatPenutup: 'Mengingat pentingnya agenda tersebut di atas, kami mengharapkan kehadiran Saudara tepat pada waktunya. Atas perhatian dan kerja sama yang baik, diucapkan terima kasih.',
    namaJabatan: 'Kepala Biro Umum dan Keuangan,',
    namaPejabat: 'Dr. Nana Sujana, Drs., M.Si.',
    nip: '196808301989031004',
    tembusanText:
      'Rektor Universitas Siliwangi (sebagai laporan)\nPara Wakil Rektor di lingkungan UNSIL',
    tteVerified: true
  });

  // --- STATE FOR SURAT UNDANGAN LEMBARAN (SU-LEMBAR) ---
  const [undanganLembarData, setUndanganLembarData] = useState({
    nomorSurat: `098/UN58/TU.02.00/${currentYear}`,
    lampiran: '-',
    hal: 'Undangan Rapat Evaluasi Capaian Kinerja dan Kearsipan',
    tempatTanggal: `Tasikmalaya, 8 September ${currentYear}`,
    yth: 'Para Dekan Fakultas dan Direktur Pascasarjana',
    alamatTujuan: 'di Lingkungan Universitas Siliwangi',
    kalimatPembuka: 'Dalam rangka optimalisasi tata kelola administrasi akademik dan evaluasi naskah dinas triwulan III tahun 2026, bersama ini kami mengundang Saudara untuk hadir pada,',
    hariTanggal: 'Senin, 14 September 2026',
    pukul: '09.00 WIB s.d. selesai',
    tempat: 'Ruang Rapat Rektorat Lt. 2 Kampus Siliwangi',
    acara: 'Rapat Koordinasi Evaluasi Capaian Kinerja Triwulan III TA 2026',
    kalimatPenutup: 'Mengingat pentingnya agenda tersebut di atas, kami mengharapkan kehadiran Saudara tepat pada waktunya. Atas perhatian dan kerja sama yang baik, diucapkan terima kasih.',
    namaJabatan: 'Rektor,',
    namaPejabat: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip: '196708161996031001',
    tembusanText: 'Para Wakil Rektor di lingkungan UNSIL\nKetua Satuan Pengawas Internal (SPI)',
    tteVerified: true,
    hasLampiran: false,
    lampiranDaftarText: 'Dekan Fakultas Keguruan dan Ilmu Pendidikan\nDekan Fakultas Ekonomi dan Bisnis\nDekan Fakultas Pertanian\nDekan Fakultas Teknik\nDekan Fakultas Ilmu Kesehatan\nDekan Fakultas Agama Islam\nDirektur Pascasarjana\nKetua Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)\nKetua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)'
  });

  // --- STATE FOR SURAT UNDANGAN KARTU (SU-KARTU) ---
  const [undanganKartuData, setUndanganKartuData] = useState({
    pengundang: 'REKTOR UNIVERSITAS SILIWANGI',
    pendamping: '(beserta istri/suami)',
    kalimatMengharap: 'mengharap dengan hormat kehadiran Bapak/Ibu/Saudara',
    kalimatPadaAcara: 'pada acara',
    namaAcara: `UPACARA WISUDA PERIODE I TAHUN AKADEMIK ${currentYear}/${currentYear + 1}\nDAN PENGUKUHAN GURU BESAR UNIVERSITAS SILIWANGI`,
    hari: 'Sabtu',
    tanggal: `19 September ${currentYear}`,
    pukul: '08.00 WIB s.d. selesai',
    tempat: 'Gedung Rektorat Mandala Universitas Siliwangi, Kota Tasikmalaya',
    menitHadir: '30',
    nomorKonfirmasi: '(0265) 330634 ext. 102 / 0812-3456-7890 (Subbag Protokoler BKU)',
    pakaianPria: 'Pakaian Sipil Lengkap (PSL) / Batik Lengan Panjang',
    pakaianWanita: 'Pakaian Nasional / Menyesuaikan'
  });

  // --- STATE FOR NOTA KESEPAHAMAN (MoU) ---
  const [mouData, setMouData] = useState({
    logoPihak1: '/unsil-logo.png',
    logoPihak2: null,
    instansiPihak1: 'UNIVERSITAS SILIWANGI',
    instansiPihak2: 'PT TELEKOMUNIKASI INDONESIA (PERSERO) TBK',
    tentang: 'KERJA SAMA PENYELENGGARAAN TRIDHARMA PERGURUAN TINGGI,\nPENGEMBANGAN TEKNOLOGI INFORMASI KAMPUS, DAN PROGRAM MBKM',
    nomorPihak1: `045/UN58/KS.01.00/${currentYear}`,
    nomorPihak2: `TEL.128/HK.200/COP-A0000000/${currentYear}`,
    hari: 'Selasa',
    tanggal: '8',
    bulan: 'September',
    tahun: `${currentYear}`,
    tempat: 'Kota Tasikmalaya',
    pihak1Nama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pihak1Jabatan: 'Rektor Universitas Siliwangi',
    pihak1JabatanSingkat: 'Rektor Universitas Siliwangi',
    pihak1Instansi: 'Universitas Siliwangi',
    pihak1Alamat: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya, Jawa Barat',
    pihak1Nip: '196708161996031001',
    pihak1TteVerified: true,
    pihak2Nama: 'Ir. Dian Rachmawan, M.Sc.',
    pihak2Jabatan: 'Direktur Enterprise & Business Service',
    pihak2JabatanSingkat: 'Direktur Enterprise & Business Service',
    pihak2Instansi: 'PT Telekomunikasi Indonesia (Persero) Tbk',
    pihak2Alamat: 'Telkom Landmark Tower Lt. 32, Jl. Jend. Gatot Subroto Kav. 52, Jakarta Selatan',
    pihak2Nip: 'NIK 680124',
    pasalList: [
      {
        no: '1',
        judul: 'TUJUAN',
        isi: 'Nota Kesepahaman ini bertujuan untuk membangun kemitraan strategis dan sinergi antara PARA PIHAK dalam pemanfaatan potensi keahlian, teknologi, dan sumber daya yang dimiliki secara optimal guna kemajuan pendidikan tinggi dan industri digital nasional.'
      },
      {
        no: '2',
        judul: 'RUANG LINGKUP',
        isi: 'Ruang lingkup Nota Kesepahaman ini meliputi:\n1. Penyelenggaraan program pendidikan, penelitian terapan, dan pengabdian kepada masyarakat bersama.\n2. Fasilitasi Program Merdeka Belajar Kampus Merdeka (MBKM), magang bersertifikat, dan rekrutmen talenta muda UNSIL.\n3. Pengembangan infrastruktur digital, transformasi tata naskah dinas elektronik, dan integrasi smart campus.\n4. Bidang kerja sama lain yang disepakati bersama oleh PARA PIHAK.'
      },
      {
        no: '3',
        judul: 'PELAKSANAAN',
        isi: 'Hal-hal teknis dan operasional yang timbul sebagai akibat dari Nota Kesepahaman ini akan diatur lebih lanjut dalam bentuk Perjanjian Kerja Sama (PKS) atau Perjanjian Pelaksanaan yang ditandatangani oleh pejabat yang ditunjuk oleh PARA PIHAK.'
      },
      {
        no: '4',
        judul: 'JANGKA WAKTU',
        isi: 'Nota Kesepahaman ini berlaku untuk jangka waktu 3 (tiga) tahun terhitung sejak tanggal ditandatangani dan dapat diperpanjang atau diakhiri atas kesepakatan tertulis PARA PIHAK.'
      },
      {
        no: '5',
        judul: 'PENUTUP',
        isi: 'Nota Kesepahaman ini dibuat dan ditandatangani pada hari, tanggal, bulan, tahun, dan tempat sebagaimana tersebut pada awal Nota Kesepahaman, dibuat dalam rangkap 2 (dua) asli bermaterai cukup dan masing-masing mempunyai kekuatan hukum yang sama.'
      }
    ]
  });

  // --- STATE FOR PERJANJIAN KERJA SAMA DALAM NEGERI (PKS) ---
  const [pksData, setPksData] = useState({
    logoPihak1: '/unsil-logo.png',
    logoPihak2: null,
    instansiPihak1: 'UNIVERSITAS SILIWANGI',
    instansiPihak2: 'DINAS PENDIDIKAN PROVINSI JAWA BARAT',
    nomorPihak1: `120/UN58/KS.01/${currentYear}`,
    nomorPihak2: `421.2/1089/Disdik/${currentYear}`,
    tentang: 'PENINGKATAN MUTU PENDIDIKAN, PENELITIAN, DAN PENGABDIAN KEPADA MASYARAKAT DI JAWA BARAT',
    hari: 'Selasa',
    tanggal: '08',
    bulan: 'September',
    tahun: `${currentYear}`,
    tempat: 'Kota Tasikmalaya',
    pihak1Nama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pihak1Jabatan: 'Rektor Universitas Siliwangi',
    pihak1Instansi: 'Universitas Siliwangi',
    pihak1Alamat: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    pihak1Nip: '196708161996031001',
    pihak2Nama: 'Drs. H. Wahyu Mijaya, S.H., M.Si.',
    pihak2Jabatan: 'Kepala Dinas Pendidikan Provinsi Jawa Barat',
    pihak2Instansi: 'Dinas Pendidikan Provinsi Jawa Barat',
    pihak2Alamat: 'Jl. Dr. Radjiman No. 6, Pasir Kaliki, Cicendo, Kota Bandung',
    pihak2Nip: '196906171994031004',
    bidangKerjasama: 'Pendidikan, Penelitian, dan Pengabdian Kepada Masyarakat serta Program Merdeka Belajar Kampus Merdeka',
    tampilkanBingkaiLogo: false,
    tteVerified: true,
    pasalList: [
      {
        nomor: '1',
        judul: 'TUJUAN KERJA SAMA DALAM NEGERI',
        isi: 'Perjanjian Kerja Sama ini bertujuan untuk membangun sinergi dan kolaborasi strategis dalam rangka meningkatkan kualitas sumber daya manusia, penguatan riset aplikatif, serta perluasan akses pengabdian masyarakat di lingkungan Provinsi Jawa Barat.'
      },
      {
        nomor: '2',
        judul: 'RUANG LINGKUP KERJA SAMA DALAM NEGERI',
        isi: 'Ruang lingkup Perjanjian Kerja Sama ini meliputi:\n1. Peningkatan kapasitas dan kompetensi tenaga pendidik dan kependidikan.\n2. Penyelenggaraan program magang, praktik kerja lapangan, dan asistensi mengajar.\n3. Kolaborasi riset terapan dan publikasi ilmiah bersama.\n4. Pemberdayaan masyarakat berbasis potensi lokal di wilayah Jawa Barat.'
      },
      {
        nomor: '3',
        judul: 'PELAKSANAAN KEGIATAN',
        isi: 'Pelaksanaan kegiatan tindak lanjut dari Perjanjian Kerja Sama ini akan diatur secara teknis dalam Petunjuk Teknis (Juknis) atau Surat Keputusan Bersama yang ditandatangani oleh unit kerja pelaksana teknis yang ditunjuk oleh PARA PIHAK.'
      },
      {
        nomor: '4',
        judul: 'PEMBIAYAAN',
        isi: 'Segala biaya yang timbul sebagai akibat dari pelaksanaan Perjanjian Kerja Sama ini dibebankan kepada anggaran PARA PIHAK sesuai dengan kewenangan dan ketentuan peraturan perundang-undangan yang berlaku secara akuntabel.'
      },
      {
        nomor: '5',
        judul: 'PENYELESAIAN PERSELISIHAN',
        isi: 'Apabila terjadi perselisihan pendapat dalam penafsiran atau pelaksanaan Perjanjian Kerja Sama ini, PARA PIHAK sepakat untuk menyelesaikannya secara musyawarah untuk mufakat.'
      },
      {
        nomor: '6',
        judul: 'LAIN-LAIN',
        isi: '(1) Apabila terjadi hal-hal yang di luar kekuasaan kedua belah pihak atau keadaan memaksa (force majeure), dapat dipertimbangkan kemungkinan perubahan tempat dan waktu pelaksanaan tugas pekerjaan dengan persetujuan kedua belah pihak.\n(2) Yang termasuk keadaan memaksa (force majeure) adalah:\n    a. Bencana alam;\n    b. Tindakan pemerintah di bidang fiskal dan moneter; dan\n    c. Keadaan keamanan yang tidak mengizinkan.\n(3) Segala perubahan dan/atau pembatalan terhadap piagam kerja sama ini akan diatur bersama kemudian oleh PIHAK KESATU dan PIHAK KEDUA.'
      },
      {
        nomor: '7',
        judul: 'PENUTUP',
        isi: 'Perjanjian Kerja Sama ini dibuat dalam rangkap 2 (dua) asli bermaterai cukup, masing-masing mempunyai kekuatan hukum yang sama setelah ditandatangani oleh PARA PIHAK pada hari dan tanggal tersebut di atas.'
      }
    ]
  });

  // --- STATE FOR SURAT KUASA ---
  const [skuaData, setSkuaData] = useState({
    nomorSurat: `045/UN58/KU.02/${currentYear}`,
    pemberiNama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pemberiJabatan: 'Rektor Universitas Siliwangi',
    pemberiAlamat: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    pemberiNip: '196708161996031001',
    penerimaNama: 'Dr. Ade Rustiana, Drs., M.Si.',
    penerimaJabatan: 'Wakil Rektor Bidang Umum dan Keuangan Universitas Siliwangi',
    penerimaAlamat: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    penerimaNip: '196801021992031002',
    untukKeperluan: 'Mewakili Rektor Universitas Siliwangi dalam menandatangani Dokumen Perjanjian Kerja Sama, Berita Acara Rekonsiliasi Keuangan, dan Pengesahan Hibah Barang Milik Negara (BMN) Tahun Anggaran 2026 pada Kantor Pelayanan Perbendaharaan Negara (KPPN) Tasikmalaya.',
    tanggal: '08 September 2026',
    kota: 'Tasikmalaya',
    tteVerified: true
  });

  // --- STATE FOR BERITA ACARA ---
  const [baData, setBaData] = useState({
    nomorSurat: `078/UN58/BA.01/${currentYear}`,
    hari: 'Selasa',
    tanggal: '08',
    bulan: 'September',
    tahun: `${currentYear}`,
    pihak1Nama: 'Dr. Kurnia, S.P., M.P.',
    pihak1Nip: '197503122002121001',
    pihak1Jabatan: 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    pihak2Nama: 'Ir. Hendra Gunawan, M.T.',
    pihak2Jabatan: 'Pejabat Pembuat Komitmen (PPK) Sarana dan Prasarana',
    daftarKegiatan: [
      'Pemeriksaan fisik dan uji fungsi terhadap Pengadaan Perangkat Komputer Server dan Jaringan Terpusat SILOKA Tahun Anggaran 2026.',
      'Serah terima barang operasional teknologi informasi dalam kondisi baik, lengkap, dan memenuhi spesifikasi teknis Kerangka Acuan Kerja (KAK).'
    ],
    dasarPelaksanaan: 'Surat Keputusan Rektor Universitas Siliwangi Nomor 142/UN58/KP.02/2026 tanggal 15 Januari 2026 tentang Penetapan Tim Pemeriksa dan Penerima Hasil Pekerjaan Pengadaan Barang/Jasa di Lingkungan Universitas Siliwangi.',
    tempatDibuat: 'Tasikmalaya',
    mengetahuiNama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    mengetahuiJabatan: 'Rektor Universitas Siliwangi',
    mengetahuiNip: '196708161996031001',
    tteVerified: true
  });

  // --- STATE FOR SURAT KETERANGAN ---
  const [sketData, setSketData] = useState({
    nomorSurat: `092/UN58/KM.04/${currentYear}`,
    pejabatNama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pejabatNip: '196708161996031001',
    pejabatPangkatGol: 'Pembina Utama Madya / IV/d',
    pejabatJabatan: 'Rektor Universitas Siliwangi',
    pegawaiNama: 'Fajar Nugraha, S.T., M.Kom.',
    pegawaiNip: '198805212015041002',
    pegawaiPangkatGol: 'Penata Muda Tingkat I / III/b',
    pegawaiJabatan: 'Dosen Asisten Ahli pada Fakultas Teknik Universitas Siliwangi',
    isiKeterangan: 'Bahwa yang bersangkutan adalah benar Pegawai Negeri Sipil / Tenaga Pendidik aktif pada Universitas Siliwangi dan saat ini sedang ditugaskan sebagai Koordinator Sistem Informasi dan Transformasi Digital (SILOKA) serta berkelakuan baik dan tidak sedang menjalani hukuman disiplin tingkat sedang maupun berat.',
    tanggal: '08 September 2026',
    kota: 'Tasikmalaya',
    tteVerified: true
  });

  // --- STATE FOR SURAT PERNYATAAN ---
  const [sperData, setSperData] = useState({
    nomorSurat: `053/UN58/KP.04/${currentYear}`,
    namaYangMenyatakan: 'Dr. Ade Rustiana, Drs., M.Si.',
    nipYangMenyatakan: '196801021992031002',
    pangkatGolongan: 'Pembina Utama Muda / IV/c',
    jabatan: 'Wakil Rektor Bidang Umum dan Keuangan',
    alamat: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    isiPernyataan: 'Dengan ini menyatakan dengan sesungguhnya bahwa seluruh data, laporan rekonsiliasi belanja modal, dan dokumen pertanggungjawaban keuangan Universitas Siliwangi Tahun Anggaran 2026 telah disusun secara benar, objektif, dan sesuai dengan Standar Akuntansi Pemerintahan (SAP). Apabila di kemudian hari ditemukan ketidaksesuaian atau kekeliruan data, saya bersedia bertanggung jawab sepenuhnya sesuai ketentuan hukum yang berlaku.',
    tanggal: '08 September 2026',
    kota: 'Tasikmalaya',
    tteVerified: true
  });

  // --- STATE FOR SURAT PENGANTAR ---
  const [spengData, setSpengData] = useState({
    nomorSurat: `067/UN58/TU.02/${currentYear}`,
    tujuan: 'Kepala Kantor Pelayanan Perbendaharaan Negara (KPPN) Tasikmalaya',
    tujuanInstansi: 'Jalan Otto Iskandardinata Nomor 12 Kota Tasikmalaya',
    items: [
      {
        jenis: 'Berkas Rekonsiliasi Laporan Keuangan Universitas Siliwangi Semester I Tahun Anggaran 2026',
        jumlah: '2 (dua) bundel',
        keterangan: 'Disampaikan dengan hormat untuk diverifikasi dan diterbitkan Berita Acara Rekonsiliasi (BAR).'
      },
      {
        jenis: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Belanja Modal TA 2026',
        jumlah: '1 (satu) berkas',
        keterangan: 'Sebagai kelengkapan berkas rekonsiliasi pengesahan belanja modal.'
      }
    ],
    kalimatPenutup: 'Demikian surat pengantar ini kami sampaikan untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.',
    tanggal: '08 September 2026',
    kota: 'Tasikmalaya',
    pengirimJabatan: 'Kepala Biro Umum dan Keuangan,',
    pengirimNama: 'Dr. Nana Sujana, Drs., M.Si.',
    pengirimNip: '196808301989031004',
    penerimaTanggal: '08 September 2026',
    penerimaJabatan: 'Petugas Front Office / Pengadministrasi KPPN Tasikmalaya',
    penerimaNama: 'Dedi Supriadi, S.E.',
    penerimaNip: '198205142008121002',
    tteVerified: true
  });

  // --- STATE FOR PENGUMUMAN ---
  const [pengData, setPengData] = useState({
    nomorSurat: `082/UN58/PK.01/${currentYear}`,
    tentang: 'LIBUR HARI RAYA KEAGAMAAN DAN PENYESUAIAN LAYANAN ADMINISTRASI AKADEMIK UNIVERSITAS SILIWANGI TAHUN 2026',
    isiText: 'Sehubungan dengan penetapan Libur Nasional dan Cuti Bersama Hari Raya Keagamaan Tahun 2026 oleh Pemerintah Republik Indonesia, dengan ini kami sampaikan ketentuan penyelenggaraan kegiatan akademik dan administrasi di lingkungan Universitas Siliwangi sebagai berikut:\n\n1. Seluruh kegiatan perkuliahan, praktikum laboratorium, dan bimbingan akademik diliburkan terhitung mulai hari Jumat, 11 September 2026 sampai dengan hari Rabu, 16 September 2026.\n\n2. Pelayanan administrasi persuratan digital, pengajuan naskah dinas, dan pengesahan TTE melalui aplikasi SILOKA tetap dapat diakses secara daring oleh civitas akademika selama periode libur.\n\n3. Seluruh unit kerja wajib memastikan keamanan sarana prasarana, mematikan sambungan listrik dan instalasi komputer yang tidak digunakan sebelum meninggalkan ruangan kantor.\n\n4. Kegiatan perkuliahan tatap muka dan pelayanan administrasi perkantoran dibuka kembali secara normal pada hari Kamis, 17 September 2026 pukul 07.30 WIB.\n\nDemikian pengumuman ini disampaikan untuk diketahui dan dipedomani oleh seluruh dosen, tenaga kependidikan, serta mahasiswa Universitas Siliwangi.',
    tanggal: '08 September 2026',
    kota: 'Tasikmalaya',
    jabatan: 'Rektor Universitas Siliwangi',
    namaPejabat: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip: '196708161996031001',
    tteVerified: true
  });

  // --- STATE FOR NOTULA ---
  const [notulaData, setNotulaData] = useState({
    namaRapat: 'Rapat Koordinasi Evaluasi Implementasi Tata Naskah Dinas Elektronik SILOKA',
    hariTanggal: 'Selasa, 08 September 2026',
    pukul: '09.00 - 12.00 WIB',
    tempat: 'Ruang Sidang Rektorat Lt. 2 Universitas Siliwangi',
    susunanAcaraText: 'Pembukaan oleh Pembawa Acara\nPengarahan Rektor Universitas Siliwangi\nPemaparan Laporan Kemajuan Penerapan TTE BSrE oleh Tim SILOKA\nDiskusi dan Tanggapan Dekan serta Kepala Biro\nPerumusan Simpulan dan Penutup',
    pemimpinRapat: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng. (Rektor)',
    notulis: 'Rina Permatasari, S.Sos. (Pranata Humas)',
    pesertaRapatText: 'Wakil Rektor Bidang Akademik\nWakil Rektor Bidang Umum dan Keuangan\nWakil Rektor Bidang Kemahasiswaan dan Alumni\nPara Dekan Fakultas di lingkungan UNSIL\nKepala Lembaga (LPPM dan LP3M)\nKoordinator Pusat Teknologi Informasi dan Pangkalan Data',
    persoalanDibahas: 'Integrasi menyeluruh modul tanda tangan digital bersertifikat BSrE BSSN ke seluruh 20 format tata naskah dinas resmi SILOKA serta penguatan validasi QR-Code verifikasi dokumen kedinasan.',
    tanggapanPeserta: 'Para Dekan menyetujui percepatan implementasi template resmi naskah dinas per September 2026 dan meminta pelatihan teknis (Bimtek) bagi seluruh staf tata usaha fakultas.',
    simpulan: 'Seluruh fakultas dan biro diwajibkan menggunakan aplikasi SILOKA untuk pembuatan dan pengesahan seluruh naskah dinas resmi mulai pekan depan. Bimtek tata persuratan elektronik diagendakan pada hari Jumat, 11 September 2026.',
    tanggal: '08 September 2026',
    kota: 'Tasikmalaya',
    jabatanPenandatangan: 'Pemimpin Rapat,',
    namaPenandatangan: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipPenandatangan: '196708161996031001',
    tteVerified: true
  });

  // --- STATE FOR LAPORAN ---
  const [lapData, setLapData] = useState({
    nomorSurat: `091/UN58/TI.01/${currentYear}`,
    tentang: 'PELAKSANAAN AUDIT KESIAPAN TEKNOLOGI DAN IMPLEMENTASI TATA NASKAH DINAS ELEKTRONIK APLIKASI SILOKA UNIVERSITAS SILIWANGI TAHUN 2026',
    latarBelakang: 'Dalam rangka reformasi birokrasi dan percepatan transformasi digital persuratan kedinasan di lingkungan Universitas Siliwangi sesuai Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi tentang Tata Naskah Dinas serta Peraturan Rektor Nomor 3 Tahun 2023, dipandang perlu menyusun laporan pelaksanaan audit kesiapan sistem SILOKA.',
    dasar: '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\n2. Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan;\n3. Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi;\n4. Surat Tugas Rektor Universitas Siliwangi Nomor 042/UN58/KP.03/2026 tanggal 01 September 2026.',
    ruangLingkup: 'Ruang lingkup pelaksanaan kegiatan meliputi pengujian 20 format naskah dinas resmi, integrasi Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN, keandalan server basis data surat dinas, serta pelatihan operasional bagi staf pengadministrasi persuratan.',
    kegiatanDilaksanakan: '1. Melakukan validasi kesesuaian layout visual 20 format naskah dinas dengan pedoman tata naskah dinas resmi UNSIL.\n2. Melaksanakan uji coba penerbitan TTE BSrE dengan enkripsi hash dokumen dan stempel QR-Code verifikasi dinas.\n3. Menyelenggarakan bimbingan teknis (Bimtek) administrasi naskah dinas elektronik kepada seluruh perwakilan fakultas dan unit kerja.',
    hasilDicapai: '1. Sebanyak 20 format naskah dinas resmi berhasil diintegrasikan dengan sempurna ke dalam aplikasi SILOKA.\n2. Tingkat kepatuhan format persuratan kedinasan mencapai 100% dan siap dioperasikan penuh pada semester ganjil TA 2026/2027.\n3. Telah tersertifikasi secara elektronik dan aman dari risiko pemalsuan dokumen kedinasan.',
    penutup: 'Demikian laporan ini dibuat dengan sebenarnya sebagai bahan evaluasi dan pertanggungjawaban pelaksanaan kegiatan. Atas perhatian dan dukungan pimpinan Universitas Siliwangi, diucapkan terima kasih.',
    kota: 'Tasikmalaya',
    tanggal: '08 September 2026',
    jabatanPembuat: 'Koordinator Pelaksana Audit Sistem SILOKA,',
    namaPembuat: 'Dr. Ade Rustiana, Drs., M.Si.',
    nipPembuat: '196801021992031002',
    tteVerified: true
  });

  // --- STATE FOR TELAAH STAF (TS) ---
  const [tsData, setTsData] = useState({
    tentang:
      'OPTIMALISASI KEAMANAN DATA KEARSIPAN DAN IMPLEMENTASI TATA NASKAH DINAS ELEKTRONIK PADA APLIKASI SILOKA UNIVERSITAS SILIWANGI',
    kepada: 'Rektor Universitas Siliwangi',
    dari: 'Kepala Biro Umum dan Keuangan',
    tanggal: `08 September ${currentYear}`,
    lampiran: '1 (satu) Berkas',
    hal: 'Telaah Staf Kesiapan Infrastruktur Server dan Sertifikasi TTE BSrE SILOKA',
    persoalan:
      'Meningkatnya volume transaksi administrasi persuratan kedinasan dan kebutuhan pengesahan naskah dinas elektronik menggunakan TTE BSrE BSSN memerlukan kepastian keandalan server basis data, percepatan digitalisasi naskah dinas, serta perlindungan arsip vital kampus dari risiko gangguan teknis.',
    pranggapan:
      '1. Seluruh 21 format naskah dinas resmi SILOKA akan diwajibkan secara penuh pada semester ganjil TA 2026/2027.\n2. Kesiapan modul TTE tersertifikasi BSrE dan integrasi stempel QR-Code resmi akan menghapuskan penggunaan cap basah fisik di seluruh fakultas dan biro.\n3. Beban akses server akan meningkat signifikan sehingga diperlukan klaster server cadangan di Kampus Mugarsari.',
    faktaMempengaruhi:
      '1. Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi.\n2. Hasil audit kesiapan sistem menunjukkan efisiensi tata kelola persuratan dinas meningkat 80% dengan SILOKA.\n3. UPT TIK telah menyiapkan klaster server cadangan namun memerlukan penetapan alokasi anggaran operasional DIPA BLU TA 2026.',
    analisis:
      'Pemberlakuan TTE BSrE tersertifikasi secara menyeluruh memberikan kepastian hukum dan mencegah risiko pemalsuan surat dinas. Hambatan yang timbul berupa kebutuhan sosialisasi teknis kepada staf tata usaha fakultas dapat diselesaikan melalui bimbingan teknis (Bimtek) berjadwal dengan alokasi anggaran yang efisien dan akuntabel.',
    simpulan:
      'Penerapan 21 format naskah dinas resmi dan TTE BSrE pada aplikasi SILOKA sangat mendesak dan telah siap secara teknis maupun yuridis untuk diberlakukan secara penuh di lingkungan Universitas Siliwangi.',
    saran:
      'Disarankan kepada Bapak Rektor agar:\n1. Menerbitkan Surat Edaran tentang pemberlakuan wajib 21 format naskah dinas resmi dan TTE BSrE pada aplikasi SILOKA.\n2. Menyetujui pelaksanaan Bimbingan Teknis Tata Naskah Dinas Elektronik bagi operator persuratan fakultas dan unit kerja pada pekan ketiga September 2026.',
    jabatanPembuat: 'Kepala Biro Umum dan Keuangan,',
    namaPembuat: 'Dr. Nana Sujana, Drs., M.Si.',
    nipPembuat: '196808301989031004',
    tteVerified: true,
    showKopSurat: false
  });

  // --- STATE FOR DISPOSISI REKTOR (Format 22) ---
  const [dispRektorData, setDispRektorData] = useState({
    klasifikasi: 'Biasa',
    noAgenda: `AGD/UN58/KU/0142/${currentYear}`,
    tanggalTerima: `08 September ${currentYear}`,
    tanggalSurat: `05 September ${currentYear}`,
    nomorSurat: `087/KEMDIKBUD/DIKTI/TU/${currentYear}`,
    asalSurat: 'Direktorat Jenderal Pendidikan Tinggi, Riset, dan Teknologi',
    hal: 'Permohonan Koordinasi dan Fasilitasi Kerja Sama Program Penguatan Riset Strategis Nasional',
    diteruskanKepada: [4, 7, 26, 27],
    diteruskanCustom: '',
    instruksiUntuk: ['disp_2', 'disp_10', 'disp_15', 'disp_20'],
    koordinasikanDengan: 'Wakil Rektor Bidang Keuangan & Umum serta Kepala BKU',
    instruksiCustom: '',
    catatan: 'Segera telaah dan siapkan tim pendamping teknis untuk koordinasi dengan Ditjen Diktiristek. Laporkan progresnya minggu ini.',
    tempatTanggal: `Tasikmalaya, 08 September ${currentYear}`,
    namaRektor: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipRektor: '196708161996031001',
    tteVerified: true
  });

  const handleTogglePenerusanRektor = (id) => {
    setDispRektorData((prev) => {
      const exists = prev.diteruskanKepada.includes(id);
      return {
        ...prev,
        diteruskanKepada: exists
          ? prev.diteruskanKepada.filter((item) => item !== id)
          : [...prev.diteruskanKepada, id]
      };
    });
  };

  const handleToggleInstruksiRektor = (id) => {
    setDispRektorData((prev) => {
      const exists = prev.instruksiUntuk.includes(id);
      return {
        ...prev,
        instruksiUntuk: exists
          ? prev.instruksiUntuk.filter((item) => item !== id)
          : [...prev.instruksiUntuk, id]
      };
    });
  };

  // --- STATE FOR PENGGUNAAN TTE (Format 23) ---
  const [tteDocData, setTteDocData] = useState({
    nomorSurat: `089/UN58/TU.00/${currentYear}`,
    lampiran: '1 (satu) Berkas',
    hal: 'Pemberitahuan Penerapan Tanda Tangan Elektronik (TTE) Tersertifikasi BSrE',
    tempatTanggal: `Tasikmalaya, 09 September ${currentYear}`,
    tujuanUtama: 'Para Dekan Fakultas di lingkungan Universitas Siliwangi',
    tujuanDetail: 'Universitas Siliwangi',
    tujuanKota: 'Kota Tasikmalaya',
    kalimatPembuka:
      'Sehubungan dengan implementasi sistem persuratan dinas terintegrasi SILOKA serta percepatan transformasi tata kelola birokrasi digital kampus, dengan ini kami sampaikan ketentuan teknis sebagai berikut:',
    isiText:
      '1. Seluruh naskah dinas resmi di lingkungan Universitas Siliwangi mulai 1 Oktober 2026 diterbitkan menggunakan Tanda Tangan Elektronik (TTE) yang tersertifikasi oleh Balai Sertifikasi Elektronik (BSrE) BSSN.\n2. Keabsahan naskah dinas elektronik diakui secara sah secara hukum dan tidak memerlukan pembubuhan cap basah stempel fisik.\n3. Pihak penerima dapat melakukan verifikasi otentisitas dokumen dengan memindai Kode Informasi Elektronik (QR Code) yang tertera pada lembar naskah dinas.',
    kalimatPenutup:
      'Demikian pemberitahuan ini kami sampaikan untuk dipedomani dan dilaksanakan dengan sebaik-baiknya. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.',
    namaJabatan: 'Kepala Biro Umum dan Keuangan,',
    namaPejabat: 'Dr. Nana Sujana, Drs., M.Si.',
    nip: '196808301989031004',
    tteVerified: true,
    tembusanText:
      'Rektor Universitas Siliwangi (sebagai laporan)\nPara Wakil Rektor di lingkungan Universitas Siliwangi\nKetua Satuan Pengawas Internal (SPI) Universitas Siliwangi'
  });

  // Handlers for dynamic list updates
  const handleAddFlowchartStep = () => {
    setPosData((prev) => ({
      ...prev,
      flowchartSteps: [
        ...prev.flowchartSteps,
        {
          no: prev.flowchartSteps.length + 1,
          kegiatan: 'Langkah operasional lanjutan baru...',
          pelaksana: ['✓', '', ''],
          kelengkapan: 'Dokumen pendukung',
          waktu: '15 Menit',
          output: 'Tercatat di sistem',
          ket: 'SOP BKU'
        }
      ]
    }));
  };

  const handleRemoveFlowchartStep = (index) => {
    setPosData((prev) => ({
      ...prev,
      flowchartSteps: prev.flowchartSteps.filter((_, i) => i !== index)
    }));
  };

  const handleAddDiktum = () => {
    const listPoin = ['KESATU', 'KEDUA', 'KETIGA', 'KEEMPAT', 'KELIMA', 'KEENAM', 'KETUJUH'];
    const nextPoin = listPoin[skData.diktum.length] || `KE-${skData.diktum.length + 1}`;
    setSkData((prev) => ({
      ...prev,
      diktum: [...prev.diktum, { poin: nextPoin, teks: 'Klausul ketetapan baru...' }]
    }));
  };

  const handleRemoveDiktum = (index) => {
    setSkData((prev) => ({
      ...prev,
      diktum: prev.diktum.filter((_, i) => i !== index)
    }));
  };

  const handleAddLampiranRow = () => {
    setSkData((prev) => ({
      ...prev,
      lampiranRows: [
        ...prev.lampiranRows,
        {
          no: prev.lampiranRows.length + 1,
          nama: 'Nama Pegawai Baru',
          nip: '198501012015011001',
          jabatan: 'Staf Pelaksana BKU',
          peranTim: 'Anggota'
        }
      ]
    }));
  };

  const handleRemoveLampiranRow = (index) => {
    setSkData((prev) => ({
      ...prev,
      lampiranRows: prev.lampiranRows.filter((_, i) => i !== index)
    }));
  };

  const handleAddPesertaKolom = () => {
    setStKolomData((prev) => ({
      ...prev,
      pesertaList: [
        ...prev.pesertaList,
        {
          no: prev.pesertaList.length + 1,
          nama: 'Nama Pegawai Baru',
          nip: '198501012015011001',
          pangkatGolongan: 'Penata Muda, III/a',
          jabatan: 'Staf Pelaksana BKU'
        }
      ]
    }));
  };

  const handleRemovePesertaKolom = (index) => {
    setStKolomData((prev) => ({
      ...prev,
      pesertaList: prev.pesertaList.filter((_, i) => i !== index)
    }));
  };

  const handleAddPasalMou = () => {
    setMouData((prev) => ({
      ...prev,
      pasalList: [
        ...prev.pasalList,
        {
          no: String(prev.pasalList.length + 1),
          judul: 'KLAUSUL KERJA SAMA TAMBAHAN',
          isi: 'Ketentuan atau komitmen teknis tambahan yang disepakati bersama oleh PARA PIHAK.'
        }
      ]
    }));
  };

  const handleRemovePasalMou = (index) => {
    setMouData((prev) => {
      const updated = prev.pasalList.filter((_, i) => i !== index);
      // Auto renumber articles
      const renumbered = updated.map((p, idx) => ({ ...p, no: String(idx + 1) }));
      return {
        ...prev,
        pasalList: renumbered
      };
    });
  };

  const handleUpdatePasalMou = (index, field, value) => {
    setMouData((prev) => {
      const updated = [...prev.pasalList];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        pasalList: updated
      };
    });
  };

  const handleLogoPihak2Upload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih berkas gambar yang valid (PNG, JPG, JPEG, WEBP, atau SVG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran berkas lambang mitra maksimal 5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setMouData((prev) => ({
          ...prev,
          logoPihak2: event.target?.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogoPihak2 = () => {
    setMouData((prev) => ({
      ...prev,
      logoPihak2: null
    }));
  };

  // Handlers for PKS (Perjanjian Kerja Sama)
  const handleAddPasalPks = () => {
    setPksData((prev) => ({
      ...prev,
      pasalList: [
        ...prev.pasalList,
        {
          nomor: String(prev.pasalList.length + 1),
          judul: 'KLAUSUL KERJA SAMA TAMBAHAN',
          isi: 'Ketentuan atau komitmen teknis tambahan yang disepakati bersama oleh PARA PIHAK.'
        }
      ]
    }));
  };

  const handleRemovePasalPks = (index) => {
    setPksData((prev) => {
      const updated = prev.pasalList.filter((_, i) => i !== index);
      const renumbered = updated.map((p, idx) => ({ ...p, nomor: String(idx + 1) }));
      return {
        ...prev,
        pasalList: renumbered
      };
    });
  };

  const handleUpdatePasalPks = (index, field, value) => {
    setPksData((prev) => {
      const updated = [...prev.pasalList];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        pasalList: updated
      };
    });
  };

  const handleLogoPihak2PksUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih berkas gambar yang valid (PNG, JPG, JPEG, WEBP, atau SVG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran berkas lambang mitra maksimal 5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPksData((prev) => ({
          ...prev,
          logoPihak2: event.target?.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogoPihak2Pks = () => {
    setPksData((prev) => ({
      ...prev,
      logoPihak2: null
    }));
  };

  // Handlers for Berita Acara
  const handleAddKegiatanBa = () => {
    setBaData((prev) => ({
      ...prev,
      daftarKegiatan: [
        ...prev.daftarKegiatan,
        'Pelaksanaan kegiatan, pemeriksaan fisik, atau serah terima pekerjaan lanjutan...'
      ]
    }));
  };

  const handleRemoveKegiatanBa = (index) => {
    setBaData((prev) => ({
      ...prev,
      daftarKegiatan: prev.daftarKegiatan.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateKegiatanBa = (index, value) => {
    setBaData((prev) => {
      const updated = [...prev.daftarKegiatan];
      updated[index] = value;
      return {
        ...prev,
        daftarKegiatan: updated
      };
    });
  };

  // Handlers for Surat Pengantar
  const handleAddSpengItem = () => {
    setSpengData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          jenis: 'Dokumen/Barang Tambahan Baru',
          jumlah: '1 (satu) berkas',
          keterangan: 'Sebagai kelengkapan berkas kedinasan.'
        }
      ]
    }));
  };

  const handleRemoveSpengItem = (index) => {
    setSpengData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSpengItem = (index, field, value) => {
    setSpengData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        items: updated
      };
    });
  };

  // Convert text fields into arrays for rendering
  const currentPosRenderData = {
    ...posData,
    dasarHukum: posData.dasarHukumText.split('\n').filter(Boolean),
    kualifikasiPelaksana: posData.kualifikasiText.split('\n').filter(Boolean),
    keterkaitan: posData.keterkaitanText.split('\n').filter(Boolean),
    peralatan: posData.peralatanText.split('\n').filter(Boolean),
    peringatan: posData.peringatanText.split('\n').filter(Boolean)
  };

  const currentSeRenderData = {
    ...seData,
    tujuanList: seData.tujuanText.split('\n').filter(Boolean),
    isiSurat: seData.isiText.split('\n').filter(Boolean)
  };

  const currentSkRenderData = {
    ...skData,
    menimbang: skData.menimbangText.split('\n').filter(Boolean),
    mengingat: skData.mengingatText.split('\n').filter(Boolean)
  };

  const currentSpRenderData = {
    ...spData,
    menimbang: spData.menimbangText.split('\n').filter(Boolean),
    dasar: spData.dasarText.split('\n').filter(Boolean),
    kepada: spData.kepadaText.split('\n').filter(Boolean),
    untuk: spData.untukText.split('\n').filter(Boolean)
  };

  const currentStLembarRenderData = {
    ...stLembarData
  };

  const currentStKolomRenderData = {
    ...stKolomData
  };

  const currentNdRenderData = {
    ...ndData,
    isiPokok: ndData.isiPokokText.split('\n').filter(Boolean),
    tembusan: ndData.tembusanText.split('\n').filter(Boolean)
  };

  const currentSdRenderData = {
    ...sdData,
    isiSurat: sdData.isiSuratText.split('\n').filter(Boolean),
    tembusan: sdData.tembusanText.split('\n').filter(Boolean)
  };

  const currentUndanganLembarRenderData = {
    ...undanganLembarData,
    tembusan: undanganLembarData.tembusanText.split('\n').filter(Boolean),
    lampiranDaftarYth: undanganLembarData.lampiranDaftarText.split('\n').filter(Boolean)
  };

  const currentUndanganKartuRenderData = {
    ...undanganKartuData
  };

  const currentMouRenderData = {
    ...mouData
  };

  const currentPksRenderData = {
    ...pksData,
    daftarPasal: pksData.pasalList
  };

  const currentSkuaRenderData = {
    ...skuaData
  };

  const currentBaRenderData = {
    ...baData
  };

  const currentSketRenderData = {
    ...sketData
  };

  const currentSperRenderData = {
    ...sperData
  };

  const currentSpengRenderData = {
    ...spengData
  };

  const currentPengRenderData = {
    ...pengData,
    isiParagraf: pengData.isiText.split('\n\n').filter(Boolean)
  };

  const currentNotulaRenderData = {
    ...notulaData,
    susunanAcara: notulaData.susunanAcaraText.split('\n').filter(Boolean),
    pesertaRapat: notulaData.pesertaRapatText.split('\n').filter(Boolean)
  };

  const currentLapRenderData = {
    ...lapData
  };

  const currentTsRenderData = {
    ...tsData
  };

  const currentDispRektorRenderData = {
    ...dispRektorData
  };

  const currentTteDocRenderData = {
    ...tteDocData,
    isiSurat: tteDocData.isiText.split('\n').filter(Boolean),
    tembusan: tteDocData.tembusanText.split('\n').filter(Boolean)
  };

  // Sinkronisasi otomatis Nomor Surat Akhir (System-Generated / Read-Only) ke seluruh template aktif
  useEffect(() => {
    const generatedNo = smartNumberingMeta.nomorSuratAkhir;
    if (!generatedNo) return;

    setPosData((prev) => ({ ...prev, nomorPos: generatedNo }));
    setSeData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setSkData((prev) => ({ ...prev, nomorSk: generatedNo }));
    setSpData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setStLembarData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setStKolomData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setNdData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setSdData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setUndanganLembarData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setMouData((prev) => ({ ...prev, nomorPihak1: generatedNo }));
    setPksData((prev) => ({ ...prev, nomorPihak1: generatedNo }));
    setSkuaData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setBaData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setSketData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setSperData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setSpengData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setPengData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setLapData((prev) => ({ ...prev, nomorSurat: generatedNo }));
    setTteDocData((prev) => ({ ...prev, nomorSurat: generatedNo }));
  }, [smartNumberingMeta.nomorSuratAkhir, selectedTemplate]);

  // Sinkronisasi otomatis Identitas Penandatangan & Materi Pokok SOP ketika login sebagai Rektor atau Wakil Rektor (Warek I, II, III)
  useEffect(() => {
    if (!rektoratSopProfile) return;

    const {
      subRoleKey,
      officialTitle,
      signerTitle,
      officialName,
      officialNip
    } = rektoratSopProfile;

    if (subRoleKey === 'REKTOR') {
      setPosData((prev) => ({
        ...prev,
        unitKerja: 'Universitas Siliwangi (Rektorat)',
        disahkanOlehJabatan: officialTitle,
        disahkanOlehNama: officialName,
        disahkanOlehNip: officialNip
      }));
      setSeData((prev) => ({
        ...prev,
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nip: officialNip
      }));
      setSkData((prev) => ({
        ...prev,
        pejabatPenetap: 'REKTOR UNIVERSITAS SILIWANGI,',
        namaJabatan: 'REKTOR,',
        namaRektor: officialName,
        nipRektor: officialNip
      }));
      setSpData((prev) => ({
        ...prev,
        pejabatPemberi: 'REKTOR UNIVERSITAS SILIWANGI,',
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nip: officialNip
      }));
      setStLembarData((prev) => ({
        ...prev,
        kalimatPembuka: 'Rektor Universitas Siliwangi dengan ini menugaskan kepada pejabat/pegawai:',
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nipPejabat: officialNip
      }));
      setStKolomData((prev) => ({
        ...prev,
        kalimatPembuka:
          'Dalam rangka optimalisasi tata kelola universitas dan integrasi kearsipan digital, Rektor Universitas Siliwangi menugaskan kepada pegawai yang namanya tercantum di bawah ini:',
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nipPejabat: officialNip
      }));
      setNdData((prev) => ({
        ...prev,
        yth: 'Para Wakil Rektor, Dekan, Ketua Lembaga, dan Kepala Biro',
        dari: officialTitle,
        hal: 'Arahan Strategis Pelaksanaan Program Prioritas Universitas dan Kepatuhan JRA/SKKAAD',
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nip: officialNip
      }));
      setSdData((prev) => ({
        ...prev,
        hal: 'Penyampaian Kebijakan Pengelolaan Keuangan dan Tata Kelola Universitas Siliwangi',
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nip: officialNip,
        tembusanText: 'Direktur Jenderal Pendidikan Tinggi, Riset, dan Teknologi\nPara Wakil Rektor di lingkungan UNSIL'
      }));
      setUndanganLembarData((prev) => ({
        ...prev,
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nip: officialNip
      }));
      setMouData((prev) => ({
        ...prev,
        pihak1Nama: officialName,
        pihak1Jabatan: officialTitle,
        pihak1JabatanSingkat: officialTitle,
        pihak1Nip: officialNip
      }));
      setPksData((prev) => ({
        ...prev,
        pihak1Nama: officialName,
        pihak1Jabatan: officialTitle,
        pihak1Nip: officialNip
      }));
      setSkuaData((prev) => ({
        ...prev,
        pemberiNama: officialName,
        pemberiJabatan: officialTitle,
        pemberiNip: officialNip
      }));
      setBaData((prev) => ({
        ...prev,
        mengetahuiNama: officialName,
        mengetahuiJabatan: officialTitle,
        mengetahuiNip: officialNip
      }));
      setSketData((prev) => ({
        ...prev,
        pejabatNama: officialName,
        pejabatJabatan: officialTitle,
        pejabatNip: officialNip
      }));
      setSperData((prev) => ({
        ...prev,
        namaYangMenyatakan: officialName,
        nipYangMenyatakan: officialNip,
        jabatan: officialTitle
      }));
      setSpengData((prev) => ({
        ...prev,
        pengirimJabatan: signerTitle,
        pengirimNama: officialName,
        pengirimNip: officialNip
      }));
      setPengData((prev) => ({
        ...prev,
        jabatan: officialTitle,
        namaPejabat: officialName,
        nip: officialNip
      }));
      setNotulaData((prev) => ({
        ...prev,
        pemimpinRapat: `${officialName} (${officialTitle})`,
        jabatanPenandatangan: signerTitle,
        namaPenandatangan: officialName,
        nipPenandatangan: officialNip
      }));
      setLapData((prev) => ({
        ...prev,
        jabatanPembuat: signerTitle,
        namaPembuat: officialName,
        nipPembuat: officialNip
      }));
      setTsData((prev) => ({
        ...prev,
        kepada: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
        dari: officialTitle,
        jabatanPembuat: signerTitle,
        namaPembuat: officialName,
        nipPembuat: officialNip
      }));
      setDispRektorData((prev) => ({
        ...prev,
        namaRektor: officialName,
        nipRektor: officialNip
      }));
      setTteDocData((prev) => ({
        ...prev,
        namaJabatan: signerTitle,
        namaPejabat: officialName,
        nip: officialNip
      }));
      return;
    }

    // WAKIL REKTOR (WAREK_1 Akademik, WAREK_2 Keuangan & Umum, WAREK_3 Kemahasiswaan & Alumni) — 16 Template Resmi
    const bidangPerihalMap = {
      WAREK_1: {
        ndYth: 'Rektor Universitas Siliwangi',
        ndHal: 'Laporan Evaluasi Kurikulum, Penjaminan Mutu Akademik, dan Pelaksanaan PMB TA 2026/2027',
        sdHal: 'Koordinasi Penyusunan Rencana Strategis Akademik dan Pengembangan Program Studi (PR.00.02)',
        stTugas: 'melaksanakan Monitoring dan Evaluasi Kurikulum OBE serta Pengawasan Ujian Seleksi PMB (PP.00.04)',
        pengTentang: 'JADWAL PELAKSANAAN HER-REGISTRASI AKADEMIK, PENGISIAN KRS, DAN PERKULIAHAN SEMESTER GANJIL UNIVERSITAS SILIWANGI',
        lapTentang: 'LAPORAN PENYELENGGARAAN PENERIMAAN MAHASISWA BARU (PMB) DAN EVALUASI AKADEMIK UNIVERSITAS SILIWANGI',
        tsHal: 'Telaah Staf Penguatan Mutu Pembelajaran, Akreditasi Unggul Program Studi, dan Pengamanan Naskah Soal PMB (PP.00.04)'
      },
      WAREK_2: {
        ndYth: 'Rektor Universitas Siliwangi',
        ndHal: 'Laporan Realisasi Anggaran, Verifikasi SPJ Keuangan (KU.01.04), dan Usul Kenaikan Pangkat Pegawai (KP.04.03)',
        sdHal: 'Tindak Lanjut Rekonsiliasi Laporan Keuangan, Penatausahaan BMN, dan Administrasi Kepegawaian (KU.01.04)',
        stTugas: 'melaksanakan Rekonsiliasi Laporan Keuangan BLU, Penilaian Usul Kenaikan Pangkat (KP.04.03), dan Perjalanan Dinas (KR.01)',
        pengTentang: 'JADWAL PENGUSULAN KENAIKAN PANGKAT (KP.04.03), PENYAMPAIAN SPJ KEUANGAN (KU.01.04), DAN INVENTARISASI BMN UNIVERSITAS SILIWANGI',
        lapTentang: 'LAPORAN PERTANGGUNGJAWABAN KEUANGAN, PENGELOLAAN KEPEGAWAIAN, DAN TATA USAHA KEARSIPAN JRA/SKKAAD UNIVERSITAS SILIWANGI',
        tsHal: 'Telaah Staf Optimalisasi Penyerapan Anggaran, Penataan SDM Kepegawaian (KP.04.03), dan Efisiensi Perjalanan Dinas (KR.01)'
      },
      WAREK_3: {
        ndYth: 'Rektor Universitas Siliwangi',
        ndHal: 'Laporan Pembinaan Organisasi Kemahasiswaan (KM.01.00), Penyaluran Beasiswa, dan Jejaring Tracer Study Alumni',
        sdHal: 'Fasilitasi Kegiatan Kompetisi Mahasiswa Nasional, Beasiswa KIP-Kuliah, dan Kemitraan Ikatan Alumni (KM.02.00)',
        stTugas: 'mendampingi Kontingen Mahasiswa Universitas Siliwangi pada Pekan Ilmiah Mahasiswa Nasional (PIMNAS) dan Pembinaan Ormawa',
        pengTentang: 'PENDAFTARAN BEASISWA PRESTASI AKADEMIK & NON-AKADEMIK SERTA REGISTRASI KEGIATAN ORGANISASI KEMAHASISWAAN UNIVERSITAS SILIWANGI',
        lapTentang: 'LAPORAN CAPAIAN PRESTASI MAHASISWA, PENYALURAN BEASISWA, DAN PELACAKAN ALUMNI (TRACER STUDY) UNIVERSITAS SILIWANGI',
        tsHal: 'Telaah Staf Peningkatan Prestasi Kemahasiswaan Tingkat Nasional/Internasional dan Penguatan Peran Alumni'
      }
    };

    const bidangInfo = bidangPerihalMap[subRoleKey] || bidangPerihalMap.WAREK_1;

    setStLembarData((prev) => ({
      ...prev,
      kalimatPembuka: `a.n. Rektor Universitas Siliwangi, ${officialTitle} dengan ini menugaskan kepada pejabat/pegawai:`,
      untukTugas: bidangInfo.stTugas,
      namaJabatan: signerTitle,
      namaPejabat: officialName,
      nipPejabat: officialNip
    }));
    setStKolomData((prev) => ({
      ...prev,
      kalimatPembuka: `Dalam rangka pelaksanaan program kerja ${officialTitle}, dengan ini menugaskan kepada pegawai yang namanya tercantum di bawah ini:`,
      untukTugas: bidangInfo.stTugas,
      namaJabatan: signerTitle,
      namaPejabat: officialName,
      nipPejabat: officialNip
    }));
    setNdData((prev) => ({
      ...prev,
      yth: bidangInfo.ndYth,
      dari: officialTitle,
      hal: bidangInfo.ndHal,
      namaJabatan: signerTitle,
      namaPejabat: officialName,
      nip: officialNip
    }));
    setSdData((prev) => ({
      ...prev,
      hal: bidangInfo.sdHal,
      namaJabatan: signerTitle,
      namaPejabat: officialName,
      nip: officialNip,
      tembusanText: 'Rektor Universitas Siliwangi (sebagai laporan)\nKepala Biro terkait di lingkungan UNSIL'
    }));
    setMouData((prev) => ({
      ...prev,
      pihak1Nama: officialName,
      pihak1Jabatan: `${officialTitle} (Berdasarkan Pendelegasian Rektor)`,
      pihak1JabatanSingkat: officialTitle,
      pihak1Nip: officialNip
    }));
    setPksData((prev) => ({
      ...prev,
      pihak1Nama: officialName,
      pihak1Jabatan: officialTitle,
      pihak1Nip: officialNip
    }));
    setSkuaData((prev) => ({
      ...prev,
      pemberiNama: officialName,
      pemberiJabatan: officialTitle,
      pemberiNip: officialNip
    }));
    setBaData((prev) => ({
      ...prev,
      pihak1Nama: officialName,
      pihak1Jabatan: officialTitle,
      pihak1Nip: officialNip,
      mengetahuiNama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      mengetahuiJabatan: 'Rektor Universitas Siliwangi',
      mengetahuiNip: '196708161996031001'
    }));
    setSketData((prev) => ({
      ...prev,
      pejabatNama: officialName,
      pejabatJabatan: officialTitle,
      pejabatNip: officialNip
    }));
    setSperData((prev) => ({
      ...prev,
      namaYangMenyatakan: officialName,
      nipYangMenyatakan: officialNip,
      jabatan: officialTitle
    }));
    setSpengData((prev) => ({
      ...prev,
      pengirimJabatan: signerTitle,
      pengirimNama: officialName,
      pengirimNip: officialNip
    }));
    setPengData((prev) => ({
      ...prev,
      tentang: bidangInfo.pengTentang,
      jabatan: officialTitle,
      namaPejabat: officialName,
      nip: officialNip
    }));
    setNotulaData((prev) => ({
      ...prev,
      pemimpinRapat: `${officialName} (${officialTitle})`,
      jabatanPenandatangan: signerTitle,
      namaPenandatangan: officialName,
      nipPenandatangan: officialNip
    }));
    setLapData((prev) => ({
      ...prev,
      tentang: bidangInfo.lapTentang,
      jabatanPembuat: signerTitle,
      namaPembuat: officialName,
      nipPembuat: officialNip
    }));
    setTsData((prev) => ({
      ...prev,
      kepada: 'Rektor Universitas Siliwangi',
      dari: officialTitle,
      hal: bidangInfo.tsHal,
      jabatanPembuat: signerTitle,
      namaPembuat: officialName,
      nipPembuat: officialNip
    }));
    setTteDocData((prev) => ({
      ...prev,
      namaJabatan: signerTitle,
      namaPejabat: officialName,
      nip: officialNip
    }));
  }, [rektoratSopProfile]);

  // Sinkronisasi otomatis Identitas Penandatangan & Pembuat Konsep untuk Dosen Biasa (Tanpa Jabatan Struktural)
  // Sesuai Peraturan Rektor UNSIL No. 3 Tahun 2023:
  // - Kategori 1 (Mandiri & Kondisional: nd, lap, ts, sper, notula, ba) -> Ditandatangani Langsung oleh Dosen
  // - Kategori 2 (Konsep / Drafting: st_lembar, st_kolom, sd, sket, speng) -> Diajukan untuk Ditandatangani Pimpinan (Kajur / Dekan / Rektor)
  useEffect(() => {
    if (!isLecturerWithoutStructuralPosition || !currentUser) return;

    const dosenName = currentUser.nama_lengkap || currentUser.name || 'Dr. Aris Martono, S.T., M.Kom.';
    const dosenNip = currentUser.nip || '198805212015041002';
    const unitName = currentUser.unit_kerja_nama || 'Fakultas Teknik';
    const dosenJabatan = currentUser.roleLabel || `Dosen ${unitName}`;
    const dosenSignerTitle = `${dosenJabatan},`;

    const leaderJabatan = activeLecturerLeader?.jabatan || `Dekan ${unitName}`;
    const leaderSignerTitle = activeLecturerLeader?.signerTitle || `Dekan,`;
    const leaderName = activeLecturerLeader?.namaLengkap || 'Prof. Dr. Ir. H. Undang Syarief, M.P.';
    const leaderNip = activeLecturerLeader?.nip || '196504121990031002';
    const leaderPangkat = activeLecturerLeader?.pangkatGol || 'Pembina Utama Muda / IV/c';

    // 1. KATEGORI MANDIRI (Ditandatangani Langsung oleh Dosen)
    // 1a. Nota Dinas (Pasal 11)
    setNdData((prev) => ({
      ...prev,
      yth: `Ketua Jurusan / Koordinator Program Studi / Dekan ${unitName}`,
      dari: `${dosenName} (${dosenJabatan})`,
      hal: 'Usulan Kegiatan Akademik dan Laporan Singkat Pelaksanaan Perkuliahan Semester Berjalan',
      namaJabatan: dosenSignerTitle,
      namaPejabat: dosenName,
      nip: dosenNip
    }));

    // 1b. Laporan (Pasal 26)
    setLapData((prev) => ({
      ...prev,
      tentang: `PELAKSANAAN KEGIATAN PENGAJARAN, PENELITIAN, DAN PENGABDIAN KEPADA MASYARAKAT DOSEN ${unitName.toUpperCase()}`,
      jabatanPembuat: dosenSignerTitle,
      namaPembuat: dosenName,
      nipPembuat: dosenNip
    }));

    // 1c. Telaah Staf (Pasal 27)
    setTsData((prev) => ({
      ...prev,
      kepada: `Dekan ${unitName} melalui Ketua Jurusan`,
      dari: `${dosenName} (${dosenJabatan})`,
      hal: 'Telaah Akademik Evaluasi Kurikulum Berbasis OBE dan Peningkatan Mutu Pembelajaran Mahasiswa',
      jabatanPembuat: dosenSignerTitle,
      namaPembuat: dosenName,
      nipPembuat: dosenNip
    }));

    // 1d. Surat Pernyataan (Pasal 20)
    setSperData((prev) => ({
      ...prev,
      namaYangMenyatakan: dosenName,
      nipYangMenyatakan: dosenNip,
      pangkatGolongan: 'Penata / III/c',
      jabatan: `${dosenJabatan} pada ${unitName} Universitas Siliwangi`,
      isiPernyataan: `Dengan ini menyatakan dengan sesungguhnya bahwa seluruh karya ilmiah, pelaksanaan pengajaran, penelitian, dan pengabdian kepada masyarakat yang saya laporkan pada Semester Tahun Akademik ${currentYear}/${currentYear + 1} adalah benar hasil karya sendiri dan bebas dari unsur plagiarisme. Apabila di kemudian hari ditemukan ketidaksesuaian, saya bersedia mempertanggungjawabkannya sesuai ketentuan akademik yang berlaku.`
    }));

    // 1e. Template Kondisional — Notula (Pasal 25)
    setNotulaData((prev) => ({
      ...prev,
      namaRapat: `Rapat Koordinasi Kurikulum dan Evaluasi Akademik Jurusan pada ${unitName}`,
      pemimpinRapat: `${leaderName} (${leaderJabatan})`,
      notulis: `${dosenName} (Dosen Notulis Resmi Rapat)`,
      jabatanPenandatangan: 'Notulis / Dosen Pencatat Rapat,',
      namaPenandatangan: dosenName,
      nipPenandatangan: dosenNip
    }));

    // 1f. Template Kondisional — Berita Acara (Pasal 18)
    setBaData((prev) => ({
      ...prev,
      pihak1Nama: dosenName,
      pihak1Nip: dosenNip,
      pihak1Jabatan: `${dosenJabatan} (Pelaksana Kegiatan Kedinasan)`,
      mengetahuiNama: leaderName,
      mengetahuiJabatan: leaderJabatan,
      mengetahuiNip: leaderNip
    }));

    // 2. KATEGORI KONSEP / DRAFTING (Diajukan oleh Dosen untuk Ditandatangani Pimpinan: Kajur / Dekan / Rektor)
    // 2a. Surat Tugas Lembaran & Kolom (Pasal 9)
    setStLembarData((prev) => ({
      ...prev,
      kalimatPembuka: `${leaderJabatan} Universitas Siliwangi dengan ini menugaskan kepada Dosen:`,
      namaPegawai: dosenName,
      nip: dosenNip,
      pangkatGolongan: 'Penata, III/c',
      jabatan: dosenJabatan,
      untukTugas: 'sebagai Pemateri Seminar / Pelaksana Kegiatan Penelitian dan Pengabdian kepada Masyarakat (Tridharma Perguruan Tinggi)',
      namaJabatan: leaderSignerTitle,
      namaPejabat: leaderName,
      nipPejabat: leaderNip,
      tteVerified: false
    }));

    setStKolomData((prev) => ({
      ...prev,
      kalimatPembuka: `${leaderJabatan} Universitas Siliwangi dengan ini menugaskan kepada Tim Dosen yang namanya tercantum di bawah ini:`,
      untukTugas: 'melaksanakan Kegiatan Penelitian Kolaboratif dan Pengabdian kepada Masyarakat di Lingkungan Mitra',
      pesertaList: [
        {
          no: 1,
          nama: dosenName,
          nip: dosenNip,
          pangkatGolongan: 'Penata, III/c',
          jabatan: `${dosenJabatan} (Ketua Tim Pengusul)`
        },
        ...(prev.pesertaList.slice(1) || [])
      ],
      namaJabatan: leaderSignerTitle,
      namaPejabat: leaderName,
      nipPejabat: leaderNip,
      tteVerified: false
    }));

    // 2b. Surat Dinas (Pasal 12)
    setSdData((prev) => ({
      ...prev,
      hal: 'Permohonan Izin Observasi Penelitian, Kerja Sama Akademik, dan Kunjungan Ilmiah',
      namaJabatan: leaderSignerTitle,
      namaPejabat: leaderName,
      nip: leaderNip,
      tteVerified: false
    }));

    // 2c. Surat Keterangan (Pasal 19)
    setSketData((prev) => ({
      ...prev,
      pejabatNama: leaderName,
      pejabatNip: leaderNip,
      pejabatPangkatGol: leaderPangkat,
      pejabatJabatan: leaderJabatan,
      pegawaiNama: dosenName,
      pegawaiNip: dosenNip,
      pegawaiPangkatGol: 'Penata / III/c',
      pegawaiJabatan: `${dosenJabatan} pada ${unitName} Universitas Siliwangi`,
      isiKeterangan: `Bahwa yang bersangkutan adalah benar Dosen Tetap aktif pada ${unitName} Universitas Siliwangi yang saat ini melaksanakan Tridharma Perguruan Tinggi (Pengajaran, Penelitian, dan Pengabdian kepada Masyarakat) pada Semester Tahun Akademik ${currentYear}/${currentYear + 1}.`,
      tteVerified: false
    }));

    // 2d. Surat Pengantar (Pasal 21)
    setSpengData((prev) => ({
      ...prev,
      pengirimJabatan: leaderSignerTitle,
      pengirimNama: leaderName,
      pengirimNip: leaderNip,
      tteVerified: false
    }));
  }, [isLecturerWithoutStructuralPosition, currentUser, activeLecturerLeader, currentYear]);

  const handlePrint = () => {
    if (securityTriggerMeta.isPrintBlocked) {
      window.alert(
        `PEMBLOKIRAN OPSI CETAK UMUM AKTIF (${
          securityTriggerMeta.tingkatKeamanan === 'SR' ? 'SANGAT RAHASIA - SR' : 'RAHASIA - R'
        }):\n\nSesuai SK Rektor UNSIL Nomor 2803 Tahun 2023 (SKKAAD), dokumen berkategori Rahasia/Sangat Rahasia wajib menggunakan Amplop Rangkap Dua dan dibatasi hak akses cetaknya.\n\nUntuk mencetak dokumen ini, aktifkan centang "Otorisasi Cetak Khusus Pejabat Berwenang" pada Panel Pengamanan di bagian atas formulir.`
      );
      return;
    }

    const titleMap = {
      pos: `POS_${posData.nomorPos.replace(/\//g, '_')}`,
      se: `SE_${seData.nomorSurat.replace(/\//g, '_')}`,
      sk: `SK_Rektor_${skData.nomorSk.replace(/\//g, '_')}_Lampiran`,
      sp: `Surat_Perintah_${spData.nomorSurat.replace(/\//g, '_')}`,
      st_lembar: `Surat_Tugas_${stLembarData.nomorSurat.replace(/\//g, '_')}`,
      st_kolom: `Surat_Tugas_Kolom_${stKolomData.nomorSurat.replace(/\//g, '_')}`,
      nd: `Nota_Dinas_${ndData.nomorSurat.replace(/\//g, '_')}`,
      sd: `Surat_Dinas_${sdData.nomorSurat.replace(/\//g, '_')}`,
      undangan_lembar: `Surat_Undangan_${undanganLembarData.nomorSurat.replace(/\//g, '_')}`,
      undangan_kartu: `Undangan_Kartu_${undanganKartuData.namaAcara.split('\n')[0].replace(/[^a-zA-Z0-9]/g, '_')}`,
      mou: `Nota_Kesepahaman_${mouData.nomorPihak1.replace(/\//g, '_')}_${mouData.instansiPihak2.replace(/[^a-zA-Z0-9]/g, '_')}`,
      pks: `PKS_Dalam_Negeri_${pksData.nomorPihak1.replace(/\//g, '_')}_${pksData.instansiPihak2.replace(/[^a-zA-Z0-9]/g, '_')}`,
      skua: `Surat_Kuasa_${skuaData.nomorSurat.replace(/\//g, '_')}`,
      ba: `Berita_Acara_${baData.nomorSurat.replace(/\//g, '_')}`,
      sket: `Surat_Keterangan_${sketData.nomorSurat.replace(/\//g, '_')}`,
      sper: `Surat_Pernyataan_${sperData.nomorSurat.replace(/\//g, '_')}`,
      speng: `Surat_Pengantar_${spengData.nomorSurat.replace(/\//g, '_')}`,
      peng: `Pengumuman_${pengData.nomorSurat.replace(/\//g, '_')}`,
      notula: `Notula_${notulaData.namaRapat.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`,
      lap: `Laporan_${lapData.tentang.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`,
      ts: `Telaah_Staf_${tsData.tentang.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}`,
      disp_rektor: `Disposisi_Rektor_${dispRektorData.noAgenda.replace(/\//g, '_')}`,
      tte_doc: `Surat_Penggunaan_TTE_${tteDocData.nomorSurat.replace(/\//g, '_')}`
    };
    printDocument(
      'builder-printable-area',
      titleMap[selectedTemplate] || 'Naskah_Dinas_UNSIL',
      {
        paperSize: currentPaperInfo.code,
        templateId: selectedTemplate
      }
    );
  };

  const handleSaveToSiloka = () => {
    let finalLetterObject = null;

    if (selectedTemplate === 'pos') {
      finalLetterObject = {
        id: `POS-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: posData.nomorPos,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: posData.namaPos,
        kategori: 'Surat Keputusan',
        sifat: 'Biasa',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'OT',
        subKlasifikasi: 'OT.01.00',
        pengirim: posData.unitKerja,
        tujuan: 'Seluruh Unit Kerja di Lingkungan UNSIL',
        status: 'Disetujui',
        statusTimestamp: 'Diterbitkan & Siap Operasional',
        ringkasan: `Naskah Prosedur Operasional Standar (POS/SOP) resmi: ${posData.namaPos}`,
        lampiran: `${posData.nomorPos.replace(/\//g, '_')}.pdf (3.2 MB)`,
        tteVerified: true,
        isLockedPermanen: false,
        templateType: 'pos',
        templateData: currentPosRenderData
      };
    } else if (selectedTemplate === 'se') {
      finalLetterObject = {
        id: `SE-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: seData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: seData.tentang,
        kategori: 'Surat Edaran',
        sifat: 'Penting',
        kategoriKeamanan: 'Terbatas',
        kodeKlasifikasi: 'HM',
        subKlasifikasi: 'HM.01.00',
        pengirim: seData.namaJabatan,
        tujuan: 'Pimpinan Unit & Civitas Academica',
        status: 'Dikirim',
        statusTimestamp: 'Edaran Resmi Aktif',
        ringkasan: `Surat Edaran BKU UNSIL Nomor ${seData.nomorSurat}: ${seData.tentang}`,
        lampiran: `SE_${seData.nomorSurat.replace(/\//g, '_')}.pdf (1.8 MB)`,
        tteVerified: seData.tteVerified,
        isLockedPermanen: false,
        templateType: 'se',
        templateData: currentSeRenderData
      };
    } else if (selectedTemplate === 'sk') {
      finalLetterObject = {
        id: `SK-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: skData.nomorSk,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: skData.tentang,
        kategori: 'Surat Keputusan',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KP',
        subKlasifikasi: 'KP.02.00',
        pengirim: 'Rektor Universitas Siliwangi',
        tujuan: 'Pejabat dan Anggota Tim Terkait',
        status: 'Disetujui',
        statusTimestamp: 'Keputusan Rektor Ditetapkan',
        ringkasan: `Keputusan Rektor UNSIL tentang: ${skData.tentang}`,
        lampiran: `SK_Rektor_${skData.nomorSk.replace(/\//g, '_')}.pdf (4.5 MB)`,
        tteVerified: skData.tteVerified,
        isLockedPermanen: true,
        templateType: 'sk',
        templateData: currentSkRenderData
      };
    } else if (selectedTemplate === 'sp') {
      finalLetterObject = {
        id: `SP-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: spData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: 'Surat Perintah Pelaksanaan Tugas Kedinasan',
        kategori: 'Surat Tugas',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KP',
        subKlasifikasi: 'KP.08.00',
        pengirim: spData.pejabatPemberi,
        tujuan: spData.kepadaText.split('\n')[0] || 'Pegawai Terkait',
        status: 'Disetujui',
        statusTimestamp: 'Surat Perintah Diterbitkan',
        ringkasan: `Surat Perintah Rektor Universitas Siliwangi Nomor ${spData.nomorSurat}`,
        lampiran: `SP_${spData.nomorSurat.replace(/\//g, '_')}.pdf (1.9 MB)`,
        tteVerified: spData.tteVerified,
        isLockedPermanen: false,
        templateType: 'sp',
        templateData: currentSpRenderData
      };
    } else if (selectedTemplate === 'st_lembar') {
      finalLetterObject = {
        id: `ST-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: stLembarData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: stLembarData.untukTugas,
        kategori: 'Surat Tugas',
        sifat: 'Biasa',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KP',
        subKlasifikasi: 'KP.03.00',
        pengirim: stLembarData.namaJabatan,
        tujuan: stLembarData.nama,
        status: 'Disetujui',
        statusTimestamp: 'Surat Tugas Diterbitkan',
        ringkasan: `Surat Tugas Penugasan Pegawai: ${stLembarData.nama} - ${stLembarData.untukTugas}`,
        lampiran: `ST_${stLembarData.nomorSurat.replace(/\//g, '_')}.pdf (1.5 MB)`,
        tteVerified: stLembarData.tteVerified,
        isLockedPermanen: false,
        templateType: 'st_lembar',
        templateData: currentStLembarRenderData
      };
    } else if (selectedTemplate === 'st_kolom') {
      finalLetterObject = {
        id: `STK-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: stKolomData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: stKolomData.untukTugas,
        kategori: 'Surat Tugas',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KP',
        subKlasifikasi: 'KP.03.00',
        pengirim: stKolomData.namaJabatan,
        tujuan: `Tim Pelaksana Kegiatan (${stKolomData.pesertaList.length} Orang)`,
        status: 'Disetujui',
        statusTimestamp: 'Surat Tugas Kolektif Diterbitkan',
        ringkasan: `Surat Tugas Kolektif Bentuk Kolom: ${stKolomData.untukTugas}`,
        lampiran: `STK_${stKolomData.nomorSurat.replace(/\//g, '_')}.pdf (2.1 MB)`,
        tteVerified: stKolomData.tteVerified,
        isLockedPermanen: false,
        templateType: 'st_kolom',
        templateData: currentStKolomRenderData
      };
    } else if (selectedTemplate === 'nd') {
      finalLetterObject = {
        id: `ND-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: ndData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: ndData.hal,
        kategori: 'Nota Dinas',
        sifat: 'Biasa',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KU',
        subKlasifikasi: 'KU.01.00',
        pengirim: ndData.dari,
        tujuan: ndData.yth,
        status: 'Dikirim',
        statusTimestamp: 'Nota Dinas Terkirim ke Pimpinan',
        ringkasan: `Nota Dinas Internal: ${ndData.hal}`,
        lampiran: `ND_${ndData.nomorSurat.replace(/\//g, '_')}.pdf (1.2 MB)`,
        tteVerified: ndData.tteVerified,
        isLockedPermanen: false,
        templateType: 'nd',
        templateData: currentNdRenderData
      };
    } else if (selectedTemplate === 'sd') {
      finalLetterObject = {
        id: `SD-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: sdData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: sdData.hal,
        kategori: 'Surat Keluar',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'TU',
        subKlasifikasi: 'TU.00.01',
        pengirim: sdData.namaJabatan,
        tujuan: sdData.yth,
        status: 'Dikirim',
        statusTimestamp: 'Surat Dinas Diterbitkan',
        ringkasan: `Surat Dinas Resmi UNSIL: ${sdData.hal}`,
        lampiran: `SD_${sdData.nomorSurat.replace(/\//g, '_')}.pdf (1.4 MB)`,
        tteVerified: sdData.tteVerified,
        isLockedPermanen: false,
        templateType: 'sd',
        templateData: currentSdRenderData
      };
    } else if (selectedTemplate === 'undangan_lembar') {
      finalLetterObject = {
        id: `UND-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: undanganLembarData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: undanganLembarData.hal,
        kategori: 'Surat Undangan',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'TU',
        subKlasifikasi: 'TU.02.00',
        pengirim: undanganLembarData.namaJabatan,
        tujuan: undanganLembarData.yth,
        status: 'Dikirim',
        statusTimestamp: 'Surat Undangan Diterbitkan',
        ringkasan: `Surat Undangan Resmi: ${undanganLembarData.hal} (${undanganLembarData.hariTanggal})`,
        lampiran: `Undangan_${undanganLembarData.nomorSurat.replace(/\//g, '_')}.pdf (1.6 MB)`,
        tteVerified: undanganLembarData.tteVerified,
        isLockedPermanen: false,
        templateType: 'undangan_lembar',
        templateData: currentUndanganLembarRenderData
      };
    } else if (selectedTemplate === 'undangan_kartu') {
      finalLetterObject = {
        id: `UKR-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: `UKR/UN58/HM.01.00/${currentYear}/${Math.floor(100 + Math.random() * 900)}`,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: undanganKartuData.namaAcara.replace(/\n/g, ' '),
        kategori: 'Surat Undangan',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'HM',
        subKlasifikasi: 'HM.01.00',
        pengirim: undanganKartuData.pengundang,
        tujuan: 'Tamu Undangan Terhormat',
        status: 'Disetujui',
        statusTimestamp: 'Kartu Undangan Resmi Siap Didistribusikan',
        ringkasan: `Kartu Undangan Resmi Rektor UNSIL: ${undanganKartuData.namaAcara.replace(/\n/g, ' ')}`,
        lampiran: `Kartu_Undangan_${currentYear}.pdf (2.8 MB)`,
        tteVerified: true,
        isLockedPermanen: false,
        templateType: 'undangan_kartu',
        templateData: currentUndanganKartuRenderData
      };
    } else if (selectedTemplate === 'mou') {
      finalLetterObject = {
        id: `MOU-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: mouData.nomorPihak1,
        nomorSuratAsal: mouData.nomorPihak2,
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: mouData.tentang.replace(/\n/g, ' '),
        kategori: 'Nota Kesepahaman',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KS',
        subKlasifikasi: 'KS.01.00',
        pengirim: mouData.instansiPihak1,
        tujuan: mouData.instansiPihak2,
        status: 'Disetujui',
        statusTimestamp: 'Nota Kesepahaman (MoU) Sah Disepakati',
        ringkasan: `Nota Kesepahaman (MoU) antara ${mouData.instansiPihak1} dan ${mouData.instansiPihak2} tentang: ${mouData.tentang.replace(/\n/g, ' ')}`,
        lampiran: `MoU_${mouData.nomorPihak1.replace(/\//g, '_')}.pdf (3.5 MB)`,
        tteVerified: mouData.pihak1TteVerified,
        isLockedPermanen: true,
        templateType: 'mou',
        templateData: currentMouRenderData
      };
    } else if (selectedTemplate === 'pks') {
      finalLetterObject = {
        id: `PKS-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: pksData.nomorPihak1,
        nomorSuratAsal: pksData.nomorPihak2,
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: pksData.tentang.replace(/\n/g, ' '),
        kategori: 'Perjanjian Kerja Sama',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KS',
        subKlasifikasi: 'KS.01.00',
        pengirim: pksData.instansiPihak1,
        tujuan: pksData.instansiPihak2,
        status: 'Disetujui',
        statusTimestamp: 'Perjanjian Kerja Sama (PKS) Resmi Disepakati',
        ringkasan: `Perjanjian Kerja Sama Dalam Negeri antara ${pksData.instansiPihak1} dan ${pksData.instansiPihak2} tentang: ${pksData.tentang.replace(/\n/g, ' ')}`,
        lampiran: `PKS_${pksData.nomorPihak1.replace(/\//g, '_')}.pdf (3.8 MB)`,
        tteVerified: pksData.tteVerified,
        isLockedPermanen: true,
        templateType: 'pks',
        templateData: currentPksRenderData
      };
    } else if (selectedTemplate === 'skua') {
      finalLetterObject = {
        id: `SKUA-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: skuaData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Surat Kuasa: ${skuaData.untukKeperluan.slice(0, 80)}...`,
        kategori: 'Surat Kuasa',
        sifat: 'Penting',
        kategoriKeamanan: 'Terbatas',
        kodeKlasifikasi: 'KU',
        subKlasifikasi: 'KU.02.00',
        pengirim: skuaData.pemberiJabatan,
        tujuan: skuaData.penerimaNama,
        status: 'Disetujui',
        statusTimestamp: 'Surat Kuasa Resmi Diterbitkan',
        ringkasan: `Surat Kuasa dari ${skuaData.pemberiNama} kepada ${skuaData.penerimaNama}`,
        lampiran: `SKUA_${skuaData.nomorSurat.replace(/\//g, '_')}.pdf (1.2 MB)`,
        tteVerified: skuaData.tteVerified,
        isLockedPermanen: false,
        templateType: 'skua',
        templateData: currentSkuaRenderData
      };
    } else if (selectedTemplate === 'ba') {
      finalLetterObject = {
        id: `BA-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: baData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Berita Acara Pelaksanaan: ${baData.daftarKegiatan[0] || 'Kegiatan Operasional'}`,
        kategori: 'Berita Acara',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'BA',
        subKlasifikasi: 'BA.01.00',
        pengirim: baData.pihak1Nama,
        tujuan: baData.pihak2Nama,
        status: 'Disetujui',
        statusTimestamp: 'Berita Acara Resmi Ditandatangani',
        ringkasan: `Berita Acara antara ${baData.pihak1Nama} dan ${baData.pihak2Nama}`,
        lampiran: `BA_${baData.nomorSurat.replace(/\//g, '_')}.pdf (2.1 MB)`,
        tteVerified: baData.tteVerified,
        isLockedPermanen: true,
        templateType: 'ba',
        templateData: currentBaRenderData
      };
    } else if (selectedTemplate === 'sket') {
      finalLetterObject = {
        id: `SKET-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: sketData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Surat Keterangan atas nama ${sketData.pegawaiNama}`,
        kategori: 'Surat Keterangan',
        sifat: 'Biasa',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KM',
        subKlasifikasi: 'KM.04.00',
        pengirim: sketData.pejabatJabatan,
        tujuan: sketData.pegawaiNama,
        status: 'Disetujui',
        statusTimestamp: 'Surat Keterangan Resmi Diterbitkan',
        ringkasan: `Surat Keterangan resmi untuk ${sketData.pegawaiNama} (${sketData.pegawaiNip})`,
        lampiran: `SKET_${sketData.nomorSurat.replace(/\//g, '_')}.pdf (1.1 MB)`,
        tteVerified: sketData.tteVerified,
        isLockedPermanen: false,
        templateType: 'sket',
        templateData: currentSketRenderData
      };
    } else if (selectedTemplate === 'sper') {
      finalLetterObject = {
        id: `SPER-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: sperData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Surat Pernyataan: ${sperData.namaYangMenyatakan}`,
        kategori: 'Surat Pernyataan',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KP',
        subKlasifikasi: 'KP.04.00',
        pengirim: sperData.namaYangMenyatakan,
        tujuan: 'Universitas Siliwangi / Pihak Berkepentingan',
        status: 'Disetujui',
        statusTimestamp: 'Surat Pernyataan Resmi Diterbitkan',
        ringkasan: `Surat Pernyataan atas nama ${sperData.namaYangMenyatakan} (${sperData.jabatan})`,
        lampiran: `SPER_${sperData.nomorSurat.replace(/\//g, '_')}.pdf (1.3 MB)`,
        tteVerified: sperData.tteVerified,
        isLockedPermanen: false,
        templateType: 'sper',
        templateData: currentSperRenderData
      };
    } else if (selectedTemplate === 'speng') {
      finalLetterObject = {
        id: `SPENG-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: spengData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Surat Pengantar: Pengiriman ${spengData.items.length} Dokumen/Barang`,
        kategori: 'Surat Pengantar',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'TU',
        subKlasifikasi: 'TU.02.00',
        pengirim: spengData.pengirimJabatan.replace(/,$/, ''),
        tujuan: spengData.tujuan,
        status: 'Dikirim',
        statusTimestamp: 'Surat Pengantar Resmi Diterbitkan',
        ringkasan: `Surat Pengantar untuk ${spengData.tujuan} (${spengData.items.length} berkas/barang)`,
        lampiran: `SPENG_${spengData.nomorSurat.replace(/\//g, '_')}.pdf (1.5 MB)`,
        tteVerified: spengData.tteVerified,
        isLockedPermanen: false,
        templateType: 'speng',
        templateData: currentSpengRenderData
      };
    } else if (selectedTemplate === 'peng') {
      finalLetterObject = {
        id: `PENG-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: pengData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: pengData.tentang,
        kategori: 'Pengumuman',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'PK',
        subKlasifikasi: 'PK.01.00',
        pengirim: pengData.jabatan,
        tujuan: 'Seluruh Civitas Academica Universitas Siliwangi',
        status: 'Disetujui',
        statusTimestamp: 'Pengumuman Resmi Dipublikasikan',
        ringkasan: `Pengumuman Rektor Nomor ${pengData.nomorSurat}: ${pengData.tentang}`,
        lampiran: `PENG_${pengData.nomorSurat.replace(/\//g, '_')}.pdf (1.2 MB)`,
        tteVerified: pengData.tteVerified,
        isLockedPermanen: false,
        templateType: 'peng',
        templateData: currentPengRenderData
      };
    } else if (selectedTemplate === 'notula') {
      finalLetterObject = {
        id: `NOTULA-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: `NOTULA/UN58/${currentYear}/${Math.floor(100 + Math.random() * 900)}`,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Notula Rapat: ${notulaData.namaRapat}`,
        kategori: 'Notula',
        sifat: 'Biasa',
        kategoriKeamanan: 'Terbatas',
        kodeKlasifikasi: 'HM',
        subKlasifikasi: 'HM.02.00',
        pengirim: notulaData.pemimpinRapat,
        tujuan: 'Peserta Rapat & Arsip Rektorat',
        status: 'Disetujui',
        statusTimestamp: 'Notula Rapat Resmi Disahkan',
        ringkasan: `Notula ${notulaData.namaRapat} (${notulaData.hariTanggal})`,
        lampiran: `Notula_${currentYear}.pdf (1.9 MB)`,
        tteVerified: notulaData.tteVerified,
        isLockedPermanen: true,
        templateType: 'notula',
        templateData: currentNotulaRenderData
      };
    } else if (selectedTemplate === 'lap') {
      finalLetterObject = {
        id: `LAP-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: lapData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Laporan: ${lapData.tentang}`,
        kategori: 'Laporan',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'TI',
        subKlasifikasi: 'TI.01.00',
        pengirim: lapData.jabatanPembuat.replace(/,$/, ''),
        tujuan: 'Pimpinan Universitas Siliwangi',
        status: 'Disetujui',
        statusTimestamp: 'Laporan Kedinasan Resmi Disahkan',
        ringkasan: `Laporan Pelaksanaan tentang: ${lapData.tentang}`,
        lampiran: `LAP_${lapData.nomorSurat.replace(/\//g, '_')}.pdf (3.4 MB)`,
        tteVerified: lapData.tteVerified,
        isLockedPermanen: true,
        templateType: 'lap',
        templateData: currentLapRenderData
      };
    } else if (selectedTemplate === 'ts') {
      finalLetterObject = {
        id: `TS-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: `001/TS/UN58/KU.01/${currentYear}`,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Telaah Staf: ${tsData.tentang}`,
        kategori: 'Telaah Staf',
        sifat: 'Penting',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'KU',
        subKlasifikasi: 'KU.01.00',
        pengirim: tsData.dari,
        tujuan: tsData.kepada,
        status: 'Disetujui',
        statusTimestamp: 'Telaah Staf Resmi Disahkan',
        ringkasan: `Telaah Staf: ${tsData.tentang}`,
        lampiran: `TS_${currentYear}.pdf (1.7 MB)`,
        tteVerified: tsData.tteVerified,
        isLockedPermanen: false,
        templateType: 'ts',
        templateData: currentTsRenderData
      };
    } else if (selectedTemplate === 'disp_rektor') {
      finalLetterObject = {
        id: `DISP-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: dispRektorData.noAgenda,
        nomorSuratAsal: dispRektorData.nomorSurat,
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: `Disposisi Rektor: ${dispRektorData.hal}`,
        kategori: 'Disposisi',
        sifat: dispRektorData.klasifikasi,
        kategoriKeamanan:
          dispRektorData.klasifikasi === 'Sangat Rahasia' || dispRektorData.klasifikasi === 'Rahasia'
            ? 'Rahasia'
            : 'Terbuka',
        kodeKlasifikasi: 'HM',
        subKlasifikasi: 'HM.01.00',
        pengirim: 'Rektor Universitas Siliwangi',
        tujuan: 'Penerima Disposisi Rektor Terpilih',
        status: 'Disetujui',
        statusTimestamp: 'Disposisi Rektor Diterbitkan',
        ringkasan: `Lembar Disposisi Rektor nomor agenda ${dispRektorData.noAgenda} atas surat ${dispRektorData.nomorSurat} perihal ${dispRektorData.hal}`,
        lampiran: `Disposisi_Rektor_${dispRektorData.noAgenda.replace(/\//g, '_')}.pdf (2.1 MB)`,
        tteVerified: dispRektorData.tteVerified,
        isLockedPermanen: false,
        templateType: 'disposisi_rektor',
        templateData: currentDispRektorRenderData
      };
    } else if (selectedTemplate === 'tte_doc') {
      finalLetterObject = {
        id: `TTE-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
        nomorSurat: tteDocData.nomorSurat,
        nomorSuratAsal: '-',
        tanggal: new Date().toISOString().slice(0, 10),
        perihal: tteDocData.hal,
        kategori: 'Surat Dinas',
        sifat: 'Biasa',
        kategoriKeamanan: 'Biasa/Terbuka',
        kodeKlasifikasi: 'TU',
        subKlasifikasi: 'TU.00.00',
        pengirim: tteDocData.namaJabatan,
        tujuan: tteDocData.tujuanUtama,
        status: 'Disetujui',
        statusTimestamp: 'Naskah TTE Resmi Diterbitkan',
        ringkasan: `Surat Dinas Penggunaan TTE BSrE: ${tteDocData.hal}`,
        lampiran: `TTE_${tteDocData.nomorSurat.replace(/\//g, '_')}.pdf (1.5 MB)`,
        tteVerified: tteDocData.tteVerified,
        isLockedPermanen: false,
        templateType: 'tte_doc',
        templateData: currentTteDocRenderData
      };
    }

    if (finalLetterObject) {
      const isLecturerDraftForLeader =
        isLecturerWithoutStructuralPosition && currentLecturerSopMeta?.isDraftForLeader;
      const isLecturerDirectSign =
        isLecturerWithoutStructuralPosition && currentLecturerSopMeta?.isDirectLecturerSignature;

      const enrichedLetter = {
        ...finalLetterObject,
        nomorSurat: smartNumberingMeta.nomorSuratAkhir || finalLetterObject.nomorSurat,
        kodeKlasifikasi: (smartNumberingMeta.kodeKlasifikasi || finalLetterObject.kodeKlasifikasi || 'KP').split('.')[0],
        subKlasifikasi: smartNumberingMeta.kodeKlasifikasi || finalLetterObject.subKlasifikasi || 'KP.05.00',
        namaKlasifikasi: smartNumberingMeta.namaKlasifikasi || '',
        status: isLecturerDraftForLeader
          ? 'Diparaf'
          : isLecturerDirectSign
          ? 'Disetujui'
          : finalLetterObject.status,
        statusTimestamp: isLecturerDraftForLeader
          ? `Konsep Naskah Dosen — Diajukan Paraf Berjenjang untuk TTD ${activeLecturerLeader?.jabatan || 'Pimpinan'}`
          : isLecturerDirectSign
          ? `Ditandatangani Langsung oleh Dosen (${currentLecturerSopMeta?.pasal})`
          : finalLetterObject.statusTimestamp,
        tteVerified: isLecturerDraftForLeader
          ? false
          : isLecturerDirectSign
          ? true
          : finalLetterObject.tteVerified,
        lecturerSopMetadata: currentLecturerSopMeta || null,
        kategoriKeamanan:
          smartNumberingMeta.tingkatKeamanan === 'SR'
            ? 'Sangat Rahasia'
            : smartNumberingMeta.tingkatKeamanan === 'R'
            ? 'Rahasia'
            : finalLetterObject.kategoriKeamanan || 'Biasa/Terbuka',
        amplopRangkapDuaRequired: securityTriggerMeta.isRestrictedSecret,
        jraMetadata: smartNumberingMeta.jraMetadata || null,
        unit_kerja_id: finalLetterObject.unit_kerja_id || smartNumberingMeta.kodeUnit || currentUser?.unit_kerja_id || 'UN58.6',
        created_by_user_id: finalLetterObject.created_by_user_id || currentUser?.id || 'usr-02',
        created_at: finalLetterObject.created_at || new Date().toISOString(),
        distribusi: {
          unitPenerima: distribusiData.unitPenerima,
          masukSebagai: distribusiData.masukSebagai,
          tembusanUnit: distribusiData.tembusanUnit,
          sivitasAkademika: distribusiData.sivitasAkademika,
          poselLuar: distribusiData.umumPosel,
          dikirimFisik: distribusiData.jugaDikirimFisik
        }
      };
      onSaveLetter(enrichedLetter);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
        {/* Top Navbar Modal */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-950 text-white flex items-center justify-between border-b border-unsil-green-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow border border-unsil-gold-400/50 shrink-0 select-none protected-asset">
              <img
                src="/unsil-logo.png"
                alt="UNSIL"
                className="w-8 h-8 object-contain select-none pointer-events-none protected-asset"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">
                  Pembuat Naskah Dinas Resmi SILOKA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-unsil-gold-500 text-unsil-green-950">
                  Kemendikbudristek • UNSIL
                </span>
              </div>
              <p className="text-xs text-unsil-green-200/90 font-sans">
                {rektoratSopProfile
                  ? `Kewenangan ${rektoratSopProfile.officialTitle}: ${authorizedTemplatesList.length} Format Standar Naskah Dinas (${rektoratSopProfile.sopLegalReference})`
                  : isLecturerWithoutStructuralPosition
                  ? `Role Dosen Biasa (Tanpa Jabatan Struktural): 8 Template Utama + 2 Template Kondisional (2 Kategori Akses/Fungsi — Peraturan Rektor No. 3/2023)`
                  : isFacultyDrafter
                  ? `Format Standar Berdasarkan Tabel 1 Matriks Kewenangan (${authorizedTemplatesList.length} Format Naskah Dinas)`
                  : `${authorizedTemplatesList.length} Format Standar Tata Naskah Dinas Resmi Universitas Siliwangi`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher on Desktop */}
            <div className="hidden lg:flex items-center bg-unsil-green-950/80 p-1 rounded-lg border border-unsil-green-800/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1 rounded font-medium transition ${
                  viewMode === 'form' ? 'bg-unsil-green-800 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Formulir
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded font-medium transition ${
                  viewMode === 'split' ? 'bg-unsil-green-800 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded font-medium transition ${
                  viewMode === 'preview' ? 'bg-unsil-green-800 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Pratinjau ({currentPaperInfo.code})
              </button>
            </div>

            <button
              onClick={handlePrint}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                securityTriggerMeta.isPrintBlocked
                  ? 'bg-red-900/70 hover:bg-red-900 text-red-200 border-red-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={
                securityTriggerMeta.isPrintBlocked
                  ? 'Opsi Cetak Umum Diblokir untuk Naskah Rahasia/Sangat Rahasia (SKKAAD)'
                  : `Cetak Naskah Dinas Format Otomatis ${currentPaperInfo.code} (${currentPaperInfo.width} × ${currentPaperInfo.height})`
              }
            >
              <Printer className="w-3.5 h-3.5 text-unsil-gold-400" />
              <span>
                {securityTriggerMeta.isPrintBlocked
                  ? `Cetak Terkunci (${securityTriggerMeta.tingkatKeamanan})`
                  : `Cetak ${currentPaperInfo.code}`}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-unsil-green-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Split Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: FORM CONTROLS (Hidden if preview only) */}
          {(viewMode === 'form' || viewMode === 'split') && (
            <div
              className={`${
                viewMode === 'split' ? 'w-full lg:w-1/2' : 'w-full'
              } p-6 overflow-y-auto border-r border-slate-200 space-y-6 text-xs text-slate-700`}
            >
              {/* =============================================================
                  BAGIAN 1: PENGATURAN NASKAH (SESUAI GAMBAR 1)
                  ============================================================= */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-unsil-green-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  1. PENGATURAN NASKAH
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 block">
                    Jenis naskah <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium"
                    >
                      {jenisNaskahOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Jenis naskah yang hanya boleh ditandatangani Rektor (seperti Keputusan, Instruksi, dsb.) hanya tampil jika unit Anda adalah Rektor atau memiliki wewenang delegasi.
                  </p>
                </div>
              </div>

              {/* BANNER KHUSUS KATEGORI AKSES / FUNGSI DOSEN BIASA (TANPA JABATAN STRUKTURAL / TUGAS TAMBAHAN) */}
              {isLecturerWithoutStructuralPosition && currentLecturerSopMeta && (
                <div
                  className={`p-4 rounded-xl border shadow-sm space-y-2.5 ${
                    currentLecturerSopMeta.isDraftForLeader
                      ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
                      : currentLecturerSopMeta.isConditional
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                          currentLecturerSopMeta.isDraftForLeader
                            ? 'bg-indigo-600 text-white'
                            : currentLecturerSopMeta.isConditional
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {currentLecturerSopMeta.pasal} • {currentLecturerSopMeta.signerMechanism}
                      </span>
                      <span className="font-bold text-xs">
                        {currentLecturerSopMeta.categoryTitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                      Klasifikasi Baku: {currentLecturerSopMeta.defaultKlasifikasi}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90">
                    <strong>Fungsi SOP Dosen ({currentLecturerSopMeta.shortName}):</strong>{' '}
                    {currentLecturerSopMeta.description}
                  </p>

                  {currentLecturerSopMeta.isDraftForLeader ? (
                    <div className="pt-2 border-t border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-indigo-900">
                        Pejabat Penandatangan Tujuan (Alur Paraf Berjenjang):
                      </div>
                      <select
                        value={activeLecturerLeader?.id || ''}
                        onChange={(e) => setSelectedLecturerLeaderId(e.target.value)}
                        className="p-1.5 rounded-lg bg-white border border-indigo-300 text-xs font-semibold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                      >
                        {lecturerLeaderOptions.map((leader) => (
                          <option key={leader.id} value={leader.id}>
                            {leader.jabatan} — {leader.namaLengkap}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                      <span>
                        <strong>Penandatangan Langsung:</strong>{' '}
                        {currentUser?.nama_lengkap || currentUser?.name} (NIP.{' '}
                        {currentUser?.nip || '198805212015041002'})
                      </span>
                      <span className="font-bold text-emerald-800">
                        ✓ Wewenang TTD Mandiri Dosen
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL SISTEM PENOMORAN OTOMATIS & KLASIFIKASI JRA/SKKAAD (PENCEGAH HUMAN ERROR) */}
              <SmartKlasifikasiNumberingPanel
                templateKey={selectedTemplate}
                templateLabel={
                  DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ||
                  'Naskah Dinas Resmi UNSIL'
                }
                currentUser={currentUser}
                initialSequenceNumber={83}
                onNumberChange={setSmartNumberingMeta}
                onSecurityTriggerChange={setSecurityTriggerMeta}
              />

              {/* TEMPLATE 1: POS FORM CONTROLS */}
              {selectedTemplate === 'pos' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Formulir Prosedur Operasional Standar (POS / SOP)
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Sesuai Peraturan MenPAN-RB dan Keputusan Rektor UNSIL. Bagian a (Identitas) dan Bagian b (Matriks Diagram Alir).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Nomor POS</label>
                      <input
                        type="text"
                        value={posData.nomorPos}
                        onChange={(e) => setPosData({ ...posData, nomorPos: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Unit Kerja Pemilik</label>
                      <input
                        type="text"
                        value={posData.unitKerja}
                        onChange={(e) => setPosData({ ...posData, unitKerja: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Tgl Pembuatan</label>
                      <input
                        type="text"
                        value={posData.tglPembuatan}
                        onChange={(e) => setPosData({ ...posData, tglPembuatan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tgl Revisi</label>
                      <input
                        type="text"
                        value={posData.tglRevisi}
                        onChange={(e) => setPosData({ ...posData, tglRevisi: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tgl Efektif</label>
                      <input
                        type="text"
                        value={posData.tglEfektif}
                        onChange={(e) => setPosData({ ...posData, tglEfektif: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nama POS (Judul Standar)</label>
                    <input
                      type="text"
                      value={posData.namaPos}
                      onChange={(e) => setPosData({ ...posData, namaPos: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* Pejabat Pengesah */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block">
                      Pejabat Yang Mengesahkan:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Jabatan</label>
                        <input
                          type="text"
                          value={posData.disahkanOlehJabatan}
                          onChange={(e) => setPosData({ ...posData, disahkanOlehJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Nama Pejabat</label>
                        <input
                          type="text"
                          value={posData.disahkanOlehNama}
                          onChange={(e) => setPosData({ ...posData, disahkanOlehNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">NIP</label>
                        <input
                          type="text"
                          value={posData.disahkanOlehNip}
                          onChange={(e) => setPosData({ ...posData, disahkanOlehNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian Identitas 4 Kolom */}
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold block mb-1">Dasar Hukum (1 butir per baris):</label>
                      <textarea
                        rows={3}
                        value={posData.dasarHukumText}
                        onChange={(e) => setPosData({ ...posData, dasarHukumText: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Kualifikasi Pelaksana:</label>
                      <textarea
                        rows={2}
                        value={posData.kualifikasiText}
                        onChange={(e) => setPosData({ ...posData, kualifikasiText: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold block mb-1">Keterkaitan POS:</label>
                        <textarea
                          rows={2}
                          value={posData.keterkaitanText}
                          onChange={(e) => setPosData({ ...posData, keterkaitanText: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Peralatan / Perlengkapan:</label>
                        <textarea
                          rows={2}
                          value={posData.peralatanText}
                          onChange={(e) => setPosData({ ...posData, peralatanText: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold block mb-1">Peringatan:</label>
                        <textarea
                          rows={2}
                          value={posData.peringatanText}
                          onChange={(e) => setPosData({ ...posData, peringatanText: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Pencatatan dan Pendaftaran:</label>
                        <textarea
                          rows={2}
                          value={posData.pencatatan}
                          onChange={(e) => setPosData({ ...posData, pencatatan: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flowchart Steps Editor */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase text-slate-800">
                        b. Langkah Diagram Alir (Flowchart)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddFlowchartStep}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-unsil-green-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Langkah
                      </button>
                    </div>

                    <div className="space-y-2">
                      {posData.flowchartSteps.map((step, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-unsil-green-900">
                              Langkah #{idx + 1}
                            </span>
                            {posData.flowchartSteps.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFlowchartStep(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                                title="Hapus langkah"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5">Uraian Kegiatan</label>
                            <input
                              type="text"
                              value={step.kegiatan}
                              onChange={(e) => {
                                const newSteps = [...posData.flowchartSteps];
                                newSteps[idx].kegiatan = e.target.value;
                                setPosData({ ...posData, flowchartSteps: newSteps });
                              }}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">Kelengkapan</label>
                              <input
                                type="text"
                                value={step.kelengkapan}
                                onChange={(e) => {
                                  const newSteps = [...posData.flowchartSteps];
                                  newSteps[idx].kelengkapan = e.target.value;
                                  setPosData({ ...posData, flowchartSteps: newSteps });
                                }}
                                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">Waktu</label>
                              <input
                                type="text"
                                value={step.waktu}
                                onChange={(e) => {
                                  const newSteps = [...posData.flowchartSteps];
                                  newSteps[idx].waktu = e.target.value;
                                  setPosData({ ...posData, flowchartSteps: newSteps });
                                }}
                                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">Output</label>
                              <input
                                type="text"
                                value={step.output}
                                onChange={(e) => {
                                  const newSteps = [...posData.flowchartSteps];
                                  newSteps[idx].output = e.target.value;
                                  setPosData({ ...posData, flowchartSteps: newSteps });
                                }}
                                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: SURAT EDARAN (SE) FORM CONTROLS */}
              {selectedTemplate === 'se' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Formulir Surat Edaran Resmi Universitas Siliwangi
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Lengkap dengan Kop Surat Resmi Kemendikbudristek & UNSIL, Daftar Yth, Dasar Hukum, dan Otorisasi TTE BSrE.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Nomor Surat Edaran</label>
                      <input
                        type="text"
                        value={seData.nomorSurat}
                        onChange={(e) => setSeData({ ...seData, nomorSurat: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tahun</label>
                      <input
                        type="number"
                        value={seData.tahun}
                        onChange={(e) => setSeData({ ...seData, tahun: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Tentang (Perihal Surat Edaran)</label>
                    <textarea
                      rows={2}
                      value={seData.tentang}
                      onChange={(e) => setSeData({ ...seData, tentang: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Daftar Tujuan (Yth. - 1 baris per tujuan):</label>
                    <textarea
                      rows={4}
                      value={seData.tujuanText}
                      onChange={(e) => setSeData({ ...seData, tujuanText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Dasar Hukum Pembuatan Surat Edaran:</label>
                    <textarea
                      rows={3}
                      value={seData.dasarHukum}
                      onChange={(e) => setSeData({ ...seData, dasarHukum: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Isi Surat Edaran (Paragraf/Poin instruksi):</label>
                    <textarea
                      rows={5}
                      value={seData.isiText}
                      onChange={(e) => setSeData({ ...seData, isiText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block">
                      Penandatanganan & Otorisasi:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Tempat & Tanggal</label>
                        <input
                          type="text"
                          value={seData.tempatTanggal}
                          onChange={(e) => setSeData({ ...seData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Nama Jabatan</label>
                        <input
                          type="text"
                          value={seData.namaJabatan}
                          onChange={(e) => setSeData({ ...seData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Nama Pejabat</label>
                        <input
                          type="text"
                          value={seData.namaPejabat}
                          onChange={(e) => setSeData({ ...seData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">NIP</label>
                        <input
                          type="text"
                          value={seData.nip}
                          onChange={(e) => setSeData({ ...seData, nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: SURAT KEPUTUSAN (SK) FORM CONTROLS */}
              {selectedTemplate === 'sk' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Formulir Keputusan Rektor Universitas Siliwangi & Lampiran
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Format formal SK Rektor UNSIL lengkap dengan konsideran Menimbang, Mengingat, Diktum Putusan, dan Matriks Lampiran.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Nomor Keputusan</label>
                      <input
                        type="text"
                        value={skData.nomorSk}
                        onChange={(e) => setSkData({ ...skData, nomorSk: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tahun</label>
                      <input
                        type="number"
                        value={skData.tahun}
                        onChange={(e) => setSkData({ ...skData, tahun: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Tentang (Judul Keputusan Rektor)</label>
                    <textarea
                      rows={2}
                      value={skData.tentang}
                      onChange={(e) => setSkData({ ...skData, tentang: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Konsideran Menimbang (Poin a, b, c - pisahkan baris):</label>
                    <textarea
                      rows={3}
                      value={skData.menimbangText}
                      onChange={(e) => setSkData({ ...skData, menimbangText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Dasar Hukum Mengingat (Poin 1, 2, 3 - pisahkan baris):</label>
                    <textarea
                      rows={3}
                      value={skData.mengingatText}
                      onChange={(e) => setSkData({ ...skData, mengingatText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Menetapkan (Diktum Utama):</label>
                    <input
                      type="text"
                      value={skData.menetapkan}
                      onChange={(e) => setSkData({ ...skData, menetapkan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase"
                    />
                  </div>

                  {/* Diktum Editor */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-slate-800">
                        Klausul Diktum Putusan:
                      </span>
                      <button
                        type="button"
                        onClick={handleAddDiktum}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-unsil-green-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Diktum
                      </button>
                    </div>

                    {skData.diktum.map((d, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                        <input
                          type="text"
                          value={d.poin}
                          onChange={(e) => {
                            const newD = [...skData.diktum];
                            newD[idx].poin = e.target.value;
                            setSkData({ ...skData, diktum: newD });
                          }}
                          className="w-24 p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-xs shrink-0"
                        />
                        <textarea
                          rows={2}
                          value={d.teks}
                          onChange={(e) => {
                            const newD = [...skData.diktum];
                            newD[idx].teks = e.target.value;
                            setSkData({ ...skData, diktum: newD });
                          }}
                          className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                        />
                        {skData.diktum.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDiktum(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Lampiran Editor */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                        <input
                          type="checkbox"
                          checked={skData.hasLampiran}
                          onChange={(e) => setSkData({ ...skData, hasLampiran: e.target.checked })}
                          className="w-4 h-4 rounded text-unsil-green-800 focus:ring-unsil-green-700"
                        />
                        <span>Sertakan Lembar Lampiran Keputusan Rektor</span>
                      </label>

                      {skData.hasLampiran && (
                        <button
                          type="button"
                          onClick={handleAddLampiranRow}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-unsil-green-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Baris
                        </button>
                      )}
                    </div>

                    {skData.hasLampiran && (
                      <div className="space-y-2">
                        {skData.lampiranRows.map((row, idx) => (
                          <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-unsil-green-900">
                                Anggota / Baris #{idx + 1}
                              </span>
                              {skData.lampiranRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLampiranRow(idx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500 block">Nama</label>
                                <input
                                  type="text"
                                  value={row.nama}
                                  onChange={(e) => {
                                    const newRows = [...skData.lampiranRows];
                                    newRows[idx].nama = e.target.value;
                                    setSkData({ ...skData, lampiranRows: newRows });
                                  }}
                                  className="w-full p-1 bg-slate-50 border border-slate-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block">NIP</label>
                                <input
                                  type="text"
                                  value={row.nip}
                                  onChange={(e) => {
                                    const newRows = [...skData.lampiranRows];
                                    newRows[idx].nip = e.target.value;
                                    setSkData({ ...skData, lampiranRows: newRows });
                                  }}
                                  className="w-full p-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block">Jabatan</label>
                                <input
                                  type="text"
                                  value={row.jabatan}
                                  onChange={(e) => {
                                    const newRows = [...skData.lampiranRows];
                                    newRows[idx].jabatan = e.target.value;
                                    setSkData({ ...skData, lampiranRows: newRows });
                                  }}
                                  className="w-full p-1 bg-slate-50 border border-slate-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block">Peran Tim</label>
                                <input
                                  type="text"
                                  value={row.peranTim}
                                  onChange={(e) => {
                                    const newRows = [...skData.lampiranRows];
                                    newRows[idx].peranTim = e.target.value;
                                    setSkData({ ...skData, lampiranRows: newRows });
                                  }}
                                  className="w-full p-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-unsil-green-900"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TEMPLATE 4: SURAT PERINTAH (SP) */}
              {selectedTemplate === 'sp' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-unsil-green-50/70 border border-unsil-green-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Format Surat Perintah (SP)
                    </p>
                    <p className="text-[11px] text-unsil-green-800">
                      Sesuai Tata Naskah Dinas: Pejabat Pemberi, Konsideran (Menimbang &amp; Dasar), Memberi Perintah Kepada (...), Untuk (...), Tanggal &amp; Pengesahan TTE BSrE.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Nomor Surat Perintah</label>
                      <input
                        type="text"
                        value={spData.nomorSurat}
                        onChange={(e) => setSpData({ ...spData, nomorSurat: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Pejabat Pemberi Perintah</label>
                      <input
                        type="text"
                        value={spData.pejabatPemberi}
                        onChange={(e) => setSpData({ ...spData, pejabatPemberi: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Konsideran Menimbang (Tulis 1 butir per baris, otomatis huruf a, b, c...)
                    </label>
                    <textarea
                      rows={3}
                      value={spData.menimbangText}
                      onChange={(e) => setSpData({ ...spData, menimbangText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Dasar Hukum Perintah (Tulis 1 per baris, otomatis nomor 1, 2, 3...)
                    </label>
                    <textarea
                      rows={3}
                      value={spData.dasarText}
                      onChange={(e) => setSpData({ ...spData, dasarText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Diberikan Kepada (Nama / NIP / Jabatan penerima perintah)
                    </label>
                    <textarea
                      rows={2}
                      value={spData.kepadaText}
                      onChange={(e) => setSpData({ ...spData, kepadaText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Untuk (Rincian Perintah Tugas, 1 butir per baris)
                    </label>
                    <textarea
                      rows={4}
                      value={spData.untukText}
                      onChange={(e) => setSpData({ ...spData, untukText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Penetapan &amp; Pengesahan Pejabat</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat &amp; Tanggal</label>
                        <input
                          type="text"
                          value={spData.tempatTanggal}
                          onChange={(e) => setSpData({ ...spData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={spData.namaJabatan}
                          onChange={(e) => setSpData({ ...spData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={spData.namaPejabat}
                          onChange={(e) => setSpData({ ...spData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP Pejabat</label>
                        <input
                          type="text"
                          value={spData.nip}
                          onChange={(e) => setSpData({ ...spData, nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-sp"
                        checked={spData.tteVerified}
                        onChange={(e) => setSpData({ ...spData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-sp" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE BSSN Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 5: SURAT TUGAS LEMBARAN (ST-LEMBAR) */}
              {selectedTemplate === 'st_lembar' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-unsil-green-50/70 border border-unsil-green-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Format Surat Tugas - Bentuk Lembaran
                    </p>
                    <p className="text-[11px] text-unsil-green-800">
                      Sesuai Gambar 2: Penugasan perorangan dengan format lembaran berisikan identitas lengkap pegawai dan klausul penutup resmi.
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nomor Surat Tugas</label>
                    <input
                      type="text"
                      value={stLembarData.nomorSurat}
                      onChange={(e) => setStLembarData({ ...stLembarData, nomorSurat: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Pembuka</label>
                    <input
                      type="text"
                      value={stLembarData.kalimatPembuka}
                      onChange={(e) => setStLembarData({ ...stLembarData, kalimatPembuka: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-800 text-xs">Identitas Pegawai Yang Ditugaskan</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Nama Lengkap &amp; Gelar</label>
                      <input
                        type="text"
                        value={stLembarData.nama}
                        onChange={(e) => setStLembarData({ ...stLembarData, nama: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={stLembarData.nip}
                          onChange={(e) => setStLembarData({ ...stLembarData, nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pangkat dan Golongan</label>
                        <input
                          type="text"
                          value={stLembarData.pangkatGolongan}
                          onChange={(e) => setStLembarData({ ...stLembarData, pangkatGolongan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Jabatan</label>
                      <input
                        type="text"
                        value={stLembarData.jabatan}
                        onChange={(e) => setStLembarData({ ...stLembarData, jabatan: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Untuk Tugas</label>
                    <textarea
                      rows={2}
                      value={stLembarData.untukTugas}
                      onChange={(e) => setStLembarData({ ...stLembarData, untukTugas: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Tanggal Pelaksanaan</label>
                      <input
                        type="text"
                        value={stLembarData.tanggalKegiatan}
                        onChange={(e) => setStLembarData({ ...stLembarData, tanggalKegiatan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tempat Kegiatan</label>
                      <input
                        type="text"
                        value={stLembarData.tempatKegiatan}
                        onChange={(e) => setStLembarData({ ...stLembarData, tempatKegiatan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Penutup Baku</label>
                    <textarea
                      rows={2}
                      value={stLembarData.kalimatPenutup}
                      onChange={(e) => setStLembarData({ ...stLembarData, kalimatPenutup: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Pengesahan Pejabat</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat &amp; Tanggal</label>
                        <input
                          type="text"
                          value={stLembarData.tempatTanggal}
                          onChange={(e) => setStLembarData({ ...stLembarData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={stLembarData.namaJabatan}
                          onChange={(e) => setStLembarData({ ...stLembarData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={stLembarData.namaPejabat}
                          onChange={(e) => setStLembarData({ ...stLembarData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP Pejabat</label>
                        <input
                          type="text"
                          value={stLembarData.nipPejabat}
                          onChange={(e) => setStLembarData({ ...stLembarData, nipPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-st-lembar"
                        checked={stLembarData.tteVerified}
                        onChange={(e) => setStLembarData({ ...stLembarData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-st-lembar" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 6: SURAT TUGAS KOLOM (ST-KOLOM) */}
              {selectedTemplate === 'st_kolom' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-unsil-green-50/70 border border-unsil-green-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Format Surat Tugas - Bentuk Kolom (Kolektif)
                    </p>
                    <p className="text-[11px] text-unsil-green-800">
                      Sesuai Gambar 3: Penugasan kolektif dengan tabel matriks kolom bergaris tegas (No, Nama/NIP/Pangkat, Jabatan).
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nomor Surat Tugas</label>
                    <input
                      type="text"
                      value={stKolomData.nomorSurat}
                      onChange={(e) => setStKolomData({ ...stKolomData, nomorSurat: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Pembuka</label>
                    <textarea
                      rows={2}
                      value={stKolomData.kalimatPembuka}
                      onChange={(e) => setStKolomData({ ...stKolomData, kalimatPembuka: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  {/* Matriks Kolom Personel Dinamis */}
                  <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-xs">
                        Daftar Personel / Peserta Tugas ({stKolomData.pesertaList.length} Orang)
                      </p>
                      <button
                        type="button"
                        onClick={handleAddPesertaKolom}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-unsil-green-800 text-white text-[11px] font-semibold hover:bg-unsil-green-900 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Personel
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {stKolomData.pesertaList.map((p, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-slate-700">Personel #{idx + 1}</span>
                            {stKolomData.pesertaList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePesertaKolom(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1 text-[11px] flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Nama Lengkap &amp; Gelar</label>
                              <input
                                type="text"
                                value={p.nama}
                                onChange={(e) => {
                                  const updated = [...stKolomData.pesertaList];
                                  updated[idx].nama = e.target.value;
                                  setStKolomData({ ...stKolomData, pesertaList: updated });
                                }}
                                className="w-full p-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">NIP</label>
                              <input
                                type="text"
                                value={p.nip}
                                onChange={(e) => {
                                  const updated = [...stKolomData.pesertaList];
                                  updated[idx].nip = e.target.value;
                                  setStKolomData({ ...stKolomData, pesertaList: updated });
                                }}
                                className="w-full p-1 bg-white border border-slate-300 rounded text-xs font-mono"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Pangkat dan Golongan</label>
                              <input
                                type="text"
                                value={p.pangkatGolongan}
                                onChange={(e) => {
                                  const updated = [...stKolomData.pesertaList];
                                  updated[idx].pangkatGolongan = e.target.value;
                                  setStKolomData({ ...stKolomData, pesertaList: updated });
                                }}
                                className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Jabatan</label>
                              <input
                                type="text"
                                value={p.jabatan}
                                onChange={(e) => {
                                  const updated = [...stKolomData.pesertaList];
                                  updated[idx].jabatan = e.target.value;
                                  setStKolomData({ ...stKolomData, pesertaList: updated });
                                }}
                                className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Untuk Tugas</label>
                    <textarea
                      rows={2}
                      value={stKolomData.untukTugas}
                      onChange={(e) => setStKolomData({ ...stKolomData, untukTugas: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Tanggal Pelaksanaan</label>
                      <input
                        type="text"
                        value={stKolomData.tanggalKegiatan}
                        onChange={(e) => setStKolomData({ ...stKolomData, tanggalKegiatan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tempat Kegiatan</label>
                      <input
                        type="text"
                        value={stKolomData.tempatKegiatan}
                        onChange={(e) => setStKolomData({ ...stKolomData, tempatKegiatan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Penutup Baku</label>
                    <textarea
                      rows={2}
                      value={stKolomData.kalimatPenutup}
                      onChange={(e) => setStKolomData({ ...stKolomData, kalimatPenutup: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Pengesahan Pejabat</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat &amp; Tanggal</label>
                        <input
                          type="text"
                          value={stKolomData.tempatTanggal}
                          onChange={(e) => setStKolomData({ ...stKolomData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={stKolomData.namaJabatan}
                          onChange={(e) => setStKolomData({ ...stKolomData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={stKolomData.namaPejabat}
                          onChange={(e) => setStKolomData({ ...stKolomData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP Pejabat</label>
                        <input
                          type="text"
                          value={stKolomData.nipPejabat}
                          onChange={(e) => setStKolomData({ ...stKolomData, nipPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-st-kolom"
                        checked={stKolomData.tteVerified}
                        onChange={(e) => setStKolomData({ ...stKolomData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-st-kolom" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 7: NOTA DINAS (ND) */}
              {selectedTemplate === 'nd' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-unsil-green-50/70 border border-unsil-green-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Format Nota Dinas (ND)
                    </p>
                    <p className="text-[11px] text-unsil-green-800">
                      Sesuai Gambar 4: Naskah dinas internal dengan header Yth, Dari, Hal, dan Tembusan di kiri bawah.
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nomor Nota Dinas</label>
                    <input
                      type="text"
                      value={ndData.nomorSurat}
                      onChange={(e) => setNdData({ ...ndData, nomorSurat: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Yth. (Penerima Memo)</label>
                      <input
                        type="text"
                        value={ndData.yth}
                        onChange={(e) => setNdData({ ...ndData, yth: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Dari (Pengirim Memo)</label>
                      <input
                        type="text"
                        value={ndData.dari}
                        onChange={(e) => setNdData({ ...ndData, dari: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Hal (Perihal)</label>
                      <input
                        type="text"
                        value={ndData.hal}
                        onChange={(e) => setNdData({ ...ndData, hal: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Pembuka</label>
                    <textarea
                      rows={2}
                      value={ndData.kalimatPembuka}
                      onChange={(e) => setNdData({ ...ndData, kalimatPembuka: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Isi Pokok / Butir Substansi (Tulis 1 butir per baris)
                    </label>
                    <textarea
                      rows={4}
                      value={ndData.isiPokokText}
                      onChange={(e) => setNdData({ ...ndData, isiPokokText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Penutup</label>
                    <textarea
                      rows={2}
                      value={ndData.kalimatPenutup}
                      onChange={(e) => setNdData({ ...ndData, kalimatPenutup: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Tembusan (Tulis 1 tembusan per baris)
                    </label>
                    <textarea
                      rows={2}
                      value={ndData.tembusanText}
                      onChange={(e) => setNdData({ ...ndData, tembusanText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Penandatangan Nota Dinas</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat &amp; Tanggal</label>
                        <input
                          type="text"
                          value={ndData.tempatTanggal}
                          onChange={(e) => setNdData({ ...ndData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={ndData.namaJabatan}
                          onChange={(e) => setNdData({ ...ndData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={ndData.namaPejabat}
                          onChange={(e) => setNdData({ ...ndData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={ndData.nip}
                          onChange={(e) => setNdData({ ...ndData, nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-nd"
                        checked={ndData.tteVerified}
                        onChange={(e) => setNdData({ ...ndData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-nd" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 8: SURAT DINAS (SD) */}
              {selectedTemplate === 'sd' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-unsil-green-50/70 border border-unsil-green-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Format Surat Dinas Resmi (SD)
                    </p>
                    <p className="text-[11px] text-unsil-green-800">
                      Sesuai Gambar 5: Surat resmi dengan Nomor, Lampiran, Hal sejajar Tempat &amp; Tanggal di kanan, Yth &amp; Alamat tujuan, serta Tembusan.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Nomor Surat</label>
                      <input
                        type="text"
                        value={sdData.nomorSurat}
                        onChange={(e) => setSdData({ ...sdData, nomorSurat: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Lampiran</label>
                      <input
                        type="text"
                        value={sdData.lampiran}
                        onChange={(e) => setSdData({ ...sdData, lampiran: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Hal / Perihal</label>
                      <input
                        type="text"
                        value={sdData.hal}
                        onChange={(e) => setSdData({ ...sdData, hal: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tempat &amp; Tanggal (Kanan Atas)</label>
                      <input
                        type="text"
                        value={sdData.tempatTanggal}
                        onChange={(e) => setSdData({ ...sdData, tempatTanggal: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Yth. (Penerima Surat)</label>
                      <input
                        type="text"
                        value={sdData.yth}
                        onChange={(e) => setSdData({ ...sdData, yth: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Alamat Tujuan / Tempat</label>
                      <input
                        type="text"
                        value={sdData.alamatTujuan}
                        onChange={(e) => setSdData({ ...sdData, alamatTujuan: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Pembuka</label>
                    <textarea
                      rows={2}
                      value={sdData.kalimatPembuka}
                      onChange={(e) => setSdData({ ...sdData, kalimatPembuka: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Isi Surat / Rincian Acara / Ketentuan (Tulis 1 per baris)
                    </label>
                    <textarea
                      rows={4}
                      value={sdData.isiSuratText}
                      onChange={(e) => setSdData({ ...sdData, isiSuratText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Penutup</label>
                    <textarea
                      rows={2}
                      value={sdData.kalimatPenutup}
                      onChange={(e) => setSdData({ ...sdData, kalimatPenutup: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Tembusan (Tulis 1 tembusan per baris)
                    </label>
                    <textarea
                      rows={2}
                      value={sdData.tembusanText}
                      onChange={(e) => setSdData({ ...sdData, tembusanText: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Penandatangan Surat Dinas</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={sdData.namaJabatan}
                          onChange={(e) => setSdData({ ...sdData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={sdData.namaPejabat}
                          onChange={(e) => setSdData({ ...sdData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">NIP</label>
                      <input
                        type="text"
                        value={sdData.nip}
                        onChange={(e) => setSdData({ ...sdData, nip: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-sd"
                        checked={sdData.tteVerified}
                        onChange={(e) => setSdData({ ...sdData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-sd" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 9: SURAT UNDANGAN LEMBARAN */}
              {selectedTemplate === 'undangan_lembar' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-unsil-green-950 text-xs">
                      Formulir Surat Undangan (Bentuk Lembar Surat Resmi)
                    </p>
                    <p className="text-[11px] text-unsil-green-800">
                      Format resmi A4 lengkap dengan Kop UNSIL, agenda terstruktur, tanda tangan &amp; tembusan sejajar, serta opsi lampiran daftar undangan (halaman 2).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Nomor Surat</label>
                      <input
                        type="text"
                        value={undanganLembarData.nomorSurat}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, nomorSurat: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Tempat &amp; Tanggal</label>
                      <input
                        type="text"
                        value={undanganLembarData.tempatTanggal}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, tempatTanggal: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Lampiran</label>
                      <input
                        type="text"
                        value={undanganLembarData.lampiran}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, lampiran: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Hal / Perihal</label>
                      <input
                        type="text"
                        value={undanganLembarData.hal}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, hal: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Yth. (Penerima Undangan)</label>
                      <input
                        type="text"
                        value={undanganLembarData.yth}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, yth: e.target.value })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Alamat Tujuan / Unit</label>
                      <input
                        type="text"
                        value={undanganLembarData.alamatTujuan}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, alamatTujuan: e.target.value })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Pembuka (akhiri dengan "pada,")</label>
                    <textarea
                      rows={2}
                      value={undanganLembarData.kalimatPembuka}
                      onChange={(e) =>
                        setUndanganLembarData({ ...undanganLembarData, kalimatPembuka: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-bold text-slate-900 text-xs">Rincian Agenda Kegiatan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari, Tanggal</label>
                        <input
                          type="text"
                          value={undanganLembarData.hariTanggal}
                          onChange={(e) =>
                            setUndanganLembarData({ ...undanganLembarData, hariTanggal: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pukul / Waktu</label>
                        <input
                          type="text"
                          value={undanganLembarData.pukul}
                          onChange={(e) =>
                            setUndanganLembarData({ ...undanganLembarData, pukul: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Tempat</label>
                      <input
                        type="text"
                        value={undanganLembarData.tempat}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, tempat: e.target.value })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Acara</label>
                      <input
                        type="text"
                        value={undanganLembarData.acara}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, acara: e.target.value })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Kalimat Penutup</label>
                    <textarea
                      rows={2}
                      value={undanganLembarData.kalimatPenutup}
                      onChange={(e) =>
                        setUndanganLembarData({ ...undanganLembarData, kalimatPenutup: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  {/* Section Lampiran Halaman 2 */}
                  <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="has-lampiran-su"
                          checked={undanganLembarData.hasLampiran}
                          onChange={(e) =>
                            setUndanganLembarData({ ...undanganLembarData, hasLampiran: e.target.checked })
                          }
                          className="rounded text-unsil-green-800"
                        />
                        <label htmlFor="has-lampiran-su" className="text-xs font-bold text-slate-800 cursor-pointer">
                          Sertakan Lembar Lampiran (Halaman 2)
                        </label>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Format Lampiran Surat Undangan
                      </span>
                    </div>

                    {undanganLembarData.hasLampiran && (
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-1">
                          Daftar Pejabat / Pihak yang Diundang (Tulis 1 nama/jabatan per baris, otomatis diberi nomor 1, 2, dst.)
                        </label>
                        <textarea
                          rows={5}
                          value={undanganLembarData.lampiranDaftarText}
                          onChange={(e) =>
                            setUndanganLembarData({ ...undanganLembarData, lampiranDaftarText: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                          placeholder="Dekan FKIP&#10;Dekan FEB&#10;Dekan FT..."
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Tembusan (Tulis 1 tembusan per baris - otomatis sejajar dengan NIP)
                    </label>
                    <textarea
                      rows={2}
                      value={undanganLembarData.tembusanText}
                      onChange={(e) =>
                        setUndanganLembarData({ ...undanganLembarData, tembusanText: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Penandatangan Surat Undangan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={undanganLembarData.namaJabatan}
                          onChange={(e) =>
                            setUndanganLembarData({ ...undanganLembarData, namaJabatan: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={undanganLembarData.namaPejabat}
                          onChange={(e) =>
                            setUndanganLembarData({ ...undanganLembarData, namaPejabat: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">NIP (Times New Roman)</label>
                      <input
                        type="text"
                        value={undanganLembarData.nip}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, nip: e.target.value })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-undangan-lembar"
                        checked={undanganLembarData.tteVerified}
                        onChange={(e) =>
                          setUndanganLembarData({ ...undanganLembarData, tteVerified: e.target.checked })
                        }
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-undangan-lembar" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 10: SURAT UNDANGAN BENTUK KARTU */}
              {selectedTemplate === 'undangan_kartu' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="font-bold text-amber-950 text-xs">
                      Formulir Surat Undangan (Bentuk Kartu Resmi)
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Format kartu undangan eksklusif dengan Logo UNSIL di bagian atas tengah, format teks terpusat, dan ketentuan pakaian/kehadiran 2 kolom di bagian bawah.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Pejabat Pengundang</label>
                      <input
                        type="text"
                        value={undanganKartuData.pengundang}
                        onChange={(e) =>
                          setUndanganKartuData({ ...undanganKartuData, pengundang: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Keterangan Pendamping</label>
                      <input
                        type="text"
                        value={undanganKartuData.pendamping}
                        onChange={(e) =>
                          setUndanganKartuData({ ...undanganKartuData, pendamping: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs italic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Kalimat Penghormatan</label>
                      <input
                        type="text"
                        value={undanganKartuData.kalimatMengharap}
                        onChange={(e) =>
                          setUndanganKartuData({ ...undanganKartuData, kalimatMengharap: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Kata Penghubung</label>
                      <input
                        type="text"
                        value={undanganKartuData.kalimatPadaAcara}
                        onChange={(e) =>
                          setUndanganKartuData({ ...undanganKartuData, kalimatPadaAcara: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Nama / Agenda Acara (Gunakan Enter untuk baris baru)
                    </label>
                    <textarea
                      rows={3}
                      value={undanganKartuData.namaAcara}
                      onChange={(e) =>
                        setUndanganKartuData({ ...undanganKartuData, namaAcara: e.target.value })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase leading-relaxed text-center font-serif"
                    />
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Waktu &amp; Tempat Acara</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari</label>
                        <input
                          type="text"
                          value={undanganKartuData.hari}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, hari: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tanggal</label>
                        <input
                          type="text"
                          value={undanganKartuData.tanggal}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, tanggal: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pukul</label>
                        <input
                          type="text"
                          value={undanganKartuData.pukul}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, pukul: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Tempat Acara</label>
                      <input
                        type="text"
                        value={undanganKartuData.tempat}
                        onChange={(e) =>
                          setUndanganKartuData({ ...undanganKartuData, tempat: e.target.value })
                        }
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Catatan Kehadiran &amp; Ketentuan Busana (2 Kolom Bawah)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Waktu Hadir Sebelum Acara (Menit)</label>
                        <input
                          type="text"
                          value={undanganKartuData.menitHadir}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, menitHadir: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nomor RSVP / Konfirmasi Telepon</label>
                        <input
                          type="text"
                          value={undanganKartuData.nomorKonfirmasi}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, nomorKonfirmasi: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pakaian Pria</label>
                        <input
                          type="text"
                          value={undanganKartuData.pakaianPria}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, pakaianPria: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pakaian Wanita</label>
                        <input
                          type="text"
                          value={undanganKartuData.pakaianWanita}
                          onChange={(e) =>
                            setUndanganKartuData({ ...undanganKartuData, pakaianWanita: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 11: NOTA KESEPAHAMAN (MoU) */}
              {selectedTemplate === 'mou' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <p className="font-bold text-blue-950 text-xs">
                      Formulir Nota Kesepahaman (MoU / Kerjasama Dua Pihak)
                    </p>
                    <p className="text-[11px] text-blue-800">
                      Format naskah dinas kesepakatan bersama antara dua instansi dengan lambang pihak I &amp; II di kiri dan kanan atas, judul terpusat, komparisi legal, klausul pasal dinamis, dan tanda tangan berdampingan.
                    </p>
                  </div>

                  {/* Instansi & Nomor Kerjasama */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-900 text-xs">Pihak-Pihak &amp; Penomoran Naskah</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nama Instansi Pihak I</label>
                        <input
                          type="text"
                          value={mouData.instansiPihak1}
                          onChange={(e) => setMouData({ ...mouData, instansiPihak1: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nama Instansi Pihak II</label>
                        <input
                          type="text"
                          value={mouData.instansiPihak2}
                          onChange={(e) => setMouData({ ...mouData, instansiPihak2: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Pihak I</label>
                        <input
                          type="text"
                          value={mouData.nomorPihak1}
                          onChange={(e) => setMouData({ ...mouData, nomorPihak1: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Pihak II</label>
                        <input
                          type="text"
                          value={mouData.nomorPihak2}
                          onChange={(e) => setMouData({ ...mouData, nomorPihak2: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload Lambang Pihak Kedua */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-unsil-green-800" />
                        Lambang Pihak II (Instansi Mitra)
                      </p>
                      {mouData.logoPihak2 && (
                        <button
                          type="button"
                          onClick={handleRemoveLogoPihak2}
                          className="inline-flex items-center gap-1 text-[10.5px] text-rose-600 hover:text-rose-800 font-semibold transition"
                          title="Hapus Logo Mitra dan kembali ke kotak standar"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset ke Kotak Standar
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Otomatis disesuaikan dan dikunci pada rasio kotak template resmi (maks. 112px × 80px).
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      {/* Bounding Box Preview: strictly matching the template ratio */}
                      <div className="w-28 h-20 bg-white rounded border-2 border-dashed border-slate-300 flex items-center justify-center p-1 relative overflow-hidden shrink-0 shadow-xs">
                        {mouData.logoPihak2 ? (
                          <img
                            src={mouData.logoPihak2}
                            alt="Pratinjau Lambang Pihak II"
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                          />
                        ) : (
                          <div className="text-center p-1 select-none">
                            <Upload className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">
                              LAMBANG II
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-unsil-gold-400" />
                          <span>{mouData.logoPihak2 ? 'Ganti Berkas Lambang' : 'Unggah Lambang Pihak II'}</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                            onChange={handleLogoPihak2Upload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Format gambar apa pun (PNG transparan/JPG/SVG) akan <strong>dipaksa pas (auto-fit)</strong> tanpa merusak layout template.
                        </p>

                        {/* Optional frame border toggle */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <input
                            type="checkbox"
                            id="bingkai-pihak2"
                            checked={mouData.tampilkanBingkaiLogo ?? false}
                            onChange={(e) =>
                              setMouData({ ...mouData, tampilkanBingkaiLogo: e.target.checked })
                            }
                            className="rounded text-unsil-green-800"
                          />
                          <label htmlFor="bingkai-pihak2" className="text-[11px] text-slate-700 cursor-pointer">
                            Tampilkan bingkai garis hitam di sekeliling lambang
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">
                      Tentang / Perihal Kesepakatan (Gunakan Enter untuk baris baru)
                    </label>
                    <textarea
                      rows={3}
                      value={mouData.tentang}
                      onChange={(e) => setMouData({ ...mouData, tentang: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-serif font-bold uppercase leading-relaxed text-center"
                    />
                  </div>

                  {/* Waktu & Tempat Komparisi */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-900 text-xs">Waktu &amp; Tempat Penandatanganan</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari</label>
                        <input
                          type="text"
                          value={mouData.hari}
                          onChange={(e) => setMouData({ ...mouData, hari: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tanggal</label>
                        <input
                          type="text"
                          value={mouData.tanggal}
                          onChange={(e) => setMouData({ ...mouData, tanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Bulan</label>
                        <input
                          type="text"
                          value={mouData.bulan}
                          onChange={(e) => setMouData({ ...mouData, bulan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tahun</label>
                        <input
                          type="text"
                          value={mouData.tahun}
                          onChange={(e) => setMouData({ ...mouData, tahun: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Tempat / Kota</label>
                      <input
                        type="text"
                        value={mouData.tempat}
                        onChange={(e) => setMouData({ ...mouData, tempat: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Detail Pejabat Pihak Kesatu */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-bold text-unsil-green-950 text-xs">Identitas Pihak Kesatu (UNSIL)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={mouData.pihak1Nama}
                          onChange={(e) => setMouData({ ...mouData, pihak1Nama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={mouData.pihak1Jabatan}
                          onChange={(e) => setMouData({ ...mouData, pihak1Jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={mouData.pihak1Nip}
                          onChange={(e) => setMouData({ ...mouData, pihak1Nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-serif"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Alamat Kantor / Kedudukan</label>
                        <input
                          type="text"
                          value={mouData.pihak1Alamat}
                          onChange={(e) => setMouData({ ...mouData, pihak1Alamat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-mou-pihak1"
                        checked={mouData.pihak1TteVerified}
                        onChange={(e) => setMouData({ ...mouData, pihak1TteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-mou-pihak1" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Pihak Kesatu Sah
                      </label>
                    </div>
                  </div>

                  {/* Detail Pejabat Pihak Kedua */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                    <p className="font-bold text-blue-950 text-xs">Identitas Pihak Kedua (Instansi Mitra)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={mouData.pihak2Nama}
                          onChange={(e) => setMouData({ ...mouData, pihak2Nama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={mouData.pihak2Jabatan}
                          onChange={(e) => setMouData({ ...mouData, pihak2Jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIK / NIP / Identitas</label>
                        <input
                          type="text"
                          value={mouData.pihak2Nip}
                          onChange={(e) => setMouData({ ...mouData, pihak2Nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-serif"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Alamat Kantor / Kedudukan</label>
                        <input
                          type="text"
                          value={mouData.pihak2Alamat}
                          onChange={(e) => setMouData({ ...mouData, pihak2Alamat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Editor Pasal-Pasal Dinamis */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        Klausul Pasal-Pasal ({mouData.pasalList.length} Pasal)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPasalMou}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-unsil-green-700 hover:bg-unsil-green-800 text-white rounded text-[11px] font-semibold transition"
                      >
                        <Plus className="w-3 h-3" /> Tambah Pasal
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {mouData.pasalList.map((pasal, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-300 rounded-xl space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-unsil-green-900">
                              Pasal {pasal.no}
                            </span>
                            {mouData.pasalList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePasalMou(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                                title="Hapus Pasal Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Judul Pasal (Huruf Kapital)</label>
                            <input
                              type="text"
                              value={pasal.judul}
                              onChange={(e) => handleUpdatePasalMou(idx, 'judul', e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold uppercase font-serif"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Isi Klausul Ketentuan</label>
                            <textarea
                              rows={3}
                              value={pasal.isi}
                              onChange={(e) => handleUpdatePasalMou(idx, 'isi', e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-serif leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 12: PERJANJIAN KERJA SAMA DALAM NEGERI (PKS) */}
              {selectedTemplate === 'pks' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                    <p className="font-bold text-indigo-950 text-xs">
                      Formulir Perjanjian Kerja Sama Dalam Negeri (PKS)
                    </p>
                    <p className="text-[11px] text-indigo-800">
                      Naskah dinas perjanjian kerja sama operasional antara dua instansi dengan lambang pihak I &amp; II di kiri-kanan atas, kepala surat terpusat, komparisi para pihak, klausul pasal dinamis, dan tanda tangan berdampingan.
                    </p>
                  </div>

                  {/* Instansi & Nomor Kerjasama */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-900 text-xs">Pihak-Pihak &amp; Penomoran Naskah</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nama Instansi Pihak I</label>
                        <input
                          type="text"
                          value={pksData.instansiPihak1}
                          onChange={(e) => setPksData({ ...pksData, instansiPihak1: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nama Instansi Pihak II</label>
                        <input
                          type="text"
                          value={pksData.instansiPihak2}
                          onChange={(e) => setPksData({ ...pksData, instansiPihak2: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Pihak I</label>
                        <input
                          type="text"
                          value={pksData.nomorPihak1}
                          onChange={(e) => setPksData({ ...pksData, nomorPihak1: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Pihak II</label>
                        <input
                          type="text"
                          value={pksData.nomorPihak2}
                          onChange={(e) => setPksData({ ...pksData, nomorPihak2: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Judul & Bidang Kerjasama */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Perihal / Objek Kerja Sama (TENTANG)
                      </label>
                      <textarea
                        rows={2}
                        value={pksData.tentang}
                        onChange={(e) => setPksData({ ...pksData, tentang: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Bidang Kerja Sama
                      </label>
                      <input
                        type="text"
                        value={pksData.bidangKerjasama}
                        onChange={(e) => setPksData({ ...pksData, bidangKerjasama: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Waktu & Lokasi Penandatanganan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-900 text-xs">Waktu &amp; Tempat Penandatanganan</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari</label>
                        <input
                          type="text"
                          value={pksData.hari}
                          onChange={(e) => setPksData({ ...pksData, hari: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tanggal</label>
                        <input
                          type="text"
                          value={pksData.tanggal}
                          onChange={(e) => setPksData({ ...pksData, tanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Bulan</label>
                        <input
                          type="text"
                          value={pksData.bulan}
                          onChange={(e) => setPksData({ ...pksData, bulan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tahun</label>
                        <input
                          type="text"
                          value={pksData.tahun}
                          onChange={(e) => setPksData({ ...pksData, tahun: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Tempat / Kota</label>
                      <input
                        type="text"
                        value={pksData.tempat}
                        onChange={(e) => setPksData({ ...pksData, tempat: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Lambang Pihak II (Upload) */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        Unggah Lambang Pihak II (Instansi Mitra)
                      </p>
                      {pksData.logoPihak2 && (
                        <button
                          type="button"
                          onClick={handleRemoveLogoPihak2Pks}
                          className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset ke Kotak Standar
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-amber-800 leading-snug">
                      Logo akan dipaksa presisi menyesuaikan ukuran template resmi (112px × 80px) tanpa merusak proporsi teks.
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-24 h-16 border border-dashed border-amber-300 bg-white rounded-lg flex items-center justify-center p-1 shrink-0">
                        {pksData.logoPihak2 ? (
                          <img
                            src={pksData.logoPihak2}
                            alt="Pratinjau Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400 text-center font-bold">KOTAK TEKS LAMBANG</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                          onChange={handleLogoPihak2PksUpload}
                          className="block w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pks-bingkai-logo"
                            checked={pksData.tampilkanBingkaiLogo}
                            onChange={(e) => setPksData({ ...pksData, tampilkanBingkaiLogo: e.target.checked })}
                            className="rounded text-amber-700"
                          />
                          <label htmlFor="pks-bingkai-logo" className="text-[11px] text-slate-700 cursor-pointer">
                            Tampilkan bingkai garis hitam di sekeliling lambang
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Identitas Pihak Kesatu */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-bold text-unsil-green-950 text-xs">Identitas Pihak Kesatu (UNSIL)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={pksData.pihak1Nama}
                          onChange={(e) => setPksData({ ...pksData, pihak1Nama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={pksData.pihak1Jabatan}
                          onChange={(e) => setPksData({ ...pksData, pihak1Jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={pksData.pihak1Nip}
                          onChange={(e) => setPksData({ ...pksData, pihak1Nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-serif"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Alamat Kedudukan</label>
                        <input
                          type="text"
                          value={pksData.pihak1Alamat}
                          onChange={(e) => setPksData({ ...pksData, pihak1Alamat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-pks-pihak1"
                        checked={pksData.tteVerified}
                        onChange={(e) => setPksData({ ...pksData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-pks-pihak1" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>

                  {/* Identitas Pihak Kedua */}
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                    <p className="font-bold text-indigo-950 text-xs">Identitas Pihak Kedua (Instansi Mitra)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={pksData.pihak2Nama}
                          onChange={(e) => setPksData({ ...pksData, pihak2Nama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={pksData.pihak2Jabatan}
                          onChange={(e) => setPksData({ ...pksData, pihak2Jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP / NIK</label>
                        <input
                          type="text"
                          value={pksData.pihak2Nip}
                          onChange={(e) => setPksData({ ...pksData, pihak2Nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-serif"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Alamat Kedudukan</label>
                        <input
                          type="text"
                          value={pksData.pihak2Alamat}
                          onChange={(e) => setPksData({ ...pksData, pihak2Alamat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manajemen Pasal Dinamis */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-xs">
                        Ketentuan Klausul Pasal ({pksData.pasalList.length} Pasal)
                      </p>
                      <button
                        type="button"
                        onClick={handleAddPasalPks}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-unsil-green-700 hover:bg-unsil-green-800 text-white rounded text-[11px] font-semibold transition"
                      >
                        <Plus className="w-3 h-3" /> Tambah Pasal
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {pksData.pasalList.map((pasal, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-300 rounded-xl space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-unsil-green-900">
                              Pasal {pasal.nomor || idx + 1}
                            </span>
                            {pksData.pasalList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePasalPks(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                                title="Hapus Pasal Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Judul Pasal (Huruf Kapital)</label>
                            <input
                              type="text"
                              value={pasal.judul}
                              onChange={(e) => handleUpdatePasalPks(idx, 'judul', e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold uppercase font-serif"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Isi Klausul Ketentuan</label>
                            <textarea
                              rows={3}
                              value={pasal.isi}
                              onChange={(e) => handleUpdatePasalPks(idx, 'isi', e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-serif leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 13: SURAT KUASA */}
              {selectedTemplate === 'skua' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="font-bold text-amber-950 text-xs">Formulir Surat Kuasa Resmi</p>
                    <p className="text-[11px] text-amber-800">
                      Format naskah dinas pelimpahan wewenang kedinasan dari pemberi kuasa kepada penerima kuasa dengan dua kolom tanda tangan berdampingan.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Kuasa</label>
                        <input
                          type="text"
                          value={skuaData.nomorSurat}
                          onChange={(e) => setSkuaData({ ...skuaData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Kota &amp; Tanggal</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={skuaData.kota}
                            onChange={(e) => setSkuaData({ ...skuaData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={skuaData.tanggal}
                            onChange={(e) => setSkuaData({ ...skuaData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Pemberi Kuasa */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-bold text-unsil-green-950 text-xs">Identitas Pemberi Kuasa</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pemberi Kuasa</label>
                        <input
                          type="text"
                          value={skuaData.pemberiNama}
                          onChange={(e) => setSkuaData({ ...skuaData, pemberiNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={skuaData.pemberiJabatan}
                          onChange={(e) => setSkuaData({ ...skuaData, pemberiJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={skuaData.pemberiNip}
                          onChange={(e) => setSkuaData({ ...skuaData, pemberiNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Alamat</label>
                        <input
                          type="text"
                          value={skuaData.pemberiAlamat}
                          onChange={(e) => setSkuaData({ ...skuaData, pemberiAlamat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data Penerima Kuasa */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                    <p className="font-bold text-blue-950 text-xs">Identitas Penerima Kuasa</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Penerima Kuasa</label>
                        <input
                          type="text"
                          value={skuaData.penerimaNama}
                          onChange={(e) => setSkuaData({ ...skuaData, penerimaNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={skuaData.penerimaJabatan}
                          onChange={(e) => setSkuaData({ ...skuaData, penerimaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={skuaData.penerimaNip}
                          onChange={(e) => setSkuaData({ ...skuaData, penerimaNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Alamat</label>
                        <input
                          type="text"
                          value={skuaData.penerimaAlamat}
                          onChange={(e) => setSkuaData({ ...skuaData, penerimaAlamat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Uraian Keperluan Kuasa */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Uraian Mandat / Kuasa yang Diberikan (Untuk ...)
                    </label>
                    <textarea
                      rows={4}
                      value={skuaData.untukKeperluan}
                      onChange={(e) => setSkuaData({ ...skuaData, untukKeperluan: e.target.value })}
                      placeholder="Jelaskan secara spesifik kewenangan atau tugas yang dilimpahkan..."
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-skua"
                      checked={skuaData.tteVerified}
                      onChange={(e) => setSkuaData({ ...skuaData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-skua" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 14: BERITA ACARA */}
              {selectedTemplate === 'ba' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
                    <p className="font-bold text-sky-950 text-xs">Formulir Berita Acara Resmi</p>
                    <p className="text-[11px] text-sky-800">
                      Format naskah dinas pembuktian suatu kejadian, serah terima, atau pemeriksaan fisik oleh pihak pertama dan kedua serta disahkan oleh pejabat mengetahui.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Berita Acara</label>
                        <input
                          type="text"
                          value={baData.nomorSurat}
                          onChange={(e) => setBaData({ ...baData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Tempat Dibuat</label>
                        <input
                          type="text"
                          value={baData.tempatDibuat}
                          onChange={(e) => setBaData({ ...baData, tempatDibuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari</label>
                        <input
                          type="text"
                          value={baData.hari}
                          onChange={(e) => setBaData({ ...baData, hari: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tanggal</label>
                        <input
                          type="text"
                          value={baData.tanggal}
                          onChange={(e) => setBaData({ ...baData, tanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Bulan</label>
                        <input
                          type="text"
                          value={baData.bulan}
                          onChange={(e) => setBaData({ ...baData, bulan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tahun</label>
                        <input
                          type="text"
                          value={baData.tahun}
                          onChange={(e) => setBaData({ ...baData, tahun: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Identitas Para Pihak */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                      <p className="font-bold text-unsil-green-950 text-xs">Pihak Pertama</p>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={baData.pihak1Nama}
                          onChange={(e) => setBaData({ ...baData, pihak1Nama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={baData.pihak1Nip}
                          onChange={(e) => setBaData({ ...baData, pihak1Nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={baData.pihak1Jabatan}
                          onChange={(e) => setBaData({ ...baData, pihak1Jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                      <p className="font-bold text-blue-950 text-xs">Pihak Kedua</p>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Lengkap</label>
                        <input
                          type="text"
                          value={baData.pihak2Nama}
                          onChange={(e) => setBaData({ ...baData, pihak2Nama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan / Instansi</label>
                        <input
                          type="text"
                          value={baData.pihak2Jabatan}
                          onChange={(e) => setBaData({ ...baData, pihak2Jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Butir-Butir Kegiatan Dinamis */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-xs">
                        Uraian Pelaksanaan Kegiatan ({baData.daftarKegiatan.length} Butir)
                      </p>
                      <button
                        type="button"
                        onClick={handleAddKegiatanBa}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-unsil-green-700 hover:bg-unsil-green-800 text-white rounded text-[11px] font-semibold transition"
                      >
                        <Plus className="w-3 h-3" /> Tambah Butir
                      </button>
                    </div>

                    <div className="space-y-2">
                      {baData.daftarKegiatan.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white p-2 border border-slate-300 rounded-lg">
                          <span className="font-bold text-xs text-slate-600 mt-1">{idx + 1}.</span>
                          <textarea
                            rows={2}
                            value={item}
                            onChange={(e) => handleUpdateKegiatanBa(idx, e.target.value)}
                            className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded text-xs font-serif"
                          />
                          {baData.daftarKegiatan.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveKegiatanBa(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Hapus butir ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dasar Pelaksanaan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Dasar Pelaksanaan (SK / Surat Tugas / Peraturan)
                    </label>
                    <textarea
                      rows={2}
                      value={baData.dasarPelaksanaan}
                      onChange={(e) => setBaData({ ...baData, dasarPelaksanaan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                    />
                  </div>

                  {/* Mengetahui / Mengesahkan */}
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                    <p className="font-bold text-purple-950 text-xs">Pejabat Mengetahui / Mengesahkan</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Jabatan</label>
                        <input
                          type="text"
                          value={baData.mengetahuiJabatan}
                          onChange={(e) => setBaData({ ...baData, mengetahuiJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Lengkap</label>
                        <input
                          type="text"
                          value={baData.mengetahuiNama}
                          onChange={(e) => setBaData({ ...baData, mengetahuiNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={baData.mengetahuiNip}
                          onChange={(e) => setBaData({ ...baData, mengetahuiNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-ba"
                      checked={baData.tteVerified}
                      onChange={(e) => setBaData({ ...baData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-ba" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 15: SURAT KETERANGAN */}
              {selectedTemplate === 'sket' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl">
                    <p className="font-bold text-teal-950 text-xs">Formulir Surat Keterangan Resmi</p>
                    <p className="text-[11px] text-teal-800">
                      Format naskah dinas untuk menerangkan status kedinasan, kepegawaian, atau kondisi faktual seseorang dengan kop resmi UNSIL.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Keterangan</label>
                        <input
                          type="text"
                          value={sketData.nomorSurat}
                          onChange={(e) => setSketData({ ...sketData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Kota &amp; Tanggal</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={sketData.kota}
                            onChange={(e) => setSketData({ ...sketData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={sketData.tanggal}
                            onChange={(e) => setSketData({ ...sketData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pejabat Yang Menerangkan */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <p className="font-bold text-unsil-green-950 text-xs">Pejabat Yang Menerangkan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={sketData.pejabatNama}
                          onChange={(e) => setSketData({ ...sketData, pejabatNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={sketData.pejabatNip}
                          onChange={(e) => setSketData({ ...sketData, pejabatNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pangkat dan Golongan</label>
                        <input
                          type="text"
                          value={sketData.pejabatPangkatGol}
                          onChange={(e) => setSketData({ ...sketData, pejabatPangkatGol: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={sketData.pejabatJabatan}
                          onChange={(e) => setSketData({ ...sketData, pejabatJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pegawai Yang Diterangkan */}
                  <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                    <p className="font-bold text-teal-950 text-xs">Pegawai / Pihak Yang Diterangkan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Lengkap</label>
                        <input
                          type="text"
                          value={sketData.pegawaiNama}
                          onChange={(e) => setSketData({ ...sketData, pegawaiNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={sketData.pegawaiNip}
                          onChange={(e) => setSketData({ ...sketData, pegawaiNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pangkat dan Golongan</label>
                        <input
                          type="text"
                          value={sketData.pegawaiPangkatGol}
                          onChange={(e) => setSketData({ ...sketData, pegawaiPangkatGol: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={sketData.pegawaiJabatan}
                          onChange={(e) => setSketData({ ...sketData, pegawaiJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Narasi Isi Keterangan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Uraian Keterangan Resmi
                    </label>
                    <textarea
                      rows={4}
                      value={sketData.isiKeterangan}
                      onChange={(e) => setSketData({ ...sketData, isiKeterangan: e.target.value })}
                      placeholder="Jelaskan fakta, status, atau kondisi yang diterangkan..."
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-sket"
                      checked={sketData.tteVerified}
                      onChange={(e) => setSketData({ ...sketData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-sket" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 16: SURAT PERNYATAAN */}
              {selectedTemplate === 'sper' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <p className="font-bold text-rose-950 text-xs">Formulir Surat Pernyataan Resmi</p>
                    <p className="text-[11px] text-rose-800">
                      Format naskah dinas yang memuat pernyataan kesanggupan, kepatuhan, kebenaran data, atau komitmen hukum seseorang dengan tanda tangan bermaterai.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Pernyataan</label>
                        <input
                          type="text"
                          value={sperData.nomorSurat}
                          onChange={(e) => setSperData({ ...sperData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Kota &amp; Tanggal</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={sperData.kota}
                            onChange={(e) => setSperData({ ...sperData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={sperData.tanggal}
                            onChange={(e) => setSperData({ ...sperData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Yang Menyatakan */}
                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                    <p className="font-bold text-rose-950 text-xs">Identitas Yang Bertanda Tangan</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Lengkap</label>
                        <input
                          type="text"
                          value={sperData.namaYangMenyatakan}
                          onChange={(e) => setSperData({ ...sperData, namaYangMenyatakan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={sperData.nipYangMenyatakan}
                          onChange={(e) => setSperData({ ...sperData, nipYangMenyatakan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pangkat dan Golongan</label>
                        <input
                          type="text"
                          value={sperData.pangkatGolongan}
                          onChange={(e) => setSperData({ ...sperData, pangkatGolongan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={sperData.jabatan}
                          onChange={(e) => setSperData({ ...sperData, jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Alamat</label>
                      <input
                        type="text"
                        value={sperData.alamat}
                        onChange={(e) => setSperData({ ...sperData, alamat: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Isi Pernyataan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Uraian Isi Pernyataan
                    </label>
                    <textarea
                      rows={5}
                      value={sperData.isiPernyataan}
                      onChange={(e) => setSperData({ ...sperData, isiPernyataan: e.target.value })}
                      placeholder="Tuliskan pernyataan kesungguhan, komitmen, atau pertanggungjawaban..."
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-sper"
                      checked={sperData.tteVerified}
                      onChange={(e) => setSperData({ ...sperData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-sper" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 17: SURAT PENGANTAR */}
              {selectedTemplate === 'speng' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <p className="font-bold text-blue-950 text-xs">Formulir Surat Pengantar Resmi</p>
                    <p className="text-[11px] text-blue-800">
                      Naskah dinas resmi untuk mengantarkan berkas dokumen atau barang dinas lengkap dengan tabel ekspedisi dan tanda terima penerima.
                    </p>
                  </div>

                  {/* Nomor & Tanggal */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Surat Pengantar</label>
                        <input
                          type="text"
                          value={spengData.nomorSurat}
                          onChange={(e) => setSpengData({ ...spengData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Kota &amp; Tanggal</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={spengData.kota}
                            onChange={(e) => setSpengData({ ...spengData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={spengData.tanggal}
                            onChange={(e) => setSpengData({ ...spengData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tujuan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <label className="text-[10px] text-slate-500 block font-semibold">Tujuan Surat Pengantar</label>
                    <input
                      type="text"
                      value={spengData.tujuan}
                      onChange={(e) => setSpengData({ ...spengData, tujuan: e.target.value })}
                      placeholder="Yth. Nama Jabatan / Instansi Penerima"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={spengData.tujuanInstansi}
                      onChange={(e) => setSpengData({ ...spengData, tujuanInstansi: e.target.value })}
                      placeholder="Alamat atau Kota Tujuan"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  {/* Daftar Dokumen/Barang */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Daftar Dokumen / Barang yang Disampaikan ({spengData.items.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSpengItem}
                        className="inline-flex items-center gap-1 text-[11px] text-unsil-green-800 font-semibold hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Tambah Baris
                      </button>
                    </div>

                    <div className="space-y-2">
                      {spengData.items.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>Baris #{idx + 1}</span>
                            {spengData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSpengItem(idx)}
                                className="text-red-500 hover:text-red-700"
                                title="Hapus baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 block">Jenis Dokumen / Barang</label>
                            <input
                              type="text"
                              value={item.jenis}
                              onChange={(e) => handleUpdateSpengItem(idx, 'jenis', e.target.value)}
                              className="w-full p-1 border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 block">Jumlah</label>
                              <input
                                type="text"
                                value={item.jumlah}
                                onChange={(e) => handleUpdateSpengItem(idx, 'jumlah', e.target.value)}
                                placeholder="mis: 1 (satu) berkas"
                                className="w-full p-1 border border-slate-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block">Keterangan</label>
                              <input
                                type="text"
                                value={item.keterangan}
                                onChange={(e) => handleUpdateSpengItem(idx, 'keterangan', e.target.value)}
                                placeholder="Catatan peruntukan"
                                className="w-full p-1 border border-slate-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kalimat Penutup */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">Kalimat Penutup</label>
                    <textarea
                      rows={2}
                      value={spengData.kalimatPenutup}
                      onChange={(e) => setSpengData({ ...spengData, kalimatPenutup: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                    />
                  </div>

                  {/* Pengirim & Penerima */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pengirim */}
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                      <p className="font-bold text-unsil-green-950 text-xs">Pengirim (Kanan)</p>
                      <div>
                        <label className="text-[9px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={spengData.pengirimJabatan}
                          onChange={(e) => setSpengData({ ...spengData, pengirimJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={spengData.pengirimNama}
                          onChange={(e) => setSpengData({ ...spengData, pengirimNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={spengData.pengirimNip}
                          onChange={(e) => setSpengData({ ...spengData, pengirimNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Penerima Tanda Terima */}
                    <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1.5">
                      <p className="font-bold text-indigo-950 text-xs">Tanda Terima (Kiri)</p>
                      <div>
                        <label className="text-[9px] text-slate-500 block">Diterima Tanggal</label>
                        <input
                          type="text"
                          value={spengData.penerimaTanggal}
                          onChange={(e) => setSpengData({ ...spengData, penerimaTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">Jabatan Penerima</label>
                        <input
                          type="text"
                          value={spengData.penerimaJabatan}
                          onChange={(e) => setSpengData({ ...spengData, penerimaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">Nama Penerima</label>
                        <input
                          type="text"
                          value={spengData.penerimaNama}
                          onChange={(e) => setSpengData({ ...spengData, penerimaNama: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block">NIP Penerima</label>
                        <input
                          type="text"
                          value={spengData.penerimaNip}
                          onChange={(e) => setSpengData({ ...spengData, penerimaNip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-speng"
                      checked={spengData.tteVerified}
                      onChange={(e) => setSpengData({ ...spengData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-speng" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 18: PENGUMUMAN */}
              {selectedTemplate === 'peng' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="font-bold text-amber-950 text-xs">Formulir Pengumuman Resmi</p>
                    <p className="text-[11px] text-amber-800">
                      Naskah dinas resmi yang memuat pemberitahuan tertulis tentang suatu hal yang ditujukan kepada civitas akademika atau khalayak umum.
                    </p>
                  </div>

                  {/* Nomor & Tanggal */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Pengumuman</label>
                        <input
                          type="text"
                          value={pengData.nomorSurat}
                          onChange={(e) => setPengData({ ...pengData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Kota &amp; Tanggal</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={pengData.kota}
                            onChange={(e) => setPengData({ ...pengData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={pengData.tanggal}
                            onChange={(e) => setPengData({ ...pengData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tentang */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                    <label className="text-[10px] text-slate-500 block font-semibold">
                      Judul / Perihal Pengumuman (TENTANG)
                    </label>
                    <textarea
                      rows={2}
                      value={pengData.tentang}
                      onChange={(e) => setPengData({ ...pengData, tentang: e.target.value })}
                      placeholder="Tuliskan judul pengumuman dalam huruf kapital..."
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                    />
                  </div>

                  {/* Isi Pengumuman */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Uraian Isi Pengumuman
                      </label>
                      <span className="text-[10px] text-slate-400">Pisahkan paragraf dengan baris kosong ganda</span>
                    </div>
                    <textarea
                      rows={8}
                      value={pengData.isiText}
                      onChange={(e) => setPengData({ ...pengData, isiText: e.target.value })}
                      placeholder="Tuliskan isi pengumuman secara rinci..."
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                    />
                  </div>

                  {/* Pejabat Penandatangan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Pejabat Pengumum</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={pengData.jabatan}
                          onChange={(e) => setPengData({ ...pengData, jabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={pengData.namaPejabat}
                          onChange={(e) => setPengData({ ...pengData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={pengData.nip}
                          onChange={(e) => setPengData({ ...pengData, nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-peng"
                      checked={pengData.tteVerified}
                      onChange={(e) => setPengData({ ...pengData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-peng" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 19: NOTULA */}
              {selectedTemplate === 'notula' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl">
                    <p className="font-bold text-violet-950 text-xs">Formulir Notula Rapat Resmi</p>
                    <p className="text-[11px] text-violet-800">
                      Format catatan resmi jalannya rapat kedinasan yang memuat susunan acara, peserta, persoalan, tanggapan, dan simpulan.
                    </p>
                  </div>

                  {/* Metadata Rapat */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Informasi Pelaksanaan Rapat</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Nama Rapat</label>
                      <input
                        type="text"
                        value={notulaData.namaRapat}
                        onChange={(e) => setNotulaData({ ...notulaData, namaRapat: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari, Tanggal</label>
                        <input
                          type="text"
                          value={notulaData.hariTanggal}
                          onChange={(e) => setNotulaData({ ...notulaData, hariTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Pukul</label>
                        <input
                          type="text"
                          value={notulaData.pukul}
                          onChange={(e) => setNotulaData({ ...notulaData, pukul: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat</label>
                        <input
                          type="text"
                          value={notulaData.tempat}
                          onChange={(e) => setNotulaData({ ...notulaData, tempat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Susunan Acara & Peserta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Susunan Acara (1 baris per butir)
                      </label>
                      <textarea
                        rows={5}
                        value={notulaData.susunanAcaraText}
                        onChange={(e) => setNotulaData({ ...notulaData, susunanAcaraText: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>

                    <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Peserta Rapat (1 baris per peserta)
                      </label>
                      <textarea
                        rows={5}
                        value={notulaData.pesertaRapatText}
                        onChange={(e) => setNotulaData({ ...notulaData, pesertaRapatText: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Pemimpin Rapat & Notulis */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Pemimpin Rapat</label>
                        <input
                          type="text"
                          value={notulaData.pemimpinRapat}
                          onChange={(e) => setNotulaData({ ...notulaData, pemimpinRapat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Pencatat / Notulis</label>
                        <input
                          type="text"
                          value={notulaData.notulis}
                          onChange={(e) => setNotulaData({ ...notulaData, notulis: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hasil Pembahasan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-800 text-xs">Hasil Pembahasan Rapat</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        1. Persoalan yang Dibahas
                      </label>
                      <textarea
                        rows={2}
                        value={notulaData.persoalanDibahas}
                        onChange={(e) => setNotulaData({ ...notulaData, persoalanDibahas: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        2. Tanggapan Peserta Rapat
                      </label>
                      <textarea
                        rows={2}
                        value={notulaData.tanggapanPeserta}
                        onChange={(e) => setNotulaData({ ...notulaData, tanggapanPeserta: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        3. Simpulan
                      </label>
                      <textarea
                        rows={2}
                        value={notulaData.simpulan}
                        onChange={(e) => setNotulaData({ ...notulaData, simpulan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                  </div>

                  {/* Penandatangan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Pejabat Pengesah Notula</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Kota &amp; Tanggal</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={notulaData.kota}
                            onChange={(e) => setNotulaData({ ...notulaData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={notulaData.tanggal}
                            onChange={(e) => setNotulaData({ ...notulaData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan</label>
                        <input
                          type="text"
                          value={notulaData.jabatanPenandatangan}
                          onChange={(e) => setNotulaData({ ...notulaData, jabatanPenandatangan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={notulaData.namaPenandatangan}
                          onChange={(e) => setNotulaData({ ...notulaData, namaPenandatangan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={notulaData.nipPenandatangan}
                          onChange={(e) => setNotulaData({ ...notulaData, nipPenandatangan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-notula"
                      checked={notulaData.tteVerified}
                      onChange={(e) => setNotulaData({ ...notulaData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-notula" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 20: LAPORAN */}
              {selectedTemplate === 'lap' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-cyan-50/70 border border-cyan-200 rounded-xl">
                    <p className="font-bold text-cyan-950 text-xs">Formulir Laporan Resmi Kedinasan</p>
                    <p className="text-[11px] text-cyan-800">
                      Format laporan resmi Kemendikbudristek &amp; UNSIL dengan struktur baku A (Pendahuluan), B (Kegiatan yang Dilaksanakan), C (Hasil yang Dicapai), dan D (Penutup).
                    </p>
                  </div>

                  {/* Judul & Tanggal */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Nomor Laporan (Opsional)</label>
                        <input
                          type="text"
                          value={lapData.nomorSurat}
                          onChange={(e) => setLapData({ ...lapData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Tempat &amp; Tanggal Pembuatan</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={lapData.kota}
                            onChange={(e) => setLapData({ ...lapData, kota: e.target.value })}
                            placeholder="Kota"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={lapData.tanggal}
                            onChange={(e) => setLapData({ ...lapData, tanggal: e.target.value })}
                            placeholder="Tanggal"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">Judul Laporan (TENTANG)</label>
                      <textarea
                        rows={2}
                        value={lapData.tentang}
                        onChange={(e) => setLapData({ ...lapData, tentang: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                      />
                    </div>
                  </div>

                  {/* A. Pendahuluan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">A. Pendahuluan</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-medium">1. Latar Belakang</label>
                      <textarea
                        rows={3}
                        value={lapData.latarBelakang}
                        onChange={(e) => setLapData({ ...lapData, latarBelakang: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-medium">2. Dasar</label>
                      <textarea
                        rows={3}
                        value={lapData.dasar}
                        onChange={(e) => setLapData({ ...lapData, dasar: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-medium">3. Ruang Lingkup</label>
                      <textarea
                        rows={2}
                        value={lapData.ruangLingkup}
                        onChange={(e) => setLapData({ ...lapData, ruangLingkup: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                  </div>

                  {/* B, C, D */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">B. Kegiatan yang Dilaksanakan</label>
                      <textarea
                        rows={3}
                        value={lapData.kegiatanDilaksanakan}
                        onChange={(e) => setLapData({ ...lapData, kegiatanDilaksanakan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">C. Hasil yang Dicapai</label>
                      <textarea
                        rows={3}
                        value={lapData.hasilDicapai}
                        onChange={(e) => setLapData({ ...lapData, hasilDicapai: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">D. Penutup</label>
                      <textarea
                        rows={2}
                        value={lapData.penutup}
                        onChange={(e) => setLapData({ ...lapData, penutup: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                  </div>

                  {/* Pembuat Laporan */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Pembuat Laporan</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Jabatan Pembuat</label>
                        <input
                          type="text"
                          value={lapData.jabatanPembuat}
                          onChange={(e) => setLapData({ ...lapData, jabatanPembuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pembuat</label>
                        <input
                          type="text"
                          value={lapData.namaPembuat}
                          onChange={(e) => setLapData({ ...lapData, namaPembuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP</label>
                        <input
                          type="text"
                          value={lapData.nipPembuat}
                          onChange={(e) => setLapData({ ...lapData, nipPembuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-lap"
                      checked={lapData.tteVerified}
                      onChange={(e) => setLapData({ ...lapData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-lap" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* TEMPLATE 21: TELAAH STAF */}
              {selectedTemplate === 'ts' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <p className="font-bold text-blue-950 text-xs">Formulir Telaah Staf Resmi Kedinasan</p>
                    <p className="text-[11px] text-blue-800">
                      Format naskah dinas telaah staf resmi sesuai pedoman tata naskah dinas dengan struktur baku: Persoalan, Pranggapan, Fakta-fakta yang mempengaruhi, Analisis, Simpulan, dan Saran.
                    </p>
                  </div>

                  {/* Pengaturan Kop & Judul */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Opsi Kepala Dokumen</span>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tsData.showKopSurat}
                          onChange={(e) => setTsData({ ...tsData, showKopSurat: e.target.checked })}
                          className="rounded text-unsil-green-800"
                        />
                        <span>Tampilkan Kop Surat UNSIL</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">TENTANG (Pokok Persoalan Telaah Staf)</label>
                      <textarea
                        rows={2}
                        value={tsData.tentang}
                        onChange={(e) => setTsData({ ...tsData, tentang: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold uppercase"
                        placeholder="Contoh: OPTIMALISASI KEAMANAN DATA KEARSIPAN DAN IMPLEMENTASI TTE..."
                      />
                    </div>
                  </div>

                  {/* Metadata: Kepada, Dari, Tanggal, Lampiran, Hal */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Tujuan &amp; Pengirim</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Kepada</label>
                        <input
                          type="text"
                          value={tsData.kepada}
                          onChange={(e) => setTsData({ ...tsData, kepada: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Contoh: Rektor Universitas Siliwangi"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Dari</label>
                        <input
                          type="text"
                          value={tsData.dari}
                          onChange={(e) => setTsData({ ...tsData, dari: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Contoh: Kepala Biro Umum dan Keuangan"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Tanggal</label>
                        <input
                          type="text"
                          value={tsData.tanggal}
                          onChange={(e) => setTsData({ ...tsData, tanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Contoh: 08 September 2026"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block font-semibold">Lampiran</label>
                        <input
                          type="text"
                          value={tsData.lampiran}
                          onChange={(e) => setTsData({ ...tsData, lampiran: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Contoh: 1 (satu) Berkas / -"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">Hal</label>
                      <input
                        type="text"
                        value={tsData.hal}
                        onChange={(e) => setTsData({ ...tsData, hal: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                        placeholder="Ringkasan perihal telaah staf"
                      />
                    </div>
                  </div>

                  {/* Sistematika I s.d. VI */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-3">
                    <p className="font-bold text-slate-800 text-xs">Sistematika Uraian Telaah Staf</p>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">I. Persoalan</label>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Memuat pernyataan singkat dan jelas tentang persoalan yang akan dipecahkan.
                      </span>
                      <textarea
                        rows={3}
                        value={tsData.persoalan}
                        onChange={(e) => setTsData({ ...tsData, persoalan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">II. Pranggapan</label>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Pranggapan fakta yang beralasan berdasarkan data dan saling berhubungan sesuai dengan situasi yang dihadapi dan kemungkinan kejadian dimasa mendatang.
                      </span>
                      <textarea
                        rows={3}
                        value={tsData.pranggapan}
                        onChange={(e) => setTsData({ ...tsData, pranggapan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">III. Fakta-fakta yang mempengaruhi</label>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Memuat fakta yang merupakan landasan analisis dan pemecahan persoalan.
                      </span>
                      <textarea
                        rows={3}
                        value={tsData.faktaMempengaruhi}
                        onChange={(e) => setTsData({ ...tsData, faktaMempengaruhi: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">IV. Analisis</label>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Memuat analisis pengaruh pranggapan dan fakta terhadap persoalan serta akibatnya, hambatan, keuntungan/kerugian, serta pemecahan atau cara bertindak yang mungkin dilakukan.
                      </span>
                      <textarea
                        rows={3}
                        value={tsData.analisis}
                        onChange={(e) => setTsData({ ...tsData, analisis: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">V. Simpulan</label>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Memuat intisari hasil diskusi dan pilihan satu cara bertindak atau jalan keluar sebagai pemecahan persoalan yang dihadapi.
                      </span>
                      <textarea
                        rows={3}
                        value={tsData.simpulan}
                        onChange={(e) => setTsData({ ...tsData, simpulan: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">VI. Saran</label>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Memuat secara ringkas dan jelas tentang saran tindakan untuk mengatasi persoalan yang dihadapi.
                      </span>
                      <textarea
                        rows={3}
                        value={tsData.saran}
                        onChange={(e) => setTsData({ ...tsData, saran: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-serif"
                      />
                    </div>
                  </div>

                  {/* Pembuat Telaah Staf */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Penandatangan / Pembuat Telaah Staf</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Jabatan Pembuat</label>
                        <input
                          type="text"
                          value={tsData.jabatanPembuat}
                          onChange={(e) => setTsData({ ...tsData, jabatanPembuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Nama Jabatan Pembuat Telaah staf,"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Lengkap</label>
                        <input
                          type="text"
                          value={tsData.namaPembuat}
                          onChange={(e) => setTsData({ ...tsData, namaPembuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                          placeholder="Nama Lengkap"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP (Opsional)</label>
                        <input
                          type="text"
                          value={tsData.nipPembuat}
                          onChange={(e) => setTsData({ ...tsData, nipPembuat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                          placeholder="NIP Pembuat"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tte-ts"
                      checked={tsData.tteVerified}
                      onChange={(e) => setTsData({ ...tsData, tteVerified: e.target.checked })}
                      className="rounded text-unsil-green-800"
                    />
                    <label htmlFor="tte-ts" className="text-xs text-slate-700 cursor-pointer">
                      Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                    </label>
                  </div>
                </div>
              )}

              {/* 22. FORMAT DISPOSISI REKTOR */}
              {selectedTemplate === 'disp_rektor' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Format 22: Lembar Disposisi Rektor Resmi
                      </h3>
                      <p className="text-[11px] text-emerald-800">
                        Disposisi berjenjang pimpinan dengan klasifikasi keamanan &amp; checklist instruksi tindak lanjut
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded border border-emerald-300">
                      Otentik UNSIL
                    </span>
                  </div>

                  {/* Klasifikasi Sifat Surat */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      Klasifikasi Keamanan / Derajat Kecepatan
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {['Sangat Rahasia', 'Rahasia', 'Sangat Segera', 'Segera', 'Biasa'].map((sifat) => (
                        <button
                          key={sifat}
                          type="button"
                          onClick={() => setDispRektorData({ ...dispRektorData, klasifikasi: sifat })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                            dispRektorData.klasifikasi === sifat
                              ? 'bg-unsil-green-800 text-white border-unsil-green-900 font-bold shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sifat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Agenda & Surat Masuk */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-800 text-xs">Metadata Surat &amp; Agenda Registrasi</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">No Agenda</label>
                        <input
                          type="text"
                          value={dispRektorData.noAgenda}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, noAgenda: e.target.value })}
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tanggal Terima</label>
                        <input
                          type="text"
                          value={dispRektorData.tanggalTerima}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, tanggalTerima: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tanggal Surat</label>
                        <input
                          type="text"
                          value={dispRektorData.tanggalSurat}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, tanggalSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nomor Surat Masuk</label>
                        <input
                          type="text"
                          value={dispRektorData.nomorSurat}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Asal Surat</label>
                      <input
                        type="text"
                        value={dispRektorData.asalSurat}
                        onChange={(e) => setDispRektorData({ ...dispRektorData, asalSurat: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Perihal / Hal</label>
                      <input
                        type="text"
                        value={dispRektorData.hal}
                        onChange={(e) => setDispRektorData({ ...dispRektorData, hal: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Diteruskan Kepada (34 Pejabat/Unit) */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 block">
                        Diteruskan Kepada (Pilih Pejabat / Unit):
                      </label>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        {dispRektorData.diteruskanKepada.length} dipilih
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {DAFTAR_PENERUSAN_REKTOR.map((item) => {
                        const isChecked = dispRektorData.diteruskanKepada.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-[11px] ${
                              isChecked
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePenerusanRektor(item.id)}
                              className="rounded text-unsil-green-800 focus:ring-unsil-green-700 shrink-0"
                            />
                            <span className="w-5 text-right font-bold text-slate-400 shrink-0">
                              {item.id}.
                            </span>
                            <span className="truncate">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {dispRektorData.diteruskanKepada.includes(34) && (
                      <div className="pt-1">
                        <label className="text-[10px] text-slate-500 block">Teks Tambahan Nomor 34 (Lainnya):</label>
                        <input
                          type="text"
                          value={dispRektorData.diteruskanCustom}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, diteruskanCustom: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Ketik nama jabatan atau unit penerima disposisi lain..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Untuk : (24 Instruksi Disposisi) */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 block">
                        Untuk (Instruksi / Tindakan Disposisi):
                      </label>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        {dispRektorData.instruksiUntuk.length} dipilih
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {DAFTAR_INSTRUKSI_REKTOR.map((item) => {
                        const isChecked = dispRektorData.instruksiUntuk.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-[11px] ${
                              isChecked
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleInstruksiRektor(item.id)}
                              className="rounded text-unsil-green-800 focus:ring-unsil-green-700 shrink-0"
                            />
                            <span className="truncate">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {dispRektorData.instruksiUntuk.includes('disp_20') && (
                      <div className="pt-1">
                        <label className="text-[10px] text-slate-500 block">Teks "Koordinasikan dengan...":</label>
                        <input
                          type="text"
                          value={dispRektorData.koordinasikanDengan}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, koordinasikanDengan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Nama pejabat atau pihak yang dikoordinasikan..."
                        />
                      </div>
                    )}
                    {dispRektorData.instruksiUntuk.includes('disp_24') && (
                      <div className="pt-1">
                        <label className="text-[10px] text-slate-500 block">Instruksi Bebas Tambahan:</label>
                        <input
                          type="text"
                          value={dispRektorData.instruksiCustom}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, instruksiCustom: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                          placeholder="Ketik instruksi atau tindakan khusus..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Catatan Disposisi */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">Catatan Pimpinan (Rektor)</label>
                    <textarea
                      rows={3}
                      value={dispRektorData.catatan}
                      onChange={(e) => setDispRektorData({ ...dispRektorData, catatan: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-serif leading-relaxed"
                      placeholder="Tuliskan catatan arahan atau disposisi tambahan..."
                    />
                  </div>

                  {/* Pengesahan Rektor */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Penandatangan Disposisi</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat &amp; Tanggal</label>
                        <input
                          type="text"
                          value={dispRektorData.tempatTanggal}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Rektor</label>
                        <input
                          type="text"
                          value={dispRektorData.namaRektor}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, namaRektor: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP Rektor</label>
                        <input
                          type="text"
                          value={dispRektorData.nipRektor}
                          onChange={(e) => setDispRektorData({ ...dispRektorData, nipRektor: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-disp"
                        checked={dispRektorData.tteVerified}
                        onChange={(e) => setDispRektorData({ ...dispRektorData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-disp" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE Sah
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 23. FORMAT PENGGUNAAN TANDA TANGAN ELEKTRONIK (TTE) */}
              {selectedTemplate === 'tte_doc' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Format 23: Penggunaan Tanda Tangan Elektronik (TTE)
                      </h3>
                      <p className="text-[11px] text-emerald-800">
                        Surat dinas resmi dengan spesimen Kode Informasi Elektronik &amp; klausul legalitas digital
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded border border-emerald-300">
                      Standar TTE Kemendikbudristek
                    </span>
                  </div>

                  {/* Metadata Header Surat */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-800 text-xs">Identitas &amp; Metadata Surat Dinas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nomor Surat</label>
                        <input
                          type="text"
                          value={tteDocData.nomorSurat}
                          onChange={(e) => setTteDocData({ ...tteDocData, nomorSurat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Lampiran</label>
                        <input
                          type="text"
                          value={tteDocData.lampiran}
                          onChange={(e) => setTteDocData({ ...tteDocData, lampiran: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Perihal / Hal</label>
                        <input
                          type="text"
                          value={tteDocData.hal}
                          onChange={(e) => setTteDocData({ ...tteDocData, hal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tempat &amp; Tanggal Surat</label>
                        <input
                          type="text"
                          value={tteDocData.tempatTanggal}
                          onChange={(e) => setTteDocData({ ...tteDocData, tempatTanggal: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tujuan / Penerima (Yth.) */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Tujuan Surat (Yth.)</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Nama / Jabatan Penerima (Yth.)</label>
                      <input
                        type="text"
                        value={tteDocData.tujuanUtama}
                        onChange={(e) => setTteDocData({ ...tteDocData, tujuanUtama: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Instansi / Unit Penerima</label>
                        <input
                          type="text"
                          value={tteDocData.tujuanDetail}
                          onChange={(e) => setTteDocData({ ...tteDocData, tujuanDetail: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Kota / Alamat</label>
                        <input
                          type="text"
                          value={tteDocData.tujuanKota}
                          onChange={(e) => setTteDocData({ ...tteDocData, tujuanKota: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Isi Naskah Dinas: Pembuka, Narasi/Poin, Penutup */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                    <p className="font-bold text-slate-800 text-xs">Batang Tubuh Naskah Dinas</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">Kalimat Pembuka</label>
                      <textarea
                        rows={2}
                        value={tteDocData.kalimatPembuka}
                        onChange={(e) => setTteDocData({ ...tteDocData, kalimatPembuka: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">
                        Isi Surat (Pisahkan poin narasi dengan baris baru)
                      </label>
                      <textarea
                        rows={4}
                        value={tteDocData.isiText}
                        onChange={(e) => setTteDocData({ ...tteDocData, isiText: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold">Kalimat Penutup</label>
                      <textarea
                        rows={2}
                        value={tteDocData.kalimatPenutup}
                        onChange={(e) => setTteDocData({ ...tteDocData, kalimatPenutup: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Penandatangan Naskah */}
                  <div className="p-3 bg-slate-100 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800 text-xs">Penandatangan TTE</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Jabatan</label>
                        <input
                          type="text"
                          value={tteDocData.namaJabatan}
                          onChange={(e) => setTteDocData({ ...tteDocData, namaJabatan: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Nama Pejabat</label>
                        <input
                          type="text"
                          value={tteDocData.namaPejabat}
                          onChange={(e) => setTteDocData({ ...tteDocData, namaPejabat: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">NIP Pejabat</label>
                        <input
                          type="text"
                          value={tteDocData.nip}
                          onChange={(e) => setTteDocData({ ...tteDocData, nip: e.target.value })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="tte-specimen"
                        checked={tteDocData.tteVerified}
                        onChange={(e) => setTteDocData({ ...tteDocData, tteVerified: e.target.checked })}
                        className="rounded text-unsil-green-800"
                      />
                      <label htmlFor="tte-specimen" className="text-xs text-slate-700 cursor-pointer">
                        Sertifikasi Tanda Tangan Elektronik (TTE) BSrE &amp; Spesimen QR Code Aktif
                      </label>
                    </div>
                  </div>

                  {/* Tembusan */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Tembusan (Satu baris per penerima tembusan):
                    </label>
                    <textarea
                      rows={3}
                      value={tteDocData.tembusanText}
                      onChange={(e) => setTteDocData({ ...tteDocData, tembusanText: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs"
                      placeholder="Masukkan daftar tembusan..."
                    />
                  </div>
                </div>
              )}

              {/* =============================================================
                  BAGIAN PENERIMA DAN DISTRIBUSI (SELARAS DENGAN TEMA SISTEM)
                  ============================================================= */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs text-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-unsil-green-950 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-unsil-green-800" />
                    Penerima dan Distribusi
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Setelah ditandatangani, sistem meregistrasi dan mengirim naskah otomatis ke penerima di bawah. TU hanya menangani kiriman fisik dan naskah Rahasia.
                  </p>
                </div>

                {/* Unit penerima */}
                <fieldset className="border border-slate-200 rounded-lg p-3 pt-1.5 bg-slate-50/60">
                  <legend className="text-xs text-slate-700 px-1.5 font-semibold">Unit penerima</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2.5 gap-x-4 pt-1">
                    {DISTRIBUSI_GRID_UNITS.map((unit) => {
                      const isChecked = distribusiData.unitPenerima.includes(unit.label);
                      return (
                        <label
                          key={`penerima-${unit.id}`}
                          className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDistribusiUnitPenerima(unit.label)}
                            className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                          />
                          <span>{unit.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Masuk di unit penerima sebagai */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Masuk di unit penerima sebagai
                  </label>
                  <select
                    value={distribusiData.masukSebagai}
                    onChange={(e) => setDistribusiData({ ...distribusiData, masukSebagai: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition cursor-pointer font-medium"
                  >
                    <option value="Disposisi">Disposisi</option>
                    <option value="Koordinasi">Koordinasi</option>
                    <option value="Arahan">Arahan</option>
                  </select>
                </div>

                {/* Tembusan ke unit */}
                <fieldset className="border border-slate-200 rounded-lg p-3 pt-1.5 bg-slate-50/60">
                  <legend className="text-xs text-slate-700 px-1.5 font-semibold">Tembusan ke unit</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2.5 gap-x-4 pt-1">
                    {DISTRIBUSI_GRID_UNITS.map((unit) => {
                      const isChecked = distribusiData.tembusanUnit.includes(unit.label);
                      return (
                        <label
                          key={`tembusan-${unit.id}`}
                          className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDistribusiTembusanUnit(unit.label)}
                            className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                          />
                          <span>{unit.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Sivitas akademika */}
                <fieldset className="border border-slate-200 rounded-lg p-3 pt-1.5 bg-slate-50/60">
                  <legend className="text-xs text-slate-700 px-1.5 font-semibold">Sivitas akademika</legend>
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={distribusiData.sivitasAkademika.dosen}
                        onChange={(e) =>
                          setDistribusiData({
                            ...distribusiData,
                            sivitasAkademika: { ...distribusiData.sivitasAkademika, dosen: e.target.checked }
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                      />
                      <span>Dosen</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={distribusiData.sivitasAkademika.tendik}
                        onChange={(e) =>
                          setDistribusiData({
                            ...distribusiData,
                            sivitasAkademika: { ...distribusiData.sivitasAkademika, tendik: e.target.checked }
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                      />
                      <span>Tendik</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={distribusiData.sivitasAkademika.mahasiswa}
                        onChange={(e) =>
                          setDistribusiData({
                            ...distribusiData,
                            sivitasAkademika: { ...distribusiData.sivitasAkademika, mahasiswa: e.target.checked }
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                      />
                      <span>Mahasiswa</span>
                    </label>
                  </div>
                </fieldset>

                {/* Umum (posel) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 block">Umum (posel)</label>
                  <input
                    type="text"
                    value={distribusiData.umumPosel}
                    onChange={(e) => setDistribusiData({ ...distribusiData, umumPosel: e.target.value })}
                    placeholder="Pisahkan dengan koma"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
                  />
                </div>

                {/* Juga dikirim fisik */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={distribusiData.jugaDikirimFisik}
                      onChange={(e) => setDistribusiData({ ...distribusiData, jugaDikirimFisik: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                    />
                    <span>Juga dikirim fisik</span>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* RIGHT: LIVE PREVIEW A4 (Hidden if form only) */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={`${
                viewMode === 'split' ? 'w-full lg:w-1/2' : 'w-full'
              } p-4 sm:p-6 overflow-y-auto bg-slate-200/70 flex flex-col items-center`}
            >
              <div className="w-full max-w-4xl flex flex-wrap items-center justify-between mb-3 text-xs text-slate-500 gap-2">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-unsil-green-800" /> Pratinjau Lembar Naskah Dinas ({currentPaperInfo.code})
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-xs flex items-center gap-1 ${
                    kopConfig.isTingkatUniversitas
                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                      : 'bg-purple-50 text-purple-900 border-purple-300'
                  }`}>
                    Kop: {kopConfig.isTingkatUniversitas ? 'Tingkat Universitas (Pasal 30(2))' : `Unit: ${kopConfig.unitObj?.singkatan || 'Unit Kerja'} (Pasal 31)`}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-xs flex items-center gap-1.5 ${
                    currentPaperInfo.isF4
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentPaperInfo.isF4 ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'}`} />
                    Kertas: {currentPaperInfo.badgeLabel} ({currentPaperInfo.gramatur || 'HVS min. 70g'})
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs bg-indigo-50 text-indigo-900 border-indigo-300"
                    title="Jenis dan Ukuran Huruf Naskah Dinas sesuai Peraturan Rektor UNSIL No. 3 Tahun 2023 Pasal 43–48"
                  >
                    Huruf: {currentPaperInfo.fontFamilyLabel || (currentPaperInfo.isF4 ? 'Bookman Old Style 12pt' : 'Times New Roman / Arial 12pt')}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs bg-teal-50 text-teal-900 border-teal-300"
                    title="Pengaturan Ruang Tepi Naskah Dinas sesuai Pasal 47 Peraturan Rektor UNSIL No. 3 Tahun 2023"
                  >
                    {(selectedTemplate === 'ts' ? Boolean(tsData?.showKopSurat) : currentPaperInfo?.pasal47?.hasKop !== false)
                      ? 'Pasal 47 • Tepi Atas: 1 Spasi di bawah Kop (4,5 cm) • Bawah/Kiri/Kanan: 1,5 cm'
                      : 'Pasal 47 • Tepi Atas: 2 cm (Tanpa Kop) • Bawah/Kiri/Kanan: 1,5 cm'}
                  </span>
                </div>
              </div>

              {/* Document Paper Renderer */}
              <div
                id="builder-printable-area"
                data-paper-size={currentPaperInfo.code}
                data-template-id={selectedTemplate}
                data-has-kop={String(selectedTemplate === 'ts' ? Boolean(tsData?.showKopSurat) : currentPaperInfo?.pasal47?.hasKop !== false)}
                className={`w-full transition-all printable-document ${currentPaperInfo.isF4 ? 'f4-document' : 'a4-document'}`}
              >
                {selectedTemplate === 'pos' && <PosTemplateView data={currentPosRenderData} />}
                {selectedTemplate === 'se' && <SuratEdaranTemplateView data={currentSeRenderData} />}
                {selectedTemplate === 'sk' && <KeputusanTemplateView data={currentSkRenderData} />}
                {selectedTemplate === 'sp' && <SuratPerintahTemplateView data={currentSpRenderData} />}
                {selectedTemplate === 'st_lembar' && <SuratTugasLembaranTemplateView data={currentStLembarRenderData} />}
                {selectedTemplate === 'st_kolom' && <SuratTugasKolomTemplateView data={currentStKolomRenderData} />}
                {selectedTemplate === 'nd' && <NotaDinasTemplateView data={currentNdRenderData} />}
                {selectedTemplate === 'sd' && <SuratDinasTemplateView data={currentSdRenderData} />}
                {selectedTemplate === 'undangan_lembar' && (
                  <SuratUndanganLembaranTemplateView data={currentUndanganLembarRenderData} />
                )}
                {selectedTemplate === 'undangan_kartu' && (
                  <SuratUndanganKartuTemplateView data={currentUndanganKartuRenderData} />
                )}
                {selectedTemplate === 'mou' && (
                  <NotaKesepahamanTemplateView data={currentMouRenderData} />
                )}
                {selectedTemplate === 'pks' && (
                  <PerjanjianKerjaSamaTemplateView data={currentPksRenderData} />
                )}
                {selectedTemplate === 'skua' && (
                  <SuratKuasaTemplateView data={currentSkuaRenderData} />
                )}
                {selectedTemplate === 'ba' && (
                  <BeritaAcaraTemplateView data={currentBaRenderData} />
                )}
                {selectedTemplate === 'sket' && (
                  <SuratKeteranganTemplateView data={currentSketRenderData} />
                )}
                {selectedTemplate === 'sper' && (
                  <SuratPernyataanTemplateView data={currentSperRenderData} />
                )}
                {selectedTemplate === 'speng' && (
                  <SuratPengantarTemplateView data={currentSpengRenderData} />
                )}
                {selectedTemplate === 'peng' && (
                  <PengumumanTemplateView data={currentPengRenderData} />
                )}
                {selectedTemplate === 'notula' && (
                  <NotulaTemplateView data={currentNotulaRenderData} />
                )}
                {selectedTemplate === 'lap' && (
                  <LaporanTemplateView data={currentLapRenderData} />
                )}
                {selectedTemplate === 'ts' && (
                  <TelaahStafTemplateView data={currentTsRenderData} />
                )}
                {selectedTemplate === 'disp_rektor' && (
                  <DisposisiRektorTemplateView data={currentDispRektorRenderData} />
                )}
                {selectedTemplate === 'tte_doc' && (
                  <PenggunaanTteTemplateView data={currentTteDocRenderData} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Format diverifikasi sesuai Tata Naskah Dinas & JRA PermenPAN-RB</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition border ${
                securityTriggerMeta.isPrintBlocked
                  ? 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title={
                securityTriggerMeta.isPrintBlocked
                  ? 'Opsi Cetak Umum Diblokir untuk Naskah Rahasia/Sangat Rahasia (SKKAAD)'
                  : `Cetak / Ekspor PDF Otomatis (${currentPaperInfo.code})`
              }
            >
              <Printer className={`w-4 h-4 ${securityTriggerMeta.isPrintBlocked ? 'text-red-600' : 'text-slate-600'}`} />
              <span>
                {securityTriggerMeta.isPrintBlocked
                  ? `Cetak Umum Diblokir (${securityTriggerMeta.tingkatKeamanan})`
                  : `Cetak / Ekspor PDF (${currentPaperInfo.code})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSaveToSiloka}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-bold shadow-md shadow-unsil-green-950/20 transition transform active:scale-[0.99]"
            >
              <Save className="w-4 h-4 text-unsil-gold-400" />
              <span>Simpan & Daftarkan ke SILOKA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
