import { describe, it, expect } from 'vitest';
import { getPositionsByUnitAndRole, getUnitByCode } from '../unitJabatanOptions';

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
});
