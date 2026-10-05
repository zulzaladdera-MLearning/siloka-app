import { describe, it, expect } from 'vitest';
import { getAllOfficialsWithUserMapping } from '../pejabatHelper';

describe('Integrasi Tujuan Surat (Pejabat UNSIL) dengan Manajemen Pengguna & SOTK', () => {
  it('harus memuat daftar pejabat resmi dengan pemetaan akun pengguna yang tersedia', () => {
    const officials = getAllOfficialsWithUserMapping();
    expect(Array.isArray(officials)).toBe(true);
    expect(officials.length).toBeGreaterThan(15);

    // Verifikasi Rektor selalu berada di urutan teratas
    const topOfficial = officials[0];
    expect(topOfficial.jabatan.toLowerCase()).toContain('rektor universitas');
    expect(topOfficial.kategori).toBe('Pimpinan Rektorat & Organ Universitas');
    expect(topOfficial.kode_unit).toBe('UN58');
  });

  it('harus secara dinamis menyelaraskan pejabat yang ada saat diberikan allUsers dari Manajemen Pengguna', () => {
    // Simulasi data dari state allUsers (Manajemen Pengguna)
    const simulatedAllUsers = [
      {
        id: 'usr-dekan-ft-99',
        name: 'Prof. Dr. Ir. H. Maman Suratman, M.T.',
        nama_lengkap: 'Prof. Dr. Ir. H. Maman Suratman, M.T.',
        email: 'dekan.ft.baru@unsil.ac.id',
        nip: '197501012000031001',
        nip_nik: '197501012000031001',
        unit_kerja_id: 'UN58.13',
        unit: 'Fakultas Teknik',
        jabatan: 'Dekan Fakultas Teknik',
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true
      }
    ];

    const officials = getAllOfficialsWithUserMapping(simulatedAllUsers);
    const dekanFT = officials.find(
      (o) => o.kode_unit === 'UN58.13' && o.jabatan.toLowerCase().includes('dekan fakultas teknik')
    );

    expect(dekanFT).toBeDefined();
    // Harus merefleksikan perubahan dari Manajemen Pengguna
    expect(dekanFT.nama_gelar).toBe('Prof. Dr. Ir. H. Maman Suratman, M.T.');
    expect(dekanFT.nip).toBe('197501012000031001');
    expect(dekanFT.user_id).toBe('usr-dekan-ft-99');
    expect(dekanFT.user_email).toBe('dekan.ft.baru@unsil.ac.id');
    expect(dekanFT.has_active_account).toBe(true);
    expect(dekanFT.is_from_user_management).toBe(true);
    expect(dekanFT.unit_nama).toBe('Fakultas Teknik');
  });

  it('harus secara dinamis memasukkan akun pejabat baru yang dibuat di Manajemen Pengguna ke dalam daftar Tujuan Surat', () => {
    // Akun baru: Ketua Jurusan Informatika (belum ada di masterPejabat JSON awal)
    const simulatedAllUsers = [
      {
        id: 'usr-kajur-if-01',
        name: 'Ardi Mardiana, S.T., M.Kom.',
        nama_lengkap: 'Ardi Mardiana, S.T., M.Kom.',
        email: 'kajur.informatika@unsil.ac.id',
        nip: '198506152010121004',
        nip_nik: '198506152010121004',
        unit_kerja_id: 'UN58.13',
        unit: 'Fakultas Teknik',
        jabatan: 'Ketua Jurusan Informatika',
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true
      }
    ];

    const officials = getAllOfficialsWithUserMapping(simulatedAllUsers);
    const kajurIF = officials.find((o) => o.jabatan === 'Ketua Jurusan Informatika');

    expect(kajurIF).toBeDefined();
    expect(kajurIF.user_id).toBe('usr-kajur-if-01');
    expect(kajurIF.user_email).toBe('kajur.informatika@unsil.ac.id');
    expect(kajurIF.nama_gelar).toBe('Ardi Mardiana, S.T., M.Kom.');
    expect(kajurIF.nip).toBe('198506152010121004');
    expect(kajurIF.kode_unit).toBe('UN58.13');
    expect(kajurIF.unit_nama).toBe('Fakultas Teknik');
    expect(kajurIF.kategori).toBe('Ketua Jurusan & Koordinator Program Studi');
    expect(kajurIF.has_active_account).toBe(true);
  });

  it('tidak boleh memasukkan dosen biasa atau staf non-pejabat ke daftar pejabat struktural tujuan surat', () => {
    const simulatedAllUsers = [
      {
        id: 'usr-dosen-biasa-01',
        name: 'Dosen Biasa S.Pd., M.Pd.',
        email: 'dosen.biasa@unsil.ac.id',
        unit_kerja_id: 'UN58.10',
        jabatan: 'Dosen Fungsional Pendidikan Matematika',
        role: 'DOSEN',
        role_slug: 'dosen_non_jabatan',
        is_pejabat: false
      },
      {
        id: 'usr-staf-tu-01',
        name: 'Staf Administrasi TU',
        email: 'tu.staf@unsil.ac.id',
        unit_kerja_id: 'UN58.10',
        jabatan: 'Pengadministrasi Persuratan',
        role: 'OPERATOR_UNIT',
        role_slug: 'admin_tu',
        is_pejabat: false
      }
    ];

    const officials = getAllOfficialsWithUserMapping(simulatedAllUsers);
    const dosenMatch = officials.find((o) => o.user_id === 'usr-dosen-biasa-01');
    const stafMatch = officials.find((o) => o.user_id === 'usr-staf-tu-01');

    expect(dosenMatch).toBeUndefined();
    expect(stafMatch).toBeUndefined();
  });
});
