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
  AlertCircle,
  Network,
  Check
} from 'lucide-react';
import defaultUnitKerjaList from '../../data/unitKerja.json';
import { OTK_UNSIL_GROUPED_UNITS } from './UnitMutationManager';
import { sortUnitsByOtk } from '../../utils/unitKerjaHelper';
import {
  enrichUnitsWithDefaultJurusan,
  getDefaultStrukturOrganisasi,
  getStrukturOrganisasiByUnit,
  resolveJabatanScope,
  getJurusanByUnitCode
} from '../../utils/unitJabatanOptions';
import {
  getRolesCatalog,
  RBAC_CHANGE_EVENT
} from '../../utils/rbacSyncService';
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
        if (Array.isArray(parsed) && parsed.length > 0) return sortUnitsByOtk(enrichUnitsWithDefaultJurusan(parsed));
      }
    } catch (e) {
      // Abaikan jika error membaca localStorage
    }
    return sortUnitsByOtk(enrichUnitsWithDefaultJurusan(defaultUnitKerjaList));
  });

  // Pencarian & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('ALL');

  // State Modal Tambah / Ubah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingUnitId, setEditingUnitId] = useState(null);

  // State Modal Kelola Jurusan / Program Studi
  const [isJurusanModalOpen, setIsJurusanModalOpen] = useState(false);
  const [selectedJurusanUnit, setSelectedJurusanUnit] = useState(null);
  const [newJurusanName, setNewJurusanName] = useState('');
  const [newJurusanCode, setNewJurusanCode] = useState('');
  const [jurusanError, setJurusanError] = useState('');

  // State Modal Kelola Struktur Organisasi
  const [isStrukturModalOpen, setIsStrukturModalOpen] = useState(false);
  const [selectedStrukturUnit, setSelectedStrukturUnit] = useState(null);
  const [strukturFilterRole, setStrukturFilterRole] = useState('ALL');
  const [strukturFilterScope, setStrukturFilterScope] = useState('ALL');
  const [editingStrukturId, setEditingStrukturId] = useState(null);
  const [strukturForm, setStrukturForm] = useState({
    nama_jabatan: '',
    kategori_peran: 'pimpinan',
    level_hirarki: 1,
    jurusan: 'FAKULTAS'
  });
  const [strukturError, setStrukturError] = useState('');

  // Sinkronisasi Katalog Peran dari Manajemen Peran Pengguna (RBAC) secara Real-Time
  const [rolesCatalog, setRolesCatalog] = useState(() => getRolesCatalog());

  useEffect(() => {
    const handleRbacUpdate = () => {
      setRolesCatalog(getRolesCatalog());
    };
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
  }, []);

  // Peran operasional kedinasan institusi (mengecualikan Super Admin yang bertindak sebagai administrator sistem murni)
  const operationalRoles = useMemo(() => {
    const canonicalLabels = {
      pimpinan: 'Pimpinan (TTE & Disposisi)',
      verifikator: 'Verifikator Naskah Dinas',
      admin_tu: 'Tata Usaha / Pengadministrasi',
      drafter: 'Konseptor / Dosen Fungsional'
    };

    const shortLabels = {
      pimpinan: 'Pimpinan',
      verifikator: 'Verifikator',
      admin_tu: 'Tata Usaha',
      drafter: 'Dosen/Staf'
    };

    return (rolesCatalog || [])
      .filter((r) => {
        const slug = (r.slug || r.id || '').toLowerCase();
        return slug !== 'super_admin';
      })
      .map((r) => {
        const slug = (r.slug || r.id || '').toLowerCase();
        return {
          slug,
          name: r.name,
          label: canonicalLabels[slug] || r.name,
          shortLabel: shortLabels[slug] || r.name,
          badgeColor: r.badgeColor || 'bg-teal-50 text-teal-800 border-teal-200'
        };
      });
  }, [rolesCatalog]);

  // Resolusi nama tampilan label peran untuk badge jabatan
  const getRoleLabel = (roleSlug) => {
    const found = operationalRoles.find((r) => r.slug === roleSlug);
    if (found) return found.shortLabel || found.name;
    if (roleSlug === 'pimpinan') return 'Pimpinan';
    if (roleSlug === 'verifikator') return 'Verifikator';
    if (roleSlug === 'admin_tu') return 'Tata Usaha';
    if (roleSlug === 'drafter') return 'Konseptor/Dosen';
    return roleSlug;
  };

  // Resolusi gaya warna badge peran untuk jabatan
  const getRoleBadgeStyle = (roleSlug) => {
    const found = operationalRoles.find((r) => r.slug === roleSlug);
    if (found?.badgeColor) return found.badgeColor;
    if (roleSlug === 'pimpinan') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (roleSlug === 'verifikator') return 'bg-blue-50 text-blue-800 border-blue-200';
    if (roleSlug === 'admin_tu') return 'bg-purple-50 text-purple-800 border-purple-200';
    if (roleSlug === 'drafter') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Penyesuaian otomatis tingkat hirarki saat kategori peran dipilih
  const handleRoleCategoryChange = (e) => {
    const newRole = e.target.value;
    let suggestedLevel = 4;
    const lower = newRole.toLowerCase();
    if (lower.includes('pimpinan') || lower === 'pimpinan' || lower.includes('rektor') || lower.includes('dekan')) {
      suggestedLevel = 1;
    } else if (lower.includes('verifikator') || lower === 'verifikator' || lower.includes('kabag')) {
      suggestedLevel = 2;
    } else if (lower.includes('tu') || lower.includes('kasubag') || lower.includes('admin')) {
      suggestedLevel = 3;
    } else {
      suggestedLevel = 4;
    }

    setStrukturForm((prev) => ({
      ...prev,
      kategori_peran: newRole,
      level_hirarki: suggestedLevel
    }));
  };

  // Daftar Jurusan resmi milik unit kerja yang sedang dibuka modal struktur organisasinya
  const selectedUnitJurusanList = useMemo(() => {
    if (!selectedStrukturUnit) return [];
    return getJurusanByUnitCode(selectedStrukturUnit.kode_unit, units);
  }, [selectedStrukturUnit, units]);

  // Penghitungan jumlah jabatan untuk setiap lingkup sub-unit (Dekanat & per Jurusan)
  const scopeCounts = useMemo(() => {
    if (!selectedStrukturUnit) return { ALL: 0, FAKULTAS: 0 };
    const list = selectedStrukturUnit.struktur_organisasi || [];
    const counts = {
      ALL: list.length,
      FAKULTAS: 0
    };
    (selectedUnitJurusanList || []).forEach((j) => {
      counts[j.nama] = 0;
    });

    list.forEach((item) => {
      const scope = resolveJabatanScope(item, selectedUnitJurusanList);
      if (counts[scope] !== undefined) {
        counts[scope] += 1;
      } else {
        counts.FAKULTAS += 1;
      }
    });

    return counts;
  }, [selectedStrukturUnit, selectedUnitJurusanList]);

  // Daftar jabatan yang telah difilter berdasarkan lingkup sub-unit terpilih
  const scopeFilteredStrukturList = useMemo(() => {
    if (!selectedStrukturUnit) return [];
    const list = selectedStrukturUnit.struktur_organisasi || [];
    if (!selectedUnitJurusanList.length || strukturFilterScope === 'ALL') {
      return list;
    }
    return list.filter((item) => {
      const scope = resolveJabatanScope(item, selectedUnitJurusanList);
      return scope === strukturFilterScope;
    });
  }, [selectedStrukturUnit, selectedUnitJurusanList, strukturFilterScope]);

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
          const sorted = sortUnitsByOtk(enrichUnitsWithDefaultJurusan(data));
          setUnits(sorted);
          try {
            localStorage.setItem('siloka_unit_kerja_data', JSON.stringify(sorted));
            window.dispatchEvent(new CustomEvent('SILOKA_UNIT_DATA_CHANGED', { detail: { units: sorted } }));
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
      window.dispatchEvent(new CustomEvent('SILOKA_UNIT_DATA_CHANGED', { detail: { units: sorted } }));
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

  // Buka Modal Kelola Jurusan
  const handleOpenJurusanModal = (unit) => {
    setSelectedJurusanUnit(unit);
    setNewJurusanName('');
    setNewJurusanCode('');
    setJurusanError('');
    setIsJurusanModalOpen(true);
  };

  // Tambah Jurusan Baru ke Unit Kerja Terpilih
  const handleAddJurusan = async (e) => {
    e.preventDefault();
    setJurusanError('');
    if (!selectedJurusanUnit) return;

    const cleanNama = newJurusanName.trim();
    if (!cleanNama) {
      setJurusanError('Nama jurusan atau program studi wajib diisi.');
      return;
    }

    const currentJurusan = selectedJurusanUnit.jurusan || [];
    const exists = currentJurusan.some(
      (j) => j.nama.toLowerCase() === cleanNama.toLowerCase()
    );
    if (exists) {
      setJurusanError(`Jurusan "${cleanNama}" sudah terdaftar pada ${selectedJurusanUnit.nama_unit}.`);
      return;
    }

    let cleanKode = newJurusanCode.trim().toUpperCase();
    if (!cleanKode) {
      cleanKode =
        cleanNama
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 6) || cleanNama.slice(0, 4).toUpperCase();
    }

    const newJurusanItem = {
      id: `jur-${Date.now()}`,
      kode: cleanKode,
      nama: cleanNama
    };

    const updatedJurusanList = [...currentJurusan, newJurusanItem];
    const updatedUnit = {
      ...selectedJurusanUnit,
      jurusan: updatedJurusanList
    };

    const updatedUnits = units.map((u) => {
      if (
        String(u.id) === String(selectedJurusanUnit.id) ||
        String(u.kode_unit) === String(selectedJurusanUnit.kode_unit)
      ) {
        return updatedUnit;
      }
      return u;
    });

    setSelectedJurusanUnit(updatedUnit);
    persistUnits(updatedUnits);

    try {
      await updateUnitKerja(
        selectedJurusanUnit.id || selectedJurusanUnit.kode_unit,
        { jurusan: updatedJurusanList },
        currentUser
      );
    } catch (err) {
      // Abaikan jika offline, penyimpanan lokal sudah diperbarui
    }

    setNewJurusanName('');
    setNewJurusanCode('');
    showToast?.(`Jurusan "${cleanNama}" berhasil ditambahkan ke ${selectedJurusanUnit.nama_unit}.`, 'success');
  };

  // Hapus Jurusan dari Unit Kerja Terpilih
  const handleDeleteJurusan = async (jurusanId, jurusanNama) => {
    if (!selectedJurusanUnit) return;
    if (!window.confirm(`Hapus jurusan "${jurusanNama}" dari ${selectedJurusanUnit.nama_unit}?`)) {
      return;
    }

    const updatedJurusanList = (selectedJurusanUnit.jurusan || []).filter(
      (j) => (j.id ? j.id !== jurusanId : j.nama !== jurusanNama)
    );

    const updatedUnit = {
      ...selectedJurusanUnit,
      jurusan: updatedJurusanList
    };

    const updatedUnits = units.map((u) => {
      if (
        String(u.id) === String(selectedJurusanUnit.id) ||
        String(u.kode_unit) === String(selectedJurusanUnit.kode_unit)
      ) {
        return updatedUnit;
      }
      return u;
    });

    setSelectedJurusanUnit(updatedUnit);
    persistUnits(updatedUnits);

    try {
      await updateUnitKerja(
        selectedJurusanUnit.id || selectedJurusanUnit.kode_unit,
        { jurusan: updatedJurusanList },
        currentUser
      );
    } catch (err) {
      // Abaikan jika offline
    }

    showToast?.(`Jurusan "${jurusanNama}" berhasil dihapus.`, 'info');
  };

  // Buka Modal Kelola Struktur Organisasi (Mendukung filter awal berdasarkan Jurusan)
  const handleOpenStrukturModal = (unit, initialScope = null) => {
    // Jika unit sudah memiliki struktur_organisasi (termasuk jika kosong [] karena telah dihapus),
    // pertahankan apa adanya dan jangan pernah mengembalikan posisi yang sudah dihapus.
    const initialStruktur =
      Array.isArray(unit.struktur_organisasi)
        ? unit.struktur_organisasi
        : getDefaultStrukturOrganisasi(unit.kode_unit, units);

    setSelectedStrukturUnit({
      ...unit,
      struktur_organisasi: initialStruktur
    });
    setEditingStrukturId(null);

    const targetScope = initialScope || 'ALL';
    setStrukturFilterScope(targetScope);

    setStrukturForm({
      nama_jabatan: '',
      kategori_peran: operationalRoles[0]?.slug || 'pimpinan',
      level_hirarki: 1,
      jurusan: targetScope !== 'ALL' ? targetScope : 'FAKULTAS'
    });
    setStrukturFilterRole('ALL');
    setStrukturError('');
    setIsStrukturModalOpen(true);
  };

  // Simpan Jabatan (Tambah Baru atau Ubah yang Sedang Diedit)
  const handleSaveStrukturItem = async (e) => {
    e.preventDefault();
    setStrukturError('');
    if (!selectedStrukturUnit) return;

    const cleanName = strukturForm.nama_jabatan.trim();
    if (!cleanName) {
      setStrukturError('Nama jabatan resmi wajib diisi.');
      return;
    }

    const currentStruktur = selectedStrukturUnit.struktur_organisasi || [];
    const resolvedScope =
      strukturForm.jurusan || resolveJabatanScope(cleanName, selectedUnitJurusanList);

    if (editingStrukturId) {
      // Mode Ubah (Edit)
      const duplicate = currentStruktur.some(
        (item) =>
          item.id !== editingStrukturId &&
          item.nama_jabatan.toLowerCase() === cleanName.toLowerCase() &&
          item.kategori_peran === strukturForm.kategori_peran
      );
      if (duplicate) {
        setStrukturError(`Jabatan "${cleanName}" dengan peran tersebut sudah terdaftar pada unit ini.`);
        return;
      }

      const updatedList = currentStruktur.map((item) => {
        if (item.id === editingStrukturId) {
          return {
            ...item,
            nama_jabatan: cleanName,
            kategori_peran: strukturForm.kategori_peran,
            level_hirarki: Number(strukturForm.level_hirarki) || item.level_hirarki || 1,
            jurusan: resolvedScope
          };
        }
        return item;
      });

      const updatedUnit = {
        ...selectedStrukturUnit,
        struktur_organisasi: updatedList
      };

      const updatedUnits = units.map((u) => {
        if (
          String(u.id) === String(selectedStrukturUnit.id) ||
          String(u.kode_unit) === String(selectedStrukturUnit.kode_unit)
        ) {
          return updatedUnit;
        }
        return u;
      });

      setSelectedStrukturUnit(updatedUnit);
      persistUnits(updatedUnits);

      try {
        await updateUnitKerja(
          selectedStrukturUnit.id || selectedStrukturUnit.kode_unit,
          { struktur_organisasi: updatedList },
          currentUser
        );
      } catch (err) {}

      setEditingStrukturId(null);
      setStrukturForm({
        nama_jabatan: '',
        kategori_peran: operationalRoles[0]?.slug || 'pimpinan',
        level_hirarki: 1,
        jurusan: strukturFilterScope !== 'ALL' ? strukturFilterScope : 'FAKULTAS'
      });
      showToast?.(`Jabatan "${cleanName}" berhasil diperbarui.`, 'success');
    } else {
      // Mode Tambah Baru
      const duplicate = currentStruktur.some(
        (item) =>
          item.nama_jabatan.toLowerCase() === cleanName.toLowerCase() &&
          item.kategori_peran === strukturForm.kategori_peran
      );
      if (duplicate) {
        setStrukturError(`Jabatan "${cleanName}" dengan peran tersebut sudah terdaftar.`);
        return;
      }

      const newItem = {
        id: `str-${Date.now()}`,
        nama_jabatan: cleanName,
        kategori_peran: strukturForm.kategori_peran,
        level_hirarki: Number(strukturForm.level_hirarki) || 1,
        jurusan: resolvedScope
      };

      const updatedList = [...currentStruktur, newItem];
      const updatedUnit = {
        ...selectedStrukturUnit,
        struktur_organisasi: updatedList
      };

      const updatedUnits = units.map((u) => {
        if (
          String(u.id) === String(selectedStrukturUnit.id) ||
          String(u.kode_unit) === String(selectedStrukturUnit.kode_unit)
        ) {
          return updatedUnit;
        }
        return u;
      });

      setSelectedStrukturUnit(updatedUnit);
      persistUnits(updatedUnits);

      try {
        await updateUnitKerja(
          selectedStrukturUnit.id || selectedStrukturUnit.kode_unit,
          { struktur_organisasi: updatedList },
          currentUser
        );
      } catch (err) {}

      setStrukturForm({
        nama_jabatan: '',
        kategori_peran: operationalRoles[0]?.slug || 'pimpinan',
        level_hirarki: 1,
        jurusan: strukturFilterScope !== 'ALL' ? strukturFilterScope : 'FAKULTAS'
      });
      showToast?.(`Jabatan "${cleanName}" berhasil ditambahkan ke struktur organisasi.`, 'success');
    }
  };

  // Mulai Mode Edit untuk Satu Item Jabatan
  const handleStartEditStruktur = (item) => {
    setEditingStrukturId(item.id);
    const scope = resolveJabatanScope(item, selectedUnitJurusanList);
    setStrukturForm({
      nama_jabatan: item.nama_jabatan,
      kategori_peran: item.kategori_peran,
      level_hirarki: item.level_hirarki || 1,
      jurusan: item.jurusan || scope || 'FAKULTAS'
    });
    setStrukturError('');
  };

  // Batalkan Mode Edit
  const handleCancelEditStruktur = () => {
    setEditingStrukturId(null);
    setStrukturForm({
      nama_jabatan: '',
      kategori_peran: operationalRoles[0]?.slug || 'pimpinan',
      level_hirarki: 1,
      jurusan: strukturFilterScope !== 'ALL' ? strukturFilterScope : 'FAKULTAS'
    });
    setStrukturError('');
  };

  // Hapus Item Jabatan dari Struktur Organisasi
  const handleDeleteStrukturItem = async (itemId, itemNama) => {
    if (!selectedStrukturUnit) return;
    if (!window.confirm(`Hapus jabatan "${itemNama}" dari struktur organisasi ${selectedStrukturUnit.nama_unit}?`)) {
      return;
    }

    const updatedList = (selectedStrukturUnit.struktur_organisasi || []).filter(
      (item) => item.id !== itemId
    );

    const updatedUnit = {
      ...selectedStrukturUnit,
      struktur_organisasi: updatedList
    };

    const updatedUnits = units.map((u) => {
      if (
        String(u.id) === String(selectedStrukturUnit.id) ||
        String(u.kode_unit) === String(selectedStrukturUnit.kode_unit)
      ) {
        return updatedUnit;
      }
      return u;
    });

    if (editingStrukturId === itemId) {
      handleCancelEditStruktur();
    }

    setSelectedStrukturUnit(updatedUnit);
    persistUnits(updatedUnits);

    try {
      await updateUnitKerja(
        selectedStrukturUnit.id || selectedStrukturUnit.kode_unit,
        { struktur_organisasi: updatedList },
        currentUser
      );
    } catch (err) {}

    showToast?.(`Jabatan "${itemNama}" berhasil dihapus.`, 'info');
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenStrukturModal(u)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 hover:text-blue-950 border border-blue-200 transition cursor-pointer"
                          title="Kelola Struktur Organisasi & Jabatan Resmi Unit"
                        >
                          <Network className="w-3.5 h-3.5 text-blue-700" />
                          <span>
                            {Array.isArray(u.struktur_organisasi) && u.struktur_organisasi.length > 0
                              ? `${u.struktur_organisasi.length} Jabatan SOTK`
                              : 'Struktur Organisasi'}
                          </span>
                        </button>
                        {(u.tipe_unit === 'FAKULTAS' || u.tipe_unit === 'PASCASARJANA' || (u.jurusan && u.jurusan.length > 0)) && (
                          <button
                            type="button"
                            onClick={() => handleOpenJurusanModal(u)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-unsil-green-900 hover:bg-emerald-100 hover:text-unsil-green-950 border border-emerald-200 transition cursor-pointer"
                            title="Klik untuk melihat dan mengelola daftar jurusan/program studi"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-unsil-green-800" />
                            <span>{u.jurusan?.length || 0} Jurusan</span>
                          </button>
                        )}
                      </div>
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
                          onClick={() => handleOpenStrukturModal(u)}
                          className="p-1.5 rounded-lg text-blue-700 hover:text-blue-900 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Kelola Struktur Organisasi & Jabatan Unit"
                        >
                          <Network className="w-4 h-4" />
                        </button>
                        {(u.tipe_unit === 'FAKULTAS' || u.tipe_unit === 'PASCASARJANA' || (u.jurusan && u.jurusan.length > 0)) && (
                          <button
                            type="button"
                            onClick={() => handleOpenJurusanModal(u)}
                            className="p-1.5 rounded-lg text-unsil-green-800 hover:text-unsil-green-950 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Kelola Jurusan & Program Studi"
                          >
                            <GraduationCap className="w-4 h-4" />
                          </button>
                        )}
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
      {/* ========================================================================= */}
      {/* MODAL KELOLA JURUSAN / PROGRAM STUDI (INTEGRASI PENAMBAHAN DOSEN/PEGAWAI) */}
      {/* ========================================================================= */}
      {isJurusanModalOpen && selectedJurusanUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-unsil-green-900 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-unsil-green-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Kelola Jurusan &amp; Program Studi
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedJurusanUnit.nama_unit} ({selectedJurusanUnit.singkatan || selectedJurusanUnit.kode_unit})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJurusanModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed">
                Jurusan di bawah ini terintegrasi langsung dengan formulir penambahan dan pembaruan pengguna. Saat mendaftarkan dosen atau pimpinan jurusan, opsi jabatan akan menyesuaikan secara otomatis tanpa perlu diketik manual.
              </div>

              {jurusanError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{jurusanError}</span>
                </div>
              )}

              {/* Daftar Jurusan Terdaftar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Jurusan Aktif ({selectedJurusanUnit.jurusan?.length || 0})
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {(!selectedJurusanUnit.jurusan || selectedJurusanUnit.jurusan.length === 0) ? (
                    <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Belum ada jurusan terdaftar. Silakan tambahkan jurusan pertama di bawah.
                    </div>
                  ) : (
                    selectedJurusanUnit.jurusan.map((j) => (
                      <div
                        key={j.id || j.kode || j.nama}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen className="w-4 h-4 text-unsil-green-800 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {j.nama}
                            </span>
                            {j.kode && (
                              <span className="text-[10px] font-mono font-semibold text-slate-500">
                                Kode: {j.kode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsJurusanModalOpen(false);
                              handleOpenStrukturModal(selectedJurusanUnit, j.nama);
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                            title={`Kelola Struktur Jabatan Jurusan ${j.nama}`}
                          >
                            <Network className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Struktur Jabatan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJurusan(j.id, j.nama)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Jurusan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form Tambah Jurusan Baru */}
              <form onSubmit={handleAddJurusan} className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Tambah Jurusan Baru</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newJurusanName}
                      onChange={(e) => setNewJurusanName(e.target.value)}
                      placeholder="Nama Jurusan (contoh: Informatika)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newJurusanCode}
                      onChange={(e) => setNewJurusanCode(e.target.value.toUpperCase())}
                      placeholder="Kode (opsional)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-unsil-green-900 hover:bg-unsil-green-950 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Jurusan</span>
                </button>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsJurusanModalOpen(false)}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KELOLA STRUKTUR ORGANISASI & JABATAN UNIT (SOTK RESMI DINAMIS) */}
      {/* ========================================================================= */}
      {isStrukturModalOpen && selectedStrukturUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <Network className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Kelola Struktur Organisasi &amp; Jabatan Unit
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStrukturUnit.nama_unit} ({selectedStrukturUnit.singkatan || selectedStrukturUnit.kode_unit})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStrukturModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Petunjuk Penggunaan */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-950 leading-relaxed">
                Nomenklatur jabatan yang dikonfigurasi di bawah ini menentukan posisi resmi yang berlaku pada unit kerja ini. Jabatan ini langsung terhubung secara otomatis ke formulir akun pengguna, penandatangan TTE, dan jalur verifikasi surat.
              </div>

              {strukturError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{strukturError}</span>
                </div>
              )}

              {/* Pemilih Lingkup Sub-Unit (Dekanat / per Jurusan) */}
              {selectedUnitJurusanList.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Pilih Lingkup / Bagian Unit:</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {selectedUnitJurusanList.length} Jurusan / Program Studi Terdaftar
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Tab Seluruh Bagian */}
                    <button
                      type="button"
                      onClick={() => {
                        setStrukturFilterScope('ALL');
                        setStrukturForm((prev) => ({ ...prev, jurusan: 'FAKULTAS' }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        strukturFilterScope === 'ALL'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Seluruh Bagian</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          strukturFilterScope === 'ALL'
                            ? 'bg-blue-800 text-blue-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {scopeCounts.ALL || 0}
                      </span>
                    </button>

                    {/* Tab Dekanat / Tingkat Fakultas */}
                    <button
                      type="button"
                      onClick={() => {
                        setStrukturFilterScope('FAKULTAS');
                        setStrukturForm((prev) => ({ ...prev, jurusan: 'FAKULTAS' }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        strukturFilterScope === 'FAKULTAS'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏛️ Dekanat / Fakultas</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          strukturFilterScope === 'FAKULTAS'
                            ? 'bg-blue-800 text-blue-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {scopeCounts.FAKULTAS || 0}
                      </span>
                    </button>

                    {/* Dropdown Pemilih Jurusan / Prodi */}
                    <div className="flex items-center gap-1.5 grow sm:grow-0">
                      <select
                        value={
                          strukturFilterScope !== 'ALL' && strukturFilterScope !== 'FAKULTAS'
                            ? strukturFilterScope
                            : ''
                        }
                        onChange={(e) => {
                          const chosen = e.target.value;
                          if (chosen) {
                            setStrukturFilterScope(chosen);
                            setStrukturForm((prev) => ({ ...prev, jurusan: chosen }));
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer grow sm:w-56 ${
                          strukturFilterScope !== 'ALL' && strukturFilterScope !== 'FAKULTAS'
                            ? 'bg-emerald-50 text-unsil-green-900 border-unsil-green-700 ring-2 ring-unsil-green-700/20'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <option value="">🎓 Pilih Jurusan / Prodi...</option>
                        {selectedUnitJurusanList.map((j) => (
                          <option key={j.id || j.kode || j.nama} value={j.nama}>
                            Jurusan {j.nama} ({scopeCounts[j.nama] || 0} Jabatan)
                          </option>
                        ))}
                      </select>

                      {strukturFilterScope !== 'ALL' && strukturFilterScope !== 'FAKULTAS' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStrukturFilterScope('ALL');
                            setStrukturForm((prev) => ({ ...prev, jurusan: 'FAKULTAS' }));
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                          title="Tampilkan Seluruh Bagian"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Banner Indikator Lingkup Aktif */}
                  {strukturFilterScope !== 'ALL' && (
                    <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                      <span>
                        Menampilkan jabatan untuk:{' '}
                        <strong className="font-extrabold text-blue-950">
                          {strukturFilterScope === 'FAKULTAS'
                            ? 'Tingkat Dekanat / Fakultas'
                            : `Jurusan ${strukturFilterScope}`}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setStrukturFilterScope('ALL');
                          setStrukturForm((prev) => ({ ...prev, jurusan: 'FAKULTAS' }));
                        }}
                        className="text-blue-700 hover:underline font-bold cursor-pointer"
                      >
                        Tampilkan Seluruhnya ({scopeCounts.ALL || 0})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bar Filter Kategori Peran Dinamis (Terhubung ke Manajemen Peran) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 pt-1">
                <button
                  type="button"
                  onClick={() => setStrukturFilterRole('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    strukturFilterRole === 'ALL'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({scopeFilteredStrukturList.length})
                </button>
                {operationalRoles.map((role) => {
                  const count = scopeFilteredStrukturList.filter(
                    (s) => s.kategori_peran === role.slug
                  ).length;
                  return (
                    <button
                      key={role.slug}
                      type="button"
                      onClick={() => setStrukturFilterRole(role.slug)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                        strukturFilterRole === role.slug
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {role.shortLabel} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Daftar Posisi Jabatan Aktif */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(() => {
                  const filteredList = scopeFilteredStrukturList.filter(
                    (item) => strukturFilterRole === 'ALL' || item.kategori_peran === strukturFilterRole
                  );

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                        Tidak ada posisi jabatan pada kategori ini di lingkup terpilih. Silakan tambahkan jabatan baru di formulir bawah.
                      </div>
                    );
                  }

                  return filteredList.map((item) => {
                    const itemScope = resolveJabatanScope(item, selectedUnitJurusanList);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          editingStrukturId === item.id
                            ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Briefcase className="w-4 h-4 text-blue-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {item.nama_jabatan}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(
                                  item.kategori_peran
                                )}`}
                              >
                                {getRoleLabel(item.kategori_peran)}
                              </span>
                              {selectedUnitJurusanList.length > 0 && (
                                <span
                                  className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                                    itemScope !== 'FAKULTAS'
                                      ? 'bg-emerald-50 text-unsil-green-900 border-emerald-200'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {itemScope !== 'FAKULTAS' ? `🎓 ${itemScope}` : '🏛️ Dekanat'}
                                </span>
                              )}
                              {item.level_hirarki && (
                                <span className="text-[9.5px] font-medium text-slate-500">
                                  Level {item.level_hirarki}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditStruktur(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            title="Ubah Jabatan"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStrukturItem(item.id, item.nama_jabatan)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Jabatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Form Tambah / Ubah Jabatan */}
              <form onSubmit={handleSaveStrukturItem} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {editingStrukturId ? (
                      <>
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ubah Jabatan Terpilih</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Tambah Jabatan Baru{' '}
                          {strukturFilterScope !== 'ALL'
                            ? strukturFilterScope === 'FAKULTAS'
                              ? '(Dekanat / Fakultas)'
                              : `(Jurusan ${strukturFilterScope})`
                            : ''}
                        </span>
                      </>
                    )}
                  </span>
                  {editingStrukturId && (
                    <button
                      type="button"
                      onClick={handleCancelEditStruktur}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Batal Ubah
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Lingkup Bagian (jika unit memiliki jurusan) */}
                  {selectedUnitJurusanList.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Lingkup / Penempatan Jabatan
                      </label>
                      <select
                        value={strukturForm.jurusan || 'FAKULTAS'}
                        onChange={(e) => setStrukturForm({ ...strukturForm, jurusan: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition cursor-pointer"
                      >
                        <option value="FAKULTAS">🏛️ Tingkat Dekanat / Fakultas</option>
                        {selectedUnitJurusanList.map((j) => (
                          <option key={j.id || j.kode || j.nama} value={j.nama}>
                            🎓 Jurusan {j.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Jabatan Resmi SOTK
                    </label>
                    <input
                      type="text"
                      value={strukturForm.nama_jabatan}
                      onChange={(e) => setStrukturForm({ ...strukturForm, nama_jabatan: e.target.value })}
                      placeholder={
                        strukturForm.jurusan && strukturForm.jurusan !== 'FAKULTAS'
                          ? `contoh: Ketua Jurusan ${strukturForm.jurusan} / Kalab...`
                          : 'contoh: Dekan / Wakil Dekan / Kepala Bagian TU...'
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Kategori Peran Akun
                      </label>
                      <select
                        value={strukturForm.kategori_peran}
                        onChange={handleRoleCategoryChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition cursor-pointer"
                      >
                        {operationalRoles.map((role) => (
                          <option key={role.slug} value={role.slug}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tingkat / Level Hirarki
                      </label>
                      <select
                        value={strukturForm.level_hirarki}
                        onChange={(e) => setStrukturForm({ ...strukturForm, level_hirarki: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition cursor-pointer"
                      >
                        <option value={1}>Level 1 (Pimpinan Utama / Dekan / Ka. Biro)</option>
                        <option value={2}>Level 2 (Wakil Pimpinan / Kabag)</option>
                        <option value={3}>Level 3 (Ketua Jurusan / Kasubag)</option>
                        <option value={4}>Level 4 (Staf / Dosen / Pelaksana)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingStrukturId && (
                    <button
                      type="button"
                      onClick={handleCancelEditStruktur}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingStrukturId ? 'Perbarui Jabatan' : 'Simpan Jabatan Baru'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-500">
                Total {selectedStrukturUnit.struktur_organisasi?.length || 0} jabatan resmi terdaftar pada unit ini
              </span>
              <button
                type="button"
                onClick={() => setIsStrukturModalOpen(false)}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagementView;
