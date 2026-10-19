import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, FileText, Check } from 'lucide-react';

export const DeleteLetterModal = ({
  letter,
  isOpen,
  onClose,
  onConfirmDelete,
  currentUser
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !letter) return null;

  const letterNumber =
    letter.nomorSurat ||
    letter.nomorAgenda ||
    letter.nomor_agenda ||
    'Draf Naskah Dinas';

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      onConfirmDelete(letter);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-letter-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 id="delete-letter-title" className="text-sm sm:text-base font-bold text-white">
                Hapus Naskah Dinas
              </h2>
              <p className="text-xs text-rose-200">
                Penghapusan berkas naskah dari daftar persuratan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Kotak Peringatan Konfirmasi */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-rose-900">
                Konfirmasi Tindakan
              </p>
              <p className="text-rose-800">
                Apakah Anda yakin ingin menghapus naskah dinas ini dari daftar persuratan? Naskah yang dihapus tidak akan lagi ditampilkan pada riwayat aktivitas.
              </p>
            </div>
          </div>

          {/* Ringkasan Naskah Dinas yang Dipilih */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[220px]">
                {letterNumber}
              </span>
              <span className="text-[11px] font-medium text-slate-600 shrink-0">
                {letter.kategori || 'Surat Keluar'}
              </span>
            </div>
            <p className="font-semibold text-slate-900 line-clamp-2 leading-snug">
              {letter.perihal || 'Naskah Dinas'}
            </p>
            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1.5 border-t border-slate-200/60">
              <span className="truncate">Pengirim: {letter.pengirim || 'Unit Kerja Terkait'}</span>
              <span className="truncate ml-2">Tujuan: {letter.tujuan || '-'}</span>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-700 hover:bg-rose-800 active:scale-95 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menghapus...' : 'Ya, Hapus Naskah'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
