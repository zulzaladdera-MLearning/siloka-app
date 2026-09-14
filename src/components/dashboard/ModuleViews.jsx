import React, { useState, useMemo } from 'react';
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
  Key
} from 'lucide-react';
import dispositionsData from '../../data/dispositions.json';
import metricsData from '../../data/metrics.json';
import unitKerjaList from '../../data/unitKerja.json';
import usersData from '../../data/users.json';
import { StatusBadge } from '../ui/Badge';

export const DisposisiView = ({ onSelectLetter, letters, onOpenNewDisposisi }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-unsil-green-800" />
            Pengendalian E-Disposisi Elektronik
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar lembar disposisi pimpinan Biro BKU yang sedang diproses oleh unit bawahan
          </p>
        </div>
        <button
          onClick={onOpenNewDisposisi}
          className="inline-flex items-center gap-2 px-4 py-2 bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
          <span>+ Buat Disposisi Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dispositionsData.map((disp) => {
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

export const ParafTteView = ({ letters, onSelectLetter, onSignSuccess }) => {
  const pendingLetters = letters.filter(
    (l) => l.status === 'Diparaf' || l.status === 'Dikirim' || l.status === 'Dibaca'
  );

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
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Passphrase TTE Aktif
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-600">
          Daftar Surat Menunggu Persetujuan / Paraf ({pendingLetters.length} Dokumen)
        </div>
        <div className="divide-y divide-slate-100">
          {pendingLetters.map((letter) => (
            <div
              key={letter.id}
              className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{letter.nomorSurat}</span>
                  <StatusBadge status={letter.status} />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">{letter.perihal}</h4>
                <p className="text-xs text-slate-500">
                  Pengirim: <strong>{letter.pengirim}</strong> • Klasifikasi: {letter.kodeKlasifikasi}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onSelectLetter(letter)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Periksa Draft
                </button>
                <button
                  onClick={() => {
                    onSignSuccess && onSignSuccess(letter.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <FileSignature className="w-3.5 h-3.5 text-unsil-gold-400" />
                  <span>Bubuhkan TTE</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RetensiArsipView = () => {
  const archives = [
    {
      kode: 'KU.02.01',
      klasifikasi: 'KU',
      namaSeri: 'Kuitansi Belanja Operasional, Honorarium & Pajak',
      retensiAktif: '2 Tahun',
      retensiInaktif: '5 Tahun',
      statusAkhir: 'Dimusnahkan',
      safeguard: false,
      jumlahBerkas: 14,
      keterangan: 'Pindah otomatis ke Inaktif -> Siap musnah tahun 2026'
    },
    {
      kode: 'PP.02.00',
      klasifikasi: 'PP',
      namaSeri: 'Bukti Pembayaran Kuliah (UKT Mahasiswa)',
      retensiAktif: '2 Tahun',
      retensiInaktif: '3 Tahun',
      statusAkhir: 'Dimusnahkan',
      safeguard: false,
      jumlahBerkas: 28,
      keterangan: 'Pindah otomatis ke Inaktif -> Siap musnah sesuai jadwal'
    },
    {
      kode: 'KU.02.01.h',
      klasifikasi: 'KU',
      namaSeri: 'Laporan Keuangan Tahunan (Audited BPK-RI)',
      retensiAktif: '2 Tahun',
      retensiInaktif: '10 Tahun',
      statusAkhir: 'Permanen',
      safeguard: true,
      jumlahBerkas: 8,
      keterangan: 'Folder Kunci (Safeguard) - Terkunci otomatis, tidak bisa dihapus staf'
    },
    {
      kode: 'KR.07.00',
      klasifikasi: 'KR',
      namaSeri: 'Gambar As-Built Drawing & Instalasi Gedung Mugarsari',
      retensiAktif: 'Selama Gedung Berdiri',
      retensiInaktif: 'Permanen',
      statusAkhir: 'Permanen',
      safeguard: true,
      jumlahBerkas: 12,
      keterangan: 'Folder Kunci (Safeguard) - Arsip Vital Terkunci'
    },
    {
      kode: 'PL.09.00',
      klasifikasi: 'PL',
      namaSeri: 'Sertifikat Kepemilikan Tanah & BMN UNSIL',
      retensiAktif: 'Selama Berlaku',
      retensiInaktif: 'Permanen',
      statusAkhir: 'Permanen',
      safeguard: true,
      jumlahBerkas: 64,
      keterangan: 'Folder Kunci (Safeguard) - Brankas Digital Terenkripsi AES-256'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-indigo-700" />
          Jadwal Retensi Arsip (JRA) BKU Universitas Siliwangi
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pengaturan siklus hidup arsip dinas sesuai kaidah ANRI (Aktif, Inaktif, Musnah, dan Permanen)
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              <th className="py-3.5 px-4">Kode Klasifikasi & Seri Arsip</th>
              <th className="py-3.5 px-4">Masa Aktif</th>
              <th className="py-3.5 px-4">Masa Inaktif</th>
              <th className="py-3.5 px-4">Nasib Akhir</th>
              <th className="py-3.5 px-4">Volume</th>
              <th className="py-3.5 px-4">Keterangan ANRI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {archives.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50">
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
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {a.statusAkhir}
                    </span>
                    {a.safeguard && (
                      <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" title="Folder Kunci: Tidak bisa dihapus akun staf">
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
  );
};

export const BrankasDigitalView = () => {
  const assets = [
    {
      nama: 'Sertifikat Hak Pakai Tanah Kampus Mugarsari No. 00042/2017',
      kategori: 'Aset Vital BMN',
      ukuran: '14.2 MB (Enkripsi AES)',
      tglUpload: '14 Jan 2025',
      akses: 'Kepala Biro Only'
    },
    {
      nama: 'Master Perjanjian Kerja Sama (MoU) Perbankan Mitra UNSIL 2024-2028',
      kategori: 'Perjanjian Hukum',
      ukuran: '8.5 MB (Enkripsi AES)',
      tglUpload: '10 Mei 2025',
      akses: 'Pimpinan & Tim Hukum'
    },
    {
      nama: 'SK Penetapan Tarif Layanan BLU Universitas Siliwangi',
      kategori: 'Regulasi Keuangan',
      ukuran: '6.1 MB (Enkripsi AES)',
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
            Brankas Digital Kearsipan Vital (Secure Vault)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penyimpanan dokumen sensitif, sertifikat aset tanah, dan naskah dinas rahasia dengan enkripsi berstandar perbankan
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> Kriptografi AES-256 Aktif
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Berkas Vital</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">856 Dokumen</div>
          <p className="text-[11px] text-emerald-700 mt-1">100% Terenkripsi aman</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-400 font-semibold uppercase">Kapasitas On-Premise</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">4.1 GB / 10.0 GB</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-unsil-green-700 h-full w-[41%]" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-400 font-semibold uppercase">Integritas Hash SHA-256</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">Terverifikasi</div>
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
                Daftar 21 Satuan Kerja Resmi (Tabel master_unit_kerja)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kode unit digunakan secara presisi pada generator penomoran naskah dinas: [No]/[kode_unit]/[Klasifikasi]/[Tahun]
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

