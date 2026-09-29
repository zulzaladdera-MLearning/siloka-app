import { describe, it, expect } from 'vitest';
import {
  normalizeUserRole,
  getAuthorizedTemplates,
  getAuthorizedTemplatesWithNumbering,
  getRektoratOfficialSopProfile
} from '../../../config/documentFormats';
import usersData from '../../../data/users.json';

describe('Matriks Kewenangan Template Surat & SOP Rektor vs Wakil Rektor (Peraturan Rektor No. 3/2023 & SK No. 2803/2023)', () => {
  const rektorUserFromJson = usersData.find((u) => u.id === 'usr-01');
  const warek1UserFromJson = usersData.find((u) => u.id === 'usr-warek-01');
  const warek2UserFromJson = usersData.find((u) => u.id === 'usr-warek-02');
  const warek3UserFromJson = usersData.find((u) => u.id === 'usr-warek-03');
  const stafRektoratFromJson = usersData.find((u) => u.id === 'usr-02');

  it('memastikan seluruh akun Rektor dan 3 Wakil Rektor tersedia di users.json', () => {
    expect(rektorUserFromJson).toBeDefined();
    expect(warek1UserFromJson).toBeDefined();
    expect(warek2UserFromJson).toBeDefined();
    expect(warek3UserFromJson).toBeDefined();
  });

  it('menormalisasi akun Rektor (termasuk objek session tanpa is_pejabat atau dengan role PEJABAT) menjadi REKTOR', () => {
    expect(normalizeUserRole(rektorUserFromJson)).toBe('REKTOR');

    // Simulasi objek session lama di mana is_pejabat dan jabatan undefined, hanya ada role='PEJABAT' dan roleLabel='Rektor Universitas Siliwangi'
    const legacySessionRektor = {
      id: 'usr-01',
      role: 'PEJABAT',
      roleLevel: 'Level 1: Pimpinan',
      roleLabel: 'Rektor Universitas Siliwangi'
    };
    expect(normalizeUserRole(legacySessionRektor)).toBe('REKTOR');
  });

  it('menormalisasi ketiga akun Wakil Rektor menjadi WAREK (tidak salah terdeteksi sebagai REKTOR) dan Staf Rektorat menjadi STAFF_TU', () => {
    expect(normalizeUserRole(warek1UserFromJson)).toBe('WAREK');
    expect(normalizeUserRole(warek2UserFromJson)).toBe('WAREK');
    expect(normalizeUserRole(warek3UserFromJson)).toBe('WAREK');
    expect(normalizeUserRole(stafRektoratFromJson)).toBe('STAFF_TU');
  });

  it('memberikan tepat 23 template naskah dinas untuk akun Rektor sesuai Tabel 1 Kolom 3 Hal. 88-89 Peraturan Rektor No. 3/2023', () => {
    const rektorTemplates = getAuthorizedTemplates(rektorUserFromJson);
    expect(rektorTemplates).toHaveLength(23);

    const rektorTemplateIds = rektorTemplates.map((t) => t.id);
    expect(rektorTemplateIds).toEqual([
      'pos',
      'se',
      'sk',
      'sp',
      'st_lembar',
      'st_kolom',
      'nd',
      'sd',
      'undangan_lembar',
      'undangan_kartu',
      'mou',
      'pks',
      'skua',
      'ba',
      'sket',
      'sper',
      'speng',
      'peng',
      'notula',
      'lap',
      'ts',
      'disp_rektor',
      'tte_doc'
    ]);
  });

  it('memberikan tepat 16 template naskah dinas untuk akun Wakil Rektor sesuai Tabel 1 Kolom 7 Hal. 88-89 Peraturan Rektor No. 3/2023', () => {
    for (const warekUser of [warek1UserFromJson, warek2UserFromJson, warek3UserFromJson]) {
      const warekTemplates = getAuthorizedTemplatesWithNumbering(warekUser);
      expect(warekTemplates).toHaveLength(16);

      const warekIds = warekTemplates.map((t) => t.id);
      expect(warekIds).toEqual([
        'st_lembar',
        'st_kolom',
        'nd',
        'sd',
        'mou',
        'pks',
        'skua',
        'ba',
        'sket',
        'sper',
        'speng',
        'peng',
        'notula',
        'lap',
        'ts',
        'tte_doc'
      ]);

      // Pastikan 7 format yang bertanda '-' pada Kolom 7 (Warek) di Tabel 1 TIDAK muncul
      expect(warekIds).not.toContain('pos');
      expect(warekIds).not.toContain('se');
      expect(warekIds).not.toContain('sk');
      expect(warekIds).not.toContain('sp');
      expect(warekIds).not.toContain('undangan_lembar');
      expect(warekIds).not.toContain('undangan_kartu');
      expect(warekIds).not.toContain('disp_rektor');

      // Pastikan penomoran urut dinamis mulai dari 1 hingga 16
      expect(warekTemplates[0].displayLabel).toBe('1. ST (Lembar)');
      expect(warekTemplates[15].displayLabel).toBe('16. Penggunaan TTE');
    }
  });

  it('mengembalikan profil SOP & pemetaan kode klasifikasi JRA/SKKAAD (SK Rektor No. 2803/2023) sesuai bidang Rektor dan masing-masing Wakil Rektor', () => {
    const sopRektor = getRektoratOfficialSopProfile(rektorUserFromJson);
    const sopWarek1 = getRektoratOfficialSopProfile(warek1UserFromJson);
    const sopWarek2 = getRektoratOfficialSopProfile(warek2UserFromJson);
    const sopWarek3 = getRektoratOfficialSopProfile(warek3UserFromJson);

    expect(sopRektor?.subRoleKey).toBe('REKTOR');
    expect(sopRektor?.authorizedCount).toBe(23);
    expect(sopRektor?.defaultClassificationByTemplate.sd).toBe('KU.01.03'); // Contoh Hal. 74: 1/UN58/B/KU.01.03/2022

    expect(sopWarek1?.subRoleKey).toBe('WAREK_1');
    expect(sopWarek1?.authorizedCount).toBe(16);
    expect(sopWarek1?.defaultClassificationByTemplate.sd).toBe('PR.00.02'); // Contoh Hal. 74: 18/UN58/R/PR.00.02/2022
    expect(sopWarek1?.defaultClassificationByTemplate.peng).toBe('PP.00.04'); // Naskah Soal / Informasi PMB

    expect(sopWarek2?.subRoleKey).toBe('WAREK_2');
    expect(sopWarek2?.authorizedCount).toBe(16);
    expect(sopWarek2?.defaultClassificationByTemplate.sd).toBe('KU.01.04'); // Keuangan
    expect(sopWarek2?.defaultClassificationByTemplate.sket).toBe('KP.04.03'); // Usul Kenaikan Pangkat

    expect(sopWarek3?.subRoleKey).toBe('WAREK_3');
    expect(sopWarek3?.authorizedCount).toBe(16);
    expect(sopWarek3?.defaultClassificationByTemplate.st_lembar).toBe('KM.01.00'); // Kemahasiswaan
    expect(sopWarek3?.defaultClassificationByTemplate.sd).toBe('KM.02.00'); // Beasiswa & Kesejahteraan Mahasiswa
  });
});
