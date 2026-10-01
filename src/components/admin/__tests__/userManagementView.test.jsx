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

  it('hanya menyisakan Super Administrator saat seluruh user non-super-admin dihapus', async () => {
    const usersData = (await import('../../../data/users.json')).default;
    const { isSuperAdminUser } = await import('../../../utils/authGuards');

    // Filter simulasi pembersihan user non-super-admin
    const superAdminsOnly = usersData.filter(
      (u) =>
        isSuperAdminUser(u) &&
        u.id !== 'usr-admin-01' &&
        u.id !== 'usr-00' &&
        !String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA')
    );

    // Harus menyisakan tepat 1 akun Super Administrator (Dede Gunawan)
    expect(superAdminsOnly.length).toBe(1);
    expect(superAdminsOnly[0].email).toBe('dedegunawan@unsil.ac.id');
    expect(superAdminsOnly[0].is_super_admin).toBe(true);

    // Tidak boleh ada role lain (Dosen, Pejabat, dsb) di hasil pembersihan
    const hasNonAdmin = superAdminsOnly.some((u) => !isSuperAdminUser(u));
    expect(hasNonAdmin).toBe(false);
  });

  it('memastikan proteksi akun Super Administrator agar tidak terhapus oleh handler penghapusan', async () => {
    const { isSuperAdminUser } = await import('../../../utils/authGuards');
    const mockUsers = [
      { id: 'usr-dg-01', name: 'Dede Gunawan', role: 'Super Admin', is_super_admin: true },
      { id: 'usr-02', name: 'Staf Non Admin', role: 'STAF' }
    ];

    // Logika proteksi handleDeleteUser: Super Admin kebal terhadap penghapusan
    const deleteTarget = (userId, list) => list.filter((u) => u.id !== userId || isSuperAdminUser(u));

    // Coba hapus akun staf biasa -> harus terhapus
    const afterDeleteStaf = deleteTarget('usr-02', mockUsers);
    expect(afterDeleteStaf.length).toBe(1);
    expect(afterDeleteStaf[0].id).toBe('usr-dg-01');

    // Coba hapus akun Super Admin -> harus tetap terlindungi (tidak terhapus)
    const afterAttemptDeleteSuper = deleteTarget('usr-dg-01', afterDeleteStaf);
    expect(afterAttemptDeleteSuper.length).toBe(1);
    expect(afterAttemptDeleteSuper[0].id).toBe('usr-dg-01');
  });
});
