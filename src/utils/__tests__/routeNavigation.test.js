import { describe, it, expect } from 'vitest';
import {
  TAB_PATH_MAP,
  PATH_TAB_MAP,
  normalizePath,
  getTabFromPathname,
  getPathFromTab
} from '../routeNavigation';

describe('routeNavigation - Pemetaan URL & Sinkronisasi Rute Menu SILOKA', () => {
  it('harus memetakan seluruh tab menu utama ke path URL yang representatif', () => {
    expect(getPathFromTab('dashboard')).toBe('/dashboard');
    expect(getPathFromTab('disposisi')).toBe('/disposisi');
    expect(getPathFromTab('paraf-tte')).toBe('/paraf-tte');
    expect(getPathFromTab('surat-masuk')).toBe('/surat-masuk');
    expect(getPathFromTab('surat-keluar')).toBe('/surat-keluar');
    expect(getPathFromTab('buku-agenda')).toBe('/buku-agenda');
    expect(getPathFromTab('retensi-arsip')).toBe('/retensi-arsip');
    expect(getPathFromTab('brankas-digital')).toBe('/brankas-digital');
    expect(getPathFromTab('manajemen-user')).toBe('/manajemen-pengguna');
    expect(getPathFromTab('settings')).toBe('/manajemen-pengguna');
    expect(getPathFromTab('manajemen-role')).toBe('/manajemen-peran');
    expect(getPathFromTab('manajemen-permission')).toBe('/hak-akses');
  });

  it('harus mengenali tab berdasarkan path URL saat ini', () => {
    expect(getTabFromPathname('/')).toBe('dashboard');
    expect(getTabFromPathname('/dashboard')).toBe('dashboard');
    expect(getTabFromPathname('/disposisi')).toBe('disposisi');
    expect(getTabFromPathname('/paraf-tte')).toBe('paraf-tte');
    expect(getTabFromPathname('/surat-masuk')).toBe('surat-masuk');
    expect(getTabFromPathname('/surat-keluar')).toBe('surat-keluar');
    expect(getTabFromPathname('/retensi-arsip')).toBe('retensi-arsip');
    expect(getTabFromPathname('/brankas-digital')).toBe('brankas-digital');
    expect(getTabFromPathname('/manajemen-pengguna')).toBe('manajemen-user');
    expect(getTabFromPathname('/manajemen-peran')).toBe('manajemen-role');
    expect(getTabFromPathname('/hak-akses')).toBe('manajemen-permission');
  });

  it('harus menangani alias path lama secara aman', () => {
    expect(getTabFromPathname('/manajemen-user')).toBe('manajemen-user');
    expect(getTabFromPathname('/settings')).toBe('manajemen-user');
    expect(getTabFromPathname('/manajemen-role')).toBe('manajemen-role');
    expect(getTabFromPathname('/manajemen-permission')).toBe('manajemen-permission');
  });

  it('harus menormalisasi path dengan trailing slash atau query param', () => {
    expect(normalizePath('/surat-masuk/')).toBe('/surat-masuk');
    expect(normalizePath('/dashboard?filter=all')).toBe('/dashboard');
    expect(normalizePath('/retensi-arsip/#top')).toBe('/retensi-arsip');
    expect(getTabFromPathname('/surat-masuk/')).toBe('surat-masuk');
  });

  it('mengembalikan null untuk path yang tidak dikenal', () => {
    expect(getTabFromPathname('/halaman-antah-berantah')).toBeNull();
  });
});
