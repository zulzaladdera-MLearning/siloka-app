import React, { useState, useMemo } from 'react';
import {
  CheckCheck,
  Clock,
  CheckSquare,
  AlertCircle,
  Copy,
  Check,
  SendHorizontal,
  CheckCircle,
  FileText,
  Building,
  User,
  ShieldCheck,
  ArrowRight,
  Share2
} from 'lucide-react';
import {
  getDisposisiReadSummary,
  buildDisposisiDeliveryTimeline
} from '../../utils/disposisiTrackingHelper';

/**
 * Komponen Pelacakan Ekspedisi & Keterbacaan Disposisi (Model Resi Tanda Terima)
 * Mengadopsi timeline vertikal non-repudiasi dengan status pembacaan pejabat real-time
 * Sesuai Peraturan Rektor UNSIL No. 3 Tahun 2023 & Tata Naskah Dinas Elektronik
 */
export const DisposisiTrackingTimeline = ({
  letter,
  currentUser,
  onMarkDisposisiRead,
  onViewDocument,
  onOpenDisposisi,
  onFollowUpDisposisi,
  onCompleteDisposisi,
  onForwardDisposisi,
  canDispose = false,
  isIssuerOfLetterDisposisi = false
}) => {
  if (!letter || !letter.disposisi) return null;

  const [copiedResi, setCopiedResi] = useState(false);

  // Nomor Resi Resmi: Prioritaskan Nomor Agenda Registrasi Masuk / Nomor Naskah Dinas
  const resiNumber = useMemo(() => {
    return (
      letter.nomorAgenda ||
      letter.disposisi?.nomorAgenda ||
      letter.nomorSurat ||
      `AGD-${letter.id || 'UN58'}`
    );
  }, [letter]);

  // Ringkasan status baca (Delivery Summary)
  const readSummary = useMemo(() => {
    return getDisposisiReadSummary(letter.disposisi);
  }, [letter.disposisi]);

  // Rangkaian jejak ekspedisi vertikal (terurut dari yang paling mutakhir di atas)
  const timelineItems = useMemo(() => {
    return buildDisposisiDeliveryTimeline(letter, currentUser);
  }, [letter, currentUser]);

  const handleCopyResi = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resiNumber);
      }
      setCopiedResi(true);
      setTimeout(() => setCopiedResi(false), 2000);
    } catch (_) {
      // Fallback
      setCopiedResi(true);
      setTimeout(() => setCopiedResi(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition">
      {/* 1. HEADER RESI (Format Tanda Terima Ekspedisi Resmi) */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            No. Resi Agenda:
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold text-slate-800">
            {resiNumber}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyResi}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 active:scale-95 transition cursor-pointer select-none"
          title="Salin nomor resi agenda registrasi ke papan klip"
        >
          {copiedResi ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>TERSALIN</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>SALIN</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. SUB-BAR: STATUS KETERBACAAN & SIFAT INSTRUKSI */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-unsil-green-800 shrink-0" />
              <span>Arahan &amp; Instruksi Disposisi Pimpinan</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status Keterbacaan & Tanda Terima Disposisi Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-2xs ${readSummary.badgeColor}`}
            >
              {readSummary.isAllRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>Status Keterbacaan &amp; Tanda Terima Disposisi: {readSummary.badgeLabel}</span>
            </span>

            {letter.disposisi.sifatInstruksi && (
              <span className="font-semibold px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-[10px] text-amber-900">
                Sifat: {letter.disposisi.sifatInstruksi}
              </span>
            )}

            {letter.disposisi.batasWaktu && (
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700">
                Tenggat Waktu: <strong>{letter.disposisi.batasWaktu}</strong>
              </span>
            )}

            {canDispose && (
              <button
                type="button"
                onClick={() => onOpenDisposisi && onOpenDisposisi(letter)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10.5px] font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition shadow-2xs"
              >
                <span>Perbarui Arahan</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. ALERT PERINGATAN SLA JIKA BELUM DIBACA */}
        {readSummary.hasSlaWarning && readSummary.slaWarningText && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{readSummary.slaWarningText}</span>
          </div>
        )}

        {/* 4. CHECKLIST INSTRUKSI TINDAK LANJUT RESMI */}
        {letter.disposisi.actions && Array.isArray(letter.disposisi.actions) && letter.disposisi.actions.length > 0 ? (
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Checklist Instruksi Tindak Lanjut:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {letter.disposisi.actions.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-1.5 text-xs text-slate-800 bg-white p-2 rounded border border-slate-200/80 shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-unsil-green-800 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{act}</span>
                </div>
              ))}
            </div>
            {letter.disposisi.customNote && (
              <p className="text-xs text-slate-700 italic mt-2 pt-2 border-t border-slate-200/70">
                "{letter.disposisi.customNote}"
              </p>
            )}
          </div>
        ) : (
          letter.disposisi.instruksi && (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800">
              <strong className="text-slate-900">Instruksi:</strong> {letter.disposisi.instruksi}
            </div>
          )
        )}

        {/* 5. TIMELINE VERTIKAL RESI EKSPEDISI & KETERBACAAN DISPOSISI */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-unsil-green-800" />
              <span>Jejak Pengiriman &amp; Keterbacaan Naskah (Audit Trail)</span>
            </span>
            <span className="text-[10.5px] font-semibold text-slate-500">
              Kronologi Alur Registrasi s.d. Tanda Terima
            </span>
          </div>

          <div className="relative pl-1">
            {timelineItems.map((item, index) => {
              const isLast = index === timelineItems.length - 1;
              const isSuccess = item.statusType === 'success';
              const isWaiting = item.statusType === 'waiting';

              return (
                <div key={item.id || index} className="flex items-start group">
                  {/* Kolom Kiri: Tanggal & Waktu (2 baris seperti di Resi Pengiriman) */}
                  <div className="w-20 sm:w-24 shrink-0 text-right pr-3 sm:pr-4 pt-0.5">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        item.isLatest && isSuccess
                          ? 'text-emerald-700'
                          : isWaiting
                          ? 'text-amber-800'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.dateStr}
                    </p>
                    <p
                      className={`text-[10.5px] font-mono leading-tight mt-0.5 ${
                        item.isLatest && isSuccess
                          ? 'text-emerald-600 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.timeStr}
                    </p>
                  </div>

                  {/* Kolom Tengah: Garis Vertikal & Bullet Node */}
                  <div className="relative flex flex-col items-center shrink-0 self-stretch">
                    {/* Bullet Circle */}
                    <div className="pt-1">
                      {isSuccess ? (
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shrink-0 z-10 transition-transform ${
                            item.isLatest ? 'scale-110' : ''
                          }`}
                        />
                      ) : isWaiting ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 animate-pulse shrink-0 z-10" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white shrink-0 z-10 my-0.5" />
                      )}
                    </div>

                    {/* Garis Penghubung Vertikal Berkelanjutan */}
                    {!isLast && (
                      <div className="w-[2px] bg-slate-200 flex-1 my-1" />
                    )}
                  </div>

                  {/* Kolom Kanan: Detail Kejadian, Penerima, & Status */}
                  <div className={`flex-1 pl-3 sm:pl-4 min-w-0 ${isLast ? 'pb-2' : 'pb-5'}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p
                        className={`text-xs sm:text-sm font-bold leading-snug ${
                          item.isLatest && isSuccess
                            ? 'text-emerald-800'
                            : isWaiting
                            ? 'text-amber-900'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.badgeText && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${item.badgeColor}`}
                        >
                          {item.badgeText}
                        </span>
                      )}
                    </div>

                    {/* Identitas Aktor / Penerima (seperti "Penerima: DehumaIndonesia") */}
                    {item.actor && (
                      <p className="text-[11.5px] text-slate-800 font-medium mt-0.5">
                        <span className="text-slate-500">
                          {item.category === 'READ' || item.category === 'UNREAD'
                            ? 'Penerima: '
                            : item.category === 'ISSUED'
                            ? 'Pemberi: '
                            : 'Pelaksana: '}
                        </span>
                        <strong>{item.actor}</strong>
                        {item.nip && (
                          <span className="text-slate-500 font-mono text-[10px] ml-1">
                            (NIP. {item.nip})
                          </span>
                        )}
                      </p>
                    )}

                    {/* Stempel Waktu Pembacaan Lengkap (Tingkat 1 - Arahan Disposisi) */}
                    {item.readAt && (
                      <p className="text-[10.5px] text-emerald-800 font-mono mt-0.5">
                        <span className="text-slate-500 font-sans">Waktu Baca: </span>
                        <strong>{item.readAt}</strong>
                      </p>
                    )}

                    {/* Stempel Pembukaan Berkas Fisik / Lampiran PDF (Tingkat 2 - Penelaahan Naskah) */}
                    {item.category === 'READ' && (
                      item.documentViewedAt ? (
                        <p className="text-[10.5px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-slate-600 font-sans">Berkas fisik/PDF dibuka: </span>
                          <strong>{item.documentViewedAt}</strong>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>Menunggu penelaahan berkas fisik / lampiran PDF</span>
                        </p>
                      )
                    )}

                    {/* Catatan / Keterangan Detail */}
                    {item.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Tombol Aksi Tautan (seperti "Lihat Bukti Pengiriman" pada resi pengiriman) */}
                    {item.actionType === 'view_disposisi' && (
                      <button
                        type="button"
                        onClick={() => onViewDocument && onViewDocument()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline mt-1.5 transition cursor-pointer"
                        title="Buka pratinjau lembar naskah dan lembar disposisi resmi"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Lembar Disposisi ↗</span>
                      </button>
                    )}

                    {/* Tombol Konfirmasi Baca bagi Pejabat yang dituju jika belum baca */}
                    {item.isPendingTarget && item.canConfirmRead && onMarkDisposisiRead && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => onMarkDisposisiRead(letter.id, currentUser)}
                          className="px-2.5 py-1 bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-[11px] font-semibold rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer"
                          title="Konfirmasi resmi bahwa Anda telah menerima dan membaca lembar disposisi ini"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-unsil-gold-300" />
                          <span>Konfirmasi Baca</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. AKSI TINDAK LANJUT DISPOSISI LANGSUNG */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Status Disposisi:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                letter.disposisi.status === 'Selesai'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : letter.disposisi.status === 'Menunggu Telaah'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {letter.disposisi.status || 'Dalam Proses'}
            </span>
          </div>

          {letter.disposisi.status !== 'Selesai' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {!isIssuerOfLetterDisposisi && onForwardDisposisi && canDispose && (
                <button
                  type="button"
                  onClick={() => {
                    onForwardDisposisi(
                      {
                        id: `disp-${letter.id}`,
                        letterId: letter.id,
                        nomorAgenda: letter.disposisi.nomorAgenda || letter.nomorAgenda,
                        perihal: letter.perihal,
                        nomorSurat: letter.nomorSurat,
                        instruksi: letter.disposisi.instruksi,
                        catatan: letter.disposisi.customNote || letter.disposisi.catatan || '',
                        pemberiDisposisi: letter.disposisi.pemberiDisposisi,
                        sifatInstruksi: letter.disposisi.sifatInstruksi
                      },
                      letter
                    );
                  }}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition cursor-pointer"
                  title="Teruskan arahan pimpinan secara berjenjang ke unit bawahan"
                >
                  <Share2 className="w-3 h-3 text-amber-700" />
                  <span>Teruskan Disposisi</span>
                </button>
              )}

              {!isIssuerOfLetterDisposisi && onFollowUpDisposisi && (
                <button
                  type="button"
                  onClick={() => {
                    onFollowUpDisposisi(
                      {
                        id: `disp-${letter.id}`,
                        letterId: letter.id,
                        nomorAgenda: letter.disposisi.nomorAgenda || letter.nomorAgenda,
                        perihal: letter.perihal,
                        nomorSurat: letter.nomorSurat,
                        instruksi: letter.disposisi.instruksi,
                        pemberiDisposisi: letter.disposisi.pemberiDisposisi,
                        sifatInstruksi: letter.disposisi.sifatInstruksi
                      },
                      letter
                    );
                  }}
                  className="px-2.5 py-1.5 bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-[11px] font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition cursor-pointer"
                  title="Susun naskah balasan untuk menindaklanjuti arahan pimpinan ini"
                >
                  <SendHorizontal className="w-3 h-3 text-unsil-gold-300" />
                  <span>Buat Naskah Balasan</span>
                </button>
              )}

              {onCompleteDisposisi && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== 'undefined' &&
                      window.confirm(
                        `Tandai lembar disposisi agenda ${
                          letter.disposisi.nomorAgenda || letter.nomorAgenda
                        } sebagai SELESAI ditindaklanjuti?`
                      )
                    ) {
                      onCompleteDisposisi(
                        `disp-${letter.id}`,
                        letter.id,
                        'Tindak lanjut koordinasi/tugas telah selesai dilaksanakan.'
                      );
                    }
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition cursor-pointer"
                  title="Tandai selesai jika tugas telah diselesaikan tanpa perlu surat balasan"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>{isIssuerOfLetterDisposisi ? 'Tutup Disposisi' : 'Tandai Selesai'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{letter.disposisi.resolvedNote || 'Telah Selesai Ditindaklanjuti'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
