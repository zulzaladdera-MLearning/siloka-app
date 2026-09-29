import React, { useState, useEffect } from 'react';
import {
  Activity,
  Download,
  Terminal,
  Lock,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { ProcessMiningLogger } from '../../domain';

export const AuditLogView = ({ currentUser }) => {
  // 1. Otorisasi Ketat: Khusus Super Admin Saja
  const isSuperAdmin = Boolean(
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.id_role === 'Super Admin'
  );

  // Real-time summary Process Mining (Khusus akun Super Admin)
  const [pmSummary, setPmSummary] = useState(() => {
    return ProcessMiningLogger.getInstance().getMetricsSummary();
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    const updateSummary = () => {
      setPmSummary(ProcessMiningLogger.getInstance().getMetricsSummary());
    };
    window.addEventListener('siloka:process_mining_event', updateSummary);
    return () => {
      window.removeEventListener('siloka:process_mining_event', updateSummary);
    };
  }, [isSuperAdmin]);

  // Jika bukan Super Admin, tampilkan halaman pembatasan akses (403)
  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Akses Fitur Dibatasi (Khusus Super Admin)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Fitur analitik proses bisnis dan <strong>Automated Event Logger Engine</strong> hanya dapat diakses oleh akun dengan peran <strong>Super Admin</strong>.
        </p>
        <div className="pt-2">
          <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Akses Ditolak untuk: {currentUser?.name || currentUser?.nama_lengkap || 'Pengguna'} ({currentUser?.roleLabel || currentUser?.role || 'User'})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Automated Event Logger & Process Mining Engine
            </h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              IEEE XES Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ekstraksi runtunan proses naskah dinas di latar belakang untuk analisis <em>bottleneck</em> dan evaluasi kinerja alur kerja birokrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => ProcessMiningLogger.getInstance().downloadCSV()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            title="Unduh Dataset Process Mining (CSV Standar IEEE XES)"
          >
            <Download className="w-3.5 h-3.5 text-indigo-200" />
            <span>Ekspor Dataset (CSV)</span>
          </button>
          <button
            onClick={() => ProcessMiningLogger.getInstance().downloadJSON()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Unduh Dataset Format JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* PANEL EKSKLUSIF: DATA SCIENCE & PROCESS MINING (KHUSUS SUPER ADMIN SAJA) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-semibold mb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Khusus Otoritas Super Admin • Data Science & Process Mining
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Automated Event Logger Engine (IEEE XES / PM4Py Ready)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Dataset runtunan proses tercatat secara non-blocking di latar belakang untuk analisis <em>bottleneck</em> birokrasi, perhitungan SLA naskah dinas, dan evaluasi kinerja proses (Process Mining).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => ProcessMiningLogger.getInstance().downloadCSV()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              <span>Ekspor Dataset Process Mining (CSV)</span>
            </button>
            <button
              onClick={() => ProcessMiningLogger.getInstance().downloadJSON()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Process Mining KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-500/20">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
              Total Traces (Cases)
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {pmSummary.totalCases} Kasus
            </div>
            <span className="text-[11px] text-slate-400">Kasus surat terpantau</span>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-500/20">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
              Total Events Tercatat
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {pmSummary.totalEvents} Events
            </div>
            <span className="text-[11px] text-slate-400">Presisi ISO 8601</span>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-500/20">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
              Rata-rata Event / Kasus
            </span>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {pmSummary.averageEventsPerCase}
            </div>
            <span className="text-[11px] text-slate-400">Kedalaman siklus</span>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-indigo-500/20">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
              Kompatibilitas Analisis
            </span>
            <div className="text-2xl font-black text-purple-300 mt-1">
              PM4Py & Disco
            </div>
            <span className="text-[11px] text-slate-400">Standard IEEE XES</span>
          </div>
        </div>

        {/* Console Tip */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Akses Console:{' '}
              <strong className="text-emerald-400">
                window.ProcessMiningLogger.getInstance().getEvents()
              </strong>
            </span>
          </div>
          <span className="text-[10px] bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-800/40">
            Non-Blocking LocalStorage
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
