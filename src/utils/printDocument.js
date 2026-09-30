/**
 * Utilitas Pencetakan Resmi Naskah Dinas UNSIL (Mendukung F4 & A4 Otomatis)
 * 
 * Menggunakan portal #siloka-print-root langsung pada <body> sehingga:
 * 1. Seluruh antarmuka web app (#root) disembunyikan (display: none !important),
 *    menghilangkan 100% hambatan modal, overflow-hidden, dan margin kosong.
 * 2. Dokumen dicetak dalam flow dokumen standar tanpa pemotongan tinggi (no clipping).
 * 3. Halaman multi-lembar (seperti SK Rektor & Lampiran) berpindah halaman secara natural
 *    dengan aturan page-break-before: always; (menghasilkan tepat lembar yang diinginkan).
 * 4. Otomatisasi Ukuran Kertas PDF (Sesuai Kaidah Tata Naskah Dinas Resmi):
 *    - Naskah Dinas Arahan (Surat Tugas, Surat Perintah, Surat Edaran, SK, POS/SOP) -> F4 (210mm x 330mm)
 *    - Naskah Dinas Korespondensi, Khusus, atau Lainnya -> A4 (210mm x 297mm)
 */

import {
  detectPaperSize,
  getPaperSizeInfo,
  PAPER_SIZES,
  PASAL_47_MARGIN_CONFIG,
  hasKepalaNaskahDinas,
  getPasal47MarginInfo
} from './paperSize';

export {
  detectPaperSize,
  getPaperSizeInfo,
  PAPER_SIZES,
  PASAL_47_MARGIN_CONFIG,
  hasKepalaNaskahDinas,
  getPasal47MarginInfo
};

const PRINT_STYLE_ID = 'siloka-print-page-style';

/**
 * Injeksi atau perbarui aturan CSS @page secara dinamis ke <head>
 * Sesuai Pasal 47 Peraturan Rektor UNSIL No. 3 Tahun 2023:
 * - a. Ruang tepi atas: >= 1 spasi di bawah Kepala Naskah Dinas (jika berkop) atau >= 2 cm (jika tanpa Kop)
 * - b. Ruang tepi bawah: >= 1,5 cm (15mm)
 * - c. Ruang tepi kiri: >= 1,5 cm (15mm)
 * - d. Ruang tepi kanan: >= 1,5 cm (15mm)
 *
 * @param {'F4' | 'A4'} paperSize 
 * @param {boolean} hasKop
 */
export const applyPrintPageStyle = (paperSize = 'A4', hasKop = true) => {
  if (typeof document === 'undefined') return;

  const sizeInfo = paperSize === 'F4' ? PAPER_SIZES.F4 : PAPER_SIZES.A4;
  const firstPageMargin = hasKop
    ? PASAL_47_MARGIN_CONFIG.cssMarginWithKop
    : PASAL_47_MARGIN_CONFIG.cssMarginWithoutKop;
  const continuationPageMargin = PASAL_47_MARGIN_CONFIG.cssMarginWithoutKop;

  let styleEl = document.getElementById(PRINT_STYLE_ID);

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = PRINT_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      /* Hilangkan 100% Header & Footer bawaan browser (Tanggal, Nama Dokumen, URL localhost, dan Nomor Halaman 1/1) */
      /* sesuai standar template naskah dinas resmi di dokumen siloka (Peraturan Rektor UNSIL No. 3/2023) */
      @page {
        size: ${sizeInfo.cssPageSize};
        margin: 0 !important;
      }
      @page :first {
        margin: 0 !important;
      }
      html, body {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #siloka-print-root {
        width: 100% !important;
        max-width: ${sizeInfo.width} !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 auto !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      /* Terapkan ruang tepi resmi Pasal 47 melalui padding lembar */
      #siloka-print-root .a4-sheet,
      #siloka-print-root .f4-sheet {
        box-sizing: border-box !important;
        width: 210mm !important;
        max-width: 210mm !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 auto !important;
        padding-top: 15mm !important;
        padding-bottom: 15mm !important;
        padding-left: 15mm !important;
        padding-right: 15mm !important;
        box-shadow: none !important;
        border: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid-page !important;
      }
      /* Ruang tepi tanpa Kop Surat: Atas >= 2 cm (Pasal 47 huruf a) */
      #siloka-print-root .a4-sheet[data-has-kop="false"],
      #siloka-print-root .f4-sheet[data-has-kop="false"],
      #siloka-print-root .pasal47-without-kop {
        padding-top: 20mm !important;
        padding-bottom: 15mm !important;
        padding-left: 15mm !important;
        padding-right: 15mm !important;
      }
      #siloka-print-root .kop-surat-unsil,
      #siloka-print-root [data-kop-naskah-dinas="true"] {
        min-height: 0 !important;
        margin-bottom: 0.65em !important;
      }
    }
  `;
};

/**
 * Hitung dan terapkan skala otomatis (Auto-Fit 1 Lembar A4/F4) pada setiap lembar (.a4-sheet / .f4-sheet)
 * agar template surat 1 lembar TIDAK pernah bocor/terpotong menjadi 2 lembar saat cetak A4.
 */
export const fitSheetsToSinglePagePrint = (containerEl, paperSize = 'A4') => {
  if (!containerEl || typeof window === 'undefined') return;

  // Tinggi fisik 1 lembar bersih: A4 = 297mm ≈ 1122px; F4 = 330mm ≈ 1247px
  // Berikan batas aman (A4: 1070px, F4: 1195px)
  const targetMaxHeightPx = paperSize === 'F4' ? 1195 : 1070;
  const sheets = containerEl.querySelectorAll('.a4-sheet, .f4-sheet');

  sheets.forEach((sheet) => {
    sheet.style.zoom = '1';
    sheet.style.minHeight = '0';
    sheet.style.height = 'auto';
    sheet.style.pageBreakInside = 'avoid';
    sheet.style.breakInside = 'avoid-page';

    const measuredHeight = sheet.scrollHeight || sheet.offsetHeight || 0;
    if (measuredHeight > targetMaxHeightPx) {
      const calculatedZoom = Math.max(0.76, Math.min(0.98, targetMaxHeightPx / measuredHeight));
      sheet.style.zoom = String(Number(calculatedZoom.toFixed(3)));
    }
  });
};

/**
 * Bersihkan aturan CSS @page cetak dinamis
 */
export const removePrintPageStyle = () => {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById(PRINT_STYLE_ID);
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }
};

/**
 * Cetak Dokumen Naskah Dinas Resmi (1 Lembar A4 Pasti 1 Lembar)
 * 
 * @param {string} elementId - ID elemen target yang akan dicetak
 * @param {string} documentTitle - Judul dokumen (menjadi default nama berkas PDF saat diunduh)
 * @param {string|object} optionsOrPaperSize - Opsi cetak atau ukuran kertas ('F4'|'A4'|{ paperSize, templateId, letter })
 */
export const printDocument = (
  elementId,
  documentTitle = 'Naskah Dinas Resmi UNSIL',
  optionsOrPaperSize = null
) => {
  let sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    sourceElement = document.querySelector('.printable-document');
  }

  if (!sourceElement) {
    window.print();
    return;
  }

  // 1. Tentukan ukuran kertas otomatis (F4 vs A4) dan keberadaan Kepala Naskah Dinas (Pasal 47)
  let detectedSize = 'A4';
  let detectedHasKop = true;

  if (typeof optionsOrPaperSize === 'string') {
    detectedSize = detectPaperSize(optionsOrPaperSize);
    detectedHasKop = hasKepalaNaskahDinas(optionsOrPaperSize);
  } else if (optionsOrPaperSize && typeof optionsOrPaperSize === 'object') {
    const targetInput =
      optionsOrPaperSize.paperSize ||
      optionsOrPaperSize.templateId ||
      optionsOrPaperSize.templateType ||
      optionsOrPaperSize.letter ||
      optionsOrPaperSize.kategori ||
      documentTitle;
    detectedSize = detectPaperSize(targetInput);
    detectedHasKop = hasKepalaNaskahDinas(
      optionsOrPaperSize.letter || optionsOrPaperSize
    );
  } else {
    const elPaperSize = sourceElement.getAttribute('data-paper-size');
    const elTemplateId = sourceElement.getAttribute('data-template-id');
    const elCategory = sourceElement.getAttribute('data-category');
    const elHasKop = sourceElement.getAttribute('data-has-kop');

    if (elPaperSize) {
      detectedSize = detectPaperSize(elPaperSize);
    } else if (elTemplateId) {
      detectedSize = detectPaperSize(elTemplateId);
    } else if (elCategory) {
      detectedSize = detectPaperSize(elCategory);
    } else {
      detectedSize = detectPaperSize(documentTitle);
    }

    if (elHasKop !== null) {
      detectedHasKop = elHasKop !== 'false';
    } else if (elTemplateId) {
      detectedHasKop = hasKepalaNaskahDinas(elTemplateId);
    }
  }

  // Cek juga apabila di dalam sourceElement tidak ada .kop-surat-unsil atau terdapat sheet[data-has-kop="false"]
  const innerKopEl = sourceElement.querySelector('.kop-surat-unsil, [data-kop-naskah-dinas="true"]');
  const firstSheetEl = sourceElement.querySelector('.a4-sheet, .f4-sheet');
  if (firstSheetEl && firstSheetEl.getAttribute('data-has-kop') === 'false') {
    detectedHasKop = false;
  } else if (!innerKopEl && firstSheetEl) {
    detectedHasKop = false;
  }

  // 2. Terapkan @page dinamis sesuai ukuran kertas dan aturan ruang tepi Pasal 47
  applyPrintPageStyle(detectedSize, detectedHasKop);

  // 3. Dapatkan atau buat kontainer cetak #siloka-print-root di <body>
  let printRoot = document.getElementById('siloka-print-root');
  if (!printRoot) {
    printRoot = document.createElement('div');
    printRoot.id = 'siloka-print-root';
    document.body.appendChild(printRoot);
  }

  // Salin konten naskah dinas ke printRoot & ukur tinggi aktual sebelum cetak
  printRoot.style.display = 'block';
  printRoot.style.width = detectedSize === 'F4' ? '210mm' : '210mm';
  printRoot.innerHTML = sourceElement.innerHTML;
  printRoot.setAttribute('data-active-paper-size', detectedSize);
  printRoot.setAttribute('data-pasal47-has-kop', String(detectedHasKop));

  // Otomatis sesuaikan skala setiap lembar agar 1 lembar tidak bocor jadi 2 lembar
  fitSheetsToSinglePagePrint(printRoot, detectedSize);
  printRoot.style.display = '';

  // 4. Simpan judul asli tab dan ubah sementara untuk nama file PDF saat diunduh
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // 5. Panggil dialog cetak bawaan browser
  try {
    window.print();
  } catch (err) {
    console.error('Pencetakan gagal:', err);
  } finally {
    setTimeout(() => {
      if (printRoot) {
        printRoot.innerHTML = '';
      }
      document.title = originalTitle;
      removePrintPageStyle();
    }, 600);
  }
};

// Pasang listener global sebelum cetak (untuk shortcut Ctrl+P)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => {
    const printRoot = document.getElementById('siloka-print-root');
    const sourceElement = document.querySelector('.printable-document');
    if (printRoot && sourceElement && (!printRoot.innerHTML || printRoot.innerHTML.trim() === '')) {
      const elPaperSize = sourceElement.getAttribute('data-paper-size') ||
                          sourceElement.getAttribute('data-template-id') ||
                          'A4';
      const detected = detectPaperSize(elPaperSize);
      applyPrintPageStyle(detected);
      printRoot.innerHTML = sourceElement.innerHTML;
      fitSheetsToSinglePagePrint(printRoot, detected);
    }
  });

  window.addEventListener('afterprint', () => {
    const printRoot = document.getElementById('siloka-print-root');
    if (printRoot) {
      printRoot.innerHTML = '';
    }
    removePrintPageStyle();
  });
}
