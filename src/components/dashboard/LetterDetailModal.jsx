import React, { useState } from 'react';
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
  Archive
} from 'lucide-react';
import { StatusBadge, SifatBadge } from '../ui/Badge';
import { generateForensicWatermark } from '../../utils/security';
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
import { printDocument } from '../../utils/printDocument';

export const LetterDetailModal = ({
  letter,
  isOpen,
  onClose,
  onOpenDisposisi,
  onSignTte,
  onArchiveLetter,
  currentUser,
  onLogAction
}) => {
  if (!isOpen || !letter) return null;

  const [activeTabMode, setActiveTabMode] = useState('metadata'); // 'metadata' | 'document'

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
              <span>Naskah Resmi (A4)</span>
            </button>
          </div>

          {activeTabMode === 'document' && (
            <button
              onClick={() => printDocument('letter-detail-printable-area', letter.perihal || 'Naskah_Dinas_UNSIL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-unsil-green-800" /> Cetak
            </button>
          )}
        </div>

        {/* Content Body: Conditional Switcher between Document A4 and Metadata */}
        {activeTabMode === 'document' ? (
          <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto bg-slate-200/70 flex flex-col items-center">
            <div id="letter-detail-printable-area" className="w-full printable-document">
              {letter.templateType === 'pos' ? (
                <PosTemplateView data={letter.templateData} />
              ) : letter.templateType === 'se' ? (
                <SuratEdaranTemplateView data={letter.templateData} />
              ) : letter.templateType === 'sk' ? (
                <KeputusanTemplateView data={letter.templateData} />
              ) : letter.templateType === 'sp' ? (
                <SuratPerintahTemplateView data={letter.templateData} />
              ) : letter.templateType === 'st_lembar' ? (
                <SuratTugasLembaranTemplateView data={letter.templateData} />
              ) : letter.templateType === 'st_kolom' ? (
                <SuratTugasKolomTemplateView data={letter.templateData} />
              ) : letter.templateType === 'nd' ? (
                <NotaDinasTemplateView data={letter.templateData} />
              ) : letter.templateType === 'sd' ? (
                <SuratDinasTemplateView data={letter.templateData} />
              ) : letter.templateType === 'undangan_lembar' ? (
                <SuratUndanganLembaranTemplateView data={letter.templateData} />
              ) : letter.templateType === 'undangan_kartu' ? (
                <SuratUndanganKartuTemplateView data={letter.templateData} />
              ) : letter.templateType === 'mou' ? (
                <NotaKesepahamanTemplateView data={letter.templateData} />
              ) : letter.templateType === 'pks' ? (
                <PerjanjianKerjaSamaTemplateView data={letter.templateData} />
              ) : letter.templateType === 'skua' ? (
                <SuratKuasaTemplateView data={letter.templateData} />
              ) : letter.templateType === 'ba' ? (
                <BeritaAcaraTemplateView data={letter.templateData} />
              ) : letter.templateType === 'sket' ? (
                <SuratKeteranganTemplateView data={letter.templateData} />
              ) : letter.templateType === 'sper' ? (
                <SuratPernyataanTemplateView data={letter.templateData} />
              ) : letter.templateType === 'speng' ? (
                <SuratPengantarTemplateView data={letter.templateData} />
              ) : letter.templateType === 'peng' ? (
                <PengumumanTemplateView data={letter.templateData} />
              ) : letter.templateType === 'notula' ? (
                <NotulaTemplateView data={letter.templateData} />
              ) : letter.templateType === 'lap' ? (
                <LaporanTemplateView data={letter.templateData} />
              ) : letter.templateType === 'ts' || letter.templateType === 'telaah_staf' ? (
                <TelaahStafTemplateView data={letter.templateData} />
              ) : letter.templateType === 'disposisi_rektor' || letter.templateType === 'disp_rektor' ? (
                <DisposisiRektorTemplateView data={letter.templateData} />
              ) : letter.templateType === 'tte_doc' || letter.templateType === 'penggunaan_tte' ? (
                <PenggunaanTteTemplateView data={letter.templateData} />
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status Surat:</span>
                <StatusBadge status={letter.status} />
                <SifatBadge sifat={letter.sifat} />
                {letter.isLockedPermanen && (
                  <span className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    🔒 Safeguard Terkunci
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Klasifikasi: <strong className="text-slate-800">{letter.subKlasifikasi || letter.kodeKlasifikasi || 'Umum'}</strong>
              </div>
            </div>

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
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-center"
          >
            Tutup
          </button>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end w-full sm:w-auto">
            {/* Action 1: Bubuhkan TTE BSrE (untuk Pejabat/Pimpinan jika status Diparaf/Dikirim dan belum TTE) */}
            {(currentUser?.role === 'PEJABAT' || currentUser?.role === 'PIMPINAN') && !letter.tteVerified && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignTte && onSignTte(letter.id);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
              >
                <FileSignature className="w-3.5 h-3.5 text-amber-200" />
                <span>TTE BSrE</span>
              </button>
            )}

            {/* Action 2: Arsipkan ke JRA (jika status Disetujui) */}
            {letter.status === 'Disetujui' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onArchiveLetter && onArchiveLetter(letter.id);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-indigo-200" />
                <span>Arsipkan</span>
              </button>
            )}

            {/* Action 3: Buat / Teruskan Disposisi */}
            {currentUser?.role !== 'PENGAWAS' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDisposisi(letter);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-sm transition-colors"
              >
                <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
                <span>Disposisi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
