import { describe, it, expect } from 'vitest';
import { isDisposisiAuthorizedOfficial, matchesOfficialDisposisiPosition } from '../disposisiStandards';

describe('Hak Akses Fitur Disposisi (Contoh 21) Berdasarkan Manajemen Role & SOTK UNSIL', () => {
  describe('1. Akun Pejabat SOTK UNSIL (Gambar 2) WAJIB Memiliki Fitur Disposisi', () => {
    it('wajib aktif untuk Pimpinan Universitas: Rektor & Wakil Rektor I/II/III/IV', () => {
      const rektor = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Rektor Universitas Siliwangi'
      };
      const warek1 = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Wakil Rektor I (Akademik)'
      };
      const warek2 = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Wakil Rektor II (Umum & Keuangan)'
      };
      const warek3 = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Wakil Rektor III (Kemahasiswaan & Alumni)'
      };

      expect(isDisposisiAuthorizedOfficial(rektor)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(warek1)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(warek2)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(warek3)).toBe(true);
    });

    it('wajib aktif untuk Fakultas & Pascasarjana: Dekan, Wadek, Direktur Pasca, Kajur, Kaprodi', () => {
      const dekan = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Dekan Fakultas Teknik'
      };
      const wadek = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Wakil Dekan Bidang Akademik'
      };
      const direkturPasca = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Direktur Pascasarjana'
      };
      const kajur = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua Jurusan Informatika'
      };
      const kaprodi = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Koordinator Program Studi Teknik Elektro'
      };

      expect(isDisposisiAuthorizedOfficial(dekan)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(wadek)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(direkturPasca)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(kajur)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(kaprodi)).toBe(true);
    });

    it('wajib aktif untuk Biro & Bagian: Kepala Biro (BAKPK, BKU) & Kepala Bagian', () => {
      const kabiroBAKPK = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Kepala Biro BAKPK'
      };
      const kabiroBKU = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Kepala Biro BKU'
      };
      const kabagUmum = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Kepala Bagian Umum'
      };

      expect(isDisposisiAuthorizedOfficial(kabiroBAKPK)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(kabiroBKU)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(kabagUmum)).toBe(true);
    });

    it('wajib aktif untuk Lembaga & UPA: Ketua LPPM, Ketua LPMPP, Kepala UPA (Perpustakaan, TIK, Bahasa, dll.)', () => {
      const ketuaLPPM = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua LPPM'
      };
      const ketuaLPMPP = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua LPMPP'
      };
      const kepalaUPATIK = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Kepala UPA TIK'
      };
      const kepalaPerpus = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Kepala UPA Perpustakaan'
      };

      expect(isDisposisiAuthorizedOfficial(ketuaLPPM)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(ketuaLPMPP)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(kepalaUPATIK)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(kepalaPerpus)).toBe(true);
    });

    it('wajib aktif untuk Organ Khusus: Ketua Senat Universitas & Ketua SPI', () => {
      const ketuaSenat = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua Senat Universitas'
      };
      const ketuaSPI = {
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua Satuan Pengawas Internal (SPI)'
      };

      expect(isDisposisiAuthorizedOfficial(ketuaSenat)).toBe(true);
      expect(isDisposisiAuthorizedOfficial(ketuaSPI)).toBe(true);
    });
  });

  describe('2. Akun Non-Pejabat DILARANG KERAS Memiliki Fitur Disposisi', () => {
    it('dilarang keras untuk Dosen Biasa / Non-Jabatan', () => {
      const dosenBiasa = {
        role: 'DOSEN',
        role_slug: 'drafter',
        is_pejabat: false,
        jabatan: 'Dosen Fungsional Pendidikan Bahasa'
      };
      const dosenTeknik = {
        role: 'DOSEN',
        role_slug: 'drafter',
        is_pejabat: false,
        jabatan: 'Dosen Biasa / Non-Jabatan'
      };

      expect(isDisposisiAuthorizedOfficial(dosenBiasa)).toBe(false);
      expect(isDisposisiAuthorizedOfficial(dosenTeknik)).toBe(false);
    });

    it('dilarang keras untuk Staf TU, Operator Unit, dan Pengadministrasi', () => {
      const operatorTU = {
        role: 'OPERATOR_UNIT',
        role_slug: 'admin_tu',
        is_pejabat: false,
        jabatan: 'Pengadministrasi Persuratan / Tata Usaha'
      };
      const stafPersuratan = {
        role: 'STAF',
        role_slug: 'admin_tu',
        is_pejabat: false,
        jabatan: 'Staf Loket Persuratan Masuk'
      };

      expect(isDisposisiAuthorizedOfficial(operatorTU)).toBe(false);
      expect(isDisposisiAuthorizedOfficial(stafPersuratan)).toBe(false);
    });

    it('dilarang keras untuk akun non-pejabat meskipun nama jabatannya memuat kata unit/jurusan/bagian', () => {
      // Contoh: Dosen di Jurusan Teknik Informatika (bukan Ketua Jurusan)
      const dosenDiJurusan = {
        role: 'DOSEN',
        role_slug: 'drafter',
        is_pejabat: false,
        jabatan: 'Dosen Pengajar Jurusan Teknik Informatika'
      };
      // Contoh: Staf di Bagian Umum (bukan Kepala Bagian)
      const stafBagian = {
        role: 'OPERATOR_UNIT',
        role_slug: 'admin_tu',
        is_pejabat: false,
        jabatan: 'Staf Pelaksana Bagian Umum'
      };

      expect(isDisposisiAuthorizedOfficial(dosenDiJurusan)).toBe(false);
      expect(isDisposisiAuthorizedOfficial(stafBagian)).toBe(false);
    });
  });

  describe('3. Sinkronisasi Dinamis dengan Manajemen Pengguna & Manajemen Role (allUsers)', () => {
    it('harus langsung mengaktifkan fitur jika akun diubah rolenya menjadi Pimpinan/Pejabat di Manajemen User', () => {
      const sessionUser = {
        id: 'usr-123',
        email: 'budi@unsil.ac.id',
        role: 'DOSEN',
        role_slug: 'drafter',
        is_pejabat: false,
        jabatan: 'Dosen'
      };

      // Di state Manajemen Pengguna (allUsers), Super Admin telah mempromosikan user ini menjadi Dekan
      const allUsersUpdated = [
        {
          id: 'usr-123',
          email: 'budi@unsil.ac.id',
          role: 'PEJABAT',
          role_slug: 'pimpinan',
          is_pejabat: true,
          jabatan: 'Dekan Fakultas Ekonomi dan Bisnis'
        }
      ];

      // Sebelum disinkronkan -> false
      expect(isDisposisiAuthorizedOfficial(sessionUser)).toBe(false);
      // Saat disinkronkan dengan Manajemen Pengguna -> WAJIB true
      expect(isDisposisiAuthorizedOfficial(sessionUser, allUsersUpdated)).toBe(true);
    });

    it('harus langsung mencabut fitur jika akun pejabat diubah rolenya menjadi Staf/Dosen di Manajemen User', () => {
      const sessionUser = {
        id: 'usr-456',
        email: 'mantan.pejabat@unsil.ac.id',
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua Jurusan'
      };

      // Di Manajemen Pengguna, status pejabat dicabut
      const allUsersUpdated = [
        {
          id: 'usr-456',
          email: 'mantan.pejabat@unsil.ac.id',
          role: 'DOSEN',
          role_slug: 'drafter',
          is_pejabat: false,
          jabatan: 'Dosen Biasa / Non-Jabatan'
        }
      ];

      expect(isDisposisiAuthorizedOfficial(sessionUser, allUsersUpdated)).toBe(false);
    });
  });
});
