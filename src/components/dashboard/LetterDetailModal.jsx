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
  AlertCircle
} from 'lucide-react';
import { StatusBadge, SifatBadge } from '../ui/Badge';
import { generateForensicWatermark } from '../../utils/security';
import { getLetterActionCapabilities, calculateLetterTracking } from '../../utils/letterActionPolicy';
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
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

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

  // Data template dengan keterkaitan unit kerja penerbit surat
  const effectiveTemplateData = useMemo(() => {
    return {
      ...(letter.templateData || {}),
      unitKerja: letter.templateData?.unitKerja || letter.unit_kerja_id || currentUser?.unit_kerja_id,
      unit_kerja_id: letter.unit_kerja_id || letter.templateData?.unit_kerja_id || currentUser?.unit_kerja_id
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

    alert(`[STEMPEL AIR FORENSIK DITERAPKAN]\n${watermark}\n\nStatus TTE: ${letter.tteVerified ? 'Tervalidasi BSrE BSSN (Cap dinas fisik dihapus otomatis)' : 'Draf Naskah Dinas'}`);
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
              <span>Naskah Resmi ({paperInfo.code})</span>
            </button>
          </div>

          {activeTabMode === 'document' && (
            <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>

        {/* Content Body: Conditional Switcher between Document (F4/A4) and Metadata */}
        {activeTabMode === 'document' ? (
          <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto bg-slate-200/70 flex flex-col items-center">
            <div
              id="letter-detail-printable-area"
              data-paper-size={paperInfo.code}
              data-category={letter.kategori}
              data-template-id={letter.templateType}
              data-has-kop={String(paperInfo?.pasal47?.hasKop !== false)}
              className={`w-full printable-document ${paperInfo.isF4 ? 'f4-document' : 'a4-document'}`}
            >
              {letter.templateType === 'pos' ? (
                <PosTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'se' ? (
                <SuratEdaranTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'sk' ? (
                <KeputusanTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'sp' ? (
                <SuratPerintahTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'st_lembar' ? (
                <SuratTugasLembaranTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'st_kolom' ? (
                <SuratTugasKolomTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'nd' ? (
                <NotaDinasTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'sd' ? (
                <SuratDinasTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'undangan_lembar' ? (
                <SuratUndanganLembaranTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'undangan_kartu' ? (
                <SuratUndanganKartuTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'mou' ? (
                <NotaKesepahamanTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'pks' ? (
                <PerjanjianKerjaSamaTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'skua' ? (
                <SuratKuasaTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'ba' ? (
                <BeritaAcaraTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'sket' ? (
                <SuratKeteranganTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'sper' ? (
                <SuratPernyataanTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'speng' ? (
                <SuratPengantarTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'peng' ? (
                <PengumumanTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'notula' ? (
                <NotulaTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'lap' ? (
                <LaporanTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'ts' || letter.templateType === 'telaah_staf' ? (
                <TelaahStafTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'disposisi_rektor' || letter.templateType === 'disp_rektor' ? (
                <DisposisiRektorTemplateView data={effectiveTemplateData} />
              ) : letter.templateType === 'tte_doc' || letter.templateType === 'penggunaan_tte' ? (
                <PenggunaanTteTemplateView data={effectiveTemplateData} />
              ) : (
                <SuratEdaranTemplateView
                  data={{
                    nomorSurat: letter.nomorSurat,
                    tahun: letter.tanggal?.slice(0, 4) || '2026',
                    tentang: letter.perihal,
                    tujuanList: [letter.tujuan, 'Arsip Biro BKU Universitas Siliwangi'],
                    dasarHukum: `Naskah dinas resmi tercatat secara sah pada buku agenda registrasi nomor ${letter.nomorSurat}.`,
                    isiSurat: [
                      letter.ringkasan,
                      `Klasifikasi Arsip: ${letter.subKlasifikasi || letter.kodeKlasifikasi}`,
                      `Kategori Sifat: ${letter.sifat} (Keamanan: ${letter.kategoriKeamanan})`
                    ],
                    tempatTanggal: `Tasikmalaya, ${letter.tanggal}`,
                    namaJabatan: letter.pengirim,
                    namaPejabat: currentUser?.name || 'Dr. Nana Sujana, Drs., M.Si.',
                    nip: currentUser?.nip || '196808301989031004',
                    unitKerja: letter.unit_kerja_id || currentUser?.unit_kerja_id,
                    unit_kerja_id: letter.unit_kerja_id || currentUser?.unit_kerja_id,
                    tteVerified: letter.tteVerified
                  }}
                />
              )}
            </div>
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
                <span>[INFORMASI PERIHAL DIENKRIPSI AES-256 - HANYA PIMPINAN & SPI]</span>
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
                      {isRestrictedForUser ? 'Berkas_Terenkripsi_AES256.pdf' : letter.lampiran}
                    </p>
                    <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Hash SHA-256 Valid</span>
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

                <button
                  type="button"
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-xs self-start sm:self-center ${
                    isRestrictedForUser
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-unsil-green-800 hover:bg-unsil-green-900 text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRestrictedForUser ? 'Unduhan Terkunci' : 'Unduh Berkas PDF'}</span>
                </button>
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
          {letter.disposisi && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1.5">
                <SendHorizontal className="w-4 h-4 text-amber-700" />
                Lembar Disposisi Aktif
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <strong className="text-slate-800">Diteruskan Kepada:</strong>{' '}
                  {letter.disposisi.tujuanDisposisi}
                </p>
                <p>
                  <strong className="text-slate-800">Instruksi Pimpinan:</strong>{' '}
                  {letter.disposisi.instruksi}
                </p>
                <p className="text-amber-800 font-medium">
                  <strong>Batas Waktu:</strong> {letter.disposisi.batasWaktu}
                </p>
              </div>
            </div>
          )}
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
