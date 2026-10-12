import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPositionsByUnitAndRole,
  getDefaultStrukturOrganisasi,
  getStrukturOrganisasiByUnit,
  getActiveUnitKerjaList,
  resolveJabatanScope
} from '../../../utils/unitJabatanOptions';

describe('UnitManagement - Fitur Edit & Kelola Struktur Organisasi Dinamis', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('dapat menghasilkan struktur organisasi standar SOTK untuk unit kerja Fakultas Teknik', () => {
    const defaultStruktur = getDefaultStrukturOrganisasi('UN58.13');
    expect(Array.isArray(defaultStruktur)).toBe(true);
    expect(defaultStruktur.length).toBeGreaterThan(0);

    // Memiliki seluruh 4 kategori peran
    const roles = new Set(defaultStruktur.map((s) => s.kategori_peran));
    expect(roles.has('pimpinan')).toBe(true);
    expect(roles.has('verifikator')).toBe(true);
    expect(roles.has('admin_tu')).toBe(true);
    expect(roles.has('drafter')).toBe(true);
  });

  it('dapat menambah jabatan kustom baru (misal: Kepala Pusat Inkubator) dan langsung terbaca pada pilihan jabatan', () => {
    const unitList = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        struktur_organisasi: [
          {
            id: 'str-custom-1',
            nama_jabatan: 'Dekan Fakultas Teknik',
            kategori_peran: 'pimpinan',
            level_hirarki: 1
          },
          {
            id: 'str-custom-2',
            nama_jabatan: 'Kepala Pusat Inkubator Bisnis dan Teknologi',
            kategori_peran: 'pimpinan',
            level_hirarki: 2
          }
        ]
      }
    ];

    const pimpinan = getPositionsByUnitAndRole('UN58.13', 'pimpinan', unitList);
    expect(pimpinan).toContain('Dekan Fakultas Teknik');
    expect(pimpinan).toContain('Kepala Pusat Inkubator Bisnis dan Teknologi');
  });

  it('dapat mengubah (edit) nama jabatan pada struktur organisasi unit', () => {
    const unitList = [
      {
        kode_unit: 'UN58.6',
        singkatan: 'BKU',
        nama_unit: 'Biro Keuangan dan Umum',
        tipe_unit: 'BIRO',
        struktur_organisasi: [
          {
            id: 'str-bku-1',
            nama_jabatan: 'Kepala Biro Keuangan, Perencanaan, dan Sistem Informasi',
            kategori_peran: 'pimpinan',
            level_hirarki: 1
          }
        ]
      }
    ];

    const pimpinan = getPositionsByUnitAndRole('UN58.6', 'pimpinan', unitList);
    expect(pimpinan).toEqual(['Kepala Biro Keuangan, Perencanaan, dan Sistem Informasi']);
    expect(pimpinan).not.toContain('Kepala Biro Keuangan dan Umum');
  });

  it('dapat menghapus posisi jabatan dari struktur organisasi unit', () => {
    const initialStruktur = getDefaultStrukturOrganisasi('UN58.13');
    // Hapus salah satu jabatan pimpinan
    const filteredStruktur = initialStruktur.filter(
      (s) => !s.nama_jabatan.includes('Teknik Sipil')
    );

    const unitList = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        struktur_organisasi: filteredStruktur
      }
    ];

    const pimpinan = getPositionsByUnitAndRole('UN58.13', 'pimpinan', unitList);
    expect(pimpinan.some((p) => p.includes('Teknik Sipil'))).toBe(false);
  });

  it('mengembalikan struktur organisasi bawaan jika unit belum memiliki struktur kustom', () => {
    const struktur = getStrukturOrganisasiByUnit('UN58.32'); // UPA TIK
    expect(Array.isArray(struktur)).toBe(true);
    expect(struktur.some((s) => s.nama_jabatan.includes('UPA'))).toBe(true);
  });

  it('jika jabatan atau seluruh peran telah dihapus, sistem tidak boleh mengembalikan ke default SOTK', () => {
    // Unit yang struktur_organisasinya hanya memuat 1 posisi pimpinan, sedangkan peran lain (admin_tu, verifikator) kosong
    const unitListWithDeletedRoles = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        struktur_organisasi: [
          {
            id: 'str-custom-only',
            nama_jabatan: 'Dekan Fakultas Teknik',
            kategori_peran: 'pimpinan',
            level_hirarki: 1
          }
        ]
      }
    ];

    // Peran admin_tu yang sudah dihapus tidak boleh dibangkitkan lagi dari default SOTK
    const adminTu = getPositionsByUnitAndRole('UN58.13', 'admin_tu', unitListWithDeletedRoles);
    expect(adminTu).toEqual([]);

    // Unit yang seluruh jabatannya dihapus (array kosong) harus tetap kosong
    const emptyUnitList = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        struktur_organisasi: []
      }
    ];

    const strukturKosong = getStrukturOrganisasiByUnit('UN58.13', emptyUnitList);
    expect(strukturKosong).toEqual([]);

    const pimpinanKosong = getPositionsByUnitAndRole('UN58.13', 'pimpinan', emptyUnitList);
    expect(pimpinanKosong).toEqual([]);
  });

  it('terhubung secara dinamis dengan penambahan peran baru dari Manajemen Peran Pengguna', () => {
    // Simulasi penambahan peran baru di Manajemen Peran: Auditor Internal SPI
    const customRoleSlug = 'auditor_spi';
    const unitWithCustomRole = [
      {
        kode_unit: 'UN58.8',
        singkatan: 'SPI',
        nama_unit: 'Satuan Pengawas Internal',
        tipe_unit: 'ORGAN',
        struktur_organisasi: [
          {
            id: 'str-spi-1',
            nama_jabatan: 'Ketua Satuan Pengawas Internal',
            kategori_peran: 'pimpinan',
            level_hirarki: 1
          },
          {
            id: 'str-spi-2',
            nama_jabatan: 'Auditor Utama Bidang Keuangan dan Aset SPI',
            kategori_peran: customRoleSlug,
            level_hirarki: 2
          },
          {
            id: 'str-spi-3',
            nama_jabatan: 'Auditor Muda Bidang Tata Kelola dan SDM SPI',
            kategori_peran: customRoleSlug,
            level_hirarki: 3
          }
        ]
      }
    ];

    // Opsi jabatan untuk peran baru 'auditor_spi' harus langsung terbaca dinamis
    const positions = getPositionsByUnitAndRole('UN58.8', customRoleSlug, unitWithCustomRole);
    expect(positions).toHaveLength(2);
    expect(positions).toContain('Auditor Utama Bidang Keuangan dan Aset SPI');
    expect(positions).toContain('Auditor Muda Bidang Tata Kelola dan SDM SPI');
  });

  it('dapat memisahkan dan mendeteksi lingkup jabatan Dekanat vs Jurusan/Prodi secara akurat', () => {
    const ftJurusan = [
      { id: 'j1', kode: 'IF', nama: 'Informatika' },
      { id: 'j2', kode: 'TS', nama: 'Teknik Sipil' },
      { id: 'j3', kode: 'TE', nama: 'Teknik Elektro' }
    ];

    // Jabatan tingkat Dekanat
    expect(resolveJabatanScope('Dekan Fakultas Teknik', ftJurusan)).toBe('FAKULTAS');
    expect(resolveJabatanScope('Wakil Dekan Bidang Akademik FT', ftJurusan)).toBe('FAKULTAS');
    expect(resolveJabatanScope('Kepala Bagian Tata Usaha FT', ftJurusan)).toBe('FAKULTAS');

    // Jabatan per Jurusan
    expect(resolveJabatanScope('Ketua Jurusan Informatika', ftJurusan)).toBe('Informatika');
    expect(resolveJabatanScope('Sekretaris Jurusan Informatika', ftJurusan)).toBe('Informatika');
    expect(resolveJabatanScope('Dosen Jurusan Teknik Sipil', ftJurusan)).toBe('Teknik Sipil');
    expect(resolveJabatanScope('Kepala Laboratorium Telekomunikasi Teknik Elektro', ftJurusan)).toBe('Teknik Elektro');

    // Objek dengan properti jurusan eksplisit
    expect(resolveJabatanScope({ nama_jabatan: 'Kepala Lab Komputasi', jurusan: 'Informatika' }, ftJurusan)).toBe('Informatika');
    expect(resolveJabatanScope({ nama_jabatan: 'Koordinator Riset', jurusan: 'FAKULTAS' }, ftJurusan)).toBe('FAKULTAS');
  });

  it('mendukung prioritas jabatan berdasarkan targetJurusan saat dipanggil oleh modul pengguna', () => {
    const ftUnit = [
      {
        kode_unit: 'UN58.13',
        singkatan: 'FT',
        nama_unit: 'Fakultas Teknik',
        tipe_unit: 'FAKULTAS',
        jurusan: [{ nama: 'Informatika' }, { nama: 'Teknik Sipil' }],
        struktur_organisasi: [
          { nama_jabatan: 'Dekan Fakultas Teknik', kategori_peran: 'pimpinan', jurusan: 'FAKULTAS' },
          { nama_jabatan: 'Ketua Jurusan Informatika', kategori_peran: 'pimpinan', jurusan: 'Informatika' },
          { nama_jabatan: 'Ketua Jurusan Teknik Sipil', kategori_peran: 'pimpinan', jurusan: 'Teknik Sipil' }
        ]
      }
    ];

    // Saat targetJurusan 'Informatika' dipilih, posisi Informatika harus diprioritaskan di awal
    const ifPimpinan = getPositionsByUnitAndRole('UN58.13', 'pimpinan', ftUnit, 'Informatika');
    expect(ifPimpinan[0]).toBe('Ketua Jurusan Informatika');
    expect(ifPimpinan).toContain('Dekan Fakultas Teknik');
  });
});
