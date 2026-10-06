import { describe, it, expect } from 'vitest';
import usersData from '../../../data/users.json';
import { isSuperAdminUser } from '../../../utils/authGuards';

describe('Verifikasi Presets Akun Masuk (Uji Coba) Selaras dengan Manajemen Pengguna', () => {
  const CANONICAL_MANAJEMEN_PENGGUNA = [
    {
      id: 'usr-ac-01',
      nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
      email: 'agungcahyanur@unsil.ac.id',
      nip: '200008172027031001',
      jabatan: 'Pengadministrasi Persuratan / Tata Usaha',
      role: 'STAF'
    },
    {
      id: 'usr-01',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      email: 'aripin@unsil.ac.id',
      nip: '196708161996031001',
      jabatan: 'Rektor Universitas Siliwangi',
      role: 'PEJABAT'
    },
    {
      id: 'usr-dg-01',
      nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
      email: 'dedegunawan@unsil.ac.id',
      nip: '198501012010121001',
      jabatan: 'Super Administrator',
      role: 'Super Admin',
      is_super_admin: true
    },
    {
      id: 'usr-muw7evv4-1003',
      nama_lengkap: 'Prof. Dr. H. Dedi Kusmayadi, S.E., M.Si., Ak., CA., CRBC., ACPA., CPA., CRA., CRP., CSBA., ASEAN-CPA',
      email: 'dedikusmayadi@unsil.ac.id',
      nip: '196811132021211003',
      jabatan: 'Wakil Rektor Bidang Akademik',
      role: 'PEJABAT'
    },
    {
      id: 'usr-ar-01',
      nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
      email: 'aderustiana@unsil.ac.id',
      nip: '196801021992031002',
      jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
      role: 'PEJABAT'
    }
  ];

  it('seluruh 5 akun dari Manajemen Pengguna (Image 2) harus terdaftar di master data kepegawaian', () => {
    CANONICAL_MANAJEMEN_PENGGUNA.forEach((official) => {
      const match = usersData.find(
        (u) =>
          u.email === official.email ||
          u.id === official.id ||
          u.nip === official.nip ||
          u.nip_nik === official.nip
      );
      expect(match).toBeDefined();
      expect(match.email).toBe(official.email);
    });
  });

  it('Super Admin harus teridentifikasi secara deterministik', () => {
    const superAdmin = CANONICAL_MANAJEMEN_PENGGUNA.find((u) => u.email === 'dedegunawan@unsil.ac.id');
    expect(isSuperAdminUser(superAdmin)).toBe(true);

    const rektor = CANONICAL_MANAJEMEN_PENGGUNA.find((u) => u.email === 'aripin@unsil.ac.id');
    expect(isSuperAdminUser(rektor)).toBe(false);
  });

  it('email naskah dinas Rektor harus resmi aripin@unsil.ac.id bukan format lama', () => {
    const rektor = usersData.find((u) => u.id === 'usr-01');
    expect(rektor.email).toBe('aripin@unsil.ac.id');
    expect(rektor.email).not.toBe('aripin.rektor@unsil.ac.id');
  });

  it('akun Wakil Rektor I dan Wakil Rektor II harus memiliki NIP dan data kepegawaian resmi', () => {
    const warek1 = usersData.find((u) => u.email === 'dedikusmayadi@unsil.ac.id' || u.id === 'usr-muw7evv4-1003');
    expect(warek1).toBeDefined();
    expect(warek1.jabatan).toBe('Wakil Rektor Bidang Akademik');
    expect(warek1.nip).toBe('196811132021211003');

    const warek2 = usersData.find((u) => u.email === 'aderustiana@unsil.ac.id' || u.id === 'usr-ar-01');
    expect(warek2).toBeDefined();
    expect(warek2.jabatan).toBe('Wakil Rektor Bidang Keuangan dan Umum');
    expect(warek2.nip).toBe('196801021992031002');
  });
});
