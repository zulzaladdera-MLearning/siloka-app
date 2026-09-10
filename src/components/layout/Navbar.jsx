import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  SendHorizontal,
  LogOut,
  ChevronDown,
  FileText,
  Clock,
  Shield,
  Menu
} from 'lucide-react';

export const Navbar = ({
  user,
  onLogout,
  onSwitchUser,
  allUsers = [],
  onOpenCreateLetter,
  onOpenQuickDisposisi,
  searchQuery,
  setSearchQuery,
  unreadCount = 3,
  onToggleMobileSidebar
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Antrean TTE Prioritas',
      desc: 'Pengadaan Server Cadangan Mugarsari menunggu tanda tangan elektronik Anda.',
      time: '10 menit yang lalu',
      urgent: true,
    },
    {
      id: 2,
      title: 'Surat Masuk Baru',
      desc: 'Nota Dinas dari LPPM perihal insentif Scopus TA 2026.',
      time: '45 menit yang lalu',
      urgent: false,
    },
    {
      id: 3,
      title: 'Jadwal Retensi Arsip (JRA)',
      desc: '14 Berkas inaktif Fakultas telah memenuhi masa retensi 5 tahun.',
      time: '2 jam yang lalu',
      urgent: false,
    },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left Search & Mobile Toggle */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor surat, perihal, pengirim, atau kode klasifikasi..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-unsil-green-700 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 transition duration-150"
          />
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        {/* Quick Action Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onOpenQuickDisposisi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-unsil-green-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-unsil-green-700" />
            <span>Disposisi Cepat</span>
          </button>

          <button
            onClick={onOpenCreateLetter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-unsil-gold-400" />
            <span>Buat Surat</span>
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Pemberitahuan"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">
                  Notifikasi Sistem SILOKA
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  {unreadCount} Baru
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">
                        {n.title}
                      </p>
                      {n.urgent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {n.desc}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {n.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-unsil-green-800 hover:underline"
                >
                  Tandai semua telah dibaca
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="relative">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-unsil-green-700/30 select-none pointer-events-none protected-asset"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate max-w-[150px]">
                {user.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="text-unsil-green-800 font-semibold">{user.roleLabel}</span>
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Current Profile Card */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">{user.nama_lengkap || user.name}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIP. {user.nip_nik || user.nip}</p>
                <p className="text-[11px] text-unsil-green-800 font-mono font-medium">{user.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-900 font-medium">
                  <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">
                    {user.unit_kerja_id || 'UN58'}
                  </span>
                  <span className="truncate">{user.unit}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-unsil-green-900 text-unsil-gold-300 font-mono">
                    {user.role}
                  </span>
                  {user.signatureReady && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> TTE BSrE
                    </span>
                  )}
                </div>
              </div>

              {/* Logout button */}
              <div className="p-1">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun SILOKA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

