import { describe, it, expect } from 'vitest';
import {
  JRA_PRIMARY_CATEGORIES,
  JRA_SUB_CATEGORIES,
  JRA_MASTER_ITEMS,
  FEATURED_PERIHAL_SHORTCUTS,
  TEMPLATE_DEFAULT_KLASIFIKASI_MAP,
  resolveOfficialUnitInfo,
  mapSecurityLabelToCode,
  getJraItemByCode,
  assembleOfficialLetterNumber
} from '../../config/jraMasterCatalog';

describe('Mekanisme Kerja Sistem SILOKA: Pustaka Kode Baku, Dynamic Mapping & Auto-Generated Numbering', () => {
  it('1. Pustaka Kode Baku di Database memuat 18 Kategori Utama, 140 Sub-Kategori, & 439+ Kode dari Excel SK Rektor No. 2803 Tahun 2023 (KP.04.03, PP.00.04, KR.01)', () => {
    expect(JRA_PRIMARY_CATEGORIES.length).toBe(18);
    expect(JRA_SUB_CATEGORIES.length).toBe(140);
    expect(JRA_MASTER_ITEMS.length).toBeGreaterThanOrEqual(435);

    const kp0403 = getJraItemByCode('KP.04.03');
    expect(kp0403).toBeDefined();
    expect(kp0403.kode_klasifikasi).toBe('KP.04.03');
    expect(kp0403.nama_klasifikasi).toContain('Usul Kenaikan Pangkat');

    const pp0004 = getJraItemByCode('PP.00.04');
    expect(pp0004).toBeDefined();
    expect(pp0004.kode_klasifikasi).toBe('PP.00.04');
    expect(pp0004.nama_klasifikasi).toContain('Naskah Soal PMB');
    expect(pp0004.kode_keamanan).toBe('R');

    const kr01 = getJraItemByCode('KR.01');
    expect(kr01).toBeDefined();
    expect(kr01.kode_klasifikasi).toBe('KR.01');
    expect(kr01.nama_klasifikasi).toContain('Perjalanan Dinas');
  });

  it('2. Pemilihan Dinamis Berbasis Perihal (Dynamic Mapping) memetakan topik surat ke kode klasifikasi tanpa input manual', () => {
    expect(FEATURED_PERIHAL_SHORTCUTS.some((s) => s.kode_klasifikasi === 'KP.04.03')).toBe(true);
    expect(FEATURED_PERIHAL_SHORTCUTS.some((s) => s.kode_klasifikasi === 'PP.00.04')).toBe(true);
    expect(FEATURED_PERIHAL_SHORTCUTS.some((s) => s.kode_klasifikasi === 'KR.01')).toBe(true);

    expect(TEMPLATE_DEFAULT_KLASIFIKASI_MAP['sp'].defaultKode).toBe('KP.05.00');
    expect(TEMPLATE_DEFAULT_KLASIFIKASI_MAP['st-lembar'].defaultKode).toBe('KP.05.00');
    expect(TEMPLATE_DEFAULT_KLASIFIKASI_MAP['tugas'].defaultKode).toBe('KP.05.00');
  });

  it('3. Perakitan Nomor Otomatis oleh Sistem merakit string 83/UN58.10/KP.04.03/2026 dan 83/UN58.10/B/KP.04.03/2026 sesuai Peraturan Rektor No. 3/2023', () => {
    expect(resolveOfficialUnitInfo({ unit_kerja_id: 'UN58.10' }).kode).toBe('UN58.10');
    expect(resolveOfficialUnitInfo({ unit_kerja_id: 'UN58.5' }).kode).toBe('UN58.5');
    expect(resolveOfficialUnitInfo({ unit_kerja_id: 'UN58' }).kode).toBe('UN58');

    // Contoh hasil rakitan otomatis 4 segmen (Naskah Unit/Fakultas Hal. 75): 83/UN58.10/KP.04.03/2026
    const numEmpatSegmen = assembleOfficialLetterNumber({
      nomorUrut: 83,
      kodeUnit: 'UN58.10',
      kodeKlasifikasi: 'KP.04.03',
      tahun: 2026,
      includeSecuritySegment: false
    });
    expect(numEmpatSegmen).toBe('83/UN58.10/KP.04.03/2026');

    // Contoh hasil rakitan otomatis 5 segmen (Korespondensi dengan Kode Keamanan): 83/UN58.10/B/KP.04.03/2026
    const numLimaSegmen = assembleOfficialLetterNumber({
      nomorUrut: 83,
      kodeUnit: 'UN58.10',
      kodeKeamanan: 'B',
      kodeKlasifikasi: 'KP.04.03',
      tahun: 2026,
      includeSecuritySegment: true
    });
    expect(numLimaSegmen).toBe('83/UN58.10/B/KP.04.03/2026');

    // Contoh 4 Hal. 74 Peraturan Rektor No. 3/2023: 18/UN58/R/PR.00.02/2022
    const numRahasia = assembleOfficialLetterNumber({
      nomorUrut: 18,
      kodeUnit: 'UN58',
      kodeKeamanan: 'R',
      kodeKlasifikasi: 'PR.00.02',
      tahun: 2022,
      includeSecuritySegment: true
    });
    expect(numRahasia).toBe('18/UN58/R/PR.00.02/2022');
  });

  it('4. Validasi Otomatis & Trigger Pengamanan mendeteksi Rahasia (R) dan Sangat Rahasia (SR)', () => {
    expect(mapSecurityLabelToCode('Biasa/Terbuka')).toBe('B');
    expect(mapSecurityLabelToCode('Rahasia')).toBe('R');
    expect(mapSecurityLabelToCode('Sangat Rahasia')).toBe('SR');

    const secretItem = getJraItemByCode('KP.02.05');
    expect(secretItem.kode_keamanan).toBe('SR');

    const rahasiaItem = getJraItemByCode('PP.00.04');
    expect(rahasiaItem.kode_keamanan).toBe('R');
  });
});
