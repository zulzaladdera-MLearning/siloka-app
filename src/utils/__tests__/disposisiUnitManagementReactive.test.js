import { describe, it, expect } from 'vitest';
import { getHierarchicalDisposisiTargets } from '../disposisiStandards';
import defaultUnitKerjaList from '../../data/unitKerja.json';
import usersMaster from '../../data/users.json';

describe('Integrasi Reaktif Lembar Disposisi Rektor dengan CRUD Manajemen Unit Kerja', () => {
  const rektor = {
    id: 'usr-rektor-01',
    nama_lengkap: 'Prof. Dr. Ir. Nundang Busaeri, M.T., IPU., ASEAN Eng.',
    role: 'REKTOR',
    jabatan: 'Rektor Universitas Siliwangi',
    unit_kerja_id: 'UN58'
  };

  it('1. Baseline: Menampilkan target lengkap dari master unit kerja awal', () => {
    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster, defaultUnitKerjaList);
    
    // Harus mencakup target baku
    const targetIds = targets.map((t) => t.id);
    expect(targetIds).toContain('tgt-wr1');
    expect(targetIds).toContain('tgt-bku');
    expect(targetIds).toContain('tgt-lppm');
    expect(targetIds).toContain('tgt-ft');
    expect(targetIds).toContain('tgt-tik');
    expect(targetIds).toContain('tgt-keuangan');
    expect(targetIds).toContain('tgt-humas');
  });

  it('2. Skenario Non-Aktif: Unit yang dinonaktifkan (is_active: false) otomatis hilang dari disposisi', () => {
    // Non-aktifkan UPA Bahasa (UN58.33) dan FISIP (UN58.14)
    const mutatedUnits = defaultUnitKerjaList.map((unit) => {
      if (unit.kode_unit === 'UN58.33' || unit.kode_unit === 'UN58.14') {
        return { ...unit, is_active: false };
      }
      return unit;
    });

    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster, mutatedUnits);
    const targetIds = targets.map((t) => t.id);

    // UPA Bahasa dan FISIP harus lenyap dari daftar
    expect(targetIds).not.toContain('tgt-bahasa');
    expect(targetIds).not.toContain('tgt-fisip');

    // Unit aktif lainnya tetap ada
    expect(targetIds).toContain('tgt-ft');
    expect(targetIds).toContain('tgt-tik');
  });

  it('3. Skenario Edit: Perubahan nama atau singkatan unit langsung tercermin di lembar disposisi', () => {
    // Ubah nama Fakultas Pertanian menjadi Fakultas Pertanian dan Pangan Terpadu (FP2T)
    const mutatedUnits = defaultUnitKerjaList.map((unit) => {
      if (unit.kode_unit === 'UN58.12') {
        return {
          ...unit,
          nama_unit: 'Fakultas Pertanian dan Pangan Terpadu',
          singkatan: 'FP2T'
        };
      }
      return unit;
    });

    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster, mutatedUnits);
    const fpTarget = targets.find((t) => t.id === 'tgt-fp');

    expect(fpTarget).toBeDefined();
    expect(fpTarget.nama).toBe('Dekan FP2T');
    expect(fpTarget.badge).toBe('FP2T');
  });

  it('4. Skenario Tambah Unit Baru (Create): Unit baru otomatis masuk ke klaster yang sesuai', () => {
    // Tambah Fakultas Kedokteran (FKED) dan UPA Konseling
    const newUnits = [
      ...defaultUnitKerjaList,
      {
        id: 991,
        kode_unit: 'UN58.19',
        nama_unit: 'Fakultas Kedokteran',
        singkatan: 'FK',
        tipe_unit: 'FAKULTAS',
        kategori: 'FAKULTAS',
        is_active: true
      },
      {
        id: 992,
        kode_unit: 'UN58.39',
        nama_unit: 'Unit Penunjang Akademik Layanan Konseling Mahasiswa',
        singkatan: 'UPA Konseling',
        tipe_unit: 'UPA',
        kategori: 'UPA',
        is_active: true
      }
    ];

    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster, newUnits);

    const fkedTarget = targets.find((t) => t.unit_id === 'UN58.19');
    expect(fkedTarget).toBeDefined();
    expect(fkedTarget.cluster).toBe('4. Pimpinan Fakultas & Pascasarjana');
    expect(fkedTarget.nama).toBe('Dekan FK');
    expect(fkedTarget.badge).toBe('FK');

    const upaKonselingTarget = targets.find((t) => t.unit_id === 'UN58.39');
    expect(upaKonselingTarget).toBeDefined();
    expect(upaKonselingTarget.cluster).toBe('5. Pimpinan Unit Penunjang Akademik (UPA)');
    expect(upaKonselingTarget.nama).toContain('Konseling');
  });

  it('5. Skenario Keterhubungan Akun: [Belum Terhubung] vs [Akun Terhubung] untuk unit baru', () => {
    const newFacultyUnit = {
      id: 995,
      kode_unit: 'UN58.99',
      nama_unit: 'Fakultas Sains Data dan Kecerdasan Artifisial',
      singkatan: 'FSDKA',
      tipe_unit: 'FAKULTAS',
      kategori: 'FAKULTAS',
      is_active: true
    };

    const unitsWithFsdka = [...defaultUnitKerjaList, newFacultyUnit];

    // Fase A: Sebelum ada akun user terdaftar
    const targetsBeforeUser = getHierarchicalDisposisiTargets(rektor, usersMaster, unitsWithFsdka);
    const targetFsdkaBefore = targetsBeforeUser.find((t) => t.unit_id === 'UN58.99');
    expect(targetFsdkaBefore).toBeDefined();
    expect(targetFsdkaBefore.is_active_account).toBe(false);
    expect(targetFsdkaBefore.account_status_label).toBe('[Belum Terhubung]');

    // Fase B: Setelah Super Admin mendaftarkan Dekan FSDKA di Manajemen Pengguna
    const usersWithDekanFsdka = [
      ...usersMaster,
      {
        id: 'usr-dekan-fsdka',
        nama_lengkap: 'Dr. Hendra Gunawan, M.Cs.',
        nip: '198506122010121005',
        email: 'dekan.fsdka@unsil.ac.id',
        role: 'PEJABAT',
        jabatan: 'Dekan Fakultas Sains Data dan Kecerdasan Artifisial',
        unit_kerja_id: 'UN58.99',
        is_pejabat: true
      }
    ];

    const targetsAfterUser = getHierarchicalDisposisiTargets(rektor, usersWithDekanFsdka, unitsWithFsdka);
    const targetFsdkaAfter = targetsAfterUser.find((t) => t.unit_id === 'UN58.99');
    expect(targetFsdkaAfter).toBeDefined();
    expect(targetFsdkaAfter.is_active_account).toBe(true);
    expect(targetFsdkaAfter.account_status_label).toBe('[Akun Terhubung]');
    expect(targetFsdkaAfter.user_nama).toBe('Dr. Hendra Gunawan, M.Cs.');
    expect(targetFsdkaAfter.user_nip).toBe('198506122010121005');
  });

  it('6. Skenario Deaktivasi Biro: Deaktivasi BKU otomatis menyembunyikan subordinat Tim Kerja BKU di Klaster 6', () => {
    const unitsWithoutBku = defaultUnitKerjaList.map((unit) => {
      if (unit.kode_unit === 'UN58.6') {
        return { ...unit, is_active: false };
      }
      return unit;
    });

    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster, unitsWithoutBku);
    const targetIds = targets.map((t) => t.id);

    // Pimpinan Biro BKU lenyap
    expect(targetIds).not.toContain('tgt-bku');

    // Tim Kerja subordinat BKU di Klaster 6 otomatis lenyap
    expect(targetIds).not.toContain('tgt-keuangan');
    expect(targetIds).not.toContain('tgt-kepegawaian');
    expect(targetIds).not.toContain('tgt-bmn');
    expect(targetIds).not.toContain('tgt-hukum');
    expect(targetIds).not.toContain('tgt-humas');
    expect(targetIds).not.toContain('tgt-kbg-umum');

    // Tim Kerja BAKPK tetap ada karena BAKPK masih aktif
    expect(targetIds).toContain('tgt-perencanaan');
    expect(targetIds).toContain('tgt-akademik');
    expect(targetIds).toContain('tgt-kemahasiswaan');
  });

  it('7. Skenario Organ Khusus: Akun resmi Ketua Senat dan Ketua Dewan Penyantun berstatus [Akun Terhubung], sedangkan formasi tanpa akun berstatus [Belum Terhubung]', () => {
    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster, defaultUnitKerjaList);

    // Ketua Senat (Prof. Deden Mulyana terdaftar di basis data)
    const senatTarget = targets.find((t) => t.id === 'tgt-senat');
    expect(senatTarget).toBeDefined();
    expect(senatTarget.is_active_account).toBe(true);
    expect(senatTarget.account_status_label).toBe('[Akun Terhubung]');
    expect(senatTarget.user_nama).toContain('Deden Mulyana');

    // Ketua SPI (belum dibuat akun di Manajemen Pengguna -> jujur berstatus [Belum Terhubung])
    const spiTarget = targets.find((t) => t.id === 'tgt-spi');
    expect(spiTarget).toBeDefined();
    expect(spiTarget.is_active_account).toBe(false);
    expect(spiTarget.account_status_label).toBe('[Belum Terhubung]');
    expect(spiTarget.user_nama).toBeNull();

    // Reaktivitas: Saat Super Admin membuat akun Ketua SPI di Manajemen Pengguna, otomatis terhubung
    const usersWithSpi = [
      ...usersMaster,
      {
        id: 'usr-spi-01',
        nama_lengkap: 'Hendra Pratama, S.E., Ak., C.A.',
        email: 'hendra.spi@unsil.ac.id',
        nip: '197505122000031001',
        unit_kerja_id: 'UN58.SPI',
        role: 'PEJABAT',
        is_pejabat: true,
        jabatan: 'Ketua Satuan Pengawas Internal (SPI)',
        roleLabel: 'Ketua Satuan Pengawas Internal (SPI)'
      }
    ];
    const targetsWithSpi = getHierarchicalDisposisiTargets(rektor, usersWithSpi, defaultUnitKerjaList);
    const spiTargetActive = targetsWithSpi.find((t) => t.id === 'tgt-spi');
    expect(spiTargetActive.is_active_account).toBe(true);
    expect(spiTargetActive.account_status_label).toBe('[Akun Terhubung]');
    expect(spiTargetActive.user_nama).toContain('Hendra Pratama');

    // Ketua Dewan Penyantun (Drs. H. Syarif Hidayat terdaftar di basis data)
    const dpTarget = targets.find((t) => t.id === 'tgt-dp');
    expect(dpTarget).toBeDefined();
    expect(dpTarget.is_active_account).toBe(true);
    expect(dpTarget.account_status_label).toBe('[Akun Terhubung]');
    expect(dpTarget.user_nama).toContain('Syarif Hidayat');
  });

  it('8. Skenario Sanitasi Akun Dummy: Memastikan tidak ada akun fiktif/dummy yang lolos ke sistem', () => {
    const dummyNames = ['Administrator Utama SILOKA', 'userdihapus', 'usr-test-delete-99', 'dummy'];
    const hasDummyInMaster = usersMaster.some((u) => {
      const name = String(u.nama_lengkap || u.name || '').toLowerCase();
      const id = String(u.id || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      return (
        dummyNames.some((d) => name.includes(d.toLowerCase()) || id.includes(d.toLowerCase()) || email.includes(d.toLowerCase())) ||
        id === 'usr-admin-01' ||
        id === 'usr-00'
      );
    });

    expect(hasDummyInMaster).toBe(false);
  });
});
