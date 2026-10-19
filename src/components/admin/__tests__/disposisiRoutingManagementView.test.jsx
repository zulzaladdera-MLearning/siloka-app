import { describe, it, expect, beforeEach } from 'vitest';
import { DisposisiRoutingManagementView } from '../DisposisiRoutingManagementView';
import {
  DISPOSISI_SENDER_CATALOG,
  getUnitOfficialPositions,
  resolveOfficialSenderKey,
  resolveOfficialOccupant,
  getTargetsForSender,
  toggleTargetStatus,
  addTargetToSender,
  updateTargetInSender,
  removeTargetFromSender,
  resetSenderTargets
} from '../../../services/disposisiRoutingService';
import { getHierarchicalDisposisiTargets } from '../../../utils/disposisiStandards';
import { isOfficialUserAccount } from '../../../utils/pejabatHelper';

describe('DisposisiRoutingManagementView Integrasi Alur Disposisi Berbasis Unit Kerja', () => {
  let localStore = {};

  const sampleUnits = [
    {
      id: 1,
      kode_unit: 'UN58',
      nama_unit: 'Universitas Siliwangi (Rektorat)',
      singkatan: 'UNSIL',
      tipe_unit: 'UNIVERSITAS',
      is_active: true
    },
    {
      id: 2,
      kode_unit: 'UN58.SENAT',
      nama_unit: 'Senat Universitas Siliwangi',
      singkatan: 'SENAT',
      tipe_unit: 'ORGAN',
      is_active: true
    },
    {
      id: 5,
      kode_unit: 'UN58.5',
      nama_unit: 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama',
      singkatan: 'BAKPK',
      tipe_unit: 'BIRO',
      is_active: true
    },
    {
      id: 6,
      kode_unit: 'UN58.6',
      nama_unit: 'Biro Keuangan dan Umum',
      singkatan: 'BKU',
      tipe_unit: 'BIRO',
      is_active: true
    },
    {
      id: 10,
      kode_unit: 'UN58.10',
      nama_unit: 'Fakultas Keguruan dan Ilmu Pendidikan',
      singkatan: 'FKIP',
      tipe_unit: 'FAKULTAS',
      jurusan: [{ kode: 'PBI', nama: 'Pendidikan Bahasa Indonesia' }],
      is_active: true
    },
    {
      id: 31,
      kode_unit: 'UN58.31',
      nama_unit: 'Unit Penunjang Akademik Perpustakaan',
      singkatan: 'UPA Perpustakaan',
      tipe_unit: 'UPA',
      is_active: true
    }
  ];

  const sampleUsers = [
    {
      id: 'usr-rektor',
      nip: '196708161996031001',
      nama_lengkap: 'Prof. Dr. Ir. Nundang Busaeri, M.T.',
      jabatan: 'Rektor Universitas Siliwangi',
      role: 'REKTOR',
      unit_kerja_id: 'UN58',
      is_active: true
    },
    {
      id: 'usr-warek1',
      nip: '197005141997021001',
      nama_lengkap: 'Prof. Dr. Dedi Nurjamil, M.Pd.',
      jabatan: 'Wakil Rektor Bidang Akademik',
      role: 'WAREK',
      subRoleKey: 'WAREK_1',
      unit_kerja_id: 'UN58',
      is_active: true
    },
    {
      id: 'usr-dekan-fkip',
      nip: '197503122000031002',
      nama_lengkap: 'Dr. H. Cucu Hidayat, M.Pd.',
      jabatan: 'Dekan FKIP',
      role: 'DEKAN',
      unit_kerja_id: 'UN58.10',
      is_active: true
    },
    {
      id: 'usr-kepala-perpus',
      nip: '198001012005011003',
      nama_lengkap: 'Hj. Lisnawati, S.Sos., M.Si.',
      jabatan: 'Kepala UPA Perpustakaan',
      role: 'PEJABAT',
      unit_kerja_id: 'UN58.31',
      is_active: true
    }
  ];

  beforeEach(() => {
    localStore = {};
    globalThis.localStorage = {
      getItem: (key) => localStore[key] || null,
      setItem: (key, val) => {
        localStore[key] = String(val);
      },
      removeItem: (key) => {
        delete localStore[key];
      },
      clear: () => {
        localStore = {};
      }
    };
    globalThis.window = {
      dispatchEvent: () => true
    };
  });

  it('harus mengekspor komponen DisposisiRoutingManagementView sebagai fungsi komponen React', () => {
    expect(typeof DisposisiRoutingManagementView).toBe('function');
  });

  it('harus memiliki katalog pimpinan bawaan lengkap', () => {
    expect(DISPOSISI_SENDER_CATALOG.length).toBeGreaterThanOrEqual(9);
    const badges = DISPOSISI_SENDER_CATALOG.map((s) => s.badge);
    expect(badges).toContain('Rektor');
    expect(badges).toContain('WR I');
    expect(badges).toContain('WR II');
    expect(badges).toContain('WR III');
    expect(badges).toContain('Dekan');
    expect(badges).toContain('BKU');
    expect(badges).toContain('BAKPK');
  });

  it('harus menampilkan formasi pejabat dan menghubungkan akun aktif pemangku jabatan di Rektorat', () => {
    const rektoratUnit = sampleUnits.find((u) => u.kode_unit === 'UN58');
    const positions = getUnitOfficialPositions(rektoratUnit, sampleUsers);

    expect(positions.length).toBe(4);
    const rektorPos = positions.find((p) => p.senderKey === 'REKTOR');
    expect(rektorPos).toBeDefined();
    expect(rektorPos.occupant).toBeDefined();
    expect(rektorPos.occupant.nama_lengkap).toBe('Prof. Dr. Ir. Nundang Busaeri, M.T.');
    expect(rektorPos.activeTargetsCount).toBeGreaterThan(0);

    const wr1Pos = positions.find((p) => p.senderKey === 'WAREK_1');
    expect(wr1Pos).toBeDefined();
    expect(wr1Pos.occupant).toBeDefined();
    expect(wr1Pos.occupant.nama_lengkap).toBe('Prof. Dr. Dedi Nurjamil, M.Pd.');
  });

  it('harus memetakan formasi jabatan di Fakultas beserta pimpinan dan jurusannya', () => {
    const fkipUnit = sampleUnits.find((u) => u.kode_unit === 'UN58.10');
    const positions = getUnitOfficialPositions(fkipUnit, sampleUsers);

    expect(positions.length).toBeGreaterThanOrEqual(5);
    const dekanPos = positions.find((p) => p.senderKey === 'UN58.10__pimpinan');
    expect(dekanPos).toBeDefined();
    expect(dekanPos.occupant).toBeDefined();
    expect(dekanPos.occupant.nama_lengkap).toBe('Dr. H. Cucu Hidayat, M.Pd.');

    // Memuat jurusan Pendidikan Bahasa Indonesia
    const jurusanPos = positions.find((p) => p.nama_jabatan.includes('Pendidikan Bahasa Indonesia'));
    expect(jurusanPos).toBeDefined();
    expect(jurusanPos.senderKey).toContain('kajur');
  });

  it('harus memetakan formasi jabatan di UPA Perpustakaan', () => {
    const upaUnit = sampleUnits.find((u) => u.kode_unit === 'UN58.31');
    const positions = getUnitOfficialPositions(upaUnit, sampleUsers);

    expect(positions.length).toBe(2);
    const kepalaPos = positions.find((p) => p.senderKey === 'UN58.31__kepala');
    expect(kepalaPos).toBeDefined();
    expect(kepalaPos.occupant).toBeDefined();
    expect(kepalaPos.occupant.nama_lengkap).toBe('Hj. Lisnawati, S.Sos., M.Si.');
  });

  it('CRUD Target: harus dapat menambah, menonaktifkan, dan menghapus target kustom', () => {
    const senderKey = 'UN58.10__pimpinan';
    const initialTargets = getTargetsForSender(senderKey, 'DEKAN');
    const initialCount = initialTargets.length;

    // 1. Tambah target kustom
    const newTarget = {
      nama: 'Koordinator Laboratorium Microteaching FKIP',
      badge: 'Microteaching',
      cluster: 'Pelaksana Teknis & Akademik',
      unit_id: 'UN58.10'
    };
    const afterAdd = addTargetToSender(senderKey, newTarget, 'DEKAN');
    expect(afterAdd.length).toBe(initialCount + 1);
    const addedItem = afterAdd.find((t) => t.nama === newTarget.nama);
    expect(addedItem).toBeDefined();
    expect(addedItem.enabled).toBe(true);
    expect(addedItem.isCustom).toBe(true);

    // 2. Toggle nonaktifkan target
    const afterToggle = toggleTargetStatus(senderKey, addedItem.id, 'DEKAN');
    expect(afterToggle.find((t) => t.id === addedItem.id).enabled).toBe(false);

    // 3. Hapus target kustom
    const afterDelete = removeTargetFromSender(senderKey, addedItem.id, 'DEKAN');
    expect(afterDelete.length).toBe(initialCount);
    expect(afterDelete.some((t) => t.id === addedItem.id)).toBe(false);
  });

  it('Reset Target: harus dapat mengembalikan tujuan disposisi pejabat ke standar SOTK', () => {
    const senderKey = 'WAREK_1';
    toggleTargetStatus(senderKey, 'tgt-perpus', 'WAREK_1');
    expect(getTargetsForSender(senderKey).find((t) => t.id === 'tgt-perpus').enabled).toBe(false);

    const resetResult = resetSenderTargets(senderKey, 'WAREK_1');
    expect(resetResult.find((t) => t.id === 'tgt-perpus').enabled).toBe(true);
  });

  it('INTEGRASI REAL-TIME: sinkronisasi ke modal disposisi pimpinan berlangsung otomatis', () => {
    const userDekan = sampleUsers.find((u) => u.id === 'usr-dekan-fkip');

    // Tambah target kustom ke Dekan FKIP
    const customTarget = {
      nama: 'Koordinator Unit Penjaminan Mutu FKIP',
      badge: 'UPM',
      cluster: 'Penjaminan Mutu',
      unit_id: 'UN58.10'
    };
    const dekanKey = resolveOfficialSenderKey('UN58.10', userDekan.jabatan);
    addTargetToSender(dekanKey, customTarget, 'DEKAN');

    // Cek pada getHierarchicalDisposisiTargets
    const targets = getHierarchicalDisposisiTargets(userDekan, sampleUsers, sampleUnits);
    expect(targets.some((t) => t.nama === customTarget.nama)).toBe(true);
  });

  it('CRUD TARGET TERKONEKSI: harus mendukung Create, Read, Update, Delete yang terhubung Manajemen User & Peran', () => {
    const senderKey = 'REKTOR';

    // 1. CREATE: Tambah target yang terhubung ke userId dan roleKey
    const initialTargets = getTargetsForSender(senderKey);
    const newTargetPayload = {
      nama: 'Kepala Pusat Inovasi dan Bisnis',
      badge: 'Inovasi',
      cluster: 'Penugasan Khusus (Tim Kerja)',
      unit_id: 'UN58.31',
      roleKey: 'pejabat',
      userId: 'usr-kepala-perpus',
      deskripsi: 'Pengembangan inovasi universitas'
    };

    const afterAdd = addTargetToSender(senderKey, newTargetPayload);
    const createdTarget = afterAdd.find((t) => t.nama === newTargetPayload.nama);
    expect(createdTarget).toBeDefined();
    expect(createdTarget.userId).toBe('usr-kepala-perpus');
    expect(createdTarget.roleKey).toBe('pejabat');
    expect(createdTarget.isCustom).toBe(true);

    // 2. READ: Verifikasi resolveOfficialOccupant mendeteksi user aktif dari rujukan langsung targetUserId
    const resolvedOccupant = resolveOfficialOccupant(createdTarget.nama, sampleUsers, createdTarget.unit_id, createdTarget.userId);
    expect(resolvedOccupant).toBeDefined();
    expect(resolvedOccupant.id).toBe('usr-kepala-perpus');
    expect(resolvedOccupant.nama_lengkap).toBe('Hj. Lisnawati, S.Sos., M.Si.');

    // 3. UPDATE: Edit target yang sudah ada
    const updatedPayload = {
      nama: 'Kepala Pusat Inkubator Bisnis dan Hilirisasi',
      badge: 'Inkubator',
      cluster: 'Pimpinan Lembaga',
      deskripsi: 'Hilirisasi riset kampus'
    };
    const afterUpdate = updateTargetInSender(senderKey, createdTarget.id, updatedPayload);
    const updatedTarget = afterUpdate.find((t) => t.id === createdTarget.id);
    expect(updatedTarget).toBeDefined();
    expect(updatedTarget.nama).toBe('Kepala Pusat Inkubator Bisnis dan Hilirisasi');
    expect(updatedTarget.badge).toBe('Inkubator');
    expect(updatedTarget.cluster).toBe('Pimpinan Lembaga');
    // Mempertahankan userId dan roleKey yang sudah terhubung
    expect(updatedTarget.userId).toBe('usr-kepala-perpus');
    expect(updatedTarget.roleKey).toBe('pejabat');

    // 4. DELETE: Super Admin dapat menghapus target kustom maupun target standar
    const afterDelete = removeTargetFromSender(senderKey, createdTarget.id);
    expect(afterDelete.some((t) => t.id === createdTarget.id)).toBe(false);

    // 5. UPDATE TARGET STANDAR: Super Admin juga dapat mengedit target bawaan sistem
    const stdTarget = initialTargets[0];
    const stdUpdated = updateTargetInSender(senderKey, stdTarget.id, {
      deskripsi: 'Wewenang delegasi khusus yang disesuaikan oleh Super Admin'
    });
    const editedStd = stdUpdated.find((t) => t.id === stdTarget.id);
    expect(editedStd.deskripsi).toBe('Wewenang delegasi khusus yang disesuaikan oleh Super Admin');
    expect(editedStd.isCustom).toBe(true);

    // 6. RESET: Kembalikan alur disposisi ke standar awal SOTK
    const afterReset = resetSenderTargets(senderKey);
    const restoredStd = afterReset.find((t) => t.id === stdTarget.id);
    expect(restoredStd.deskripsi).toBe(stdTarget.deskripsi);
  });

  it('VALIDASI STRICT REGULASI DISPOSISI: hanya akun peran Pimpinan, Penandatangan, atau Pejabat yang boleh jadi target', () => {
    // 1. Akun Super Admin mutlak dilarang menjadi target disposisi kedinasan
    const superAdminUser = {
      id: 'usr-dg-01',
      nip: '198501012010121001',
      nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
      role: 'Super Admin',
      is_super_admin: true,
      jabatan: 'Super Administrator'
    };
    expect(isOfficialUserAccount(superAdminUser)).toBe(false);

    // 2. Akun staf administrasi / tata usaha / operator dilarang menjadi target disposisi
    const stafTuUser = {
      id: 'usr-ac-01',
      nip: '200008172027031001',
      nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
      role: 'STAF',
      is_pejabat: false,
      jabatan: 'Pengadministrasi Persuratan / Tata Usaha'
    };
    expect(isOfficialUserAccount(stafTuUser)).toBe(false);

    const operatorUser = {
      id: 'usr-02',
      nip: '199003152015041002',
      nama_lengkap: 'Rahmat Hidayat, S.AP.',
      role: 'OPERATOR_UNIT',
      is_pejabat: false,
      jabatan: 'Staf Tata Usaha & Protokoler Rektorat'
    };
    expect(isOfficialUserAccount(operatorUser)).toBe(false);

    // 3. Akun dosen biasa tanpa jabatan struktural dilarang menjadi target disposisi
    const dosenBiasaUser = {
      id: 'usr-dosen-01',
      nip: '200303012027031001',
      nama_lengkap: 'Zulza Laddera Aripin, S.Kom., M.Kom.',
      role: 'DOSEN',
      is_pejabat: false,
      roleLevel: 'Level 3: Dosen Biasa (Tanpa Jabatan Struktural)',
      jabatan: 'Dosen Jurusan Sains Data'
    };
    expect(isOfficialUserAccount(dosenBiasaUser)).toBe(false);

    // 4. Akun dengan peran Pimpinan, Penandatangan, atau Pejabat Struktural WAJIB lolos
    const rektorUser = {
      id: 'usr-01',
      nip: '196708161996031001',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      role: 'PEJABAT',
      is_pejabat: true,
      roleLevel: 'Level 1: Pimpinan',
      jabatan: 'Rektor Universitas Siliwangi'
    };
    expect(isOfficialUserAccount(rektorUser)).toBe(true);

    const pimpinanUser = {
      id: 'usr-dekan-01',
      nip: '197501012000031001',
      nama_lengkap: 'Dr. Dekan Fakultas, M.Pd.',
      role_slug: 'pimpinan',
      is_pejabat: true,
      jabatan: 'Dekan Fakultas Keguruan'
    };
    expect(isOfficialUserAccount(pimpinanUser)).toBe(true);

    const penandatanganUser = {
      id: 'usr-penandatangan-01',
      nip: '197601012000031002',
      nama_lengkap: 'Dr. Penandatangan Sah, M.T.',
      role_slug: 'penandatangan',
      jabatan: 'Wakil Rektor Bidang Akademik'
    };
    expect(isOfficialUserAccount(penandatanganUser)).toBe(true);
  });

  it('PENCEGAHAN DUPLIKASI TARGET: pejabat yang sudah terdaftar atau bertindak sebagai pengirim tidak boleh dipilih untuk kedua kali', () => {
    const senderKey = 'REKTOR';
    const targets = getTargetsForSender(senderKey);

    // Mock fungsi deteksi assigned officials seperti di DisposisiRoutingManagementView
    const computeAssignedMap = (currentTargets, senderOccupant, editingTargetId = null) => {
      const map = new Map();
      if (senderOccupant) {
        if (senderOccupant.id) map.set(String(senderOccupant.id).toLowerCase(), 'Pejabat Pengirim');
        if (senderOccupant.nip) map.set(String(senderOccupant.nip).toLowerCase(), 'Pejabat Pengirim');
      }

      currentTargets.forEach((t) => {
        if (editingTargetId && t.id === editingTargetId) return;
        if (t.userId) {
          map.set(String(t.userId).toLowerCase(), 'Sudah Terdaftar');
        }
        const occ = resolveOfficialOccupant(t.nama, sampleUsers, t.unit_id, t.userId);
        if (occ) {
          if (occ.id) map.set(String(occ.id).toLowerCase(), 'Sudah Terdaftar');
          if (occ.nip) map.set(String(occ.nip).toLowerCase(), 'Sudah Terdaftar');
        }
      });
      return map;
    };

    const rektorUser = sampleUsers.find((u) => u.id === 'usr-rektor');
    const assignedMap = computeAssignedMap(targets, rektorUser);

    // 1. Rektor sendiri harus terdeteksi sebagai 'Pejabat Pengirim' (tidak boleh disposisi ke diri sendiri)
    expect(assignedMap.get('usr-rektor')).toBe('Pejabat Pengirim');

    // 2. Wakil Rektor 1 yang sudah ada di alur REKTOR harus terdeteksi sebagai 'Sudah Terdaftar'
    expect(assignedMap.get('usr-warek1')).toBe('Sudah Terdaftar');

    // 3. Pejabat yang belum ada di target REKTOR (misal Wakil Dekan FKIP atau Pejabat Baru) harus bebas dipilih
    const wadekUser = {
      id: 'usr-wadek1-fkip',
      nip: '198204122008011002',
      nama_lengkap: 'Dr. Wadek Satu, M.Pd.',
      jabatan: 'Wakil Dekan Bidang Akademik FKIP',
      role: 'PEJABAT',
      unit_kerja_id: 'UN58.10',
      is_active: true
    };
    expect(assignedMap.has(wadekUser.id)).toBe(false);

    // 4. Dalam mode edit untuk target Wakil Rektor 1, akun WR 1 harus diizinkan untuk target miliknya sendiri
    const wr1Target = targets.find((t) => t.nama.toLowerCase().includes('wakil rektor bidang akademik'));
    expect(wr1Target).toBeDefined();
    const editModeMap = computeAssignedMap(targets, rektorUser, wr1Target.id);
    expect(editModeMap.has('usr-warek1')).toBe(false);
  });

  it('TATA NASKAH DINAS & REAL-TIME SINKRONISASI: formasi jabatan struktural resmi tetap tampil di alur disposisi meski lowong (occupant null), dan terisi otomatis saat akun aktif', () => {
    // Buat unit dengan struktur organisasi resmi dari Manajemen Unit Kerja
    const sampleUnitWithStruktur = {
      kode_unit: 'UN58.12',
      nama_unit: 'Fakultas Pertanian',
      singkatan: 'FP',
      tipe_unit: 'FAKULTAS',
      struktur_organisasi: [
        { id: 'st-dekan', nama_jabatan: 'Dekan Fakultas Pertanian', kategori_peran: 'pimpinan' },
        { id: 'st-wadek1', nama_jabatan: 'Wakil Dekan Bidang Akademik FP', kategori_peran: 'pimpinan' }
      ]
    };

    // Kasus 1: Belum ada user yang menduduki Wakil Dekan Bidang Akademik FP
    const usersKasus1 = [
      {
        id: 'usr-dekan-fp',
        nip: '197101011995011001',
        nama_lengkap: 'Dr. Dekan Pertanian, M.P.',
        jabatan: 'Dekan Fakultas Pertanian',
        role: 'DEKAN',
        unit_kerja_id: 'UN58.12',
        is_active: true
      }
    ];

    // Mengambil formasi pejabat standar (onlyOccupied = false)
    const positionsKasus1 = getUnitOfficialPositions(sampleUnitWithStruktur, usersKasus1, false);

    // Dekan terisi -> ada dan memiliki occupant
    const dekanPos = positionsKasus1.find((p) => p.nama_jabatan === 'Dekan Fakultas Pertanian');
    expect(dekanPos).toBeDefined();
    expect(dekanPos.occupant).toBeDefined();
    expect(dekanPos.occupant.nama_lengkap).toBe('Dr. Dekan Pertanian, M.P.');

    // Wakil Dekan belum ada pejabat -> TETAP MUNCUL di formasi SOTK, namun occupant null (lowong)
    const wadekPos1 = positionsKasus1.find((p) => p.nama_jabatan === 'Wakil Dekan Bidang Akademik FP');
    expect(wadekPos1).toBeDefined();
    expect(wadekPos1.occupant).toBeNull();

    // Kasus 2: Super Admin menugaskan akun ke Wakil Dekan di Manajemen Pengguna
    const usersKasus2 = [
      ...usersKasus1,
      {
        id: 'usr-wadek-fp',
        nip: '198801012015011002',
        nama_lengkap: 'Budi Santoso, S.P., M.Si.',
        jabatan: 'Wakil Dekan Bidang Akademik FP',
        role: 'PEJABAT',
        unit_kerja_id: 'UN58.12',
        is_active: true
      }
    ];

    // Sekarang setelah ada pejabat aktif yang menduduki, Wakil Dekan otomatis terisi secara real-time
    const positionsKasus2 = getUnitOfficialPositions(sampleUnitWithStruktur, usersKasus2, false);
    const wadekPos2 = positionsKasus2.find((p) => p.nama_jabatan === 'Wakil Dekan Bidang Akademik FP');
    expect(wadekPos2).toBeDefined();
    expect(wadekPos2.occupant).toBeDefined();
    expect(wadekPos2.occupant.nama_lengkap).toBe('Budi Santoso, S.P., M.Si.');

    // Kasus 3: Jika dipanggil dengan onlyOccupied = true, formasi lowong tersaring keluar
    const occupiedOnly = getUnitOfficialPositions(sampleUnitWithStruktur, usersKasus1, true);
    expect(occupiedOnly.some((p) => p.nama_jabatan === 'Wakil Dekan Bidang Akademik FP')).toBe(false);
  });

  it('ZERO MISTAKES REGULASI PEJABAT: jabatan staf (verifikator, arsiparis, drafter, TU) mutlak tidak masuk ke alur disposisi', () => {
    // SOTK Rektorat dari Manajemen Unit Kerja yang memuat jabatan pimpinan dan staf operasional
    const unitRektoratLengkap = {
      kode_unit: 'UN58',
      nama_unit: 'Universitas Siliwangi (Rektorat)',
      singkatan: 'Rektorat',
      tipe_unit: 'ORGAN',
      struktur_organisasi: [
        { id: 'pos-1', nama_jabatan: 'Rektor Universitas Siliwangi', kategori_peran: 'pimpinan', level_hirarki: 1 },
        { id: 'pos-2', nama_jabatan: 'Wakil Rektor Bidang Akademik', kategori_peran: 'pimpinan', level_hirarki: 1 },
        { id: 'pos-3', nama_jabatan: 'Wakil Rektor Bidang Keuangan dan Umum', kategori_peran: 'pimpinan', level_hirarki: 1 },
        { id: 'pos-4', nama_jabatan: 'Verifikator Naskah Dinas Rektorat', kategori_peran: 'verifikator', level_hirarki: 2 },
        { id: 'pos-5', nama_jabatan: 'Pengadministrasi Persuratan / Tata Usaha Pimpinan', kategori_peran: 'admin_tu', level_hirarki: 3 },
        { id: 'pos-6', nama_jabatan: 'Arsiparis Ahli / Terampil Rektorat', kategori_peran: 'drafter', level_hirarki: 4 },
        { id: 'pos-7', nama_jabatan: 'Drafter / Konseptor Naskah Rektorat', kategori_peran: 'drafter', level_hirarki: 4 }
      ]
    };

    const usersRektorat = [
      {
        id: 'usr-rektor-aripin',
        nip: '196708161996031001',
        nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
        jabatan: 'Rektor Universitas Siliwangi',
        role: 'REKTOR',
        unit_kerja_id: 'UN58',
        is_active: true
      },
      {
        id: 'usr-warek-dedi',
        nip: '196811132021211003',
        nama_lengkap: 'Prof. Dr. H. Dedi Kusmayadi, S.E., M.Si., Ak.',
        jabatan: 'Wakil Rektor Bidang Akademik',
        role: 'WAREK',
        unit_kerja_id: 'UN58',
        is_active: true
      },
      {
        id: 'usr-warek-ade',
        nip: '196801021992031002',
        nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
        jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
        role: 'WAREK',
        unit_kerja_id: 'UN58',
        is_active: true
      },
      {
        id: 'usr-tu-fulan',
        nip: '200304892902',
        nama_lengkap: 'Fulan Bin Nur, S.Kom.',
        jabatan: 'Pengadministrasi Persuratan / Tata Usaha Pimpinan',
        role: 'ADMIN_TU',
        is_pejabat: false,
        unit_kerja_id: 'UN58',
        is_active: true
      }
    ];

    // Ambil formasi pejabat resmi (onlyOccupied = false, standar alur disposisi)
    const officialPositions = getUnitOfficialPositions(unitRektoratLengkap, usersRektorat, false);

    // 1. Empat formasi pimpinan resmi Tata Naskah Dinas WAJIB hadir
    expect(officialPositions.some((p) => p.nama_jabatan === 'Rektor Universitas Siliwangi')).toBe(true);
    expect(officialPositions.some((p) => p.nama_jabatan === 'Wakil Rektor Bidang Akademik')).toBe(true);
    expect(officialPositions.some((p) => p.nama_jabatan === 'Wakil Rektor Bidang Keuangan dan Umum')).toBe(true);
    // Wakil Rektor Kemahasiswaan tetap hadir dalam formasi resmi meski saat ini belum ada user yang menjabat (lowong)
    const wr3Pos = officialPositions.find((p) => p.nama_jabatan === 'Wakil Rektor Bidang Kemahasiswaan dan Alumni');
    expect(wr3Pos).toBeDefined();
    expect(wr3Pos.occupant).toBeNull();

    // 2. Verifikator, Arsiparis, Drafter, Pengadministrasi TU MUTLAK DILARANG ada di alur disposisi
    expect(officialPositions.some((p) => p.nama_jabatan.toLowerCase().includes('verifikator'))).toBe(false);
    expect(officialPositions.some((p) => p.nama_jabatan.toLowerCase().includes('pengadministrasi'))).toBe(false);
    expect(officialPositions.some((p) => p.nama_jabatan.toLowerCase().includes('arsiparis'))).toBe(false);
    expect(officialPositions.some((p) => p.nama_jabatan.toLowerCase().includes('drafter'))).toBe(false);

    // 3. Rektor TIDAK BOLEH salah cocok menjadi pemangku Verifikator/Arsiparis/Drafter
    const verifikatorOccupant = resolveOfficialOccupant('Verifikator Naskah Dinas Rektorat', usersRektorat, 'UN58');
    expect(verifikatorOccupant).toBeNull();

    const arsiparisOccupant = resolveOfficialOccupant('Arsiparis Ahli / Terampil Rektorat', usersRektorat, 'UN58');
    expect(arsiparisOccupant).toBeNull();

    const drafterOccupant = resolveOfficialOccupant('Drafter / Konseptor Naskah Rektorat', usersRektorat, 'UN58');
    expect(drafterOccupant).toBeNull();

    // 4. Staf TU (Fulan Bin Nur) TIDAK BOLEH menjadi pemangku pejabat disposisi
    const tuOccupant = resolveOfficialOccupant('Pengadministrasi Persuratan / Tata Usaha Pimpinan', usersRektorat, 'UN58');
    expect(tuOccupant).toBeNull();
  });
});
