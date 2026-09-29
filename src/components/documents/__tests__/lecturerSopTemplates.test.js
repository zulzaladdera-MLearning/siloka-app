import { describe, it, expect } from 'vitest';
import {
  normalizeUserRole,
  getAuthorizedTemplatesWithNumbering,
  getDefaultTemplateForUser,
  isTemplateAllowedForUser,
  getLecturerTemplateSopMetadata,
  LECTURER_MAIN_TEMPLATE_IDS,
  LECTURER_CONDITIONAL_TEMPLATE_IDS,
  LECTURER_ALLOWED_TEMPLATE_IDS
} from '../../../config/documentFormats';
import { fetchAvailableLetterTypes } from '../../../services/letterService';
import usersData from '../../../data/users.json';

describe('SOP Template Surat untuk Role Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan)', () => {
  const dosenFt = usersData.find((u) => u.id === 'usr-dosen-01');
  const dosenFkip = usersData.find((u) => u.id === 'usr-dosen-02');

  it('memiliki akun Dosen Biasa di users.json dan menormalisasi role ke DOSEN_NON_JABATAN', () => {
    expect(dosenFt).toBeDefined();
    expect(dosenFkip).toBeDefined();
    expect(normalizeUserRole(dosenFt)).toBe('DOSEN_NON_JABATAN');
    expect(normalizeUserRole(dosenFkip)).toBe('DOSEN_NON_JABATAN');
  });

  it('menyediakan 8 Template Utama (4 Mandiri + 4 Konsep Pimpinan) dan 2 Template Kondisional sesuai Peraturan Rektor No. 3/2023', () => {
    const templates = getAuthorizedTemplatesWithNumbering(dosenFt);
    const ids = templates.map((t) => t.id);

    // 1. Kategori Template Mandiri (Ditandatangani Langsung oleh Dosen): Nota Dinas, Laporan, Telaah Staf, Surat Pernyataan
    expect(ids).toContain('nd');
    expect(ids).toContain('lap');
    expect(ids).toContain('ts');
    expect(ids).toContain('sper');

    // + 2 Template Kondisional (Sesuai Penugasan/Kejadian): Notula, Berita Acara
    expect(ids).toContain('notula');
    expect(ids).toContain('ba');

    // 2. Kategori Template Konsep / Drafting (Diajukan untuk Ditandatangani Pimpinan): Surat Tugas (Lembaran & Kolom), Surat Dinas, Surat Keterangan, Surat Pengantar
    expect(ids).toContain('st_lembar');
    expect(ids).toContain('st_kolom');
    expect(ids).toContain('sd');
    expect(ids).toContain('sket');
    expect(ids).toContain('speng');

    // Pastikan tepat hanya daftar yang diizinkan (9 jenis naskah utama = 4 Mandiri + 1 Kondisional Notula + 1 Kondisional BA + 4 Konsep dengan 2 varian ST = 11 format id)
    expect(ids).toEqual(LECTURER_ALLOWED_TEMPLATE_IDS);
    expect(LECTURER_MAIN_TEMPLATE_IDS.length).toBe(9);
    expect(LECTURER_CONDITIONAL_TEMPLATE_IDS).toEqual(['ba', 'notula']);
    expect(getDefaultTemplateForUser(dosenFt)).toBe('nd');
  });

  it('memblokir naskah arahan/keputusan pimpinan murni (SK, SE, Surat Perintah, POS, MoU, PKS, Pengumuman, Surat Kuasa) bagi Dosen Biasa', () => {
    const blockedIds = ['sk', 'se', 'sp', 'pos', 'mou', 'pks', 'skua', 'peng', 'disp_rektor', 'tte_doc'];
    for (const blocked of blockedIds) {
      expect(isTemplateAllowedForUser(blocked, dosenFt)).toBe(false);
    }
  });

  it('membedakan metadata SOP Kategori 1 (Mandiri / Kondisional - TTD Dosen) vs Kategori 2 (Konsep / Drafting - TTD Pimpinan)', () => {
    const ndMeta = getLecturerTemplateSopMetadata('nd');
    expect(ndMeta.isDirectLecturerSignature).toBe(true);
    expect(ndMeta.isDraftForLeader).toBe(false);
    expect(ndMeta.pasal).toBe('Pasal 11');

    const notulaMeta = getLecturerTemplateSopMetadata('notula');
    expect(notulaMeta.isConditional).toBe(true);
    expect(notulaMeta.isDirectLecturerSignature).toBe(true);
    expect(notulaMeta.pasal).toBe('Pasal 25');

    const stMeta = getLecturerTemplateSopMetadata('st_lembar');
    expect(stMeta.isDraftForLeader).toBe(true);
    expect(stMeta.isDirectLecturerSignature).toBe(false);
    expect(stMeta.pasal).toBe('Pasal 9');
  });

  it('mengembalikan 11 jenis naskah wajib (Nota Dinas s.d. Surat Pengantar) pada fetchAvailableLetterTypes untuk Dosen Tanpa Jabatan', async () => {
    const response = await fetchAvailableLetterTypes(dosenFt);
    expect(response.is_lecturer_sop_mode).toBe(true);
    expect(response.types.length).toBe(11);

    const codes = response.types.map((t) => t.kode_jenis_naskah);
    expect(codes).toEqual([
      'NOTA_DINAS',
      'SURAT_PERNYATAAN',
      'LAPORAN',
      'TELAAH_STAF',
      'BERITA_ACARA',
      'NOTULA',
      'SURAT_TUGAS_LEMBAR',
      'SURAT_TUGAS_KOLOM',
      'SURAT_DINAS',
      'SURAT_KETERANGAN',
      'SURAT_PENGANTAR'
    ]);
  });
});
