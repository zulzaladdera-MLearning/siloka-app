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
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import { isLetterSignatureRequest } from '../../utils/letterActionPolicy';
import {
  BKU_STRUCTURAL_TEAMS,
  OFFICIAL_UNSIL_INSTRUCTIONS,
  OFFICIAL_DISPOSISI_CHECKLIST_COL1,
  OFFICIAL_DISPOSISI_CHECKLIST_COL2,
  DISPOSISI_SLA_DAYS,
  getHierarchicalDisposisiTargets
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

  // Target Disposisi Berjenjang Top-Down sesuai Matriks Kewenangan OTK UNSIL
  const hierarchicalTargets = useMemo(() => {
    return getHierarchicalDisposisiTargets(currentUser);
  }, [currentUser]);

  const [targetUnit, setTargetUnit] = useState(() => {
    return hierarchicalTargets[0]?.nama || 'Kepala Bagian Umum';
  });
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
  const [koordinasiDetail, setKoordinasiDetail] = useState('');
  const [lainnyaDetail, setLainnyaDetail] = useState('');
  const [sifatInstruksi, setSifatInstruksi] = useState('Segera');
  const [customNote, setCustomNote] = useState('');
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
    return hierarchicalTargets.find((t) => t.nama === targetUnit) || hierarchicalTargets[0];
  }, [targetUnit, hierarchicalTargets]);

  // Filter unit kerja bawahan berdasarkan query pencarian
  const filteredTeams = useMemo(() => {
    if (!unitSearchQuery.trim()) return hierarchicalTargets;
    const q = unitSearchQuery.toLowerCase();
    return hierarchicalTargets.filter(
      (t) =>
        t.nama.toLowerCase().includes(q) ||
        (t.deskripsi && t.deskripsi.toLowerCase().includes(q)) ||
        (t.badge && t.badge.toLowerCase().includes(q))
    );
  }, [unitSearchQuery, hierarchicalTargets]);

  // Handler toggle checkbox instruksi
  const handleToggleAction = (itemLabel) => {
    setValidationError('');
    if (actions.includes(itemLabel)) {
      setActions(actions.filter((a) => a !== itemLabel));
    } else {
      setActions([...actions, itemLabel]);
    }
  };

  const handleSelectAll = () => {
    const allLabels = [
      ...OFFICIAL_DISPOSISI_CHECKLIST_COL1.map((c) => c.label),
      ...OFFICIAL_DISPOSISI_CHECKLIST_COL2.map((c) => c.label)
    ];
    setActions(allLabels);
    setValidationError('');
  };

  const handleClearAll = () => {
    setActions([]);
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
      setValidationError('Mohon centang minimal satu butir instruksi tindak lanjut ("Untuk :") sesuai arahan dinas.');
      return;
    }

    // Format actions list dengan detail koordinasi / lainnya jika diisi
    const finalizedActions = actions.map((act) => {
      if (act.includes('Koordinasikan dengan') && koordinasiDetail.trim()) {
        return `Koordinasikan dengan ${koordinasiDetail.trim()}`;
      }
      if (act.includes('Lainnya') && lainnyaDetail.trim()) {
        return `Instruksi Lainnya: ${lainnyaDetail.trim()}`;
      }
      return act;
    });

    const pemberiName = currentUser?.nama_lengkap || currentUser?.nama || currentUser?.name || 'Pimpinan Unit';
    const pemberiJabatan = currentUser?.jabatan || currentUser?.sotk_position_label || currentUser?.roleLabel || 'Pimpinan';

    onSubmitDisposisi({
      letterId: selectedLetterId,
      nomorAgenda: selectedLetterObj?.nomorAgenda || `AGD-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      targetUnit,
      sifatInstruksi,
      actions: finalizedActions,
      customNote,
      dueDate,
      pemberiName,
      pemberiJabatan,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Format Resmi UNSIL */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-unsil-gold-500/20 border border-unsil-gold-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <CheckSquare className="w-5 h-5 text-unsil-gold-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Lembar Arahan Disposisi Surat Masuk
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-unsil-gold-400/20 text-unsil-gold-300 border border-unsil-gold-400/30">
                  Matriks Kewenangan UNSIL
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Pemberi Arahan: <strong>{currentUser?.nama_lengkap || currentUser?.name || 'Pimpinan Unit'}</strong> — {currentUser?.jabatan || currentUser?.roleLabel || 'Pejabat Struktural'}
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
          <div className="p-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fitur Disposisi Ditiadakan untuk Naskah Ini
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Naskah dinas <strong>{letter?.nomorSurat}</strong> berstatus <strong>Permohonan Tanda Tangan Elektronik (TTE)</strong>. Sesuai aturan mutlak tata naskah dinas Universitas Siliwangi, naskah ini <strong>DILARANG didisposisikan</strong> dan hanya dapat diproses melalui tindakan <strong>Tanda Tangan (TTE BSrE)</strong>, <strong>Persetujuan</strong>, atau <strong>Revisi</strong>.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
            {/* Target Surat Selector & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Surat Masuk yang Didisposisikan
                </label>
                <select
                  value={selectedLetterId}
                  onChange={(e) => setSelectedLetterId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition truncate"
                >
                  {disposableLetters.map((l) => (
                    <option key={l.id} value={l.id}>
                      [{l.nomorAgenda || l.nomorSurat}] - {l.perihal.slice(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>

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
                  className="w-full p-2 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                >
                  <option value="Sangat Segera">Sangat Segera (Maks. 24 Jam)</option>
                  <option value="Segera">Segera (Maks. 2×24 Jam / 2 Hari)</option>
                  <option value="Biasa">Biasa (Maks. 5 Hari Kerja)</option>
                  <option value="Rahasia">Rahasia Internal (Maks. 3 Hari)</option>
                </select>
              </div>
            </div>

            {selectedLetterObj && (
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 leading-snug line-clamp-1">{selectedLetterObj.perihal}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                    <span>Asal/Pengirim: <strong className="text-slate-800">{selectedLetterObj.pengirim}</strong></span>
                    <span>•</span>
                    <span>No. Surat: <strong className="text-slate-800">{selectedLetterObj.nomorSurat}</strong></span>
                    <span>•</span>
                    <span>Agenda: <strong className="text-unsil-green-900 font-mono">{selectedLetterObj.nomorAgenda || 'Terdaftar'}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Tujuan Disposisi Berjenjang (Top-Down Subordinate Picker) */}
            <div className="relative" ref={unitDropdownRef}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Diteruskan Kepada (Bawahan / Unit Pengolah Tujuan) :
              </label>

              <button
                type="button"
                onClick={() => setIsUnitDropdownOpen((prev) => !prev)}
                className="w-full p-2.5 bg-white border border-slate-300 hover:border-unsil-green-700 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded bg-unsil-green-800 text-unsil-gold-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 truncate">{targetUnit}</span>
                  {selectedTeamObj?.deskripsi && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                      — {selectedTeamObj.deskripsi}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-1">
                  {selectedTeamObj?.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-unsil-green-900 font-bold border border-emerald-200">
                      {selectedTeamObj.badge}
                    </span>
                  )}
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
                        placeholder="Cari pejabat / unit bawahan..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-unsil-green-800 focus:bg-white text-slate-800 placeholder-slate-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 p-1">
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
                                {team.deskripsi && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{team.deskripsi}</p>
                                )}
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
                        Tidak ditemukan unit bawahan terkait.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TABEL CHECKLIST 2 KOLOM (Format Disposisi Resmi UNSIL - Gambar Dokumen) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-unsil-green-800" />
                    Instruksi Tindak Lanjut Naskah (Untuk :)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Centang satu atau beberapa butir arahan pimpinan di bawah ini:
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-unsil-green-800 hover:text-unsil-green-950 font-bold hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-500 hover:text-slate-800 font-semibold hover:underline"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Grid 2 Kolom Sejajar dengan Pembatas Garis Putus-putus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 md:divide-x md:divide-dashed md:divide-slate-200 text-xs">
                {/* Kolom Kiri */}
                <div className="space-y-1">
                  {OFFICIAL_DISPOSISI_CHECKLIST_COL1.map((item) => {
                    const isChecked = actions.includes(item.label);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-emerald-100/70 text-unsil-green-950 font-semibold'
                            : 'hover:bg-slate-100/80 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAction(item.label)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-800/30 cursor-pointer"
                        />
                        <span className="text-[11.5px] leading-tight">{item.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-1 md:pl-6 pt-2 md:pt-0">
                  {OFFICIAL_DISPOSISI_CHECKLIST_COL2.map((item) => {
                    const isChecked = actions.includes(item.label);
                    return (
                      <div key={item.id} className="space-y-1">
                        <label
                          className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-emerald-100/70 text-unsil-green-950 font-semibold'
                              : 'hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAction(item.label)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-800/30 cursor-pointer"
                          />
                          <span className="text-[11.5px] leading-tight">{item.label}</span>
                        </label>

                        {/* Input khusus bila "Koordinasikan dengan..." dicentang */}
                        {item.id === 'koordinasikan_dengan' && isChecked && (
                          <div className="pl-6 pb-1">
                            <input
                              type="text"
                              value={koordinasiDetail}
                              onChange={(e) => setKoordinasiDetail(e.target.value)}
                              placeholder="Tuliskan pihak/unit koordinasi..."
                              className="w-full text-[11px] p-1.5 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-unsil-green-800 outline-none"
                              autoFocus
                            />
                          </div>
                        )}

                        {/* Input khusus bila "Lainnya" dicentang */}
                        {item.id === 'lainnya' && isChecked && (
                          <div className="pl-6 pb-1">
                            <input
                              type="text"
                              value={lainnyaDetail}
                              onChange={(e) => setLainnyaDetail(e.target.value)}
                              placeholder="Tuliskan arahan spesifik lainnya..."
                              className="w-full text-[11px] p-1.5 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-unsil-green-800 outline-none"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {validationError && (
                <p className="text-[11px] text-rose-600 pt-1 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationError}
                </p>
              )}
            </div>

            {/* Grid: Catatan Khusus & Batas Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Catatan Pimpinan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Tuliskan petunjuk teknis, arahan telaah khusus, atau penugasan personel..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tenggat Waktu Penyelesaian
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Otomatis dihitung sesuai SLA: <strong>{sifatInstruksi}</strong>.
                </p>
              </div>
            </div>

            {/* Footer Form Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                <span>{actions.length} butir instruksi terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
                  <span>Kirimkan Arahan Disposisi</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickDisposisiModal;
