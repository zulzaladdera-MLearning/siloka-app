import React, { useState, useEffect, useMemo } from 'react';
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
  Layers
} from 'lucide-react';
import unitKerjaList from '../../data/unitKerja.json';
import { printDocument } from '../../utils/printDocument';

// Daftar Template Standar Naskah Dinas Staf / Unit Kerja
const TEMPLATES = [
  {
    id: 'surat-dinas',
    name: 'Surat Dinas (Standar)',
    icon: Mail,
    desc: 'Surat resmi kedinasan eksternal/antar unit',
    defaultKlasifikasi: 'KU',
    defaultPerihal: 'Permohonan Koordinasi dan Fasilitasi Kerja Sama Program Penguatan Riset',
    defaultPembuka: 'Sehubungan dengan pelaksanaan program penguatan kerja sama riset dan tata kelola anggaran tahun anggaran berjalan, bersama ini kami sampaikan permohonan koordinasi dan fasilitasi terkait pelaksanaan kegiatan dimaksud yang akan diselenggarakan pada:',
    defaultIsi: '1. Hari/Tanggal : Senin, 21 September 2026\n2. Waktu : Pukul 09.00 WIB s.d. selesai\n3. Tempat : Ruang Rapat Unit Kerja Lantai 2 Kampus UNSIL\n4. Agenda : Koordinasi Penyusunan Laporan dan Verifikasi SPJ Keuangan Triwulan III',
    defaultPenutup: 'Mengingat pentingnya koordinasi tersebut, kami sangat mengharapkan kehadiran dan kerja sama Saudara. Atas perhatian dan perkenan yang diberikan, kami ucapkan terima kasih.',
    defaultTujuan: 'Kepala Biro Keuangan dan Umum Universitas Siliwangi',
    defaultAlamatTujuan: 'Kota Tasikmalaya'
  },
  {
    id: 'nota-dinas',
    name: 'Nota Dinas (Internal)',
    icon: FileText,
    desc: 'Komunikasi kedinasan internal antar pejabat dalam satu unit',
    defaultKlasifikasi: 'KU',
    defaultPerihal: 'Laporan Pertanggungjawaban Realisasi Anggaran Operasional Unit',
    defaultPembuka: 'Bersama ini kami laporkan perkembangan realisasi anggaran operasional dan belanja pemeliharaan sarana prasarana unit kerja dengan rincian sebagai berikut:',
    defaultIsi: '1. Seluruh berkas kuitansi dan dokumen perpajakan telah diverifikasi oleh staf pengelola keuangan unit.\n2. Alokasi belanja kegiatan telah sesuai dengan Rencana Kerja dan Anggaran (RKA) tahun berjalan.\n3. Berkas digital SPJ telah terunggah secara lengkap pada sistem kearsipan SILOKA.',
    defaultPenutup: 'Demikian nota dinas ini kami sampaikan sebagai bahan pertimbangan dan arahan lebih lanjut dari Bapak. Atas arahan dan perkenan yang diberikan, kami haturkan terima kasih.',
    defaultTujuan: 'Pimpinan Unit Kerja / Dekan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'undangan',
    name: 'Surat Undangan Dinas',
    icon: Calendar,
    desc: 'Undangan rapat dinas, sosialisasi, dan koordinasi kedinasan',
    defaultKlasifikasi: 'HM',
    defaultPerihal: 'Undangan Rapat Evaluasi Kinerja dan Tata Kelola Persuratan Digital',
    defaultPembuka: 'Dalam rangka meningkatkan tertib administrasi persuratan dan percepatan implementasi Tanda Tangan Elektronik (TTE) di lingkungan unit kerja, kami mengundang Saudara untuk hadir pada rapat yang diselenggarakan pada:',
    defaultIsi: 'Hari/Tanggal : Rabu, 16 September 2026\nWaktu        : Pukul 09.30 - 12.00 WIB\nTempat       : Ruang Sidang Utama Kampus UNSIL\nAcara        : Evaluasi Pengendalian Naskah Dinas Elektronik SILOKA',
    defaultPenutup: 'Kehadiran Saudara tepat pada waktunya sangat kami harapkan demi kelancaran agenda tersebut. Atas perhatian dan kerja sama Saudara, kami sampaikan terima kasih.',
    defaultTujuan: 'Para Ketua Jurusan / Koordinator Program Studi',
    defaultAlamatTujuan: 'Di Lingkungan Universitas Siliwangi'
  },
  {
    id: 'tugas',
    name: 'Surat Tugas Pelaksana',
    icon: Layers,
    desc: 'Penugasan staf/pegawai untuk menjalankan kegiatan kedinasan',
    defaultKlasifikasi: 'KP',
    defaultPerihal: 'Penugasan Pelaksanaan Bimbingan Teknis Kearsipan dan TTE BSrE',
    defaultPembuka: 'Pimpinan unit kerja dengan ini menugaskan kepada pegawai yang namanya tercantum di bawah ini:',
    defaultIsi: 'Nama : Staf Pelaksana Administrasi Persuratan\nNIP  : 198809152014042001\nUntuk : Mengikuti Bimbingan Teknis Pengelolaan Arsip Dinamis dan Penerapan TTE BSrE di Bandung pada tanggal 22-24 September 2026.',
    defaultPenutup: 'Surat tugas ini diberikan untuk dilaksanakan dengan penuh rasa tanggung jawab dan setelah selesai melaksanakan tugas agar segera menyampaikan laporan tertulis.',
    defaultTujuan: 'Pegawai yang Bersangkutan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'keterangan',
    name: 'Surat Keterangan',
    icon: CheckCircle,
    desc: 'Keterangan resmi keaktifan pegawai atau status kedinasan',
    defaultKlasifikasi: 'PP',
    defaultPerihal: 'Surat Keterangan Bebas Administrasi dan Perlengkapan',
    defaultPembuka: 'Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa:',
    defaultIsi: 'Nama      : Siti Rohmah, S.AP.\nNIP       : 198809152014042001\nJabatan   : Staf Persuratan dan Kearsipan\nUnit Kerja: Biro Keuangan dan Umum UNSIL\n\nAdalah benar telah menyelesaikan seluruh kewajiban administrasi persuratan dan inventaris BMN dengan baik dan tidak memiliki tanggungan dinas.',
    defaultPenutup: 'Demikian surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
    defaultTujuan: 'Pihak yang Berkepentingan',
    defaultAlamatTujuan: 'Di Tempat'
  },
  {
    id: 'pengantar',
    name: 'Surat Pengantar Berkas',
    icon: Send,
    desc: 'Pengantar pengiriman naskah, berkas SPJ, atau laporan dinas',
    defaultKlasifikasi: 'KU',
    defaultPerihal: 'Penyampaian Berkas Usulan Pencairan Anggaran Operasional',
    defaultPembuka: 'Bersama surat ini, kami sampaikan berkas usulan pencairan anggaran operasional dengan perincian berkas sebagai berikut:',
    defaultIsi: '1. Rencana Penggunaan Dana (RPD) Triwulan III - 1 (satu) Berkas (Asli)\n2. Bukti Kuitansi Pengeluaran Riil - 1 (satu) Berkas (Asli)\n3. Berita Acara Verifikasi Internal - 1 (satu) Lembar (Asli)',
    defaultPenutup: 'Demikian untuk diketahui dan diproses sesuai dengan peraturan perundang-undangan yang berlaku. Atas kerja sama yang baik, kami sampaikan terima kasih.',
    defaultTujuan: 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    defaultAlamatTujuan: 'Universitas Siliwangi'
  }
];

export const CreateLetterModal = ({ isOpen, onClose, onSaveLetter, currentUser }) => {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const generateRandomSeq = () => String(Math.floor(100 + Math.random() * 900)).padStart(4, '0');

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
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState('KU');
  const [nomorUrut, setNomorUrut] = useState(generateRandomSeq);
  const [nomorSuratAsal, setNomorSuratAsal] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [perihal, setPerihal] = useState(TEMPLATES[0].defaultPerihal);
  const [kategori, setKategori] = useState('Surat Keluar');
  const [kategoriKeamanan, setKategoriKeamanan] = useState('Biasa/Terbuka');
  const [sifatSurat, setSifatSurat] = useState('Biasa');
  const [lampiran, setLampiran] = useState('1 (satu) Berkas');
  const [pengirim, setPengirim] = useState(defaultUnit.nama_unit);
  const [tujuan, setTujuan] = useState(TEMPLATES[0].defaultTujuan);
  const [alamatTujuan, setAlamatTujuan] = useState(TEMPLATES[0].defaultAlamatTujuan);
  const [kalimatPembuka, setKalimatPembuka] = useState(TEMPLATES[0].defaultPembuka);
  const [isiPokok, setIsiPokok] = useState(TEMPLATES[0].defaultIsi);
  const [kalimatPenutup, setKalimatPenutup] = useState(TEMPLATES[0].defaultPenutup);

  // Penandatangan Kedinasan
  const [namaJabatanSigner, setNamaJabatanSigner] = useState(
    currentUser?.role === 'PEJABAT' ? currentUser?.roleLabel : `Kepala ${defaultUnit.nama_unit}`
  );
  const [namaPejabatSigner, setNamaPejabatSigner] = useState(
    currentUser?.role === 'PEJABAT' ? currentUser?.nama_lengkap || currentUser?.name : 'Dr. Nana Sujana, Drs., M.Si.'
  );
  const [nipSigner, setNipSigner] = useState(
    currentUser?.role === 'PEJABAT' ? currentUser?.nip_nik || currentUser?.nip : '196808301989031004'
  );
  const [tteVerified, setTteVerified] = useState(true);
  const [tembusanText, setTembusanText] = useState(
    '1. Rektor Universitas Siliwangi (sebagai laporan)\n2. Kepala Satuan Pengawas Internal (SPI)'
  );

  // Berkas Lampiran Pindaian
  const [uploadedFileName, setUploadedFileName] = useState('Naskah_Dinas_Resmi.pdf');
  const [uploadedFileSize, setUploadedFileSize] = useState('2.4 MB');

  useEffect(() => {
    if (currentUser?.unit_kerja_id) {
      const found = unitKerjaList.find(
        (u) => u.kode_unit === currentUser.unit_kerja_id || u.id === currentUser.unit_kerja_id
      );
      if (found) {
        setSelectedUnitCode(found.kode_unit);
        setPengirim(found.nama_unit);
        if (currentUser.role === 'PEJABAT') {
          setNamaJabatanSigner(currentUser.roleLabel || `Kepala ${found.nama_unit}`);
          setNamaPejabatSigner(currentUser.nama_lengkap || currentUser.name);
          setNipSigner(currentUser.nip_nik || currentUser.nip);
        } else {
          setNamaJabatanSigner(found.tipe_unit === 'FAKULTAS' ? `Dekan ${found.nama_unit}` : `Kepala ${found.nama_unit}`);
        }
      }
    }
  }, [currentUser]);

  const activeUnitObj = useMemo(() => {
    return unitKerjaList.find((u) => u.kode_unit === selectedUnitCode) || defaultUnit;
  }, [selectedUnitCode, defaultUnit]);

  const isUnitLocked =
    currentUser?.role === 'OPERATOR_UNIT' || currentUser?.role === 'STAF_PERSURATAN';

  // Rumus Penomoran Otomatis Kedinasan UNSIL:
  // [Nomor Urut]/[Kode Unit]/[Kode Klasifikasi]/[Tahun]
  const generatedNomorSurat = `${nomorUrut}/${activeUnitObj.kode_unit}/${kodeKlasifikasi}/${currentYear}`;

  // Handler pergantian template
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setPerihal(tpl.defaultPerihal);
    setKalimatPembuka(tpl.defaultPembuka);
    setIsiPokok(tpl.defaultIsi);
    setKalimatPenutup(tpl.defaultPenutup);
    setTujuan(tpl.defaultTujuan);
    setAlamatTujuan(tpl.defaultAlamatTujuan);
    setKodeKlasifikasi(tpl.defaultKlasifikasi);
  };

  const handlePrint = () => {
    printDocument('siloka-create-letter-a4-preview', `Naskah_Dinas_${generatedNomorSurat.replace(/\//g, '_')}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!perihal.trim() || !pengirim.trim()) {
      alert('Mohon lengkapi perihal dan instansi pengirim!');
      return;
    }

    onSaveLetter({
      id: `SRT-${currentYear}-${nomorUrut}`,
      nomorSurat: generatedNomorSurat,
      nomorSuratAsal: nomorSuratAsal || '-',
      tanggal,
      perihal,
      kategori,
      sifat: sifatSurat,
      kategoriKeamanan,
      kodeKlasifikasi,
      subKlasifikasi: `${kodeKlasifikasi}.01.00`,
      pengirim,
      tujuan,
      status: 'Dikirim',
      statusTimestamp: 'Baru saja diinput staf',
      ringkasan: `${kalimatPembuka} ${isiPokok.replace(/\n/g, ' ')}`,
      lampiran: `${uploadedFileName} (${uploadedFileSize})`,
      tteVerified: tteVerified,
      unit_kerja_id: activeUnitObj.kode_unit,
      created_by_user_id: currentUser?.id || 'usr-02',
      created_at: new Date().toISOString(),
      riwayatParaf: [
        {
          nama: currentUser?.nama_lengkap || currentUser?.name || 'Staf Pelaksana Persuratan',
          jabatan: currentUser?.roleLabel || 'Operator Unit',
          waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
          catatan: `Registrasi naskah ${TEMPLATES.find((t) => t.id === selectedTemplateId)?.name || 'Surat Dinas'} melalui modul staf`
        }
      ],
      disposisi: null
    });
    onClose();
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
                title="Tampilan Pratinjau Kertas A4"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>
            </div>

            {/* Tombol Cetak Dokumen A4 */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors shadow-xs"
              title="Cetak Langsung Lembar A4 (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5 text-unsil-gold-300" />
              <span className="hidden md:inline">Cetak A4</span>
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

        {/* TEMPLATE SELECTOR BAR */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-unsil-green-800" />
            Template:
          </span>
          <div className="flex items-center gap-1.5">
            {TEMPLATES.map((tpl) => {
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

        {/* MODAL BODY (SPLIT VIEW / FORM / PREVIEW) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* SISI KIRI: FORMULIR INPUT */}
          {(viewMode === 'split' || viewMode === 'form') && (
            <div
              className={`overflow-y-auto p-5 space-y-4 text-xs text-slate-700 border-r border-slate-200 bg-white ${
                viewMode === 'split' ? 'w-full md:w-[46%] shrink-0' : 'w-full'
              }`}
            >
              {/* Rumus Penomoran Otomatis Display */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-unsil-green-900 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    Nomor Surat Otomatis Tergenerasi (Sistem Rumus)
                  </span>
                  <button
                    type="button"
                    onClick={() => setNomorUrut(generateRandomSeq())}
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-800 hover:text-emerald-950 font-semibold"
                    title="Acak / Perbarui Nomor Urut"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Nomor</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs">
                    {generatedNomorSurat}
                  </span>
                  <span className="text-[10px] text-emerald-900 font-semibold bg-emerald-100/90 px-2 py-1 rounded border border-emerald-200">
                    Standar BKU UNSIL
                  </span>
                </div>
              </div>

              {/* Grid Metadata Surat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Unit Kerja Asal */}
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
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {unitKerjaList.map((u) => (
                      <option key={u.kode_unit} value={u.kode_unit}>
                        {u.kode_unit} - {u.singkatan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Klasifikasi Arsip */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Klasifikasi Arsip
                  </label>
                  <select
                    value={kodeKlasifikasi}
                    onChange={(e) => setKodeKlasifikasi(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-unsil-green-900 font-mono"
                  >
                    <option value="KU">KU (Keuangan & Anggaran)</option>
                    <option value="PL">PL (Perlengkapan & BMN)</option>
                    <option value="KR">KR (Kerumahtanggaan & Sarpras)</option>
                    <option value="PP">PP (Pendidikan & Pengajaran)</option>
                    <option value="KP">KP (Kepegawaian & SDM)</option>
                    <option value="HM">HM (Humas & Protokoler)</option>
                  </select>
                </div>

                {/* Kategori Keamanan */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Kategori Keamanan
                  </label>
                  <select
                    value={kategoriKeamanan}
                    onChange={(e) => setKategoriKeamanan(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Biasa/Terbuka">Biasa / Terbuka</option>
                    <option value="Terbatas">Terbatas</option>
                    <option value="Rahasia">Rahasia</option>
                    <option value="Sangat Rahasia">Sangat Rahasia</option>
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

              {/* Penandatangan Kedinasan */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Penandatangan & Otoritas TTE BSrE
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tteVerified}
                      onChange={(e) => setTteVerified(e.target.checked)}
                      className="rounded text-unsil-green-800 w-3.5 h-3.5"
                    />
                    <span>Verifikasi TTE Aktif</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Jabatan</label>
                    <input
                      type="text"
                      value={namaJabatanSigner}
                      onChange={(e) => setNamaJabatanSigner(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nama Pejabat</label>
                    <input
                      type="text"
                      value={namaPejabatSigner}
                      onChange={(e) => setNamaPejabatSigner(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">NIP Pejabat</label>
                    <input
                      type="text"
                      value={nipSigner}
                      onChange={(e) => setNipSigner(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
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

              {/* Unggah Pindaian PDF */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Unggah Dokumen Lampiran Resmi (PDF Maks. 5MB)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-unsil-green-700 rounded-xl p-3 text-center bg-slate-50/50 cursor-pointer transition-colors">
                  <UploadCloud className="w-6 h-6 text-unsil-green-800 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-800">
                    {uploadedFileName} <span className="text-slate-400 font-normal">({uploadedFileSize})</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hash SHA-256 terenkripsi. Klik untuk mengganti dokumen lampiran.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SISI KANAN: PRATINJAU LEMBAR KERTAS A4 */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div
              className={`flex-1 overflow-y-auto overflow-x-auto bg-slate-200/90 p-2 sm:p-8 flex justify-center items-start shadow-inner ${
                viewMode === 'split' ? 'w-full md:w-[54%]' : 'w-full'
              }`}
            >
              <div
                id="siloka-create-letter-a4-preview"
                className="printable-document bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-2xl border border-slate-300 rounded-xs text-black font-serif text-[11.5px] leading-relaxed flex flex-col justify-between"
                style={{ minHeight: '297mm' }}
              >
                {/* BAGIAN ATAS DOKUMEN */}
                <div>
                  {/* Kop Surat Resmi Universitas Siliwangi */}
                  <div className="mb-4 pb-0 text-black font-serif">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Logo Resmi UNSIL */}
                      <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] shrink-0 flex items-center justify-center select-none protected-asset">
                        <img
                          src="/unsil-logo.png"
                          alt="Logo Resmi Universitas Siliwangi"
                          className="w-full h-full object-contain select-none pointer-events-none protected-asset"
                          draggable="false"
                        />
                      </div>

                      {/* Header Teks Kemendikbudristek / UNSIL */}
                      <div className="flex-1 text-center font-serif leading-tight pr-2">
                        <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-normal text-black leading-snug">
                          KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
                        </p>
                        <h1 className="text-[13px] sm:text-[15px] font-bold uppercase tracking-normal text-black mt-0.5 leading-snug">
                          UNIVERSITAS SILIWANGI
                        </h1>
                        {activeUnitObj.tipe_unit !== 'UNIVERSITAS' && (
                          <h2 className="text-[12px] sm:text-[14px] font-bold uppercase tracking-normal text-black mt-0.5 leading-snug">
                            {activeUnitObj.nama_unit.toUpperCase()}
                          </h2>
                        )}
                        <p className="text-[9.5px] sm:text-[10.5px] text-black font-normal mt-1 leading-tight">
                          Jalan Siliwangi Nomor 24 Kota Tasikmalaya Kode Pos 46115
                        </p>
                        <p className="text-[9.5px] sm:text-[10.5px] text-black font-normal mt-0.5 leading-tight">
                          Telepon (0265) 330634, 333092 Faksimil (0265) 325812
                        </p>
                        <p className="text-[9.5px] sm:text-[10.5px] text-black font-normal mt-0.5 leading-tight">
                          Laman: www.unsil.ac.id Posel: info@unsil.ac.id
                        </p>
                      </div>
                    </div>

                    {/* Garis Pembatas Ganda Kop Surat */}
                    <div className="mt-2 border-b-[2.5px] border-black w-full" />
                    <div className="mt-0.5 border-b-[0.8px] border-black w-full" />
                  </div>

                  {/* Format Khusus jika Nota Dinas */}
                  {selectedTemplateId === 'nota-dinas' ? (
                    <div className="my-4">
                      <div className="text-center my-2">
                        <h2 className="text-sm sm:text-base font-bold tracking-widest uppercase text-black">
                          NOTA DINAS
                        </h2>
                        <p className="font-mono text-xs font-bold tracking-wider text-black mt-0.5">
                          Nomor: {generatedNomorSurat}
                        </p>
                      </div>

                      <div className="my-3 font-serif text-[11px] border-b border-black pb-2 space-y-1">
                        <div className="flex items-start">
                          <span className="w-16 font-bold shrink-0">Yth.</span>
                          <span className="w-4 shrink-0">:</span>
                          <span className="flex-1 font-medium text-black">{tujuan}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-16 font-bold shrink-0">Dari</span>
                          <span className="w-4 shrink-0">:</span>
                          <span className="flex-1 font-medium text-black">{pengirim}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-16 font-bold shrink-0">Hal</span>
                          <span className="w-4 shrink-0">:</span>
                          <span className="flex-1 font-bold text-black">{perihal}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-16 font-bold shrink-0">Tanggal</span>
                          <span className="w-4 shrink-0">:</span>
                          <span className="flex-1 text-black">{formattedDateA4}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Format Standar Surat Dinas / Undangan / Pengantar / Tugas */
                    <div className="my-3">
                      <div className="flex items-start justify-between my-2 font-serif text-[11px] leading-tight">
                        <div className="space-y-1">
                          <div className="flex items-baseline">
                            <span className="w-20 font-bold shrink-0">Nomor</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-mono text-black font-bold">{generatedNomorSurat}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-20 font-bold shrink-0">Sifat</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="text-black">{sifatSurat}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-20 font-bold shrink-0">Lampiran</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="text-black">{lampiran}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-20 font-bold shrink-0">Hal</span>
                            <span className="w-4 shrink-0">:</span>
                            <span className="font-bold text-black">{perihal}</span>
                          </div>
                        </div>

                        <div className="text-right font-serif text-[11px] text-black pt-0.5">
                          <p>Tasikmalaya, {formattedDateA4}</p>
                        </div>
                      </div>

                      {/* Tujuan Surat (Yth.) */}
                      <div className="my-3 font-serif text-[11.5px] leading-snug">
                        <p className="font-bold text-black">Yth. {tujuan}</p>
                        <p className="text-black">{alamatTujuan}</p>
                      </div>
                    </div>
                  )}

                  {/* Kalimat Pembuka */}
                  <div className="my-3 text-justify font-serif text-[11.5px] leading-normal">
                    <p>{kalimatPembuka}</p>
                  </div>

                  {/* Isi Pokok Naskah */}
                  <div className="my-3 font-serif text-[11.5px] leading-relaxed text-justify whitespace-pre-line pl-1">
                    {isiPokok}
                  </div>

                  {/* Kalimat Penutup */}
                  <div className="my-3 text-justify font-serif text-[11.5px] leading-relaxed">
                    <p>{kalimatPenutup}</p>
                  </div>
                </div>

                {/* BAGIAN BAWAH: TANDA TANGAN & TEMBUSAN */}
                <div className="mt-8 font-serif">
                  {/* Blok Tanda Tangan di Kanan */}
                  <div className="flex justify-end">
                    <div className="w-72 sm:w-80 text-left">
                      <p className="font-semibold text-xs text-black">{namaJabatanSigner},</p>

                      <div className="my-2 min-h-[56px] flex flex-col justify-center">
                        {tteVerified ? (
                          <div className="p-2 rounded-lg border-2 border-emerald-700 bg-emerald-50/60 text-[9.5px] text-emerald-950 flex items-center gap-2.5 shadow-xs">
                            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
                              <QrCode className="w-5 h-5 text-unsil-gold-300" />
                            </div>
                            <div>
                              <p className="font-bold leading-tight">Ditandatangani Secara Elektronik</p>
                              <p className="text-[8.5px] text-emerald-800 font-mono">
                                Balai Sertifikasi Elektronik (BSrE BSSN)
                              </p>
                              <p className="text-[8px] text-slate-500 font-mono">
                                Verifikasi: siloka.unsil.ac.id/v/{nomorUrut}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-12 flex items-center text-slate-400 italic text-[10px]">
                            (Ruang tanda tangan dan cap dinas)
                          </div>
                        )}
                      </div>

                      <p className="font-bold text-xs text-black underline">{namaPejabatSigner}</p>
                      <p className="text-[10.5px] text-black">NIP {nipSigner}</p>
                    </div>
                  </div>

                  {/* Tembusan di Kiri Bawah */}
                  {tembusanList.length > 0 && (
                    <div className="mt-4 pt-2 border-t border-slate-200 text-left text-[10px] text-black">
                      <p className="font-bold mb-0.5">Tembusan:</p>
                      <ol className="list-decimal list-inside space-y-0.5 pl-0.5 text-slate-800">
                        {tembusanList.map((t, idx) => (
                          <li key={idx}>{t.replace(/^\d+\.\s*/, '')}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Watermark Legalitas BSrE */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                    <span>SILOKA UNSIL - Sistem Informasi Layanan Otomasi Kearsipan & Persuratan</span>
                    <span>Sesuai Standar Tata Naskah Dinas Perpres & Perka ANRI</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">Format: <strong>{TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}</strong></span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Nomor: <strong className="font-mono text-slate-800">{generatedNomorSurat}</strong></span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-center"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Pratinjau</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg text-xs font-bold bg-unsil-green-900 hover:bg-unsil-green-950 text-white shadow-md shadow-unsil-green-950/20 transition-all"
            >
              <Plus className="w-4 h-4 text-unsil-gold-400" />
              <span>Simpan & Daftarkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
