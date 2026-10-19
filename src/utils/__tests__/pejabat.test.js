import { describe, it, expect } from 'vitest';
import {
  getPejabatByUnit,
  findPejabatByNip,
  findPejabatById,
  formatPejabatLabel
} from '../pejabatHelper.js';
import masterPejabatList from '../../data/masterPejabat.json' with { type: 'json' };

describe('Unit Test: Fitur Penandatangan Otomatis & Master Pejabat Resmi UNSIL', () => {
  it('Kelengkapan Dataset Master Pejabat: Hanya memuat pejabat resmi institusional (tanpa akun bodong)', () => {
    expect(Array.isArray(masterPejabatList)).toBe(true);
    expect(masterPejabatList.length).toBeGreaterThanOrEqual(7);

    // Pastikan tidak ada akun fiktif Alam Rahmatulloh di master pejabat
    const hasAlam = masterPejabatList.some(
      (p) => (p.nama && p.nama.includes('Alam Rahmatulloh')) || (p.jabatan && p.jabatan.includes('Kepala UPA TIK'))
    );
    expect(hasAlam).toBe(false);

    // Seluruh NIP harus unik dan valid
    const nips = masterPejabatList.map((p) => p.nip);
    const uniqueNips = new Set(nips);
    expect(uniqueNips.size).toBe(masterPejabatList.length);
  });

  it('Filter Unit Scoped - Rektorat (UN58): Memuat Pimpinan Rektorat Resmi', () => {
    const rektoratList = getPejabatByUnit('UN58');
    expect(rektoratList.length).toBeGreaterThanOrEqual(4);
    expect(rektoratList.every((p) => p.kode_unit === 'UN58')).toBe(true);

    const rektor = rektoratList.find((p) => p.jabatan === 'Rektor Universitas Siliwangi');
    expect(rektor).toBeDefined();
    expect(rektor.nama_gelar).toBe('Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.');
    expect(rektor.nip).toBe('196708161996031001');

    const warek1 = rektoratList.find((p) => p.jabatan === 'Wakil Rektor Bidang Akademik');
    expect(warek1).toBeDefined();
    expect(warek1.nip).toBe('196811132021211003');

    const warek2 = rektoratList.find((p) => p.jabatan === 'Wakil Rektor Bidang Keuangan dan Umum');
    expect(warek2).toBeDefined();
    expect(warek2.nip).toBe('196801021992031002');

    const warek3 = rektoratList.find((p) => p.jabatan === 'Wakil Rektor Bidang Kemahasiswaan dan Alumni');
    expect(warek3).toBeDefined();
    expect(warek3.nip).toBe('197508192021211003');
  });

  it('Filter Unit Scoped - Organ Universitas (Senat & DP): Memuat Pejabat Resmi SOTK', () => {
    const senatList = getPejabatByUnit('UN58.SENAT');
    expect(senatList.length).toBe(2);
    expect(senatList.some((p) => p.jabatan.includes('Ketua Senat'))).toBe(true);
    expect(senatList.some((p) => p.jabatan.includes('Sekretaris Senat'))).toBe(true);

    const dpList = getPejabatByUnit('UN58.DP');
    expect(dpList.length).toBe(1);
    expect(dpList[0].jabatan).toBe('Ketua Dewan Penyantun');
    expect(dpList[0].nama).toBe('Drs. H. Syarif Hidayat');
  });

  it('Filter Unit Scoped - Unit Tanpa Pejabat Terdaftar (UPA TIK UN58.32): Mengembalikan Kosong Jujur (Tanpa Pejabat Bodong)', () => {
    // Karena Super Admin belum mengangkat Kepala UPA TIK di master pengguna/pejabat
    const tikList = getPejabatByUnit('UN58.32');
    expect(tikList.length).toBe(0);
  });

  it('Reaktivitas Data Pengguna: Menampilkan Pejabat Baru jika Ditambahkan di Manajemen Pengguna', () => {
    const customUsersList = [
      {
        id: 'usr-dekan-ft-baru',
        nip: '197306282000031001',
        nama_lengkap: 'Dr. Ir. Asep Andang, S.T., M.T.',
        jabatan: 'Dekan Fakultas Teknik',
        unit_kerja_id: 'UN58.13',
        role: 'PEJABAT',
        is_pejabat: true,
        is_active: true
      }
    ];

    const ftList = getPejabatByUnit('UN58.13', null, customUsersList);
    expect(ftList.length).toBe(1);
    expect(ftList[0].nama).toBe('Dr. Ir. Asep Andang, S.T., M.T.');
    expect(ftList[0].jabatan).toBe('Dekan Fakultas Teknik');
    expect(ftList[0].kode_unit).toBe('UN58.13');
  });

  it('Lookup Berdasarkan NIP & ID', () => {
    const rektorByNip = findPejabatByNip('196708161996031001');
    expect(rektorByNip).not.toBeNull();
    expect(rektorByNip.jabatan).toBe('Rektor Universitas Siliwangi');

    const rektorById = findPejabatById(1);
    expect(rektorById).not.toBeNull();
    expect(rektorById.nip).toBe('196708161996031001');

    const formattedLabel = formatPejabatLabel(rektorByNip);
    expect(formattedLabel).toContain('Rektor Universitas Siliwangi');
    expect(formattedLabel).toContain('Prof. Dr. Eng. Ir. Aripin');
  });
});
