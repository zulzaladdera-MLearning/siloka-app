/**
 * Utilitas Tata Naskah Dinas Resmi: Kop Surat Dinamis Berdasarkan Unit Kerja Pengguna
 * Sesuai Ketentuan Peraturan Rektor Universitas Siliwangi Nomor 03 Tahun 2023:
 * 
 * 1. Pasal 30 ayat (2):
 *    "Format kop naskah dinas tingkat Universitas digunakan untuk naskah dinas yang
 *     ditetapkan atau ditandatangani oleh Rektor, Wakil Rektor, atau Kepala Biro."
 *    -> Baris 1: KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
 *    -> Baris 2: UNIVERSITAS SILIWANGI
 *    -> Tanpa nama fakultas / biro di baris ketiga (Tingkat Universitas).
 * 
 * 2. Pasal 31 ayat (1), (2), & (6):
 *    "Format kop naskah dinas tingkat Unit Kerja digunakan untuk naskah dinas yang
 *     ditetapkan atau ditandatangani oleh Dekan, Dosen, atau Pimpinan/Operator
 *     Fakultas, Lembaga, atau UPA."
 *    "Pada baris ketiga mencantumkan nama Fakultas/Lembaga/UPA yang bersangkutan."
 *    "Tulisan nama Fakultas/Lembaga/UPA pada baris ketiga dicetak dengan huruf kapital
 *     dan tulisan paling tebal."
 */

import unitKerjaList from '../data/unitKerja.json' with { type: 'json' };

/**
 * Cari objek unit kerja berdasarkan kode unit atau ID
 * @param {string|number} codeOrId 
 * @returns {object|null}
 */
export const findUnitKerja = (codeOrId) => {
  if (!codeOrId) return null;
  const target = String(codeOrId).trim().toUpperCase();
  return (
    unitKerjaList.find(
      (u) =>
        u.kode_unit.toUpperCase() === target ||
        String(u.id) === target ||
        (u.singkatan && u.singkatan.toUpperCase() === target)
    ) || null
  );
};

/**
 * Dapatkan data unit kerja dari user aktif yang tersimpan di browser
 * @returns {object|null}
 */
export const getActiveUserUnit = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw =
      localStorage.getItem('siloka_active_user') ||
      sessionStorage.getItem('siloka_active_user');

    if (!raw) return null;
    const user = JSON.parse(raw);
    const unitCode = user.unit_kerja_id || user.kode_unit || user.unit;
    return findUnitKerja(unitCode);
  } catch {
    return null;
  }
};

/**
 * Evaluasi format kop surat resmi secara dinamis berdasarkan user login atau unit kerja
 * 
 * @param {string|object|null} userOrUnitInput - Bisa berupa objek user, kode unit, atau objek unit kerja
 * @returns {object} Detail konfigurasi Kop Surat
 */
export const determineKopSurat = (userOrUnitInput = null) => {
  let unitObj = null;
  let userRole = '';

  // 1. Ekstrak unitObj dan userRole dari input
  if (userOrUnitInput) {
    if (typeof userOrUnitInput === 'string') {
      unitObj = findUnitKerja(userOrUnitInput);
    } else if (typeof userOrUnitInput === 'object') {
      // Jika input adalah objek user
      if (userOrUnitInput.unit_kerja_id || userOrUnitInput.role) {
        userRole = userOrUnitInput.role || '';
        unitObj =
          findUnitKerja(userOrUnitInput.unit_kerja_id) ||
          findUnitKerja(userOrUnitInput.kode_unit) ||
          findUnitKerja(userOrUnitInput.unit);
      }
      // Jika input adalah objek unit kerja langsung
      else if (userOrUnitInput.kode_unit || userOrUnitInput.tipe_unit) {
        unitObj = userOrUnitInput;
      }
    }
  }

  // 2. Fallback: jika belum ditemukan, baca dari pengguna aktif saat ini
  if (!unitObj) {
    unitObj = getActiveUserUnit();
  }

  // 3. Fallback default: Rektorat (UN58)
  if (!unitObj) {
    unitObj = unitKerjaList.find((u) => u.kode_unit === 'UN58') || unitKerjaList[0];
  }

  const kodeUnit = (unitObj.kode_unit || '').toUpperCase();
  const tipeUnit = (unitObj.tipe_unit || '').toUpperCase();
  const namaUnit = unitObj.nama_unit || '';

  // 4. Klasifikasi Sesuai Pasal 30 (2) & Pasal 31 (1, 2, 6) Peraturan Rektor No. 3/2023

  // Skenario A: Tingkat Universitas [Pasal 30 ayat (2)]
  // "Kepala Naskah Dinas UNSIL sebagaimana dimaksud pada ayat (1) digunakan oleh
  // Rektor, Wakil Rektor dan Biro di lingkungan UNSIL."
  // Hanya berlaku bagi Rektorat (UN58), Wakil Rektor, dan seluruh Biro (BAKPK UN58.5, BKU UN58.6, atau tipe_unit === 'BIRO').
  const isBiro = tipeUnit === 'BIRO' || kodeUnit === 'UN58.5' || kodeUnit === 'UN58.6';
  const isUniversitas = (kodeUnit === 'UN58' || tipeUnit === 'UNIVERSITAS') && !kodeUnit.includes('.');
  const isPimpinanRektorat =
    userRole === 'REKTOR' ||
    userRole === 'WAKIL_REKTOR' ||
    (userRole === 'PEJABAT' && isUniversitas);

  const isTingkatUniversitas = isUniversitas || isBiro || isPimpinanRektorat;

  if (isTingkatUniversitas) {
    return {
      level: 'UNIVERSITAS',
      isTingkatUniversitas: true,
      isTingkatUnitKerja: false,
      regulasiPasal: 'Pasal 30 ayat (2) Peraturan Rektor No. 3/2023',
      kementerianText: 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
      universitasText: 'UNIVERSITAS SILIWANGI',
      namaUnitBarisTiga: null, // Tanpa nama fakultas/biro di baris ketiga [Pasal 30 (2)]
      alamatText: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya Kode Pos 46115',
      kontakText: 'Telepon (0265) 330634, 333092 Faksimil (0265) 325812',
      webText: 'Laman: www.unsil.ac.id Posel: info@unsil.ac.id',
      unitObj
    };
  }

  // Skenario B: Tingkat Unit Kerja [Pasal 31 ayat (1), (2), & (6)]
  // "Kepala Naskah Dinas Unit Kerja sebagaimana dimaksud pada ayat (1) digunakan oleh
  // Senat, SPI, Dewan Penyantun, Fakultas, Senat Fakultas, Program Pascasarjana, Lembaga, dan UPA."
  // Meliputi: Dekan, Dosen, atau Pimpinan/Operator Fakultas, Lembaga, UPA, Senat, SPI.
  // Tulisan nama unit di baris ketiga dicetak PALING TEBAL [Pasal 31 (6)].
  let barisTiga = namaUnit.toUpperCase();
  if (kodeUnit === 'UN58.SENAT') barisTiga = 'SENAT';
  else if (kodeUnit === 'UN58.SPI') barisTiga = 'SATUAN PENGAWAS INTERNAL';
  else if (kodeUnit === 'UN58.DP') barisTiga = 'DEWAN PENYANTUN';

  return {
    level: 'UNIT_KERJA',
    isTingkatUniversitas: false,
    isTingkatUnitKerja: true,
    regulasiPasal: 'Pasal 31 ayat (1), (2), & (6) Peraturan Rektor No. 3/2023',
    kementerianText: 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
    universitasText: 'UNIVERSITAS SILIWANGI',
    namaUnitBarisTiga: barisTiga, // Muncul di baris ketiga dengan tulisan paling tebal
    alamatText: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya Kode Pos 46115',
    kontakText: 'Telepon (0265) 330634, 333092 Faksimil (0265) 325812',
    webText: 'Laman: www.unsil.ac.id Posel: info@unsil.ac.id',
    unitObj
  };
};
