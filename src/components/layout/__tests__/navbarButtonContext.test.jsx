import { describe, it, expect } from 'vitest';
import { getNavbarActionConfig } from '../Navbar';

describe('Navbar Dynamic Action Button (Contextual Action Label)', () => {
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
});
