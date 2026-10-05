import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Search,
  Users,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import defaultUnitKerjaList from '../../data/unitKerja.json';
import { OTK_UNSIL_GROUPED_UNITS } from './UnitMutationManager';
import { sortUnitsByOtk } from '../../utils/unitKerjaHelper';
import {
  fetchUnitKerjaList,
  createUnitKerja,
  updateUnitKerja,
  deleteUnitKerja
} from '../../services/adminService';

// Pilihan kategori yang sederhana dan mudah dipahami
const KATEGORI_OPTIONS = [
  { value: 'FAKULTAS', label: 'Fakultas' },
  { value: 'PASCASARJANA', label: 'Program Pascasarjana' },
  { value: 'BIRO', label: 'Biro Administrasi' },
  { value: 'LEMBAGA', label: 'Lembaga' },
  { value: 'UPA', label: 'Unit Penunjang Akademik (UPA)' },
  { value: 'ORGAN', label: 'Pimpinan & Organ Universitas' }
];

export const UnitManagementView = ({
  currentUser,
  allUsers = [],
  showToast
}) => {
  // Master data unit kerja
  const [units, setUnits] = useState(() => {
    try {
      const saved = localStorage.getItem('siloka_unit_kerja_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sortUnitsByOtk(parsed);
      }
    } catch (e) {
      // Abaikan jika error membaca localStorage
    }
    return sortUnitsByOtk(defaultUnitKerjaList);
  });

  // Pencarian & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('ALL');

  // State Modal Tambah / Ubah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingUnitId, setEditingUnitId] = useState(null);

  // Form State yang sederhana
  const [formData, setFormData] = useState({
    nama_unit: '',
    singkatan: '',
    kode_unit: '',
    tipe_unit: 'FAKULTAS',
    parent_kode: 'UN58',
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Muat data dari server saat komponen dibuka
  useEffect(() => {
    let isMounted = true;
    fetchUnitKerjaList(currentUser)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const sorted = sortUnitsByOtk(data);
          setUnits(sorted);
          try {
            localStorage.setItem('siloka_unit_kerja_data', JSON.stringify(sorted));
          } catch (e) {
            // Abaikan
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Simpan data dan urutkan otomatis
  const persistUnits = (newUnits) => {
    const sorted = sortUnitsByOtk(newUnits);
    setUnits(sorted);
    try {
      localStorage.setItem('siloka_unit_kerja_data', JSON.stringify(sorted));
    } catch (e) {
      console.warn('Gagal menyimpan ke penyimpanan lokal:', e.message);
    }
  };

  // Data unit kerja diperkaya dengan jumlah pegawai terdaftar
  const enrichedUnits = useMemo(() => {
    return units.map((unit) => {
      const memberCount = allUsers.filter(
        (u) =>
          u.unit === unit.nama_unit ||
          u.kode_unit === unit.kode_unit ||
          u.unitKerja === unit.nama_unit ||
          u.unit_kerja_id === unit.kode_unit
      ).length;

      const parentObj = units.find((p) => p.kode_unit === unit.parent_kode);

      return {
        ...unit,
        parent_name: parentObj ? parentObj.nama_unit : unit.parent_kode || 'Universitas Siliwangi',
        memberCount
      };
    });
  }, [units, allUsers]);

  // Filter unit kerja berdasarkan pencarian dan kategori
  const filteredUnits = useMemo(() => {
    return enrichedUnits.filter((unit) => {
      const matchKategori =
        selectedKategori === 'ALL' ||
        (selectedKategori === 'FAKULTAS' &&
          (unit.tipe_unit === 'FAKULTAS' || unit.tipe_unit === 'PASCASARJANA')) ||
        (selectedKategori === 'BIRO' && unit.tipe_unit === 'BIRO') ||
        (selectedKategori === 'LEMBAGA_UPA' &&
          (unit.tipe_unit === 'LEMBAGA' || unit.tipe_unit === 'UPA')) ||
        (selectedKategori === 'ORGAN' &&
          ['UNIVERSITAS', 'ORGAN'].includes(unit.tipe_unit));

      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        unit.nama_unit.toLowerCase().includes(term) ||
        unit.kode_unit.toLowerCase().includes(term) ||
        (unit.singkatan && unit.singkatan.toLowerCase().includes(term));

      return matchKategori && matchSearch;
    });
  }, [enrichedUnits, selectedKategori, searchTerm]);

  // Buka Modal Tambah Unit
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingUnitId(null);
    setFormData({
      nama_unit: '',
      singkatan: '',
      kode_unit: '',
      tipe_unit: 'FAKULTAS',
      parent_kode: 'UN58',
      is_active: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Buka Modal Ubah Unit
  const handleOpenEditModal = (unit) => {
    setModalMode('edit');
    setEditingUnitId(unit.id || unit.kode_unit);
    setFormData({
      nama_unit: unit.nama_unit || '',
      singkatan: unit.singkatan || '',
      kode_unit: unit.kode_unit || '',
      tipe_unit: unit.tipe_unit || 'FAKULTAS',
      parent_kode: unit.parent_kode || 'UN58',
      is_active: unit.is_active !== false
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Simpan Data Form (Tambah atau Ubah)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanNama = formData.nama_unit.trim();
    const cleanSingkatan = formData.singkatan.trim().toUpperCase();
    let cleanKode = formData.kode_unit.trim().toUpperCase();

    if (!cleanNama) {
      setFormError('Nama unit kerja wajib diisi.');
      return;
    }

    // Jika kode tidak diisi, gunakan singkatan atau nama singkat sebagai kode
    if (!cleanKode) {
      cleanKode = cleanSingkatan || cleanNama.slice(0, 8).toUpperCase().replace(/\s+/g, '');
    }

    // Cek duplikasi kode saat menambah baru
    if (modalMode === 'create') {
      const exists = units.some(
        (u) => String(u.kode_unit).toUpperCase() === cleanKode
      );
      if (exists) {
        setFormError(`Kode unit "${cleanKode}" sudah digunakan. Silakan gunakan kode lain.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kode_unit: cleanKode,
        nama_unit: cleanNama,
        singkatan: cleanSingkatan || cleanKode,
        tipe_unit: formData.tipe_unit,
        parent_kode: formData.parent_kode || 'UN58',
        is_active: formData.is_active
      };

      if (modalMode === 'create') {
        const res = await createUnitKerja(payload, currentUser);
        const newUnit = res?.data || {
          id: Date.now(),
          ...payload
        };
        persistUnits([...units, newUnit]);
        showToast?.(`Unit kerja "${cleanNama}" berhasil ditambahkan.`, 'success');
      } else {
        await updateUnitKerja(editingUnitId, payload, currentUser);
        const updated = units.map((u) => {
          if (String(u.id) === String(editingUnitId) || String(u.kode_unit) === String(editingUnitId)) {
            return { ...u, ...payload };
          }
          return u;
        });
        persistUnits(updated);
        showToast?.(`Data unit kerja "${cleanNama}" berhasil diperbarui.`, 'success');
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Terjadi kendala saat menyimpan data unit kerja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Unit Kerja
  const handleDeleteUnit = async (unit) => {
    // Lindungi Rektorat sebagai root universitas
    if (unit.kode_unit === 'UN58') {
      alert('Unit Universitas Siliwangi (Rektorat) adalah unit utama universitas dan tidak dapat dihapus.');
      return;
    }

    const memberCount = unit.memberCount || 0;
    let confirmMsg = `Hapus unit kerja "${unit.nama_unit}"?`;
    if (memberCount > 0) {
      confirmMsg += `\n\nPerhatian: Terdapat ${memberCount} pengguna yang saat ini terdaftar di unit ini.`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const idToDelete = unit.id || unit.kode_unit;
      await deleteUnitKerja(idToDelete, currentUser);
      const updated = units.filter(
        (u) => String(u.id) !== String(idToDelete) && String(u.kode_unit) !== String(idToDelete)
      );
      persistUnits(updated);
      showToast?.(`Unit kerja "${unit.nama_unit}" berhasil dihapus.`, 'info');
    } catch (err) {
      showToast?.(err.message || 'Gagal menghapus unit kerja.', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-150">
      {/* Header Halaman yang Bersih & Langsung pada Inti */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-unsil-green-950 border border-emerald-300">
              <Building2 className="w-3.5 h-3.5 text-unsil-green-800" />
              Universitas Siliwangi
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Unit Kerja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar seluruh fakultas, biro, lembaga, dan unit kerja resmi di lingkungan UNSIL.
          </p>
        </div>

        {/* Tombol Tambah Tunggal yang Jelas */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-unsil-green-900 hover:bg-unsil-green-950 text-white text-xs font-bold shadow-md shadow-unsil-green-950/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Unit Kerja</span>
        </button>
      </div>

      {/* Bar Pencarian & Filter Kategori yang Sederhana */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama unit kerja atau singkatan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'FAKULTAS', label: 'Fakultas' },
            { id: 'BIRO', label: 'Biro' },
            { id: 'LEMBAGA_UPA', label: 'Lembaga & UPA' },
            { id: 'ORGAN', label: 'Pimpinan' }
          ].map((kat) => (
            <button
              key={kat.id}
              type="button"
              onClick={() => setSelectedKategori(kat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedKategori === kat.id
                  ? 'bg-unsil-green-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {kat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Daftar Unit Kerja yang Rapi & Jelas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <span className="font-bold text-xs text-slate-700">
            Total {filteredUnits.length} Unit Kerja
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Unit Kerja</th>
                <th className="py-3 px-4">Kode / Singkatan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Pegawai</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Unit kerja tidak ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan periksa kata kunci pencarian atau pilih filter kategori lain.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u, index) => (
                  <tr key={u.id || u.kode_unit} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.nama_unit}</div>
                      {u.parent_kode && u.parent_kode !== 'UN58' && (
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          Induk: {u.parent_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-bold text-unsil-green-950 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {u.kode_unit}
                        </span>
                        {u.singkatan && u.singkatan !== u.kode_unit && (
                          <span className="text-[11px] font-semibold text-slate-600">
                            ({u.singkatan})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          u.tipe_unit === 'FAKULTAS' || u.tipe_unit === 'PASCASARJANA'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : u.tipe_unit === 'BIRO'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : u.tipe_unit === 'LEMBAGA' || u.tipe_unit === 'UPA'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {u.tipe_unit === 'ORGAN' || u.tipe_unit === 'UNIVERSITAS'
                          ? 'Pimpinan'
                          : u.tipe_unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        <Users className="w-3 h-3 text-slate-400" />
                        {u.memberCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-unsil-green-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Ubah Data"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.kode_unit !== 'UN58' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / UBAH UNIT KERJA (SUPER SIMPLE & JELAS)                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-unsil-green-900 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-unsil-green-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {modalMode === 'create' ? 'Tambah Unit Kerja Baru' : 'Ubah Unit Kerja'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === 'create'
                      ? 'Masukkan data unit kerja yang ingin ditambahkan'
                      : `Perbarui data untuk ${formData.nama_unit}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Nama Lengkap Unit Kerja */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Unit Kerja <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_unit}
                  onChange={(e) => setFormData({ ...formData, nama_unit: e.target.value })}
                  placeholder="Contoh: Fakultas Kedokteran"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                />
              </div>

              {/* 2. Singkatan & Kode Naskah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Singkatan
                  </label>
                  <input
                    type="text"
                    value={formData.singkatan}
                    onChange={(e) =>
                      setFormData({ ...formData, singkatan: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: FK"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition uppercase"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                    Singkatan umum unit kerja
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Surat / Naskah
                  </label>
                  <input
                    type="text"
                    value={formData.kode_unit}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_unit: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: UN58.18"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition uppercase"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                    Digunakan untuk nomor surat
                  </span>
                </div>
              </div>

              {/* 3. Kategori Unit & Unit Induk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Unit <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.tipe_unit}
                    onChange={(e) => setFormData({ ...formData, tipe_unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition cursor-pointer"
                  >
                    {KATEGORI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Induk (Bawahan Dari)
                  </label>
                  <select
                    value={formData.parent_kode}
                    onChange={(e) => setFormData({ ...formData, parent_kode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition cursor-pointer"
                  >
                    <option value="UN58">Universitas Siliwangi (Rektorat)</option>
                    {units
                      .filter((u) => u.kode_unit !== formData.kode_unit && u.kode_unit !== 'UN58')
                      .map((u) => (
                        <option key={u.id || u.kode_unit} value={u.kode_unit}>
                          {u.nama_unit}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 4. Status Aktif */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Status Keaktifan</div>
                  <div className="text-[11px] text-slate-400">Unit kerja dapat dipilih saat membuat surat</div>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-unsil-green-800 focus:ring-unsil-green-800/30"
                  />
                  <span className="text-xs font-bold text-slate-700">Aktif</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-unsil-green-900 hover:bg-unsil-green-950 text-white shadow-md shadow-unsil-green-950/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : modalMode === 'create'
                    ? 'Simpan Unit'
                    : 'Perbarui Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagementView;
