import { describe, it, expect } from 'vitest';
import {
  buildSidebarMenuItems,
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  STORAGE_KEY_SIDEBAR_WIDTH
} from '../Sidebar';

describe('Sidebar Menu Structure & Resizable Contract (SILOKA UNSIL)', () => {
  it('harus mendefinisikan parameter batas lebar sidebar yang ergonomis dan aman', () => {
    expect(DEFAULT_SIDEBAR_WIDTH).toBe(256);
    expect(MIN_SIDEBAR_WIDTH).toBe(240);
    expect(MAX_SIDEBAR_WIDTH).toBe(420);
    expect(STORAGE_KEY_SIDEBAR_WIDTH).toBe('siloka_sidebar_width');
  });
  it('harus memuat menu induk "Surat" dengan sub-menu "Surat Masuk" dan "Surat Keluar"', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'PEJABAT' },
      unreadCounts: { suratMasuk: 141, disposisi: 3, tte: 5, retensi: 14 }
    });

    const suratMenu = items.find((item) => item.id === 'surat');
    expect(suratMenu).toBeDefined();
    expect(suratMenu.label).toBe('Surat');
    expect(suratMenu.badge).toBe(141);
    expect(Array.isArray(suratMenu.children)).toBe(true);
    expect(suratMenu.children).toHaveLength(2);

    const suratMasukChild = suratMenu.children.find((c) => c.id === 'surat-masuk');
    expect(suratMasukChild).toBeDefined();
    expect(suratMasukChild.label).toBe('Surat Masuk');
    expect(suratMasukChild.badge).toBe(141);

    const suratKeluarChild = suratMenu.children.find((c) => c.id === 'surat-keluar');
    expect(suratKeluarChild).toBeDefined();
    expect(suratKeluarChild.label).toBe('Surat Keluar');
  });

  it('tidak boleh menyajikan "surat-masuk" dan "surat-keluar" sebagai menu tingkat atas (top-level)', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'Super Admin' },
      unreadCounts: { suratMasuk: 10 }
    });

    const topLevelIds = items.map((i) => i.id);
    expect(topLevelIds).not.toContain('surat-masuk');
    expect(topLevelIds).not.toContain('surat-keluar');
    expect(topLevelIds).toContain('surat');
  });

  it('harus tetap memuat menu induk "Manajemen" dengan 5 sub-menu untuk Super Admin dan penamaan selaras', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'Super Admin' },
      unreadCounts: {}
    });

    const manajemenMenu = items.find((item) => item.id === 'manajemen');
    expect(manajemenMenu).toBeDefined();
    expect(manajemenMenu.children).toHaveLength(5);
    const childIds = manajemenMenu.children.map((c) => c.id);
    expect(childIds).toEqual([
      'settings',
      'manajemen-unit',
      'manajemen-role',
      'manajemen-permission',
      'manajemen-disposisi'
    ]);

    const labels = manajemenMenu.children.map((c) => c.label);
    expect(labels).toEqual([
      'Manajemen Pengguna',
      'Manajemen Unit Kerja',
      'Manajemen Peran',
      'Hak Akses & Izin Pengguna',
      'Manajemen Alur Disposisi'
    ]);
  });

  it('tidak boleh menampilkan badge "Aman" pada menu Brankas Digital', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'Super Admin' },
      unreadCounts: {}
    });

    const brankasItem = items.find((item) => item.id === 'brankas-digital');
    expect(brankasItem).toBeDefined();
    expect(brankasItem.badge).toBeNull();
  });

  it('tidak boleh memuat menu induk "Manajemen" untuk role yang bukan Super Admin', () => {
    const nonAdminRoles = [
      { role: 'PEJABAT' },
      { role: 'DOSEN' },
      { role: 'STAFF', permissions: ['admin:manage_users', 'admin.access'] },
      { role: 'ADMIN_TU', permissions: ['admin.access'] },
      { role: 'PENGAWAS' }
    ];

    for (const user of nonAdminRoles) {
      const items = buildSidebarMenuItems({ user, unreadCounts: {} });
      const manajemenMenu = items.find((item) => item.id === 'manajemen');
      expect(manajemenMenu).toBeUndefined();
    }
  });

  it('harus menyembunyikan menu E-Disposisi dan E-Paraf & TTE untuk akun Super Admin', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'Super Admin', is_super_admin: true },
      unreadCounts: { disposisi: 3, tte: 5 }
    });

    const topLevelIds = items.map((i) => i.id);
    expect(topLevelIds).not.toContain('disposisi');
    expect(topLevelIds).not.toContain('paraf-tte');
  });

  it('harus tetap memuat menu E-Disposisi dan E-Paraf & TTE untuk Pejabat Struktural', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'PEJABAT', is_pejabat: true },
      unreadCounts: { disposisi: 3, tte: 5 }
    });

    const topLevelIds = items.map((i) => i.id);
    expect(topLevelIds).toContain('disposisi');
    expect(topLevelIds).toContain('paraf-tte');
  });
});
