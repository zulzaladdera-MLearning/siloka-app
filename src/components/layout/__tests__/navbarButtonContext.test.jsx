import { describe, it, expect } from 'vitest';
import { getNavbarActionConfig } from '../Navbar';

describe('Navbar Dynamic Action Button (Contextual Action Label & RBAC Visibility)', () => {
  it('harus menghasilkan label "Registrasi Surat" saat pengguna berada di tab surat-masuk', () => {
    const config = getNavbarActionConfig('surat-masuk');

    expect(config.isSuratMasukTab).toBe(true);
    expect(config.createButtonLabel).toBe('Registrasi Surat');
    expect(config.createButtonTitle).toBe('Registrasi Surat Masuk Resmi');
  });

  it('harus menghasilkan label "Buat Surat" saat pengguna berada di tab lain (dashboard / surat-keluar)', () => {
    const dashboardConfig = getNavbarActionConfig('dashboard');
    expect(dashboardConfig.isSuratMasukTab).toBe(false);
    expect(dashboardConfig.createButtonLabel).toBe('Buat Surat');
    expect(dashboardConfig.createButtonTitle).toBe('Buat Naskah Surat Baru');

    const suratKeluarConfig = getNavbarActionConfig('surat-keluar');
    expect(suratKeluarConfig.isSuratMasukTab).toBe(false);
    expect(suratKeluarConfig.createButtonLabel).toBe('Buat Surat');
    expect(suratKeluarConfig.createButtonTitle).toBe('Buat Naskah Surat Baru');
  });

  describe('Penegakan Matriks RBAC Tombol Registrasi Surat Masuk (Dihapus dari DOM)', () => {
    const superAdminUser = {
      id: 'usr-dg-01',
      role: 'Super Admin',
      is_super_admin: true,
      roleLevel: 'Level 0: Administrator Sistem'
    };

    const stafTuUser = {
      id: 'usr-ac-01',
      role: 'STAF',
      role_slug: 'admin_tu',
      is_pejabat: false,
      roleLevel: 'Level 2: Pelaksana Administrasi'
    };

    const pejabatUser = {
      id: 'usr-ar-01',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      roleLevel: 'Level 1: Pimpinan'
    };

    const dosenUser = {
      id: 'usr-dosen-01',
      role: 'DOSEN',
      role_slug: 'drafter',
      is_pejabat: false,
      jabatan: 'Dosen Biasa Teknik Informatika'
    };

    it('Staf TU melihat tombol Registrasi Surat di tab surat-masuk', () => {
      const stafConfig = getNavbarActionConfig('surat-masuk', stafTuUser);
      expect(stafConfig.isActionVisible).toBe(true);
    });

    it('Super Admin, Pejabat Struktural & Dosen Fungsional DIHAPUS TOTAL dari DOM (isActionVisible = false) di tab surat-masuk', () => {
      const superAdminConfig = getNavbarActionConfig('surat-masuk', superAdminUser);
      expect(superAdminConfig.isActionVisible).toBe(false);

      const pejabatConfig = getNavbarActionConfig('surat-masuk', pejabatUser);
      expect(pejabatConfig.isActionVisible).toBe(false);

      const dosenConfig = getNavbarActionConfig('surat-masuk', dosenUser);
      expect(dosenConfig.isActionVisible).toBe(false);
    });

    it('Pengguna operasional (Staf, Dosen, Pejabat) melihat tombol Buat Surat, sedangkan Super Admin terkunci', () => {
      expect(getNavbarActionConfig('surat-keluar', pejabatUser).isActionVisible).toBe(true);
      expect(getNavbarActionConfig('surat-keluar', dosenUser).isActionVisible).toBe(true);
      expect(getNavbarActionConfig('surat-keluar', stafTuUser).isActionVisible).toBe(true);
      expect(getNavbarActionConfig('surat-keluar', superAdminUser).isActionVisible).toBe(false);
    });
  });
});
