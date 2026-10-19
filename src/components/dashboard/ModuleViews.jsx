import React, { useState, useMemo, useEffect } from 'react';
import {
  SendHorizontal,
  FileSignature,
  Archive,
  Vault,
  Settings,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  FolderLock,
  HardDrive,
  UserCheck,
  Server,
  Download,
  Building2,
  Users,
  Search,
  CheckCircle,
  Key,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Lock,
  AlertCircle,
  Info,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  CheckSquare,
  RotateCcw,
  Plus,
  FileCheck,
  Send,
  Inbox,
  Share2,
  Eye,
  Layers,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { JRA_MASTER_ITEMS, JRA_PRIMARY_CATEGORIES } from '../../config/jraMasterCatalog';
import dispositionsData from '../../data/dispositions.json';
import metricsData from '../../data/metrics.json';
import unitKerjaList from '../../data/unitKerja.json';
import usersData from '../../data/users.json';
import { StatusBadge } from '../ui/Badge';
import { getDisposisiReadSummary } from '../../utils/disposisiTrackingHelper';
import {
  isDosenTanpaJabatan,
  getQueueAccessPolicy,
  isLetterOwnedByUser,
  isMandiriPersonalDocument,
  isSuperAdminUser
} from '../../utils/authGuards';
import { isDisposisiAuthorizedOfficial } from '../../utils/disposisiStandards';

export const DisposisiView = ({
  onSelectLetter,
  letters = [],
  onOpenNewDisposisi,
  currentUser,
  dispositionOverrides = {},
  onFollowUpDisposisi,
  onUpdateDisposisiStatus,
  onCompleteDisposisi,
  onForwardDisposisi,
  initialPerspective
}) => {
  const userJabatanLower = String(
    currentUser?.jabatan ||
    currentUser?.sotk_position_label ||
    currentUser?.roleLabel ||
    currentUser?.role_label ||
    ''
  ).toLowerCase();
  const userUnitLower = String(currentUser?.unit || currentUser?.unitKerja || '').toLowerCase();
  const userNameLower = String(currentUser?.nama_lengkap || currentUser?.name || currentUser?.nama || '').toLowerCase();
  const userId = currentUser?.id || currentUser?.id_user || null;

  const isRektor = userJabatanLower.includes('rektor') && !userJabatanLower.includes('wakil');
  const isWakilRektor = userJabatanLower.includes('wakil rektor');
  const isPejabat = isDisposisiAuthorizedOfficial(currentUser);

  // Hak Akses Pengawasan Audit Kearsipan Tab "Semua Disposisi"
  // Sesuai SKKAAD No. 2803/2023 & Peraturan Rektor No. 3/2023:
  // Hanya berwenang dibuka oleh Super Admin, Pengawas SPI (Satuan Pengawas Internal), dan Rektor (Monitoring Kampus)
  const canViewAllDispositions = useMemo(() => {
    if (!currentUser) return false;
    if (isSuperAdminUser(currentUser)) return true;
    if (
      currentUser.role === 'PENGAWAS' ||
      currentUser.unit_kerja_id === 'UN58.SPI' ||
      /pengawas|spi\b/i.test(userJabatanLower)
    ) {
      return true;
    }
    if (isRektor) return true;
    return false;
  }, [currentUser, userJabatanLower, isRektor]);

  // Tab Perspektif Sesuai Peraturan Rektor No. 3/2023 Pasal 55
  // Pimpinan Tertinggi (Rektor) mengarah ke mode pengawasan, sedangkan bawahan ke tugas masuk
  const [activePerspective, setActivePerspective] = useState(() => {
    if (initialPerspective) {
      if (initialPerspective === 'SEMUA' && !canViewAllDispositions) {
        return 'TUGAS_MASUK';
      }
      return initialPerspective;
    }
    return isRektor ? 'ARAHAN_SAYA' : 'TUGAS_MASUK';
  });

  // Jaga konsistensi tab saat beralih akun pengguna (Switch User)
  useEffect(() => {
    if (activePerspective === 'SEMUA' && !canViewAllDispositions) {
      setActivePerspective(isRektor ? 'ARAHAN_SAYA' : 'TUGAS_MASUK');
    }
  }, [activePerspective, canViewAllDispositions, isRektor]);

  const [activeStatusFilter, setActiveStatusFilter] = useState('SEMUA'); // 'SEMUA' | 'DALAM_PROSES' | 'MENUNGGU_TELAAH' | 'SELESAI'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlurGuide, setShowAlurGuide] = useState(true);
  const [modalTargetDisp, setModalTargetDisp] = useState(null);
  const [modalStatus, setModalStatus] = useState('Dalam Proses');
  const [modalNote, setModalNote] = useState('');

  const mergedDispositions = useMemo(() => {
    const list = [...dispositionsData];
    letters.forEach((letter) => {
      // Surat yang dibatalkan tidak boleh masuk ke antrean disposisi aktif
      if (letter.status === 'Dibatalkan' || letter.status === 'Dianulir' || letter.isDibatalkan) {
        return;
      }
      if (letter.disposisi) {
        const exists = list.some(
          (d) => d.letterId === letter.id || d.nomorAgenda === letter.disposisi.nomorAgenda
        );
        if (!exists) {
          list.unshift({
            id: `disp-${letter.id}`,
            letterId: letter.id,
            nomorAgenda: letter.disposisi.nomorAgenda || `AGD-2026/${letter.id}`,
            status: letter.disposisi.status || 'Dalam Proses',
            pemberiDisposisi: letter.disposisi.pemberiDisposisi || 'Pimpinan Unit',
            pemberiUserId: letter.disposisi.pemberiUserId || null,
            target_user_id: letter.disposisi.target_user_id || null,
            targets: letter.disposisi.targets || [],
            penerimaDisposisi: Array.isArray(letter.disposisi.targets) && letter.disposisi.targets.length > 1
              ? `${letter.disposisi.targets[0].targetUnit} + ${letter.disposisi.targets.length - 1} Pejabat Lainnya`
              : (letter.disposisi.target_pejabat_nama
                ? `${letter.disposisi.targetUnit} — ${letter.disposisi.target_pejabat_nama}`
                : (letter.disposisi.targetUnit || letter.disposisi.tujuanDisposisi || 'Unit Terkait')),
            targetUnit: letter.disposisi.targetUnit || '',
            target_jabatan: letter.disposisi.target_jabatan || '',
            instruksi: letter.disposisi.instruksi || 'Tindak lanjuti sesuai arahan pimpinan',
            tanggalDisposisi: letter.disposisi.timestamp || letter.disposisi.tanggalDisposisi || letter.tanggal || 'Hari ini',
            sifatInstruksi: letter.disposisi.sifatInstruksi || 'Segera',
            catatan: letter.disposisi.customNote || letter.disposisi.catatan || '',
            naskahBalasanNomor: letter.disposisi.naskahBalasanNomor || null,
            resolvedNote: letter.disposisi.resolvedNote || null
          });
        }
      }
    });

    // Sinkronkan status efektif dengan state overrides & letters
    const resolvedList = list.map((item) => {
      const correspondingLetter = letters.find(
        (l) => l.id === item.letterId || l.nomorAgenda === item.nomorAgenda || l.disposisi?.nomorAgenda === item.nomorAgenda
      );
      const override =
        dispositionOverrides[item.id] ||
        (item.letterId && dispositionOverrides[`disp-${item.letterId}`]) ||
        (item.nomorAgenda && dispositionOverrides[item.nomorAgenda]) ||
        (correspondingLetter?.id && dispositionOverrides[`disp-${correspondingLetter.id}`]) ||
        {};

      const effectiveStatus = override.status || correspondingLetter?.disposisi?.status || item.status || 'Dalam Proses';
      const effectiveNote = override.catatanProgres || correspondingLetter?.disposisi?.catatanProgres || item.catatan || '';
      const effectiveBalasan = override.naskahBalasanNomor || correspondingLetter?.disposisi?.naskahBalasanNomor || item.naskahBalasanNomor || null;
      const effectiveResolved = override.resolvedNote || correspondingLetter?.disposisi?.resolvedNote || item.resolvedNote || null;

      return {
        ...item,
        status: effectiveStatus,
        catatanProgres: effectiveNote,
        naskahBalasanNomor: effectiveBalasan,
        resolvedNote: effectiveResolved,
        letter: correspondingLetter
      };
    });

    return resolvedList.filter((disp) => {
      const corresponding = letters.find(
        (l) => l.id === disp.letterId || l.nomorAgenda === disp.nomorAgenda || l.disposisi?.nomorAgenda === disp.nomorAgenda
      );
      return !corresponding || (corresponding.status !== 'Dibatalkan' && corresponding.status !== 'Dianulir' && !corresponding.isDibatalkan);
    });
  }, [letters, dispositionOverrides]);

  // Evaluasi apakah pengguna aktif adalah Pemberi Disposisi (Pimpinan / Pembuat Arahan)
  const isItemIssuer = (disp) => {
    if (!disp) return false;
    const pStr = String(disp.pemberiDisposisi || '').toLowerCase();

    // 1. Jika arahan berasal dari Rektor, hanya akun Rektor yang merupakan pemberi
    if (pStr.includes('rektor') && !pStr.includes('wakil')) {
      return isRektor;
    }

    // 2. Cocokkan ID pengguna pemberi jika bukan pimpinan universitas
    if (userId && disp.pemberiUserId && String(disp.pemberiUserId) === String(userId)) {
      return true;
    }

    // 3. Nama lengkap pengguna cocok
    if (userNameLower && userNameLower.length > 3 && pStr.includes(userNameLower)) {
      return true;
    }

    // 4. Wakil Rektor
    if (isWakilRektor && pStr.includes('wakil rektor')) {
      if (userJabatanLower.includes('akademik') && (pStr.includes('akademik') || pStr.includes('wr 1') || pStr.includes('wr i'))) return true;
      if (userJabatanLower.includes('keuangan') && (pStr.includes('keuangan') || pStr.includes('wr 2') || pStr.includes('wr ii'))) return true;
      if (userJabatanLower.includes('kemahasiswaan') && (pStr.includes('kemahasiswaan') || pStr.includes('wr 3') || pStr.includes('wr iii'))) return true;
      if ((userJabatanLower.includes('kerjasama') || userJabatanLower.includes('perencanaan')) && (pStr.includes('kerjasama') || pStr.includes('perencanaan') || pStr.includes('wr 4') || pStr.includes('wr iv'))) return true;
    }

    // 5. Kepala Biro BKU (Dr. Nana Sujana) - Khusus akun pejabat struktural Kepala Biro BKU
    const isKabiroBku = (userJabatanLower.includes('kepala biro') || userJabatanLower.includes('kabiro')) &&
      (userJabatanLower.includes('biro keuangan') || userJabatanLower.includes('bku'));
    if (isKabiroBku && (pStr.includes('nana sujana') || pStr.includes('bku') || pStr.includes('biro keuangan'))) {
      return true;
    }

    // 6. Dekan Fakultas - Khusus akun Dekan
    const isDekan = userJabatanLower.includes('dekan') && !userJabatanLower.includes('wakil');
    if (isDekan && pStr.includes('dekan')) {
      const fakultasKeywords = ['teknik', 'ft', 'keguruan', 'fkip', 'ekonomi', 'feb', 'pertanian', 'faperta', 'ilmu kesehatan', 'fikes', 'hukum', 'fh', 'agama islam', 'fai'];
      const myFakultas = fakultasKeywords.find((kw) => userJabatanLower.includes(kw) || userUnitLower.includes(kw));
      if (myFakultas && pStr.includes(myFakultas)) return true;
    }

    return false;
  };

  // Evaluasi apakah pengguna aktif adalah Penerima Disposisi (Subordinat / Ditargetkan)
  const isItemAssignee = (disp) => {
    if (!disp) return false;

    // 0. Cek di daftar multi-targets jika naskah didisposisikan ke beberapa pejabat
    if (Array.isArray(disp.targets) && disp.targets.length > 0) {
      const matchInTargets = disp.targets.some((tgt) => {
        if (userId && tgt.target_user_id && String(tgt.target_user_id) === String(userId)) return true;
        const tStr = [tgt.targetUnit, tgt.target_jabatan, tgt.target_pejabat_nama].filter(Boolean).join(' ').toLowerCase();
        if (userNameLower && userNameLower.length > 3 && tStr.includes(userNameLower)) return true;
        if (!isDosenTanpaJabatan(currentUser)) {
          if (userJabatanLower && (tStr.includes(userJabatanLower) || userJabatanLower.includes(tStr))) return true;
        }
        return false;
      });
      if (matchInTargets) return true;
    }

    // 1. ID penerima cocok
    if (userId && disp.target_user_id && String(disp.target_user_id) === String(userId)) {
      return true;
    }

    const multiTargetStr = Array.isArray(disp.targets)
      ? disp.targets.map((t) => `${t.targetUnit} ${t.target_jabatan || ''} ${t.target_pejabat_nama || ''}`).join(' ')
      : '';

    const targetStr = [
      disp.penerimaDisposisi,
      disp.targetUnit,
      disp.target_jabatan,
      disp.tujuanDisposisi,
      multiTargetStr
    ].filter(Boolean).join(' ').toLowerCase();

    // 2. Nama penerima cocok secara eksplisit
    if (userNameLower && userNameLower.length > 3 && targetStr.includes(userNameLower)) {
      return true;
    }

    // 2b. DOSEN TANPA JABATAN STRUKTURAL (Prinsip Need-to-Know SKKAAD SK No. 2803/2023 & Peraturan Rektor No. 3/2023):
    // Dosen tanpa tugas tambahan/jabatan hanya berhak mengakses disposisi yang secara spesifik menugaskan nama/ID-nya.
    // Dilarang mencocokkan target pimpinan unit (Dekan, Rektor, WR, dsb.) hanya karena mengajar di fakultas yang sama!
    if (isDosenTanpaJabatan(currentUser)) {
      return false;
    }

    // 3. Wakil Rektor
    if (isWakilRektor) {
      if (userJabatanLower.includes('akademik') && (targetStr.includes('akademik') || targetStr.includes('wr 1') || targetStr.includes('wr i') || targetStr.includes('usr-warek-01'))) return true;
      if (userJabatanLower.includes('keuangan') && (targetStr.includes('keuangan') || targetStr.includes('wr 2') || targetStr.includes('wr ii') || targetStr.includes('usr-warek-02'))) return true;
      if (userJabatanLower.includes('kemahasiswaan') && (targetStr.includes('kemahasiswaan') || targetStr.includes('wr 3') || targetStr.includes('wr iii'))) return true;
      if ((userJabatanLower.includes('kerjasama') || userJabatanLower.includes('perencanaan')) && (targetStr.includes('kerjasama') || targetStr.includes('perencanaan') || targetStr.includes('wr 4') || targetStr.includes('wr iv'))) return true;
    }

    // 4. Kepala Biro BKU
    const isKabiroBku = (userJabatanLower.includes('kepala biro') || userJabatanLower.includes('kabiro')) &&
      (userJabatanLower.includes('biro keuangan') || userJabatanLower.includes('bku'));
    if (isKabiroBku &&
        (targetStr.includes('biro keuangan') || targetStr.includes('bku') || targetStr.includes('nana sujana'))) {
      return true;
    }

    // 5. Dekan Fakultas
    const isDekan = userJabatanLower.includes('dekan') && !userJabatanLower.includes('wakil');
    if (isDekan) {
      if (targetStr.includes('para dekan') || targetStr.includes('seluruh dekan')) return true;
      const fakultasKeywords = ['teknik', 'ft', 'keguruan', 'fkip', 'ekonomi', 'feb', 'pertanian', 'faperta', 'ilmu kesehatan', 'fikes', 'hukum', 'fh', 'agama islam', 'fai'];
      const myFakultas = fakultasKeywords.find((kw) => userJabatanLower.includes(kw) || userUnitLower.includes(kw));
      if (myFakultas && targetStr.includes(myFakultas)) return true;
    }

    // 6. Sub Bagian Perencanaan
    if (userJabatanLower.includes('perencanaan') && targetStr.includes('perencanaan')) {
      return true;
    }

    // 7. Sarpras / PPK
    if ((userJabatanLower.includes('sarpras') || userJabatanLower.includes('ppk')) &&
        (targetStr.includes('sarpras') || targetStr.includes('ppk'))) {
      return true;
    }

    // 8. Staf Pelaksana / Operator Unit Kerja (Membantu alur disposisi unit kerjanya)
    if (currentUser?.role === 'OPERATOR_UNIT' || currentUser?.role === 'STAFF' || userJabatanLower.includes('staf') || userJabatanLower.includes('operator')) {
      if (userUnitLower && userUnitLower.length > 3 && targetStr.includes(userUnitLower)) {
        if (!targetStr.includes('para dekan') || isDekan) {
          return true;
        }
      }
    }

    // 9. Jabatan spesifik langsung
    if (currentUser?.jabatan && currentUser.jabatan.length > 3 && targetStr.includes(currentUser.jabatan.toLowerCase())) {
      return true;
    }

    return false;
  };

  // Kandidat Tugas Masuk (Diterima) - Penegakan Isolasi Need-to-Know SK No. 2803/2023
  // Dosen/staf tanpa penugasan tidak boleh melihat disposisi unit/pimpinan lain (Tanpa Fallback Longgar)
  const incomingCandidates = useMemo(() => {
    return mergedDispositions.filter((d) => isItemAssignee(d));
  }, [mergedDispositions, isItemAssignee]);

  // Kandidat Arahan Saya (Dikeluarkan / Monitoring Keluar)
  const outgoingCandidates = useMemo(() => {
    return mergedDispositions.filter((d) => isItemIssuer(d));
  }, [mergedDispositions, isItemIssuer]);

  // Hitungan tab perspektif
  const perspectiveCounts = useMemo(() => {
    return {
      incoming: incomingCandidates.length,
      outgoing: outgoingCandidates.length,
      all: mergedDispositions.length
    };
  }, [incomingCandidates, outgoingCandidates, mergedDispositions]);

  // Data yang aktif berdasarkan tab perspektif
  const perspectiveItems = useMemo(() => {
    if (activePerspective === 'ARAHAN_SAYA') {
      return outgoingCandidates;
    }
    if (activePerspective === 'TUGAS_MASUK') {
      return incomingCandidates;
    }
    return mergedDispositions;
  }, [activePerspective, outgoingCandidates, incomingCandidates, mergedDispositions]);

  // Hitungan tab status berdasarkan perspektif aktif
  const counts = useMemo(() => {
    return {
      total: perspectiveItems.length,
      dalamProses: perspectiveItems.filter((d) => d.status === 'Dalam Proses').length,
      menungguTelaah: perspectiveItems.filter((d) => d.status === 'Menunggu Telaah').length,
      selesai: perspectiveItems.filter((d) => d.status === 'Selesai').length
    };
  }, [perspectiveItems]);

  const filteredDispositions = useMemo(() => {
    let result = perspectiveItems;

    if (activeStatusFilter === 'DALAM_PROSES') {
      result = result.filter((d) => d.status === 'Dalam Proses');
    } else if (activeStatusFilter === 'MENUNGGU_TELAAH') {
      result = result.filter((d) => d.status === 'Menunggu Telaah');
    } else if (activeStatusFilter === 'SELESAI') {
      result = result.filter((d) => d.status === 'Selesai');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) =>
        (d.nomorAgenda && d.nomorAgenda.toLowerCase().includes(q)) ||
        (d.pemberiDisposisi && d.pemberiDisposisi.toLowerCase().includes(q)) ||
        (d.penerimaDisposisi && d.penerimaDisposisi.toLowerCase().includes(q)) ||
        (d.instruksi && d.instruksi.toLowerCase().includes(q)) ||
        (d.letter?.perihal && d.letter.perihal.toLowerCase().includes(q)) ||
        (d.letter?.nomorSurat && d.letter.nomorSurat.toLowerCase().includes(q))
      );
    }

    return result;
  }, [perspectiveItems, activeStatusFilter, searchQuery]);

  const handleOpenUpdateModal = (disp) => {
    setModalTargetDisp(disp);
    setModalStatus(disp.status === 'Selesai' ? 'Dalam Proses' : disp.status);
    setModalNote(disp.catatanProgres || '');
  };

  const handleConfirmComplete = (disp) => {
    if (window.confirm(`Tandai E-Disposisi agenda ${disp.nomorAgenda} sebagai SELESAI ditindaklanjuti?`)) {
      if (onCompleteDisposisi) {
        onCompleteDisposisi(disp.id, disp.letterId, 'Tindak lanjut koordinasi/tugas telah selesai dilaksanakan.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Utama Modul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-unsil-green-800" />
            Pengendalian E-Disposisi Elektronik
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat kendali dan tindak lanjut lembar disposisi naskah dinas ({perspectiveCounts.all} Total Lembar Disposisi)
          </p>
        </div>
        {isDisposisiAuthorizedOfficial(currentUser) && (
          <button
            onClick={onOpenNewDisposisi}
            className="inline-flex items-center gap-2 px-4 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
            <span>+ Buat Disposisi Baru</span>
          </button>
        )}
      </div>

      {/* Tab Perspektif Sesuai Peran SOTK UNSIL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Tugas Masuk */}
          <button
            type="button"
            onClick={() => setActivePerspective('TUGAS_MASUK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activePerspective === 'TUGAS_MASUK'
                ? 'bg-unsil-green-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-unsil-gold-400" />
            <span>Tugas Masuk (Diterima)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activePerspective === 'TUGAS_MASUK' ? 'bg-unsil-green-950 text-unsil-gold-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {perspectiveCounts.incoming}
            </span>
          </button>

          {/* Tab Arahan Saya (Khusus Pimpinan / Pejabat) */}
          {(isPejabat || isRektor || perspectiveCounts.outgoing > 0) && (
            <button
              type="button"
              onClick={() => setActivePerspective('ARAHAN_SAYA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activePerspective === 'ARAHAN_SAYA'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SendHorizontal className="w-3.5 h-3.5 text-amber-300" />
              <span>{isRektor ? 'Monitoring Arahan Rektor' : 'Arahan Saya (Monitoring Keluar)'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activePerspective === 'ARAHAN_SAYA' ? 'bg-amber-950 text-amber-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {perspectiveCounts.outgoing}
              </span>
            </button>
          )}

          {/* Tab Semua Disposisi - Khusus Audit (Super Admin, Pengawas SPI, & Rektor) */}
          {canViewAllDispositions && (
            <button
              type="button"
              onClick={() => setActivePerspective('SEMUA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activePerspective === 'SEMUA'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Semua Disposisi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activePerspective === 'SEMUA' ? 'bg-slate-950 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {perspectiveCounts.all}
              </span>
            </button>
          )}
        </div>

        {/* Indikator Status Akun Aktif */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span className="font-medium">Peran:</span>
          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {isRektor ? 'Pimpinan Tertinggi (Rektor)' : isWakilRektor ? 'Pimpinan Koordinatif (Wakil Rektor)' : isPejabat ? 'Pejabat Struktural Unit' : 'Pelaksana / Subordinat'}
          </span>
        </div>
      </div>

      {/* Banner Konteks Kerja Sesuai Perspektif */}
      {activePerspective === 'ARAHAN_SAYA' ? (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">Mode Monitoring Arahan Pimpinan:</span>
              <span className="text-amber-900 ml-1">
                Memantau kepatuhan instruksi dan kemajuan tindak lanjut naskah dinas oleh unit/pejabat penerima.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 shrink-0 self-start sm:self-auto">
            Pemantauan Arahan
          </span>
        </div>
      ) : activePerspective === 'TUGAS_MASUK' ? (
        <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-unsil-green-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-unsil-green-800 shrink-0" />
            <div>
              <span className="font-bold">Antrean Tugas Masuk:</span>
              <span className="text-unsil-green-900 ml-1">
                Tindak lanjuti arahan dengan menyusun Nota Dinas balasan, telaah staf, memperbarui progres, atau teruskan berjenjang.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-unsil-green-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 shrink-0 self-start sm:self-auto">
            Tugas Masuk
          </span>
        </div>
      ) : activePerspective === 'SEMUA' ? (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
            <div>
              <span className="font-bold">Mode Pengawasan Kearsipan Global:</span>
              <span className="text-slate-600 ml-1">
                Akses audit kepatuhan tindak lanjut lembar disposisi universitas (Prinsip SKKAAD SK No. 2803/2023).
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300 shrink-0 self-start sm:self-auto">
            Audit Kearsipan SPI & Administrator
          </span>
        </div>
      ) : null}

      {/* Panduan Alur Singkat Persuratan UNSIL (Mudah Dipahami Orang Awam) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-4 sm:p-5 rounded-xl border border-emerald-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-unsil-green-950 font-bold text-xs sm:text-sm">
            <Info className="w-4 h-4 text-unsil-green-800 shrink-0" />
            <span>Panduan Alur Persuratan & E-Disposisi UNSIL (Tata Naskah Dinas Resmi)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAlurGuide(!showAlurGuide)}
            className="text-xs font-semibold text-unsil-green-900 hover:text-unsil-green-950 flex items-center gap-1 cursor-pointer"
          >
            <span>{showAlurGuide ? 'Sembunyikan' : 'Buka Panduan'}</span>
            {showAlurGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showAlurGuide && (
          <div className="mt-3.5 pt-3.5 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/85 p-3 rounded-lg border border-emerald-100 shadow-2xs">
              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] mb-1">
                Tahap 1: Pintu Loket TU
              </span>
              <h4 className="font-bold text-slate-800">1. Registrasi Surat Masuk</h4>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Staf TU mendaftarkan surat di menu <strong>Surat Masuk</strong>. Nomor Agenda resmi terbit seketika dan masuk kotak pimpinan.
              </p>
            </div>

            <div className="bg-white/85 p-3 rounded-lg border border-amber-100 shadow-2xs">
              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] mb-1">
                Tahap 2: Arahan Pimpinan
              </span>
              <h4 className="font-bold text-slate-800">2. Lembar Disposisi (Contoh 21)</h4>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Pimpinan mengisi checklist arahan resmi & tenggat waktu (SLA). Surat muncul di sini dengan status <strong>Dalam Proses</strong>.
              </p>
            </div>

            <div className="bg-white/85 p-3 rounded-lg border border-indigo-100 shadow-2xs">
              <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px] mb-1">
                Tahap 3: Tindak Lanjut
              </span>
              <h4 className="font-bold text-slate-800">3. Aksi Subordinat / Bawahan</h4>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Bawahan klik <strong>"Buat Surat Balasan"</strong> (Nota Dinas / Telaah Staf) atau koordinasi langsung. Status berubah ke <strong>Menunggu Telaah</strong>.
              </p>
            </div>

            <div className="bg-white/85 p-3 rounded-lg border border-purple-100 shadow-2xs">
              <span className="inline-block px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px] mb-1">
                Tahap 4: Tuntas & Arsip
              </span>
              <h4 className="font-bold text-slate-800">4. Pengesahan TTE & Arsip JRA</h4>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Saat TTE pimpinan dibubuhkan pada naskah balasan, disposisi otomatis menjadi <strong>Selesai</strong> dan tersimpan di <strong>Retensi Arsip</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Kolom Pencarian */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveStatusFilter('SEMUA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeStatusFilter === 'SEMUA'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusFilter('DALAM_PROSES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeStatusFilter === 'DALAM_PROSES'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Dalam Proses ({counts.dalamProses})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusFilter('MENUNGGU_TELAAH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeStatusFilter === 'MENUNGGU_TELAAH'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Menunggu Telaah ({counts.menungguTelaah})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusFilter('SELESAI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeStatusFilter === 'SELESAI'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Selesai ({counts.selesai})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari agenda, perihal, atau unit..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-unsil-green-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Grid Kartu Disposisi */}
      {filteredDispositions.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <SendHorizontal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">
              {activePerspective === 'ARAHAN_SAYA'
                ? 'Belum ada arahan disposisi keluar yang Anda terbitkan'
                : activePerspective === 'TUGAS_MASUK'
                ? 'Tidak ada tugas disposisi masuk yang perlu ditindaklanjuti'
                : 'Tidak ada lembar disposisi ditemukan'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? 'Coba ubah kata kunci pencarian Anda.'
                : canViewAllDispositions
                ? 'Gunakan tab "Semua Disposisi" untuk melihat seluruh riwayat lembar disposisi.'
                : 'Anda tidak memiliki penugasan lembar disposisi aktif saat ini.'}
            </p>
          </div>
          {canViewAllDispositions && activePerspective !== 'SEMUA' && (
            <button
              type="button"
              onClick={() => setActivePerspective('SEMUA')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Tampilkan Semua Disposisi ({perspectiveCounts.all})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDispositions.map((disp) => {
            const letter = disp.letter || letters.find((l) => l.id === disp.letterId || l.nomorAgenda === disp.nomorAgenda || l.disposisi?.nomorAgenda === disp.nomorAgenda);
            const isFinished = disp.status === 'Selesai';
            const isIssuer = isItemIssuer(disp);
            const isAssignee = isItemAssignee(disp);

            return (
              <div
                key={disp.id}
                className={`bg-white p-5 rounded-xl border shadow-xs space-y-3.5 transition hover:shadow-md ${
                  isFinished ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                {/* Header Kartu: No. Agenda, Badge Peran, & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-unsil-green-950 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {disp.nomorAgenda}
                    </span>
                    {/* Badge Penanda Peran Aktif */}
                    {isIssuer ? (
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <SendHorizontal className="w-2.5 h-2.5 text-amber-700" />
                        <span>{isRektor ? 'Arahan Rektor' : 'Arahan Anda'}</span>
                      </span>
                    ) : isAssignee ? (
                      <span className="text-[10px] font-bold text-unsil-green-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Inbox className="w-2.5 h-2.5 text-unsil-green-800" />
                        <span>Tugas Masuk</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-slate-500" />
                        <span>Audit Pengawasan</span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 shrink-0 ${
                      disp.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : disp.status === 'Menunggu Telaah'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        disp.status === 'Selesai'
                          ? 'bg-emerald-500'
                          : disp.status === 'Menunggu Telaah'
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                    ></span>
                    <span>{disp.status}</span>
                  </span>
                </div>

                {/* Ringkasan Surat Asal (Bisa Diklik untuk Pratinjau Surat Asli) */}
                <div
                  onClick={() => {
                    if (letter && onSelectLetter) {
                      onSelectLetter(letter);
                    }
                  }}
                  className={`p-3 rounded-lg border transition ${
                    letter
                      ? 'bg-slate-50 hover:bg-slate-100 cursor-pointer border-slate-200'
                      : 'bg-slate-50/80 border-slate-100'
                  }`}
                  title={letter ? 'Klik untuk membaca naskah surat lengkap' : ''}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {letter ? letter.perihal : `Naskah Terkait Agenda ${disp.nomorAgenda}`}
                    </p>
                    {letter && (
                      <span className="text-[10px] font-semibold text-unsil-green-800 bg-emerald-100/60 px-1.5 py-0.5 rounded shrink-0">
                        Lihat Surat ↗
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {letter ? letter.nomorSurat : `Surat Asal Referensi Disposisi`}
                  </p>
                </div>

                {/* Metadata Pihak & Arahan Resmi */}
                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-slate-700 shrink-0">Pemberi:</span>
                    <span className="text-slate-800">{disp.pemberiDisposisi}</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-slate-700 shrink-0">Tujuan:</span>
                    <span className="text-slate-800">{disp.penerimaDisposisi}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100/90 text-emerald-950 font-medium leading-relaxed">
                    "{disp.instruksi}"
                  </div>
                  {disp.catatan && (
                    <div className="text-[11px] text-slate-500 italic px-1">
                      Catatan: {disp.catatan}
                    </div>
                  )}
                  {disp.naskahBalasanNomor && (
                    <div className="p-2 rounded bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-950 font-semibold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>Naskah Balasan Disusun: {disp.naskahBalasanNomor}</span>
                    </div>
                  )}
                </div>

                {/* Stempel Waktu, Keterbacaan, & Sifat */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {disp.tanggalDisposisi}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const readSummary = getDisposisiReadSummary(disp);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            readSummary.isAllRead
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title={readSummary.isAllRead ? `Dibaca oleh: ${disp.readBy || 'Penerima'}` : 'Menunggu dibuka oleh pejabat'}
                        >
                          {readSummary.isAllRead ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                              <span>Dibaca</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-rose-500" />
                              <span>Belum Dibaca</span>
                            </>
                          )}
                        </span>
                      );
                    })()}
                    <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                      Sifat: {disp.sifatInstruksi}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Nyata Berdasarkan Peran (Pemberi vs Penerima) */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {!isFinished ? (
                    isIssuer ? (
                      /* Mode Pemberi / Pimpinan (Monitoring Arahan Sendiri) */
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (letter && onSelectLetter) {
                                onSelectLetter(letter);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                            title="Pratinjau naskah surat asal yang didisposisikan"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Pratinjau Surat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(disp)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                            title="Pantau progres tindak lanjut atau perbarui catatan evaluasi"
                          >
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Pantau Progres</span>
                          </button>

                          {disp.naskahBalasanNomor && (
                            <button
                              type="button"
                              onClick={() => {
                                if (letter && onSelectLetter) {
                                  onSelectLetter(letter);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                              title="Periksa draf naskah dinas balasan dari bawahan"
                            >
                              <FileCheck className="w-3 h-3 text-indigo-600" />
                              <span>Periksa Balasan</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmComplete(disp)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          title="Sahkan bahwa arahan dinas telah tuntas dipenuhi"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Tutup Disposisi</span>
                        </button>
                      </>
                    ) : isAssignee ? (
                      /* Mode Penerima / Subordinat (Eksekusi Tindak Lanjut Tugas) */
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (onFollowUpDisposisi) {
                                onFollowUpDisposisi(disp, letter);
                              }
                            }}
                            className="px-3 py-1.5 bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                            title="Susun Nota Dinas atau Surat Balasan untuk menindaklanjuti arahan ini"
                          >
                            <Send className="w-3 h-3 text-unsil-gold-300" />
                            <span>Buat Surat Balasan</span>
                          </button>

                          {/* Fitur Disposisi Lanjutan bagi Pejabat Struktural Penerima (Wakil Rektor, Dekan, Kabiro) */}
                          {isPejabat && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onForwardDisposisi) {
                                  onForwardDisposisi(disp, letter);
                                } else if (onOpenNewDisposisi) {
                                  onOpenNewDisposisi();
                                }
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 transition flex items-center gap-1 cursor-pointer"
                              title="Teruskan arahan secara berjenjang ke unit bawahan"
                            >
                              <Share2 className="w-3 h-3 text-amber-700" />
                              <span>Disposisi Lanjutan</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(disp)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Perbarui progres telaah staf atau perkembangan tugas"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>Update Progres</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmComplete(disp)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                          title="Tandai selesai jika tugas cukup diselesaikan melalui koordinasi tanpa surat balasan"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Selesai</span>
                        </button>
                      </>
                    ) : (
                      /* Mode Audit / Pengawasan Kearsipan (Super Admin / Pengawas SPI di Tab Semua) */
                      <div className="flex items-center justify-between w-full pt-1">
                        <div className="flex items-center gap-1.5">
                          {letter && onSelectLetter && (
                            <button
                              type="button"
                              onClick={() => onSelectLetter(letter)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                              title="Pratinjau naskah surat dinas asli terkait lembar disposisi ini"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>Pratinjau Naskah</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 italic">
                          Mode Pengawasan Audit (Read-Only)
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="w-full p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span>Disposisi Tuntas & Terarsip</span>
                      </div>
                      <span className="text-[10px] font-normal text-emerald-700">
                        {disp.resolvedNote || 'Selesai ditindaklanjuti'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog: Update Progres Disposisi */}
      {modalTargetDisp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-unsil-green-800" />
                <h3 className="font-bold text-sm text-slate-900">Perbarui Progres Disposisi</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTargetDisp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-700">
                <span className="font-mono font-bold text-unsil-green-950 text-xs block">
                  {modalTargetDisp.nomorAgenda}
                </span>
                <p className="mt-1 font-medium text-slate-800 line-clamp-2">
                  "{modalTargetDisp.instruksi}"
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Status Progres Saat Ini:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStatus('Dalam Proses')}
                    className={`p-2.5 rounded-lg border text-left font-semibold transition cursor-pointer ${
                      modalStatus === 'Dalam Proses'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Dalam Proses</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal block mt-1">
                      Sedang dikerjakan/koordinasi
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStatus('Menunggu Telaah')}
                    className={`p-2.5 rounded-lg border text-left font-semibold transition cursor-pointer ${
                      modalStatus === 'Menunggu Telaah'
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>Menunggu Telaah</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal block mt-1">
                      Kajian staf sedang disusun
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Progres Tindak Lanjut:
                </label>
                <textarea
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Contoh: Sedang menyusun telaah staf ketersediaan pagu bersama tim keuangan..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-unsil-green-800 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalTargetDisp(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateDisposisiStatus) {
                    onUpdateDisposisiStatus(modalTargetDisp.id, modalTargetDisp.letterId, modalStatus, modalNote);
                  }
                  setModalTargetDisp(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-xs cursor-pointer"
              >
                Simpan Pembaruan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ParafTteView = ({ letters = [], currentUser, onSelectLetter, onSignSuccess }) => {
  const isStrictPersonalDosen = isDosenTanpaJabatan(currentUser);
  const accessPolicy = getQueueAccessPolicy(currentUser);
  const lockedCreatorId = String(currentUser?.id_user || currentUser?.id || 'req.user.id');
  const activeUserName = currentUser?.nama_lengkap || currentUser?.nama || currentUser?.name || 'Dosen Aktif';

  // Matriks Kewenangan Pengesahan TTE BSrE:
  // - Pejabat Struktural & Super Admin (Otoritas Penuh): BISA
  // - Staf TU & Dosen Fungsional: DIHAPUS TOTAL DARI DOM (Terkunci)
  const isSuperAdmin = isSuperAdminUser(currentUser);
  const isDosenRole = isStrictPersonalDosen || currentUser?.role === 'DOSEN' || currentUser?.role_slug === 'drafter';
  const isStaffRole = currentUser?.role === 'STAF' || currentUser?.role === 'STAF_PERSURATAN' || currentUser?.role === 'OPERATOR_UNIT' || currentUser?.role_slug === 'admin_tu';
  const isPejabatStruktural = Boolean(
    currentUser?.is_pejabat === true ||
    currentUser?.role === 'PEJABAT' ||
    currentUser?.role === 'PIMPINAN' ||
    currentUser?.role_slug === 'pimpinan' ||
    (currentUser?.roleLevel && currentUser.roleLevel.toLowerCase().includes('pimpinan'))
  );
  const canUserSignBsre = (isPejabatStruktural || isSuperAdmin) && !isDosenRole && !isStaffRole;

  // Filter antrean berdasarkan kebijakan:
  // - Jika Dosen Tanpa Jabatan: STRICT PERSONAL ISOLATION (WHERE creator_id = $1 AND status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE'))
  // - Jika 3 Entitas Pengecualian (Pimpinan Struktural, Staf TU/Arsiparis, Super Admin): Melihat daftar antrean sesuai yurisdiksi unit
  const pendingLetters = useMemo(() => {
    const baseQueue = letters.filter(
      (l) =>
        l.status === 'Diparaf' ||
        l.status === 'DRAFT' ||
        l.status === 'SIAP_TTE' ||
        l.status === 'Dikirim' ||
        l.status === 'Dibaca'
    );

    if (isStrictPersonalDosen) {
      return baseQueue.filter((l) => isLetterOwnedByUser(l, currentUser));
    }

    return baseQueue;
  }, [letters, currentUser, isStrictPersonalDosen]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-amber-600" />
            Antrean E-Paraf & Tanda Tangan Elektronik (TTE)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Otorisasi naskah dinas digital tersertifikasi Balai Sertifikasi Elektronik (BSrE BSSN)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isStrictPersonalDosen ? (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5">
              <FolderLock className="w-4 h-4 text-amber-700" /> Strict Personal Isolation (SKKAAD)
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-700" /> {accessPolicy.entityLabel}
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Passphrase TTE Aktif
          </span>
        </div>
      </div>

      {/* Banner Keamanan Isolasi Data Pribadi (SKKAAD SK Rektor No. 2803 Tahun 2023) */}
      {isStrictPersonalDosen ? (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-5 rounded-xl border border-emerald-800/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                <FolderLock className="w-3.5 h-3.5" /> Kepatuhan SKKAAD — SK Rektor UNSIL No. 2803 Tahun 2023
              </div>
              <h3 className="text-sm font-bold text-white">
                Prinsip Perlindungan Naskah Pribadi: {activeUserName}
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Sebagai <strong>Dosen</strong>, Anda dapat melihat, memeriksa draf, dan membubuhkan TTE pada naskah dinas mandiri yang Anda susun (seperti <em>Nota Dinas</em> atau <em>Laporan Tridharma</em>). Sesuai ketentuan kerahasiaan SKKAAD, berkas naskah milik rekan dosen lain tetap terlindungi dalam sistem.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <div className="px-3.5 py-2 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-right">
                <span className="block text-[10px] text-emerald-300 font-medium">Status Ruang Kerja</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 justify-end mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Terlindungi Aman
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-indigo-950 space-y-0.5">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              Otorisasi Akses Antrean Naskah ({accessPolicy.entityLabel})
            </p>
            <p className="text-slate-600">
              Hanya <strong>Pimpinan Unit Struktural</strong> (Target TTE Akhir), <strong>Staf Ketatausahaan / Arsiparis TU</strong> (Penomoran Resmi), dan <strong>Administrator Sistem</strong> yang diizinkan mengelola antrean naskah unit kerja.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-600">
          <span>
            {isStrictPersonalDosen
              ? `Daftar Naskah & Draf Pribadi Milik ${activeUserName} (${pendingLetters.length} Dokumen)`
              : `Daftar Surat Menunggu Persetujuan / Paraf (${pendingLetters.length} Dokumen)`}
          </span>
          {isStrictPersonalDosen && (
            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <FolderLock className="w-3 h-3 text-emerald-700" /> Arsip Pribadi Terisolasi
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {pendingLetters.map((letter) => {
            const isMandiriDoc = isMandiriPersonalDocument(letter);
            return (
              <div
                key={letter.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{letter.nomorSurat}</span>
                    <StatusBadge status={letter.status} />
                    {isStrictPersonalDosen && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isMandiriDoc
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-sky-50 text-sky-800 border-sky-300'
                        }`}
                      >
                        {isMandiriDoc
                          ? '✓ Kategori Mandiri (TTE oleh Anda Sendiri)'
                          : '↗ Konsep Diajukan ke Pimpinan (TTE Pimpinan)'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">{letter.perihal}</h4>
                  <p className="text-xs text-slate-500">
                    Pembuat/Pengirim: <strong>{letter.pengirim}</strong> • Tujuan: <strong>{letter.tujuan}</strong> • Klasifikasi: {letter.kodeKlasifikasi}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectLetter(letter)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Periksa Draft
                  </button>
                  {canUserSignBsre ? (
                    <button
                      onClick={() => {
                        onSignSuccess && onSignSuccess(letter.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      <FileSignature className="w-3.5 h-3.5 text-unsil-gold-400" />
                      <span>Bubuhkan TTE</span>
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
                      title="Naskah dinas ini diajukan untuk diverifikasi dan ditandatangani oleh Pejabat Struktural yang berwenang"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Menunggu TTE Pimpinan</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const RetensiArsipView = ({ letters = [], currentUser = null }) => {
  const [activeTab, setActiveTab] = useState('katalog'); // 'katalog' | 'monitoring' | 'alur_pemusnahan'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedNasib, setSelectedNasib] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter 448 item master JRA SK Rektor No. 2803/2023
  const filteredArchives = useMemo(() => {
    let result = JRA_MASTER_ITEMS || [];

    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => item.kode_utama === selectedCategory);
    }

    if (selectedNasib !== 'ALL') {
      result = result.filter((item) => {
        const nasib = (item.nasib_akhir || '').toLowerCase();
        if (selectedNasib === 'MUSNAH') return nasib.includes('musnah');
        if (selectedNasib === 'PERMANEN') return nasib.includes('permanen');
        if (selectedNasib === 'DINILAI') return nasib.includes('dinilai') || nasib.includes('evaluasi');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          (item.kode_klasifikasi && item.kode_klasifikasi.toLowerCase().includes(q)) ||
          (item.nama_klasifikasi && item.nama_klasifikasi.toLowerCase().includes(q)) ||
          (item.perihal && item.perihal.toLowerCase().includes(q)) ||
          (item.deskripsi_jra && item.deskripsi_jra.toLowerCase().includes(q)) ||
          (item.nama_sub && item.nama_sub.toLowerCase().includes(q))
      );
    }

    return result;
  }, [searchQuery, selectedCategory, selectedNasib]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedNasib]);

  const totalPages = Math.ceil(filteredArchives.length / pageSize) || 1;
  const paginatedArchives = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArchives.slice(start, start + pageSize);
  }, [filteredArchives, currentPage, pageSize]);

  // Data seri arsip vital & monitoring berkas (Safeguard)
  const monitoredSeries = useMemo(() => {
    const defaultSeries = [
      {
        kode: 'KU.02.01',
        namaSeri: 'Kuitansi Belanja Operasional, Honorarium & Pajak',
        retensiAktif: '2 Tahun',
        retensiInaktif: '5 Tahun',
        statusAkhir: 'Dimusnahkan',
        safeguard: false,
        keterangan: 'Pindah otomatis ke Inaktif -> Siap musnah tahun 2026'
      },
      {
        kode: 'PP.02.00',
        namaSeri: 'Bukti Pembayaran Kuliah (UKT Mahasiswa)',
        retensiAktif: '2 Tahun',
        retensiInaktif: '3 Tahun',
        statusAkhir: 'Dimusnahkan',
        safeguard: false,
        keterangan: 'Pindah otomatis ke Inaktif -> Siap musnah sesuai jadwal'
      },
      {
        kode: 'KU.02.01.h',
        namaSeri: 'Laporan Keuangan Tahunan (Audited BPK-RI)',
        retensiAktif: '2 Tahun',
        retensiInaktif: '10 Tahun',
        statusAkhir: 'Permanen',
        safeguard: true,
        keterangan: 'Folder Kunci (Safeguard) - Terkunci otomatis, tidak bisa dihapus staf'
      },
      {
        kode: 'KR.07.00',
        namaSeri: 'Gambar As-Built Drawing & Instalasi Gedung Mugarsari',
        retensiAktif: 'Selama Gedung Berdiri',
        retensiInaktif: 'Permanen',
        statusAkhir: 'Permanen',
        safeguard: true,
        keterangan: 'Folder Kunci (Safeguard) - Arsip Vital Terkunci'
      },
      {
        kode: 'PL.09.00',
        namaSeri: 'Sertifikat Kepemilikan Tanah & BMN UNSIL',
        retensiAktif: 'Selama Berlaku',
        retensiInaktif: 'Permanen',
        statusAkhir: 'Permanen',
        safeguard: true,
        keterangan: 'Folder Kunci (Safeguard) - Brankas Digital Terlindungi Aman'
      }
    ];

    return defaultSeries.map((s) => {
      const matchCount = (letters || []).filter((l) => {
        const c = String(l.kodeKlasifikasi || l.subKlasifikasi || '');
        return c.startsWith(s.kode) || (s.kode.startsWith(c) && c.length >= 2);
      }).length;
      return {
        ...s,
        jumlahBerkas: Math.max(matchCount + 4, 8)
      };
    });
  }, [letters]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-700" />
            Jadwal Retensi Arsip (JRA) Universitas Siliwangi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Katalog lengkap 448 Kode Klasifikasi & Jadwal Retensi Arsip resmi sesuai <strong>SK Rektor No. 2803 Tahun 2023</strong> dan Pedoman ANRI.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('katalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'katalog'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Katalog JRA (448 Kode)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monitoring')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'monitoring'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monitoring Berkas & Safeguard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alur_pemusnahan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'alur_pemusnahan'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alur Pemusnahan Arsip (ANRI)
          </button>
        </div>
      </div>

      {/* TAB 1: KATALOG JRA */}
      {activeTab === 'katalog' && (
        <>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau perihal arsip..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              >
                <option value="ALL">Semua Kategori Pokok (18 Urusan)</option>
                {JRA_PRIMARY_CATEGORIES.map((cat) => (
                  <option key={cat.kode} value={cat.kode}>
                    {cat.kode} — {cat.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedNasib}
                onChange={(e) => setSelectedNasib(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              >
                <option value="ALL">Semua Nasib Akhir</option>
                <option value="MUSNAH">Musnah</option>
                <option value="PERMANEN">Permanen / Statis</option>
                <option value="DINILAI">Dinilai Kembali</option>
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{filteredArchives.length}</span> kode ditemukan
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  <th className="py-3 px-4">Kode & Klasifikasi Arsip</th>
                  <th className="py-3 px-4">Retensi Aktif</th>
                  <th className="py-3 px-4">Retensi Inaktif</th>
                  <th className="py-3 px-4">Nasib Akhir</th>
                  <th className="py-3 px-4">Keamanan</th>
                  <th className="py-3 px-4">Unit Pengolah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedArchives.length > 0 ? (
                  paginatedArchives.map((item, idx) => (
                    <tr key={`${item.kode_klasifikasi}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-medium max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-800 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {item.kode_klasifikasi}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.kode_utama}</span>
                        </div>
                        <p className="font-semibold text-slate-900 mt-1 text-xs">{item.nama_klasifikasi}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.keterangan_klasifikasi || item.deskripsi_jra}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {item.ket_retensi_aktif || `${item.retensi_aktif || 1} Tahun`}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {item.ket_retensi_inaktif || `${item.retensi_inaktif || 1} Tahun`}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[11px] inline-block ${
                            (item.nasib_akhir || '').toLowerCase().includes('permanen')
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : (item.nasib_akhir || '').toLowerCase().includes('musnah')
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {item.nasib_akhir || 'Dinilai Kembali'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            item.kode_keamanan === 'SR'
                              ? 'bg-purple-100 text-purple-900'
                              : item.kode_keamanan === 'R'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.klasifikasi_keamanan || (item.kode_keamanan === 'SR' ? 'Sangat Rahasia' : item.kode_keamanan === 'R' ? 'Rahasia' : 'Biasa')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                        {item.unit_pengolah || 'Unit Terkait'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Tidak ditemukan arsip dengan kata kunci atau filter tersebut.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredArchives.length} entri)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 text-slate-700 cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 text-slate-700 cursor-pointer"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: MONITORING BERKAS & SAFEGUARD */}
      {activeTab === 'monitoring' && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Berkas Terdaftar</span>
              <p className="text-2xl font-bold text-slate-900">{letters.length} Naskah</p>
              <p className="text-[11px] text-emerald-700">Tersinkronisasi sistem persuratan</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Safeguard Terkunci</span>
              <p className="text-2xl font-bold text-indigo-700">3 Seri Vital</p>
              <p className="text-[11px] text-indigo-600">Proteksi hak hapus akun staf</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Arsip Aktif</span>
              <p className="text-2xl font-bold text-emerald-800">
                {letters.filter((l) => l.status === 'Disetujui' || l.status === 'Didisposisikan' || l.status === 'Selesai').length} Naskah
              </p>
              <p className="text-[11px] text-slate-500">Masa retensi berjalan (1-2 tahun)</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Status Nasib Akhir</span>
              <p className="text-2xl font-bold text-purple-700">Permanen &amp; BAPA</p>
              <p className="text-[11px] text-purple-600">Sesuai Peraturan Rektor No. 3/2023</p>
            </div>
          </div>

          {/* Monitored Series Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900">Seri Berkas Utama &amp; Kebijakan Safeguard ANRI</h3>
                <p className="text-[11px] text-slate-500">Pengawasan masa simpan aktif, inaktif, dan penanda kunci arsip vital</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Otomasi Evaluasi JRA
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  <th className="py-3 px-4">Kode &amp; Seri Arsip</th>
                  <th className="py-3 px-4">Masa Aktif</th>
                  <th className="py-3 px-4">Masa Inaktif</th>
                  <th className="py-3 px-4">Nasib Akhir</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Keterangan ANRI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {monitoredSeries.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <span className="font-mono text-emerald-800 font-bold block">{a.kode}</span>
                      <span>{a.namaSeri}</span>
                    </td>
                    <td className="py-3 px-4">{a.retensiAktif}</td>
                    <td className="py-3 px-4">{a.retensiInaktif}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                            a.statusAkhir === 'Permanen'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {a.statusAkhir}
                        </span>
                        {a.safeguard && (
                          <span
                            className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"
                            title="Folder Kunci: Tidak bisa dihapus akun staf"
                          >
                            <Lock className="w-2.5 h-2.5 text-amber-300" />
                            Safeguard
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold">{a.jumlahBerkas} Berkas</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{a.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALUR PEMUSNAHAN ARSIP */}
      {activeTab === 'alur_pemusnahan' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              Alur Prosedural Pemusnahan Arsip Resmi (UU No. 43/2009 & SK Rektor No. 2803/2023)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Sesuai kaidah kearsipan nasional (ANRI), arsip kedinasan negara <strong>TIDAK PERNAH dimusnahkan secara otomatis oleh komputer</strong>.
              Setiap pemusnahan wajib melalui pengusulan, penilaian fisik/administratif oleh Panitia Penilai, penetapan persetujuan pimpinan, dan penerbitan Berita Acara Pemusnahan Arsip (BAPA).
            </p>
          </div>

          {/* Warning Legal Box */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-900">Ketentuan Hukum Pemusnahan Arsip:</p>
              <p className="leading-relaxed">
                Pemusnahan arsip tanpa prosedur dan tanpa persetujuan Rektor/ANRI merupakan pelanggaran pidana kearsipan (Pasal 86 UU No. 43 Tahun 2009). Status JRA "Musnah" adalah dasar legal penilaian retensi inaktif, bukan tombol penghapusan otomatis.
              </p>
            </div>
          </div>

          {/* 5-Step Procedural Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-xs text-slate-900">Pembentukan Panitia</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Rektor menetapkan Panitia Penilai Arsip yang beranggotakan Unit Pengolah, Unit Kearsipan, Tim Hukum, dan Pengawas Internal (SPI).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-xs text-slate-900">Penyusunan DUPA</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Unit pengolah menyusun Daftar Usul Pemusnahan Arsip (DUPA) untuk berkas inaktif yang telah habis masa retensinya sesuai katalog JRA.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-xs text-slate-900">Penilaian &amp; Verifikasi</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Panitia melakukan pemeriksaan fisik dan substansi untuk memastikan arsip tidak memiliki nilai guna sekunder, hukum, atau sengketa.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="font-bold text-xs text-slate-900">Persetujuan &amp; SK</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Penerbitan Surat Persetujuan Pemusnahan oleh Kepala ANRI (jika disyaratkan) dan Keputusan Rektor tentang Penetapan Pemusnahan Arsip.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                5
              </div>
              <h4 className="font-bold text-xs text-slate-900">Eksekusi Fisik &amp; BAPA</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pemusnahan fisik (pencacahan total) disaksikan sekurang-kurangnya 2 pejabat (Hukum &amp; SPI) disertai penandatanganan Berita Acara (BAPA).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const BrankasDigitalView = () => {
  const assets = [
    {
      nama: 'Sertifikat Hak Pakai Tanah Kampus Mugarsari No. 00042/2017',
      kategori: 'Aset Vital BMN',
      ukuran: '14.2 MB (Arsip Terlindungi)',
      tglUpload: '14 Jan 2025',
      akses: 'Kepala Biro Only'
    },
    {
      nama: 'Master Perjanjian Kerja Sama (MoU) Perbankan Mitra UNSIL 2024-2028',
      kategori: 'Perjanjian Hukum',
      ukuran: '8.5 MB (Arsip Terlindungi)',
      tglUpload: '10 Mei 2025',
      akses: 'Pimpinan & Tim Hukum'
    },
    {
      nama: 'SK Penetapan Tarif Layanan BLU Universitas Siliwangi',
      kategori: 'Regulasi Keuangan',
      ukuran: '6.1 MB (Arsip Terlindungi)',
      tglUpload: '02 Feb 2026',
      akses: 'Semua Pejabat BKU'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Vault className="w-5 h-5 text-emerald-800" />
            Brankas Digital Kearsipan Vital
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penyimpanan dokumen sensitif, sertifikat aset tanah, dan naskah dinas rahasia dengan perlindungan keamanan berstandar tinggi
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> Pengamanan Arsip Terlindungi
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Berkas Vital</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">856 Dokumen</div>
          <p className="text-[11px] text-emerald-700 mt-1">100% Tersimpan Aman</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-400 font-semibold uppercase">Kapasitas Ruang Simpan Kampus</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">4.1 GB / 10.0 GB</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-unsil-green-700 h-full w-[41%]" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-400 font-semibold uppercase">Pemeriksaan Keaslian Berkas</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">Terverifikasi Sah</div>
          <p className="text-[11px] text-slate-500 mt-1">Pemeriksaan integritas tiap 24 jam</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-700">
          Daftar Arsip Vital & Rahasia BKU
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {assets.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/60 border border-emerald-200 flex items-center justify-center text-unsil-green-800">
                  <FolderLock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.nama}</p>
                  <p className="text-[11px] text-slate-500">
                    {item.kategori} • {item.ukuran} • Diunggah {item.tglUpload}
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert(`Meminta otentikasi kunci privat untuk mengakses dokumen: ${item.nama}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-unsil-green-800 text-slate-700 font-semibold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Buka Berkas</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SettingsView = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState('satker'); // 'satker', 'config'
  const [unitSearch, setUnitSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const currentUserUnit = useMemo(() => {
    return (
      unitKerjaList.find((u) => u.kode_unit === user?.unit_kerja_id || u.id === user?.unit_kerja_id) || {
        id: 6,
        kode_unit: 'UN58.6',
        nama_unit: 'Biro Keuangan dan Umum',
        singkatan: 'BKU',
        tipe_unit: 'BIRO',
        parent_kode: 'UN58',
        is_active: true
      }
    );
  }, [user]);

  const filteredUnits = useMemo(() => {
    return unitKerjaList.filter((u) => {
      const matchSearch =
        u.nama_unit.toLowerCase().includes(unitSearch.toLowerCase()) ||
        u.kode_unit.toLowerCase().includes(unitSearch.toLowerCase()) ||
        u.singkatan.toLowerCase().includes(unitSearch.toLowerCase());
      const matchType = typeFilter === 'ALL' || u.tipe_unit === typeFilter;
      return matchSearch && matchType;
    });
  }, [unitSearch, typeFilter]);

  const unitTypeBadgeColors = {
    UNIVERSITAS: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    ORGAN: 'bg-purple-100 text-purple-900 border-purple-300',
    BIRO: 'bg-blue-100 text-blue-900 border-blue-300',
    FAKULTAS: 'bg-amber-100 text-amber-900 border-amber-300',
    LEMBAGA: 'bg-teal-100 text-teal-900 border-teal-300',
    UPA: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-unsil-green-900" />
            Pengaturan & Master Data SILOKA UNSIL
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen entitas Master Unit Kerja (21 Satker), Master User, hak akses multi-tenancy, dan integrasi BSrE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-unsil-green-900 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Unit Aktif: {currentUserUnit.singkatan} ({currentUserUnit.kode_unit})
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('satker')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === 'satker'
              ? 'bg-unsil-green-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Master Unit Kerja ({unitKerjaList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('config')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === 'config'
              ? 'bg-unsil-green-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Konfigurasi & Keamanan</span>
        </button>
      </div>

      {/* TAB 1: MASTER UNIT KERJA */}
      {activeSubTab === 'satker' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-unsil-green-800" />
                Daftar 21 Satuan Kerja Resmi Universitas Siliwangi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kode unit kerja digunakan secara resmi pada format penomoran naskah dinas: Nomor Urut / Kode Unit / Klasifikasi / Tahun
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode/nama satker..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-unsil-green-800 w-48"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                <option value="ALL">Semua Tipe ({unitKerjaList.length})</option>
                <option value="UNIVERSITAS">UNIVERSITAS</option>
                <option value="ORGAN">ORGAN</option>
                <option value="BIRO">BIRO</option>
                <option value="FAKULTAS">FAKULTAS</option>
                <option value="LEMBAGA">LEMBAGA</option>
                <option value="UPA">UPA</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">ID</th>
                  <th className="py-2.5 px-3">Kode Unit (Nomor Surat)</th>
                  <th className="py-2.5 px-3">Nama Satuan Kerja</th>
                  <th className="py-2.5 px-3">Singkatan</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">Parent Kode</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUnits.map((u) => {
                  const isCurrent = u.kode_unit === user?.unit_kerja_id || u.id === user?.unit_kerja_id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-emerald-50/50 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">{u.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-unsil-green-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {u.kode_unit}
                        </span>
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] text-unsil-gold-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Unit Anda
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{u.nama_unit}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{u.singkatan}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            unitTypeBadgeColors[u.tipe_unit] || 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {u.tipe_unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {u.parent_kode ? u.parent_kode : <span className="text-slate-300 italic">ROOT (NULL)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Aktif
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Non-Aktif</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Menampilkan {filteredUnits.length} dari 21 satuan kerja resmi UNSIL</span>
            <span>Ref: SK Rektor & Tata Naskah Dinas UNSIL</span>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIG & SECURITY */}
      {activeSubTab === 'config' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Identitas Satuan Kerja Anda</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nama Satker Resmi</label>
              <input
                type="text"
                readOnly
                value={`${currentUserUnit.nama_unit} (${currentUserUnit.singkatan})`}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Kode Unit Kedinasan (Penomoran)</label>
              <input
                type="text"
                readOnly
                value={currentUserUnit.kode_unit}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Tipe Unit</label>
              <input
                type="text"
                readOnly
                value={currentUserUnit.tipe_unit}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Induk Satker (Parent)</label>
              <input
                type="text"
                readOnly
                value={currentUserUnit.parent_kode || 'Tingkat Tertinggi (ROOT)'}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium"
              />
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 pt-2">Konfigurasi TTE & Keamanan</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">Sertifikat BSrE BSSN</p>
                <p className="text-[11px] text-slate-500">
                  Status penandatanganan digital aktif untuk {user?.nama_lengkap || user?.name}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                Terhubung
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">Pemberitahuan WhatsApp & Email Gateway</p>
                <p className="text-[11px] text-slate-500">
                  Kirim notifikasi otomatis saat ada surat masuk baru atau disposisi
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-unsil-green-800 w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

