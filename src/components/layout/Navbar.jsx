import React, { useState, useMemo } from 'react';
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
import { isDisposisiAuthorizedOfficial } from '../../utils/disposisiStandards';

export const Navbar = ({
  user,
  onLogout,
  onSwitchUser,
  allUsers = [],
  onOpenCreateLetter,
  onOpenQuickDisposisi,
  searchQuery,
  setSearchQuery,
  unreadCount,
  toggleSidebar,
  onToggleMobileSidebar,
  letters = [],
  onSelectLetter
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleToggle = toggleSidebar || onToggleMobileSidebar;

  const isPejabat = user?.role === 'PEJABAT' || user?.role === 'PIMPINAN' || user?.is_pejabat === true;

  // Feature 8: Real-Time Dynamic Notifications Engine
  const notifications = useMemo(() => {
    const list = [];

    // 1. Antrean TTE / Approval untuk Pejabat & Pimpinan
    if (isPejabat) {
      letters.forEach((l) => {
        if (l.kategori !== 'Surat Masuk' && !l.tteVerified && (l.status === 'Diparaf' || l.status === 'DRAFT_MENUNGGU_PARAF' || l.tujuan_aksi === 'TTD')) {
          list.push({
            id: `tte-${l.id}`,
            letter: l,
            title: l.tujuan_aksi === 'TTD' ? '✍️ Permohonan TTE Menunggu TTD' : 'Antrean Review & TTE Pimpinan',
            desc: `${l.nomorSurat}: ${l.perihal?.slice(0, 60)}...`,
            time: l.statusTimestamp || 'Baru saja',
            urgent: l.sifat === 'Amat Segera' || l.sifat === 'Segera' || l.tujuan_aksi === 'TTD'
          });
        }
      });
    }

    // 2. Disposisi Diterima untuk Unit / Role / Akun Pejabat Pengguna
    letters.forEach((l) => {
      if (l.disposisi) {
        const targetDesc = String(l.disposisi.tujuanDisposisi || l.disposisi.targetUnit || '').toLowerCase();
        const targetUserId = String(l.disposisi.target_user_id || '');
        const targetEmail = String(l.disposisi.target_user_email || '').toLowerCase().trim();
        const targetNip = String(l.disposisi.target_pejabat_nip || '').trim();
        const userIdStr = String(user?.id || user?.id_user || '');
        const userEmailLower = String(user?.email || '').toLowerCase().trim();
        const userNip = String(user?.nip || user?.nip_nik || '').trim();
        const userJabatanLower = String(user?.jabatan || user?.roleLabel || '').toLowerCase();

        const isTargeted =
          (targetUserId && userIdStr && targetUserId === userIdStr) ||
          (targetEmail && userEmailLower && targetEmail === userEmailLower) ||
          (targetNip && userNip && targetNip === userNip) ||
          (userJabatanLower && (targetDesc.includes(userJabatanLower) || userJabatanLower.includes(targetDesc))) ||
          (user?.unit_kerja_id && targetDesc.includes(String(user.unit_kerja_id).toLowerCase()));

        if (isTargeted) {
          const pemberi = l.disposisi.pemberiDisposisi || l.disposisi.jabatanPemberi || 'Pimpinan';
          list.push({
            id: `disp-${l.id}`,
            letter: l,
            title: `📩 E-Disposisi dari ${pemberi}`,
            desc: `${l.perihal?.slice(0, 50)}... • Arahan: ${l.disposisi.actions?.join(', ') || l.disposisi.instruksi || 'Tindak lanjuti'}`,
            time: l.disposisi.batasWaktu ? `Batas: ${l.disposisi.batasWaktu}` : 'Hari ini',
            urgent: l.disposisi.sifatInstruksi === 'Sangat Segera' || l.disposisi.sifatInstruksi === 'Segera' || l.sifat === 'Segera'
          });
        }
      }
    });

    // 3. Surat Masuk Baru untuk Pejabat Terkait & Unit Pengguna
    letters.forEach((l) => {
      if (l.kategori === 'Surat Masuk') {
        const userJabatanLower = String(user?.jabatan || user?.roleLabel || '').toLowerCase();
        const letterTujuanLower = String(l.target_jabatan || l.tujuan || '').toLowerCase();
        const userEmailLower = String(user?.email || '').toLowerCase();
        const userIdStr = String(user?.id || user?.id_user || '');

        const isLetterForRektor =
          (letterTujuanLower.includes('rektor') && !letterTujuanLower.includes('wakil') && !letterTujuanLower.includes('warek')) ||
          String(l.target_user_id) === 'usr-01';

        const isUserRektor =
          (userJabatanLower.includes('rektor') && !userJabatanLower.includes('wakil') && !userJabatanLower.includes('warek')) ||
          userIdStr === 'usr-01' ||
          userEmailLower.includes('aripin');

        const isDirectTargetOfficial =
          (l.target_user_id && String(l.target_user_id) === userIdStr) ||
          (l.target_user_email && userEmailLower && String(l.target_user_email).toLowerCase() === userEmailLower) ||
          (l.target_pejabat_nip && (user?.nip || user?.nip_nik) && String(l.target_pejabat_nip) === String(user?.nip || user?.nip_nik)) ||
          (isLetterForRektor && isUserRektor) ||
          (isPejabat && userJabatanLower && letterTujuanLower && (userJabatanLower === letterTujuanLower || letterTujuanLower.includes(userJabatanLower)));

        const isMyUnit =
          !isPejabat &&
          user?.unit_kerja_id &&
          (String(l.unit_kerja_id) === String(user.unit_kerja_id) || String(l.target_unit_id) === String(user.unit_kerja_id));

        if (isDirectTargetOfficial || isMyUnit) {
          const senderStaff = l.creator_name || 'Staf Tata Usaha Loket';
          list.push({
            id: `inbound-${l.id}`,
            letter: l,
            title: isDirectTargetOfficial ? '📥 Surat Masuk Baru Menunggu Disposisi' : '📥 Registrasi Surat Masuk Unit',
            desc: `Didaftarkan oleh ${senderStaff} • No. Asal: ${l.nomorSuratAsal || l.nomor_surat_asal || '-'} dari ${l.pengirim} (${l.perihal?.slice(0, 50)}...)`,
            time: l.tanggalTerima || l.tanggal || 'Hari ini',
            urgent: l.sifat === 'Amat Segera' || l.sifat === 'Segera' || l.sifat === 'Penting'
          });
        }
      }
    });

    // Default notifications jika antrean dinas kosong
    if (list.length === 0) {
      list.push(
        {
          id: 'def-1',
          title: 'Sistem Terhubung',
          desc: 'Semua naskah dinas dan agenda disposisi terkontrol secara real-time.',
          time: 'Baru saja',
          urgent: false
        }
      );
    }

    return list.slice(0, 8);
  }, [letters, user, isPejabat]);

  const activeUnreadCount = unreadCount !== undefined ? unreadCount : notifications.length;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left Search & Mobile Toggle */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {handleToggle && (
          <button
            onClick={handleToggle}
            className="block md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
            aria-label="Buka Menu Sidebar"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5 text-slate-700" />
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
            placeholder="Cari surat, pengirim, perihal..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-unsil-green-700 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-unsil-green-800/20 transition duration-150"
          />
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 ml-2 sm:ml-4 shrink-0">
        {/* Mobile Quick Add Button */}
        <button
          onClick={onOpenCreateLetter}
          className="lg:hidden p-2 rounded-lg bg-unsil-green-800 text-white hover:bg-unsil-green-900 shadow-xs active:scale-95 transition-all"
          title="Buat Naskah Surat Baru"
          aria-label="Buat Surat Baru"
        >
          <Plus className="w-4 h-4 text-unsil-gold-400" />
        </button>

        {/* Quick Action Buttons Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          {isDisposisiAuthorizedOfficial(user) && (
            <button
              onClick={onOpenQuickDisposisi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-unsil-green-900 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <SendHorizontal className="w-3.5 h-3.5 text-unsil-green-700" />
              <span>Disposisi Cepat</span>
            </button>
          )}

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
            {activeUnreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {activeUnreadCount}
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
                  {activeUnreadCount} Baru
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      if (n.letter && onSelectLetter) {
                        onSelectLetter(n.letter);
                      }
                    }}
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-unsil-green-900 text-unsil-gold-300">
                    {user.roleLabel || user.role}
                  </span>
                  {user.signatureReady && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> TTE BSrE
                    </span>
                  )}
                </div>
              </div>

              {onSwitchUser && (
                <div className="p-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                    Beralih Akun Pengguna
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {allUsers.slice(0, 6).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          user.id === u.id
                            ? 'bg-unsil-green-800 text-white font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate max-w-[140px]">{u.name || u.nama_lengkap}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          user.id === u.id ? 'bg-unsil-gold-400 text-unsil-green-950 font-bold' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

