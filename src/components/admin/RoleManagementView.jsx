import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit3,
  X,
  Check,
  ShieldCheck,
  RotateCcw,
  Info,
  Layers,
  Lock,
  Search,
  Sparkles,
  Users
} from 'lucide-react';
import { isSuperAdminUser } from '../../utils/authGuards';
import {
  getRolesCatalog,
  saveRolesCatalog,
  computeUserCountPerRole,
  RBAC_CHANGE_EVENT,
  DEFAULT_CANONICAL_ROLES,
  getPermissionLabel
} from '../../utils/rbacSyncService';

/**
 * 5 Role Standar SILOKA Sesuai Spesifikasi:
 */
export const INITIAL_ROLES_DATA = DEFAULT_CANONICAL_ROLES;

// Opsi Pilihan Hak Akses untuk Modal Buat & Edit Role
const AVAILABLE_PERMISSIONS_CATALOG = [
  {
    category: 'Sistem & Administrasi',
    items: [
      { slug: 'admin.access', name: 'Akses Portal Administrasi' },
      { slug: 'dashboard.view', name: 'Melihat Ringkasan Dashboard' },
      { slug: 'role.manage', name: 'Mengelola Peran & Hak Akses' },
      { slug: 'user.impersonate', name: 'Akses Tampilan Pengguna Lain' },
      { slug: 'unit.manage', name: 'Pengelolaan Unit Kerja' },
      { slug: 'audit.view', name: 'Melihat Riwayat Perubahan Sistem' }
    ]
  },
  {
    category: 'Tata Naskah Dinas & Drafting',
    items: [
      { slug: 'naskah.create_draft', name: 'Menyusun Konsep Surat (Draf)' },
      { slug: 'naskah.create_mandiri', name: 'Menerbitkan Naskah Mandiri' },
      { slug: 'naskah.verify_paraf', name: 'Paraf Digital Berjenjang' },
      { slug: 'naskah.tte_sign', name: 'Pengesahan Tanda Tangan TTE BSrE' },
      { slug: 'surat_keluar.numbering', name: 'Penomoran Otomatis Naskah Keluar' },
      { slug: 'draft.return_koreksi', name: 'Mengembalikan Draf untuk Revisi' }
    ]
  },
  {
    category: 'E-Disposisi & Agenda',
    items: [
      { slug: 'surat_masuk.register', name: 'Registrasi Agenda Surat Masuk' },
      { slug: 'disposisi.create', name: 'Menerbitkan Arahan Disposisi' },
      { slug: 'disposisi.forward', name: 'Meneruskan Instruksi Disposisi' },
      { slug: 'disposisi.read_action', name: 'Melihat & Melaksanakan Disposisi' },
      { slug: 'agenda.manage', name: 'Kelola Buku Agenda Universitas' },
      { slug: 'ekspedisi.manage', name: 'Kelola Tanda Terima Ekspedisi Fisik' }
    ]
  },
  {
    category: 'Kearsipan & Klasifikasi JRA/SKKAAD',
    items: [
      { slug: 'arsip.view_biasa', name: 'Membuka Arsip Biasa / Terbuka' },
      { slug: 'arsip.view_rahasia', name: 'Akses Surat Rahasia (R / SR)' },
      { slug: 'arsip.jra_manage', name: 'Jadwal Retensi & Pemusnahan Arsip' },
      { slug: 'klasifikasi.manage', name: 'Master Kode Klasifikasi SK 2803' }
    ]
  }
];

export const RoleManagementView = ({
  currentUser,
  allUsers = [],
  onNavigateToUserManagement,
  showToast = () => {}
}) => {
  // State Roles List (tersinkronisasi via rbacSyncService)
  const [rolesList, setRolesList] = useState(() => getRolesCatalog());

  // Kalkulasi jumlah pengguna riil secara dinamis berdasarkan master allUsers
  const userCounts = useMemo(() => {
    return computeUserCountPerRole(allUsers);
  }, [allUsers]);

  // Listener event RBAC agar sinkron real-time jika permission diubah dari PermissionManagementView
  useEffect(() => {
    const handleRbacUpdate = () => {
      setRolesList(getRolesCatalog());
    };
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
  }, []);

  // State Modal Edit Role
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    selectedSlugs: []
  });

  // State Modal Buat Role Baru
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    slug: '',
    badgeType: 'Kustom',
    description: '',
    selectedSlugs: ['dashboard.view']
  });

  // Filter Search
  const [searchQuery, setSearchQuery] = useState('');

  // Simpan ke rbacSyncService (otomatis memperbarui siloka_roles_catalog & siloka_permission_matrix)
  const persistRoles = (updatedRoles) => {
    setRolesList(updatedRoles);
    saveRolesCatalog(updatedRoles);
  };

  // Handler Buka Modal Edit
  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setEditFormData({
      name: role.name,
      description: role.description,
      selectedSlugs: [...role.keySlugs]
    });
    setIsEditModalOpen(true);
  };

  // Toggle Slug di Modal Edit
  const handleToggleEditSlug = (slug) => {
    setEditFormData((prev) => {
      const exists = prev.selectedSlugs.includes(slug);
      return {
        ...prev,
        selectedSlugs: exists
          ? prev.selectedSlugs.filter((s) => s !== slug)
          : [...prev.selectedSlugs, slug]
      };
    });
  };

  // Simpan Perubahan Edit Role
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRole) return;

    const updatedRoles = rolesList.map((r) => {
      if (r.id !== editingRole.id) return r;
      return {
        ...r,
        name: editFormData.name,
        description: editFormData.description,
        keySlugs: editFormData.selectedSlugs,
        permissionCount: editFormData.selectedSlugs.length
      };
    });

    persistRoles(updatedRoles);
    setIsEditModalOpen(false);
    showToast(
      `Perubahan role [${editFormData.name}] berhasil disimpan dan hak akses diperbarui.`,
      'success'
    );
  };

  // Toggle Slug di Modal Buat Role Baru
  const handleToggleNewRoleSlug = (slug) => {
    setNewRoleData((prev) => {
      const exists = prev.selectedSlugs.includes(slug);
      return {
        ...prev,
        selectedSlugs: exists
          ? prev.selectedSlugs.filter((s) => s !== slug)
          : [...prev.selectedSlugs, slug]
      };
    });
  };

  // Simpan Role Baru
  const handleCreateRole = (e) => {
    e.preventDefault();
    if (!newRoleData.name.trim() || !newRoleData.slug.trim()) {
      showToast('Mohon lengkapi nama role dan kode slug.', 'error');
      return;
    }

    const cleanSlug = newRoleData.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newRole = {
      id: `role_${cleanSlug}_${Date.now()}`,
      name: newRoleData.name,
      badgeType: newRoleData.badgeType || 'Kustom',
      slug: cleanSlug,
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      description: newRoleData.description || 'Peran operasional tata persuratan SILOKA.',
      permissionCount: newRoleData.selectedSlugs.length,
      userCount: 0,
      keySlugs: newRoleData.selectedSlugs,
      remainingCount: 0
    };

    const updated = [...rolesList, newRole];
    persistRoles(updated);
    setIsCreateModalOpen(false);
    setNewRoleData({
      name: '',
      slug: '',
      badgeType: 'Kustom',
      description: '',
      selectedSlugs: ['dashboard.view']
    });
    showToast(`Role baru [${newRole.name}] berhasil ditambahkan ke sistem.`, 'success');
  };

  // Filter roles berdasarkan kata kunci pencarian
  const filteredRoles = rolesList.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const isSuperAdmin = isSuperAdminUser(currentUser);
  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <p className="font-bold text-sm">Akses Dibatasi: Khusus Super Administrator</p>
          <p className="text-xs mt-1 text-rose-600">Modul Manajemen Peran hanya dapat diakses oleh akun Super Administrator SILOKA UNSIL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* =========================================================================
          HEADER HALAMAN (SESUAI GAMBAR 1 & SPESIFIKASI)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Peran Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan daftar peran pengguna, cakupan kewenangan penandatanganan, dan hak akses fitur kearsipan di lingkungan Universitas Siliwangi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Peran Baru</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          DAFTAR KARTU ROLE (LAYOUT KARTU SESUAI GAMBAR 1)
          ========================================================================= */}
      <div className="space-y-4">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition"
          >
            {/* Baris 1: Nama Role, Badges, & Tombol Edit */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block font-bold text-xs px-2.5 py-1 rounded-md border ${role.badgeColor}`}
                >
                  {role.name}
                </span>
                <span className="inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {role.badgeType}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEdit(role)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Baris 2: Deskripsi Singkat Kewenangan */}
            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-2.5 mb-2">
              {role.description}
            </p>

            {/* Baris 3: Statistik Ringkas (Terhubung Dinamis dengan Master User) */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold text-slate-700">
                {role.keySlugs?.length || role.permissionCount || 0} wewenang •{' '}
                <span className="font-bold text-unsil-green-900">
                  {userCounts[role.slug || role.id] ?? role.userCount ?? 0} pengguna aktif
                </span>
              </p>
              {onNavigateToUserManagement && (
                <button
                  type="button"
                  onClick={() => onNavigateToUserManagement(role.slug || role.id)}
                  className="text-[11px] font-semibold text-unsil-green-800 hover:text-unsil-green-950 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3 h-3" />
                  <span>Lihat Pengguna</span>
                </button>
              )}
            </div>

            {/* Baris 4: Chip Tags Hak Akses (Bahasa Indonesia Ramah) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {role.keySlugs.map((slug) => (
                <span
                  key={slug}
                  className="text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200/90 px-2.5 py-0.5 rounded-md shadow-2xs"
                >
                  {getPermissionLabel(slug)}
                </span>
              ))}
              {role.remainingCount > 0 && (
                <span className="text-[11px] font-medium text-slate-400 pl-1">
                  +{role.remainingCount} lainnya
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          MODAL INTERAKTIF: EDIT ROLE & PERMISSION
          ========================================================================= */}
      {isEditModalOpen && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-unsil-green-900 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengaturan Peran: {editingRole.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan deskripsi tugas dan wewenang hak akses persuratan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Form Edit */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nama Peran
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Uraian Tugas &amp; Wewenang
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
                  required
                />
              </div>

              {/* Matriks Checkbox Permission per Kategori */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Daftar Hak Akses &amp; Wewenang
                  </h4>
                  <span className="text-[11px] font-semibold text-unsil-green-800 bg-unsil-green-50 px-2 py-0.5 rounded-full">
                    {editFormData.selectedSlugs.length} Dipilih
                  </span>
                </div>

                {AVAILABLE_PERMISSIONS_CATALOG.map((catGroup) => (
                  <div key={catGroup.category} className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                      {catGroup.category}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catGroup.items.map((item) => {
                        const isChecked = editFormData.selectedSlugs.includes(item.slug);
                        
                        // Restriksi Keamanan (SKKAAD): arsip.view_rahasia terkunci kecuali untuk pimpinan / super admin
                        const isSecretRestricted =
                          item.slug === 'arsip.view_rahasia' &&
                          editingRole.slug !== 'pimpinan' &&
                          editingRole.slug !== 'super_admin';

                        return (
                          <label
                            key={item.slug}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition ${
                              isSecretRestricted
                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                : isChecked
                                ? 'bg-emerald-50/50 border-emerald-300 cursor-pointer'
                                : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSecretRestricted}
                              onChange={() => handleToggleEditSlug(item.slug)}
                              className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-slate-800 block text-[11px]">
                                {item.name}
                              </span>
                            </div>
                            {isSecretRestricted && (
                              <Lock className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Peran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL INTERAKTIF: BUAT ROLE BARU
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-unsil-green-900 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Peran Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Definisikan peran baru beserta hak akses persuratan dan kearsipan dinas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Buat Role Baru */}
            <form onSubmit={handleCreateRole} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nama Peran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRoleData.name}
                    onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                    placeholder="Contoh: Auditor Internal SPI"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Kode Pengenal Singkat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRoleData.slug}
                    onChange={(e) => setNewRoleData({ ...newRoleData, slug: e.target.value })}
                    placeholder="Contoh: auditor_spi atau arsiparis"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Uraian Tugas &amp; Wewenang
                </label>
                <textarea
                  rows={2}
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  placeholder="Jelaskan ruang lingkup wewenang jabatan ini..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsil-green-700/20 focus:border-unsil-green-800 transition"
                />
              </div>

              {/* Matriks Checkbox Permission per Kategori */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pilih Hak Akses &amp; Wewenang
                  </h4>
                  <span className="text-[11px] font-semibold text-unsil-green-800 bg-unsil-green-50 px-2 py-0.5 rounded-full">
                    {newRoleData.selectedSlugs.length} Dipilih
                  </span>
                </div>

                {AVAILABLE_PERMISSIONS_CATALOG.map((catGroup) => (
                  <div key={catGroup.category} className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                      {catGroup.category}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catGroup.items.map((item) => {
                        const isChecked = newRoleData.selectedSlugs.includes(item.slug);
                        return (
                          <label
                            key={item.slug}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleNewRoleSlug(item.slug)}
                              className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-slate-800 block text-[11px]">
                                {item.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Peran Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementView;
