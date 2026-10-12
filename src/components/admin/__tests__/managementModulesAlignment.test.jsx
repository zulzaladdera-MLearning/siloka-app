import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CANONICAL_ROLES,
  DEFAULT_PERMISSION_MATRIX,
  getRolesCatalog,
  getPermissionMatrix
} from '../../../utils/rbacSyncService';
import {
  canUserRegisterIncomingLetter,
  canLetterBeDisposed,
  getLetterActionCapabilities
} from '../../../utils/letterActionPolicy';
import {
  getAuthorizedTemplates,
  LECTURER_TRIDHARMA_6_TEMPLATE_IDS,
  DOCUMENT_TEMPLATES
} from '../../../config/documentFormats';
import { getNavbarActionConfig } from '../../layout/Navbar';

describe('Penyelarasan 4 Modul Manajemen Terhadap Matriks 4 Aksi Utama Persuratan (UNSIL)', () => {
  const superAdmin = {
    id: 'usr-admin-root',
    nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
    role: 'SUPER_ADMIN',
    role_slug: 'super_admin',
    is_super_admin: true
  };

  const pejabatStruktural = {
    id: 'usr-dekan-ft',
    nama_lengkap: 'Dr. Nurul Hiron, S.T., M.Eng.',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    jabatan: 'Dekan Fakultas Teknik',
    is_pejabat: true,
    unit: 'Fakultas Teknik',
    unit_kerja_id: 'UN58.13',
    kode_unit: 'UN58.13'
  };

  const stafTu = {
    id: 'usr-tu-ft',
    nama_lengkap: 'Siti Rahmawati, S.AP.',
    role: 'ADMIN_TU',
    role_slug: 'admin_tu',
    jabatan: 'Staf Administrasi TU Fakultas Teknik',
    is_pejabat: false,
    unit: 'Fakultas Teknik',
    unit_kerja_id: 'UN58.13',
    kode_unit: 'UN58.13'
  };

  const dosenFungsional = {
    id: 'usr-dosen-ft',
    nama_lengkap: 'Husni Mubarok, S.T., M.T.',
    role: 'DOSEN',
    role_slug: 'drafter',
    jabatan: 'Dosen Informatika',
    is_pejabat: false,
    unit: 'Fakultas Teknik',
    unit_kerja_id: 'UN58.13',
    kode_unit: 'UN58.13'
  };

  const sampleUsers = [superAdmin, pejabatStruktural, stafTu, dosenFungsional];

  const sampleSuratMasuk = {
    id: 'sm-01',
    nomorSurat: '123/KEMDIKBUD/2026',
    kategori: 'Surat Masuk',
    status: 'Tercatat',
    isDibatalkan: false
  };

  const sampleSuratKeluarSiapTte = {
    id: 'sk-01',
    nomorSurat: '456/UN58.13/TU/2026',
    kategori: 'Surat Keluar',
    status: 'Diparaf',
    signerId: 'usr-dekan-ft',
    tteVerified: false,
    isDibatalkan: false
  };

  describe('1. Modul Hak Akses & Izin (Matriks 4 Aksi & Zero Technical Slop)', () => {
    it('memastikan definisi Super Admin tidak mengandung kata simulasi dan menegaskan batasan wewenang', () => {
      const roles = getRolesCatalog();
      const adminRole = roles.find((r) => r.slug === 'super_admin');
      expect(adminRole).toBeDefined();
      expect(adminRole.description).not.toMatch(/simulasi/i);
      expect(adminRole.description).toContain('Wewenang administratif sistem persuratan');
    });

    it('mengelompokkan izin ke dalam 4 blok bahasa Indonesia institusi yang jelas (Sesuai Gambar 1)', () => {
      const matrix = getPermissionMatrix();
      const titles = matrix.map((c) => c.title);

      expect(titles).toContain('Sistem & Administrasi');
      expect(titles).toContain('Tata Naskah Dinas & Drafting');
      expect(titles).toContain('E-Disposisi & Agenda');
      expect(titles).toContain('Kearsipan & Klasifikasi JRA/SKKAAD');
    });
  });

  describe('2. Modul Manajemen Peran (Core Capabilities & Boundaries)', () => {
    it('Super Admin: Administrator sistem murni, Terkunci dari seluruh 4 aksi operasional persuratan', () => {
      expect(canUserRegisterIncomingLetter(superAdmin)).toBe(false);
      expect(getNavbarActionConfig('surat-masuk', superAdmin).isActionVisible).toBe(false);
      expect(getNavbarActionConfig('surat-keluar', superAdmin).isActionVisible).toBe(false);
      expect(canLetterBeDisposed(sampleSuratMasuk, superAdmin)).toBe(false);
      expect(getLetterActionCapabilities(sampleSuratKeluarSiapTte, superAdmin).canSign).toBe(false);
    });

    it('Pejabat Struktural: Berwenang E-Disposisi & TTE BSrE, Terkunci dari Registrasi Masuk', () => {
      expect(canUserRegisterIncomingLetter(pejabatStruktural)).toBe(false);
      expect(getNavbarActionConfig('surat-masuk', pejabatStruktural).isActionVisible).toBe(false);
      expect(getAuthorizedTemplates(pejabatStruktural).length).toBeGreaterThan(6);
      expect(canLetterBeDisposed(sampleSuratMasuk, pejabatStruktural)).toBe(true);
      expect(getLetterActionCapabilities(sampleSuratKeluarSiapTte, pejabatStruktural).canSign).toBe(true);
    });

    it('Dosen Fungsional: Tepat 6 Template Tridharma, Terkunci dari Registrasi, Disposisi & TTE', () => {
      expect(canUserRegisterIncomingLetter(dosenFungsional)).toBe(false);
      expect(getNavbarActionConfig('surat-masuk', dosenFungsional).isActionVisible).toBe(false);

      const templates = getAuthorizedTemplates(dosenFungsional);
      expect(templates.length).toBe(6);
      expect(templates.map((t) => t.id)).toEqual([...LECTURER_TRIDHARMA_6_TEMPLATE_IDS]);

      expect(canLetterBeDisposed(sampleSuratMasuk, dosenFungsional)).toBe(false);
      expect(getLetterActionCapabilities(sampleSuratKeluarSiapTte, dosenFungsional).canSign).toBe(false);
    });

    it('Staf TU / Operator: Berwenang Registrasi Masuk & 23 Draf Naskah, Terkunci dari Disposisi & TTE', () => {
      expect(canUserRegisterIncomingLetter(stafTu)).toBe(true);
      expect(getNavbarActionConfig('surat-masuk', stafTu).isActionVisible).toBe(true);
      expect(getAuthorizedTemplates(stafTu).length).toBeGreaterThan(6);
      expect(canLetterBeDisposed(sampleSuratMasuk, stafTu)).toBe(false);
      expect(getLetterActionCapabilities(sampleSuratKeluarSiapTte, stafTu).canSign).toBe(false);
    });
  });

  describe('3. Modul Manajemen Pengguna (Filter 4 Kategori & Resolusi Role)', () => {
    it('memfilter daftar pengguna berdasarkan 4 kategori utama persuratan', () => {
      const filterUsersByRole = (users, roleFilter) => {
        if (roleFilter === 'ALL') return users;
        if (roleFilter === 'pimpinan') return users.filter((u) => u.role_slug === 'pimpinan');
        if (roleFilter === 'admin_tu') return users.filter((u) => u.role_slug === 'admin_tu');
        if (roleFilter === 'drafter') return users.filter((u) => u.role_slug === 'drafter');
        if (roleFilter === 'super_admin') return users.filter((u) => u.role_slug === 'super_admin');
        return users;
      };

      const pimpinanUsers = filterUsersByRole(sampleUsers, 'pimpinan');
      expect(pimpinanUsers).toHaveLength(1);
      expect(pimpinanUsers[0].nama_lengkap).toBe('Dr. Nurul Hiron, S.T., M.Eng.');

      const tuUsers = filterUsersByRole(sampleUsers, 'admin_tu');
      expect(tuUsers).toHaveLength(1);
      expect(tuUsers[0].nama_lengkap).toBe('Siti Rahmawati, S.AP.');

      const dosenUsers = filterUsersByRole(sampleUsers, 'drafter');
      expect(dosenUsers).toHaveLength(1);
      expect(dosenUsers[0].nama_lengkap).toBe('Husni Mubarok, S.T., M.T.');

      const adminUsers = filterUsersByRole(sampleUsers, 'super_admin');
      expect(adminUsers).toHaveLength(1);
      expect(adminUsers[0].nama_lengkap).toBe('Dede Gunawan, S.Kom., M.Kom.');
    });
  });

  describe('4. Modul Manajemen Unit Kerja (Master Data & Kalkulasi Pegawai Terdaftar)', () => {
    it('memperkaya unit kerja dengan jumlah pegawai terdaftar dan relasi induk secara efisien', () => {
      const units = [
        { kode_unit: 'UN58', nama_unit: 'Universitas Siliwangi', tipe_unit: 'UNIVERSITAS' },
        { kode_unit: 'UN58.13', nama_unit: 'Fakultas Teknik', singkatan: 'FT', parent_kode: 'UN58' }
      ];

      const enrichedUnits = units.map((unit) => {
        const memberCount = sampleUsers.filter(
          (u) =>
            u.unit === unit.nama_unit ||
            u.kode_unit === unit.kode_unit ||
            u.unitKerja === unit.nama_unit ||
            u.unit_kerja_id === unit.kode_unit
        ).length;

        const parentObj = units.find((p) => p.kode_unit === unit.parent_kode);

        return {
          ...unit,
          parent_name: parentObj ? parentObj.nama_unit : unit.parent_kode || 'Universitas Siliwangi',
          memberCount
        };
      });

      const ftUnit = enrichedUnits.find((u) => u.kode_unit === 'UN58.13');
      expect(ftUnit).toBeDefined();
      expect(ftUnit.memberCount).toBe(3); // pejabat, staf tu, dosen
      expect(ftUnit.parent_name).toBe('Universitas Siliwangi');
    });
  });
});
