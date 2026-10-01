import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  SendHorizontal,
  FileSignature,
  Inbox,
  Send,
  Archive,
  Vault,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Shield,
  ExternalLink,
  HelpCircle,
  LogOut,
  X,
  BookOpen,
  Receipt,
  Users,
  KeyRound,
  Mail
} from 'lucide-react';
import { canAccessBrankasDigital, isSuperAdminUser } from '../../utils/authGuards';
import { hasUserPermission, RBAC_CHANGE_EVENT } from '../../utils/rbacSyncService';
import { getPathFromTab } from '../../utils/routeNavigation';

export const buildSidebarMenuItems = ({
  user,
  unreadCounts = { disposisi: 3, tte: 5, retensi: 14 }
}) => {
  // Tugas 1: Otorisasi RBAC Menu Pengaturan Sistem (Hanya untuk Super Admin)
  const isSuperAdmin = isSuperAdminUser(user);

  // Akses Khusus Bagian IT / UPA TIK (UN58.32)
  const isUptTik = Boolean(
    user?.unit_kerja_id === 'UN58.32' ||
    user?.unit_kerja_id === 'UN58.TIK' ||
    user?.kode_unit === 'UN58.32' ||
    user?.kode_unit === 'UN58.TIK' ||
    (user?.email && (user.email.includes('tik@unsil.ac.id') || user.email.includes('it@unsil.ac.id'))) ||
    (user?.roleLabel && (
      user.roleLabel.toLowerCase().includes('tik') ||
      /\b(it|ti)\b/i.test(user.roleLabel) ||
      user.roleLabel.toLowerCase().includes('teknologi informasi') ||
      user.roleLabel.toLowerCase().includes('programmer') ||
      user.roleLabel.toLowerCase().includes('server')
    )) ||
    (user?.unit && (
      user.unit.toLowerCase().includes('tik') ||
      user.unit.toLowerCase().includes('teknologi informasi')
    ))
  );

  // Evaluasi Hak Akses Granular Berdasarkan Role Permissions & Tupoksi (Terintegrasi RBAC Dinamis)
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const hasTupoksiPerm = (perm) => !isSuperAdmin && userPermissions.includes(perm);

  const canViewKeuangan = hasTupoksiPerm('keuangan:view');
  const canViewKepegawaian = hasTupoksiPerm('kepegawaian:view');
  const canAccessAgenda =
    hasTupoksiPerm('surat:agenda_access') ||
    hasUserPermission(user, 'agenda.manage') ||
    hasUserPermission(user, 'surat_masuk.register');
  // Menu Khusus Super Admin / User Management (Eksklusif Hanya untuk Super Admin)
  const canManageUsers = isSuperAdmin;
  const canAccessBrankas =
    canAccessBrankasDigital(user) ||
    hasUserPermission(user, 'arsip.view_rahasia');

  return [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'disposisi',
      label: 'E-Disposisi',
      icon: SendHorizontal,
      badge: unreadCounts.disposisi > 0 ? unreadCounts.disposisi : null,
      badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
    },
    {
      id: 'paraf-tte',
      label: 'E-Paraf & TTE',
      icon: FileSignature,
      badge: unreadCounts.tte > 0 ? unreadCounts.tte : null,
      badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
    },
    {
      id: 'surat',
      label: 'Surat',
      icon: Mail,
      badge: unreadCounts.suratMasuk > 0 ? unreadCounts.suratMasuk : null,
      badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
      children: [
        {
          id: 'surat-masuk',
          label: 'Surat Masuk',
          icon: Inbox,
          badge: unreadCounts.suratMasuk > 0 ? unreadCounts.suratMasuk : null,
          badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
        },
        {
          id: 'surat-keluar',
          label: 'Surat Keluar',
          icon: Send,
          badge: null,
        },
      ],
    },
    // Menu Khusus Tupoksi Arsiparis / Agendator (surat:agenda_access)
    ...(canAccessAgenda
      ? [
          {
            id: 'buku-agenda',
            label: 'Buku Agenda Masuk & Ekspedisi',
            icon: BookOpen,
            badge: 'Agenda',
            badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
          },
        ]
      : []),
    // Menu Khusus Tupoksi Staf Keuangan (keuangan:view)
    ...(canViewKeuangan
      ? [
          {
            id: 'brankas-keuangan',
            label: 'Brankas Keuangan / Verifikasi SPM',
            icon: Receipt,
            badge: 'DIPA',
            badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
          },
        ]
      : []),
    // Menu Khusus Tupoksi Staf Kepegawaian (kepegawaian:view)
    ...(canViewKepegawaian
      ? [
          {
            id: 'administrasi-kepegawaian',
            label: 'Administrasi Kepegawaian / SKP',
            icon: Users,
            badge: 'ASN',
            badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
          },
        ]
      : []),
    {
      id: 'retensi-arsip',
      label: 'Retensi Arsip',
      icon: Archive,
      badge: unreadCounts.retensi > 0 ? unreadCounts.retensi : null,
      badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
    },
    // Menu Khusus Brankas Digital: Hanya untuk Pejabat Struktural (Rektor, Dekan, Kepala LPPM/LPMPP, Ketua SPI, dll.) & Staf Khusus Arsiparis Pusat/Biro
    ...(canAccessBrankas
      ? [
          {
            id: 'brankas-digital',
            label: 'Brankas Digital',
            icon: Vault,
            badge: null,
          },
        ]
      : []),
    // Menu Khusus Super Admin / User Management (admin:manage_users)
    ...(canManageUsers
      ? [
          {
            id: 'manajemen',
            label: 'Manajemen',
            icon: Users,
            badge: 'Admin',
            badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
            children: [
              {
                id: 'settings',
                label: 'Manajemen Pengguna',
                icon: Users,
              },
              {
                id: 'manajemen-role',
                label: 'Manajemen Peran',
                icon: Shield,
              },
              {
                id: 'manajemen-permission',
                label: 'Hak Akses & Izin',
                icon: KeyRound,
              },
            ],
          },
        ]
      : []),
  ];
};

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isCollapsed = false,
  setIsCollapsed,
  onLogout,
  user,
  unreadCounts = { disposisi: 3, tte: 5, retensi: 14 },
  className = '',
  isSidebarOpen = false,
  toggleSidebar
}) => {
  // State accordion menu dengan sub-menu (Surat & Manajemen)
  const [openSubMenus, setOpenSubMenus] = useState({
    surat: true,
    manajemen: true,
  });

  const toggleSubMenu = (menuId) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [menuId]: prev[menuId] !== undefined ? !prev[menuId] : false,
    }));
  };

  // Re-evaluasi menu jika terjadi perubahan hak akses di Manajemen Role / Permission
  const [, setRbacVersion] = useState(0);
  useEffect(() => {
    const onRbacChange = () => setRbacVersion((v) => v + 1);
    window.addEventListener(RBAC_CHANGE_EVENT, onRbacChange);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, onRbacChange);
  }, []);

  // Auto-expand menu jika sub-menu terkait sedang aktif
  useEffect(() => {
    if (activeTab === 'surat-masuk' || activeTab === 'surat-keluar') {
      setOpenSubMenus((prev) => ({ ...prev, surat: true }));
    }
    if (
      activeTab === 'settings' ||
      activeTab === 'manajemen-user' ||
      activeTab === 'manajemen-role' ||
      activeTab === 'manajemen-permission'
    ) {
      setOpenSubMenus((prev) => ({ ...prev, manajemen: true }));
    }
  }, [activeTab]);

  const menuItems = buildSidebarMenuItems({ user, unreadCounts });

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out bg-unsil-green-950 border-r border-unsil-green-900/60 flex flex-col justify-between text-white shrink-0 select-none shadow-2xl md:shadow-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'} ${className}`}
    >
      {/* Sidebar Header */}
      <div>
        {isCollapsed ? (
          <div className="h-16 flex items-center justify-center border-b border-unsil-green-900/60 bg-unsil-green-900/30 relative shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-unsil-green-950/40 border border-unsil-gold-400/40 shrink-0 select-none protected-asset hover:scale-105 hover:ring-2 hover:ring-unsil-gold-400 transition-all cursor-pointer"
              title="Klik untuk Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <img
                src="/unsil-logo.png"
                alt="Logo Resmi Universitas Siliwangi"
                className="w-8 h-8 object-contain drop-shadow-xs select-none pointer-events-none protected-asset"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </button>

            {/* Floating Expand Button on Border */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-unsil-green-900 border border-unsil-gold-400 text-unsil-gold-300 hover:text-white hover:bg-unsil-green-800 shadow-md flex items-center justify-center transition-all z-40 cursor-pointer"
              title="Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-between px-4 border-b border-unsil-green-900/60 bg-unsil-green-900/30 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-unsil-green-950/40 border border-unsil-gold-400/40 shrink-0 select-none protected-asset"
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src="/unsil-logo.png"
                  alt="Logo Resmi Universitas Siliwangi"
                  className="w-8 h-8 object-contain drop-shadow-xs select-none pointer-events-none protected-asset"
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black tracking-wider text-base text-white flex items-center gap-1.5">
                  SILOKA
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-unsil-gold-500 text-unsil-green-950">
                    UNSIL
                  </span>
                </span>
                <span className="text-[11px] text-unsil-green-200/90 truncate font-normal">
                  Biro BKU
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (toggleSidebar && window.innerWidth < 768) {
                  toggleSidebar();
                } else if (setIsCollapsed) {
                  setIsCollapsed(true);
                }
              }}
              className="p-1.5 rounded-lg text-unsil-green-300 hover:text-white hover:bg-unsil-green-800/60 transition-colors"
              title="Tutup / Ciutkan Sidebar"
              aria-label="Tutup / Ciutkan Sidebar"
            >
              <span className="block md:hidden">
                <X className="w-5 h-5 text-emerald-200" />
              </span>
              <span className="hidden md:block">
                <ChevronLeft className="w-4 h-4" />
              </span>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-unsil-green-300/80">
              Menu Utama
            </div>
          )}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              const isChildActive =
                hasChildren &&
                item.children.some(
                  (child) =>
                    activeTab === child.id ||
                    (child.id === 'settings' && activeTab === 'manajemen-user')
                );
              const isActive = activeTab === item.id || isChildActive;

              if (hasChildren) {
                const isSubMenuOpen = Boolean(openSubMenus[item.id]);

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCollapsed && setIsCollapsed) {
                          setIsCollapsed(false);
                          setOpenSubMenus((prev) => ({ ...prev, [item.id]: true }));
                        } else {
                          toggleSubMenu(item.id);
                        }
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group cursor-pointer ${
                        isActive
                          ? 'bg-unsil-green-900/90 text-white border-l-4 border-unsil-gold-400 pl-2.5'
                          : 'text-slate-300 hover:text-white hover:bg-unsil-green-900/50'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
                          isActive
                            ? 'text-unsil-gold-400'
                            : 'text-unsil-green-400/80 group-hover:text-unsil-gold-300 group-hover:scale-105'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-left font-medium">
                          {item.label}
                        </span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[11px] min-w-[20px] h-5 px-1.5 rounded-full shrink-0 flex items-center justify-center font-bold shadow-xs ${
                            item.badgeColor || 'bg-yellow-400 text-slate-950 font-bold'
                          } mr-1`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="text-unsil-green-400/80 shrink-0">
                          {isSubMenuOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
                          {item.label}
                          {item.badge && ` (${item.badge})`}
                        </div>
                      )}
                    </button>

                    {/* Sub Menu Items */}
                    {!isCollapsed && isSubMenuOpen && (
                      <div className="pl-4 pr-1 py-1 space-y-1 ml-3 border-l-2 border-unsil-green-800/60 my-1 animate-in fade-in duration-150">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isSubActive =
                            activeTab === child.id ||
                            (child.id === 'settings' && activeTab === 'manajemen-user');
                          return (
                            <a
                              key={child.id}
                              href={getPathFromTab(child.id)}
                              onClick={(e) => {
                                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                                  e.preventDefault();
                                  setActiveTab(child.id);
                                  if (toggleSidebar && window.innerWidth < 768) {
                                    toggleSidebar();
                                  }
                                }
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                                isSubActive
                                  ? 'bg-gradient-to-r from-unsil-green-700 to-unsil-green-600 text-white font-semibold shadow-xs border-l-2 border-unsil-gold-400 pl-2.5'
                                  : 'text-unsil-green-200/80 hover:text-white hover:bg-unsil-green-900/60'
                              }`}
                            >
                              <ChildIcon
                                className={`w-4 h-4 shrink-0 ${
                                  isSubActive
                                    ? 'text-unsil-gold-400'
                                    : 'text-unsil-green-400'
                                }`}
                              />
                              <span className="truncate flex-1">{child.label}</span>
                              {child.badge && (
                                <span
                                  className={`text-[10px] min-w-[18px] h-4 px-1.5 rounded-full font-bold flex items-center justify-center shrink-0 ${
                                    child.badgeColor || 'bg-yellow-400 text-slate-950 font-bold'
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={item.id}
                  href={getPathFromTab(item.id)}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                      e.preventDefault();
                      setActiveTab(item.id);
                      if (toggleSidebar && window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-unsil-green-700 to-unsil-green-600 text-white shadow-md shadow-unsil-green-950/40 border-l-4 border-unsil-gold-400 pl-2.5'
                      : 'text-slate-300 hover:text-white hover:bg-unsil-green-900/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
                      isActive
                        ? 'text-unsil-gold-400'
                        : 'text-unsil-green-400/80 group-hover:text-unsil-gold-300 group-hover:scale-105'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      className="text-[11px] min-w-[20px] h-5 px-1.5 rounded-full shrink-0 flex items-center justify-center font-bold shadow-xs bg-yellow-400 text-slate-950"
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
                      {item.label}
                      {item.badge && ` (${item.badge})`}
                    </div>
                  )}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-unsil-green-900/60 bg-unsil-green-950/90 shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-unsil-green-900/40 border border-unsil-green-800/50 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-unsil-green-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  Server BKU UNSIL
                </div>
                <div className="text-[10px] text-unsil-green-400/90">Koneksi Aman Terenkripsi</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-unsil-green-300/80 px-1">
              <span>UNSIL Siloka v1.0</span>
              <a
                href="https://unsil.ac.id"
                target="_blank"
                rel="noreferrer"
                className="hover:text-unsil-gold-300 flex items-center gap-0.5 transition-colors"
              >
                Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  if (toggleSidebar && window.innerWidth < 768) {
                    toggleSidebar();
                  }
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                title="Keluar dari Akun SILOKA"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Sesi</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-unsil-green-400 animate-pulse" title="Server Online" />
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-400 transition"
                title="Keluar Sesi"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

