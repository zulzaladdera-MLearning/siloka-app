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
  Menu,
  ArrowLeftRight,
  GraduationCap,
  Briefcase
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

  // Mekanisme 5: Sakelar Profil (Context Switcher) untuk Dosen dengan Tugas Tambahan (Pejabat Akademik)
  const dualRoleContext = useMemo(() => {
    if (!user || user.role === 'SUPER_ADMIN' || user.role === 'STAF' || user.role === 'ADMIN_UNIT') {
      return null;
    }

    const explicitDual = user.dual_role_profiles;
    if (explicitDual && explicitDual.mode_pejabat_tugas_tambahan) {
      const skInfo = user.rbac_five_mechanisms?.mekanisme_5_context_switcher_and_sk?.sk_auto_expiration || {};
      return {
        hasDualRole: true,
        activeMode: user.active_context_mode || (isPejabat ? 'MODE_PEJABAT' : 'MODE_DOSEN'),
        isSkExpired: Boolean(skInfo.is_expired),
        skLabel: skInfo.status_label || 'SK Aktif',
        nomorSk: skInfo.nomor_sk || 'SK Penugasan KP.04.04',
        modeDosen: explicitDual.mode_dosen,
        modePejabat: explicitDual.mode_pejabat_tugas_tambahan
      };
    }

    // Default Dual-Mode untuk Pejabat Dosen UNSIL (Dekan, Rektor, Warek, Kepala Lembaga, Kajur)
    if (isPejabat || user.saved_pejabat_snapshot) {
      const snap = user.saved_pejabat_snapshot || {
        role: user.role,
        roleLabel: user.roleLabel,
        jabatan: user.jabatan || user.roleLabel,
        unit: user.unit,
        unit_kerja_id: user.unit_kerja_id,
        kode_unit: user.kode_unit,
        signatureReady: user.signatureReady !== false,
        permissions: user.permissions || [
          'SIGN_SURAT_KELUAR_UNIT',
          'DISPOSISI_SURAT_MASUK',
          'VERIFY_PARAF_BERJENJANG',
          'ACCESS_BRANKAS_DIGITAL',
          'READ_SKKAAD_RAHASIA'
        ]
      };

      return {
        hasDualRole: true,
        activeMode: user.active_context_mode || (isPejabat ? 'MODE_PEJABAT' : 'MODE_DOSEN'),
        isSkExpired: false,
        skLabel: 'SK Aktif (KP.04.04)',
        nomorSk: 'SK Rektor UNSIL / OTK',
        modeDosen: {
          mode_id: 'MODE_DOSEN',
          label: 'Mode Dosen (Tridharma)',
          role: 'DOSEN',
          roleLabel: 'Dosen Fungsional (Homebase)',
          jabatan: 'Dosen Pengajar / Peneliti',
          unit_kerja_id: snap.unit_kerja_id || 'UN58.13',
          unit_nama: snap.unit || 'Fakultas Homebase',
          is_pejabat: false,
          signatureReady: false,
          permissions: ['CREATE_DRAFT_SURAT', 'VIEW_PERSONAL_SURAT', 'SIGN_NOTA_DINAS_PRIBADI']
        },
        modePejabat: {
          mode_id: 'MODE_PEJABAT',
          label: `Mode ${snap.roleLabel || snap.jabatan}`,
          role: snap.role || 'PEJABAT',
          roleLabel: snap.roleLabel || snap.jabatan,
          jabatan: snap.jabatan || snap.roleLabel,
          unit_kerja_id: snap.unit_kerja_id,
          unit_nama: snap.unit,
          is_pejabat: true,
          signatureReady: true,
          permissions: snap.permissions
        },
        savedSnapshot: snap
      };
    }

    return null;
  }, [user, isPejabat]);

  const handleToggleContextMode = (targetModeId) => {
    if (!dualRoleContext || !onSwitchUser) return;
    if (targetModeId === 'MODE_PEJABAT' && dualRoleContext.isSkExpired) return;

    const snap = dualRoleContext.savedSnapshot || {
      role: dualRoleContext.modePejabat.role,
      roleLabel: dualRoleContext.modePejabat.roleLabel,
      jabatan: dualRoleContext.modePejabat.jabatan,
      unit: dualRoleContext.modePejabat.unit_nama || user.unit,
      unit_kerja_id: dualRoleContext.modePejabat.unit_kerja_id || user.unit_kerja_id,
      kode_unit: user.kode_unit,
      signatureReady: true,
      permissions: dualRoleContext.modePejabat.permissions
    };

    if (targetModeId === 'MODE_DOSEN') {
      const md = dualRoleContext.modeDosen;
      onSwitchUser({
        ...user,
        active_context_mode: 'MODE_DOSEN',
        saved_pejabat_snapshot: snap,
        role: 'DOSEN',
        roleLabel: md.roleLabel || 'Dosen (Tridharma)',
        jabatan: md.jabatan || 'Dosen Fungsional',
        is_pejabat: false,
        signatureReady: false,
        permissions: md.permissions
      });
    } else {
      const mp = dualRoleContext.modePejabat;
      onSwitchUser({
        ...user,
        active_context_mode: 'MODE_PEJABAT',
        saved_pejabat_snapshot: snap,
        role: mp.role || 'PEJABAT',
        roleLabel: mp.roleLabel || mp.jabatan,
        jabatan: mp.jabatan || mp.roleLabel,
        unit: mp.unit_nama || snap.unit,
        unit_kerja_id: mp.unit_kerja_id || snap.unit_kerja_id,
        is_pejabat: true,
        signatureReady: true,
        permissions: mp.permissions
      });
    }
  };

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

    // 2. Disposisi Diterima untuk Unit / Role Pengguna
    letters.forEach((l) => {
      if (l.disposisi) {
        const targetDesc = l.disposisi.tujuanDisposisi || l.disposisi.targetUnit || '';
        const isTargeted =
          (user?.unit_kerja_id && targetDesc.includes(user.unit_kerja_id)) ||
          (user?.roleLabel && targetDesc.includes(user.roleLabel));
        if (isTargeted) {
          list.push({
            id: `disp-${l.id}`,
            letter: l,
            title: '📩 E-Disposisi Pimpinan Diterima',
            desc: `${l.perihal?.slice(0, 50)}... Instruksi: ${l.disposisi.instruksi?.slice(0, 45)}`,
            time: l.disposisi.batasWaktu ? `Batas: ${l.disposisi.batasWaktu}` : 'Hari ini',
            urgent: true
          });
        }
      }
    });

    // 3. Surat Masuk Baru untuk Unit Pengguna
    letters.forEach((l) => {
      if (l.kategori === 'Surat Masuk') {
        const isMyUnit =
          (user?.unit_kerja_id && (l.tujuan?.includes(user.unit_kerja_id) || l.unit_kerja_id === user.unit_kerja_id)) ||
          (user?.roleLabel && l.tujuan?.includes(user.roleLabel));
        if (isMyUnit && list.length < 6) {
          list.push({
            id: `inbound-${l.id}`,
            letter: l,
            title: '📥 Registrasi Surat Masuk',
            desc: `Dari: ${l.pengirim} - ${l.perihal?.slice(0, 50)}...`,
            time: l.tanggal || 'Hari ini',
            urgent: l.sifat === 'Segera'
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

        {/* Mekanisme 5: Sakelar Profil (Context Switcher) di Pojok Kanan Atas untuk Dosen dengan Tugas Tambahan */}
        {dualRoleContext?.hasDualRole && (
          <div
            className="hidden xl:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs"
            title={`Ganti Peran Tampilan — ${dualRoleContext.nomorSk} (${dualRoleContext.skLabel})`}
          >
            <button
              type="button"
              onClick={() => handleToggleContextMode('MODE_DOSEN')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dualRoleContext.activeMode === 'MODE_DOSEN'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mode Dosen</span>
            </button>
            <button
              type="button"
              disabled={dualRoleContext.isSkExpired}
              onClick={() => handleToggleContextMode('MODE_PEJABAT')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dualRoleContext.isSkExpired
                  ? 'opacity-50 cursor-not-allowed text-rose-700 bg-rose-50'
                  : dualRoleContext.activeMode === 'MODE_PEJABAT'
                  ? 'bg-unsil-green-900 text-unsil-gold-300 shadow-xs'
                  : 'text-slate-600 hover:text-unsil-green-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span className="truncate max-w-[130px]">
                {dualRoleContext.isSkExpired
                  ? 'SK Berakhir (Nonaktif)'
                  : `Mode ${dualRoleContext.modePejabat.roleLabel || 'Pejabat'}`}
              </span>
            </button>
          </div>
        )}

        {/* Quick Action Buttons Desktop */}
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

              {dualRoleContext?.hasDualRole && (
                <div className="p-2.5 border-b border-slate-100 bg-emerald-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-unsil-green-900 flex items-center gap-1">
                      <ArrowLeftRight className="w-3 h-3" /> Ganti Peran (Tugas Tambahan)
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        dualRoleContext.isSkExpired
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {dualRoleContext.skLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleContextMode('MODE_DOSEN');
                        setShowProfileMenu(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                        dualRoleContext.activeMode === 'MODE_DOSEN'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Mode Dosen</span>
                    </button>
                    <button
                      type="button"
                      disabled={dualRoleContext.isSkExpired}
                      onClick={() => {
                        handleToggleContextMode('MODE_PEJABAT');
                        setShowProfileMenu(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                        dualRoleContext.isSkExpired
                          ? 'bg-rose-50 text-rose-500 border-rose-200 cursor-not-allowed'
                          : dualRoleContext.activeMode === 'MODE_PEJABAT'
                          ? 'bg-unsil-green-900 text-unsil-gold-300 border-unsil-green-950 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="truncate">Mode Pejabat</span>
                    </button>
                  </div>
                </div>
              )}

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

