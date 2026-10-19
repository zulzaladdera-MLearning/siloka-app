import { describe, it, expect } from 'vitest';
import { getPejabatByUnit, findPejabatByNip } from '../pejabatHelper.js';
import masterPejabatList from '../../data/masterPejabat.json' with { type: 'json' };

describe('Sistem Hierarki Otomatis (Automated Hierarchy Routing) Form Surat Keluar', () => {
  it('Aturan 1, 2 & 3: Skenario Pengguna Rektorat (UN58)', () => {
    const sessionRektorat = {
      id: 'usr-staf-rektorat-01',
      name: 'Rahmat Hidayat, S.AP.',
      role: 'OPERATOR_UNIT',
      roleLabel: 'Staf Tata Usaha & Protokoler Rektorat',
      unit_kerja_id: 'UN58'
    };

    const rektoratOfficials = getPejabatByUnit(sessionRektorat.unit_kerja_id, sessionRektorat);
    expect(rektoratOfficials.length).toBeGreaterThanOrEqual(4);
    expect(rektoratOfficials.every((p) => p.kode_unit === 'UN58')).toBe(true);

    const rektor = rektoratOfficials.find((p) => p.jabatan === 'Rektor Universitas Siliwangi');
    expect(rektor).toBeDefined();
    expect(rektor.is_aktif).toBe(true);
  });

  it('Aturan 1, 2 & 3: Skenario Organ Senat (UN58.SENAT)', () => {
    const sessionSenat = {
      id: 'usr-staf-senat-01',
      name: 'Staf Administrasi Senat',
      role: 'OPERATOR_UNIT',
      unit_kerja_id: 'UN58.SENAT'
    };

    const senatOfficials = getPejabatByUnit(sessionSenat.unit_kerja_id, sessionSenat);
    expect(senatOfficials.length).toBe(2);
    expect(senatOfficials.every((p) => p.kode_unit === 'UN58.SENAT')).toBe(true);
    expect(senatOfficials.some((p) => p.kode_unit === 'UN58.13')).toBe(false);
  });

  it('Aturan 1, 2 & 3: Skenario Dosen Fakultas Teknik (UN58.13) dengan Pejabat Aktif Hasil CRUD', () => {
    const sessionDosenFT = {
      id: 'usr-dosen-ft-01',
      name: 'Ir. Ahmad Fauzi, M.T.',
      role: 'DOSEN',
      roleLabel: 'Dosen Jurusan Informatika',
      unit_kerja_id: 'UN58.13'
    };

    const simulatedUsers = [
      {
        id: 'usr-dekan-ft-01',
        nip: '197306282000031001',
        nama_lengkap: 'Dr. Nurul Hiron, S.T., M.Eng.',
        jabatan: 'Dekan Fakultas Teknik',
        unit_kerja_id: 'UN58.13',
        role: 'PEJABAT',
        is_pejabat: true
      },
      {
        id: 'usr-wadek-ft-01',
        nip: '198205102008121003',
        nama_lengkap: 'Husni Mubarok, S.T., M.T.',
        jabatan: 'Wakil Dekan Bidang Akademik FT',
        unit_kerja_id: 'UN58.13',
        role: 'PEJABAT',
        is_pejabat: true
      }
    ];

    const ftOfficials = getPejabatByUnit(sessionDosenFT.unit_kerja_id, sessionDosenFT, simulatedUsers);
    expect(ftOfficials.length).toBe(2);
    expect(ftOfficials.every((p) => p.kode_unit === 'UN58.13')).toBe(true);

    const dekanFT = ftOfficials.find((p) => p.jabatan === 'Dekan Fakultas Teknik');
    expect(dekanFT).toBeDefined();
    expect(dekanFT.nama).toBe('Dr. Nurul Hiron, S.T., M.Eng.');
    expect(dekanFT.nip).toBe('197306282000031001');
  });

  it('Aturan 4: Auto-Fill Real-Time Input Terpisah (Nama, Gelar, NIP)', () => {
    const rektor = masterPejabatList.find((p) => p.jabatan === 'Rektor Universitas Siliwangi');
    expect(rektor).toBeDefined();
    expect(rektor.nama).toBe('Prof. Dr. Eng. Ir. Aripin');
    expect(rektor.gelar).toBe('IPU., ASEAN Eng.');
    expect(rektor.nip).toBe('196708161996031001');
  });

  it('Integritas Data Pejabat Resmi Institusi', () => {
    const allHaveIsAktif = masterPejabatList.every((p) => p.is_aktif === true && p.is_active === true);
    expect(allHaveIsAktif).toBe(true);

    const allHaveNamaAndGelar = masterPejabatList.every((p) => p.nama && p.gelar && p.nip);
    expect(allHaveNamaAndGelar).toBe(true);
  });
});
