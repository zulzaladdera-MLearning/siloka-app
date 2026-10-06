import React, { useState } from 'react';
import { FileX2, AlertCircle, X, Check, ArrowLeft, Info, FileText } from 'lucide-react';

const CANCEL_REASONS = [
  'Salah unggah berkas (lampiran PDF keliru atau salah versi)',
  'Tujuan pejabat / pimpinan keliru dipilih',
  'Registrasi ganda (surat tidak sengaja terdaftar dua kali)',
  'Surat resmi ditarik kembali oleh instansi pengirim',
  'Lainnya (alasan khusus)'
];

export const CancelLetterModal = ({
  letter,
  isOpen,
  onClose,
  onConfirmCancel,
  currentUser
}) => {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !letter) return null;

  const agendaNumber =
    letter.nomorAgenda ||
    letter.nomor_agenda ||
    (String(letter.nomorSurat || '').startsWith('AGD-') ? letter.nomorSurat : null) ||
    'Nomor Agenda Resmi';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      onConfirmCancel(letter, selectedReason, note.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileX2 className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Batalkan Registrasi Surat
              </h2>
              <p className="text-xs text-rose-200">
                Pembatalan aman tanpa merusak urutan Buku Agenda &amp; Retensi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Kotak Edukasi Bahasa Manusiawi (Mudah dipahami Orang Awam) */}
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-amber-900">
                Mengapa surat ini tidak langsung dihapus hilang?
              </p>
              <p className="text-amber-800">
                Sesuai aturan kearsipan, surat yang sudah memiliki <strong>Nomor Agenda</strong> tidak boleh dihapus agar penomoran buku agenda tidak melompat (bolong). Surat ini akan ditandai berstatus <strong>Dibatalkan</strong> sehingga tidak mengganggu proses dinas pimpinan.
              </p>
            </div>
          </div>

          {/* Ringkasan Surat yang Dipilih */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {agendaNumber}
              </span>
              <span className="text-[11px] text-slate-500">
                {letter.kategori || 'Surat Masuk'}
              </span>
            </div>
            <p className="font-semibold text-slate-900 line-clamp-2">
              {letter.perihal || 'Naskah Dinas'}
            </p>
            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
              <span className="truncate">Pengirim: {letter.pengirim || 'Instansi Luar'}</span>
              <span className="truncate">Tujuan: {letter.tujuan || 'Pimpinan'}</span>
            </div>
          </div>

          {/* Pilihan Alasan Pembatalan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Pilih Alasan Pembatalan:
            </label>
            <div className="space-y-1.5">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-medium ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="leading-tight">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Catatan Penjelasan Tambahan <span className="text-slate-400 font-normal">(opsional)</span>:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Lampiran salah halaman, sudah digantikan dengan surat baru..."
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-xs text-slate-800 resize-none outline-none"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileX2 className="w-3.5 h-3.5" />
              <span>Ya, Batalkan Surat Ini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
