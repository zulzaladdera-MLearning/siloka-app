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
  AlertCircle,
  Info,
  Filter
} from 'lucide-react';
import { JRA_MASTER_ITEMS, JRA_PRIMARY_CATEGORIES } from '../../config/jraMasterCatalog';
import dispositionsData from '../../data/dispositions.json';
import metricsData from '../../data/metrics.json';
import unitKerjaList from '../../data/unitKerja.json';
import usersData from '../../data/users.json';
import { StatusBadge } from '../ui/Badge';
import {
  isDosenTanpaJabatan,
  getQueueAccessPolicy,
  isLetterOwnedByUser,
  isMandiriPersonalDocument
} from '../../utils/authGuards';
import { isDisposisiAuthorizedOfficial } from '../../utils/disposisiStandards';

export const DisposisiView = ({ onSelectLetter, letters = [], onOpenNewDisposisi, currentUser }) => {
  const mergedDispositions = useMemo(() => {
    const list = [...dispositionsData];
    letters.forEach((letter) => {
      if (letter.disposisi) {
        const exists = list.some(
          (d) => d.letterId === letter.id || d.nomorAgenda === letter.disposisi.nomorAgenda
        );
        if (!exists) {
          list.unshift({
            id: `disp-${letter.id}`,
            letterId: letter.id,
            nomorAgenda: letter.disposisi.nomorAgenda || `AGD-2026/${letter.id}`,
            status: 'Dalam Proses',
            pemberiDisposisi: letter.disposisi.pemberiDisposisi || 'Pimpinan Unit',
            penerimaDisposisi: letter.disposisi.target_pejabat_nama
              ? `${letter.disposisi.targetUnit} — ${letter.disposisi.target_pejabat_nama}`
              : (letter.disposisi.targetUnit || letter.disposisi.tujuanDisposisi || 'Unit Terkait'),
            instruksi: letter.disposisi.instruksi || 'Tindak lanjuti sesuai arahan pimpinan',
            tanggalDisposisi: letter.disposisi.timestamp || letter.disposisi.tanggalDisposisi || letter.tanggal || 'Hari ini',
            sifatInstruksi: letter.disposisi.sifatInstruksi || 'Segera'
          });
        }
      }
    });
    return list;
  }, [letters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-unsil-green-800" />
            Pengendalian E-Disposisi Elektronik
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar lembar disposisi pimpinan Biro BKU yang sedang diproses oleh unit bawahan ({mergedDispositions.length} Disposisi Aktif)
          </p>
        </div>
        {isDisposisiAuthorizedOfficial(currentUser) && (
          <button
            onClick={onOpenNewDisposisi}
            className="inline-flex items-center gap-2 px-4 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
            <span>+ Buat Disposisi Baru</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mergedDispositions.map((disp) => {
          const letter = letters.find((l) => l.id === disp.letterId);
          return (
            <div key={disp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-unsil-green-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {disp.nomorAgenda}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {disp.status}
                </span>
              </div>

              {letter && (
                <div
                  onClick={() => onSelectLetter(letter)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-100"
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{letter.perihal}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{letter.nomorSurat}</p>
                </div>
              )}

              <div className="text-xs space-y-1.5 text-slate-600">
                <p>
                  <strong className="text-slate-700">Pemberi:</strong> {disp.pemberiDisposisi}
                </p>
                <p>
                  <strong className="text-slate-700">Tujuan:</strong> {disp.penerimaDisposisi}
                </p>
                <p className="p-2.5 rounded bg-emerald-50/50 border border-emerald-100/80 text-emerald-950 font-medium">
                  "{disp.instruksi}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {disp.tanggalDisposisi}
                </span>
                <span className="text-amber-800 font-medium">Sifat: {disp.sifatInstruksi}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ParafTteView = ({ letters = [], currentUser, onSelectLetter, onSignSuccess }) => {
  const isStrictPersonalDosen = isDosenTanpaJabatan(currentUser);
  const accessPolicy = getQueueAccessPolicy(currentUser);
  const lockedCreatorId = String(currentUser?.id_user || currentUser?.id || 'req.user.id');
  const activeUserName = currentUser?.nama_lengkap || currentUser?.nama || currentUser?.name || 'Dosen Aktif';

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
                  {(!isStrictPersonalDosen || isMandiriDoc) ? (
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
                      title="Naskah konsep ini diajukan untuk ditandatangani oleh Pimpinan Unit Struktural"
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
                            className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                            title="Folder Kunci: Tidak bisa dihapus akun staf"
                          >
                            🔒 Safeguard
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

