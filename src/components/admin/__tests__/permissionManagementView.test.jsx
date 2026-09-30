import { describe, it, expect } from 'vitest';
import { ROLES_LIST, DEFAULT_PERMISSION_CATEGORIES } from '../PermissionManagementView';

describe('PermissionManagementView Data Integrity (SILOKA UNSIL)', () => {
  it('harus memuat tepat 6 Role resmi sesuai spesifikasi', () => {
    expect(ROLES_LIST).toHaveLength(6);
    const roleIds = ROLES_LIST.map((r) => r.id);
    expect(roleIds).toContain('super_admin');
    expect(roleIds).toContain('admin_tu');
    expect(roleIds).toContain('pimpinan');
    expect(roleIds).toContain('verifikator');
    expect(roleIds).toContain('dosen_drafter');
    expect(roleIds).toContain('auditor_spi');
  });

  it('harus memuat 4 Kategori Permisi domain SILOKA UNSIL', () => {
    expect(DEFAULT_PERMISSION_CATEGORIES).toHaveLength(4);
    const catTitles = DEFAULT_PERMISSION_CATEGORIES.map((c) => c.title);
    expect(catTitles).toContain('Sistem & Akses');
    expect(catTitles).toContain('Tata Naskah Dinas & Drafting');
    expect(catTitles).toContain('E-Disposisi & Surat Masuk');
    expect(catTitles).toContain('Kearsipan & Hak Akses Rahasia (SKKAAD)');
  });

  it('harus memverifikasi izin Impersonate hanya untuk Super Administrator', () => {
    const sistemCat = DEFAULT_PERMISSION_CATEGORIES.find((c) => c.id === 'sistem');
    const impersonatePerm = sistemCat.permissions.find((p) => p.slug === 'user.impersonate');
    expect(impersonatePerm.allowedRoles).toEqual(['super_admin']);
  });

  it('harus memverifikasi izin TTE hanya untuk Super Admin dan Pimpinan', () => {
    const naskahCat = DEFAULT_PERMISSION_CATEGORIES.find((c) => c.id === 'naskah');
    const ttePerm = naskahCat.permissions.find((p) => p.slug === 'naskah.tte');
    expect(ttePerm.allowedRoles).toContain('super_admin');
    expect(ttePerm.allowedRoles).toContain('pimpinan');
    expect(ttePerm.allowedRoles).not.toContain('dosen_drafter');
    expect(ttePerm.allowedRoles).not.toContain('admin_tu');
  });

  it('harus memverifikasi izin Surat Rahasia untuk Super Admin, Pimpinan, dan Auditor SPI', () => {
    const kearsipanCat = DEFAULT_PERMISSION_CATEGORIES.find((c) => c.id === 'kearsipan');
    const rahasiaPerm = kearsipanCat.permissions.find((p) => p.slug === 'arsip.view_rahasia');
    expect(rahasiaPerm.allowedRoles).toContain('super_admin');
    expect(rahasiaPerm.allowedRoles).toContain('pimpinan');
    expect(rahasiaPerm.allowedRoles).toContain('auditor_spi');
    expect(rahasiaPerm.allowedRoles).not.toContain('admin_tu');
  });
});
