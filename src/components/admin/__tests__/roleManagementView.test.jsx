import { describe, it, expect } from 'vitest';
import { INITIAL_ROLES_DATA } from '../RoleManagementView';

describe('RoleManagementView Data Integrity & SKKAAD Restriction (SILOKA UNSIL)', () => {
  it('harus memuat tepat 5 Role standar SILOKA sesuai spesifikasi', () => {
    expect(INITIAL_ROLES_DATA).toHaveLength(5);
    const slugs = INITIAL_ROLES_DATA.map((r) => r.slug);
    expect(slugs).toContain('super_admin');
    expect(slugs).toContain('admin_tu');
    expect(slugs).toContain('pimpinan');
    expect(slugs).toContain('verifikator');
    expect(slugs).toContain('drafter');
  });

  it('harus memverifikasi detail role Super Administrator', () => {
    const superAdmin = INITIAL_ROLES_DATA.find((r) => r.slug === 'super_admin');
    expect(superAdmin.name).toBe('Super Administrator');
    expect(superAdmin.permissionCount).toBe(32);
    expect(superAdmin.userCount).toBe(2);
    expect(superAdmin.keySlugs).toContain('user.impersonate');
    expect(superAdmin.keySlugs).toContain('arsip.jra_manage');
  });

  it('harus memverifikasi wewenang TTE dan Disposisi pada Pimpinan', () => {
    const pimpinan = INITIAL_ROLES_DATA.find((r) => r.slug === 'pimpinan');
    expect(pimpinan.keySlugs).toContain('naskah.tte_sign');
    expect(pimpinan.keySlugs).toContain('disposisi.create');
    expect(pimpinan.keySlugs).toContain('arsip.view_rahasia');
  });

  it('harus memverifikasi wewenang Paraf Verifikasi pada Verifikator', () => {
    const verifikator = INITIAL_ROLES_DATA.find((r) => r.slug === 'verifikator');
    expect(verifikator.keySlugs).toContain('naskah.verify_paraf');
    expect(verifikator.keySlugs).toContain('draft.return_koreksi');
    expect(verifikator.keySlugs).not.toContain('naskah.tte_sign');
  });

  it('harus memverifikasi hak akses mandiri dan draf pada Dosen / Staff Drafter', () => {
    const drafter = INITIAL_ROLES_DATA.find((r) => r.slug === 'drafter');
    expect(drafter.keySlugs).toContain('naskah.create_draft');
    expect(drafter.keySlugs).toContain('naskah.create_mandiri');
    expect(drafter.keySlugs).not.toContain('naskah.tte_sign');
    expect(drafter.keySlugs).not.toContain('disposisi.create');
  });
});
