import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  SendHorizontal,
  FileSignature,
  Inbox,
  Send,
  Settings,
  Menu
} from 'lucide-react';
import { isSuperAdminUser } from '../../utils/authGuards';
import { hasUserPermission, RBAC_CHANGE_EVENT } from '../../utils/rbacSyncService';

export const buildMobileNavItems = ({
  user,
  unreadCounts = { disposisi: 3, tte: 5 },
  onOpenMobileMenu
}) => {
  const isSuperAdmin = isSuperAdminUser(user);

  if (isSuperAdmin) {
    return [
      {
        id: 'dashboard',
        label: 'Beranda',
        icon: LayoutDashboard,
        badge: null
      },
      {
        id: 'surat-masuk',
        label: 'Surat Masuk',
        icon: Inbox,
        badge: unreadCounts.suratMasuk > 0 ? unreadCounts.suratMasuk : null,
        badgeColor: 'bg-yellow-400 text-slate-950 font-bold'
      },
      {
        id: 'surat-keluar',
        label: 'Surat Keluar',
        icon: Send,
        badge: null
      },
      {
        id: 'settings',
        label: 'Pengaturan',
        icon: Settings,
        badge: null
      },
      {
        id: 'menu',
        label: 'Menu',
        icon: Menu,
        badge: null,
        isAction: true,
        onClick: onOpenMobileMenu
      }
    ];
  }

  const items = [];

  // 1. Beranda / Dashboard
  items.push({
    id: 'dashboard',
    label: 'Beranda',
    icon: LayoutDashboard,
    badge: null
  });

  // 2. Disposisi (hanya jika memiliki hak akses)
  const canDisposisi =
    !isSuperAdmin &&
    (hasUserPermission(user, 'disposisi.read') ||
      hasUserPermission(user, 'disposisi.create') ||
      hasUserPermission(user, 'disposisi.forward'));

  if (canDisposisi) {
    items.push({
      id: 'disposisi',
      label: 'Disposisi',
      icon: SendHorizontal,
      badge: unreadCounts.disposisi > 0 ? unreadCounts.disposisi : null,
      badgeColor: 'bg-unsil-gold-500 text-unsil-green-950'
    });
  }

  // 3. E-Paraf & TTE (hanya jika memiliki hak akses)
  const canParafTte =
    !isSuperAdmin &&
    (hasUserPermission(user, 'naskah.tte') ||
      hasUserPermission(user, 'naskah.verify'));

  if (canParafTte) {
    items.push({
      id: 'paraf-tte',
      label: 'E-Paraf/TTE',
      icon: FileSignature,
      badge: unreadCounts.tte > 0 ? unreadCounts.tte : null,
      badgeColor: 'bg-rose-500 text-white'
    });
  }

  // 4. Surat Masuk
  items.push({
    id: 'surat-masuk',
    label: 'Surat Masuk',
    icon: Inbox,
    badge: unreadCounts.suratMasuk > 0 ? unreadCounts.suratMasuk : null,
    badgeColor: 'bg-yellow-400 text-slate-950 font-bold'
  });

  // 5. Surat Keluar (jika slot masih tersisa sebelum Menu)
  if (items.length < 4) {
    items.push({
      id: 'surat-keluar',
      label: 'Surat Keluar',
      icon: Send,
      badge: null
    });
  }

  // 6. Menu Drawer (selalu di ujung kanan)
  items.push({
    id: 'menu',
    label: 'Menu',
    icon: Menu,
    badge: null,
    isAction: true,
    onClick: onOpenMobileMenu
  });

  return items.slice(0, 5);
};

export const MobileBottomNav = ({
  user,
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  unreadCounts = { disposisi: 3, tte: 5 }
}) => {
  const [, setRbacVersion] = useState(0);
  useEffect(() => {
    const handleRbac = () => setRbacVersion((v) => v + 1);
    window.addEventListener(RBAC_CHANGE_EVENT, handleRbac);
    return () => window.removeEventListener(RBAC_CHANGE_EVENT, handleRbac);
  }, []);

  const navItems = buildMobileNavItems({ user, unreadCounts, onOpenMobileMenu });

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none transition-all duration-200"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))'
      }}
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !item.isAction;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.isAction && item.onClick) {
                  item.onClick();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-unsil-green-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active indicator bar top */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-unsil-green-800 rounded-full shadow-xs animate-in fade-in duration-200" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative mt-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-unsil-green-900' : 'text-slate-500'
                  }`}
                />
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                      item.badgeColor || 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[58px] ${
                  isActive ? 'font-bold text-unsil-green-950' : 'font-medium text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

