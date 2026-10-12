import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PERMISSION_MATRIX,
  AVAILABLE_PERMISSIONS_CATALOG,
  getPermissionMatrix,
  savePermissionMatrix,
  getRolesCatalog,
  saveRolesCatalog,
  hasUserPermission,
  isSlugActive,
  toggleSlugWithAlias
} from '../../../utils/rbacSyncService';
import { ROLES_LIST, DEFAULT_PERMISSION_CATEGORIES } from '../PermissionManagementView';

describe('Penyelarasan 100% Matriks 4 Kategori & 22 Izin SILOKA UNSIL (Gambar 1 vs Pertor No. 3/2023)', () => {
  // Mock localStorage in-memory
  let localStore = {};
  beforeEach(() => {
    localStore = {};
    globalThis.localStorage = {
      getItem: (key) => localStore[key] || null,
      setItem: (key, val) => {
        localStore[key] = String(val);
      },
      removeItem: (key) => {
        delete localStore[key];
      },
      clear: () => {
        localStore = {};
      }
    };
  });

  it('memastikan tepat 4 kategori dan total tepat 22 hak akses pada Matriks & Katalog', () => {
    expect(DEFAULT_PERMISSION_MATRIX).toHaveLength(4);
    expect(AVAILABLE_PERMISSIONS_CATALOG).toHaveLength(4);

    const matrixTotalPerms = DEFAULT_PERMISSION_MATRIX.reduce(
      (sum, cat) => sum + cat.permissions.length,
      0
    );
    const catalogTotalPerms = AVAILABLE_PERMISSIONS_CATALOG.reduce(
      (sum, cat) => sum + cat.items.length,
      0
    );

    expect(matrixTotalPerms).toBe(22);
    expect(catalogTotalPerms).toBe(22);
  });

  it('memastikan urutan, judul kategori, dan rincian kuota izin identik 100% dengan Gambar 1', () => {
    const expectedCategories = [
      { id: 'sistem', title: 'Sistem & Administrasi', count: 6 },
      { id: 'naskah', title: 'Tata Naskah Dinas & Drafting', count: 6 },
      { id: 'surat_masuk_disposisi', title: 'E-Disposisi & Agenda', count: 6 },
      { id: 'kearsipan', title: 'Kearsipan & Klasifikasi JRA/SKKAAD', count: 4 }
    ];

    DEFAULT_PERMISSION_MATRIX.forEach((cat, idx) => {
      const exp = expectedCategories[idx];
      expect(cat.id).toBe(exp.id);
      expect(cat.title).toBe(exp.title);
      expect(cat.permissions).toHaveLength(exp.count);
    });

    AVAILABLE_PERMISSIONS_CATALOG.forEach((cat, idx) => {
      const exp = expectedCategories[idx];
      expect(cat.category).toBe(exp.title);
      expect(cat.items).toHaveLength(exp.count);
    });
  });

  it('memastikan label penamaan 22 hak akses selaras identik antara Matriks dan Form Pengaturan Peran', () => {
    DEFAULT_PERMISSION_MATRIX.forEach((matrixCat, cIdx) => {
      const catalogCat = AVAILABLE_PERMISSIONS_CATALOG[cIdx];
      expect(matrixCat.title).toBe(catalogCat.category);

      matrixCat.permissions.forEach((matrixPerm, pIdx) => {
        const catalogItem = catalogCat.items[pIdx];
        expect(matrixPerm.name).toBe(catalogItem.name);
        expect(matrixPerm.description).toBe(catalogItem.description);
      });
    });
  });

  it('memastikan Separation of Duties Pertor UNSIL No. 3/2023: Super Admin terkunci dari 4 aksi operasional kedinasan', () => {
    const superAdminUser = {
      id: 'usr-admin',
      role: 'SUPER_ADMIN',
      is_super_admin: true
    };

    // 4 Aksi Operasional Kedinasan yang wajib false untuk Super Admin
    expect(hasUserPermission(superAdminUser, 'naskah.tte')).toBe(false);
    expect(hasUserPermission(superAdminUser, 'naskah.tte_sign')).toBe(false);
    expect(hasUserPermission(superAdminUser, 'disposisi.create')).toBe(false);
    expect(hasUserPermission(superAdminUser, 'surat_masuk.register')).toBe(false);
    expect(hasUserPermission(superAdminUser, 'naskah.draft')).toBe(false);
    expect(hasUserPermission(superAdminUser, 'naskah.create_draft')).toBe(false);

    // Namun memiliki akses administratif sistem
    expect(hasUserPermission(superAdminUser, 'admin.access')).toBe(true);
    expect(hasUserPermission(superAdminUser, 'role.manage')).toBe(true);
    expect(hasUserPermission(superAdminUser, 'unit.manage')).toBe(true);
    expect(hasUserPermission(superAdminUser, 'audit.view')).toBe(true);
  });

  it('memastikan interaktivitas toggle dan sinkronisasi alias dua arah', () => {
    let slugs = ['dashboard.view'];

    // Toggle on naskah.tte
    slugs = toggleSlugWithAlias(slugs, 'naskah.tte');
    expect(slugs).toContain('naskah.tte');
    expect(slugs).toContain('naskah.tte_sign');
    expect(isSlugActive(slugs, 'naskah.tte')).toBe(true);
    expect(isSlugActive(slugs, 'naskah.tte_sign')).toBe(true);

    // Toggle off via alias naskah.tte_sign
    slugs = toggleSlugWithAlias(slugs, 'naskah.tte_sign');
    expect(slugs).not.toContain('naskah.tte');
    expect(slugs).not.toContain('naskah.tte_sign');
    expect(isSlugActive(slugs, 'naskah.tte')).toBe(false);
    expect(isSlugActive(slugs, 'naskah.tte_sign')).toBe(false);
  });

  it('memastikan sinkronisasi dua arah antara Matriks Izin dan Katalog Peran Pengguna', () => {
    const currentRoles = getRolesCatalog();
    const currentMatrix = getPermissionMatrix();

    // 1. Simpan perubahan dari sisi Katalog Role
    const updatedRoles = currentRoles.map((r) => {
      if (r.slug === 'pimpinan') {
        return {
          ...r,
          keySlugs: [...r.keySlugs, 'arsip.jra_manage']
        };
      }
      return r;
    });
    saveRolesCatalog(updatedRoles);

    const matrixAfterRoleSave = getPermissionMatrix();
    const kearsipanCat = matrixAfterRoleSave.find((c) => c.id === 'kearsipan');
    const jraPerm = kearsipanCat.permissions.find((p) => p.slug === 'arsip.jra_manage');
    expect(jraPerm.allowedRoles).toContain('pimpinan');

    // 2. Simpan perubahan dari sisi Matriks Permission
    const updatedMatrix = matrixAfterRoleSave.map((cat) => {
      if (cat.id === 'sistem') {
        return {
          ...cat,
          permissions: cat.permissions.map((p) => {
            if (p.slug === 'audit.view') {
              return {
                ...p,
                allowedRoles: [...p.allowedRoles, 'admin_tu']
              };
            }
            return p;
          })
        };
      }
      return cat;
    });
    savePermissionMatrix(updatedMatrix);

    const rolesAfterMatrixSave = getRolesCatalog();
    const tuRole = rolesAfterMatrixSave.find((r) => r.slug === 'admin_tu');
    expect(tuRole.keySlugs).toContain('audit.view');
  });

  it('memastikan interoperabilitas identitas Dosen / Staff Drafter antara drafter dan dosen_drafter', () => {
    const dosenUser = {
      id: 'usr-dosen-1',
      role: 'DOSEN',
      role_slug: 'drafter',
      is_pejabat: false
    };

    // Dosen berwenang menyusun draft mandiri
    expect(hasUserPermission(dosenUser, 'naskah.create_mandiri')).toBe(true);
    expect(hasUserPermission(dosenUser, 'naskah.draft')).toBe(true);
    expect(hasUserPermission(dosenUser, 'naskah.create_draft')).toBe(true);

    // Dosen tidak berwenang TTE Pejabat atau disposisi
    expect(hasUserPermission(dosenUser, 'naskah.tte')).toBe(false);
    expect(hasUserPermission(dosenUser, 'disposisi.create')).toBe(false);
  });
});
