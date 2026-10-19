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
  CornerDownRight,
  Users,
  UserCheck,
  Ban
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
  allUsers = [],
  allUnits = [],
  forwardFromDisposisi = null
}) => {
  // Master Data Unit Kerja (Reaktif terhadap CRUD di Manajemen Unit Kerja & Storage Event)
  const [liveUnits, setLiveUnits] = useState(() => {
    if (Array.isArray(allUnits) && allUnits.length > 0) return allUnits;
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('siloka_unit_kerja_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    if (Array.isArray(allUnits) && allUnits.length > 0) {
      setLiveUnits(allUnits);
    }
  }, [allUnits]);

  useEffect(() => {
    const handleUnitDataChanged = (event) => {
      const updated = event?.detail?.units;
      if (Array.isArray(updated) && updated.length > 0) {
        setLiveUnits(updated);
      } else {
        try {
          const saved = localStorage.getItem('siloka_unit_kerja_data');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setLiveUnits(parsed);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('SILOKA_UNIT_DATA_CHANGED', handleUnitDataChanged);
    window.addEventListener('storage', handleUnitDataChanged);
    return () => {
      window.removeEventListener('SILOKA_UNIT_DATA_CHANGED', handleUnitDataChanged);
      window.removeEventListener('storage', handleUnitDataChanged);
    };
  }, []);

  // Reaktivitas Real-Time terhadap Perubahan Manajemen Alur Disposisi dari Super Admin
  const [routingVersion, setRoutingVersion] = useState(0);
  useEffect(() => {
    const handleRoutingChanged = () => {
      setRoutingVersion((v) => v + 1);
    };
    window.addEventListener('SILOKA_DISPOSISI_ROUTING_CHANGED', handleRoutingChanged);
    window.addEventListener('storage', handleRoutingChanged);
    return () => {
      window.removeEventListener('SILOKA_DISPOSISI_ROUTING_CHANGED', handleRoutingChanged);
      window.removeEventListener('storage', handleRoutingChanged);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('siloka_unit_kerja_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLiveUnits(parsed);
          }
        }
      } catch (_) {}
    }
  }, [isOpen]);

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

  // STRICT BUSINESS RULE: Saring hanya naskah yang sah didisposisikan (kecualikan Permohonan TTD dan Surat yang Dibatalkan/Diarsipkan)
  const disposableLetters = useMemo(() => {
    return allLetters.filter(
      (l) =>
        !isLetterSignatureRequest(l) &&
        l.status !== 'Dibatalkan' &&
        l.status !== 'Dianulir' &&
        l.status !== 'Diarsipkan'
    );
  }, [allLetters]);

  const isTargetSignatureRequest = letter ? isLetterSignatureRequest(letter) : false;
  const isTargetCancelled = letter ? (letter.status === 'Dibatalkan' || letter.status === 'Dianulir' || Boolean(letter.isDibatalkan)) : false;

  // Target Disposisi Berjenjang Top-Down sesuai Matriks Kewenangan OTK UNSIL
  // Terintegrasi langsung dengan Manajemen Pengguna (allUsers), Manajemen Unit Kerja (liveUnits), dan Manajemen Alur Disposisi
  const hierarchicalTargets = useMemo(() => {
    return getHierarchicalDisposisiTargets(effectiveCurrentUser, allUsers, liveUnits);
  }, [effectiveCurrentUser, allUsers, liveUnits, routingVersion]);

  // Kalkulasi tanggal jatuh tempo berdasarkan SLA Peraturan Rektor No. 3/2023
  const calculateDueDateBySifat = (sifat) => {
    const d = new Date();
    const days = DISPOSISI_SLA_DAYS[sifat] || 2;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // State Manajemen Disposisi
  const [selectedLetterId, setSelectedLetterId] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const unitDropdownRef = useRef(null);

  // Target Utama (Lead PIC) dan String Representasi untuk Backwards Compatibility
  const leadTarget = selectedTargets[0] || null;
  const targetUnit = selectedTargets.map((t) => t.nama).join(', ');
  const selectedTargetObj = leadTarget;

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

    // STANDAR BAKU TATA NASKAH DINAS (Clean Slate):
    // Target bawahan penerima disposisi SELALU dimulai dalam keadaan KOSONG ([])
    // agar pimpinan/pejabat memilih sendiri pejabat bawahan tujuannya secara sadar.
    // Dilarang keras melakukan auto-restore atau pre-populate nama pejabat lain!
    setSelectedTargets([]);

    // Pre-fill butir instruksi jika surat diteruskan dari disposisi atasan atau default bersih
    if (forwardFromDisposisi) {
      const pStr = String(forwardFromDisposisi.pemberiDisposisi || '').toLowerCase();
      if (pStr.includes('rektor')) {
        setActions(['Ikuti Disposisi Rektor', 'Proses sesuai prosedur']);
      } else {
        setActions(['Proses sesuai prosedur']);
      }
      setCustomNote(
        forwardFromDisposisi.instruksi
          ? `Meneruskan arahan ${forwardFromDisposisi.pemberiDisposisi}: "${forwardFromDisposisi.instruksi}"`
          : (forwardFromDisposisi.catatan || '')
      );
    } else {
      setActions(['Proses sesuai prosedur']);
      setCustomNote('');
    }

    const currentSifat = forwardFromDisposisi?.sifatInstruksi || activeLetter?.sifat || 'Segera';
    setSifatInstruksi(currentSifat);
    setDueDate(calculateDueDateBySifat(currentSifat));
    setKoordinasiDetail('');
    setLainnyaDetail('');
    setValidationError('');
    setIsUnitDropdownOpen(false);
    setUnitSearchQuery('');
  }, [isOpen, letter, hierarchicalTargets, forwardFromDisposisi]);

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
      leadTarget ||
      hierarchicalTargets[0] || { nama: 'Unit Kerja Terkait', deskripsi: '' }
    );
  }, [leadTarget, hierarchicalTargets]);

  // Handler Multi-Recipient Disposisi
  const handleToggleTarget = (team) => {
    setValidationError('');
    setSelectedTargets((prev) => {
      const exists = prev.some((t) => t.id === team.id || t.nama === team.nama);
      if (exists) {
        return prev.filter((t) => t.id !== team.id && t.nama !== team.nama);
      }
      return [...prev, team];
    });
  };

  const handleRemoveTarget = (teamToRemove, e) => {
    if (e) e.stopPropagation();
    setValidationError('');
    setSelectedTargets((prev) => prev.filter((t) => t.id !== teamToRemove.id && t.nama !== teamToRemove.nama));
  };

  const handleSetLeadTarget = (targetToLead, e) => {
    if (e) e.stopPropagation();
    setSelectedTargets((prev) => {
      const filtered = prev.filter((t) => t.id !== targetToLead.id && t.nama !== targetToLead.nama);
      return [targetToLead, ...filtered];
    });
  };

  // Filter unit kerja bawahan berdasarkan pencarian
  const filteredTeams = useMemo(() => {
    if (!unitSearchQuery.trim()) return hierarchicalTargets;
    const q = unitSearchQuery.toLowerCase();
    return hierarchicalTargets.filter(
      (t) =>
        t.nama.toLowerCase().includes(q) ||
        (t.deskripsi && t.deskripsi.toLowerCase().includes(q)) ||
        (t.badge && t.badge.toLowerCase().includes(q)) ||
        (t.cluster && t.cluster.toLowerCase().includes(q)) ||
        (t.user_nama && t.user_nama.toLowerCase().includes(q)) ||
        (t.user_nip && t.user_nip.toLowerCase().includes(q)) ||
        (t.user_email && t.user_email.toLowerCase().includes(q))
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

  const handleCloseModal = () => {
    setSelectedTargets([]);
    setValidationError('');
    setIsUnitDropdownOpen(false);
    setUnitSearchQuery('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isTargetCancelled || selectedLetterObj?.status === 'Dibatalkan' || selectedLetterObj?.status === 'Dianulir') {
      alert('ATURAN KETAT SISTEM: Naskah dinas ini berstatus Dibatalkan dan TIDAK DAPAT didisposisikan.');
      return;
    }

    if (!selectedLetterObj || isLetterSignatureRequest(selectedLetterObj)) {
      alert('ATURAN KETAT SISTEM: Naskah dinas ini berstatus Permohonan Tanda Tangan Elektronik (TTE) dan TIDAK DAPAT didisposisikan.');
      return;
    }

    if (selectedTargets.length === 0) {
      setValidationError('Mohon tentukan minimal satu pejabat bawahan penerima disposisi.');
      return;
    }

    // KAIDAH MUTLAK TATA NASKAH DINAS (Pasal 55 ayat 3 Peraturan Rektor No. 3/2023):
    // Cek apakah ada target yang melanggar hierarki komando disposisi (bawahan mendisposisikan ke Rektor)
    const isUserRektor =
      !String(effectiveCurrentUser?.jabatan || '').toLowerCase().includes('wakil') &&
      (String(effectiveCurrentUser?.jabatan || '').toLowerCase().includes('rektor') ||
        effectiveCurrentUser?.role === 'REKTOR' ||
        effectiveCurrentUser?.subRoleKey === 'REKTOR');

    const hasRektorTarget = selectedTargets.some((t) => {
      const tNama = String(t.nama || '').toLowerCase();
      const tDesk = String(t.deskripsi || '').toLowerCase();
      return (
        t.user_id === 'usr-01' ||
        t.id === 'tgt-rektor' ||
        (tNama.includes('rektor') && !tNama.includes('wakil')) ||
        (tDesk.includes('rektor') && !tDesk.includes('wakil'))
      );
    });

    if (!isUserRektor && hasRektorTarget) {
      setValidationError(
        'Pejabat bawahan tidak dapat mendisposisikan naskah kepada Rektor. Gunakan Nota Dinas atau Surat Balasan untuk pelaporan ke pimpinan.'
      );
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

    const primaryTarget = selectedTargets[0];
    const targetsPayload = selectedTargets.map((t, idx) => ({
      id: t.id,
      targetUnit: t.nama,
      target_user_id: t.user_id || null,
      target_user_email: t.user_email || null,
      target_pejabat_nip: t.user_nip || null,
      target_pejabat_nama: t.user_nama || null,
      target_jabatan: t.nama,
      isLead: idx === 0,
      isRead: false,
      readAt: null,
      readBy: null,
      readByNip: null
    }));

    const finalTarget = selectedTargets.map((t) => t.nama).join(', ');

    onSubmitDisposisi({
      letterId: selectedLetterObj.id,
      nomorAgenda: selectedLetterObj.nomorAgenda || `AGD-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      targetUnit: finalTarget,
      target_user_id: primaryTarget?.user_id || null,
      target_user_email: primaryTarget?.user_email || null,
      target_pejabat_nip: primaryTarget?.user_nip || null,
      target_pejabat_nama: primaryTarget?.user_nama || null,
      target_jabatan: primaryTarget?.nama || finalTarget,
      targets: targetsPayload,
      sifatInstruksi,
      actions: finalizedActions,
      customNote,
      dueDate,
      pemberiName,
      pemberiJabatan,
      pemberiUserId: effectiveCurrentUser?.id || effectiveCurrentUser?.id_user || null,
      parentDisposisiId: forwardFromDisposisi?.id || null,
      forwardedFrom: forwardFromDisposisi?.pemberiDisposisi || null,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      isRead: false,
      readAt: null,
      readBy: null,
      readByNip: null,
      readers: []
    });
    handleCloseModal();
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
            onClick={handleCloseModal}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Peringatan jika naskah dibatalkan */}
        {isTargetCancelled ? (
          <div className="p-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-800 flex items-center justify-center mx-auto shadow-sm">
              <Ban className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fitur Disposisi Ditiadakan (Naskah Dibatalkan)
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Naskah dinas <strong>{letter?.nomorAgenda || letter?.nomorSurat}</strong> telah <strong>Dibatalkan</strong> oleh petugas persuratan. Sesuai asas kepatuhan administrasi kearsipan, naskah yang dibatalkan terkunci mutlak dan <strong>DILARANG didisposisikan</strong> kepada unit atau pejabat bawahan.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        ) : isTargetSignatureRequest ? (
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
                onClick={handleCloseModal}
                className="px-5 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
            {/* Banner Penerusan Disposisi */}
            {forwardFromDisposisi && (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
                <CornerDownRight className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Penerusan Disposisi</p>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Meneruskan arahan dari <strong>{forwardFromDisposisi.pemberiDisposisi}</strong>: "{forwardFromDisposisi.instruksi}"
                  </p>
                </div>
              </div>
            )}

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
                      onChange={(e) => {
                        setSelectedLetterId(e.target.value);
                        setSelectedTargets([]);
                        setValidationError('');
                        setIsUnitDropdownOpen(false);
                        setUnitSearchQuery('');
                      }}
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
                  <span className="text-[10px] text-slate-400 font-medium">
                    Hierarki Resmi SOTK UNSIL
                  </span>
                </div>

                <div className="relative" ref={unitDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsUnitDropdownOpen((prev) => !prev)}
                      className={`w-full p-2.5 bg-white border ${
                        selectedTargets.length === 0 && validationError ? 'border-red-400' : 'border-slate-300 hover:border-unsil-green-700'
                      } rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 cursor-pointer`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded bg-unsil-green-800 text-unsil-gold-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        {selectedTargets.length === 0 ? (
                          <span className="text-slate-400 italic">Pilih satu atau lebih pejabat bawahan...</span>
                        ) : selectedTargets.length === 1 ? (
                          <>
                            <span className="font-bold text-slate-900 truncate">{leadTarget?.nama}</span>
                            {leadTarget?.is_active_account && (
                              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200 shrink-0">
                                [Akun Terhubung]
                              </span>
                            )}
                            {leadTarget?.deskripsi && (
                              <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                                — {leadTarget.deskripsi}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-900 truncate">
                              {selectedTargets.length} Pejabat Dituju
                            </span>
                            <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                              (Utama: {leadTarget?.nama})
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-1">
                        {selectedTargets.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-unsil-green-900 font-bold border border-emerald-200">
                            {selectedTargets.length} Pejabat
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUnitDropdownOpen ? 'rotate-180 text-unsil-green-800' : ''}`} />
                      </div>
                    </button>

                    {/* Ringkasan Chip Pejabat Terpilih */}
                    {selectedTargets.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        {selectedTargets.map((team, idx) => {
                          const isLead = idx === 0;
                          return (
                            <div
                              key={team.id || `selected-chip-${idx}`}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                                isLead
                                  ? 'bg-emerald-50 text-unsil-green-950 border-emerald-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isLead ? (
                                <UserCheck className="w-3.5 h-3.5 text-unsil-green-800 shrink-0" />
                              ) : (
                                <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-900 truncate max-w-[210px]" title={team.nama}>
                                {team.nama}
                              </span>
                              <span
                                className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                  isLead ? 'bg-unsil-green-800 text-unsil-gold-300' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isLead ? 'Utama' : 'Koordinasi'}
                              </span>
                              {!isLead && (
                                <button
                                  type="button"
                                  onClick={(e) => handleSetLeadTarget(team, e)}
                                  title="Jadikan pejabat ini sebagai Penanggung Jawab Utama (PIC)"
                                  className="text-[10px] text-unsil-green-800 hover:text-unsil-green-950 font-semibold hover:underline cursor-pointer ml-0.5"
                                >
                                  Jadikan Utama
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleRemoveTarget(team, e)}
                                title="Hapus dari daftar penerima disposisi"
                                className="w-3.5 h-3.5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 transition cursor-pointer ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Searchable Dropdown Menu */}
                    {isUnitDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={unitSearchQuery}
                              onChange={(e) => setUnitSearchQuery(e.target.value)}
                              placeholder="Cari pejabat, NIP, unit bawahan, atau klaster..."
                              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-unsil-green-800 focus:bg-white text-slate-800 placeholder-slate-400"
                              autoFocus
                            />
                          </div>
                          {selectedTargets.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedTargets([])}
                              className="text-[10px] text-red-600 hover:underline font-semibold shrink-0"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
                          {filteredTeams.length > 0 ? (
                            filteredTeams.map((team, idx) => {
                              const isSelected = selectedTargets.some((t) => t.id === team.id || t.nama === team.nama);
                              const isLead = isSelected && selectedTargets[0]?.nama === team.nama;
                              const showClusterHeader =
                                team.cluster &&
                                (!unitSearchQuery.trim() || true) &&
                                (idx === 0 || team.cluster !== filteredTeams[idx - 1]?.cluster);

                              return (
                                <div key={team.id || `team-${idx}`}>
                                  {showClusterHeader && (
                                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-unsil-green-900 bg-emerald-50/70 border-y border-emerald-100/60 sticky top-0 z-10 backdrop-blur-xs flex items-center justify-between">
                                      <span>{team.cluster}</span>
                                      <span className="text-[9px] font-medium text-slate-500">Klaster Resmi SOTK</span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTarget(team)}
                                    className={`w-full p-2 rounded-lg text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-50/90 text-unsil-green-950 font-semibold'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5 truncate">
                                      {/* Checkbox visual */}
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                                        isSelected
                                          ? 'bg-unsil-green-800 border-unsil-green-800 text-white'
                                          : 'border-slate-300 bg-white'
                                      }`}>
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                      </div>
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5 truncate">
                                          <p className="text-xs font-bold leading-tight truncate">{team.nama}</p>
                                          {team.is_active_account ? (
                                            <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200 shrink-0">
                                              [Akun Terhubung]
                                            </span>
                                          ) : (
                                            <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                              [Belum Terhubung]
                                            </span>
                                          )}
                                        </div>
                                        {team.deskripsi && (
                                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{team.deskripsi}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                      {team.badge && (
                                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                          {team.badge}
                                        </span>
                                      )}
                                      {isSelected && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                          isLead
                                            ? 'bg-unsil-green-800 text-unsil-gold-300'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                          {isLead ? 'Utama' : 'Koordinasi'}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Tidak ditemukan unit bawahan terkait.
                            </div>
                          )}
                        </div>

                        {/* Dropdown Footer */}
                        <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {selectedTargets.length} pejabat dipilih
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsUnitDropdownOpen(false)}
                            className="px-2.5 py-1 bg-unsil-green-800 hover:bg-unsil-green-900 text-white rounded-md text-[10.5px] font-semibold shadow-2xs transition cursor-pointer"
                          >
                            Selesai Memilih
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                  onClick={handleCloseModal}
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
