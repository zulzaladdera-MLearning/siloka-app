/**
 * Utilitas Pencetakan Resmi A4 Naskah Dinas UNSIL
 * 
 * Menggunakan portal #siloka-print-root langsung pada <body> sehingga:
 * 1. Seluruh antarmuka web app (#root) disembunyikan (display: none !important),
 *    menghilangkan 100% hambatan modal, overflow-hidden, dan margin kosong.
 * 2. Dokumen dicetak dalam flow dokumen standar tanpa pemotongan tinggi (no clipping).
 * 3. Halaman multi-lembar (seperti SK Rektor & Lampiran) berpindah halaman secara natural
 *    dengan aturan page-break-before: always; (menghasilkan tepat 2 lembar).
 * 4. Gambar logo (/unsil-logo.png) dan seluruh styling Tailwind aktif secara instan tanpa jeda iframe.
 */

export const printDocument = (elementId, documentTitle = 'Naskah Dinas Resmi UNSIL') => {
  let sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    sourceElement = document.querySelector('.printable-document');
  }

  if (!sourceElement) {
    window.print();
    return;
  }

  // Dapatkan atau buat kontainer cetak #siloka-print-root di <body>
  let printRoot = document.getElementById('siloka-print-root');
  if (!printRoot) {
    printRoot = document.createElement('div');
    printRoot.id = 'siloka-print-root';
    document.body.appendChild(printRoot);
  }

  // Salin konten naskah dinas ke printRoot
  printRoot.innerHTML = sourceElement.innerHTML;

  // Simpan judul asli tab dan ubah sementara untuk nama file PDF saat diunduh
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // Panggil dialog cetak bawaan browser
  try {
    window.print();
  } catch (err) {
    console.error('Pencetakan gagal:', err);
  } finally {
    // Bersihkan printRoot dan kembalikan judul dokumen setelah dialog selesai
    setTimeout(() => {
      if (printRoot) {
        printRoot.innerHTML = '';
      }
      document.title = originalTitle;
    }, 500);
  }
};

// Pasang listener global sebelum cetak (untuk shortcut Ctrl+P)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => {
    const printRoot = document.getElementById('siloka-print-root');
    const sourceElement = document.querySelector('.printable-document');
    if (printRoot && sourceElement && (!printRoot.innerHTML || printRoot.innerHTML.trim() === '')) {
      printRoot.innerHTML = sourceElement.innerHTML;
    }
  });

  window.addEventListener('afterprint', () => {
    const printRoot = document.getElementById('siloka-print-root');
    if (printRoot) {
      printRoot.innerHTML = '';
    }
  });
}
