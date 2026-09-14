import React, { useState, useMemo } from 'react';
import {
  FileText,
  Filter,
  Download,
  Eye,
  SendHorizontal,
  ChevronDown,
  Clock,
  Building,
  Building2,
  CheckCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Layers
} from 'lucide-react';
import { StatusBadge, SifatBadge } from '../ui/Badge';
import unitKerjaList from '../../data/unitKerja.json';

export const ActivityTable = ({
  letters,
  onSelectLetter,
  onOpenDisposisi,
  searchQuery,
  activeFilter,
  setActiveFilter,
  currentUser,
  selectedUnitFilter,
  setSelectedUnitFilter,
  isUniversityWideAccess
}) => {
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [copiedId, setCopiedId] = useState(null);

  const categories = ['Semua', 'Surat Masuk', 'Surat Keluar', 'Nota Dinas'];
  const statuses = ['Semua', 'Dikirim', 'Dibaca', 'Diparaf', 'Disetujui', 'Diarsipkan'];

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filtered dataset
  const filteredLetters = useMemo(() => {
    return letters.filter((letter) => {
      // External filter from metric card click if set
      if (activeFilter && activeFilter !== 'Semua') {
        if (['Surat Masuk', 'Surat Keluar', 'Nota Dinas'].includes(activeFilter)) {
          if (letter.kategori !== activeFilter) return false;
        } else if (['Dikirim', 'Dibaca', 'Diparaf', 'Disetujui', 'Diarsipkan'].includes(activeFilter)) {
          if (letter.status !== activeFilter) return false;
        }
      }

      // Internal tab category filter
      if (selectedCategory !== 'Semua' && letter.kategori !== selectedCategory) {
        return false;
      }

      // Internal status dropdown filter
      if (selectedStatus !== 'Semua' && letter.status !== selectedStatus) {
        return false;
      }

      // Global search query
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesNo = letter.nomorSurat.toLowerCase().includes(query);
        const matchesPerihal = letter.perihal.toLowerCase().includes(query);
        const matchesPengirim = letter.pengirim.toLowerCase().includes(query);
        const matchesTujuan = letter.tujuan.toLowerCase().includes(query);
        const matchesKlasifikasi = letter.kodeKlasifikasi?.toLowerCase().includes(query);
        return matchesNo || matchesPerihal || matchesPengirim || matchesTujuan || matchesKlasifikasi;
      }

      return true;
    });
  }, [letters, activeFilter, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Responsive Filter Container: Scrollable horizontally on mobile */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Aktivitas Surat Terbaru
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-unsil-green-900">
              {filteredLetters.length} Dokumen
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            {isUniversityWideAccess
              ? 'Mode Pengawasan / Pimpinan: Memantau arsip & persuratan seluruh unit kerja Universitas Siliwangi'
              : `Menampilkan data persuratan resmi ${currentUser?.unit || 'Unit Kerja Terdaftar'}`}
          </p>
        </div>

        {/* Action controls & Filters (Scrollable on small mobile screens) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full lg:w-auto">
          {/* Unit Kerja Filter Dropdown (Untuk Akses Lintas Unit: Pimpinan / SPI) */}
          {isUniversityWideAccess && setSelectedUnitFilter && (
            <div className="relative shrink-0">
              <select
                value={selectedUnitFilter || 'ALL'}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="appearance-none bg-emerald-50 border border-emerald-300 text-xs font-semibold text-unsil-green-950 py-1.5 pl-3 pr-8 rounded-lg hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 cursor-pointer"
              >
                <option value="ALL">🏢 Semua Unit</option>
                {unitKerjaList.map((u) => (
                  <option key={u.kode_unit} value={u.kode_unit}>
                    {u.singkatan} ({u.kode_unit})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-unsil-green-800 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Category Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (activeFilter && activeFilter !== cat) setActiveFilter(null);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-unsil-green-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 py-1.5 pl-3 pr-8 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 cursor-pointer"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              const csv = filteredLetters.map(l => `"${l.nomorSurat}","${l.tanggal}","${l.perihal}","${l.pengirim}","${l.status}"`).join('\n');
              const blob = new Blob([`"Nomor Surat","Tanggal","Perihal","Pengirim","Status"\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rekap_surat_siloka_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Ekspor Rekap</span>
          </button>
        </div>
      </div>

      {/* Active Filter Indicator Tag if applied */}
      {(activeFilter || searchQuery) && (
        <div className="px-4 sm:px-5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 truncate">
            <span className="font-semibold text-slate-700 shrink-0">Filter:</span>
            {activeFilter && (
              <span className="px-2 py-0.5 bg-unsil-green-100 text-unsil-green-900 rounded font-medium truncate">
                {activeFilter}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-medium truncate">
                "{searchQuery}"
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (setActiveFilter) setActiveFilter(null);
              setSelectedCategory('Semua');
              setSelectedStatus('Semua');
            }}
            className="text-unsil-green-800 hover:underline font-medium shrink-0 ml-2"
          >
            Reset
          </button>
        </div>
      )}

      {/* 1. MOBILE CARD LIST VIEW (Khusus Layar Ponsel: < md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredLetters.length === 0 ? (
          <div className="py-12 text-center px-4">
            <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-600 text-xs">Tidak ada surat yang cocok dengan filter</p>
            <p className="text-[10px] text-slate-400 mt-1">Coba gunakan kata kunci lain atau setel ulang filter</p>
          </div>
        ) : (
          filteredLetters.map((letter) => (
            <div
              key={letter.id}
              onClick={() => onSelectLetter(letter)}
              className="p-3.5 sm:p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-2"
            >
              {/* Row 1: Nomor Surat & Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-900 truncate">
                    {letter.nomorSurat}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(letter.nomorSurat, letter.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 shrink-0"
                    title="Salin Nomor Surat"
                  >
                    {copiedId === letter.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <StatusBadge status={letter.status} />
              </div>

              {/* Row 2: Perihal */}
              {(currentUser?.role === 'STAF' || currentUser?.role === 'STAF_PERSURATAN' || currentUser?.role === 'OPERATOR_UNIT') && (letter.sifat === 'Sangat Rahasia' || letter.sifat === 'Rahasia') ? (
                <div className="p-1.5 rounded bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center gap-1.5 text-[11px] font-mono">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">[TERENKRIPSI AES-256 - HANYA PIMPINAN & SPI]</span>
                </div>
              ) : (
                <p className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                  {letter.perihal}
                </p>
              )}

              {/* Row 3: Meta (Tanggal, Pengirim, Sifat) */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {letter.tanggal}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[160px]">
                  <Building className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{letter.pengirim}</span>
                </span>
                <SifatBadge sifat={letter.sifat} />
              </div>

              {/* Row 4: Aksi Cepat Mobile */}
              <div
                className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {letter.statusTimestamp}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectLetter(letter)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>
                  <button
                    onClick={() => onOpenDisposisi(letter)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-unsil-green-900 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition"
                  >
                    <SendHorizontal className="w-3.5 h-3.5 text-unsil-green-700" />
                    <span>Disposisi</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. DESKTOP TABULAR VIEW (Layar Komputer & Tablet: >= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 sm:px-6">Nomor Surat & Tanggal</th>
              <th className="py-3 px-4">Perihal & Pihak Terkait</th>
              <th className="py-3 px-4 hidden md:table-cell w-36">Kategori</th>
              <th className="py-3 px-4 w-44">Status & Progres</th>
              <th className="py-3 px-4 w-28 text-left">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredLetters.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                    <p className="font-medium text-slate-600">Tidak ada surat yang cocok dengan filter</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba gunakan kata kunci lain atau setel ulang filter Anda</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLetters.map((letter) => (
                <tr
                  key={letter.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectLetter(letter)}
                >
                  {/* Column 1: Nomor Surat, Tanggal & Unit Kerja */}
                  <td className="py-3.5 px-4 sm:px-6 align-top max-w-[240px]">
                    <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 group-hover:text-unsil-green-900 transition-colors">
                      <span className="truncate">{letter.nomorSurat}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(letter.nomorSurat, letter.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                        title="Salin Nomor Surat"
                      >
                        {copiedId === letter.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {letter.tanggal}
                      </span>
                      <span>•</span>
                      {letter.unit_kerja_id && (
                        <span className="text-[10px] bg-emerald-50 text-unsil-green-900 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold font-mono" title={unitKerjaList.find(u => u.kode_unit === letter.unit_kerja_id || u.id === letter.unit_kerja_id)?.nama_unit}>
                          {unitKerjaList.find(u => u.kode_unit === letter.unit_kerja_id || u.id === letter.unit_kerja_id)?.singkatan || letter.unit_kerja_id}
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                        {letter.kodeKlasifikasi?.split(' ')[0] || 'UMUM'}
                      </span>
                    </div>
                  </td>

                  {/* Column 2: Perihal & Pengirim/Tujuan */}
                  <td className="py-3.5 px-4 align-top max-w-sm lg:max-w-md">
                    <div className="flex items-center gap-2 mb-1">
                      <SifatBadge sifat={letter.sifat} />
                      {letter.isLockedPermanen && (
                        <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                          🔒 Safeguard
                        </span>
                      )}
                      <span className="md:hidden">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {letter.kategori}
                        </span>
                      </span>
                    </div>

                    {(currentUser?.role === 'STAF' || currentUser?.role === 'STAF_PERSURATAN' || currentUser?.role === 'OPERATOR_UNIT') && (letter.sifat === 'Sangat Rahasia' || letter.sifat === 'Rahasia') ? (
                      <div className="p-1.5 rounded bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center gap-1.5 text-[11px] font-mono">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">[TERENKRIPSI AES-256 - HANYA PIMPINAN & SPI]</span>
                      </div>
                    ) : (
                      <p className="font-semibold text-slate-900 line-clamp-1 group-hover:text-unsil-green-800 transition-colors">
                        {letter.perihal}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 truncate">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-600 truncate">
                        {letter.pengirim}
                      </span>
                      <span className="text-slate-300">➔</span>
                      <span className="text-slate-500 truncate">{letter.tujuan}</span>
                    </div>
                  </td>

                  {/* Column 3: Kategori */}
                  <td className="py-3.5 px-4 align-top hidden md:table-cell whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {letter.kategori}
                    </span>
                  </td>

                  {/* Column 4: Status Badge & Timestamp */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <StatusBadge status={letter.status} />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {letter.statusTimestamp}
                    </div>
                  </td>

                  {/* Column 5: Action buttons */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="flex items-center justify-start gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectLetter(letter)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-unsil-green-800 hover:bg-emerald-50 transition-colors"
                        title="Lihat Detail Surat & Jejak Paraf"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenDisposisi(letter)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Disposisi Surat Ini"
                      >
                        <SendHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Menampilkan <strong className="text-slate-700">{filteredLetters.length}</strong> dari{' '}
          <strong className="text-slate-700">{letters.length}</strong> entri surat aktif
        </span>
        <div className="flex items-center gap-1 font-medium text-unsil-green-900">
          <span>Standar Kearsipan Perka ANRI No. 9 Tahun 2018</span>
        </div>
      </div>
    </div>
  );
};

