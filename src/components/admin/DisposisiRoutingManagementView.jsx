import React, { useState, useEffect, useMemo } from 'react';
import {
  Network,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Building2,
  UserCheck,
  UserX,
  X,
  Check,
  Info,
  ShieldAlert,
  Shield,
  ArrowLeft,
  SlidersHorizontal,
  ChevronRight,
  Users
} from 'lucide-react';
import { isSuperAdminUser } from '../../utils/authGuards';
import {
  getRoutingMatrix,
  saveRoutingMatrix,
  resetRoutingMatrix,
  toggleTargetStatus,
  addTargetToSender,
  updateTargetInSender,
  removeTargetFromSender,
  resetSenderTargets,
  getUnitOfficialPositions,
  resolveOfficialOccupant,
  DISPOSISI_ROUTING_CHANGE_EVENT
} from '../../services/disposisiRoutingService';
import { getRolesCatalog, RBAC_CHANGE_EVENT } from '../../utils/rbacSyncService';
import { sortUnitsByOtk } from '../../utils/unitKerjaHelper';
import { isOfficialUserAccount } from '../../utils/pejabatHelper';

const KATEGORI_TABS = [
  { id: 'ALL', label: 'Semua' },
  { id: 'ORGAN', label: 'Pimpinan' },
  { id: 'FAKULTAS', label: 'Fakultas' },
  { id: 'BIRO', label: 'Biro' },
  { id: 'LEMBAGA_UPA', label: 'Lembaga & UPA' }
];

export const DisposisiRoutingManagementView = ({
  currentUser,
  allUsers = [],
  allUnits = [],
  showToast = () => {}
}) => {
  const isSuperAdmin = isSuperAdminUser(currentUser);

  // State Routing Matrix
  const [matrix, setMatrix] = useState(() => getRoutingMatrix());

  // Tingkat Navigasi:
  // selectedUnit: null = TINGKAT 1 (Tabel Daftar Unit Kerja)
  // selectedUnit: object = TINGKAT 2 (Daftar Pejabat di Unit Tersebut)
  const [selectedUnit, setSelectedUnit] = useState(null);

  // selectedPosition: null = Tutup Modal CRUD
  // selectedPosition: object = TINGKAT 3 (Modal CRUD Target Disposisi Pejabat)
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Filter & Pencarian
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [unitCategoryFilter, setUnitCategoryFilter] = useState('ALL');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');

  // Sinkronisasi Katalog Peran dari Manajemen Peran (RBAC)
  const [rolesCatalog, setRolesCatalog] = useState(() => getRolesCatalog());
  useEffect(() => {
    const handleRbacSync = () => {
      setRolesCatalog(getRolesCatalog());
    };
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbacSync);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbacSync);
  }, []);

  // State Modal CRUD Target Disposisi (Tambah & Ubah)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetModalMode, setTargetModalMode] = useState('create'); // 'create' | 'edit'
  const [editingTargetId, setEditingTargetId] = useState(null);

  // Field Form Target (Terhubung ke Manajemen User, Peran, & Unit)
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRoleKey, setTargetRoleKey] = useState('');
  const [targetUnitCode, setTargetUnitCode] = useState('');
  const [targetNama, setTargetNama] = useState('');
  const [targetBadge, setTargetBadge] = useState('');
  const [targetCluster, setTargetCluster] = useState('Unit Penunjang Akademik (UPA)');
  const [targetTupoksi, setTargetTupoksi] = useState('');

  // Modal Konfirmasi Reset
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sinkronisasi Reaktif
  useEffect(() => {
    const handleSync = () => {
      setMatrix(getRoutingMatrix());
    };
    window.addEventListener(DISPOSISI_ROUTING_CHANGE_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DISPOSISI_ROUTING_CHANGE_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Daftar Unit Kerja yang Diurutkan Sesuai SOTK UNSIL
  const sortedUnits = useMemo(() => {
    if (!Array.isArray(allUnits) || allUnits.length === 0) return [];
    return sortUnitsByOtk(allUnits);
  }, [allUnits]);

  // Unit Kerja yang Difilter di Tingkat 1
  const filteredUnits = useMemo(() => {
    return sortedUnits.filter((unit) => {
      if (!unit) return false;
      const uTipe = String(unit.tipe_unit || unit.kategori || '').toUpperCase();
      const matchCategory =
        unitCategoryFilter === 'ALL' ||
        (unitCategoryFilter === 'FAKULTAS' && (uTipe === 'FAKULTAS' || uTipe === 'PASCASARJANA')) ||
        (unitCategoryFilter === 'BIRO' && uTipe === 'BIRO') ||
        (unitCategoryFilter === 'LEMBAGA_UPA' && (uTipe === 'LEMBAGA' || uTipe === 'UPA')) ||
        (unitCategoryFilter === 'ORGAN' && ['UNIVERSITAS', 'ORGAN'].includes(uTipe));

      if (!matchCategory) return false;

      if (!unitSearchQuery.trim()) return true;
      const q = unitSearchQuery.toLowerCase().trim();
      return (
        unit.nama_unit?.toLowerCase().includes(q) ||
        unit.kode_unit?.toLowerCase().includes(q) ||
        unit.singkatan?.toLowerCase().includes(q)
      );
    });
  }, [sortedUnits, unitSearchQuery, unitCategoryFilter]);

  // Pejabat di Unit Terpilih (Tingkat 2) - Menampilkan seluruh formasi jabatan struktural resmi sesuai SOTK / Tata Naskah Dinas,
  // dengan pemangku aktif yang tersinkronisasi secara real-time dari Manajemen Pengguna
  const unitPositions = useMemo(() => {
    if (!selectedUnit) return [];
    return getUnitOfficialPositions(selectedUnit, allUsers, false);
  }, [selectedUnit, allUsers, matrix]);

  // Jumlah jabatan resmi yang telah memiliki pejabat aktif
  const occupiedPositionsCount = useMemo(() => {
    return unitPositions.filter((p) => Boolean(p.occupant)).length;
  }, [unitPositions]);

  // Sinkronisasi real-time selectedPosition dengan data terbaru dari unitPositions (Manajemen Pengguna & Unit Kerja)
  const currentPosition = useMemo(() => {
    if (!selectedPosition) return null;
    return (
      unitPositions.find(
        (p) => p.id === selectedPosition.id || p.senderKey === selectedPosition.senderKey
      ) || selectedPosition
    );
  }, [selectedPosition, unitPositions]);

  // Target Disposisi Pejabat Terpilih (Tingkat 3)
  const currentOfficialTargets = useMemo(() => {
    if (!selectedPosition) return [];
    const list = matrix[selectedPosition.senderKey];
    if (Array.isArray(list)) return list;
    const fallbackList = matrix[selectedPosition.fallbackKey];
    if (Array.isArray(fallbackList)) return fallbackList;
    return selectedPosition.targets || [];
  }, [selectedPosition, matrix]);

  // Target yang Difilter di Modal CRUD (Tingkat 3)
  const filteredOfficialTargets = useMemo(() => {
    if (!targetSearchQuery.trim()) return currentOfficialTargets;
    const q = targetSearchQuery.toLowerCase().trim();
    return currentOfficialTargets.filter(
      (t) =>
        t.nama?.toLowerCase().includes(q) ||
        t.badge?.toLowerCase().includes(q) ||
        t.cluster?.toLowerCase().includes(q) ||
        t.unit_id?.toLowerCase().includes(q)
    );
  }, [currentOfficialTargets, targetSearchQuery]);

  // Hitung jumlah pegawai di unit kerja
  const getUnitUserCount = (unitCode) => {
    if (!Array.isArray(allUsers) || allUsers.length === 0 || !unitCode) return 0;
    const clean = String(unitCode).toUpperCase().trim();
    return allUsers.filter((u) => {
      const uUnit = String(u.unit_kerja_id || u.kode_unit || '').toUpperCase().trim();
      return uUnit === clean && u.is_active !== false;
    }).length;
  };

  // Helper mencari pemangku jabatan aktif target (Mendukung rujukan langsung target.userId)
  const resolveTargetOccupant = (target) => {
    if (!Array.isArray(allUsers) || allUsers.length === 0 || !target) return null;
    return resolveOfficialOccupant(target.nama, allUsers, target.unit_id, target.userId);
  };

  // Helper badge peran resmi pejabat
  const getOfficialRoleBadge = (u) => {
    const roleSlug = String(u.role_slug || '').toLowerCase();
    const roleUpper = String(u.role || '').toUpperCase();
    if (roleSlug === 'pimpinan' || roleUpper === 'PIMPINAN') return 'Pimpinan';
    if (roleSlug === 'penandatangan' || roleUpper === 'PENANDATANGAN') return 'Penandatangan';
    if (u.is_pejabat || roleUpper === 'PEJABAT') return 'Pejabat';
    return 'Pimpinan';
  };

  // Daftar Akun Pejabat/Pimpinan/Penandatangan Sah (Eksklusif Pejabat Sesuai Regulasi Tata Naskah Dinas)
  const sortedUsersForSelect = useMemo(() => {
    if (!Array.isArray(allUsers) || allUsers.length === 0) return [];
    return allUsers
      .filter((u) => u && u.is_active !== false && isOfficialUserAccount(u))
      .sort((a, b) => {
        const aRole = (a.role_slug || a.role || '').toLowerCase();
        const bRole = (b.role_slug || b.role || '').toLowerCase();
        const aIsPimpinan = aRole.includes('pimpinan') || aRole.includes('penandatangan') ? 1 : 0;
        const bIsPimpinan = bRole.includes('pimpinan') || bRole.includes('penandatangan') ? 1 : 0;
        if (bIsPimpinan !== aIsPimpinan) return bIsPimpinan - aIsPimpinan;
        return (a.nama_lengkap || a.name || '').localeCompare(b.nama_lengkap || b.name || '');
      });
  }, [allUsers]);

  // Handler: Toggle Aktif/Nonaktif
  const handleToggle = (targetId, currentStatus) => {
    if (!selectedPosition) return;
    const updated = toggleTargetStatus(
      selectedPosition.senderKey,
      targetId,
      selectedPosition.fallbackKey
    );
    setMatrix((prev) => ({ ...prev, [selectedPosition.senderKey]: updated }));
    showToast(
      currentStatus
        ? 'Target disposisi dinonaktifkan sementara.'
        : 'Target disposisi berhasil diaktifkan kembali.',
      'info'
    );
  };

  // Handler CRUD: Buka Modal Tambah Target Baru (Create)
  const openCreateModal = () => {
    setTargetModalMode('create');
    setEditingTargetId(null);
    setTargetUserId('');
    setTargetRoleKey('');
    setTargetUnitCode('');
    setTargetNama('');
    setTargetBadge('');
    setTargetCluster('Unit Penunjang Akademik (UPA)');
    setTargetTupoksi('');
    setIsTargetModalOpen(true);
  };

  // Handler CRUD: Buka Modal Ubah Target (Update)
  const openEditModal = (target) => {
    setTargetModalMode('edit');
    setEditingTargetId(target.id);
    const occupant = resolveTargetOccupant(target);
    const initialUserId = target.userId || (occupant ? (occupant.id || occupant.nip || occupant.username) : '');
    setTargetUserId(initialUserId ? String(initialUserId) : '');
    setTargetRoleKey(target.roleKey || '');
    setTargetUnitCode(target.unit_id || '');
    setTargetNama(target.nama || '');
    setTargetBadge(target.badge || 'Unit');
    setTargetCluster(target.cluster || 'Target Tambahan');
    setTargetTupoksi(target.deskripsi || '');
    setIsTargetModalOpen(true);
  };

  // Handler CRUD: Hapus Target dari Alur Pejabat (Delete)
  const handleDeleteTarget = (targetId, targetNama, isCustom) => {
    if (!selectedPosition) return;
    const confirmMessage = isCustom
      ? `Hapus target kustom "${targetNama}" dari daftar disposisi ${selectedPosition.nama_jabatan}?`
      : `Hapus target "${targetNama}" dari daftar disposisi ${selectedPosition.nama_jabatan}?\n(Target standar dapat dipulihkan sewaktu-waktu melalui tombol "Reset Standar")`;

    if (window.confirm(confirmMessage)) {
      const updated = removeTargetFromSender(
        selectedPosition.senderKey,
        targetId,
        selectedPosition.fallbackKey
      );
      setMatrix((prev) => ({ ...prev, [selectedPosition.senderKey]: updated }));
      showToast(`Target "${targetNama}" berhasil dihapus dari alur disposisi.`, 'success');
    }
  };

  // Handler: Reset Pejabat Terpilih ke Standar SOTK
  const handleResetCurrentPosition = () => {
    if (!selectedPosition) return;
    const resetList = resetSenderTargets(selectedPosition.senderKey, selectedPosition.fallbackKey);
    setMatrix((prev) => ({ ...prev, [selectedPosition.senderKey]: resetList }));
    setIsResetConfirmOpen(false);
    showToast(`Alur disposisi ${selectedPosition.nama_jabatan} dikembalikan ke standar universitas.`, 'success');
  };

  // Otomasi Form saat Akun Pengguna (Manajemen Pengguna) dipilih
  const handleUserAccountSelect = (userId) => {
    setTargetUserId(userId);
    if (!userId) return;

    const matchedUser = allUsers.find(
      (u) =>
        String(u.id || '').toLowerCase() === String(userId).toLowerCase() ||
        (u.nip && String(u.nip) === String(userId))
    );

    if (matchedUser) {
      // 1. Sinkronisasi Unit Kerja
      const uCode = matchedUser.unit_kerja_id || matchedUser.kode_unit;
      if (uCode) {
        setTargetUnitCode(uCode);
        const uObj = allUnits.find((u) => (u.kode_unit || u.id) === uCode);
        if (uObj?.singkatan) {
          setTargetBadge(uObj.singkatan);
        }
      }

      // 2. Sinkronisasi Peran (Role)
      if (matchedUser.role_slug || matchedUser.role) {
        setTargetRoleKey(matchedUser.role_slug || matchedUser.role);
      }

      // 3. Rekomendasi Nama Jabatan Target
      const suggestedNama =
        matchedUser.jabatan ||
        matchedUser.roleLabel ||
        matchedUser.sotk_position_label ||
        matchedUser.nama_lengkap;
      if (suggestedNama && targetModalMode === 'create') {
        setTargetNama(suggestedNama);
      }

      // 4. Tupoksi
      if (!targetTupoksi) {
        setTargetTupoksi(`Pelaksana tugas dan penugasan kedinasan (${matchedUser.nama_lengkap})`);
      }
    }
  };

  // Otomasi Form saat Peran Institusi (Manajemen Peran) dipilih
  const handleRoleSelect = (roleKey) => {
    setTargetRoleKey(roleKey);
    if (!roleKey) return;

    const matchedRole = rolesCatalog.find((r) => (r.slug || r.id) === roleKey);
    if (matchedRole) {
      if (targetModalMode === 'create' && !targetNama) {
        setTargetNama(matchedRole.name);
      }

      // Klaster rekomendasi dari peran
      const rSlug = String(matchedRole.slug || matchedRole.id || '').toLowerCase();
      if (rSlug.includes('rektor') || rSlug.includes('pimpinan')) {
        setTargetCluster('Pimpinan Lembaga');
      } else if (rSlug.includes('dekan')) {
        setTargetCluster('Pimpinan Fakultas & Pascasarjana');
      } else if (rSlug.includes('biro')) {
        setTargetCluster('Pelaksana Administrasi & Biro');
      }
    }
  };

  // Otomasi Form saat Unit Kerja dipilih
  const handleUnitSelectInModal = (unitCode) => {
    setTargetUnitCode(unitCode);
    if (!unitCode) return;

    const u = allUnits.find((item) => (item.kode_unit || item.id) === unitCode);
    if (u) {
      const tipe = String(u.tipe_unit || u.kategori || '').toUpperCase();
      let defaultCluster = 'Unit Penunjang Akademik (UPA)';
      let defaultNama = `Kepala ${u.nama_unit}`;

      if (tipe === 'FAKULTAS') {
        defaultCluster = 'Pimpinan Fakultas & Pascasarjana';
        defaultNama = `Dekan ${u.singkatan || u.nama_unit}`;
      } else if (tipe === 'PASCASARJANA') {
        defaultCluster = 'Pimpinan Fakultas & Pascasarjana';
        defaultNama = `Direktur ${u.nama_unit}`;
      } else if (tipe === 'BIRO') {
        defaultCluster = 'Pelaksana Administrasi & Biro';
        defaultNama = `Kepala ${u.nama_unit}`;
      } else if (tipe === 'LEMBAGA') {
        defaultCluster = 'Pimpinan Lembaga';
        defaultNama = `Ketua ${u.nama_unit}`;
      } else if (tipe === 'UPA') {
        defaultCluster = 'Pimpinan Unit Penunjang Akademik (UPA)';
        defaultNama = `Kepala ${u.nama_unit}`;
      }

      if (
        targetModalMode === 'create' &&
        (!targetNama || targetNama.startsWith('Kepala ') || targetNama.startsWith('Dekan '))
      ) {
        setTargetNama(defaultNama);
      }
      setTargetBadge(u.singkatan || 'Unit');
      setTargetCluster(defaultCluster);
      if (!targetTupoksi) {
        setTargetTupoksi(`Pelaksana kegiatan dinas ${u.nama_unit}`);
      }

      // Jika akun pejabat belum dipilih, otomatis rekomendasikan pejabat aktif di unit ini jika ada
      if (!targetUserId && targetModalMode === 'create') {
        const unitIncumbent = allUsers.find(
          (usr) =>
            usr &&
            usr.is_active !== false &&
            String(usr.unit_kerja_id || usr.kode_unit || '').toUpperCase() === String(unitCode).toUpperCase() &&
            isOfficialUserAccount(usr)
        );
        if (unitIncumbent) {
          setTargetUserId(unitIncumbent.id || unitIncumbent.nip || unitIncumbent.username);
        }
      }
    }
  };

  // Data akun pejabat yang sedang dipilih di modal
  const selectedOfficial = useMemo(() => {
    if (!targetUserId) return null;
    return allUsers.find(
      (u) =>
        String(u.id || '').toLowerCase() === String(targetUserId).toLowerCase() ||
        (u.nip && String(u.nip) === String(targetUserId)) ||
        (u.username && String(u.username).toLowerCase() === String(targetUserId).toLowerCase())
    );
  }, [targetUserId, allUsers]);

  const selectedOfficialUnit = useMemo(() => {
    if (!selectedOfficial) return null;
    const uCode = selectedOfficial.unit_kerja_id || selectedOfficial.kode_unit;
    return allUnits.find((u) => (u.kode_unit || u.id) === uCode) || null;
  }, [selectedOfficial, allUnits]);

  const selectedOfficialRole = useMemo(() => {
    if (!selectedOfficial) return null;
    const rKey = selectedOfficial.role_slug || selectedOfficial.role;
    return rolesCatalog.find((r) => (r.slug || r.id) === rKey) || null;
  }, [selectedOfficial, rolesCatalog]);

  // Himpunan akun pejabat yang sudah terdaftar di alur posisi saat ini (Mencegah duplikasi target)
  const assignedOfficialsMap = useMemo(() => {
    const map = new Map();
    if (!currentPosition) return map;

    // 1. Pejabat Pengirim (tidak boleh mendisposisikan ke diri sendiri)
    if (currentPosition.occupant) {
      const occ = currentPosition.occupant;
      const meta = {
        reason: 'Pejabat Pengirim',
        label: `Pengirim: ${currentPosition.nama_jabatan}`
      };
      if (occ.id) map.set(String(occ.id).toLowerCase(), meta);
      if (occ.nip) map.set(String(occ.nip).toLowerCase(), meta);
      if (occ.username) map.set(String(occ.username).toLowerCase(), meta);
    }

    // 2. Daftar Penerima yang sudah ada pada alur posisi ini
    currentOfficialTargets.forEach((target) => {
      // Jika dalam mode edit, lewati target yang sedang diedit
      if (targetModalMode === 'edit' && target.id === editingTargetId) {
        return;
      }

      const meta = {
        reason: 'Sudah Terdaftar',
        label: `Tujuan: ${target.nama}`
      };

      if (target.userId) {
        map.set(String(target.userId).toLowerCase(), meta);
      }
      const occ = resolveTargetOccupant(target);
      if (occ) {
        if (occ.id) map.set(String(occ.id).toLowerCase(), meta);
        if (occ.nip) map.set(String(occ.nip).toLowerCase(), meta);
        if (occ.username) map.set(String(occ.username).toLowerCase(), meta);
      }
    });

    return map;
  }, [currentPosition, currentOfficialTargets, targetModalMode, editingTargetId, allUsers]);

  // Helper memeriksa status keterdaftaran akun pejabat
  const getOfficialAssignedStatus = (u) => {
    if (!u) return null;
    const uid = u.id ? String(u.id).toLowerCase() : null;
    const nip = u.nip ? String(u.nip).toLowerCase() : null;
    const username = u.username ? String(u.username).toLowerCase() : null;

    if (uid && assignedOfficialsMap.has(uid)) return assignedOfficialsMap.get(uid);
    if (nip && assignedOfficialsMap.has(nip)) return assignedOfficialsMap.get(nip);
    if (username && assignedOfficialsMap.has(username)) return assignedOfficialsMap.get(username);
    return null;
  };

  const selectedOfficialStatus = useMemo(() => {
    return getOfficialAssignedStatus(selectedOfficial);
  }, [selectedOfficial, assignedOfficialsMap]);

  // Handler CRUD: Simpan Target (1 Komando dengan Data Manajemen User & Peran)
  const handleSaveTarget = (e) => {
    e.preventDefault();
    if (!selectedPosition) return;
    if (!targetUserId || !selectedOfficial) {
      showToast('Silakan pilih pejabat terlebih dahulu.', 'warning');
      return;
    }

    // Validasi pencegahan duplikasi target
    const duplicateStatus = getOfficialAssignedStatus(selectedOfficial);
    if (duplicateStatus) {
      showToast(
        `Pejabat ${selectedOfficial.nama_lengkap || selectedOfficial.name} tidak dapat dipilih (${duplicateStatus.reason.toLowerCase()}: ${duplicateStatus.label}).`,
        'warning'
      );
      return;
    }

    const uCode = selectedOfficial.unit_kerja_id || selectedOfficial.kode_unit || '';
    const uObj = selectedOfficialUnit;

    const tipe = String(uObj?.tipe_unit || uObj?.kategori || '').toUpperCase();
    let computedCluster = 'Target Tambahan';
    if (tipe === 'FAKULTAS' || tipe === 'PASCASARJANA') {
      computedCluster = 'Pimpinan Fakultas & Pascasarjana';
    } else if (tipe === 'UPA') {
      computedCluster = 'Pimpinan Unit Penunjang Akademik (UPA)';
    } else if (tipe === 'LEMBAGA') {
      computedCluster = 'Pimpinan Lembaga';
    } else if (tipe === 'BIRO') {
      computedCluster = 'Pelaksana Administrasi & Biro';
    } else if (tipe === 'UNIVERSITAS' || tipe === 'ORGAN') {
      computedCluster = 'Pimpinan Lembaga';
    }

    const officialPosition =
      selectedOfficial.jabatan ||
      selectedOfficial.roleLabel ||
      selectedOfficial.sotk_position_label ||
      selectedOfficial.nama_lengkap;

    const badgeLabel = uObj?.singkatan || uCode || 'Pejabat';
    const roleSlug = selectedOfficial.role_slug || selectedOfficial.role || 'pimpinan';

    const targetPayload = {
      nama: officialPosition.trim(),
      badge: badgeLabel.trim(),
      cluster: computedCluster,
      unit_id: uCode,
      deskripsi: `Pelaksana arahan dan tugas kedinasan (${officialPosition})`,
      roleKey: roleSlug,
      userId: selectedOfficial.id || selectedOfficial.nip || String(targetUserId)
    };

    if (targetModalMode === 'edit' && editingTargetId) {
      const updated = updateTargetInSender(
        selectedPosition.senderKey,
        editingTargetId,
        targetPayload,
        selectedPosition.fallbackKey
      );
      setMatrix((prev) => ({ ...prev, [selectedPosition.senderKey]: updated }));
      showToast(`Tujuan "${targetPayload.nama}" berhasil diperbarui.`, 'success');
    } else {
      const newTarget = {
        id: `custom-${Date.now()}`,
        ...targetPayload
      };
      const updated = addTargetToSender(
        selectedPosition.senderKey,
        newTarget,
        selectedPosition.fallbackKey
      );
      setMatrix((prev) => ({ ...prev, [selectedPosition.senderKey]: updated }));
      showToast(`Tujuan baru "${newTarget.nama}" berhasil ditambahkan.`, 'success');
    }

    setIsTargetModalOpen(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="font-bold text-sm">Akses Khusus Super Administrator</p>
          <p className="text-xs mt-1 text-rose-600">
            Halaman Manajemen Alur Disposisi hanya dapat diakses oleh akun Administrator Sistem SILOKA UNSIL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Ringkas & Navigasi Breadcrumb */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-unsil-green-900 text-unsil-gold-400 flex items-center justify-center shrink-0 shadow-xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Alur Disposisi</h1>
                {selectedUnit && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm font-semibold text-unsil-green-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedUnit.nama_unit}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedUnit
                  ? `Kelola daftar pejabat di ${selectedUnit.nama_unit} dan wewenang target disposisi masing-masing.`
                  : 'Pilih unit kerja di bawah untuk melihat daftar pejabat dan mengatur ke mana saja mereka dapat mendisposisikan surat.'}
              </p>
            </div>
          </div>
        </div>

        {selectedUnit && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedUnit(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Unit</span>
            </button>
          </div>
        )}
      </div>

      {/* TINGKAT 1: TABEL DAFTAR UNIT KERJA (Persis seperti Image 2) */}
      {!selectedUnit ? (
        <div className="space-y-4">
          {/* Toolbar Pencarian & Filter Kategori */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={unitSearchQuery}
                onChange={(e) => setUnitSearchQuery(e.target.value)}
                placeholder="Cari nama unit kerja, kode, atau singkatan..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {KATEGORI_TABS.map((kat) => (
                <button
                  key={kat.id}
                  type="button"
                  onClick={() => setUnitCategoryFilter(kat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    unitCategoryFilter === kat.id
                      ? 'bg-unsil-green-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {kat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Unit Kerja */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Total {filteredUnits.length} Unit Kerja
              </h2>
              <span className="text-xs text-slate-500">
                Klik nama unit kerja untuk mengelola pejabat &amp; alur disposisinya
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold w-12 text-center">NO</th>
                    <th className="py-3 px-4 font-bold">NAMA UNIT KERJA</th>
                    <th className="py-3 px-4 font-bold">KODE / SINGKATAN</th>
                    <th className="py-3 px-4 font-bold">KATEGORI</th>
                    <th className="py-3 px-4 font-bold text-center">PEGAWAI</th>
                    <th className="py-3 px-4 font-bold text-center">STATUS</th>
                    <th className="py-3 px-4 font-bold text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="font-semibold text-xs text-slate-700">Unit kerja tidak ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((unit, idx) => {
                      const userCount = getUnitUserCount(unit.kode_unit || unit.id);

                      return (
                        <tr
                          key={unit.kode_unit || unit.id || idx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* No */}
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>

                          {/* Nama Unit Kerja */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              <div>
                                <p className="font-bold text-slate-900">
                                  {unit.nama_unit}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Kode / Singkatan */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                                {unit.kode_unit || unit.id}
                              </span>
                              {unit.singkatan && (
                                <span className="text-slate-500 text-[11px]">({unit.singkatan})</span>
                              )}
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="py-3 px-4">
                            {(() => {
                              const uTipe = String(unit.tipe_unit || unit.kategori || '').toUpperCase();
                              if (uTipe === 'FAKULTAS' || uTipe === 'PASCASARJANA') {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {uTipe === 'PASCASARJANA' ? 'Pascasarjana' : 'Fakultas'}
                                  </span>
                                );
                              }
                              if (uTipe === 'BIRO') {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    Biro
                                  </span>
                                );
                              }
                              if (uTipe === 'LEMBAGA' || uTipe === 'UPA') {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    {uTipe}
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                  Pimpinan
                                </span>
                              );
                            })()}
                          </td>

                          {/* Pegawai */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>{userCount}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Aktif</span>
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnit(unit);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-unsil-green-800 hover:bg-unsil-green-900 transition shadow-2xs cursor-pointer"
                            >
                              <Network className="w-3.5 h-3.5 text-unsil-gold-400" />
                              <span>Atur Alur Disposisi</span>
                            </button>
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
      ) : (
        /* TINGKAT 2: DAFTAR PEJABAT DI UNIT KERJA TERPILIH */
        <div className="space-y-4">
          {/* Kartu Informasi Unit */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-unsil-green-950 text-unsil-gold-300 font-mono font-bold text-[11px] rounded">
                  {selectedUnit.kode_unit || selectedUnit.id}
                </span>
                <h2 className="text-sm font-bold text-unsil-green-950">{selectedUnit.nama_unit}</h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Pilih salah satu pejabat di bawah untuk melihat dan mengedit daftar tujuan ke mana saja beliau berwenang mendisposisikan surat.
              </p>
            </div>
            <div className="shrink-0 font-mono text-xs font-semibold text-unsil-green-900">
              {unitPositions.length} Formasi SOTK ({occupiedPositionsCount} Pejabat Aktif)
            </div>
          </div>

          {/* Tabel Pejabat di Unit Tersebut */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Daftar Pejabat &amp; Akun yang Menjabat ({selectedUnit.nama_unit})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold w-12 text-center">NO</th>
                    <th className="py-3 px-4 font-bold">NAMA JABATAN RESMI</th>
                    <th className="py-3 px-4 font-bold">PEJABAT AKTIF (MANAJEMEN PENGGUNA)</th>
                    <th className="py-3 px-4 font-bold text-center">TARGET DISPOSISI AKTIF</th>
                    <th className="py-3 px-4 font-bold text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitPositions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                          <UserX className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-xs text-slate-700">Belum Ada Pejabat Aktif yang Menjabat</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                          Jabatan pada unit kerja ini belum memiliki akun pejabat yang ditugaskan di Manajemen Pengguna atau Manajemen Unit Kerja.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    unitPositions.map((pos, idx) => {
                      const occupant = pos.occupant;

                      return (
                        <tr key={pos.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* No */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>

                          {/* Nama Jabatan */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-900">{pos.nama_jabatan}</p>
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                Kunci Alur: {pos.senderKey}
                              </span>
                            </div>
                          </td>

                          {/* Pejabat Aktif */}
                          <td className="py-3.5 px-4">
                            {occupant ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                  <UserCheck className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{occupant.nama_lengkap || occupant.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500">
                                    NIP: {occupant.nip || occupant.username || '-'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <UserX className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[11px] italic font-medium">
                                  [Belum Ditugaskan di Manajemen Pengguna]
                                </span>
                              </div>
                            )}
                          </td>

                        {/* Jumlah Target Disposisi Aktif */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono text-xs font-bold">
                            {pos.activeTargetsCount} Target Aktif
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPosition(pos);
                              setTargetSearchQuery('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-unsil-green-800 hover:bg-unsil-green-900 transition shadow-2xs cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
                            <span>Kelola Tujuan Disposisi</span>
                          </button>
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

      {/* TINGKAT 3: MODAL / PANEL CRUD TARGET DISPOSISI PEJABAT */}
      {selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-unsil-green-900 text-unsil-gold-400 flex items-center justify-center shrink-0 shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      CRUD ALUR DISPOSISI
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      {currentPosition.nama_jabatan}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pejabat yang Menjabat:{' '}
                    <strong className={currentPosition.occupant ? 'text-slate-800' : 'text-slate-500 italic'}>
                      {currentPosition.occupant?.nama_lengkap ||
                        currentPosition.occupant?.name ||
                        '[Belum Ditugaskan di Manajemen Pengguna]'}
                    </strong>{' '}
                    • Unit: {selectedUnit?.nama_unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition cursor-pointer shadow-2xs"
                  title="Kembalikan tujuan disposisi pejabat ini ke standar SOTK"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Reset Standar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPosition(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Toolbar (Pencarian & Tambah Target) */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetSearchQuery}
                  onChange={(e) => setTargetSearchQuery(e.target.value)}
                  placeholder="Cari target pejabat atau unit kerja..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">
                  Total: {currentOfficialTargets.length}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                  Aktif: {currentOfficialTargets.filter((t) => t.enabled !== false).length}
                </span>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-unsil-green-800 hover:bg-unsil-green-900 rounded-lg transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-unsil-gold-400" />
                  <span>Tambah Target Baru</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Tabel Target Penerima */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {filteredOfficialTargets.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Tidak ada target yang cocok</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan tombol "+ Tambah Target Baru" untuk menambahkan pejabat bawahan yang berhak menerima disposisi.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">NAMA JABATAN TARGET</th>
                        <th className="py-2.5 px-3 font-bold">PEJABAT AKTIF (MANAJEMEN PENGGUNA)</th>
                        <th className="py-2.5 px-3 font-bold">KLASTER</th>
                        <th className="py-2.5 px-3 font-bold text-center">STATUS DISPOSISI</th>
                        <th className="py-2.5 px-3 font-bold text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOfficialTargets.map((target) => {
                        const occupant = resolveTargetOccupant(target);
                        const isEnabled = target.enabled !== false;

                        return (
                          <tr
                            key={target.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              !isEnabled ? 'bg-slate-50/40 opacity-70' : ''
                            }`}
                          >
                            {/* Nama Target */}
                            <td className="py-3 px-3">
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 shrink-0 mt-0.5">
                                  {target.badge || 'Unit'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-semibold text-slate-900">{target.nama}</p>
                                    {target.isCustom && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                        Kustom
                                      </span>
                                    )}
                                  </div>
                                  {target.unit_id && (
                                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                      Unit: {target.unit_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Pejabat Aktif */}
                            <td className="py-3 px-3">
                              {occupant ? (
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-slate-800 line-clamp-1">
                                        {occupant.nama_lengkap || occupant.name}
                                      </p>
                                      {target.userId && (
                                        <span className="text-[9px] font-bold px-1 rounded bg-unsil-green-100 text-unsil-green-800 border border-unsil-green-300 shrink-0">
                                          Akun Terhubung
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      NIP: {occupant.nip || occupant.username || '-'}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  [Belum Ditugaskan]
                                </span>
                              )}
                            </td>

                            {/* Klaster */}
                            <td className="py-3 px-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border border-slate-200 inline-block">
                                {target.cluster || 'Umum'}
                              </span>
                            </td>

                            {/* Toggle Sakelar */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggle(target.id, isEnabled)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                  isEnabled
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300'
                                }`}
                                title={
                                  isEnabled
                                    ? 'Klik untuk menonaktifkan target ini'
                                    : 'Klik untuk mengaktifkan kembali target ini'
                                }
                              >
                                {isEnabled ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Nonaktif</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Aksi CRUD Terhubung */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(target)}
                                  className="p-1.5 text-slate-500 hover:text-unsil-green-800 hover:bg-unsil-green-50 rounded-lg transition cursor-pointer"
                                  title={`Ubah data dan rujukan target "${target.nama}"`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTarget(target.id, target.nama, target.isCustom)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title={`Hapus target "${target.nama}" dari alur pejabat ini`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700" />
                <span>Perubahan tersimpan otomatis dan langsung berlaku di formulir disposisi pejabat terkait.</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH & UBAH TUJUAN DISPOSISI (SEDERHANA, BERSIH, BAHASA AWAM) */}
      {isTargetModalOpen && selectedPosition && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs"
          style={{ zIndex: 100 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-unsil-green-900 text-unsil-gold-400 flex items-center justify-center shrink-0 shadow-xs">
                  {targetModalMode === 'edit' ? (
                    <Pencil className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {targetModalMode === 'edit' ? 'Ubah Tujuan Disposisi' : 'Tambah Tujuan Disposisi'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Untuk arahan dari: <strong className="text-slate-700">{currentPosition.nama_jabatan}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup formulir"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form: 1 Komando dengan Manajemen User & Peran */}
            <form onSubmit={handleSaveTarget} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Pilihan Tunggal: Pejabat yang Menjabat */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5 text-xs">
                  Pilih Pejabat yang Menjabat <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={targetUserId}
                  onChange={(e) => handleUserAccountSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition font-medium text-xs cursor-pointer"
                >
                  <option value="">-- Pilih Pejabat / Pimpinan dari Manajemen Pengguna --</option>
                  {sortedUsersForSelect.map((u) => {
                    const badgeLabel = getOfficialRoleBadge(u);
                    const assignedStatus = getOfficialAssignedStatus(u);
                    const isAssigned = Boolean(assignedStatus);

                    return (
                      <option
                        key={u.id || u.nip || u.username}
                        value={u.id || u.nip || u.username}
                        disabled={isAssigned}
                        className={isAssigned ? 'text-slate-400 bg-slate-100 italic' : 'text-slate-800'}
                      >
                        [{badgeLabel}] {u.nama_lengkap || u.name} — {u.unit_kerja_id || u.kode_unit || ''} ({u.jabatan || u.roleLabel || 'Pejabat'})
                        {isAssigned ? ` — [${assignedStatus.reason.toUpperCase()}]` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hanya menampilkan akun pimpinan dan pejabat sah. Pejabat yang sudah terdaftar atau bertindak sebagai pengirim dinonaktifkan otomatis untuk mencegah alur ganda.
                </p>
              </div>

              {/* Rincian Terhubung 1 Komando dengan Manajemen User & Peran */}
              {selectedOfficial ? (
                selectedOfficialStatus ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Pejabat Tidak Dapat Dipilih ({selectedOfficialStatus.reason})</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      <strong>{selectedOfficial.nama_lengkap || selectedOfficial.name}</strong>{' '}
                      {selectedOfficialStatus.reason === 'Pejabat Pengirim'
                        ? 'merupakan pejabat pengirim pada alur ini dan tidak dapat mendisposisikan ke dirinya sendiri.'
                        : `sudah terdaftar sebagai tujuan disposisi (${selectedOfficialStatus.label}). Silakan pilih pejabat lain.`}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-200/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-950 text-xs">
                        Terhubung 1 Komando dengan Manajemen Pengguna &amp; Peran
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Nama Pejabat:</span>
                        <p className="font-bold text-slate-900">{selectedOfficial.nama_lengkap || selectedOfficial.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP: {selectedOfficial.nip || selectedOfficial.nip_nik || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Jabatan Resmi SOTK:</span>
                        <p className="font-bold text-slate-900">
                          {selectedOfficial.jabatan || selectedOfficial.roleLabel || selectedOfficial.sotk_position_label || 'Pejabat Struktural'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Unit Kerja:</span>
                        <p className="font-medium text-slate-800">
                          {selectedOfficialUnit ? `${selectedOfficialUnit.nama_unit} (${selectedOfficialUnit.singkatan || selectedOfficialUnit.kode_unit})` : (selectedOfficial.unit || selectedOfficial.unit_kerja_id || '-')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Hak Akses &amp; Peran:</span>
                        <p className="font-medium text-slate-800">
                          {selectedOfficialRole ? selectedOfficialRole.name : (selectedOfficial.roleLabel || selectedOfficial.role || 'Pimpinan / Penandatangan')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center">
                  <UserCheck className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">Pilih akun pejabat pada menu di atas</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Nama jabatan, unit kerja, singkatan tombol, dan peran akan otomatis disinkronkan langsung dari data Manajemen Pengguna &amp; Peran.
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!targetUserId || Boolean(selectedOfficialStatus)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-unsil-green-800 hover:bg-unsil-green-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition cursor-pointer shadow-xs active:scale-95"
                >
                  {targetModalMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Tujuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET */}
      {isResetConfirmOpen && selectedPosition && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          style={{ zIndex: 100 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Kembalikan ke Standar SOTK?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Tindakan ini akan mereset tujuan disposisi jabatan <strong>{currentPosition.nama_jabatan}</strong> kembali ke standar universitas.
              Target yang sempat dinonaktifkan akan aktif kembali.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetCurrentPosition}
                className="px-4 py-2 text-xs font-semibold text-white bg-unsil-green-800 hover:bg-unsil-green-900 rounded-lg transition cursor-pointer shadow-xs"
              >
                Ya, Kembalikan ke Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
