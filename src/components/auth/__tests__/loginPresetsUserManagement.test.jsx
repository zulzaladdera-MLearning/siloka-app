import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import usersData from '../../../data/users.json';
import { isSuperAdminUser } from '../../../utils/authGuards';
import {
  CANONICAL_MANAJEMEN_PENGGUNA_USERS,
  deduplicateUsers,
  formatShortAcademicName,
  mapUserToDemoPreset
} from '../LoginPage';

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
      id: 'usr-warek-01',
      nama_lengkap: 'Prof. Dr. Dedi Nurjamil, M.Pd.',
      email: 'dedi.warek1@unsil.ac.id',
      nip: '197005141997021001',
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
    const warek1 = usersData.find((u) => u.email === 'dedi.warek1@unsil.ac.id' || u.id === 'usr-warek-01');
    expect(warek1).toBeDefined();
    expect(warek1.jabatan).toBe('Wakil Rektor Bidang Akademik');
    expect(warek1.nip).toBe('197005141997021001');

    const warek2 = usersData.find((u) => u.email === 'aderustiana@unsil.ac.id' || u.id === 'usr-ar-01');
    expect(warek2).toBeDefined();
    expect(warek2.jabatan).toBe('Wakil Rektor Bidang Keuangan dan Umum');
    expect(warek2.nip).toBe('196801021992031002');
  });
});

describe('Deduplikasi & Resolusi Real-Time Presets Login (Anti-Duplicate & Role Alignment)', () => {
  it('deduplicateUsers harus mengeliminasi entri duplikat yang memiliki nama/NIP sama (contoh: Dr. Hendra Gunawan)', () => {
    const rawListWithDuplicates = [
      {
        id: 'usr-dekan-01',
        nama_lengkap: 'Dr. Hendra Gunawan, M.T.',
        nip: '198001012005011001',
        email: 'hendra.dekan@unsil.ac.id',
        jabatan: 'Dekan Fakultas Teknik',
        role: 'PEJABAT'
      },
      {
        id: 'usr-dekan-02',
        nama_lengkap: 'Dr. Hendra Gunawan, M.T.',
        nip: '198001012005011001',
        email: 'hendra.gunawan@unsil.ac.id',
        jabatan: 'Dekan Fakultas Teknik',
        role: 'PEJABAT'
      },
      {
        id: 'usr-01',
        nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
        nip: '196708161996031001',
        email: 'aripin@unsil.ac.id',
        jabatan: 'Rektor Universitas Siliwangi',
        role: 'PEJABAT'
      }
    ];

    const deduped = deduplicateUsers(rawListWithDuplicates);
    expect(deduped.length).toBe(2);

    const hendraCount = deduped.filter((u) => u.nama_lengkap.includes('Hendra Gunawan'));
    expect(hendraCount.length).toBe(1);
    expect(hendraCount[0].id).toBe('usr-dekan-01');
  });

  it('deduplicateUsers harus mengecualikan pengguna non-aktif (is_active === false)', () => {
    const list = [
      { id: 'u1', nama_lengkap: 'User Aktif', nip: '111111111111111111', is_active: true },
      { id: 'u2', nama_lengkap: 'User Nonaktif', nip: '222222222222222222', is_active: false }
    ];
    const res = deduplicateUsers(list);
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('u1');
  });

  it('mapUserToDemoPreset memetakan role dan SOTK secara akurat sesuai spesifikasi UNSIL', () => {
    // 1. Super Admin
    const superAdmin = mapUserToDemoPreset({
      id: 'usr-dg-01',
      nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
      email: 'dedegunawan@unsil.ac.id',
      role: 'Super Admin',
      is_super_admin: true
    });
    expect(superAdmin.labelPrefix).toBe('★ Super Admin:');
    expect(superAdmin.isSuper).toBe(true);
    expect(superAdmin.orderPriority).toBe(0);

    // 2. Rektorat
    const rektor = mapUserToDemoPreset({
      id: 'usr-01',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      email: 'aripin@unsil.ac.id',
      jabatan: 'Rektor Universitas Siliwangi',
      role: 'PEJABAT'
    });
    expect(rektor.labelPrefix).toBe('Rektorat:');
    expect(rektor.displayName).toBe('Prof. Aripin');
    expect(rektor.orderPriority).toBe(1);

    // 3. Wakil Rektor III (Kemahasiswaan & Alumni)
    const warek3 = mapUserToDemoPreset({
      id: 'usr-warek-03',
      nama_lengkap: 'Dr. Ir. Nurul Hiron, S.T., M.M., M.Eng., IPU., ASEAN Eng.',
      email: 'nurulhiron@unsil.ac.id',
      jabatan: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
      role: 'PEJABAT'
    });
    expect(warek3.labelPrefix).toBe('Wakil Rektor III:');
    expect(warek3.displayName).toBe('Dr. Ir. Nurul Hiron');

    // 4. Ketua Senat
    const senat = mapUserToDemoPreset({
      id: 'usr-senat-01',
      nama_lengkap: 'Prof. Deden Mulyana, S.E., M.Si.',
      email: 'dedenmulyana@unsil.ac.id',
      jabatan: 'Ketua Senat Universitas Siliwangi',
      role: 'PEJABAT'
    });
    expect(senat.labelPrefix).toBe('Ketua Senat:');
    expect(senat.displayName).toBe('Prof. Deden Mulyana');

    // 5. Dekan
    const dekan = mapUserToDemoPreset({
      id: 'usr-dekan-01',
      nama_lengkap: 'Dr. Hendra Gunawan, M.T.',
      email: 'hendra@unsil.ac.id',
      jabatan: 'Dekan Fakultas Teknik',
      role: 'PEJABAT'
    });
    expect(dekan.labelPrefix).toBe('Dekan:');
    expect(dekan.displayName).toBe('Dr. Hendra Gunawan');

    // 6. Pengawas SPI
    const spi = mapUserToDemoPreset({
      id: 'usr-spi-01',
      nama_lengkap: 'Mochamad Iqbal, S.Ak.',
      email: 'operator.spi@unsil.ac.id',
      jabatan: 'Staf Administrasi & Audit SPI',
      role: 'OPERATOR_UNIT'
    });
    expect(spi.labelPrefix).toBe('Pengawas SPI:');
    expect(spi.displayName).toBe('Mochamad Iqbal');

    // 7. Staf TU / Operator Unit
    const tu = mapUserToDemoPreset({
      id: 'usr-ac-01',
      nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
      email: 'agungcahyanur@unsil.ac.id',
      jabatan: 'Pengadministrasi Persuratan / Tata Usaha',
      role: 'STAF'
    });
    expect(tu.labelPrefix).toBe('Staf TU:');
    expect(tu.displayName).toBe('Agung Cahya Nur');

    // 8. Dosen / Drafter Tridharma
    const dosen = mapUserToDemoPreset({
      id: 'usr-dosen-01',
      nama_lengkap: 'Zulza Laddera Aripin, S.Kom., M.Kom.',
      email: 'zulza@unsil.ac.id',
      jabatan: 'Dosen Jurusan Sains Data',
      role: 'DOSEN'
    });
    expect(dosen.labelPrefix).toBe('Dosen:');
    expect(dosen.displayName).toBe('Zulza Laddera Aripin');
  });
});
