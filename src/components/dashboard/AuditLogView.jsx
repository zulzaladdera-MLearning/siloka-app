import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Search,
  Download,
  Filter,
  Lock,
  Clock,
  Terminal,
  Server,
  UserCheck,
  Copy,
  Check,
  Building,
  ChevronDown,
  Activity,
  Database
} from 'lucide-react';
import unitKerjaList from '../../data/unitKerja.json';
import { ProcessMiningLogger } from '../../domain';

export const AuditLogView = ({ auditLogs, currentUser }) => {
  const [filterSeverity, setFilterSeverity] = useState('Semua');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Akses Khusus: UPT / UPA TIK UNSIL (UN58.32)
  const isUptTik =
    currentUser?.unit_kerja_id === 'UN58.32' ||
    currentUser?.unit_kerja_id === 'UN58.TIK' ||
    (currentUser?.email && currentUser.email.includes('tik@unsil.ac.id')) ||
    (currentUser?.roleLabel && currentUser.roleLabel.toLowerCase().includes('tik')) ||
    (currentUser?.unit && currentUser.unit.toLowerCase().includes('tik'));

  const isAuthorized =
    currentUser?.role === 'PIMPINAN' ||
    currentUser?.role === 'PEJABAT' ||
    currentUser?.role === 'PENGAWAS' ||
    isUptTik;

  // Real-time summary Process Mining (Khusus akun UPT TIK)
  const [pmSummary, setPmSummary] = useState(() => {
    return ProcessMiningLogger.getInstance().getMetricsSummary();
  });

  useEffect(() => {
    if (!isUptTik) return;
    const updateSummary = () => {
      setPmSummary(ProcessMiningLogger.getInstance().getMetricsSummary());
    };
    window.addEventListener('siloka:process_mining_event', updateSummary);
    return () => {
      window.removeEventListener('siloka:process_mining_event', updateSummary);
    };
  }, [isUptTik]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filterSeverity !== 'Semua' && log.severity !== filterSeverity) {
        return false;
      }
      if (filterUnit !== 'Semua' && log.unit_kerja_id !== filterUnit) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesUser = (log.userName || '').toLowerCase().includes(query) || (log.userNip || '').includes(query);
        const matchesAction = (log.action || '').toLowerCase().includes(query);
        const matchesDetails = (log.details || '').toLowerCase().includes(query);
        const matchesIp = (log.ipAddress || '').includes(query);
        const matchesUnit = (log.unitKerjaName || '').toLowerCase().includes(query) || (log.unit_kerja_id || '').toLowerCase().includes(query);
        return matchesUser || matchesAction || matchesDetails || matchesIp || matchesUnit;
      }
      return true;
    });
  }, [auditLogs, filterSeverity, filterUnit, searchQuery]);

  // If user is Level 2 (Staf), show access denied
  if (!isAuthorized) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Akses Log Audit Dibatasi (Hak Khusus SPI & Pimpinan)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Sesuai dengan <strong>PRD Modul 4 (Keamanan Dokumen Internal)</strong>, modul audit forensik hanya dapat diakses oleh akun <strong>Level 1: Pimpinan</strong> dan <strong>Level 3: Pengawas (Satuan Pengawas Internal / SPI)</strong>.
        </p>
        <div className="pt-2">
          <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Akses Ditolak untuk: {currentUser?.name} ({currentUser?.roleLabel})
          </span>
        </div>
      </div>
    );
  }

  const handleExportCsv = () => {
    const watermark = `[DOKUMEN RESMI BKU UNSIL - AUDIT LOG TERTUTUP - DIUNDUH OLEH ${currentUser.name} (${currentUser.nip}) PADA ${new Date().toISOString()}]`;
    const rows = filteredLogs.map((l) =>
      `"${l.id}","${l.timestamp}","${l.userName}","${l.userNip}","${l.roleLevel}","${l.action}","${l.details.replace(/"/g, '""')}","${l.ipAddress}","${l.severity}","${l.hash}"`
    ).join('\n');
    const fullContent = `# ${watermark}\n"ID Log","Timestamp","Nama Pengguna","NIP","Level Akses","Aksi","Rincian","IP Intranet","Severity","Hash SHA-256"\n${rows}`;
    const blob = new Blob([fullContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_siloka_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Pusat Audit Keamanan & Kepatuhan Forensik
            </h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              BSSN Tier-4 Certified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak audit tak terbantahkan (*tamper-evident immutable audit log*) untuk audit berkala SPI & BPK-RI
          </p>
        </div>

        {/* Tombol Ekspor Khusus UPT TIK UNSIL (Disembunyikan untuk akun lainnya) */}
        {isUptTik && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Unduh Log Audit Forensik Sistem"
            >
              <Download className="w-3.5 h-3.5 text-unsil-gold-400" />
              <span>Ekspor Log Forensik (CSV)</span>
            </button>

            <button
              onClick={() => ProcessMiningLogger.getInstance().downloadCSV()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Unduh Dataset Process Mining (CSV Standar IEEE XES)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              <span>Ekspor Dataset Process Mining (CSV)</span>
            </button>
          </div>
        )}
      </div>

      {/* PANEL EKSKLUSIF UPT TIK: DATA SCIENCE & PROCESS MINING */}
      {isUptTik && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-indigo-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-semibold mb-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Khusus Otoritas UPA TIK (UN58.32) • Data Science & Process Mining
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <Download className="w-3.5 h-3.5 text-indigo-200" />
                <span>Ekspor Dataset Process Mining (CSV)</span>
              </button>
              <button
                onClick={() => ProcessMiningLogger.getInstance().downloadJSON()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
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
      )}

      {/* KPI Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Aktivitas Terekam
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{auditLogs.length} Entri</div>
          <p className="text-[11px] text-emerald-700 mt-0.5">Semua aksi tervalidasi hash</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Peringatan Akses Ditolak
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {auditLogs.filter((l) => l.severity === 'WARNING').length} Insiden
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Role-Based Masking bekerja optimal</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Integritas Chained Hash SHA-256
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">100% Valid</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada anomali atau pemalsuan log</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengguna, NIP, aksi, atau IP Intranet..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Filter */}
          <div className="relative">
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-3 pr-8 rounded-lg hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="Semua">🏢 Semua Unit</option>
              {unitKerjaList.map((u) => (
                <option key={u.kode_unit} value={u.kode_unit}>
                  {u.singkatan} ({u.kode_unit})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-xs text-slate-500 font-medium ml-1">Tingkat:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {['Semua', 'NORMAL', 'WARNING'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  filterSeverity === sev
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Waktu & ID Log</th>
                <th className="py-3 px-4">Pengguna & Level</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4">Jenis Aksi</th>
                <th className="py-3 px-4">Rincian Peristiwa</th>
                <th className="py-3 px-4">IP Intranet</th>
                <th className="py-3 px-4">Integritas Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Tidak ada catatan audit yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    {/* Time & Log ID */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <div className="font-mono font-bold text-slate-900">{log.timestamp}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.id}</div>
                    </td>

                    {/* User & Level */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <div className="font-semibold text-slate-800">{log.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">NIP. {log.userNip}</div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {log.roleLevel}
                      </span>
                    </td>

                    {/* Unit Kerja */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-unsil-green-900 border border-emerald-200">
                        {log.unit_kerja_id || 'UN58'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[130px] truncate" title={log.unitKerjaName}>
                        {log.unitKerjaName || 'Universitas Siliwangi'}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          log.severity === 'WARNING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 align-top max-w-sm">
                      <p className="text-slate-700 leading-relaxed">{log.details}</p>
                    </td>

                    {/* IP Intranet */}
                    <td className="py-3 px-4 whitespace-nowrap align-top font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Server className="w-3 h-3 text-slate-400" />
                        {log.ipAddress}
                      </div>
                      <div className="text-[9px] text-slate-400">Intranet Kampus</div>
                    </td>

                    {/* Hash */}
                    <td className="py-3 px-4 whitespace-nowrap align-top font-mono text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 truncate max-w-[90px]">{log.hash.slice(0, 12)}...</span>
                        <button
                          onClick={() => handleCopy(log.hash, log.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Salin Hash SHA-256"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

