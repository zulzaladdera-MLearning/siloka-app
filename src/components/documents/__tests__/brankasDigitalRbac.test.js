import { describe, it, expect } from 'vitest';
import { canAccessBrankasDigital } from '../../../utils/authGuards';
import usersData from '../../../data/users.json';

describe('Otorisasi RBAC Menu & Modul Brankas Digital (Secure Vault)', () => {
  it('menyembunyikan (false) Brankas Digital untuk akun role Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan)', () => {
    const dosenZulza = {
      name: 'Zulza Laddera Aripin, S.Kom., M.T.',
      role: 'PEJABAT', // meskipun tersimpan PEJABAT di cache lama, jabatan Dosen Informatika FT tetap diblokir
      roleLabel: 'Dosen Informatika FT',
      jabatan: 'Dosen Informatika FT'
    };
    expect(canAccessBrankasDigital(dosenZulza)).toBe(false);

    const dosenAris = usersData.find((u) => u.id === 'usr-dosen-01');
    const dosenRina = usersData.find((u) => u.id === 'usr-dosen-02');
    expect(canAccessBrankasDigital(dosenAris)).toBe(false);
    expect(canAccessBrankasDigital(dosenRina)).toBe(false);
  });

  it('menyembunyikan (false) Brankas Digital untuk akun role Staf Pelaksana Biasa & Operator Fakultas/Lembaga/UPA', () => {
    const stafPelaksanaUsers = [
      usersData.find((u) => u.id === 'usr-02'),
      usersData.find((u) => u.id === 'usr-06'),
      { role: 'OPERATOR_UNIT', roleLabel: 'Operator Tata Usaha FKIP', unit: 'FKIP' },
      { role: 'OPERATOR_UNIT', roleLabel: 'Operator Tata Usaha Fakultas Teknik', unit: 'FT' },
      { role: 'OPERATOR_UNIT', roleLabel: 'Operator Pengelola Perpustakaan', unit: 'UPA Perpustakaan' },
      { role: 'OPERATOR_UNIT', roleLabel: 'Staf Admin Jaringan & Server TIK', unit: 'UPA TIK' }
    ].filter(Boolean);

    for (const user of stafPelaksanaUsers) {
      expect(canAccessBrankasDigital(user)).toBe(false);
    }

    // Staf Pelaksana Tupoksi (Keuangan, Kepegawaian, Akademik, BMN)
    expect(
      canAccessBrankasDigital({
        role: 'STAF_ADMINISTRASI',
        id_role: 5,
        roleLabel: 'Staf / Pelaksana Administrasi Tim Bidang Keuangan',
        unit: 'Biro Keuangan dan Umum (BKU)'
      })
    ).toBe(false);
  });

  it('menampilkan (true) Brankas Digital untuk Staf Khusus (Arsiparis Pusat/Biro & Pengendali Surat BKU/BAKPK)', () => {
    const arsiparisBku = {
      role: 'STAF_PERSURATAN',
      roleLabel: 'Staf Persuratan & Kearsipan BKU',
      jabatan: 'Arsiparis',
      unit_kerja_id: 'UN58.6'
    };
    const arsiparisBakpk = {
      role: 'STAF_PERSURATAN',
      roleLabel: 'Staf Persuratan & Tata Usaha BAKPK',
      jabatan: 'Arsiparis',
      unit_kerja_id: 'UN58.5'
    };
    expect(canAccessBrankasDigital(arsiparisBku)).toBe(true);
    expect(canAccessBrankasDigital(arsiparisBakpk)).toBe(true);

    const arsiparisHkok = {
      role: 'STAF_ADMINISTRASI',
      id_role: 5,
      roleLabel: 'Arsiparis / Pengendali Surat (Tim Bidang HKOK BKU)',
      jabatan: 'Arsiparis / Pengendali Surat',
      unit_kerja_id: 'UN58.6'
    };
    expect(canAccessBrankasDigital(arsiparisHkok)).toBe(true);
  });

  it('menampilkan (true) Brankas Digital untuk Dosen dengan Tugas Tambahan / Pejabat Struktural (Rektor, Warek, Dekan, Kepala LPPM/LPMPP, Ketua SPI)', () => {
    const pejabatOfficial = [
      usersData.find((u) => u.id === 'usr-dg-01'),
      usersData.find((u) => u.id === 'usr-01'),
      usersData.find((u) => u.id === 'usr-warek-01'),
      usersData.find((u) => u.id === 'usr-warek-02'),
      usersData.find((u) => u.id === 'usr-warek-03'),
      usersData.find((u) => u.id === 'usr-mv6dqseh-1001'),
      { role: 'PEJABAT', is_pejabat: true, jabatan: 'Ketua Satuan Pengawas Internal (SPI)', unit: 'Satuan Pengawas Internal' },
      { role: 'PEJABAT', is_pejabat: true, jabatan: 'Kepala Biro Keuangan dan Umum (BKU)', unit: 'Biro Keuangan dan Umum' },
      { role: 'PEJABAT', is_pejabat: true, jabatan: 'Dekan Fakultas Teknik', unit: 'Fakultas Teknik' },
      { role: 'PEJABAT', is_pejabat: true, jabatan: 'Ketua LPPM Universitas Siliwangi', unit: 'LPPM' }
    ].filter(Boolean);

    for (const user of pejabatOfficial) {
      expect(canAccessBrankasDigital(user)).toBe(true);
    }
  });
});
