import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  RotateCcw,
  Info,
  Lock,
  Layers,
  FileText,
  SendHorizontal,
  Archive,
  History,
  AlertCircle
} from 'lucide-react';
import { isSuperAdminUser } from '../../utils/authGuards';
import {
  getPermissionMatrix,
  savePermissionMatrix,
  RBAC_CHANGE_EVENT,
  DEFAULT_PERMISSION_MATRIX
} from '../../utils/rbacSyncService';

/**
 * 6 Role Resmi SILOKA Sesuai Spesifikasi:
 * 1. Super Administrator (Teks Merah)
 * 2. Administrator TU / Sekretariat (Teks Hijau)
 * 3. Pimpinan / Penandatangan (Teks Biru)
 * 4. Verifikator / Atasan Hierarki (Teks Oranye)
 * 5. Dosen / Staff Drafter (Teks Hitam)
 * 6. Auditor / SPI (Teks Ungu)
 */
export const ROLES_LIST = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Akses penuh konfigurasional sistem.'
  },
  {
    id: 'admin_tu',
    name: 'Administrator TU / Sekretariat',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Pengelola registrasi, penomoran otomatis, dan agenda surat masuk/keluar.'
  },
  {
    id: 'pimpinan',
    name: 'Pimpinan / Penandatangan',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Rektor, Warek, Dekan, Ketua Lembaga, Kepala UPA (Memiliki hak TTE & Disposisi).'
  },
  {
    id: 'verifikator',
    name: 'Verifikator / Atasan Hierarki',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Kajur, Koorprodi, Wadek, Kabag (Memiliki hak paraf berjenjang).'
  },
  {
    id: 'dosen_drafter',
    slug: 'drafter',
    name: 'Dosen / Staff Drafter',
    colorClass: 'text-slate-800',
    bgClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Pengkonsep naskah dinas mandiri & pengaju draft surat.'
  },
  {
    id: 'auditor_spi',
    name: 'Auditor / SPI',
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Satuan Pengawas Internal (read-only log & audit trail).'
  }
];

export const DEFAULT_PERMISSION_CATEGORIES = DEFAULT_PERMISSION_MATRIX;

export const PermissionManagementView = ({
  currentUser,
  showToast = () => {}
}) => {
  const isSuperAdmin = isSuperAdminUser(currentUser);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <p className="font-bold text-sm">Akses Dibatasi: Khusus Super Administrator</p>
          <p className="text-xs mt-1 text-rose-600">Modul Hak Akses & Izin hanya dapat diakses oleh akun Super Administrator SILOKA UNSIL.</p>
        </div>
      </div>
    );
  }

  // State Matriks Permission (Tersimpan di LocalStorage & Sinkron via rbacSyncService)
  const [permissionCategories, setPermissionCategories] = useState(() => getPermissionMatrix());

  // Listener event RBAC agar sinkron real-time jika role diubah dari RoleManagementView
  useEffect(() => {
    const handleRbacUpdate = () => {
      setPermissionCategories(getPermissionMatrix());
    };
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbacUpdate);
  }, []);

  // State Modal "Kelola Role"
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState('pimpinan');
  const [editableCategories, setEditableCategories] = useState(permissionCategories);
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const savedLogs = localStorage.getItem('siloka_permission_audit_logs');
      if (savedLogs) return JSON.parse(savedLogs);
    } catch {}
    return [
      {
        id: 1,
        timestamp: 'Hari ini, 09:30 WIB',
        operator: 'Dede Gunawan (Super Admin)',
        action: 'Inisialisasi Matriks Permission SILOKA SKKAAD/JRA 2803/2023'
      }
    ];
  });

  // Sinkronisasi state saat modal dibuka
  useEffect(() => {
    if (isManageModalOpen) {
      setEditableCategories(JSON.parse(JSON.stringify(permissionCategories)));
    }
  }, [isManageModalOpen, permissionCategories]);

  // Handler: Toggle Permission untuk Role Tertentu di dalam Modal
  const handleTogglePermission = (catId, slug, roleId) => {
    setEditableCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          permissions: cat.permissions.map((p) => {
            if (p.slug !== slug) return p;
            const hasRole = p.allowedRoles.includes(roleId);
            const newRoles = hasRole
              ? p.allowedRoles.filter((r) => r !== roleId)
              : [...p.allowedRoles, roleId];
            return {
              ...p,
              allowedRoles: newRoles
            };
          })
        };
      })
    );
  };

  // Handler: Simpan Perubahan Matriks Role
  const handleSaveRolePermissions = () => {
    setPermissionCategories(editableCategories);
    try {
      savePermissionMatrix(editableCategories);
      
      const roleObj = ROLES_LIST.find((r) => r.id === selectedRoleForEdit);
      const newLog = {
        id: Date.now(),
        timestamp: new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(new Date()),
        operator: `${currentUser?.name || currentUser?.nama_lengkap || 'Super Admin'} (Super Admin)`,
        action: `Memperbarui konfigurasi hak akses permission pada Role [${roleObj?.name || selectedRoleForEdit}]`
      };
      const updatedLogs = [newLog, ...auditLogs].slice(0, 10);
      setAuditLogs(updatedLogs);
      localStorage.setItem('siloka_permission_audit_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Failed to save permission matrix', e);
    }

    setIsManageModalOpen(false);
    showToast(
      'Konfigurasi hak akses role berhasil diperbarui dan diterapkan secara real-time.',
      'success'
    );
  };

  // Handler: Reset ke Standar SK 2803/2023
  const handleResetToDefault = () => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_CATEGORIES));
    setEditableCategories(defaults);
    setPermissionCategories(defaults);
    savePermissionMatrix(defaults);
    showToast('Matriks dikembalikan ke konfigurasi standar Tata Naskah Dinas UNSIL.', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* =========================================================================
          HEADER HALAMAN (PERSIS SESUAI GAMBAR 2 & DESKRIPSI)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hak Akses &amp; Izin Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Matriks wewenang dan hak akses fitur persuratan dinas Universitas Siliwangi
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer shadow-2xs active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Atur Izin Peran</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TABEL-TABEL MATRIKS PERMISSION PER KATEGORI (SESUAI GAMBAR 2)
          ========================================================================= */}
      <div className="space-y-6">
        {permissionCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
          >
            {/* Header Kategori */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {category.title}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Tabel Permission Matriks */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-[11px] text-slate-500 font-semibold">
                    <th className="py-3 px-5 w-60">Hak Akses &amp; Wewenang</th>
                    <th className="py-3 px-4 w-48 text-[11px]">Cakupan Fitur</th>
                    {ROLES_LIST.map((role) => (
                      <th
                        key={role.id}
                        className="py-3 px-3 text-center min-w-[120px]"
                      >
                        <span
                          className={`inline-block font-semibold text-[11px] ${role.colorClass}`}
                        >
                          {role.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {category.permissions.map((perm) => (
                    <tr
                      key={perm.slug}
                      className="hover:bg-slate-50/50 transition"
                    >
                      {/* 1. Nama Permission */}
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-900 block">
                          {perm.name}
                        </span>
                        {perm.description && (
                          <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                            {perm.description}
                          </span>
                        )}
                      </td>

                      {/* 2. Nama Fitur / Modul */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 font-medium">
                        {category.title}
                      </td>

                      {/* 3. Kolom Ceklis per Role */}
                      {ROLES_LIST.map((role) => {
                        const isAllowed = perm.allowedRoles.includes(role.id);
                        return (
                          <td
                            key={role.id}
                            className="py-3.5 px-3 text-center"
                          >
                            {isAllowed ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 text-emerald-600 font-bold text-base">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 font-medium">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          LOG AUDIT TRAIL RINGKAS
          ========================================================================= */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <History className="w-4 h-4 text-slate-500" />
          <span>Riwayat Pembaruan Hak Akses Pengguna</span>
        </div>
        <div className="space-y-1 text-[11px]">
          {auditLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-slate-500">
              <span className="text-slate-400 shrink-0">• {log.timestamp}:</span>
              <span>
                <strong className="text-slate-700">{log.operator}</strong> — {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MODAL INTERAKTIF: KELOLA ROLE
          ========================================================================= */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-unsil-green-900 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengaturan Hak Akses Peran
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Aktifkan atau nonaktifkan wewenang dan hak akses fitur persuratan per peran.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pilihan Role Yang Sedang Dikonfigurasi */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 mr-2 uppercase tracking-wider">
                Pilih Peran:
              </span>
              {ROLES_LIST.map((role) => {
                const isSelected = selectedRoleForEdit === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleForEdit(role.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? `${role.bgClass} shadow-2xs ring-2 ring-unsil-green-700/30`
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>

            {/* Badan Konfigurasi Checkbox */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Perubahan hak akses pada peran{' '}
                  <strong className="font-bold underline">
                    {ROLES_LIST.find((r) => r.id === selectedRoleForEdit)?.name}
                  </strong>{' '}
                  akan langsung diterapkan ke sistem SILOKA dan dicatat ke dalam riwayat pembaruan.
                </div>
              </div>

              {editableCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                    <span>{cat.title}</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      {cat.permissions.length} Hak Akses
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {cat.permissions.map((p) => {
                      const isChecked = p.allowedRoles.includes(selectedRoleForEdit);
                      return (
                        <label
                          key={p.slug}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer select-none ${
                            isChecked
                              ? 'bg-emerald-50/40 border-emerald-300/80'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleTogglePermission(cat.id, p.slug, selectedRoleForEdit)
                            }
                            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-unsil-green-800 focus:ring-unsil-green-700 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {p.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {p.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar SK 2803</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-unsil-green-900 hover:bg-unsil-green-800 rounded-lg transition cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Peran</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagementView;
