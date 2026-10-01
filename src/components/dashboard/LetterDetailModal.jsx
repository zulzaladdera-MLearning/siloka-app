import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building,
  User,
  ShieldAlert,
  SendHorizontal,
  FileSignature,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  Share2,
  Lock,
  EyeOff,
  ShieldCheck,
  Printer,
  Archive,
  AlertTriangle,
  CheckCheck,
  RotateCcw,
  AlertCircle,
  Eye,
  CheckSquare,
  ExternalLink,
  Layers,
  RefreshCw
} from 'lucide-react';
import { StatusBadge, SifatBadge } from '../ui/Badge';
import { generateForensicWatermark } from '../../utils/security';
import { getLetterActionCapabilities, calculateLetterTracking } from '../../utils/letterActionPolicy';
import {
  KopSuratUnsil,
  PosTemplateView,
  SuratEdaranTemplateView,
  KeputusanTemplateView,
  SuratPerintahTemplateView,
  SuratTugasLembaranTemplateView,
  SuratTugasKolomTemplateView,
  NotaDinasTemplateView,
  SuratDinasTemplateView,
  SuratUndanganLembaranTemplateView,
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
  PenggunaanTteTemplateView
} from '../documents/DocumentTemplates';
import { printDocument, getPaperSizeInfo } from '../../utils/printDocument';

// =========================================================================
// LEMBAR AGENDA REGISTRASI SURAT MASUK (FORMAT RESMI SILOKA UNSIL)
// =========================================================================
const LembarRegistrasiSuratMasuk = ({ letter }) => {
  const finalLetter = letter || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet bg-white text-slate-950 font-serif p-6 sm:p-10 max-w-3xl mx-auto shadow-lg border border-slate-300 rounded-sm text-xs leading-relaxed print:shadow-none print:border-none"
    >
      <KopSuratUnsil unit={finalLetter.unit_kerja_id || 'UN58.6'} />

      {/* Judul Lembar Agenda */}
      <div className="text-center my-4 pb-2 border-b-2 border-slate-900">
        <h2 className="text-sm sm:text-base font-bold tracking-widest uppercase text-slate-950">
          LEMBAR AGENDA REGISTRASI SURAT MASUK
        </h2>
        <p className="font-sans text-[11px] text-slate-600 mt-0.5">
          Sistem Layanan Otomasi Kearsipan & Tata Naskah Dinas Elektronik (SILOKA) UNSIL
        </p>
      </div>

      {/* Identitas Registrasi Agenda */}
      <div className="grid grid-cols-2 gap-3 mb-4 font-sans text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Nomor Agenda Registrasi</span>
          <span className="font-mono text-xs sm:text-sm font-bold text-unsil-green-900">{finalLetter.nomorSurat || '-'}</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Tanggal Diterima di Loket</span>
          <span className="font-semibold text-slate-800">{finalLetter.tanggalTerima || finalLetter.tanggal || '-'}</span>
        </div>
      </div>

      {/* Tabel Informasi Naskah Dinas Masuk */}
      <table className="w-full border-collapse border border-slate-300 font-sans text-xs mb-4">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="w-1/3 bg-slate-100 p-2 font-bold text-slate-700">Nomor Surat Asal</td>
            <td className="p-2 font-mono text-slate-900 font-semibold">{finalLetter.nomorSuratAsal || '-'}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="bg-slate-100 p-2 font-bold text-slate-700">Tanggal Naskah Surat Asal</td>
            <td className="p-2 text-slate-900">{finalLetter.tanggal || '-'}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="bg-slate-100 p-2 font-bold text-slate-700">Instansi / Pengirim Surat</td>
            <td className="p-2 text-slate-900 font-semibold">{finalLetter.pengirim || '-'}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="bg-slate-100 p-2 font-bold text-slate-700">Tujuan Naskah / Pejabat Penerima</td>
            <td className="p-2 text-slate-900 font-semibold text-unsil-green-950">{finalLetter.tujuan || '-'}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="bg-slate-100 p-2 font-bold text-slate-700">Sifat & Keamanan Naskah</td>
            <td className="p-2 text-slate-900">
              <span className="font-semibold">{finalLetter.sifat || 'Biasa'}</span> — Keamanan:{' '}
              <span className="font-semibold">{finalLetter.kategoriKeamanan || 'Biasa/Terbuka'}</span>
              {finalLetter.subKlasifikasi && (
                <span className="ml-2 text-slate-500 font-mono">[{finalLetter.subKlasifikasi}]</span>
              )}
            </td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="bg-slate-100 p-2 font-bold text-slate-700">Perihal Surat</td>
            <td className="p-2 text-slate-900 font-bold leading-snug">{finalLetter.perihal || '-'}</td>
          </tr>
          <tr>
            <td className="bg-slate-100 p-2 font-bold text-slate-700 align-top">Ringkasan Pokok Isi</td>
            <td className="p-2 text-slate-800 leading-relaxed">{finalLetter.ringkasan || finalLetter.perihal || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Kotak Catatan Disposisi / Instruksi Awal (jika ada) */}
      {finalLetter.disposisi && (
        <div className="mb-4 p-3 rounded-lg border-2 border-unsil-green-800/30 bg-emerald-50/40 font-sans text-xs">
          <div className="font-bold text-unsil-green-950 mb-1.5 flex items-center justify-between">
            <span>INSTRUKSI DISPOSISI PIMPINAN (CONTOH 21 TATA NASKAH DINAS UNSIL)</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
              {finalLetter.disposisi.targetUnit || finalLetter.disposisi.tujuanDisposisi || 'Tujuan Disposisi'}
            </span>
          </div>
          {finalLetter.disposisi.actions && finalLetter.disposisi.actions.length > 0 && (
            <div className="mb-1.5">
              <span className="text-[10.5px] font-semibold text-slate-600 block mb-1">Arahan Tindakan:</span>
              <div className="flex flex-wrap gap-1.5">
                {finalLetter.disposisi.actions.map((aksi, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-[10px] font-semibold text-emerald-900">
                    ✓ {aksi}
                  </span>
                ))}
              </div>
            </div>
          )}
          {finalLetter.disposisi.catatan && (
            <div>
              <span className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">Catatan Khusus Pimpinan:</span>
              <p className="italic text-slate-800 bg-white p-1.5 rounded border border-emerald-200">
                "{finalLetter.disposisi.catatan}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bagian Pengesahan / Tanda Registrasi Loket */}
      <div className="mt-6 pt-3 border-t border-slate-300 flex items-center justify-between font-sans text-xs text-slate-600">
        <div>
          <p className="font-bold text-slate-800">Petugas Registrasi Persuratan SILOKA</p>
          <p className="text-[11px] text-slate-500">Unit Pengendali Surat Masuk & Kearsipan</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">Dicatat secara digital pada Buku Agenda SILOKA UNSIL</p>
        </div>
        <div className="text-right">
          <div className="inline-block p-2 border-2 border-dashed border-emerald-600 rounded bg-emerald-50 text-[10px] font-bold text-emerald-900 text-center">
            <span>TERVERIFIKASI & TERCATAT</span>
            <br />
            <span className="font-mono">{finalLetter.nomorSurat}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LetterDetailModal = ({
  letter,
  isOpen,
  onClose,
  onOpenDisposisi,
  onSignTte,
  onArchiveLetter,
  onApproveLetter,
  onRejectLetter,
  currentUser,
  onLogAction
}) => {
  if (!isOpen || !letter) return null;

  const [activeTabMode, setActiveTabMode] = useState('metadata'); // 'metadata' | 'document'
  const [suratMasukViewTab, setSuratMasukViewTab] = useState('pdf'); // 'pdf' | 'agenda'
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Deteksi apakah naskah ini adalah Surat Masuk (Pindaian Eksternal / Agenda Masuk)
  const isSuratMasuk = useMemo(() => {
    if (!letter) return false;
    const kategori = String(letter.kategori || '').toLowerCase();
    const nomor = String(letter.nomorSurat || '');
    return (
      kategori === 'surat masuk' ||
      kategori === 'inbound' ||
      letter.isSuratMasuk === true ||
      nomor.startsWith('AGD-') ||
      Boolean(letter.nomorSuratAsal && letter.nomorSuratAsal !== '-')
    );
  }, [letter]);

  // Resolusi jenis template naskah dinas resmi secara presisi sesuai dengan yang dikirimkan pembuat
  const resolvedTemplateType = useMemo(() => {
    if (!letter) return 'sd';
    if (letter.templateType && letter.templateType !== 'surat-masuk') {
      return letter.templateType;
    }

    const kode = String(letter.kode_jenis_naskah || letter.jenis_naskah || '').toUpperCase();
    const kategori = String(letter.kategori || '').toLowerCase();
    const nomor = String(letter.nomorSurat || '').toUpperCase();

    if (kode === 'NOTA_DINAS' || kategori.includes('nota dinas') || nomor.includes('/ND/') || nomor.startsWith('ND-')) {
      return 'nd';
    }
    if (kode === 'SURAT_DINAS' || kategori.includes('surat dinas') || nomor.includes('/SD/') || nomor.startsWith('SD-')) {
      return 'sd';
    }
    if (kode === 'SURAT_UNDANGAN' || kategori.includes('undangan')) {
      return 'undangan_lembar';
    }
    if (kode === 'SURAT_TUGAS' || kategori.includes('tugas') || nomor.includes('/ST/') || nomor.startsWith('ST-')) {
      return 'st_lembar';
    }
    if (kode === 'SURAT_PERINTAH' || kategori.includes('perintah') || nomor.includes('/SP/') || nomor.startsWith('SP-')) {
      return 'sp';
    }
    if (kode === 'SURAT_EDARAN' || kategori.includes('edaran') || nomor.includes('/SE/') || nomor.startsWith('SE-')) {
      return 'se';
    }
    if (kode === 'KEPUTUSAN' || kode === 'SK' || kategori.includes('keputusan') || nomor.includes('/SK/') || nomor.startsWith('SK-')) {
      return 'sk';
    }
    if (kode === 'PENGUMUMAN' || kategori.includes('pengumuman')) {
      return 'peng';
    }
    if (kode === 'LAPORAN' || kategori.includes('laporan') || nomor.startsWith('LAP-')) {
      return 'lap';
    }
    if (kode === 'BERITA_ACARA' || kategori.includes('berita acara') || nomor.includes('/BA/')) {
      return 'ba';
    }
    if (kode === 'SURAT_KUASA' || kategori.includes('kuasa')) {
      return 'skua';
    }
    if (kode === 'SURAT_KETERANGAN' || kategori.includes('keterangan')) {
      return 'sket';
    }
    if (kode === 'SURAT_PERNYATAAN' || kategori.includes('pernyataan')) {
      return 'sper';
    }
    if (kode === 'SURAT_PENGANTAR' || kategori.includes('pengantar')) {
      return 'speng';
    }
    if (kode === 'NOTULA' || kategori.includes('notula')) {
      return 'notula';
    }
    if (kode === 'TELAAH_STAF' || kategori.includes('telaah staf')) {
      return 'ts';
    }
    if (kode === 'MOU' || kategori.includes('kesepahaman')) {
      return 'mou';
    }
    if (kode === 'PKS' || kategori.includes('perjanjian kerja')) {
      return 'pks';
    }
    if (kode === 'POS' || kode === 'SOP' || kategori.includes('pos') || kategori.includes('sop')) {
      return 'pos';
    }

    // Default umum naskah korespondensi UNSIL adalah Surat Dinas (bukan Surat Edaran Rektor)
    return 'sd';
  }, [letter]);

  // Kapabilitas aksi pengguna & aturan bisnis ketat (STRICT BUSINESS RULE)
  const capabilities = useMemo(() => {
    return getLetterActionCapabilities(letter, currentUser);
  }, [letter, currentUser]);

  // Kalkulasi 5 tahap visual tracking persuratan
  const tracking = useMemo(() => {
    return calculateLetterTracking(letter);
  }, [letter]);

  // Deteksi otomatis ukuran kertas PDF resmi (F4 untuk Naskah Arahan, A4 untuk Korespondensi/Lainnya)
  const paperInfo = useMemo(() => {
    return getPaperSizeInfo(letter);
  }, [letter]);

  // Data template dengan keterkaitan unit kerja penerbit surat & fallback aman seluruh kolom
  const effectiveTemplateData = useMemo(() => {
    const raw = letter.templateData || {};
    const tanggalFormatted = letter.tanggal
      ? `Tasikmalaya, ${letter.tanggal}`
      : `Tasikmalaya, ${new Date().toISOString().slice(0, 10)}`;

    const isiNormalized = letter.isiPokok
      ? (typeof letter.isiPokok === 'string' ? letter.isiPokok.split('\n').filter(Boolean) : letter.isiPokok)
      : letter.ringkasan
      ? [letter.ringkasan]
      : [];

    return {
      nomorSurat: letter.nomorSurat || letter.nomor_surat || raw.nomorSurat || '001/UN58/TU/2026',
      tahun: letter.tanggal?.slice(0, 4) || new Date().getFullYear().toString(),
      hal: letter.perihal || raw.hal || raw.perihal || 'Naskah Dinas',
      perihal: letter.perihal || raw.perihal || raw.hal || 'Naskah Dinas',
      tentang: letter.perihal || raw.tentang || raw.perihal || 'Naskah Dinas',
      yth: letter.tujuan || raw.yth || raw.tujuan || 'Pimpinan Unit Kerja',
      tujuan: letter.tujuan || raw.tujuan || raw.yth || 'Pimpinan Unit Kerja',
      alamatTujuan: letter.alamatTujuan || raw.alamatTujuan || 'Di Tempat',
      dari: letter.pengirim || raw.dari || raw.pengirim || 'Unit Kerja Pengirim',
      pengirim: letter.pengirim || raw.pengirim || raw.dari || 'Unit Kerja Pengirim',
      tempatTanggal: raw.tempatTanggal || tanggalFormatted,
      tanggal: letter.tanggal || raw.tanggal,
      kalimatPembuka: letter.kalimatPembuka || raw.kalimatPembuka || 'Dengan hormat,',
      isiPokok: isiNormalized.length > 0 ? isiNormalized : raw.isiPokok,
      isiSurat: isiNormalized.length > 0 ? isiNormalized : raw.isiSurat || isiNormalized,
      kalimatPenutup: letter.kalimatPenutup || raw.kalimatPenutup || 'Demikian kami sampaikan, atas perhatian dan kerja sama diucapkan terima kasih.',
      namaJabatan: letter.jabatanPenandatangan || letter.namaJabatan || raw.namaJabatan || letter.pengirim || 'Pejabat Penandatangan,',
      namaPejabat: letter.namaPejabat || letter.namaPenandatangan || raw.namaPejabat || 'Pejabat Berwenang',
      nip: letter.nipPenandatangan || letter.nip || raw.nip || '-',
      unitKerja: raw.unitKerja || letter.unit_kerja_id || currentUser?.unit_kerja_id || 'UN58.6',
      unit_kerja_id: letter.unit_kerja_id || raw.unit_kerja_id || currentUser?.unit_kerja_id || 'UN58.6',
      lampiran: letter.lampiran || raw.lampiran || '1 (satu) Berkas',
      tteVerified: Boolean(letter.tteVerified || raw.tteVerified),
      ...raw
    };
  }, [letter, currentUser]);

  const isRestrictedForUser =
    currentUser?.role === 'STAF' &&
    (letter.sifat === 'Sangat Rahasia' || letter.sifat === 'Rahasia');

  const handleDownload = () => {
    if (isRestrictedForUser) {
      if (onLogAction) {
        onLogAction({
          action: 'RESTRICTED_DOWNLOAD_BLOCKED',
          details: `Percobaan pengunduhan ditolak: Dokumen Rahasia ${letter.nomorSurat} oleh ${currentUser.name} (${currentUser.roleLabel})`,
          severity: 'WARNING'
        });
      }
      alert('AKSES DITOLAK: Akun Level 2 (Staf) tidak memiliki izin mengunduh berkas rahasia. Sesuai PRD Modul 4, hanya Pimpinan dan Pengawas SPI yang berhak membuka berkas ini.');
      return;
    }

    const watermark = generateForensicWatermark(currentUser, letter.lampiran);
    if (onLogAction) {
      onLogAction({
        action: 'DOCUMENT_DOWNLOAD_WATERMARKED',
        details: `Pengunduhan berhasil dengan stempel air forensik: ${letter.nomorSurat} oleh ${currentUser.name}`,
        severity: 'NORMAL'
      });
    }

    if (letter.lampiranUrl) {
      const a = document.createElement('a');
      a.href = letter.lampiranUrl;
      a.download = letter.lampiranName || `${(letter.nomorSurat || 'Naskah_Dinas').replace(/[\/\\]/g, '_')}_lampiran.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    printDocument('letter-detail-printable-area', letter.perihal || 'Naskah_Dinas_UNSIL', {
      paperSize: paperInfo.code,
      letter
    });
  };

  const handlePreviewLampiran = () => {
    if (isRestrictedForUser) {
      alert('AKSES DITOLAK: Akun Level 2 (Staf) tidak memiliki izin membuka berkas rahasia.');
      return;
    }
    if (letter.lampiranUrl) {
      window.open(letter.lampiranUrl, '_blank', 'noopener,noreferrer');
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 flex items-center justify-center border border-unsil-gold-400/30 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-unsil-gold-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-mono tracking-wide text-unsil-gold-300">
                  {letter.nomorSurat}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-[11px] sm:text-xs text-emerald-200">{letter.kategori}</span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                Detail Persuratan & Jejak Administrasi
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 sm:px-6 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTabMode('metadata')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTabMode === 'metadata'
                  ? 'bg-white text-unsil-green-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detail & Jejak
            </button>
            <button
              onClick={() => setActiveTabMode('document')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTabMode === 'document'
                  ? 'bg-unsil-green-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                {isSuratMasuk
                  ? (letter.lampiranUrl ? 'Naskah Berkas Masuk (PDF)' : 'Naskah Registrasi Masuk')
                  : `Naskah Resmi (${paperInfo.code})`}
              </span>
            </button>
          </div>

          {activeTabMode === 'document' && (
            <div className="flex items-center gap-2">
              {isSuratMasuk ? (
                letter.lampiranUrl ? (
                  <>
                    <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs shrink-0 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setSuratMasukViewTab('pdf')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          suratMasukViewTab === 'pdf'
                            ? 'bg-unsil-green-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Berkas PDF Asli
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuratMasukViewTab('agenda')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          suratMasukViewTab === 'agenda'
                            ? 'bg-unsil-green-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Lembar Agenda
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handlePreviewLampiran}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
                      title="Buka Dokumen PDF di Tab Baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Tab Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold shadow-xs transition"
                      title="Unduh Berkas PDF Asli"
                    >
                      <Download className="w-3.5 h-3.5 text-unsil-gold-400" />
                      <span className="hidden sm:inline">Unduh PDF</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => printDocument('letter-detail-printable-area', letter.perihal || 'Lembar_Agenda_Surat_Masuk', {
                      paperSize: 'A4',
                      letter
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs shrink-0 transition"
                    title="Cetak Lembar Agenda Registrasi Masuk (A4)"
                  >
                    <Printer className="w-3.5 h-3.5 text-unsil-green-800" />
                    <span>Cetak (A4)</span>
                  </button>
                )
              ) : (
                <>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border shadow-xs ${
                    paperInfo.isF4
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${paperInfo.isF4 ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'}`} />
                    Format: {paperInfo.badgeLabel} ({paperInfo.gramatur || 'HVS min. 70g'})
                  </span>

                  <span
                    className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-xs bg-indigo-50 text-indigo-900 border-indigo-300"
                    title="Jenis dan Ukuran Huruf Naskah Dinas sesuai Peraturan Rektor UNSIL No. 3 Tahun 2023 Pasal 43–48"
                  >
                    Huruf: {paperInfo.fontFamilyLabel || (paperInfo.isF4 ? 'Bookman Old Style 12pt' : 'Times New Roman / Arial 12pt')}
                  </span>

                  <span
                    className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-xs bg-teal-50 text-teal-900 border-teal-300"
                    title="Pengaturan Ruang Tepi Naskah Dinas sesuai Pasal 47 Peraturan Rektor UNSIL No. 3 Tahun 2023"
                  >
                    {paperInfo?.pasal47?.hasKop !== false
                      ? 'Pasal 47 • Tepi Atas: 1 Spasi Kop (4,5 cm) • Bawah/Kiri/Kanan: 1,5 cm'
                      : 'Pasal 47 • Tepi Atas: 2 cm (Tanpa Kop) • Bawah/Kiri/Kanan: 1,5 cm'}
                  </span>

                  <button
                    onClick={() => printDocument('letter-detail-printable-area', letter.perihal || 'Naskah_Dinas_UNSIL', {
                      paperSize: paperInfo.code,
                      letter
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs shrink-0 transition"
                    title={`Cetak Dokumen PDF Otomatis (${paperInfo.code} - ${paperInfo.width} × ${paperInfo.height})`}
                  >
                    <Printer className="w-3.5 h-3.5 text-unsil-green-800" />
                    <span>Cetak ({paperInfo.code})</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content Body: Conditional Switcher between Document (F4/A4) and Metadata */}
        {activeTabMode === 'document' ? (
          <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto bg-slate-200/70 flex flex-col items-center">
            {isSuratMasuk ? (
              letter.lampiranUrl && suratMasukViewTab === 'pdf' ? (
                /* 1. Tampilan Langsung PDF Penuh Naskah Pindaian Berkas Surat Masuk */
                <div className="w-full max-w-4xl flex-1 flex flex-col relative rounded-xl overflow-hidden shadow-lg border border-slate-300 bg-white min-h-[750px] mb-4">
                  <iframe
                    src={`${letter.lampiranUrl}#toolbar=0&navpanes=0&view=FitH`}
                    title={`Naskah Dokumen Surat Masuk - ${letter.nomorSurat}`}
                    className="w-full h-full min-h-[750px] border-0"
                  />
                </div>
              ) : (
                /* 2. Lembar Agenda Registrasi Naskah Masuk Resmi UNSIL */
                <div
                  id="letter-detail-printable-area"
                  data-paper-size="A4"
                  data-category="Surat Masuk"
                  className="w-full printable-document a4-document"
                >
                  <LembarRegistrasiSuratMasuk letter={letter} />
                </div>
              )
            ) : (
              /* 3. Naskah Dinas Keluar / Internal Sesuai Template yang Dipilih Pembuat */
              <div
                id="letter-detail-printable-area"
                data-paper-size={paperInfo.code}
                data-category={letter.kategori}
                data-template-id={resolvedTemplateType}
                data-has-kop={String(paperInfo?.pasal47?.hasKop !== false)}
                className={`w-full printable-document ${paperInfo.isF4 ? 'f4-document' : 'a4-document'}`}
              >
                {resolvedTemplateType === 'pos' ? (
                  <PosTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'se' ? (
                  <SuratEdaranTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'sk' ? (
                  <KeputusanTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'sp' ? (
                  <SuratPerintahTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'st_lembar' ? (
                  <SuratTugasLembaranTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'st_kolom' ? (
                  <SuratTugasKolomTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'nd' ? (
                  <NotaDinasTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'sd' ? (
                  <SuratDinasTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'undangan_lembar' ? (
                  <SuratUndanganLembaranTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'undangan_kartu' ? (
                  <SuratUndanganKartuTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'mou' ? (
                  <NotaKesepahamanTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'pks' ? (
                  <PerjanjianKerjaSamaTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'skua' ? (
                  <SuratKuasaTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'ba' ? (
                  <BeritaAcaraTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'sket' ? (
                  <SuratKeteranganTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'sper' ? (
                  <SuratPernyataanTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'speng' ? (
                  <SuratPengantarTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'peng' ? (
                  <PengumumanTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'notula' ? (
                  <NotulaTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'lap' ? (
                  <LaporanTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'ts' || resolvedTemplateType === 'telaah_staf' ? (
                  <TelaahStafTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'disposisi_rektor' || resolvedTemplateType === 'disp_rektor' ? (
                  <DisposisiRektorTemplateView data={effectiveTemplateData} />
                ) : resolvedTemplateType === 'tte_doc' || resolvedTemplateType === 'penggunaan_tte' ? (
                  <PenggunaanTteTemplateView data={effectiveTemplateData} />
                ) : (
                  <SuratDinasTemplateView data={effectiveTemplateData} />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
            {/* Top Status & Classification Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status Surat:</span>
                <StatusBadge status={letter.status} />
                <SifatBadge sifat={letter.sifat} />
                {letter.isLockedPermanen && (
                  <span className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    🔒 Safeguard Terkunci
                  </span>
                )}
                {letter.tujuan_aksi && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    letter.tujuan_aksi === 'TTD'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-100 text-blue-900 border-blue-200'
                  }`}>
                    {letter.tujuan_aksi === 'TTD' ? '✍️ Permohonan TTE' : '📋 Disposisi Pimpinan'}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Klasifikasi: <strong className="text-slate-800">{letter.subKlasifikasi || letter.kodeKlasifikasi || 'Umum'}</strong>
              </div>
            </div>

            {/* Feature 7: 5-Stage Visual Real-Time Tracking Stepper */}
            <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-unsil-green-800" />
                  Jejak Progres Naskah Dinas ({tracking.currentStep}/5 Tahap)
                </span>
                {capabilities.isSignatureRequest ? (
                  <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    ⚡ Jalur Khusus TTE Pimpinan
                  </span>
                ) : (
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Alur Disposisi Berjenjang
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {tracking.stages.map((stg) => {
                  const isDone = stg.isCompleted;
                  const isCurr = stg.isCurrent;
                  const isSkip = stg.isSkipped;

                  return (
                    <div
                      key={stg.id}
                      className={`relative p-2.5 rounded-lg border text-center transition-all ${
                        isCurr
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40'
                          : isDone
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : isSkip
                          ? 'bg-slate-100/70 border-slate-200/60 opacity-60'
                          : 'bg-slate-50/50 border-slate-200/50 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-unsil-green-800 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                            ✓
                          </div>
                        ) : isCurr ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                            {stg.id}
                          </div>
                        ) : isSkip ? (
                          <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            —
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                            {stg.id}
                          </div>
                        )}
                      </div>
                      <p className={`text-[11px] font-bold truncate ${
                        isCurr ? 'text-emerald-950' : isDone ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {stg.name}
                      </p>
                      <p className="text-[9.5px] text-slate-500 line-clamp-1 mt-0.5" title={stg.desc}>
                        {stg.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STRICT BUSINESS RULE ENFORCEMENT BANNER */}
            {capabilities.isSignatureRequest && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5 text-xs shadow-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  Aturan Alur Kerja Khusus: Permohonan Tanda Tangan Elektronik (TTE)
                </div>
                <p className="leading-relaxed">
                  Surat ini diajukan dengan tujuan khusus <strong>Permohonan Tanda Tangan Pimpinan</strong>. Sesuai regulasi tata naskah dinas Universitas Siliwangi, opsi <strong>Disposisi ditiadakan secara otomatis dari sistem</strong> demi menjamin kepastian alur penandatanganan.
                </p>
                <p className="text-[11px] text-amber-800 font-semibold pt-0.5">
                  Tindakan resmi yang tersedia: <strong>Tanda Tangan Elektronik (TTE)</strong>, <strong>Persetujuan (Approve)</strong>, atau <strong>Minta Revisi / Tolak</strong>.
                </p>
              </div>
            )}

            {/* Rejection / Revision Alert */}
            {letter.status === 'Ditolak' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  Status Naskah: Dikembalikan untuk Revisi
                </div>
                <p className="text-rose-800 leading-relaxed">
                  Pimpinan/Pejabat meminta perbaikan sebelum naskah dapat disetujui atau ditandatangani. Silakan tinjau catatan revisi pada riwayat paraf di bawah.
                </p>
              </div>
            )}

            {/* Nomor Surat Asal (Surat Masuk Eksternal) */}
            {letter.nomorSuratAsal && (
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Nomor Surat Asal (Pengirim Eksternal)
                  </span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{letter.nomorSuratAsal}</p>
                </div>
                <span className="text-[11px] bg-white text-emerald-900 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
                  Surat Masuk Terdaftar
                </span>
              </div>
            )}

          {/* Role-Based Data Masking Notice */}
          {isRestrictedForUser && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Proteksi Keamanan: Role-Based Data Masking Aktif
              </div>
              <p className="leading-relaxed">
                Dokumen ini diklasifikasikan sebagai <strong>{letter.sifat}</strong> dan terenkripsi pada server. Akun Anda saat ini (<strong>Level 2: Staf</strong>) tidak memiliki otoritas dekripsi. Informasi sensitif disamarkan secara otomatis.
              </p>
              <p className="text-[11px] text-amber-800 font-medium pt-0.5">
                Otoritas Akses Dokumen: <strong>Level 1 (Pimpinan)</strong> & <strong>Level 3 (Pengawas SPI)</strong>.
              </p>
            </div>
          )}

          {/* Perihal */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Perihal Surat
            </span>
            {isRestrictedForUser ? (
              <div className="mt-1 p-2.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>[INFORMASI TERTUTUP — KHUSUS PIMPINAN &amp; SPI]</span>
              </div>
            ) : (
              <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                {letter.perihal}
              </h3>
            )}
          </div>

          {/* Sender & Recipient Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pengirim
              </span>
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">{letter.pengirim}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tanggal Surat: {letter.tanggal}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tujuan / Penerima
              </span>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">{letter.tujuan}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Wilayah Kerja BKU UNSIL</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ringkasan Isi Surat
            </span>
            {isRestrictedForUser ? (
              <div className="mt-1.5 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-mono text-xs select-none">
                ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
              </div>
            ) : (
              <div className="mt-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm">
                {letter.ringkasan}
              </div>
            )}
          </div>

          {/* Lampiran & Validasi TTE */}
          {letter.lampiran && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dokumen Lampiran (Wajib PDF, Maks. 5MB)
              </span>
              <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {isRestrictedForUser ? 'Berkas_Rahasia_Terlindungi.pdf' : letter.lampiran}
                    </p>
                    <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Keaslian Berkas Terverifikasi Sah</span>
                      {letter.tteVerified ? (
                        <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TTE BSrE Sah (Cap Fisik Otomatis Dihapus)
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Menunggu Otorisasi TTE Pimpinan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {!isRestrictedForUser && letter.lampiranUrl && (
                    <button
                      type="button"
                      onClick={handlePreviewLampiran}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Berkas</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-xs ${
                      isRestrictedForUser
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-unsil-green-800 hover:bg-unsil-green-900 text-white'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRestrictedForUser ? 'Unduhan Terkunci' : 'Unduh Berkas PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Safeguard Alert */}
              {letter.isLockedPermanen && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Folder Kunci (Safeguard):</strong> Berkas berstatus akhir Permanen. Terkunci otomatis oleh sistem dan tidak dapat dihapus staf.</span>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail & Paraf History */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Riwayat Jejak Paraf & Tanda Tangan Elektronik (Audit Trail)
            </span>
            <div className="mt-2 space-y-2.5 border-l-2 border-emerald-200 pl-4 ml-2">
              {letter.riwayatParaf && letter.riwayatParaf.length > 0 ? (
                letter.riwayatParaf.map((paraf, index) => (
                  <div key={index} className="relative pb-1">
                    <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-unsil-green-800 ring-4 ring-white" />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-xs text-slate-800">{paraf.nama}</p>
                        <p className="text-[11px] text-slate-500">{paraf.jabatan}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {paraf.waktu}
                      </span>
                    </div>
                    {paraf.catatan && (
                      <p className="text-xs text-emerald-900 bg-emerald-50/70 border border-emerald-100 p-2 rounded mt-1 italic">
                        "{paraf.catatan}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Belum ada jejak paraf berjenjang. Surat baru masuk dalam antrean.
                </p>
              )}
            </div>
          </div>

          {/* Disposisi Info if exists */}
          {letter.disposisi ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                  <CheckSquare className="w-4 h-4 text-unsil-green-800" />
                  <span>Arahan & Instruksi Disposisi Pimpinan</span>
                </div>
                {capabilities.canDispose && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDisposisi(letter);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                  >
                    <span>Perbarui Arahan</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-700 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pb-1.5 border-b border-amber-200/60">
                  <p>
                    <span className="text-slate-500">Pemberi Arahan:</span>{' '}
                    <strong className="text-slate-900">
                      {letter.disposisi.pemberiDisposisi || 'Pimpinan Unit'}
                    </strong>
                    {letter.disposisi.jabatanPemberi && (
                      <span className="text-slate-600 block text-[10px]">
                        ({letter.disposisi.jabatanPemberi})
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="text-slate-500">Diteruskan Kepada:</span>{' '}
                    <strong className="text-unsil-green-950 font-semibold block">
                      {letter.disposisi.tujuanDisposisi}
                    </strong>
                  </p>
                </div>

                {letter.disposisi.actions && Array.isArray(letter.disposisi.actions) && letter.disposisi.actions.length > 0 ? (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Checklist Instruksi Tindak Lanjut (Untuk :)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {letter.disposisi.actions.map((act, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-800 bg-white/90 p-1.5 rounded border border-amber-200/80">
                          <CheckSquare className="w-3.5 h-3.5 text-unsil-green-800 shrink-0 mt-0.5" />
                          <span className="leading-tight font-medium">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>
                    <strong className="text-slate-800">Instruksi:</strong>{' '}
                    {letter.disposisi.instruksi}
                  </p>
                )}

                {letter.disposisi.customNote && (
                  <div className="p-2 rounded bg-white/70 border border-amber-200/60 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Catatan Tambahan:</span>
                    <p className="text-slate-800 italic mt-0.5">"{letter.disposisi.customNote}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-amber-900 pt-1">
                  <span>Tenggat Waktu: <strong>{letter.disposisi.batasWaktu}</strong></span>
                  {letter.disposisi.sifatInstruksi && (
                    <span className="font-semibold px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-[10px]">
                      Sifat: {letter.disposisi.sifatInstruksi}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : capabilities.canDispose && letter.kategori === 'Surat Masuk' ? (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-unsil-green-950 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-unsil-green-800" />
                  Surat Masuk Siap Didisposisikan
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Anda memiliki kewenangan pimpinan untuk memberikan arahan dan meneruskan disposisi naskah ini ke unit/staf bawahan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDisposisi(letter);
                }}
                className="px-3.5 py-2 rounded-lg bg-unsil-green-800 text-white text-xs font-semibold hover:bg-unsil-green-900 shadow-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-unsil-gold-300" />
                <span>Beri Arahan Disposisi</span>
              </button>
            </div>
          ) : null}
        </div>
      )}

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5 shrink-0">
          {/* Inline Revision / Rejection Note Box */}
          {showRejectBox && (
            <div className="w-full p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-rose-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Catatan Revisi / Alasan Pengembalian Naskah Dinas
                </span>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Tuliskan catatan perbaikan secara spesifik agar pengusul dapat merevisi draf surat..."
                rows={2}
                className="w-full p-2.5 text-xs border border-rose-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!rejectNote.trim() || isSubmittingAction}
                  onClick={async () => {
                    setIsSubmittingAction(true);
                    if (onRejectLetter) {
                      await onRejectLetter(letter.id, rejectNote);
                    }
                    setIsSubmittingAction(false);
                    setShowRejectBox(false);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kirim Penolakan & Minta Revisi</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-center"
            >
              Tutup
            </button>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end w-full sm:w-auto">
              {/* Action: Minta Revisi / Tolak (Pejabat yang berwenang) */}
              {capabilities.canReject && !showRejectBox && (
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-xs transition-colors"
                  title="Kembalikan naskah dengan catatan revisi"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Minta Revisi / Tolak</span>
                </button>
              )}

              {/* Action: Setujui (Approve) Naskah (Pejabat yang berwenang) */}
              {capabilities.canApprove && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Setujui naskah dinas ini untuk diterbitkan / diproses lebih lanjut?')) {
                      if (onApproveLetter) {
                        await onApproveLetter(letter.id, 'Naskah dinas telah diverifikasi dan disetujui pimpinan.');
                      }
                      onClose();
                    }
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                  title="Setujui naskah dinas ini"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Setujui (Approve)</span>
                </button>
              )}

              {/* Action: Bubuhkan TTE BSrE (Pejabat / Pimpinan) */}
              {capabilities.canSign && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignTte && onSignTte(letter.id);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                  title="Bubuhkan Tanda Tangan Elektronik tersertifikasi BSrE BSSN"
                >
                  <FileSignature className="w-3.5 h-3.5 text-amber-200" />
                  <span>TTE BSrE</span>
                </button>
              )}

              {/* Action: Arsipkan ke JRA (jika status Disetujui) */}
              {capabilities.canArchive && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onArchiveLetter && onArchiveLetter(letter.id);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs transition-colors"
                  title="Pindahkan ke Jadwal Retensi Arsip (JRA)"
                >
                  <Archive className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Arsipkan</span>
                </button>
              )}

              {/* Action: Teruskan Disposisi (STRICT ENFORCEMENT: COMPLETELY ABSENT FROM DOM IF isSignatureRequest) */}
              {capabilities.canDispose && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDisposisi(letter);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-xs transition-colors"
                  title="Disposisi naskah ini ke unit / staf bawahan"
                >
                  <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
                  <span>Disposisi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
