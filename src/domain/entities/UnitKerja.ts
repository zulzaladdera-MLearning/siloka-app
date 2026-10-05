/**
 * Domain Entity: UnitKerja
 * Mengenkapsulasi data unit kerja di lingkungan Universitas Siliwangi
 * Berdasarkan OTK Permendikbudristek No. 19/2023 & SK Rektor UNSIL.
 */

export type TipeUnitKerja = 'UNIVERSITAS' | 'ORGAN' | 'BIRO' | 'FAKULTAS' | 'LEMBAGA' | 'UPA';

export interface IKopSuratHeader {
  kementerian: string;
  universitas: string;
  namaUnit: string;
  alamat: string;
  kontak: string;
  lamanWeb: string;
}

export class UnitKerja {
  #id: number | string;
  #kodeUnit: string;
  #namaUnit: string;
  #tipeUnit: TipeUnitKerja;
  #parentKode: string | null;

  constructor(
    id: number | string,
    kodeUnit: string,
    namaUnit: string,
    tipeUnit: TipeUnitKerja,
    parentKode: string | null = null
  ) {
    if (!kodeUnit || !kodeUnit.startsWith('UN58')) {
      throw new Error(`[UnitKerja] Kode unit kerja harus diawali dengan 'UN58'. Nilai saat ini: '${kodeUnit}'`);
    }
    if (!namaUnit.trim()) {
      throw new Error('[UnitKerja] Nama unit kerja tidak boleh kosong.');
    }

    this.#id = id;
    this.#kodeUnit = kodeUnit.trim();
    this.#namaUnit = namaUnit.trim();
    this.#tipeUnit = tipeUnit;
    this.#parentKode = parentKode ? parentKode.trim() : null;
  }

  // --- Getters & Setters ---

  public get id(): number | string {
    return this.#id;
  }

  public get kodeUnit(): string {
    return this.#kodeUnit;
  }

  public set kodeUnit(value: string) {
    if (!value || !value.startsWith('UN58')) {
      throw new Error(`[UnitKerja] Kode unit harus diawali dengan 'UN58'.`);
    }
    this.#kodeUnit = value.trim();
  }

  public get namaUnit(): string {
    return this.#namaUnit;
  }

  public set namaUnit(value: string) {
    if (!value.trim()) {
      throw new Error('[UnitKerja] Nama unit tidak boleh kosong.');
    }
    this.#namaUnit = value.trim();
  }

  public get tipeUnit(): TipeUnitKerja {
    return this.#tipeUnit;
  }

  public set tipeUnit(value: TipeUnitKerja) {
    this.#tipeUnit = value;
  }

  public get parentKode(): string | null {
    return this.#parentKode;
  }

  public set parentKode(value: string | null) {
    this.#parentKode = value ? value.trim() : null;
  }

  /**
   * Mengembalikan format Kop Surat Resmi standar Kementerian & UNSIL
   * Sesuai kaidah Pedoman Tata Naskah Dinas Kemendikbudristek / UNSIL
   */
  public getFormatKopSurat(): IKopSuratHeader {
    // Sesuai Pasal 30 (2) Peraturan Rektor No. 3/2023, surat Rektor/Wakil Rektor/Biro
    // menggunakan kop surat tingkat Universitas (tanpa nama fakultas/biro di baris ketiga).
    const isTingkatUniversitas =
      this.#kodeUnit === 'UN58' ||
      this.#tipeUnit === 'UNIVERSITAS' ||
      this.#tipeUnit === 'BIRO' ||
      this.#tipeUnit === 'ORGAN';

    return {
      kementerian: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI',
      universitas: 'UNIVERSITAS SILIWANGI',
      namaUnit: isTingkatUniversitas ? '' : this.#namaUnit.toUpperCase(),
      alamat: 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya Kode Pos 46115',
      kontak: 'Telepon (0265) 330634, 333092 Faksimil (0265) 325812',
      lamanWeb: 'Laman: www.unsil.ac.id Pos-el: info@unsil.ac.id'
    };
  }

  public toJSON() {
    return {
      id: this.#id,
      kode_unit: this.#kodeUnit,
      nama_unit: this.#namaUnit,
      tipe_unit: this.#tipeUnit,
      parent_kode: this.#parentKode
    };
  }
}

