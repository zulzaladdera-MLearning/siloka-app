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
    const stafPelaksanaIds = [
      'usr-02', // Staf Tata Usaha & Protokoler Rektorat
      'usr-04', // Staf Sekretariat Senat
      'usr-06', // Staf Administrasi & Audit SPI
      'usr-08', // Staf Sekretariat Dewan Penyantun
      'usr-14', // Operator Tata Usaha FKIP
      'usr-16', // Operator Tata Usaha FEB
      'usr-20', // Operator Tata Usaha Fakultas Teknik
      'usr-30', // Staf Administrasi Penelitian LPPM
      'usr-32', // Staf Administrasi Mutu LPMPP
      'usr-34', // Operator Pengelola Perpustakaan
      'usr-36'  // Staf Admin Jaringan & Server TIK
    ];

    for (const id of stafPelaksanaIds) {
      const user = usersData.find((u) => u.id === id);
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
    const arsiparisBku = usersData.find((u) => u.id === 'usr-12'); // Staf Persuratan & Kearsipan BKU
    const arsiparisBakpk = usersData.find((u) => u.id === 'usr-10'); // Staf Persuratan & Tata Usaha BAKPK
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
    const pejabatIds = [
      'usr-admin-01', // Super Admin
      'usr-01',       // Rektor Universitas Siliwangi
      'usr-warek-01', // Wakil Rektor Bidang Akademik
      'usr-warek-02', // Wakil Rektor Bidang Keuangan dan Umum
      'usr-warek-03', // Wakil Rektor Bidang Kemahasiswaan dan Alumni
      'usr-05',       // Ketua Satuan Pengawas Internal (SPI)
      'usr-09',       // Kepala Biro BAKPK
      'usr-11',       // Kepala Biro Keuangan dan Umum (BKU)
      'usr-13',       // Dekan FKIP
      'usr-19',       // Dekan Fakultas Teknik
      'usr-27',       // Direktur Program Pascasarjana
      'usr-29',       // Ketua LPPM Universitas Siliwangi
      'usr-31'        // Ketua LPMPP Universitas Siliwangi
    ];

    for (const id of pejabatIds) {
      const user = usersData.find((u) => u.id === id);
      expect(canAccessBrankasDigital(user)).toBe(true);
    }
  });
});
