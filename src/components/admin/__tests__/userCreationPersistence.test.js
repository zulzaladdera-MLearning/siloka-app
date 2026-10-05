import { describe, it, expect, beforeEach } from 'vitest';
import { getAllUsersFromDatabase, storeNewUser, unmarkUserAsDeleted } from '../../../../server/services/userManagementService.js';

describe('User Creation Persistence & Anti-Vanish on Reload', () => {
  it('harus mencabut user dari deleted list saat didaftarkan kembali oleh Super Admin', async () => {
    const testNip = '199201012024011099';
    const testEmail = 'dosen.test99@unsil.ac.id';

    // Daftarkan user baru
    const result = await storeNewUser({
      nip: testNip,
      nama: 'Dr. Test Dosen Persistensi, M.T.',
      email: testEmail,
      kode_unit: 'UN58.13',
      jabatan: 'Dosen Fungsional (Tridharma)',
      role: 'DOSEN',
      password: 'SilokaTestPass2026!'
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.nip).toBe(testNip);
    expect(result.user.role_slug).toBe('drafter');

    // Ambil data database
    const all = await getAllUsersFromDatabase();
    const found = all.find((u) => u.nip === testNip);
    expect(found).toBeDefined();
    expect(found.nama_lengkap).toBe('Dr. Test Dosen Persistensi, M.T.');
    expect(found.role_slug).toBe('drafter');
  });

  it('harus memastikan pejabat struktural baru mendapatkan role_slug pimpinan dan wewenang disposisi', async () => {
    const testNip = '198305122010121088';
    const testEmail = 'dekan.test88@unsil.ac.id';

    const result = await storeNewUser({
      nip: testNip,
      nama: 'Prof. Dr. Pejabat Uji, S.T., M.T.',
      email: testEmail,
      kode_unit: 'UN58.13',
      jabatan: 'Dekan Fakultas Teknik',
      role: 'PEJABAT',
      password: 'SilokaDekan2026!'
    });

    expect(result.success).toBe(true);
    expect(result.user.is_pejabat).toBe(true);
    expect(result.user.role_slug).toBe('pimpinan');

    const all = await getAllUsersFromDatabase();
    const found = all.find((u) => u.nip === testNip);
    expect(found).toBeDefined();
    expect(found.role_slug).toBe('pimpinan');
    expect(found.is_pejabat).toBe(true);
  });
});
