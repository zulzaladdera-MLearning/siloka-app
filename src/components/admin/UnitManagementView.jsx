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
  Check,
  UserCheck,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import defaultUnitKerjaList from '../../data/unitKerja.json';
import { OTK_UNSIL_GROUPED_UNITS } from './UnitMutationManager';
import { sortUnitsByOtk } from '../../utils/unitKerjaHelper';
import {
  enrichUnitsWithDefaultJurusan,
  getDefaultStrukturOrganisasi,
  getStrukturOrganisasiByUnit,
  resolveJabatanScope,
  getJurusanByUnitCode,
  findPositionOccupant
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

  // State Sub-Halaman & Kelola Jurusan / Program Studi
  const [selectedJurusanUnit, setSelectedJurusanUnit] = useState(null);
  const [jurusanSearchQuery, setJurusanSearchQuery] = useState('');
  const [isAddJurusanModalOpen, setIsAddJurusanModalOpen] = useState(false);
  const [editingJurusanId, setEditingJurusanId] = useState(null);
  const [newJurusanName, setNewJurusanName] = useState('');
  const [newJurusanCode, setNewJurusanCode] = useState('');
  const [jurusanError, setJurusanError] = useState('');

  // State Sub-Halaman & Kelola Struktur Organisasi Unit
  const [selectedStrukturUnit, setSelectedStrukturUnit] = useState(null);
  const [strukturSearchQuery, setStrukturSearchQuery] = useState('');
  const [isAddStrukturModalOpen, setIsAddStrukturModalOpen] = useState(false);
  const [strukturFilterRole, setStrukturFilterRole] = useState('ALL');
  const [strukturFilterScope, setStrukturFilterScope] = useState('ALL');
  const [strukturFilterOccupancy, setStrukturFilterOccupancy] = useState('ALL'); // 'ALL' | 'FILLED' | 'VACANT'
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

  // Helper: Mendapatkan akun pejabat aktif yang menduduki posisi jabatan tertentu di unit yang sedang dibuka
  const getPositionOccupants = useMemo(() => {
    return (namaJabatan) => {
      if (!selectedStrukturUnit || !namaJabatan || !Array.isArray(allUsers)) return [];
      const cleanTarget = String(namaJabatan).trim().toLowerCase();
      const unitCode = String(selectedStrukturUnit.kode_unit || '').trim().toUpperCase();

      return allUsers.filter((u) => {
        if (!u || u.is_active === false || u.is_aktif === false || u.status_aktif === false) return false;
        const uJab = String(u.jabatan || u.roleLabel || u.role_label || '').trim().toLowerCase();
        const uUnit = String(u.unit_kerja_id || u.kode_unit || u.id_unit || '').trim().toUpperCase();

        if (uJab === cleanTarget) {
          const isInstitutional = /\b(rektor|wakil rektor|ketua senat|ketua spi|ketua dewan penyantun)\b/i.test(cleanTarget);
          if (isInstitutional) return true;
          if (unitCode && uUnit) return uUnit === unitCode;
          return true;
        }

        // Fleksibilitas padanan gelar Rektor
        if (
          (cleanTarget === 'rektor' && uJab.includes('rektor') && !uJab.includes('wakil')) ||
          (cleanTarget.includes('rektor') && !cleanTarget.includes('wakil') && uJab === 'rektor')
        ) {
          return true;
        }

        return false;
      });
    };
  }, [selectedStrukturUnit, allUsers]);

  // Penghitungan ringkasan okupansi (Terisi vs Lowong) pada lingkup terpilih
  const occupancyCounts = useMemo(() => {
    const list = scopeFilteredStrukturList;
    const filled = list.filter((item) => getPositionOccupants(item.nama_jabatan).length > 0).length;
    return {
      total: list.length,
      filled,
      vacant: list.length - filled
    };
  }, [scopeFilteredStrukturList, getPositionOccupants]);

  // Daftar jabatan final setelah difilter pencarian, lingkup, dan status okupansi
  const finalFilteredStrukturList = useMemo(() => {
    return scopeFilteredStrukturList.filter((item) => {
      // 0. Filter Pencarian Nama Jabatan
      if (strukturSearchQuery.trim()) {
        const q = strukturSearchQuery.toLowerCase().trim();
        const matchName = String(item.nama_jabatan || '').toLowerCase().includes(q);
        if (!matchName) return false;
      }

      // 1. Filter Kategori Peran
      const matchRole =
        strukturFilterRole === 'ALL' || item.kategori_peran === strukturFilterRole;
      if (!matchRole) return false;

      // 2. Filter Status Okupansi
      if (strukturFilterOccupancy === 'ALL') return true;
      const occupants = getPositionOccupants(item.nama_jabatan);
      if (strukturFilterOccupancy === 'FILLED') return occupants.length > 0;
      if (strukturFilterOccupancy === 'VACANT') return occupants.length === 0;
      return true;
    });
  }, [scopeFilteredStrukturList, strukturSearchQuery, strukturFilterRole, strukturFilterOccupancy, getPositionOccupants]);

  // Daftar Jurusan yang telah difilter pencarian pada Sub-Halaman Jurusan
  const filteredJurusanList = useMemo(() => {
    if (!selectedJurusanUnit) return [];
    const list = selectedJurusanUnit.jurusan || [];
    if (!jurusanSearchQuery.trim()) return list;
    const q = jurusanSearchQuery.toLowerCase().trim();
    return list.filter((j) => {
      const name = String(j.nama || '').toLowerCase();
      const code = String(j.kode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [selectedJurusanUnit, jurusanSearchQuery]);

  // Total jabatan resmi yang bernaung di bawah jurusan-jurusan unit ini
  const totalJurusanJabatanCount = useMemo(() => {
    if (!selectedJurusanUnit || !Array.isArray(selectedJurusanUnit.struktur_organisasi)) return 0;
    const jurusans = selectedJurusanUnit.jurusan || [];
    if (!jurusans.length) return 0;
    const jurusanNames = new Set(jurusans.map((j) => String(j.nama || '').toLowerCase()));
    return selectedJurusanUnit.struktur_organisasi.filter((s) => {
      const scope = resolveJabatanScope(s, jurusans);
      return scope !== 'FAKULTAS' && jurusanNames.has(String(scope || '').toLowerCase());
    }).length;
  }, [selectedJurusanUnit]);

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

  // Data unit kerja diperkaya dengan jumlah pegawai terdaftar & struktur organisasi reaktif
  const enrichedUnits = useMemo(() => {
    return units.map((unit) => {
      const unitCode = String(unit.kode_unit || '').trim().toUpperCase();

      // Pengguna aktif yang bertugas pada unit kerja ini
      const unitUsers = (allUsers || []).filter((u) => {
        if (!u || u.is_active === false || u.is_aktif === false || u.status_aktif === false) return false;
        const uKode = String(u.unit_kerja_id || u.kode_unit || u.id_unit || '').trim().toUpperCase();
        const uNama = String(u.unit || u.unitKerja || '').trim().toLowerCase();
        if (uKode && uKode === unitCode) return true;
        if (unit.nama_unit && uNama === unit.nama_unit.toLowerCase()) return true;
        if (unit.singkatan && uNama.includes(unit.singkatan.toLowerCase())) return true;
        return false;
      });
      const memberCount = unitUsers.length;

      // Ambil struktur organisasi aktif (kustom tersimpan atau fallback formasi SOTK resmi)
      const baseStruktur =
        Array.isArray(unit.struktur_organisasi) && unit.struktur_organisasi.length > 0
          ? unit.struktur_organisasi
          : getDefaultStrukturOrganisasi(unit.kode_unit, units);

      // Sinkronisasi otomatis jabatan aktif hasil CRUD Manajemen Pengguna
      const existingJabatanNames = new Set(
        baseStruktur.map((item) => String(item.nama_jabatan || '').trim().toLowerCase())
      );
      const syncedStruktur = [...baseStruktur];
      unitUsers.forEach((u) => {
        const userJab = String(u.jabatan || u.roleLabel || u.role_label || '').trim();
        if (userJab && !existingJabatanNames.has(userJab.toLowerCase())) {
          existingJabatanNames.add(userJab.toLowerCase());
          const isPimpinan =
            (u.role_slug || u.role || '').toLowerCase().includes('pimpinan') || u.is_pejabat === true;
          syncedStruktur.push({
            id: `sotk-auto-${u.id || Math.random().toString(36).slice(2, 6)}`,
            nama_jabatan: userJab,
            kategori_peran: isPimpinan ? 'pimpinan' : 'drafter',
            level_hirarki: isPimpinan ? 1 : 4,
            jurusan: u.jurusan || 'FAKULTAS'
          });
        }
      });

      // Hitung jumlah formasi jabatan yang terisi oleh pejabat petahana aktif
      const occupiedStrukturCount = syncedStruktur.filter((item) => {
        const cleanTarget = String(item.nama_jabatan || '').trim().toLowerCase();
        return (
          findPositionOccupant(item.nama_jabatan, allUsers, null, unit.kode_unit) !== null ||
          unitUsers.some((u) => String(u.jabatan || u.roleLabel || u.role_label || '').trim().toLowerCase() === cleanTarget)
        );
      }).length;

      const parentObj = units.find((p) => p.kode_unit === unit.parent_kode);

      return {
        ...unit,
        parent_name: parentObj ? parentObj.nama_unit : unit.parent_kode || 'Universitas Siliwangi',
        memberCount,
        struktur_organisasi: syncedStruktur,
        strukturCount: syncedStruktur.length,
        occupiedStrukturCount
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

  // Buka Sub-Halaman Kelola Jurusan & Program Studi
  const handleOpenJurusanModal = (unit) => {
    const enriched = enrichedUnits.find(
      (eu) => String(eu.kode_unit || '').toUpperCase() === String(unit.kode_unit || '').toUpperCase()
    );
    setSelectedJurusanUnit(enriched || unit);
    setSelectedStrukturUnit(null);
    setEditingJurusanId(null);
    setNewJurusanName('');
    setNewJurusanCode('');
    setJurusanError('');
    setJurusanSearchQuery('');
    setIsAddJurusanModalOpen(false);
  };

  // Buka Dialog Tambah Jurusan Baru
  const handleOpenAddJurusan = () => {
    setEditingJurusanId(null);
    setNewJurusanName('');
    setNewJurusanCode('');
    setJurusanError('');
    setIsAddJurusanModalOpen(true);
  };

  // Mulai Ubah Jurusan Terpilih
  const handleStartEditJurusan = (jurusan) => {
    setEditingJurusanId(jurusan.id || jurusan.kode || jurusan.nama);
    setNewJurusanName(jurusan.nama);
    setNewJurusanCode(jurusan.kode || '');
    setJurusanError('');
    setIsAddJurusanModalOpen(true);
  };

  // Batal Ubah Jurusan
  const handleCancelEditJurusan = () => {
    setEditingJurusanId(null);
    setNewJurusanName('');
    setNewJurusanCode('');
    setJurusanError('');
    setIsAddJurusanModalOpen(false);
  };

  // Simpan Jurusan (Tambah Baru atau Ubah yang Sedang Diedit)
  const handleSaveJurusan = async (e) => {
    e.preventDefault();
    setJurusanError('');
    if (!selectedJurusanUnit) return;

    const cleanNama = newJurusanName.trim();
    if (!cleanNama) {
      setJurusanError('Nama jurusan atau program studi wajib diisi.');
      return;
    }

    const currentJurusan = selectedJurusanUnit.jurusan || [];
    const isEditMode = Boolean(editingJurusanId);

    const duplicate = currentJurusan.some((j) => {
      const isSelf = isEditMode && (j.id === editingJurusanId || j.kode === editingJurusanId || j.nama === editingJurusanId);
      if (isSelf) return false;
      return j.nama.toLowerCase() === cleanNama.toLowerCase();
    });

    if (duplicate) {
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

    let updatedJurusanList = [];
    let oldJurusanName = '';

    if (isEditMode) {
      // Mode Ubah (Update)
      updatedJurusanList = currentJurusan.map((j) => {
        if (j.id === editingJurusanId || j.kode === editingJurusanId || j.nama === editingJurusanId) {
          oldJurusanName = j.nama;
          return {
            ...j,
            nama: cleanNama,
            kode: cleanKode
          };
        }
        return j;
      });
    } else {
      // Mode Tambah Baru (Create)
      const newJurusanItem = {
        id: `jur-${Date.now()}`,
        kode: cleanKode,
        nama: cleanNama
      };
      updatedJurusanList = [...currentJurusan, newJurusanItem];
    }

    // Jika sedang mengubah nama jurusan, sinkronkan juga nama jurusan pada jabatan struktur yang terhubung
    let updatedStruktur = selectedJurusanUnit.struktur_organisasi;
    if (isEditMode && oldJurusanName && oldJurusanName !== cleanNama && Array.isArray(updatedStruktur)) {
      updatedStruktur = updatedStruktur.map((item) => {
        if (item.jurusan === oldJurusanName) {
          return { ...item, jurusan: cleanNama };
        }
        return item;
      });
    }

    const updatedUnit = {
      ...selectedJurusanUnit,
      jurusan: updatedJurusanList,
      ...(updatedStruktur ? { struktur_organisasi: updatedStruktur } : {})
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
        {
          jurusan: updatedJurusanList,
          ...(updatedStruktur ? { struktur_organisasi: updatedStruktur } : {})
        },
        currentUser
      );
    } catch (err) {
      // Abaikan jika offline, penyimpanan lokal sudah diperbarui
    }

    setEditingJurusanId(null);
    setNewJurusanName('');
    setNewJurusanCode('');
    setIsAddJurusanModalOpen(false);

    if (isEditMode) {
      showToast?.(`Jurusan "${cleanNama}" berhasil diperbarui.`, 'success');
    } else {
      showToast?.(`Jurusan "${cleanNama}" berhasil ditambahkan ke ${selectedJurusanUnit.nama_unit}.`, 'success');
    }
  };

  // Hapus Jurusan dari Unit Kerja Terpilih
  const handleDeleteJurusan = async (jurusanId, jurusanNama) => {
    if (!selectedJurusanUnit) return;
    if (!window.confirm(`Hapus jurusan "${jurusanNama}" dari ${selectedJurusanUnit.nama_unit}?`)) {
      return;
    }

    if (editingJurusanId && (editingJurusanId === jurusanId || editingJurusanId === jurusanNama)) {
      handleCancelEditJurusan();
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

  // Buka Sub-Halaman Kelola Struktur Organisasi (Mendukung filter awal berdasarkan Jurusan & Status Okupansi)
  const handleOpenStrukturModal = (unit, initialScope = null) => {
    // Ambil struktur organisasi aktif yang telah disinkronkan dengan data akun Manajemen Pengguna
    const enriched = enrichedUnits.find(
      (eu) => String(eu.kode_unit || '').toUpperCase() === String(unit.kode_unit || '').toUpperCase()
    );
    const initialStruktur =
      enriched?.struktur_organisasi ||
      (Array.isArray(unit.struktur_organisasi) && unit.struktur_organisasi.length > 0
        ? unit.struktur_organisasi
        : getDefaultStrukturOrganisasi(unit.kode_unit, units));

    setSelectedStrukturUnit({
      ...unit,
      struktur_organisasi: initialStruktur
    });
    setSelectedJurusanUnit(null);
    setEditingStrukturId(null);

    const targetScope = initialScope || 'ALL';
    setStrukturFilterScope(targetScope);
    setStrukturFilterOccupancy('ALL');
    setStrukturFilterRole('ALL');
    setStrukturSearchQuery('');

    setStrukturForm({
      nama_jabatan: '',
      kategori_peran: operationalRoles[0]?.slug || 'pimpinan',
      level_hirarki: 1,
      jurusan: targetScope !== 'ALL' ? targetScope : 'FAKULTAS'
    });
    setStrukturError('');
    setIsAddStrukturModalOpen(false);
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
      setIsAddStrukturModalOpen(false);
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

      setIsAddStrukturModalOpen(false);
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
    setIsAddStrukturModalOpen(true);
  };

  // Batalkan Mode Edit
  const handleCancelEditStruktur = () => {
    setEditingStrukturId(null);
    setIsAddStrukturModalOpen(false);
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
      {/* ========================================================================= */}
      {/* TINGKAT 1: TABEL UNIT KERJA RESMI                                        */}
      {/* ========================================================================= */}
      {!selectedStrukturUnit && !selectedJurusanUnit && (
        <div className="space-y-5 animate-in fade-in duration-150">
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
                          <span>Struktur Organisasi</span>
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
      {/* Akhir Konten Tingkat 1 */}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-HALAMAN: KELOLA JURUSAN & PROGRAM STUDI                               */}
      {/* (Tampilan Sederhana, Bersih, Luas, dan Sangat Mudah Dipahami)             */}
      {/* ========================================================================= */}
      {selectedJurusanUnit && !selectedStrukturUnit && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Bar Navigasi Balik & Judul Unit */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedJurusanUnit(null);
                  setJurusanSearchQuery('');
                  setEditingJurusanId(null);
                  setIsAddJurusanModalOpen(false);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl hover:bg-unsil-green-50 hover:text-unsil-green-900 hover:border-unsil-green-700 transition cursor-pointer shadow-2xs w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Unit Kerja</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddJurusan}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-unsil-green-900 hover:bg-unsil-green-950 rounded-xl transition cursor-pointer shadow-xs active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jurusan Baru</span>
              </button>
            </div>

            {/* Identitas Unit Kerja */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-unsil-green-950 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs border border-slate-200">
                    {selectedJurusanUnit.kode_unit}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {selectedJurusanUnit.nama_unit}
                  </h2>
                  {selectedJurusanUnit.singkatan && (
                    <span className="text-xs font-bold text-slate-500">
                      ({selectedJurusanUnit.singkatan})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar seluruh jurusan dan program studi resmi yang bernaung di bawah unit kerja ini.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedJurusanUnit.tipe_unit || 'Fakultas'}
                </span>
              </div>
            </div>
          </div>

          {/* 2 Kartu Ringkasan Sederhana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Program Studi / Jurusan</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{selectedJurusanUnit.jurusan?.length || 0}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Jurusan aktif terdaftar</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-unsil-green-900 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-unsil-green-800" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Jabatan di Jurusan</p>
                <p className="text-2xl font-black text-blue-700 mt-0.5">{totalJurusanJabatanCount}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5">Ketua jurusan, sekretaris &amp; dosen</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Bar Kontrol Pencarian Sederhana */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={jurusanSearchQuery}
                onChange={(e) => setJurusanSearchQuery(e.target.value)}
                placeholder="Cari nama jurusan atau kode singkatan..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
              />
              {jurusanSearchQuery && (
                <button
                  type="button"
                  onClick={() => setJurusanSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabel Jurusan Rapi, Luas, dan Nyaman Dibaca */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <span className="font-bold text-xs text-slate-700">
                Total {filteredJurusanList.length} Jurusan / Program Studi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[260px]">Nama Jurusan / Program Studi</th>
                    <th className="py-3 px-4 min-w-[130px]">Kode Singkatan</th>
                    <th className="py-3 px-4 min-w-[200px]">Struktur Jabatan</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJurusanList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada jurusan atau program studi.</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Silakan klik &ldquo;Tambah Jurusan Baru&rdquo; untuk menambahkan program studi.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredJurusanList.map((j, idx) => {
                      const jabatanCount = (selectedJurusanUnit.struktur_organisasi || []).filter(
                        (s) => s.jurusan === j.nama || resolveJabatanScope(s, selectedJurusanUnit.jurusan) === j.nama
                      ).length;

                      return (
                        <tr key={j.id || j.kode || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-unsil-green-900 flex items-center justify-center shrink-0">
                                <BookOpen className="w-3.5 h-3.5 text-unsil-green-800" />
                              </div>
                              <span className="font-bold text-slate-900 text-xs">
                                {j.nama}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-unsil-green-950 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {j.kode || '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenStrukturModal(selectedJurusanUnit, j.nama)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                              title={`Buka dan kelola struktur jabatan untuk Jurusan ${j.nama}`}
                            >
                              <Network className="w-3.5 h-3.5 text-blue-600" />
                              <span>Kelola Jabatan ({jabatanCount})</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditJurusan(j)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-unsil-green-900 hover:bg-emerald-50 transition cursor-pointer"
                                title="Ubah Nama & Kode Jurusan"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteJurusan(j.id, j.nama)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Jurusan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM TAMBAH / UBAH JURUSAN (FOKUS, BERSIH, RAMAH PEMULA)            */}
      {/* ========================================================================= */}
      {isAddJurusanModalOpen && selectedJurusanUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-unsil-green-900 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-unsil-green-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingJurusanId ? 'Ubah Data Jurusan / Prodi' : 'Tambah Jurusan / Prodi Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedJurusanUnit.nama_unit} ({selectedJurusanUnit.singkatan || selectedJurusanUnit.kode_unit})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditJurusan}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveJurusan} className="p-5 space-y-3.5">
              {jurusanError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{jurusanError}</span>
                </div>
              )}

              {/* Nama Jurusan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Jurusan / Program Studi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newJurusanName}
                  onChange={(e) => setNewJurusanName(e.target.value)}
                  placeholder="contoh: Pendidikan Matematika"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                  required
                  autoFocus
                />
              </div>

              {/* Kode Singkatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Singkatan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={newJurusanCode}
                  onChange={(e) => setNewJurusanCode(e.target.value.toUpperCase())}
                  placeholder="contoh: PMTK"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Jika dikosongkan, kode singkatan akan otomatis dibentuk dari huruf awal nama jurusan.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelEditJurusan}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-unsil-green-900 hover:bg-unsil-green-950 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingJurusanId ? 'Simpan Perubahan' : 'Tambahkan Jurusan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TINGKAT 2 (SUB-HALAMAN): STRUKTUR JABATAN UNIT RESMI                      */}
      {/* (Tampilan Sederhana, Bersih, Luas, dan Sangat Mudah Dipahami)             */}
      {/* ========================================================================= */}
      {selectedStrukturUnit && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Bar Navigasi Balik & Judul Unit */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedStrukturUnit(null);
                  setStrukturSearchQuery('');
                  setStrukturFilterOccupancy('ALL');
                  setStrukturFilterScope('ALL');
                  setStrukturFilterRole('ALL');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl hover:bg-unsil-green-50 hover:text-unsil-green-900 hover:border-unsil-green-700 transition cursor-pointer shadow-2xs w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Unit Kerja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingStrukturId(null);
                  setStrukturForm({
                    nama_jabatan: '',
                    kategori_peran: operationalRoles[0]?.slug || 'pimpinan',
                    level_hirarki: 1,
                    jurusan: strukturFilterScope !== 'ALL' ? strukturFilterScope : 'FAKULTAS'
                  });
                  setStrukturError('');
                  setIsAddStrukturModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-unsil-green-900 hover:bg-unsil-green-950 rounded-xl transition cursor-pointer shadow-xs active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jabatan Baru</span>
              </button>
            </div>

            {/* Identitas Unit Kerja */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-unsil-green-950 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs border border-slate-200">
                    {selectedStrukturUnit.kode_unit}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {selectedStrukturUnit.nama_unit}
                  </h2>
                  {selectedStrukturUnit.singkatan && (
                    <span className="text-xs font-bold text-slate-500">
                      ({selectedStrukturUnit.singkatan})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar seluruh formasi jabatan resmi di unit ini dan pegawai yang menempatinya.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    selectedStrukturUnit.tipe_unit === 'FAKULTAS' || selectedStrukturUnit.tipe_unit === 'PASCASARJANA'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : selectedStrukturUnit.tipe_unit === 'BIRO'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : selectedStrukturUnit.tipe_unit === 'LEMBAGA' || selectedStrukturUnit.tipe_unit === 'UPA'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}
                >
                  {selectedStrukturUnit.tipe_unit === 'ORGAN' || selectedStrukturUnit.tipe_unit === 'UNIVERSITAS'
                    ? 'Pimpinan'
                    : selectedStrukturUnit.tipe_unit}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Kartu Ringkasan Sederhana (Mudah Dipahami Siapapun) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Formasi Jabatan</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{occupancyCounts.total}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Jabatan terdaftar di unit ini</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Jabatan Sudah Terisi</p>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">{occupancyCounts.filled}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Sudah ada pejabat aktif</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Jabatan Masih Kosong</p>
                <p className="text-2xl font-black text-amber-700 mt-0.5">{occupancyCounts.vacant}</p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">Belum ditugaskan pejabat</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Bar Kontrol Pencarian & Filter Sederhana */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Kolom Pencarian Jabatan */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={strukturSearchQuery}
                  onChange={(e) => setStrukturSearchQuery(e.target.value)}
                  placeholder="Cari nama jabatan..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800 transition"
                />
                {strukturSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStrukturSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Status Keterisian Sederhana */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setStrukturFilterOccupancy('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    strukturFilterOccupancy === 'ALL'
                      ? 'bg-unsil-green-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({occupancyCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setStrukturFilterOccupancy('FILLED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    strukturFilterOccupancy === 'FILLED'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terisi ({occupancyCounts.filled})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrukturFilterOccupancy('VACANT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    strukturFilterOccupancy === 'VACANT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <span>Kosong ({occupancyCounts.vacant})</span>
                </button>
              </div>
            </div>

            {/* Pilihan Jurusan / Bagian (Hanya muncul jika unit memiliki jurusan seperti Fakultas) */}
            {selectedUnitJurusanList.length > 0 && (
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Bagian:
                </span>
                <button
                  type="button"
                  onClick={() => setStrukturFilterScope('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    strukturFilterScope === 'ALL'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Bagian ({scopeCounts.ALL || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setStrukturFilterScope('FAKULTAS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    strukturFilterScope === 'FAKULTAS'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tingkat Dekanat ({scopeCounts.FAKULTAS || 0})
                </button>
                <select
                  value={
                    strukturFilterScope !== 'ALL' && strukturFilterScope !== 'FAKULTAS'
                      ? strukturFilterScope
                      : ''
                  }
                  onChange={(e) => {
                    const chosen = e.target.value;
                    if (chosen) setStrukturFilterScope(chosen);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 cursor-pointer"
                >
                  <option value="">Pilih Jurusan...</option>
                  {selectedUnitJurusanList.map((j) => (
                    <option key={j.id || j.kode || j.nama} value={j.nama}>
                      Jurusan {j.nama} ({scopeCounts[j.nama] || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabel Jabatan Rapi, Luas, dan Nyaman Dibaca */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <span className="font-bold text-xs text-slate-700">
                Total {finalFilteredStrukturList.length} Posisi Jabatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[240px]">Nama Jabatan</th>
                    <th className="py-3 px-4 min-w-[140px]">Peran / Tugas</th>
                    <th className="py-3 px-4 min-w-[100px]">Tingkat</th>
                    <th className="py-3 px-4 min-w-[260px]">Pejabat Saat Ini</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finalFilteredStrukturList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Briefcase className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada posisi jabatan ditemukan.</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sesuaikan kata kunci pencarian atau klik &ldquo;Tambah Jabatan Baru&rdquo;.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    finalFilteredStrukturList.map((item, idx) => {
                      const occupants = getPositionOccupants(item.nama_jabatan);
                      const isFilled = occupants.length > 0;
                      const itemScope = resolveJabatanScope(item, selectedUnitJurusanList);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {item.nama_jabatan}
                            </div>
                            {selectedUnitJurusanList.length > 0 && (
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2 py-0.2 rounded-md text-[10px] font-bold border ${
                                  itemScope !== 'FAKULTAS'
                                    ? 'bg-emerald-50 text-unsil-green-900 border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}>
                                  {itemScope !== 'FAKULTAS' ? `Jurusan ${itemScope}` : 'Tingkat Dekanat'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getRoleBadgeStyle(item.kategori_peran)}`}>
                              {getRoleLabel(item.kategori_peran)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            Level {item.level_hirarki || 1}
                          </td>
                          <td className="py-3.5 px-4">
                            {isFilled ? (
                              <div className="space-y-1">
                                {occupants.map((occ, oIdx) => (
                                  <div key={occ.id || oIdx} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-xs truncate">
                                        {occ.name || occ.nama_lengkap}
                                      </p>
                                      {occ.nip && (
                                        <p className="text-[10.5px] text-slate-400">NIP: {occ.nip}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Belum ada pejabat
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleStartEditStruktur(item);
                                  setIsAddStrukturModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                                title="Ubah Jabatan Ini"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStrukturItem(item.id, item.nama_jabatan)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Jabatan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM TAMBAH / UBAH JABATAN (FOKUS, BERSIH, RAMAH PEMULA)          */}
      {/* ========================================================================= */}
      {isAddStrukturModalOpen && selectedStrukturUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingStrukturId ? 'Ubah Posisi Jabatan' : 'Tambah Posisi Jabatan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStrukturUnit.nama_unit} ({selectedStrukturUnit.singkatan || selectedStrukturUnit.kode_unit})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditStruktur}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveStrukturItem} className="p-5 space-y-3.5">
              {strukturError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{strukturError}</span>
                </div>
              )}

              {/* Nama Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Jabatan Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={strukturForm.nama_jabatan}
                  onChange={(e) => setStrukturForm({ ...strukturForm, nama_jabatan: e.target.value })}
                  placeholder="contoh: Dekan, Kepala Bagian TU, Sekretaris..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition"
                  required
                  autoFocus
                />
              </div>

              {/* Lingkup Bagian (jika ada jurusan) */}
              {selectedUnitJurusanList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bagian / Penempatan Jabatan
                  </label>
                  <select
                    value={strukturForm.jurusan || 'FAKULTAS'}
                    onChange={(e) => setStrukturForm({ ...strukturForm, jurusan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition cursor-pointer"
                  >
                    <option value="FAKULTAS">Tingkat Fakultas / Dekanat</option>
                    {selectedUnitJurusanList.map((j) => (
                      <option key={j.id || j.kode || j.nama} value={j.nama}>
                        Jurusan {j.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jenis / Peran Akun */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis / Tugas Jabatan
                </label>
                <select
                  value={strukturForm.kategori_peran}
                  onChange={handleRoleCategoryChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition cursor-pointer"
                >
                  {operationalRoles.map((role) => (
                    <option key={role.slug} value={role.slug}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tingkat / Level Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tingkat Jabatan
                </label>
                <select
                  value={strukturForm.level_hirarki}
                  onChange={(e) => setStrukturForm({ ...strukturForm, level_hirarki: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition cursor-pointer"
                >
                  <option value={1}>Level 1 (Pimpinan Utama — Dekan, Direktur, Ka. Biro)</option>
                  <option value={2}>Level 2 (Wakil Pimpinan — Wakil Dekan, Kabag)</option>
                  <option value={3}>Level 3 (Pimpinan Unit / Ketua Jurusan / Kasubag)</option>
                  <option value={4}>Level 4 (Staf / Pelaksana / Dosen)</option>
                </select>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelEditStruktur}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-unsil-green-900 hover:bg-unsil-green-950 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingStrukturId ? 'Simpan Perubahan' : 'Tambah Jabatan'}</span>
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
