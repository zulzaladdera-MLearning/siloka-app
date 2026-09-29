/**
 * Utilitas Tata Naskah Dinas Resmi: Deteksi Otomatis Ukuran Kertas PDF (F4 vs A4)
 * Berdasarkan Pedoman Tata Naskah Dinas Kementerian & Universitas Siliwangi
 * 
 * Aturan Standar:
 * 1. Naskah Dinas Arahan (Pengaturan, Penetapan, Penugasan):
 *    - Meliputi: Prosedur Operasional Standar (POS/SOP), Surat Edaran (SE),
 *      Keputusan Rektor / Surat Keputusan (SK), Surat Perintah (SP),
 *      Surat Tugas (ST Lembar, ST Kolom, ST Pelaksana), Instruksi, Pedoman.
 *    - Ukuran Kertas Resmi: F4 / Folio (210mm x 330mm)
 * 
 * 2. Naskah Dinas Korespondensi, Khusus, atau Lainnya:
 *    - Meliputi: Surat Dinas, Nota Dinas, Surat Undangan, Nota Kesepahaman (MoU),
 *      Perjanjian Kerja Sama (PKS), Surat Kuasa, Berita Acara, Surat Keterangan,
 *      Surat Pernyataan, Surat Pengantar, Pengumuman, Notula, Laporan, Telaah Staf,
 *      Disposisi Rektor, dan Naskah Penggunaan TTE.
 *    - Ukuran Kertas Resmi: A4 (210mm x 297mm)
 */

/**
 * Aturan Ruang Tepi (Margin) Naskah Dinas Berdasarkan Pasal 47
 * Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas:
 * a. Ruang tepi atas: paling sedikit 1 (satu) spasi di bawah kepala Naskah Dinas apabila
 *    menggunakan kepala Naskah Dinas, atau paling sedikit 2 cm apabila tanpa kepala Naskah Dinas;
 * b. Ruang tepi bawah: paling sedikit 1,5 cm dari tepi bawah kertas;
 * c. Ruang tepi kiri: paling sedikit 1,5 cm dari tepi kiri kertas; dan
 * d. Ruang tepi kanan: paling sedikit 1,5 cm dari tepi kanan kertas.
 */
export const PASAL_47_MARGIN_CONFIG = {
  pasal: 'Pasal 47',
  regulasi: 'Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023',
  kopBorderDistanceCm: 4.5,
  topWithKopSpacing: '1 spasi di bawah Kepala Naskah Dinas',
  topWithKopSpacingCss: '1.25em',
  topWithKopEdgeCss: '1.5cm',
  topWithoutKopCm: 2.0,
  topWithoutKopMm: 20,
  topWithoutKopCss: '2cm',
  bottomCm: 1.5,
  bottomMm: 15,
  bottomCss: '1.5cm',
  leftCm: 1.5,
  leftMm: 15,
  leftCss: '1.5cm',
  rightCm: 1.5,
  rightMm: 15,
  rightCss: '1.5cm',
  cssMarginWithKop: '15mm 15mm 15mm 15mm',
  cssMarginWithoutKop: '20mm 15mm 15mm 15mm',
  badgeWithKop: 'Pasal 47 • Atas: 1 Spasi di bawah Kop (4,5 cm) • Bawah: 1,5 cm • Kiri: 1,5 cm • Kanan: 1,5 cm',
  badgeWithoutKop: 'Pasal 47 • Atas: 2 cm (Tanpa Kop) • Bawah: 1,5 cm • Kiri: 1,5 cm • Kanan: 1,5 cm'
};

/**
 * Daftar template yang secara bawaan TIDAK menggunakan Kepala Naskah Dinas (Kop Surat)
 */
const WITHOUT_KOP_TEMPLATE_IDS = new Set([
  'pos',
  'sop',
  'undangan_kartu',
  'lampiran_undangan'
]);

/**
 * Cek apakah suatu jenis naskah dinas menggunakan Kepala Naskah Dinas (Kop Surat)
 * @param {string|object} input
 * @returns {boolean}
 */
export const hasKepalaNaskahDinas = (input) => {
  if (!input) return true;
  if (typeof input === 'string') {
    const clean = input.trim().toLowerCase();
    return !WITHOUT_KOP_TEMPLATE_IDS.has(clean);
  }
  if (typeof input === 'object') {
    if (input.showKopSurat === false || input.hasKopSurat === false) {
      return false;
    }
    const tplId = (input.templateType || input.templateId || input.selectedTemplate || input.id || '')
      .toString()
      .trim()
      .toLowerCase();
    if (tplId && WITHOUT_KOP_TEMPLATE_IDS.has(tplId)) {
      return false;
    }
  }
  return true;
};

/**
 * Mendapatkan konfigurasi ruang tepi (margin) Pasal 47 untuk jenis naskah dinas tertentu
 * @param {string|object} input
 */
export const getPasal47MarginInfo = (input) => {
  const hasKop = hasKepalaNaskahDinas(input);
  return {
    ...PASAL_47_MARGIN_CONFIG,
    hasKop,
    activeTopLabel: hasKop
      ? '≥ 1 spasi di bawah Kepala Naskah Dinas'
      : '≥ 2 cm dari tepi atas kertas (Tanpa Kop)',
    activeTopCss: hasKop ? PASAL_47_MARGIN_CONFIG.topWithKopEdgeCss : PASAL_47_MARGIN_CONFIG.topWithoutKopCss,
    activeCssMargin: hasKop ? PASAL_47_MARGIN_CONFIG.cssMarginWithKop : PASAL_47_MARGIN_CONFIG.cssMarginWithoutKop,
    activeBadge: hasKop ? PASAL_47_MARGIN_CONFIG.badgeWithKop : PASAL_47_MARGIN_CONFIG.badgeWithoutKop
  };
};

/**
 * Spesifikasi Resmi Tata Tulis, Jenis Huruf, Spasi, dan Ukuran Kertas Naskah Dinas
 * Berdasarkan Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas
 * (Pasal 43–48 dan Lampiran Bab II):
 *
 * 1. Ukuran & Spesifikasi Kertas:
 *    - Naskah Dinas Arahan (Peraturan, POS/SOP, Keputusan, Surat Edaran): F4 (210 × 330 mm)
 *    - Naskah Dinas Korespondensi (Nota Dinas, Surat Dinas, Surat Undangan): A4 (210 × 297 mm)
 *    - Naskah Dinas Khusus (Surat Tugas, Surat Perintah, Surat Keterangan, Surat Pernyataan,
 *      Berita Acara, Pengumuman, MoU, PKS, Surat Kuasa, Surat Pengantar): A4 (210 × 297 mm)
 *    - Naskah Dinas Lainnya (Notula, Laporan, Telaah Staf, Disposisi, TTE): A4 (210 × 297 mm)
 *    - Gramatur & Kualitas: Kertas HVS minimal 70 gram (≥ 70 gram/m²), tidak boleh kertas bekas.
 *
 * 2. Jenis & Ukuran Huruf (Font & Size):
 *    - Naskah Dinas Arahan: Bookman Old Style ukuran 12 (12pt)
 *    - Naskah Dinas Korespondensi, Khusus, dan Lainnya: Times New Roman atau Arial ukuran 12 (12pt)
 *    - Kop / Kepala Naskah Dinas:
 *      * Baris Kementerian: Times New Roman ukuran 16 (Kapital)
 *      * Baris Nama Universitas / Unit Kerja: Times New Roman ukuran 14 (Kapital, Bold)
 *      * Baris Alamat & Kontak: Times New Roman ukuran 12
 *
 * 3. Batas Ruang Tepi (Margins - Pasal 47):
 *    - Tepi Atas: Paling sedikit 1 spasi di bawah garis penutup Kop Surat (jika berkop, garis tebal
 *      penutup kop berjarak 4,5 cm dari tepi atas kertas), atau paling sedikit 2 cm (jika tanpa kop)
 *    - Tepi Bawah: Paling sedikit 1,5 cm
 *    - Tepi Kiri: Paling sedikit 1,5 cm
 *    - Tepi Kanan: Paling sedikit 1,5 cm
 *
 * 4. Spasi & Tata Letak Baris:
 *    - Antara Judul dan Isi: 2 spasi
 *    - Judul Lebih dari Satu Baris: 1 spasi
 *
 * 5. Nomor Halaman, Kata Penyambung, dan Warna Tinta:
 *    - Nomor Halaman: Angka Arab simetris di tengah atas kertas dengan tanda hubung (- 2 -).
 *      Halaman pertama yang menggunakan Kop Surat tidak diberi nomor halaman.
 *    - Kata Penyambung: Kata pertama di halaman berikutnya ditulis di sudut kanan bawah halaman
 *      sebelumnya diikuti 3 titik (contoh: Peserta...).
 *    - Warna Tinta: Teks naskah dinas warna hitam (#000000); paraf/tanda tangan manual biru atau hitam.
 */
export const TATA_NASKAH_DINAS_SPECS = {
  regulasi: 'Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 (Pasal 43–48 & Lampiran Bab II)',
  gramaturKertas: 'HVS minimal 70 gram (≥ 70 gram/m²)',
  laranganKertas: 'Tidak diperbolehkan menggunakan kertas bekas',
  typography: {
    ARAHAN: {
      fontFamily: 'Bookman Old Style',
      cssFontFamily: '"Bookman Old Style", "URW Bookman", "Bookman", Georgia, "Times New Roman", serif',
      fontSizePt: 12,
      fontSizeCss: '12pt',
      label: 'Bookman Old Style 12pt'
    },
    NON_ARAHAN: {
      fontFamily: 'Times New Roman / Arial',
      cssFontFamily: '"Times New Roman", "Tinos", Times, serif',
      altCssFontFamily: 'Arial, Helvetica, sans-serif',
      fontSizePt: 12,
      fontSizeCss: '12pt',
      label: 'Times New Roman / Arial 12pt'
    },
    KOP_SURAT: {
      fontFamily: 'Times New Roman',
      kementerianSizePt: 16,
      barisKementerianPt: 16,
      kementerianStyle: 'KAPITAL (Times New Roman 16pt)',
      universitasUnitSizePt: 14,
      barisUniversitasUnitPt: 14,
      universitasUnitStyle: 'KAPITAL TEBAL / BOLD (Times New Roman 14pt)',
      alamatKontakSizePt: 12,
      barisAlamatKontakPt: 12,
      alamatKontakStyle: 'NORMAL (Times New Roman 12pt)',
      jarakGarisPenutupDariAtasCm: 4.5,
      borderBottomDistanceCm: 4.5
    },
    kopSurat: {
      fontFamily: 'Times New Roman',
      barisKementerianPt: 16,
      barisUniversitasUnitPt: 14,
      barisAlamatKontakPt: 12,
      borderBottomDistanceCm: 4.5
    }
  },
  spasi: {
    antaraJudulDanIsi: '2 spasi',
    antaraJudulDanIsiCss: '2em',
    antarBarisJudul: '1 spasi',
    antarBarisJudulCss: '1.15',
    diBawahGarisKop: '1 spasi'
  },
  spacing: {
    betweenTitleAndBodySpasi: 2,
    multiLineTitleSpasi: 1,
    belowKopBorderSpasi: 1
  },
  halamanDanTinta: {
    formatNomorHalaman: '- 2 -',
    posisiNomorHalaman: 'Simetris di tengah atas kertas (Halaman 1 berkop tidak diberi nomor halaman)',
    contohKataPenyambung: 'Peserta...',
    warnaTintaTeks: 'Hitam (#000000)',
    warnaTintaParafTtd: 'Biru atau Hitam'
  },
  pageNumberAndCatchword: {
    pageNumberExample: '- 2 -',
    firstPageWithKopNumbered: false,
    catchwordExample: 'Peserta...'
  },
  inkColor: {
    textColor: '#000000',
    parafTtdColors: ['Biru', 'Hitam']
  }
};

export const PAPER_SIZES = {
  F4: {
    code: 'F4',
    name: 'F4 / Folio',
    category: 'Naskah Dinas Arahan (Peraturan, POS/SOP, Keputusan, Surat Edaran)',
    widthMm: 210,
    heightMm: 330,
    width: '210mm',
    height: '330mm',
    gramatur: 'HVS minimal 70 gram',
    fontSpec: TATA_NASKAH_DINAS_SPECS.typography.ARAHAN,
    cssPageSize: '210mm 330mm portrait',
    cssMargin: PASAL_47_MARGIN_CONFIG.cssMarginWithKop,
    cssMarginWithoutKop: PASAL_47_MARGIN_CONFIG.cssMarginWithoutKop,
    badgeLabel: 'F4 (210 × 330 mm) • HVS ≥ 70g',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Kertas F4 (210 × 330 mm) HVS ≥ 70g • Huruf Bookman Old Style 12pt (Naskah Dinas Arahan)'
  },
  A4: {
    code: 'A4',
    name: 'A4',
    category: 'Naskah Dinas Korespondensi, Khusus, dan Lainnya',
    widthMm: 210,
    heightMm: 297,
    width: '210mm',
    height: '297mm',
    gramatur: 'HVS minimal 70 gram',
    fontSpec: TATA_NASKAH_DINAS_SPECS.typography.NON_ARAHAN,
    cssPageSize: '210mm 297mm portrait',
    cssMargin: PASAL_47_MARGIN_CONFIG.cssMarginWithKop,
    cssMarginWithoutKop: PASAL_47_MARGIN_CONFIG.cssMarginWithoutKop,
    badgeLabel: 'A4 (210 × 297 mm) • HVS ≥ 70g',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Kertas A4 (210 × 297 mm) HVS ≥ 70g • Huruf Times New Roman / Arial 12pt'
  }
};

/**
 * Daftar template ID yang dikategorikan sebagai Naskah Dinas Arahan (F4 & Bookman Old Style 12pt)
 * Sesuai Peraturan Rektor UNSIL No. 3/2023 Pasal 43–48 & Lampiran Bab II:
 * - Naskah Dinas Arahan: Peraturan, POS/SOP, Keputusan, Surat Edaran -> F4 (210 x 330 mm)
 * - Adapun Surat Tugas (st_lembar, st_kolom) & Surat Perintah (sp) termasuk Naskah Dinas Khusus -> A4 (210 x 297 mm)
 */
const ARAHAN_TEMPLATE_IDS = new Set([
  'pos',          // Prosedur Operasional Standar (POS / SOP)
  'sop',          // Standar Operasional Prosedur
  'se',           // Surat Edaran
  'sk',           // Keputusan Rektor / Surat Keputusan
  'edaran',       // Surat Edaran
  'surat-edaran',
  'keputusan',    // Surat Keputusan
  'instruksi',    // Instruksi Rektor
  'juklak',       // Petunjuk Pelaksanaan
  'juknis',       // Petunjuk Teknis
  'pedoman',      // Pedoman
  'peraturan'     // Peraturan Rektor / Senat
]);

/**
 * Kata kunci teks yang menandakan dokumen bertipe Naskah Dinas Arahan (F4 & Bookman Old Style 12pt)
 */
const ARAHAN_KEYWORDS = [
  'surat edaran',
  'surat keputusan',
  'keputusan rektor',
  'prosedur operasional standar',
  'standar operasional prosedur',
  'petunjuk pelaksanaan',
  'petunjuk teknis',
  'instruksi rektor',
  'pedoman teknis',
  'peraturan rektor',
  'naskah dinas arahan'
];

/**
 * Deteksi ukuran kertas secara otomatis ('F4' atau 'A4')
 * Menerima template ID, string kategori/perihal, atau objek surat lengkap
 * 
 * @param {string|object} input - ID template, perihal, kategori, atau objek surat
 * @returns {'F4' | 'A4'} Ukuran kertas resmi yang terdeteksi
 */
export const detectPaperSize = (input) => {
  if (!input) return 'A4';

  // 1. Jika input bertipe string langsung (misal: 'pos', 'se', 'tugas', 'F4', 'A4')
  if (typeof input === 'string') {
    const cleanStr = input.trim().toLowerCase();

    if (cleanStr === 'f4' || cleanStr === 'folio') return 'F4';
    if (cleanStr === 'a4') return 'A4';

    if (ARAHAN_TEMPLATE_IDS.has(cleanStr)) {
      return 'F4';
    }

    for (const kw of ARAHAN_KEYWORDS) {
      if (cleanStr.includes(kw)) {
        return 'F4';
      }
    }

    return 'A4';
  }

  // 2. Jika input adalah objek surat (misal: letter dari database atau state form)
  if (typeof input === 'object') {
    // A. Cek explicit paperSize jika sudah ada
    if (input.paperSize) {
      const explicit = String(input.paperSize).toUpperCase();
      if (explicit === 'F4' || explicit === 'FOLIO') return 'F4';
      if (explicit === 'A4') return 'A4';
    }

    // B. Cek templateType / templateId
    const tplId = (input.templateType || input.templateId || input.selectedTemplate || input.id || '')
      .toString()
      .toLowerCase();
    if (tplId && ARAHAN_TEMPLATE_IDS.has(tplId)) {
      return 'F4';
    }

    // C. Cek kategori surat
    const kategori = (input.kategori || input.kategoriSurat || '').toString().toLowerCase();
    if (kategori) {
      if (
        kategori.includes('arahan') ||
        kategori.includes('edaran') ||
        kategori.includes('keputusan') ||
        kategori.includes('instruksi') ||
        kategori.includes('pedoman') ||
        kategori.includes('peraturan') ||
        kategori.includes('pos') ||
        kategori.includes('sop')
      ) {
        return 'F4';
      }
    }

    // D. Cek perihal surat
    const perihal = (input.perihal || input.namaSurat || input.judul || '').toString().toLowerCase();
    if (perihal) {
      for (const kw of ARAHAN_KEYWORDS) {
        if (perihal.includes(kw)) {
          return 'F4';
        }
      }
    }

    // E. Cek nomor surat jika memuat kode spesifik arahan (contoh: SE, SK, POS, SOP)
    const nomor = (input.nomorSurat || input.nomor_surat_lengkap || '').toString().toUpperCase();
    if (nomor) {
      if (
        nomor.includes('/SE/') ||
        nomor.includes('/SK/') ||
        nomor.startsWith('POS/') ||
        nomor.startsWith('SOP/') ||
        nomor.includes('/POS/')
      ) {
        return 'F4';
      }
    }
  }

  // Default untuk Naskah Dinas Korespondensi, Khusus (termasuk Surat Tugas & Surat Perintah), dan Lainnya
  return 'A4';
};

/**
 * Mendapatkan informasi lengkap ukuran kertas beserta metadata visual, tipografi, & CSS
 * 
 * @param {string|object} input - ID template, objek surat, atau kode kertas
 * @returns {object} Detail ukuran kertas (PAPER_SIZES.F4 atau PAPER_SIZES.A4)
 */
export const getPaperSizeInfo = (input) => {
  const sizeCode = detectPaperSize(input);
  const pasal47 = getPasal47MarginInfo(input);
  const isF4 = sizeCode === 'F4';
  const typographySpec = isF4
    ? TATA_NASKAH_DINAS_SPECS.typography.ARAHAN
    : TATA_NASKAH_DINAS_SPECS.typography.NON_ARAHAN;

  return {
    ...PAPER_SIZES[sizeCode],
    isF4,
    isA4: !isF4,
    pasal47,
    typographySpec,
    fontFamilyLabel: typographySpec.label,
    fontSizePt: typographySpec.fontSizePt,
    gramatur: 'HVS minimal 70 gram',
    kopSpec: TATA_NASKAH_DINAS_SPECS.typography.KOP_SURAT,
    spasiSpec: TATA_NASKAH_DINAS_SPECS.spasi,
    halamanDanTintaSpec: TATA_NASKAH_DINAS_SPECS.halamanDanTinta,
    gramaturKertas: TATA_NASKAH_DINAS_SPECS.gramaturKertas
  };
};

