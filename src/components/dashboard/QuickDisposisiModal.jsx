import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  SendHorizontal,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search,
  ChevronDown,
  Building2,
  Building,
  Check,
  CheckSquare,
  Clock,
  Sparkles
} from 'lucide-react';
import { isLetterSignatureRequest } from '../../utils/letterActionPolicy';
import {
  BKU_STRUCTURAL_TEAMS,
  OFFICIAL_UNSIL_INSTRUCTIONS,
  OFFICIAL_DISPOSISI_CHECKLIST_COL1,
  OFFICIAL_DISPOSISI_CHECKLIST_COL2,
  DISPOSISI_SLA_DAYS,
  getHierarchicalDisposisiTargets,
  isDisposisiAuthorizedOfficial
} from '../../utils/disposisiStandards';

export { BKU_STRUCTURAL_TEAMS, OFFICIAL_UNSIL_INSTRUCTIONS };

export const QuickDisposisiModal = ({
  letter,
  isOpen,
  onClose,
  onSubmitDisposisi,
  allLetters = [],
  currentUser = null,
  allUsers = []
}) => {
  // Profil Pengguna Aktif yang Disinkronkan dengan Manajemen Pengguna (allUsers)
  const effectiveCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    if (Array.isArray(allUsers) && allUsers.length > 0) {
      const matched = allUsers.find(
        (u) =>
          (u.id && currentUser.id && String(u.id) === String(currentUser.id)) ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (u.nip && currentUser.nip && u.nip === currentUser.nip)
      );
      if (matched) return { ...currentUser, ...matched };
    }
    return currentUser;
  }, [currentUser, allUsers]);

  // Evaluasi wewenang pejabat SOTK UNSIL
  const isAuthorized = useMemo(() => {
    return isDisposisiAuthorizedOfficial(effectiveCurrentUser, allUsers);
  }, [effectiveCurrentUser, allUsers]);

  // STRICT BUSINESS RULE: Saring hanya naskah yang sah didisposisikan (kecualikan Permohonan TTD)
  const disposableLetters = useMemo(() => {
    return allLetters.filter((l) => !isLetterSignatureRequest(l));
  }, [allLetters]);

  const isTargetSignatureRequest = letter ? isLetterSignatureRequest(letter) : false;

  // Target Disposisi Berjenjang Top-Down sesuai Matriks Kewenangan OTK UNSIL
  // Terintegrasi langsung dengan Manajemen Pengguna (allUsers)
  const hierarchicalTargets = useMemo(() => {
    return getHierarchicalDisposisiTargets(effectiveCurrentUser, allUsers);
  }, [effectiveCurrentUser, allUsers]);

  // Kalkulasi tanggal jatuh tempo berdasarkan SLA Peraturan Rektor No. 3/2023
  const calculateDueDateBySifat = (sifat) => {
    const d = new Date();
    const days = DISPOSISI_SLA_DAYS[sifat] || 2;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // State Manajemen Disposisi
  const [selectedLetterId, setSelectedLetterId] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [selectedTargetObj, setSelectedTargetObj] = useState(null);
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [customTargetUnit, setCustomTargetUnit] = useState('');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const unitDropdownRef = useRef(null);

  // State Instruksi Tindak Lanjut ("Untuk :") Format Contoh 21
  const [actions, setActions] = useState(['Proses sesuai prosedur']);
  const [koordinasiDetail, setKoordinasiDetail] = useState('');
  const [lainnyaDetail, setLainnyaDetail] = useState('');
  const [sifatInstruksi, setSifatInstruksi] = useState('Segera');
  const [customNote, setCustomNote] = useState('');
  const [dueDate, setDueDate] = useState(() => calculateDueDateBySifat('Segera'));
  const [validationError, setValidationError] = useState('');

  // SINKRONISASI MUTLAK: Selaraskan data naskah saat modal dibuka atau surat berubah
  useEffect(() => {
    if (!isOpen) return;

    // Utamakan letter prop yang diklik oleh pejabat
    const activeLetter = (letter && !isLetterSignatureRequest(letter))
      ? letter
      : (selectedLetterId ? disposableLetters.find((l) => l.id === selectedLetterId) : null) || disposableLetters[0] || null;

    if (activeLetter) {
      setSelectedLetterId(activeLetter.id);
    }

    // Default target bawahan sesuai pimpinan login
    const defaultTarget = hierarchicalTargets[0]?.nama || '';
    const existingTarget = activeLetter?.disposisi?.tujuanDisposisi || activeLetter?.disposisi?.targetUnit;
    const finalTargetName = existingTarget || defaultTarget;
    setTargetUnit(finalTargetName);

    const activeTargetObj = hierarchicalTargets.find((t) => t.nama === finalTargetName) || hierarchicalTargets[0] || null;
    setSelectedTargetObj(activeTargetObj);

    setIsCustomTarget(false);
    setCustomTargetUnit('');

    // Pre-fill butir instruksi jika surat sudah memiliki riwayat disposisi
    if (activeLetter?.disposisi?.actions && Array.isArray(activeLetter.disposisi.actions) && activeLetter.disposisi.actions.length > 0) {
      setActions(activeLetter.disposisi.actions);
    } else {
      setActions(['Proses sesuai prosedur']);
    }

    const currentSifat = activeLetter?.disposisi?.sifatInstruksi || activeLetter?.sifat || 'Segera';
    setSifatInstruksi(currentSifat);
    setDueDate(activeLetter?.disposisi?.batasWaktu || calculateDueDateBySifat(currentSifat));
    setCustomNote(activeLetter?.disposisi?.customNote || '');
    setKoordinasiDetail('');
    setLainnyaDetail('');
    setValidationError('');
    setIsUnitDropdownOpen(false);
  }, [isOpen, letter, hierarchicalTargets]);

  // Close dropdown target ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
        setIsUnitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Objek surat yang aktif sedang didisposisikan
  const selectedLetterObj = useMemo(() => {
    if (letter && !isTargetSignatureRequest) return letter;
    if (selectedLetterId) {
      const match = disposableLetters.find((l) => l.id === selectedLetterId);
      if (match) return match;
    }
    return disposableLetters[0] || null;
  }, [letter, selectedLetterId, disposableLetters, isTargetSignatureRequest]);

  const selectedTeamObj = useMemo(() => {
    return (
      hierarchicalTargets.find((t) => t.nama === targetUnit) ||
      hierarchicalTargets[0] || { nama: targetUnit || 'Unit Kerja Terkait', deskripsi: '' }
    );
  }, [targetUnit, hierarchicalTargets]);

  // Filter unit kerja bawahan berdasarkan pencarian
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

  // STRICT ACCESS CONTROL & VISIBILITY GUARD (Dipanggil setelah SEMUA hooks dideklarasikan)
  if (!isOpen || !isAuthorized) {
    return null;
  }

  // Handler toggle checklist instruksi
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

    if (!selectedLetterObj || isLetterSignatureRequest(selectedLetterObj)) {
      alert('ATURAN KETAT SISTEM: Naskah dinas ini berstatus Permohonan Tanda Tangan Elektronik (TTE) dan TIDAK DAPAT didisposisikan.');
      return;
    }

    const finalTarget = isCustomTarget ? customTargetUnit.trim() : targetUnit.trim();
    if (!finalTarget) {
      setValidationError('Mohon tentukan unit / pejabat bawahan penerima disposisi.');
      return;
    }

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

    const pemberiName = effectiveCurrentUser?.nama_lengkap || effectiveCurrentUser?.nama || effectiveCurrentUser?.name || 'Pimpinan Unit';
    const pemberiJabatan = effectiveCurrentUser?.jabatan || effectiveCurrentUser?.sotk_position_label || effectiveCurrentUser?.roleLabel || 'Pimpinan';

    const matchedTargetObj = (!isCustomTarget && selectedTargetObj && selectedTargetObj.nama === finalTarget)
      ? selectedTargetObj
      : hierarchicalTargets.find((t) => t.nama === finalTarget) || null;

    onSubmitDisposisi({
      letterId: selectedLetterObj.id,
      nomorAgenda: selectedLetterObj.nomorAgenda || `AGD-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      targetUnit: finalTarget,
      target_user_id: matchedTargetObj?.user_id || null,
      target_user_email: matchedTargetObj?.user_email || null,
      target_pejabat_nip: matchedTargetObj?.user_nip || null,
      target_pejabat_nama: matchedTargetObj?.user_nama || null,
      target_jabatan: finalTarget,
      sifatInstruksi,
      actions: finalizedActions,
      customNote,
      dueDate,
      pemberiName,
      pemberiJabatan,
      pemberiUserId: effectiveCurrentUser?.id || effectiveCurrentUser?.id_user || null,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Format Resmi UNSIL */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-950 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-unsil-gold-500/20 border border-unsil-gold-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <CheckSquare className="w-5 h-5 text-unsil-gold-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Lembar Disposisi Surat Masuk
                </h2>
                <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded bg-unsil-gold-400/20 text-unsil-gold-300 border border-unsil-gold-400/30">
                  Contoh 21
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Pemberi Arahan: <strong className="text-white">{effectiveCurrentUser?.nama_lengkap || effectiveCurrentUser?.name || 'Pimpinan Unit'}</strong> — {effectiveCurrentUser?.jabatan || effectiveCurrentUser?.roleLabel || 'Pejabat Struktural'}
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

        {/* Peringatan jika naskah Permohonan TTE */}
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
                className="px-5 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
            {/* KARTU IDENTITAS NASKAH DINAS YANG DIDISPOSISIKAN (Terkunci & Presisi) */}
            {selectedLetterObj && (
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/90 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-unsil-green-800 text-unsil-gold-300">
                      {selectedLetterObj.kategori || 'Surat Masuk'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-unsil-green-950">
                      No. Agenda: {selectedLetterObj.nomorAgenda || 'Terdaftar'}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    No. Surat: <strong className="text-slate-900">{selectedLetterObj.nomorSurat}</strong>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedLetterObj.perihal}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
                  <div>
                    <span>Asal / Pengirim: </span>
                    <strong className="text-slate-800">{selectedLetterObj.pengirim || 'Instansi Luar'}</strong>
                  </div>
                  <span>•</span>
                  <div>
                    <span>Tanggal Masuk: </span>
                    <strong className="text-slate-800">
                      {selectedLetterObj.tanggal || (typeof selectedLetterObj.created_at === 'string' ? selectedLetterObj.created_at.slice(0, 10) : '-')}
                    </strong>
                  </div>
                  <span>•</span>
                  <div>
                    <span>Sifat Naskah: </span>
                    <strong className="text-unsil-green-900">{selectedLetterObj.sifat || 'Biasa'}</strong>
                  </div>
                </div>

                {/* Selektor alternatif jika dibuka tanpa naskah spesifik */}
                {!letter && disposableLetters.length > 1 && (
                  <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Pilih Naskah Masuk Lainnya:</span>
                    <select
                      value={selectedLetterId}
                      onChange={(e) => setSelectedLetterId(e.target.value)}
                      className="p-1 px-2 bg-white border border-slate-300 rounded text-xs text-slate-800 max-w-[280px] truncate"
                    >
                      {disposableLetters.map((l) => (
                        <option key={l.id} value={l.id}>
                          [{l.nomorAgenda || l.nomorSurat}] - {l.perihal.slice(0, 45)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* BARIS TARGET BAWAHAN & PENGATURAN SLA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tujuan Disposisi Berjenjang */}
              <div className="md:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Diteruskan Kepada (Bawahan / Unit Pengolah Tujuan) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTarget(!isCustomTarget);
                      if (!isCustomTarget) {
                        setCustomTargetUnit('');
                      } else {
                        setTargetUnit(hierarchicalTargets[0]?.nama || '');
                      }
                    }}
                    className="text-[10.5px] text-unsil-green-800 hover:text-unsil-green-950 font-semibold hover:underline cursor-pointer"
                  >
                    {isCustomTarget ? '← Pilih dari Struktur SOTK' : '✍️ Ketik Manual Tujuan Lain'}
                  </button>
                </div>

                {isCustomTarget ? (
                  <input
                    type="text"
                    value={customTargetUnit}
                    onChange={(e) => {
                      setCustomTargetUnit(e.target.value);
                      setTargetUnit(e.target.value);
                    }}
                    placeholder="Ketik nama jabatan bawahan, nama staf, atau unit pengolah..."
                    className="w-full p-2.5 bg-amber-50/60 border border-amber-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20"
                    autoFocus
                    required
                  />
                ) : (
                  <div className="relative" ref={unitDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsUnitDropdownOpen((prev) => !prev)}
                      className="w-full p-2.5 bg-white border border-slate-300 hover:border-unsil-green-700 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded bg-unsil-green-800 text-unsil-gold-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900 truncate">{targetUnit || 'Pilih Subordinat / Unit'}</span>
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
                                    setSelectedTargetObj(team);
                                    setIsUnitDropdownOpen(false);
                                    setUnitSearchQuery('');
                                  }}
                                  className={`w-full p-2 rounded-lg text-left flex items-start justify-between gap-2 transition cursor-pointer ${
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
                                      <div className="flex items-center gap-1.5 truncate">
                                        <p className="text-xs font-bold leading-tight truncate">{team.nama}</p>
                                        {team.is_active_account && (
                                          <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200 shrink-0">
                                            Akun Terhubung
                                          </span>
                                        )}
                                      </div>
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
                )}
              </div>

              {/* Derajat Kecepatan & Batas Waktu */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Derajat Kecepatan / Sifat *
                </label>
                <select
                  value={sifatInstruksi}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSifatInstruksi(val);
                    setDueDate(calculateDueDateBySifat(val));
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                >
                  <option value="Sangat Segera">Sangat Segera (Maks. 24 Jam)</option>
                  <option value="Segera">Segera (Maks. 2 Hari Kerja)</option>
                  <option value="Biasa">Biasa (Maks. 5 Hari Kerja)</option>
                  <option value="Rahasia">Rahasia Internal (Maks. 3 Hari)</option>
                </select>
              </div>
            </div>

            {/* TABEL CHECKLIST 2 KOLOM (Format Disposisi Resmi UNSIL - Contoh 21) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/70 p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-unsil-green-800" />
                    <span>Instruksi Tindak Lanjut Naskah (Untuk :)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-unsil-green-900 font-semibold border border-emerald-300 ml-1">
                      Contoh 21
                    </span>
                  </label>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    Centang satu atau beberapa butir arahan pimpinan di bawah ini:
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10.5px]">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-unsil-green-800 hover:text-unsil-green-950 font-bold hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
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
                            ? 'bg-emerald-100/70 border border-emerald-300 text-unsil-green-950 font-semibold shadow-2xs'
                            : 'hover:bg-slate-100/80 border border-transparent text-slate-700'
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
                              ? 'bg-emerald-100/70 border border-emerald-300 text-unsil-green-950 font-semibold shadow-2xs'
                              : 'hover:bg-slate-100/80 border border-transparent text-slate-700'
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
                              placeholder="Tuliskan pihak / unit kerja koordinasi..."
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
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Grid: Catatan Khusus & Batas Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Catatan Tambahan Pimpinan (Opsional)
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
                  Tenggat Waktu Penyelesaian (SLA)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Otomatis dihitung sesuai SLA: <strong>{sifatInstruksi}</strong>.</span>
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
