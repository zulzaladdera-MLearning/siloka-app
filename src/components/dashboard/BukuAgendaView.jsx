import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  Inbox,
  Send,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';

export const transformLettersToAgenda = (letters = [], unitName = 'Universitas Siliwangi') => {
  return letters.map((letter, index) => {
    const isMasuk = letter.kategori === 'Surat Masuk';
    const defaultAgendaNum = isMasuk
      ? `AGD-M/${new Date(letter.tanggal || Date.now()).getFullYear()}/${String(index + 1).padStart(4, '0')}`
      : `AGD-K/${new Date(letter.tanggal || Date.now()).getFullYear()}/${String(index + 1).padStart(4, '0')}`;

    return {
      id: letter.id || `agd-${index}`,
      originalLetter: letter,
      nomorAgenda: letter.nomorAgenda || defaultAgendaNum,
      nomorSurat: letter.nomorSurat || letter.nomor_surat || '-',
      tanggalTerima: letter.tanggalRegistrasi || letter.tanggal || '2026-09-29',
      tanggalSurat: letter.tanggal || '2026-09-28',
      jenis: isMasuk ? 'MASUK' : 'KELUAR',
      kategori: letter.kategori || (isMasuk ? 'Surat Masuk' : 'Surat Keluar'),
      pengirim: letter.pengirim || letter.asal_surat || unitName,
      penerima: letter.tujuan || letter.penerima || 'Pimpinan / Unit Kerja Terkait',
      perihal: letter.perihal || 'Naskah Dinas Resmi',
      ekspedisiStatus: letter.status || 'Tercatat',
      isLocked: Boolean(letter.isLockedPermanen)
    };
  });
};

export const BukuAgendaView = ({
  letters = [],
  currentUser = null,
  currentUnit = { nama_unit: 'Universitas Siliwangi', singkatan: 'UNSIL' },
  onSelectLetter = () => {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [agendaTypeFilter, setAgendaTypeFilter] = useState('ALL'); // 'ALL', 'MASUK', 'KELUAR'
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Bentuk daftar agenda berdasarkan naskah yang ada
  const agendaList = useMemo(() => {
    return transformLettersToAgenda(letters, currentUnit.nama_unit);
  }, [letters, currentUnit]);

  // Saring data berdasarkan filter dan pencarian
  const filteredAgenda = useMemo(() => {
    return agendaList.filter((item) => {
      if (agendaTypeFilter === 'MASUK' && item.jenis !== 'MASUK') return false;
      if (agendaTypeFilter === 'KELUAR' && item.jenis !== 'KELUAR') return false;
      if (statusFilter !== 'ALL' && item.ekspedisiStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.nomorAgenda.toLowerCase().includes(q) ||
          item.nomorSurat.toLowerCase().includes(q) ||
          item.pengirim.toLowerCase().includes(q) ||
          item.penerima.toLowerCase().includes(q) ||
          item.perihal.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [agendaList, agendaTypeFilter, statusFilter, searchQuery]);

  const totalMasuk = agendaList.filter((a) => a.jenis === 'MASUK').length;
  const totalKeluar = agendaList.filter((a) => a.jenis === 'KELUAR').length;

  const handlePrintAgenda = () => {
    const tableRows = filteredAgenda
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 11px; font-weight: bold;">${item.nomorAgenda}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${item.tanggalTerima}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 11px;">${item.nomorSurat}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${item.pengirim}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${item.penerima}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${item.perihal}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1;">${item.ekspedisiStatus}</td>
      </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <div style="text-align: center; border-bottom: 2px solid #064e3b; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #064e3b; font-size: 18px; text-transform: uppercase;">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h2>
          <h3 style="margin: 4px 0; color: #0f172a; font-size: 16px;">UNIVERSITAS SILIWANGI</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b;">BUKU AGENDA NASKAH DINAS & EKSPEDISI RESMI</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Unit Kerja: ${currentUnit.nama_unit} (${currentUnit.singkatan})</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; text-align: left;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; width: 30px;">No</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 110px;">No. Agenda</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 85px;">Tgl Terima</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Nomor Naskah</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Dari / Pengirim</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Kepada / Tujuan</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Perihal Naskah</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; width: 80px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">Tidak ada data agenda</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end; font-size: 12px;">
          <div style="text-align: center; width: 220px;">
            <p style="margin: 0;">Tasikmalaya, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 4px 0 60px 0;">Petugas Pengelola Kearsipan / Agendator,</p>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${currentUser?.nama_lengkap || currentUser?.nama || 'Petugas Agendator'}</p>
            <p style="margin: 2px 0 0 0; color: #64748b;">NIP. ${currentUser?.nip || '198503152010121002'}</p>
          </div>
        </div>
      </div>
    `;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Buku_Agenda_${currentUnit.singkatan}_${new Date().getFullYear()}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-unsil-green-800" />
            Buku Agenda Masuk &amp; Ekspedisi — {currentUnit.nama_unit} ({currentUnit.singkatan})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kronologis naskah dinas masuk, naskah dinas keluar, serta kartu kendali ekspedisi tanda terima di lingkungan Universitas Siliwangi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintAgenda}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Cetak Buku Agenda Resmi"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Buku Agenda</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Agenda</span>
            <BookOpen className="w-4 h-4 text-unsil-green-800" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{agendaList.length}</p>
          <p className="text-[11px] text-slate-500">Tercatat pada tahun anggaran berjalan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Agenda Masuk</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalMasuk}</p>
          <p className="text-[11px] text-blue-700 font-medium">Naskah eksternal &amp; antar-unit</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Agenda Keluar</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{totalKeluar}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Naskah dinas terbit resmi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ekspedisi Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900">
            {agendaList.filter((a) => a.ekspedisiStatus === 'Diarsipkan' || a.ekspedisiStatus === 'Disetujui' || a.ekspedisiStatus === 'Dikirim').length}
          </p>
          <p className="text-[11px] text-amber-700 font-medium">Tanda terima tervalidasi</p>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setAgendaTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                agendaTypeFilter === 'ALL'
                  ? 'bg-unsil-green-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Jenis ({agendaList.length})
            </button>
            <button
              onClick={() => setAgendaTypeFilter('MASUK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                agendaTypeFilter === 'MASUK'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Surat Masuk ({totalMasuk})</span>
            </button>
            <button
              onClick={() => setAgendaTypeFilter('KELUAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                agendaTypeFilter === 'KELUAR'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Surat Keluar ({totalKeluar})</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. agenda, nomor surat, perihal..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-unsil-green-700 focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop & Tablet Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-36">No. Agenda &amp; Jenis</th>
                <th className="py-3 px-4 w-32">Tanggal</th>
                <th className="py-3 px-4">Nomor Naskah &amp; Perihal</th>
                <th className="py-3 px-4 w-52">Pihak Terkait (Dari / Kepada)</th>
                <th className="py-3 px-4 w-32 text-center">Status Ekspedisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAgenda.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mb-2 stroke-1 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-600 text-xs">Belum ada naskah yang terdaftar dalam Buku Agenda</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Setiap registrasi surat masuk atau penerbitan surat keluar akan otomatis tercatat di sini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAgenda.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => item.originalLetter && onSelectLetter(item.originalLetter)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block group-hover:text-unsil-green-800 transition-colors">
                        {item.nomorAgenda}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          item.jenis === 'MASUK'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.jenis === 'MASUK' ? 'Surat Masuk' : 'Surat Keluar'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.tanggalTerima}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Surat: {item.tanggalSurat}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-900 block">
                        {item.nomorSurat}
                      </span>
                      <p className="font-medium text-slate-700 line-clamp-1 mt-0.5 group-hover:text-slate-900">
                        {item.perihal}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="text-[11px] font-medium text-slate-800 truncate">
                        <span className="text-slate-400">Dari: </span>
                        {item.pengirim}
                      </p>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        <span className="text-slate-400">Kepada: </span>
                        {item.penerima}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.ekspedisiStatus}
                      </span>
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
