/**
 * Utilitas Pengurutan Unit Kerja Sesuai SOTK & OTK Universitas Siliwangi
 * Peraturan Rektor No. 3 Tahun 2023 & Permendikbudristek No. 19 Tahun 2023
 */

export const CATEGORY_PRIORITY = {
  UNIVERSITAS: 1,
  ORGAN: 2,
  BIRO: 3,
  FAKULTAS: 4,
  PASCASARJANA: 4,
  LEMBAGA: 5,
  UPA: 6,
  LAINNYA: 7
};

/**
 * Ekstraksi angka urutan desimal dari kode unit naskah dinas
 * Contoh: 'UN58.18' -> 18, 'UN58.5' -> 5, 'UN58.10' -> 10
 */
export const getDecimalOtkNumber = (code = '') => {
  const match = String(code).match(/\.(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
};

/**
 * Mengurutkan array unit kerja secara konsisten mengikuti Struktur Organisasi dan Tata Kerja (SOTK)
 * 1. Rektorat / Universitas (UN58) selalu paling atas
 * 2. Unsur Organ Penunjang (Senat, SPI, Dewan Penyantun)
 * 3. Biro Pelaksana Administrasi (BAKPK, BKU)
 * 4. Fakultas & Pascasarjana (FKIP, FEB, FP, FT, FISIP, FIK, FAI, PASCA, dan Fakultas baru seperti Kedokteran)
 * 5. Lembaga (LPPM, LPMPP)
 * 6. Unit Penunjang Akademik (UPA)
 * Unit baru di dalam kategori yang sama (misal Fakultas baru UN58.18) otomatis mengurut ke bawah, bukan ke atas.
 */
export const sortUnitsByOtk = (unitList = []) => {
  if (!Array.isArray(unitList)) return [];

  return [...unitList].sort((a, b) => {
    // 1. Rektorat (UN58) selalu nomor 1 di puncak hierarki
    const isRootA = a.kode_unit === 'UN58';
    const isRootB = b.kode_unit === 'UN58';
    if (isRootA && !isRootB) return -1;
    if (!isRootA && isRootB) return 1;

    // 2. Prioritas kategori SOTK
    const prioA = CATEGORY_PRIORITY[a.tipe_unit] || CATEGORY_PRIORITY.LAINNYA;
    const prioB = CATEGORY_PRIORITY[b.tipe_unit] || CATEGORY_PRIORITY.LAINNYA;

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // 3. Jika di dalam kategori yang sama, urutkan berdasarkan nomor urut numerik kode OTK
    const numA = getDecimalOtkNumber(a.kode_unit);
    const numB = getDecimalOtkNumber(b.kode_unit);

    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
    }

    // 4. Jika salah satu punya nomor angka dan satu lagi teks di kategori yang sama
    if (numA !== null && numB === null) return 1;
    if (numA === null && numB !== null) return -1;

    // 5. Fallback urutan alfabetis kode atau nama
    return String(a.kode_unit).localeCompare(String(b.kode_unit), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
};
