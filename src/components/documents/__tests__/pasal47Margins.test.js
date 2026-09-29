import { describe, it, expect } from 'vitest';
import {
  TATA_NASKAH_DINAS_SPECS,
  PASAL_47_MARGIN_CONFIG,
  hasKepalaNaskahDinas,
  getPasal47MarginInfo,
  getPaperSizeInfo,
  PAPER_SIZES
} from '../../../utils/paperSize';
import { DOCUMENT_TEMPLATES } from '../DocumentTemplates';

describe('Peraturan Rektor UNSIL No. 3 Tahun 2023 (Pasal 43–48 & Lampiran Bab II) - Tata Tulis, Huruf, Spasi, dan Kertas', () => {
  it('memiliki konfigurasi ruang tepi Pasal 47 yang presisi (Atas: 1 spasi di bawah Kop 4,5 cm / 2 cm tanpa Kop, Bawah/Kiri/Kanan: 1,5 cm)', () => {
    expect(PASAL_47_MARGIN_CONFIG.pasal).toBe('Pasal 47');
    expect(PASAL_47_MARGIN_CONFIG.kopBorderDistanceCm).toBe(4.5);
    expect(PASAL_47_MARGIN_CONFIG.topWithoutKopCm).toBe(2.0);
    expect(PASAL_47_MARGIN_CONFIG.topWithoutKopCss).toBe('2cm');
    expect(PASAL_47_MARGIN_CONFIG.bottomCm).toBe(1.5);
    expect(PASAL_47_MARGIN_CONFIG.bottomCss).toBe('1.5cm');
    expect(PASAL_47_MARGIN_CONFIG.leftCm).toBe(1.5);
    expect(PASAL_47_MARGIN_CONFIG.leftCss).toBe('1.5cm');
    expect(PASAL_47_MARGIN_CONFIG.rightCm).toBe(1.5);
    expect(PASAL_47_MARGIN_CONFIG.rightCss).toBe('1.5cm');
  });

  it('menerapkan ukuran kertas F4 (210x330mm, Bookman Old Style 12pt) untuk Naskah Dinas Arahan dan A4 (210x297mm, Times New Roman/Arial 12pt) untuk Korespondensi, Khusus (termasuk Surat Tugas & Surat Perintah), dan Lainnya', () => {
    // Naskah Dinas Arahan: POS, Surat Edaran, Keputusan -> F4 & Bookman Old Style 12pt
    const arahanIds = ['pos', 'se', 'sk'];
    for (const id of arahanIds) {
      const info = getPaperSizeInfo(id);
      expect(info.code).toBe('F4');
      expect(info.width).toBe('210mm');
      expect(info.height).toBe('330mm');
      expect(info.fontFamilyLabel).toContain('Bookman Old Style');
      expect(info.fontSizePt).toBe(12);
      expect(info.gramatur).toBe('HVS minimal 70 gram');
    }

    // Naskah Dinas Korespondensi, Khusus (ST, SP, SKet, SPern, BA, Pengumuman, MoU, PKS), dan Lainnya (Notula, Laporan, Telaah Staf) -> A4 & Times New Roman / Arial 12pt
    const a4Ids = [
      'nd', 'sd', 'undangan_lembar', 'undangan_kartu',
      'st_lembar', 'st_kolom', 'sp', 'sket', 'sper', 'ba', 'peng', 'mou', 'pks', 'skua', 'speng',
      'notula', 'lap', 'ts', 'disp_rektor', 'tte_doc'
    ];
    for (const id of a4Ids) {
      const info = getPaperSizeInfo(id);
      expect(info.code).toBe('A4');
      expect(info.width).toBe('210mm');
      expect(info.height).toBe('297mm');
      expect(info.fontFamilyLabel).toContain('Times New Roman');
      expect(info.fontSizePt).toBe(12);
      expect(info.gramatur).toBe('HVS minimal 70 gram');
    }
  });

  it('memverifikasi spesifikasi Kop / Kepala Naskah Dinas (Times New Roman 16pt Kapital, 14pt Kapital Bold, 12pt Alamat, garis penutup 4,5 cm)', () => {
    const kop = TATA_NASKAH_DINAS_SPECS.typography.kopSurat;
    expect(kop.fontFamily).toContain('Times New Roman');
    expect(kop.barisKementerianPt).toBe(16);
    expect(kop.barisUniversitasUnitPt).toBe(14);
    expect(kop.barisAlamatKontakPt).toBe(12);
    expect(kop.borderBottomDistanceCm).toBe(4.5);
  });

  it('memverifikasi ketentuan spasi (2 spasi antara judul dan isi, 1 spasi judul lebih dari 1 baris), nomor halaman (- 2 -), kata penyambung (...), dan tinta hitam', () => {
    expect(TATA_NASKAH_DINAS_SPECS.spacing.betweenTitleAndBodySpasi).toBe(2);
    expect(TATA_NASKAH_DINAS_SPECS.spacing.multiLineTitleSpasi).toBe(1);
    expect(TATA_NASKAH_DINAS_SPECS.pageNumberAndCatchword.pageNumberExample).toBe('- 2 -');
    expect(TATA_NASKAH_DINAS_SPECS.pageNumberAndCatchword.firstPageWithKopNumbered).toBe(false);
    expect(TATA_NASKAH_DINAS_SPECS.pageNumberAndCatchword.catchwordExample).toBe('Peserta...');
    expect(TATA_NASKAH_DINAS_SPECS.inkColor.textColor).toBe('#000000');
  });

  it('menerapkan margin Pasal 47 pada PAPER_SIZES.F4 dan PAPER_SIZES.A4', () => {
    expect(PAPER_SIZES.F4.cssMargin).toBe('15mm 15mm 15mm 15mm');
    expect(PAPER_SIZES.F4.cssMarginWithoutKop).toBe('20mm 15mm 15mm 15mm');
    expect(PAPER_SIZES.A4.cssMargin).toBe('15mm 15mm 15mm 15mm');
    expect(PAPER_SIZES.A4.cssMarginWithoutKop).toBe('20mm 15mm 15mm 15mm');
  });

  it('membedakan naskah dinas dengan Kepala Naskah Dinas (Kop Surat) dan tanpa Kepala Naskah Dinas', () => {
    const withKopTemplates = [
      'se', 'sk', 'sp', 'st_lembar', 'st_kolom', 'nd', 'sd',
      'undangan_lembar', 'mou', 'pks', 'skua', 'ba', 'sket',
      'sper', 'speng', 'peng', 'notula', 'lap', 'disp_rektor', 'tte_doc'
    ];
    for (const tpl of withKopTemplates) {
      expect(hasKepalaNaskahDinas(tpl)).toBe(true);
      const info = getPasal47MarginInfo(tpl);
      expect(info.hasKop).toBe(true);
      expect(info.activeCssMargin).toBe('15mm 15mm 15mm 15mm');
    }

    const withoutKopTemplates = ['pos', 'sop', 'undangan_kartu', 'lampiran_undangan'];
    for (const tpl of withoutKopTemplates) {
      expect(hasKepalaNaskahDinas(tpl)).toBe(false);
      const info = getPasal47MarginInfo(tpl);
      expect(info.hasKop).toBe(false);
      expect(info.activeTopCss).toBe('2cm');
      expect(info.activeCssMargin).toBe('20mm 15mm 15mm 15mm');
    }

    expect(hasKepalaNaskahDinas({ templateType: 'ts', showKopSurat: false })).toBe(false);
    expect(hasKepalaNaskahDinas({ templateType: 'ts', showKopSurat: true })).toBe(true);
  });

  it('memastikan seluruh 23 jenis naskah dinas pada DOCUMENT_TEMPLATES memiliki metadata Pasal 43–48 lengkap', () => {
    expect(DOCUMENT_TEMPLATES.length).toBe(23);
    for (const tpl of DOCUMENT_TEMPLATES) {
      expect(tpl.pasal47).toBeDefined();
      expect(tpl.pasal47.pasal).toBe('Pasal 47');
      expect(tpl.pasal47.ruangTepiBawah).toBe('1,5 cm');
      expect(tpl.pasal47.ruangTepiKiri).toBe('1,5 cm');
      expect(tpl.pasal47.ruangTepiKanan).toBe('1,5 cm');
      expect(tpl.tataNaskahSpecs).toBeDefined();
      expect(tpl.tataNaskahSpecs.gramatur).toBe('HVS minimal 70 gram');
      expect(tpl.tataNaskahSpecs.warnaTinta).toBe('Hitam');
      expect(tpl.tataNaskahSpecs.jarakJudulKeIsi).toBe('2 spasi');
      expect(tpl.tataNaskahSpecs.jarakBarisJudul).toBe('1 spasi');
    }
  });
});
