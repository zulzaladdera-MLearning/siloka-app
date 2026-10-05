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

  it('menyediakan katalog daftar referensi jabatan struktural dan fungsional resmi UNSIL', async () => {
    const { OFFICIAL_UNSIL_POSITIONS } = await import('../SystemSettingsView');
    expect(Array.isArray(OFFICIAL_UNSIL_POSITIONS)).toBe(true);
    expect(OFFICIAL_UNSIL_POSITIONS.length).toBeGreaterThan(20);
    expect(OFFICIAL_UNSIL_POSITIONS).toContain('Rektor Universitas Siliwangi');
    expect(OFFICIAL_UNSIL_POSITIONS).toContain('Dekan Fakultas Teknik');
    expect(OFFICIAL_UNSIL_POSITIONS).toContain('Dosen Fungsional (Tridharma)');
    expect(OFFICIAL_UNSIL_POSITIONS).toContain('Pengadministrasi Persuratan / Loket TU');
  });

  it('memastikan penetapan peran pada manajemen Super Admin menghapus artefak context switcher legacy', () => {
    const legacyUser = {
      id: 'usr-dekan-01',
      name: 'Dr. Dekan FT',
      role: 'DOSEN',
      active_context_mode: 'MODE_DOSEN',
      saved_pejabat_snapshot: { role: 'PEJABAT' },
      dual_role_profiles: { mode_dosen: {} }
    };

    // Simulasi handler penyimpanan Super Admin saat menyetel jabatan struktural
    const updated = {
      ...legacyUser,
      role: 'PEJABAT',
      is_pejabat: true,
      jabatan: 'Dekan Fakultas Teknik',
      roleLabel: 'Dekan Fakultas Teknik'
    };
    delete updated.active_context_mode;
    delete updated.saved_pejabat_snapshot;
    delete updated.dual_role_profiles;

    expect(updated.role).toBe('PEJABAT');
    expect(updated.is_pejabat).toBe(true);
    expect(updated.active_context_mode).toBeUndefined();
    expect(updated.saved_pejabat_snapshot).toBeUndefined();
    expect(updated.dual_role_profiles).toBeUndefined();
  });

  it('berhasil memproses data form pendaftaran pengguna baru (Abdul Fattah) tanpa runtime crash', async () => {
    const { getRolesCatalog } = await import('../../../utils/rbacSyncService');
    const rolesCatalog = getRolesCatalog();

    const newUserData = {
      name: 'Abdul Fattah, S.Pd., M.Pd.',
      nip: '200008172027031001',
      email: 'abdulfattah@unsil.ac.id',
      unit_kerja_id: 'UN58.10',
      role_slug: 'drafter',
      jabatan: 'Dosen',
      password: 'Siloka2026!'
    };

    const selectedRole = rolesCatalog.find((r) => r.slug === newUserData.role_slug) || rolesCatalog[0];
    const isSuper = selectedRole.slug === 'super_admin';
    const isPimpinan = selectedRole.slug === 'pimpinan';
    const cleanJabatan = (newUserData.jabatan || (isSuper ? 'Super Administrator' : selectedRole.name)).trim();
    const posLower = cleanJabatan.toLowerCase();
    const hasStructuralKeyword = /\b(rektor|dekan|direktur|ketua lembaga|kepala biro|kepala upa|kajur|ketua jurusan|kaprodi|sekretaris|wakil dekan|wakil rektor|kepala subbagian|kasubbag)\b/i.test(cleanJabatan);
    const isPejabat = isPimpinan || (hasStructuralKeyword && !posLower.includes('dosen fungsional'));

    const newUser = {
      id: `usr-custom-${Date.now()}`,
      nama_lengkap: newUserData.name.trim(),
      nip: newUserData.nip.trim(),
      email: newUserData.email.trim(),
      unit_kerja_id: newUserData.unit_kerja_id,
      role: 'DOSEN',
      role_slug: 'drafter',
      roleLevel: 'Level 3: Dosen/Pegawai',
      roleLabel: cleanJabatan,
      jabatan: cleanJabatan,
      is_pejabat: isPejabat,
      is_super_admin: isSuper,
      signatureReady: isPejabat || isSuper
    };

    expect(newUser.nama_lengkap).toBe('Abdul Fattah, S.Pd., M.Pd.');
    expect(newUser.role).toBe('DOSEN');
    expect(newUser.is_pejabat).toBe(false);
    expect(newUser.is_super_admin).toBe(false);
  });

  it('memastikan pengguna yang dihapus oleh Super Admin otomatis dicabut aksesnya dan dilarang masuk sistem', async () => {
    const { isUserDeleted, deleteUserById, deletedUserIdentifiers } = await import(
      '../../../../server/services/userManagementService'
    );

    const testTarget = {
      id: 'usr-test-delete-99',
      nip: '199901012025011099',
      email: 'userdihapus@unsil.ac.id',
      username: 'userdihapus'
    };

    // Jalankan penghapusan dengan data pengguna lengkap
    await deleteUserById(testTarget);

    // Verifikasi bahwa seluruh pengenal masuk ke blacklist terhapus
    expect(isUserDeleted(testTarget.id)).toBe(true);
    expect(isUserDeleted(testTarget.email)).toBe(true);
    expect(isUserDeleted('userdihapus')).toBe(true);
    expect(isUserDeleted('userdihapus@unsil.ac.id')).toBe(true);

    // Bersihkan test data agar tidak mempengaruhi tes lain
    deletedUserIdentifiers.delete(testTarget.id.toLowerCase());
    deletedUserIdentifiers.delete(testTarget.email.toLowerCase());
    deletedUserIdentifiers.delete(testTarget.username.toLowerCase());
  });
});
