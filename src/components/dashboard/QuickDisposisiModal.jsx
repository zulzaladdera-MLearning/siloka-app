import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  SendHorizontal,
  FileText,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search,
  ChevronDown,
  Building2,
  Building,
  Check,
  RotateCcw
} from 'lucide-react';
import { isLetterSignatureRequest } from '../../utils/letterActionPolicy';
import {
  BKU_STRUCTURAL_TEAMS,
  OFFICIAL_UNSIL_INSTRUCTIONS,
  DISPOSISI_SLA_DAYS
} from '../../utils/disposisiStandards';

export { BKU_STRUCTURAL_TEAMS, OFFICIAL_UNSIL_INSTRUCTIONS };


export const QuickDisposisiModal = ({
  letter,
  isOpen,
  onClose,
  onSubmitDisposisi,
  allLetters = [],
  currentUser = null
}) => {
  if (!isOpen) return null;

  // STRICT BUSINESS RULE: Saring hanya naskah yang sah didisposisikan (kecualikan Permohonan TTD)
  const disposableLetters = useMemo(() => {
    return allLetters.filter((l) => !isLetterSignatureRequest(l));
  }, [allLetters]);

  const isTargetSignatureRequest = letter ? isLetterSignatureRequest(letter) : false;

  const [selectedLetterId, setSelectedLetterId] = useState(() => {
    if (letter && !isLetterSignatureRequest(letter)) return letter.id;
    return disposableLetters[0]?.id || '';
  });

  // State Tujuan Disposisi (Default ke posisi struktural pertama: Kepala Bagian Umum)
  const [targetUnit, setTargetUnit] = useState(BKU_STRUCTURAL_TEAMS[0].nama);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const unitDropdownRef = useRef(null);

  // Kalkulasi tanggal jatuh tempo berdasarkan SLA Peraturan Rektor No. 3/2023
  const calculateDueDateBySifat = (sifat) => {
    const d = new Date();
    const days = DISPOSISI_SLA_DAYS[sifat] || 2;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // State Instruksi Tindak Lanjut ("Untuk :")
  const [actions, setActions] = useState(['Proses sesuai prosedur']);
  const [sifatInstruksi, setSifatInstruksi] = useState('Segera');
  const [customNote, setCustomNote] = useState('');
  // Sifat 'Segera' dihitung 2x24 Jam (2 hari) sesuai Peraturan Rektor No. 3/2023
  const [dueDate, setDueDate] = useState(() => calculateDueDateBySifat('Segera'));
  const [validationError, setValidationError] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLetterObj =
    disposableLetters.find((l) => l.id === selectedLetterId) ||
    (letter && !isTargetSignatureRequest ? letter : null);

  const selectedTeamObj = useMemo(() => {
    return BKU_STRUCTURAL_TEAMS.find((t) => t.nama === targetUnit) || BKU_STRUCTURAL_TEAMS[0];
  }, [targetUnit]);

  // Filter unit kerja BKU berdasarkan query pencarian
  const filteredTeams = useMemo(() => {
    if (!unitSearchQuery.trim()) return BKU_STRUCTURAL_TEAMS;
    const q = unitSearchQuery.toLowerCase();
    return BKU_STRUCTURAL_TEAMS.filter(
      (t) =>
        t.nama.toLowerCase().includes(q) ||
        t.deskripsi.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q)
    );
  }, [unitSearchQuery]);

  // Handler toggle checkbox instruksi
  const handleToggleAction = (item) => {
    setValidationError('');
    if (actions.includes(item)) {
      setActions(actions.filter((a) => a !== item));
    } else {
      setActions([...actions, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // STRICT BUSINESS RULE: Double safeguard check on submission
    if (!selectedLetterObj || isLetterSignatureRequest(selectedLetterObj)) {
      alert('ATURAN KETAT SISTEM: Naskah dinas ini berstatus Permohonan Tanda Tangan Elektronik (TTE) dan TIDAK DAPAT didisposisikan.');
      return;
    }

    // Validasi Checklist Instruksi ("Untuk :")
    if (actions.length === 0) {
      setValidationError('Mohon pilih minimal satu opsi pada Instruksi Tindak Lanjut ("Untuk :") sesuai format resmi.');
      return;
    }

    onSubmitDisposisi({
      letterId: selectedLetterId,
      nomorAgenda: `AGD-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      targetUnit,
      sifatInstruksi,
      actions,
      customNote,
      dueDate,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
        {/* Header Format Resmi UNSIL */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-unsil-gold-500/20 border border-unsil-gold-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <SendHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-unsil-gold-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Lembar E-Disposisi Elektronik BKU
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-unsil-gold-400/20 text-unsil-gold-300 border border-unsil-gold-400/30">
                  Contoh 21
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200">
                Format Resmi Naskah Dinas • Biro Keuangan dan Umum Universitas Siliwangi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body vs Strict Guard Notice */}
        {isTargetSignatureRequest ? (
          <div className="p-6 sm:p-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fitur Disposisi Ditiadakan untuk Naskah Ini
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Naskah dinas <strong>{letter?.nomorSurat}</strong> berstatus <strong>Permohonan Tanda Tangan Elektronik (TTE)</strong>. Sesuai aturan mutlak tata naskah dinas Universitas Siliwangi, naskah ini <strong>DILARANG didisposisikan</strong> dan hanya dapat diproses melalui tindakan <strong>Tanda Tangan (TTE BSrE)</strong>, <strong>Persetujuan (Approve)</strong>, atau <strong>Minta Revisi / Tolak</strong>.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Tutup & Kembali ke Naskah
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
            {/* Target Surat Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Surat yang Didisposisikan
              </label>
              <select
                value={selectedLetterId}
                onChange={(e) => setSelectedLetterId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
              >
                {disposableLetters.map((l) => (
                  <option key={l.id} value={l.id}>
                    [{l.nomorSurat}] - {l.perihal.slice(0, 65)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedLetterObj && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 leading-snug truncate">{selectedLetterObj.perihal}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                    <span>Pengirim: <strong className="text-slate-700">{selectedLetterObj.pengirim}</strong></span>
                    <span>•</span>
                    <span>Tanggal: <strong className="text-slate-700">{selectedLetterObj.tanggal}</strong></span>
                    {selectedLetterObj.sifat && (
                      <>
                        <span>•</span>
                        <span className="text-unsil-green-900 font-semibold">Sifat: {selectedLetterObj.sifat}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Grid: Tujuan Disposisi (OTK UNSIL) & Derajat Kecepatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feature B: Tujuan Disposisi dengan Searchable Dropdown OTK BKU UNSIL */}
              <div className="relative" ref={unitDropdownRef}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tujuan Disposisi (Diteruskan Kepada :)
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUnitDropdownOpen((prev) => !prev)}
                  className="w-full p-2.5 bg-white border border-slate-300 hover:border-unsil-green-700 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-6 h-6 rounded bg-unsil-green-800 text-unsil-gold-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-900 truncate">{targetUnit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-1">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-unsil-green-900 font-bold border border-emerald-200">
                      BKU
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUnitDropdownOpen ? 'rotate-180 text-unsil-green-800' : ''}`} />
                  </div>
                </button>

                {/* Searchable Dropdown Menu */}
                {isUnitDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 pb-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={unitSearchQuery}
                          onChange={(e) => setUnitSearchQuery(e.target.value)}
                          placeholder="Cari struktur unit BKU..."
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-unsil-green-800 focus:bg-white text-slate-800 placeholder-slate-400"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 p-1">
                      {filteredTeams.length > 0 ? (
                        filteredTeams.map((team) => {
                          const isSelected = targetUnit === team.nama;
                          return (
                            <button
                              key={team.id}
                              type="button"
                              onClick={() => {
                                setTargetUnit(team.nama);
                                setIsUnitDropdownOpen(false);
                                setUnitSearchQuery('');
                              }}
                              className={`w-full p-2 rounded-lg text-left flex items-start justify-between gap-2 transition ${
                                isSelected
                                  ? 'bg-emerald-50 text-unsil-green-950 font-semibold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-2 truncate">
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected ? 'bg-unsil-green-800 text-unsil-gold-300' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <Building className="w-3 h-3" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold leading-tight truncate">{team.nama}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{team.deskripsi}</p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Tidak ditemukan unit kerja BKU terkait.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sifat Instruksi */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Derajat Kecepatan / Sifat
                </label>
                <select
                  value={sifatInstruksi}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSifatInstruksi(val);
                    setDueDate(calculateDueDateBySifat(val));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                >
                  <option value="Sangat Segera">Sangat Segera (Maks. 24 Jam / Hari Ini)</option>
                  <option value="Segera">Segera (Maks. 2×24 Jam / 2 Hari Kerja — Peraturan Rektor)</option>
                  <option value="Biasa">Biasa (Maks. 5 Hari Kerja)</option>
                  <option value="Rahasia">Rahasia Internal (Maks. 3 Hari Kerja)</option>
                </select>
              </div>
            </div>

            {/* Feature A: Instruksi Tindak Lanjut Checkbox (Format Disposisi Resmi UNSIL - Untuk :) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Instruksi Tindak Lanjut
                  </label>
                  <span className="text-[10px] text-emerald-800 font-medium font-serif italic">
                    Format Disposisi Resmi UNSIL - Untuk :
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setActions([...OFFICIAL_UNSIL_INSTRUCTIONS]);
                      setValidationError('');
                    }}
                    className="text-unsil-green-800 hover:underline font-semibold"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setActions([])}
                    className="text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OFFICIAL_UNSIL_INSTRUCTIONS.map((item) => {
                  const isChecked = actions.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-150 ${
                        isChecked
                          ? 'bg-emerald-50/90 border-unsil-green-800 text-unsil-green-950 font-semibold shadow-2xs ring-1 ring-unsil-green-800/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAction(item)}
                        className="w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-800 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs">{item}</span>
                    </label>
                  );
                })}
              </div>

              {validationError && (
                <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationError}
                </p>
              )}
            </div>

            {/* Catatan Tambahan Pimpinan */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Catatan / Arahan Khusus Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Tuliskan arahan spesifik, rekomendasi teknis, atau penugasan personel..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 focus:bg-white transition"
              />
            </div>

            {/* Batas Waktu */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tenggat Waktu Penyelesaian (Batas Waktu)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
              />
            </div>

            {/* Footer Form Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-sm transition-colors"
              >
                <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
                <span>Simpan & Kirim E-Disposisi</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickDisposisiModal;
