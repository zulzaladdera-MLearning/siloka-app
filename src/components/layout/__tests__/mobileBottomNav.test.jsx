import { describe, it, expect } from 'vitest';
import { buildMobileNavItems } from '../MobileBottomNav';

describe('MobileBottomNav (SILOKA UNSIL Role-based Navigation)', () => {
  const superAdminUser = {
    role: 'Super Admin',
    is_super_admin: true
  };

  const pejabatUser = {
    role: 'PEJABAT',
    is_pejabat: true
  };

  it('harus menyembunyikan Disposisi & E-Paraf/TTE dan menampilkan Pengaturan untuk Super Admin', () => {
    const items = buildMobileNavItems({
      user: superAdminUser,
      unreadCounts: { disposisi: 3, tte: 5, suratMasuk: 10 }
    });

    const itemIds = items.map((i) => i.id);
    expect(itemIds).not.toContain('disposisi');
    expect(itemIds).not.toContain('paraf-tte');
    expect(itemIds).toContain('dashboard');
    expect(itemIds).toContain('surat-masuk');
    expect(itemIds).toContain('surat-keluar');
    expect(itemIds).toContain('settings');
    expect(itemIds).toContain('menu');
  });

  it('harus tetap menampilkan Disposisi & E-Paraf/TTE untuk Pejabat Struktural', () => {
    const items = buildMobileNavItems({
      user: pejabatUser,
      unreadCounts: { disposisi: 3, tte: 5, suratMasuk: 10 }
    });

    const itemIds = items.map((i) => i.id);
    expect(itemIds).toContain('dashboard');
    expect(itemIds).toContain('disposisi');
    expect(itemIds).toContain('paraf-tte');
    expect(itemIds).toContain('surat-masuk');
    expect(itemIds).toContain('menu');
    expect(itemIds).not.toContain('settings');
  });
});
