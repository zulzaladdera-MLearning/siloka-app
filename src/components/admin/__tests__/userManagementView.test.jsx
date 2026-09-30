import { describe, it, expect } from 'vitest';
import { resolveDisplayRole } from '../SystemSettingsView';

describe('SystemSettingsView & resolveDisplayRole Engine', () => {
  it('harus mengenali Super Administrator dengan benar', () => {
    const userSuper = {
      role: 'Super Admin',
      email: 'dedegunawan@unsil.ac.id'
    };
    expect(resolveDisplayRole(userSuper)).toBe('Super Administrator');
  });

  it('harus menggantikan role lokal dengan peran aktual yang diemban pengguna', () => {
    const userRektor = {
      id: 'usr-01',
      role: 'PEJABAT',
      jabatan: 'Rektor Universitas Siliwangi'
    };
    expect(resolveDisplayRole(userRektor)).toBe('Rektor Universitas Siliwangi');

    const userDekan = {
      role: 'PEJABAT',
      jabatan: 'Dekan Fakultas Teknik'
    };
    expect(resolveDisplayRole(userDekan)).toBe('Dekan Fakultas Teknik');

    const userBiro = {
      role: 'PEJABAT',
      jabatan: 'Kepala Biro Keuangan dan Umum'
    };
    expect(resolveDisplayRole(userBiro)).toBe('Kepala Biro Keuangan dan Umum');

    const userDosen = {
      role: 'DOSEN',
      jabatan: 'Dosen'
    };
    expect(resolveDisplayRole(userDosen)).toBe('Dosen');

    const userOperator = {
      role: 'OPERATOR_UNIT',
      jabatan: 'Operator TIK / Pranata Komputer'
    };
    expect(resolveDisplayRole(userOperator)).toBe('Operator TIK / Pranata Komputer');
  });

  it('tidak boleh memuat data dummy "Administrator Utama SILOKA" pada master data seed', async () => {
    const usersData = (await import('../../../data/users.json')).default;
    const dummyUser = usersData.find(
      (u) =>
        u.id === 'usr-admin-01' ||
        String(u.nama_lengkap || '').includes('Administrator Utama SILOKA')
    );
    expect(dummyUser).toBeUndefined();

    // Verifikasi Super Administrator riil adalah Dede Gunawan
    const realSuperAdmin = usersData.find((u) => u.email === 'dedegunawan@unsil.ac.id');
    expect(realSuperAdmin).toBeDefined();
    expect(realSuperAdmin.nama_lengkap).toBe('Dede Gunawan, S.Kom., M.Kom.');
    expect(realSuperAdmin.role).toBe('Super Admin');
  });
});
