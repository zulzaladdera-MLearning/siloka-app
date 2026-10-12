import { describe, it, expect } from 'vitest';
import {
  getPositionsByUnitAndRole,
  getUnitByCode,
  getJurusanByUnitCode,
  getActiveUnitKerjaList,
  getDefaultStrukturOrganisasi,
  getStrukturOrganisasiByUnit
} from '../unitJabatanOptions';

describe('UnitJabatanOptions - Dynamic Structural Position Selector', () => {
  it('harus mengembalikan jabatan pimpinan Rektorat untuk UN58', () => {
    const positions = getPositionsByUnitAndRole('UN58', 'pimpinan');
    expect(positions).toContain('Rektor Universitas Siliwangi');
    expect(positions).toContain('Wakil Rektor Bidang Akademik');
    expect(positions).toContain('Wakil Rektor Bidang Keuangan dan Umum');
    expect(positions).toContain('Wakil Rektor Bidang Kemahasiswaan dan Alumni');
    expect(positions).toContain('Wakil Rektor Bidang Perencanaan, Kerja Sama, dan Sistem Informasi');
  });

  it('harus mengembalikan jabatan pimpinan Fakultas Teknik untuk UN58.13', () => {
    const positions = getPositionsByUnitAndRole('UN58.13', 'pimpinan');
    expect(positions).toContain('Dekan Fakultas Teknik');
    expect(positions).toContain('Wakil Dekan Bidang Akademik dan Kemahasiswaan FT');
    expect(positions).toContain('Ketua Jurusan Informatika');
    expect(positions).toContain('Ketua Jurusan Teknik Sipil');
    expect(positions).toContain('Ketua Jurusan Teknik Elektro');
  });

  it('harus mengembalikan jabatan pimpinan Biro Keuangan dan Umum untuk UN58.6', () => {
    const positions = getPositionsByUnitAndRole('UN58.6', 'pimpinan');
    expect(positions).toContain('Kepala Biro Keuangan dan Umum');
    expect(positions).toContain('Kepala Bagian Umum');
    expect(positions).toContain('Kepala Bagian Keuangan dan Kepegawaian');
  });

  it('harus mengembalikan jabatan pimpinan UPA TIK untuk UN58.32', () => {
    const positions = getPositionsByUnitAndRole('UN58.32', 'pimpinan');
    expect(positions).toContain('Kepala UPA Teknologi Informasi dan Komunikasi');
  });

  it('harus mengembalikan jabatan pimpinan Senat dan SPI', () => {
    const senatPositions = getPositionsByUnitAndRole('UN58.SENAT', 'pimpinan');
    expect(senatPositions).toContain('Ketua Senat Universitas Siliwangi');

    const spiPositions = getPositionsByUnitAndRole('UN58.SPI', 'pimpinan');
    expect(spiPositions).toContain('Ketua Satuan Pengawas Internal (SPI)');
  });

  it('harus mengembalikan peran admin_tu dan drafter yang relevan dengan unit', () => {
    const ftAdminTu = getPositionsByUnitAndRole('UN58.13', 'admin_tu');
    expect(ftAdminTu).toContain('Pengadministrasi Persuratan / Loket TU FT');

    const ftDrafter = getPositionsByUnitAndRole('UN58.13', 'drafter');
    expect(ftDrafter).toContain('Dosen Jurusan Informatika');
  });

  it('harus mengembalikan Super Administrator untuk role super_admin terlepas dari unit', () => {
    const adminPositions = getPositionsByUnitAndRole('UN58.13', 'super_admin');
    expect(adminPositions).toContain('Super Administrator');
  });

  it('dapat menemukan info unit berdasarkan kode unit', () => {
    const unitFT = getUnitByCode('UN58.13');
    expect(unitFT).toBeTruthy();
    expect(unitFT.singkatan).toBe('FT');
    expect(unitFT.nama_unit).toBe('Fakultas Teknik');
  });

  it('harus dapat mengambil daftar jurusan per unit kerja fakultas', () => {
    const jurFT = getJurusanByUnitCode('UN58.13');
    expect(Array.isArray(jurFT)).toBe(true);
    expect(jurFT.some((j) => j.nama === 'Informatika')).toBe(true);
    expect(jurFT.some((j) => j.nama === 'Teknik Sipil')).toBe(true);

    const jurFKIP = getJurusanByUnitCode('UN58.10');
    expect(jurFKIP.some((j) => j.nama === 'Pendidikan Matematika')).toBe(true);
  });

  it('harus secara dinamis menyesuaikan daftar opsi jabatan saat jurusan ditambah ke unit', () => {
    const customUnits = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        jurusan: [
          { id: 'jur-1', kode: 'IF', nama: 'Informatika' },
          { id: 'jur-custom', kode: 'BIO', nama: 'Teknik Biomedis' }
        ]
      }
    ];

    const drafterPositions = getPositionsByUnitAndRole('UN58.13', 'drafter', customUnits);
    expect(drafterPositions).toContain('Dosen Jurusan Teknik Biomedis');
    expect(drafterPositions).toContain('Dosen Jurusan Informatika');

    const pimpinanPositions = getPositionsByUnitAndRole('UN58.13', 'pimpinan', customUnits);
    expect(pimpinanPositions).toContain('Ketua Jurusan Teknik Biomedis');
    expect(pimpinanPositions).toContain('Sekretaris Jurusan Teknik Biomedis');
  });

  it('harus secara dinamis menghapus opsi jabatan saat jurusan dihapus dari unit', () => {
    const customUnits = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        jurusan: [
          { id: 'jur-1', kode: 'IF', nama: 'Informatika' }
        ]
      }
    ];

    const drafterPositions = getPositionsByUnitAndRole('UN58.13', 'drafter', customUnits);
    expect(drafterPositions).toContain('Dosen Jurusan Informatika');
    expect(drafterPositions).not.toContain('Dosen Jurusan Teknik Elektro');

    const pimpinanPositions = getPositionsByUnitAndRole('UN58.13', 'pimpinan', customUnits);
    expect(pimpinanPositions).not.toContain('Ketua Jurusan Teknik Elektro');
  });

  it('harus dapat menghasilkan struktur organisasi lengkap standar SOTK untuk satu unit', () => {
    const defaultStruktur = getDefaultStrukturOrganisasi('UN58.13');
    expect(Array.isArray(defaultStruktur)).toBe(true);
    expect(defaultStruktur.length).toBeGreaterThan(0);
    expect(defaultStruktur.some((s) => s.kategori_peran === 'pimpinan')).toBe(true);
    expect(defaultStruktur.some((s) => s.kategori_peran === 'verifikator')).toBe(true);
    expect(defaultStruktur.some((s) => s.kategori_peran === 'admin_tu')).toBe(true);
    expect(defaultStruktur.some((s) => s.kategori_peran === 'drafter')).toBe(true);
  });

  it('harus mengutamakan jabatan yang diedit atau ditambah pada struktur_organisasi unit', () => {
    const customUnitsWithStruktur = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        struktur_organisasi: [
          {
            id: 'jab-custom-1',
            nama_jabatan: 'Dekan Eksekutif Fakultas Teknik',
            kategori_peran: 'pimpinan',
            level_hirarki: 1
          },
          {
            id: 'jab-custom-2',
            nama_jabatan: 'Ketua Unit Penjaminan Mutu FT',
            kategori_peran: 'verifikator',
            level_hirarki: 2
          },
          {
            id: 'jab-custom-3',
            nama_jabatan: 'Koordinator Laboratorium Riset dan IoT',
            kategori_peran: 'drafter',
            level_hirarki: 4
          }
        ]
      }
    ];

    const pimpinan = getPositionsByUnitAndRole('UN58.13', 'pimpinan', customUnitsWithStruktur);
    expect(pimpinan).toEqual(['Dekan Eksekutif Fakultas Teknik']);

    const verifikator = getPositionsByUnitAndRole('UN58.13', 'verifikator', customUnitsWithStruktur);
    expect(verifikator).toEqual(['Ketua Unit Penjaminan Mutu FT']);

    const drafter = getPositionsByUnitAndRole('UN58.13', 'drafter', customUnitsWithStruktur);
    expect(drafter).toEqual(['Koordinator Laboratorium Riset dan IoT']);
  });
});
