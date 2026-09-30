import { describe, it, expect, beforeEach, vi } from 'vitest';

// Polyfill window & localStorage for Node test runner
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

if (typeof global.window === 'undefined') {
  global.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type, params) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}
global.localStorage = mockStorage;

import {
  DEFAULT_CANONICAL_ROLES,
  DEFAULT_PERMISSION_MATRIX,
  getRolesCatalog,
  getPermissionMatrix,
  saveRolesCatalog,
  savePermissionMatrix,
  resolveUserRoleSlug,
  getUserEffectivePermissions,
  hasUserPermission,
  computeUserCountPerRole,
  RBAC_CHANGE_EVENT
} from '../rbacSyncService';

describe('RBAC Synchronization Service & Matrix Engine (SILOKA UNSIL)', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Inisialisasi & Fallback Katalog & Matriks', () => {
    it('mengembalikan DEFAULT_CANONICAL_ROLES saat storage kosong', () => {
      const roles = getRolesCatalog();
      expect(roles).toHaveLength(5);
      expect(roles[0].slug).toBe('super_admin');
    });

    it('mengembalikan DEFAULT_PERMISSION_MATRIX saat storage kosong', () => {
      const matrix = getPermissionMatrix();
      expect(matrix).toHaveLength(4);
      expect(matrix.map((c) => c.id)).toContain('sistem');
      expect(matrix.map((c) => c.id)).toContain('naskah');
      expect(matrix.map((c) => c.id)).toContain('disposisi');
      expect(matrix.map((c) => c.id)).toContain('kearsipan');
    });
  });

  describe('2. Sinkronisasi Dua Arah (Bidirectional Synchronization)', () => {
    it('memperbarui Matriks Permission saat Katalog Role disimpan (saveRolesCatalog)', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const initialRoles = getRolesCatalog();
      // Tambahkan izin naskah.numbering ke role drafter
      const updatedRoles = initialRoles.map((r) => {
        if (r.slug === 'drafter') {
          return {
            ...r,
            keySlugs: [...r.keySlugs, 'naskah.numbering']
          };
        }
        return r;
      });

      saveRolesCatalog(updatedRoles);

      expect(dispatchSpy).toHaveBeenCalled();
      const customEventCall = dispatchSpy.mock.calls.find(
        (c) => c[0] && c[0].type === RBAC_CHANGE_EVENT
      );
      expect(customEventCall).toBeDefined();

      const updatedMatrix = getPermissionMatrix();
      const naskahCat = updatedMatrix.find((c) => c.id === 'naskah');
      const numberingPerm = naskahCat.permissions.find((p) => p.slug === 'naskah.numbering');
      expect(numberingPerm.allowedRoles).toContain('drafter');
    });

    it('memperbarui Katalog Role saat Matriks Permission disimpan (savePermissionMatrix)', () => {
      const initialMatrix = getPermissionMatrix();

      // Tambahkan role drafter ke izin audit.view
      const updatedMatrix = initialMatrix.map((cat) => {
        if (cat.id === 'sistem') {
          return {
            ...cat,
            permissions: cat.permissions.map((p) => {
              if (p.slug === 'audit.view') {
                return {
                  ...p,
                  allowedRoles: [...p.allowedRoles, 'drafter']
                };
              }
              return p;
            })
          };
        }
        return cat;
      });

      savePermissionMatrix(updatedMatrix);

      const updatedRoles = getRolesCatalog();
      const drafterRole = updatedRoles.find((r) => r.slug === 'drafter');
      expect(drafterRole.keySlugs).toContain('audit.view');
    });
  });

  describe('3. Resolusi Peran Pengguna (resolveUserRoleSlug)', () => {
    it('mengenali role_slug eksplisit jika sudah disetel', () => {
      expect(resolveUserRoleSlug({ role_slug: 'pimpinan' })).toBe('pimpinan');
      expect(resolveUserRoleSlug({ role_slug: 'verifikator' })).toBe('verifikator');
      expect(resolveUserRoleSlug({ role_slug: 'admin_tu' })).toBe('admin_tu');
    });

    it('mengenali Super Administrator', () => {
      expect(resolveUserRoleSlug({ role: 'Super Admin' })).toBe('super_admin');
      expect(resolveUserRoleSlug({ is_super_admin: true })).toBe('super_admin');
    });

    it('mengenali Pimpinan dari jabatan struktural (Rektor, Dekan, Kepala Biro)', () => {
      expect(resolveUserRoleSlug({ jabatan: 'Rektor Universitas Siliwangi' })).toBe('pimpinan');
      expect(resolveUserRoleSlug({ jabatan: 'Dekan Fakultas Teknik' })).toBe('pimpinan');
      expect(resolveUserRoleSlug({ jabatan: 'Kepala Biro Keuangan dan Umum' })).toBe('pimpinan');
    });

    it('mengenali Verifikator dari jabatan hierarki (Wadek, Kajur, Kaprodi, Kabag)', () => {
      expect(resolveUserRoleSlug({ jabatan: 'Wakil Dekan Bidang Akademik' })).toBe('verifikator');
      expect(resolveUserRoleSlug({ jabatan: 'Ketua Jurusan Teknik Informatika' })).toBe('verifikator');
      expect(resolveUserRoleSlug({ jabatan: 'Koordinator Program Studi Teknik Sipil' })).toBe('verifikator');
    });

    it('mengenali Administrator TU / Pengendali Surat', () => {
      expect(resolveUserRoleSlug({ role: 'OPERATOR_UNIT', jabatan: 'Operator Tata Usaha' })).toBe('admin_tu');
      expect(resolveUserRoleSlug({ role: 'STAF_PERSURATAN' })).toBe('admin_tu');
      expect(resolveUserRoleSlug({ jabatan: 'Pengendali Surat Kearsipan' })).toBe('admin_tu');
    });

    it('mengenali Auditor / SPI', () => {
      expect(resolveUserRoleSlug({ role: 'PENGAWAS', jabatan: 'Auditor SPI' })).toBe('auditor_spi');
      expect(resolveUserRoleSlug({ unit: 'Satuan Pengawas Internal (SPI)' })).toBe('auditor_spi');
    });

    it('fallback ke drafter untuk Dosen Biasa / Staf Umum', () => {
      expect(resolveUserRoleSlug({ role: 'DOSEN', jabatan: 'Dosen' })).toBe('drafter');
      expect(resolveUserRoleSlug(null)).toBe('drafter');
    });
  });

  describe('4. Evaluasi Hak Akses Efektif (getUserEffectivePermissions & hasUserPermission)', () => {
    it('memberikan seluruh hak akses untuk Super Administrator', () => {
      const superUser = { role: 'Super Admin' };
      const permissions = getUserEffectivePermissions(superUser);
      expect(permissions).toContain('user.impersonate');
      expect(permissions).toContain('arsip.view_rahasia');
      expect(permissions).toContain('naskah.tte');
      expect(hasUserPermission(superUser, 'user.impersonate')).toBe(true);
      expect(hasUserPermission(superUser, 'arsip.view_rahasia')).toBe(true);
    });

    it('memberikan hak TTE BSrE dan Disposisi hanya untuk Pimpinan', () => {
      const pimpinanUser = { role_slug: 'pimpinan', jabatan: 'Dekan Fakultas Teknik' };
      expect(hasUserPermission(pimpinanUser, 'naskah.tte')).toBe(true);
      expect(hasUserPermission(pimpinanUser, 'naskah.tte_sign')).toBe(true); // alias
      expect(hasUserPermission(pimpinanUser, 'disposisi.create')).toBe(true);
      expect(hasUserPermission(pimpinanUser, 'arsip.view_rahasia')).toBe(true);
      expect(hasUserPermission(pimpinanUser, 'user.impersonate')).toBe(false);
    });

    it('memberikan hak Paraf Verifikasi dan melarang TTE untuk Verifikator', () => {
      const verifikatorUser = { role_slug: 'verifikator', jabatan: 'Wakil Dekan' };
      expect(hasUserPermission(verifikatorUser, 'naskah.verify')).toBe(true);
      expect(hasUserPermission(verifikatorUser, 'naskah.verify_paraf')).toBe(true);
      expect(hasUserPermission(verifikatorUser, 'naskah.tte')).toBe(false);
      expect(hasUserPermission(verifikatorUser, 'disposisi.create')).toBe(false);
    });

    it('memberikan hak draf & naskah mandiri dan melarang TTE & Verifikasi untuk Dosen Drafter', () => {
      const dosenUser = { role_slug: 'drafter', role: 'DOSEN', jabatan: 'Dosen' };
      expect(hasUserPermission(dosenUser, 'naskah.draft')).toBe(true);
      expect(hasUserPermission(dosenUser, 'naskah.create_draft')).toBe(true);
      expect(hasUserPermission(dosenUser, 'naskah.create_mandiri')).toBe(true);
      expect(hasUserPermission(dosenUser, 'naskah.tte')).toBe(false);
      expect(hasUserPermission(dosenUser, 'naskah.verify')).toBe(false);
      expect(hasUserPermission(dosenUser, 'arsip.view_rahasia')).toBe(false);
    });

    it('menghormati custom permissions khusus yang diberikan pada profil user', () => {
      const dosenWithSpecialPerm = {
        role_slug: 'drafter',
        permissions: ['audit.view']
      };
      expect(hasUserPermission(dosenWithSpecialPerm, 'audit.view')).toBe(true);
      expect(hasUserPermission(dosenWithSpecialPerm, 'naskah.tte')).toBe(false);
    });
  });

  describe('5. Kalkulasi Jumlah Pengguna per Role (computeUserCountPerRole)', () => {
    it('menghitung distribusi pengguna dengan akurat dan mengabaikan akun dummy', () => {
      const usersList = [
        { id: 'usr-admin-01', name: 'Administrator Utama SILOKA' }, // dummy -> diabaikan
        { id: 'usr-real-admin', role: 'Super Admin' },
        { id: 'usr-rektor', jabatan: 'Rektor Universitas Siliwangi' },
        { id: 'usr-dekan', jabatan: 'Dekan Fakultas Teknik' },
        { id: 'usr-wadek', jabatan: 'Wakil Dekan FT' },
        { id: 'usr-tu', role: 'OPERATOR_UNIT', jabatan: 'Operator TU' },
        { id: 'usr-dosen-1', role: 'DOSEN', jabatan: 'Dosen' },
        { id: 'usr-dosen-2', role: 'DOSEN', jabatan: 'Dosen' },
        { id: 'usr-spi', role: 'PENGAWAS', jabatan: 'Auditor SPI' }
      ];

      const counts = computeUserCountPerRole(usersList);
      expect(counts.super_admin).toBe(1);
      expect(counts.pimpinan).toBe(2); // rektor + dekan
      expect(counts.verifikator).toBe(1); // wadek
      expect(counts.admin_tu).toBe(1); // tu
      expect(counts.drafter).toBe(2); // 2 dosen
      expect(counts.auditor_spi).toBe(1); // spi
    });
  });
});
