import { describe, it, expect } from 'vitest';
import { buildSidebarMenuItems } from '../Sidebar';

describe('Sidebar Menu Structure (SILOKA UNSIL)', () => {
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

  it('harus tetap memuat menu induk "Manajemen" dengan 3 sub-menu untuk Super Admin', () => {
    const items = buildSidebarMenuItems({
      user: { role: 'Super Admin' },
      unreadCounts: {}
    });

    const manajemenMenu = items.find((item) => item.id === 'manajemen');
    expect(manajemenMenu).toBeDefined();
    expect(manajemenMenu.children).toHaveLength(3);
    const childIds = manajemenMenu.children.map((c) => c.id);
    expect(childIds).toEqual(['settings', 'manajemen-role', 'manajemen-permission']);
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
});
