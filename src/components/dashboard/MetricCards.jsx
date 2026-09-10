import React from 'react';
import {
  Inbox,
  FileSignature,
  Archive,
  Vault,
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import metricsData from '../../data/metrics.json';

export const MetricCards = ({
  letters = [],
  scopedLetters = [],
  onSelectFilter,
  currentFilter
}) => {
  const activeDataset = scopedLetters.length > 0 ? scopedLetters : letters;

  // 1. Surat Masuk Baru
  const suratMasukList = activeDataset.filter((l) => l.kategori === 'Surat Masuk');
  const suratMasukTotal = suratMasukList.length;
  const suratMasukBaruHariIni = suratMasukList.filter(
    (l) => l.statusTimestamp?.includes('hari ini') || l.tanggal === '2026-09-10' || l.created_at?.startsWith('2026-09-10')
  ).length;

  // 2. Antrean Paraf & TTE (Diparaf / Dikirim)
  const antreanList = activeDataset.filter((l) => l.status === 'Diparaf' || l.status === 'Dikirim');
  const antreanTotal = antreanList.length;
  const urgentCount = antreanList.filter(
    (l) => l.sifat === 'Penting' || l.sifat === 'Sangat Segera' || l.sifat === 'Segera'
  ).length;

  // 3. Pemberitahuan Retensi (Diarsipkan)
  const retensiList = activeDataset.filter((l) => l.status === 'Diarsipkan');
  const retensiTotal = retensiList.length;
  const inaktifSiapMusnah = retensiList.filter((l) => !l.isLockedPermanen).length;

  // 4. Brankas Digital
  const lockedLettersCount = letters.filter((l) => l.isLockedPermanen).length;
  const brankasTotal = 856 + (lockedLettersCount > 24 ? (lockedLettersCount - 24) : 0);
  const totalAsetBmn = 64;
  const storageUsedMb = 4120 + ((letters.length - 221) * 2.5);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {/* 1. Surat Masuk Baru */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('Surat Masuk')}
        className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
          currentFilter === 'Surat Masuk'
            ? 'ring-2 ring-unsil-green-700 border-unsil-green-700'
            : 'border-slate-200/80 hover:border-unsil-green-600/50'
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-unsil-green-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-unsil-green-800 text-white flex items-center justify-center shadow-md shadow-unsil-green-950/20">
              <Inbox className="w-5 h-5 text-unsil-gold-300" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp className="w-3 h-3" /> +12.5%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Surat Masuk Baru
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900">
                {suratMasukTotal}
              </span>
              <span className="text-xs font-medium text-emerald-600">
                +{suratMasukBaruHariIni} hari ini
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dibandingkan minggu lalu</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-unsil-green-800 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* 2. Antrean Paraf & TTE */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('Diparaf')}
        className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
          currentFilter === 'Diparaf'
            ? 'ring-2 ring-amber-600 border-amber-600'
            : 'border-slate-200/80 hover:border-amber-500/50'
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-900/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
              <AlertCircle className="w-3 h-3" /> {urgentCount} Urgent
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Antrean Paraf / TTE
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900">
                {antreanTotal}
              </span>
              <span className="text-xs font-medium text-amber-700">
                Menunggu
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-amber-800 font-medium truncate">
              {urgentCount > 0 ? `${urgentCount} Memerlukan TTE Segera` : 'Semua TTE Selesai Terproses'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* 3. Pemberitahuan Retensi */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('Diarsipkan')}
        className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
          currentFilter === 'Diarsipkan'
            ? 'ring-2 ring-indigo-600 border-indigo-600'
            : 'border-slate-200/80 hover:border-indigo-500/50'
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-900/20">
              <Archive className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              <Clock className="w-3 h-3" /> JRA 2026
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pemberitahuan Retensi
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900">
                {retensiTotal}
              </span>
              <span className="text-xs font-medium text-indigo-600">
                {inaktifSiapMusnah} siap musnah
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>JRA Aktif Semester Genap 2026</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* 4. Brankas Digital */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('Brankas')}
        className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
          currentFilter === 'Brankas'
            ? 'ring-2 ring-emerald-600 border-emerald-600'
            : 'border-slate-200/80 hover:border-emerald-500/50'
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-unsil-green-900 text-unsil-gold-400 flex items-center justify-center shadow-md shadow-unsil-green-950/20 border border-unsil-gold-500/40">
              <Vault className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-700" /> AES-256
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Brankas Digital
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900">
                {brankasTotal}
              </span>
              <span className="text-xs font-medium text-slate-600">
                ({totalAsetBmn} Aset BMN)
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 text-slate-600">
              <HardDrive className="w-3 h-3" />
              <span>{(storageUsedMb / 1024).toFixed(1)} GB / 10 GB</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

