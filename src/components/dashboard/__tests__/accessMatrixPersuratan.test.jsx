import { describe, it, expect } from 'vitest';
import {
  canUserRegisterIncomingLetter,
  canLetterBeDisposed,
  getLetterActionCapabilities
} from '../../../utils/letterActionPolicy';
import { isDisposisiAuthorizedOfficial } from '../../../utils/disposisiStandards';
import {
  getAuthorizedTemplates,
  LECTURER_TRIDHARMA_6_TEMPLATE_IDS,
  DOCUMENT_TEMPLATES
} from '../../../config/documentFormats';
import { getNavbarActionConfig } from '../../layout/Navbar';

describe('Penegakan Matriks Hak Akses Persuratan SILOKA UNSIL (Strict DOM Removal)', () => {
  // Definisi Profil Pengguna Sesuai Database SILOKA
  const superAdmin = {
    id: 'usr-dg-01',
    nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
    role: 'Super Admin',
    is_super_admin: true,
    roleLevel: 'Level 0: Administrator Sistem'
  };

  const stafTu = {
    id: 'usr-ac-01',
    nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
    role: 'STAF',
    role_slug: 'admin_tu',
    is_pejabat: false,
    roleLevel: 'Level 2: Pelaksana Administrasi'
  };

  const pejabatStruktural = {
    id: 'usr-ar-01',
    nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
    jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    is_pejabat: true,
    pejabat_id: 'pj-03',
    roleLevel: 'Level 1: Pimpinan'
  };

  const dosenFungsional = {
    id: 'usr-dosen-01',
    nama_lengkap: 'Dr. Aris Martono, S.T., M.Kom.',
    role: 'DOSEN',
    role_slug: 'drafter',
    is_pejabat: false,
    jabatan: 'Dosen Biasa Teknik Informatika',
    unit_kerja_id: 'UN58.13'
  };

  const sampleSuratMasuk = {
    id: 'ltr-in-01',
    kategori: 'Surat Masuk',
    nomorSurat: '001/UN58/TU/2026',
    status: 'Dikirim',
    tteVerified: false,
    isDibatalkan: false
  };

  const sampleSuratKeluarSiapTte = {
    id: 'ltr-out-01',
    kategori: 'Surat Keluar',
    nomorSurat: '002/UN58/TU/2026',
    status: 'Diparaf',
    signerId: 'pj-03',
    tteVerified: false,
    isDibatalkan: false
  };

  describe('1. Registrasi Surat Masuk', () => {
    it('BISA untuk Staf TU / Operator Loket (Eksklusif Petugas Loket Penerimaan)', () => {
      expect(canUserRegisterIncomingLetter(stafTu)).toBe(true);

      const navStaf = getNavbarActionConfig('surat-masuk', stafTu);
      expect(navStaf.isActionVisible).toBe(true);
      expect(navStaf.createButtonLabel).toBe('Registrasi Surat');
    });

    it('DIHAPUS TOTAL DARI DOM untuk Super Admin, Dosen Fungsional & Pejabat Struktural', () => {
      expect(canUserRegisterIncomingLetter(superAdmin)).toBe(false);
      expect(canUserRegisterIncomingLetter(dosenFungsional)).toBe(false);
      expect(canUserRegisterIncomingLetter(pejabatStruktural)).toBe(false);

      const navAdmin = getNavbarActionConfig('surat-masuk', superAdmin);
      expect(navAdmin.isActionVisible).toBe(false);

      const navDosen = getNavbarActionConfig('surat-masuk', dosenFungsional);
      expect(navDosen.isActionVisible).toBe(false);

      const navPejabat = getNavbarActionConfig('surat-masuk', pejabatStruktural);
      expect(navPejabat.isActionVisible).toBe(false);
    });
  });

  describe('2. Buat Draf Naskah Keluar', () => {
    it('Bisa untuk Staf TU/Operator, Pejabat Struktural, dan Super Admin (Seluruh 23 Template untuk Super Admin/Rektor)', () => {
      const templatesAdmin = getAuthorizedTemplates(superAdmin);
      expect(templatesAdmin.length).toBe(DOCUMENT_TEMPLATES.length);
      expect(templatesAdmin.length).toBe(23);

      const templatesStaf = getAuthorizedTemplates(stafTu);
      expect(templatesStaf.length).toBeGreaterThan(6); // Staf TU dapat mengentri template operasional persuratan

      const templatesPejabat = getAuthorizedTemplates(pejabatStruktural);
      expect(templatesPejabat.length).toBeGreaterThan(6); // Pejabat struktural memiliki akses template sesuai kewenangan SOTK
    });

    it('Bisa untuk Dosen Fungsional KHUSUS Tepat 6 Template Tridharma', () => {
      const templatesDosen = getAuthorizedTemplates(dosenFungsional);
      expect(templatesDosen.length).toBe(6);

      const templateIds = templatesDosen.map((t) => t.id);
      expect(templateIds).toEqual([...LECTURER_TRIDHARMA_6_TEMPLATE_IDS]);
      expect(templateIds).toEqual(['st_lembar', 'st_kolom', 'nd', 'sket', 'lap', 'ts']);
    });
  });

  describe('3. Penerbitan E-Disposisi', () => {
    it('BISA untuk Pejabat Struktural (Eksklusif Pimpinan)', () => {
      expect(isDisposisiAuthorizedOfficial(pejabatStruktural)).toBe(true);
      expect(canLetterBeDisposed(sampleSuratMasuk, pejabatStruktural)).toBe(true);

      const capPejabat = getLetterActionCapabilities(sampleSuratMasuk, pejabatStruktural);
      expect(capPejabat.canDispose).toBe(true);
    });

    it('DIHAPUS TOTAL DARI DOM untuk Super Admin, Staf TU & Dosen Fungsional (Terkunci)', () => {
      expect(isDisposisiAuthorizedOfficial(superAdmin)).toBe(false);
      expect(isDisposisiAuthorizedOfficial(stafTu)).toBe(false);
      expect(isDisposisiAuthorizedOfficial(dosenFungsional)).toBe(false);

      expect(canLetterBeDisposed(sampleSuratMasuk, superAdmin)).toBe(false);
      expect(canLetterBeDisposed(sampleSuratMasuk, stafTu)).toBe(false);
      expect(canLetterBeDisposed(sampleSuratMasuk, dosenFungsional)).toBe(false);

      const capAdmin = getLetterActionCapabilities(sampleSuratMasuk, superAdmin);
      expect(capAdmin.canDispose).toBe(false);

      const capStaf = getLetterActionCapabilities(sampleSuratMasuk, stafTu);
      expect(capStaf.canDispose).toBe(false);

      const capDosen = getLetterActionCapabilities(sampleSuratMasuk, dosenFungsional);
      expect(capDosen.canDispose).toBe(false);
    });
  });

  describe('4. Pengesahan TTE BSrE', () => {
    it('BISA untuk Pejabat Struktural (Eksklusif Penandatangan BSSN)', () => {
      const capPejabat = getLetterActionCapabilities(sampleSuratKeluarSiapTte, pejabatStruktural);
      expect(capPejabat.canSign).toBe(true);
    });

    it('DIHAPUS TOTAL DARI DOM untuk Super Admin, Staf TU & Dosen Fungsional (Terkunci)', () => {
      const capAdmin = getLetterActionCapabilities(sampleSuratKeluarSiapTte, superAdmin);
      expect(capAdmin.canSign).toBe(false);

      const capStaf = getLetterActionCapabilities(sampleSuratKeluarSiapTte, stafTu);
      expect(capStaf.canSign).toBe(false);

      const capDosen = getLetterActionCapabilities(sampleSuratKeluarSiapTte, dosenFungsional);
      expect(capDosen.canSign).toBe(false);
    });
  });
});
