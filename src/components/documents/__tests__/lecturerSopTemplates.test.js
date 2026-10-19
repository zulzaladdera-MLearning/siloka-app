import { describe, it, expect } from 'vitest';
import {
  normalizeUserRole,
  getAuthorizedTemplatesWithNumbering,
  getDefaultTemplateForUser,
  isTemplateAllowedForUser,
  getLecturerTemplateSopMetadata,
  LECTURER_MAIN_TEMPLATE_IDS,
  LECTURER_CONDITIONAL_TEMPLATE_IDS,
  LECTURER_ALLOWED_TEMPLATE_IDS,
  LECTURER_TRIDHARMA_6_TEMPLATE_IDS
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

  it('menyediakan tepat 6 Template Tridharma sesuai Matriks Hak Akses & Peraturan Rektor No. 3/2023', () => {
    const templates = getAuthorizedTemplatesWithNumbering(dosenFt);
    const ids = templates.map((t) => t.id);

    // 6 Template Tridharma & Internal Dosen:
    // 1. ST (Lembar)
    expect(ids).toContain('st_lembar');
    // 2. ST (Kolom)
    expect(ids).toContain('st_kolom');
    // 3. Nota Dinas
    expect(ids).toContain('nd');
    // 4. Surat Keterangan
    expect(ids).toContain('sket');
    // 5. Laporan
    expect(ids).toContain('lap');
    // 6. Telaah Staf
    expect(ids).toContain('ts');

    // Pastikan tepat hanya 6 daftar yang diizinkan
    expect(ids).toEqual([...LECTURER_TRIDHARMA_6_TEMPLATE_IDS]);
    expect(ids.length).toBe(6);
    expect(getDefaultTemplateForUser(dosenFt)).toBe('st_lembar');
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

  it('mengembalikan 11 jenis naskah dalam 2 kategori (Mandiri & Draf Pimpinan) pada fetchAvailableLetterTypes untuk Dosen Tanpa Jabatan', async () => {
    const response = await fetchAvailableLetterTypes(dosenFt);
    expect(response.is_lecturer_sop_mode).toBe(true);
    expect(response.types.length).toBe(11);

    const mandiri = response.types.filter((t) => t.is_mandiri);
    const drafPimpinan = response.types.filter((t) => !t.is_mandiri);

    expect(mandiri.length).toBe(6);
    expect(drafPimpinan.length).toBe(5);

    const mandiriCodes = mandiri.map((t) => t.kode_jenis_naskah);
    expect(mandiriCodes).toEqual([
      'NOTA_DINAS',
      'SURAT_PERNYATAAN',
      'LAPORAN',
      'TELAAH_STAF',
      'BERITA_ACARA',
      'NOTULA'
    ]);

    const drafCodes = drafPimpinan.map((t) => t.kode_jenis_naskah);
    expect(drafCodes).toEqual([
      'SURAT_TUGAS_LEMBAR',
      'SURAT_TUGAS_KOLOM',
      'SURAT_DINAS',
      'SURAT_KETERANGAN',
      'SURAT_PENGANTAR'
    ]);
  });
});
