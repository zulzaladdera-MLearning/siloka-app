import React from 'react';
import {
  LayoutDashboard,
  SendHorizontal,
  FileSignature,
  Mail,
  Archive,
  Vault,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  unreadCounts = { disposisi: 3, tte: 5, retensi: 14 }
}) => {
  const menuItems = [
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
      badgeColor: 'bg-unsil-gold-500 text-unsil-green-950 font-bold',
    },
    {
      id: 'paraf-tte',
      label: 'E-Paraf & TTE',
      icon: FileSignature,
      badge: unreadCounts.tte > 0 ? unreadCounts.tte : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'pengendalian-surat',
      label: 'Pengendalian Surat',
      icon: Mail,
      badge: null,
    },
    {
      id: 'retensi-arsip',
      label: 'Retensi Arsip',
      icon: Archive,
      badge: unreadCounts.retensi > 0 ? unreadCounts.retensi : null,
      badgeColor: 'bg-amber-100 text-amber-900 font-semibold',
    },
    {
      id: 'brankas-digital',
      label: 'Brankas Digital',
      icon: Vault,
      badge: 'Enkripsi',
      badgeColor: 'bg-emerald-800 text-emerald-100 text-[10px]',
    },
    {
      id: 'audit-log',
      label: 'Log Audit & Keamanan',
      icon: ShieldCheck,
      badge: 'BSSN',
      badgeColor: 'bg-emerald-900 text-unsil-gold-300 font-mono text-[9px]',
    },
    {
      id: 'settings',
      label: 'Pengaturan Sistem',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out bg-unsil-green-950 border-r border-unsil-green-900/60 flex flex-col justify-between text-white ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div>
        {isCollapsed ? (
          <div className="h-16 flex items-center justify-center border-b border-unsil-green-900/60 bg-unsil-green-900/30 relative">
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
          <div className="h-16 flex items-center justify-between px-4 border-b border-unsil-green-900/60 bg-unsil-green-900/30">
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
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-unsil-green-300 hover:text-white hover:bg-unsil-green-800/60 transition-colors"
              title="Ciutkan Sidebar"
              aria-label="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="px-3 py-4">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-unsil-green-300/80">
              Menu Utama
            </div>
          )}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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
                      className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeColor || 'bg-unsil-green-800 text-unsil-green-200'
                      }`}
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
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-unsil-green-900/60 bg-unsil-green-950/90">
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
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-3 h-3 rounded-full bg-unsil-green-400 animate-pulse" title="Server Online" />
          </div>
        )}
      </div>
    </aside>
  );
};

