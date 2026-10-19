import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY_DISPOSISI_ROUTING,
  DISPOSISI_ROUTING_CHANGE_EVENT,
  DISPOSISI_SENDER_CATALOG,
  getRoutingMatrix,
  saveRoutingMatrix,
  resetRoutingMatrix,
  getTargetsForSender,
  toggleTargetStatus,
  addTargetToSender,
  removeTargetFromSender,
  resetSenderTargets,
  resolveSenderKey,
  resolveOfficialSenderKey,
  getUnitOfficialPositions
} from '../disposisiRoutingService';
import { getHierarchicalDisposisiTargets } from '../../utils/disposisiStandards';

describe('disposisiRoutingService - Manajemen Alur Disposisi Berbasis Unit Kerja SILOKA UNSIL', () => {
  let localStore = {};

  const sampleUsers = [
    {
      id: 'usr-rektor-01',
      nama_lengkap: 'Prof. Dr. Ir. Nundang Busaeri, M.T.',
      jabatan: 'Rektor',
      role: 'REKTOR',
      unit_kerja_id: 'UN58'
    },
    {
      id: 'usr-warek-01',
      nama_lengkap: 'Prof. Dr. H. Dedi Kusmayadi',
      jabatan: 'Wakil Rektor Bidang Akademik',
      role: 'WAREK',
      unit_kerja_id: 'UN58'
    },
    {
      id: 'usr-dekan-fkip',
      nama_lengkap: 'Dr. H. Cucu Hidayat, M.Pd.',
      jabatan: 'Dekan FKIP',
      role: 'DEKAN',
      unit_kerja_id: 'UN58.10'
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

  it('harus dapat menghasilkan daftar pejabat resmi di unit Rektorat (UN58)', () => {
    const unitRektorat = { kode_unit: 'UN58', nama_unit: 'Universitas Siliwangi (Rektorat)', tipe_unit: 'ORGAN' };
    const positions = getUnitOfficialPositions(unitRektorat, sampleUsers);

    expect(positions.length).toBeGreaterThanOrEqual(4);
    const names = positions.map((p) => p.nama_jabatan);
    expect(names).toContain('Rektor Universitas Siliwangi');
    expect(names).toContain('Wakil Rektor Bidang Akademik');
    expect(names).toContain('Wakil Rektor Bidang Keuangan dan Umum');
    expect(names).toContain('Wakil Rektor Bidang Kemahasiswaan dan Alumni');

    // Cek pejabat aktif yang terhubung
    const rektorPos = positions.find((p) => p.senderKey === 'REKTOR');
    expect(rektorPos.occupant).toBeDefined();
    expect(rektorPos.occupant.nama_lengkap).toBe('Prof. Dr. Ir. Nundang Busaeri, M.T.');
  });

  it('harus dapat menghasilkan daftar pejabat resmi di Fakultas (UN58.10 FKIP)', () => {
    const unitFkip = {
      kode_unit: 'UN58.10',
      nama_unit: 'Fakultas Keguruan dan Ilmu Pendidikan',
      singkatan: 'FKIP',
      tipe_unit: 'FAKULTAS',
      jurusan: [{ kode: 'PBI', nama: 'Pendidikan Bahasa Indonesia' }]
    };
    const positions = getUnitOfficialPositions(unitFkip, sampleUsers);

    expect(positions.length).toBeGreaterThanOrEqual(5);
    const dekanPos = positions.find((p) => p.singkat === 'Dekan');
    expect(dekanPos).toBeDefined();
    expect(dekanPos.senderKey).toBe('UN58.10__pimpinan');
    expect(dekanPos.fallbackKey).toBe('DEKAN');

    // Memuat jurusan
    expect(positions.some((p) => p.nama_jabatan.includes('Pendidikan Bahasa Indonesia'))).toBe(true);
  });

  it('harus mengidentifikasi resolveOfficialSenderKey secara akurat', () => {
    expect(resolveOfficialSenderKey('UN58', 'Rektor Universitas Siliwangi')).toBe('REKTOR');
    expect(resolveOfficialSenderKey('UN58', 'Wakil Rektor Bidang Akademik')).toBe('WAREK_1');
    expect(resolveOfficialSenderKey('UN58.10', 'Dekan FKIP')).toBe('UN58.10__pimpinan');
    expect(resolveOfficialSenderKey('UN58.10', 'Wakil Dekan Bidang Akademik (FKIP)')).toBe('UN58.10__wadek1');
    expect(resolveOfficialSenderKey('UN58.6', 'Kepala Biro Keuangan dan Umum')).toBe('KA_BIRO_BKU');
    expect(resolveOfficialSenderKey('UN58.SENAT', 'Ketua Senat Universitas Siliwangi')).toBe('UN58.SENAT__ketua');
  });

  it('harus dapat melakukan toggle status target pada formasi jabatan tertentu', () => {
    const targets = getTargetsForSender('REKTOR');
    const targetToToggle = targets[0];
    expect(targetToToggle.enabled).toBe(true);

    toggleTargetStatus('REKTOR', targetToToggle.id);
    let currentTargets = getTargetsForSender('REKTOR');
    expect(currentTargets.find((t) => t.id === targetToToggle.id).enabled).toBe(false);

    toggleTargetStatus('REKTOR', targetToToggle.id);
    currentTargets = getTargetsForSender('REKTOR');
    expect(currentTargets.find((t) => t.id === targetToToggle.id).enabled).toBe(true);
  });

  it('harus dapat mereset target jabatan spesifik ke standar', () => {
    toggleTargetStatus('WAREK_1', 'tgt-perpus');
    expect(getTargetsForSender('WAREK_1').find((t) => t.id === 'tgt-perpus').enabled).toBe(false);

    resetSenderTargets('WAREK_1', 'WAREK_1');
    expect(getTargetsForSender('WAREK_1').find((t) => t.id === 'tgt-perpus').enabled).toBe(true);
  });

  it('INTEGRASI REAL-TIME: menonaktifkan target pada pejabat spesifik langsung menyaring target dari modal disposisi', () => {
    const userRektor = {
      id: 'usr-rektor-01',
      role: 'REKTOR',
      jabatan: 'Rektor Universitas Siliwangi',
      unit_kerja_id: 'UN58'
    };

    // Target awal: WR 1 ada
    let targets = getHierarchicalDisposisiTargets(userRektor, []);
    expect(targets.some((t) => t.id === 'tgt-wr1')).toBe(true);

    // Super Admin menonaktifkan WR 1 untuk Rektor
    toggleTargetStatus('REKTOR', 'tgt-wr1');

    // Cek disposisi: WR 1 hilang
    targets = getHierarchicalDisposisiTargets(userRektor, []);
    expect(targets.some((t) => t.id === 'tgt-wr1')).toBe(false);

    // Kembalikan ke aktif
    toggleTargetStatus('REKTOR', 'tgt-wr1');
    targets = getHierarchicalDisposisiTargets(userRektor, []);
    expect(targets.some((t) => t.id === 'tgt-wr1')).toBe(true);
  });

  it('INTEGRASI REAL-TIME: menambah target kustom pada Dekan unit spesifik langsung muncul di modal disposisi', () => {
    const userDekan = {
      id: 'usr-dekan-01',
      role: 'DEKAN',
      jabatan: 'Dekan Fakultas Keguruan dan Ilmu Pendidikan',
      unit: 'Fakultas Keguruan dan Ilmu Pendidikan',
      unit_kerja_id: 'UN58.10'
    };

    const customTarget = {
      nama: 'Kepala Pusat Inovasi Pembelajaran Digital (PIPD)',
      badge: 'PIPD',
      cluster: 'Unit Penunjang',
      unit_id: 'UN58.10'
    };

    const dekanKey = resolveOfficialSenderKey('UN58.10', userDekan.jabatan);
    addTargetToSender(dekanKey, customTarget, 'DEKAN');

    const targets = getHierarchicalDisposisiTargets(userDekan, []);
    expect(targets.some((t) => t.nama === customTarget.nama)).toBe(true);
  });
});
