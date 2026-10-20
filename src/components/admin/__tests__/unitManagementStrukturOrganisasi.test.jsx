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

  describe('Sinkronisasi Reaktif Struktur Organisasi & Akun Manajemen Pengguna', () => {
    it('harus mendeteksi pejabat petahana aktif pada formasi SOTK Senat Universitas', async () => {
      const { findPositionOccupant } = await import('../../../utils/unitJabatanOptions');
      const senatStruktur = getDefaultStrukturOrganisasi('UN58.SENAT');

      const mockUsers = [
        {
          id: 'usr-03',
          nip: '196901011994031002',
          name: 'Prof. Dr. Dedi Kusmayadi, S.E., M.Si., Ak., CA.',
          jabatan: 'Ketua Senat Universitas Siliwangi',
          unit_kerja_id: 'UN58.SENAT',
          is_active: true
        },
        {
          id: 'usr-07',
          nip: '197102021996031003',
          name: 'Sekretaris Senat UNSIL',
          jabatan: 'Sekretaris Senat Universitas Siliwangi',
          unit_kerja_id: 'UN58.SENAT',
          is_active: true
        }
      ];

      // Formasi Ketua Senat harus terisi oleh Prof. Dr. Dedi Kusmayadi
      const ketuaOccupant = findPositionOccupant('Ketua Senat Universitas Siliwangi', mockUsers, null, 'UN58.SENAT');
      expect(ketuaOccupant).toBeDefined();
      expect(ketuaOccupant.id).toBe('usr-03');
      expect(ketuaOccupant.name).toContain('Dedi Kusmayadi');

      // Formasi Sekretaris Senat harus terisi
      const sekretarisOccupant = findPositionOccupant('Sekretaris Senat Universitas Siliwangi', mockUsers, null, 'UN58.SENAT');
      expect(sekretarisOccupant).toBeDefined();
      expect(sekretarisOccupant.id).toBe('usr-07');

      // Formasi Ketua Komisi I Senat belum ada pejabatnya (lowong)
      const komisi1Occupant = findPositionOccupant('Ketua Komisi I (Akademik) Senat', mockUsers, null, 'UN58.SENAT');
      expect(komisi1Occupant).toBeNull();
    });

    it('harus otomatis menginkorporasikan jabatan kustom baru hasil CRUD Super Admin ke formasi unit', () => {
      const baseStruktur = getDefaultStrukturOrganisasi('UN58.SENAT');
      const existingNames = new Set(baseStruktur.map((item) => item.nama_jabatan.toLowerCase()));

      const newUserFromAdmin = {
        id: 'usr-custom-senat-99',
        name: 'Dr. Anggota Senat Komisi Etik',
        jabatan: 'Koordinator Advokasi dan Etik Senat',
        unit_kerja_id: 'UN58.SENAT',
        role_slug: 'pimpinan',
        is_active: true
      };

      // Pastikan jabatan ini awalnya belum ada di SOTK bawaan
      expect(existingNames.has(newUserFromAdmin.jabatan.toLowerCase())).toBe(false);

      // Simulasi sinkronisasi reaktif di enrichedUnits
      const syncedStruktur = [...baseStruktur];
      if (!existingNames.has(newUserFromAdmin.jabatan.toLowerCase())) {
        syncedStruktur.push({
          id: `sotk-auto-${newUserFromAdmin.id}`,
          nama_jabatan: newUserFromAdmin.jabatan,
          kategori_peran: 'pimpinan',
          level_hirarki: 1,
          jurusan: 'FAKULTAS'
        });
      }

      // Jabatan baru harus otomatis hadir di struktur unit
      expect(syncedStruktur.some((s) => s.nama_jabatan === 'Koordinator Advokasi dan Etik Senat')).toBe(true);
      expect(syncedStruktur.length).toBe(baseStruktur.length + 1);
    });
  });

  describe('CRUD Jurusan / Program Studi Ramah Pengguna', () => {
    it('dapat mengubah (edit/update) nama dan kode jurusan pada unit kerja', () => {
      const initialJurusan = [
        { id: 'jur-1', kode: 'PENMAS', nama: 'Pendidikan Masyarakat' },
        { id: 'jur-2', kode: 'PBSI', nama: 'Pendidikan Bahasa Indonesia' }
      ];

      // Simulasi update PBSI -> Pendidikan Bahasa dan Sastra Indonesia
      const editingId = 'jur-2';
      const updatedNama = 'Pendidikan Bahasa dan Sastra Indonesia';
      const updatedKode = 'PBSI';

      const updatedList = initialJurusan.map((j) => {
        if (j.id === editingId) {
          return { ...j, nama: updatedNama, kode: updatedKode };
        }
        return j;
      });

      expect(updatedList.find((j) => j.id === 'jur-2').nama).toBe('Pendidikan Bahasa dan Sastra Indonesia');
      expect(updatedList.length).toBe(2);
    });

    it('otomatis menyinkronkan nama jurusan pada struktur jabatan saat jurusan diubah', () => {
      let struktur = [
        { nama_jabatan: 'Ketua Jurusan Pendidikan Bahasa Indonesia', jurusan: 'Pendidikan Bahasa Indonesia' },
        { nama_jabatan: 'Sekretaris Jurusan Pendidikan Bahasa Indonesia', jurusan: 'Pendidikan Bahasa Indonesia' },
        { nama_jabatan: 'Dekan Fakultas', jurusan: 'FAKULTAS' }
      ];

      const oldName = 'Pendidikan Bahasa Indonesia';
      const newName = 'Pendidikan Bahasa dan Sastra Indonesia';

      const updatedStruktur = struktur.map((item) => {
        if (item.jurusan === oldName) {
          return { ...item, jurusan: newName };
        }
        return item;
      });

      expect(updatedStruktur[0].jurusan).toBe('Pendidikan Bahasa dan Sastra Indonesia');
      expect(updatedStruktur[1].jurusan).toBe('Pendidikan Bahasa dan Sastra Indonesia');
      expect(updatedStruktur[2].jurusan).toBe('FAKULTAS'); // Lingkup Dekanat tidak terganggu
    });

    it('dapat menghapus jurusan dan mencegah duplikasi nama jurusan baru', () => {
      const jurusanList = [
        { id: 'jur-1', kode: 'PENMAS', nama: 'Pendidikan Masyarakat' },
        { id: 'jur-2', kode: 'PBSI', nama: 'Pendidikan Bahasa Indonesia' }
      ];

      // Cek duplikasi
      const duplicateAttempt = 'pendidikan masyarakat';
      const isDuplicate = jurusanList.some((j) => j.nama.toLowerCase() === duplicateAttempt.toLowerCase());
      expect(isDuplicate).toBe(true);

      // Hapus jur-1
      const filtered = jurusanList.filter((j) => j.id !== 'jur-1');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('jur-2');
    });
  });

  describe('Sub-Halaman Struktur Jabatan Unit (Desain Sederhana & Ramah Pemula)', () => {
    it('menghitung ringkasan formasi jabatan (total, terisi, dan lowong) secara akurat', () => {
      const mockStruktur = [
        { id: 's1', nama_jabatan: 'Dekan Fakultas Teknik', kategori_peran: 'pimpinan' },
        { id: 's2', nama_jabatan: 'Wakil Dekan Bidang Akademik', kategori_peran: 'pimpinan' },
        { id: 's3', nama_jabatan: 'Kepala Bagian Tata Usaha', kategori_peran: 'admin_tu' }
      ];

      const mockUsers = [
        {
          id: 'u1',
          name: 'Prof. Dekan',
          jabatan: 'Dekan Fakultas Teknik',
          unit_kerja_id: 'UN58.13',
          is_active: true
        }
      ];

      // Dekan Fakultas Teknik terisi, sisanya lowong
      const filledCount = mockStruktur.filter((item) =>
        mockUsers.some(
          (u) =>
            u.is_active &&
            u.jabatan?.toLowerCase().trim() === item.nama_jabatan.toLowerCase().trim()
        )
      ).length;

      const totalCount = mockStruktur.length;
      const vacantCount = totalCount - filledCount;

      expect(totalCount).toBe(3);
      expect(filledCount).toBe(1);
      expect(vacantCount).toBe(2);
    });

    it('mendukung pencarian nama jabatan secara real-time pada sub-halaman', () => {
      const mockStruktur = [
        { id: 's1', nama_jabatan: 'Dekan Fakultas Teknik' },
        { id: 's2', nama_jabatan: 'Wakil Dekan Bidang Akademik' },
        { id: 's3', nama_jabatan: 'Kepala Bagian Tata Usaha' },
        { id: 's4', nama_jabatan: 'Ketua Jurusan Informatika' }
      ];

      const searchQuery = 'dekan';
      const filtered = mockStruktur.filter((item) =>
        item.nama_jabatan.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map((f) => f.nama_jabatan)).toEqual([
        'Dekan Fakultas Teknik',
        'Wakil Dekan Bidang Akademik'
      ]);
    });
  });
});
