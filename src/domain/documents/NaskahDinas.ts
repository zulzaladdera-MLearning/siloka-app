/**
 * Abstract Class: NaskahDinas
 * Fondasi polimorfisme untuk seluruh jenis surat dinas resmi di Universitas Siliwangi
 * Mengacu pada Peraturan Rektor No. 3 Tahun 2023 & Kaidah Kearsipan ANRI.
 */

import { User } from '../entities/User';
import { Pejabat, ITTEResult } from '../entities/Pejabat';
import { UnitKerja } from '../entities/UnitKerja';

export type StatusNaskah = 'DRAF' | 'DIPARAF' | 'TTE' | 'DISETUJUI' | 'DIARSIPKAN';

export interface IRetentionConfig {
  aktifTahun: number;
  inaktifTahun: number;
  statusAkhir: 'Musnah' | 'Permanen';
  deskripsiJRA: string;
}

export interface IParafRecord {
  nama: string;
  jabatan: string;
  waktu: string;
  catatan?: string;
}

export abstract class NaskahDinas {
  #id: string;
  #nomorSurat: string | null;
  #tanggal: Date;
  #perihal: string;
  #pembuat: User;
  #unitAsal: UnitKerja;
  #kodeKlasifikasi: string;
  #status: StatusNaskah;
  #riwayatParaf: IParafRecord[];
  #tteInfo: ITTEResult | null;

  constructor(
    id: string,
    perihal: string,
    pembuat: User,
    unitAsal: UnitKerja,
    kodeKlasifikasi: string,
    tanggal: Date = new Date()
  ) {
    if (!id) throw new Error('[NaskahDinas] ID dokumen wajib diisi.');
    if (!perihal.trim()) throw new Error('[NaskahDinas] Perihal dokumen tidak boleh kosong.');
    if (!pembuat) throw new Error('[NaskahDinas] Pembuat dokumen (User) harus disertakan.');
    if (!unitAsal) throw new Error('[NaskahDinas] Unit kerja asal harus disertakan.');

    this.#id = id;
    this.#nomorSurat = null;
    this.#perihal = perihal.trim();
    this.#pembuat = pembuat;
    this.#unitAsal = unitAsal;
    this.#kodeKlasifikasi = kodeKlasifikasi.trim();
    this.#tanggal = tanggal;
    this.#status = 'DRAF';
    this.#riwayatParaf = [];
    this.#tteInfo = null;
  }

  // --- Getters & Setters ---

  public get id(): string {
    return this.#id;
  }

  public get nomorSurat(): string | null {
    return this.#nomorSurat;
  }

  protected setNomorSurat(value: string) {
    this.#nomorSurat = value;
  }

  public get tanggal(): Date {
    return this.#tanggal;
  }

  public set tanggal(value: Date) {
    this.#tanggal = value;
  }

  public get perihal(): string {
    return this.#perihal;
  }

  public set perihal(value: string) {
    if (!value.trim()) throw new Error('[NaskahDinas] Perihal tidak boleh kosong.');
    this.#perihal = value.trim();
  }

  public get pembuat(): User {
    return this.#pembuat;
  }

  public get unitAsal(): UnitKerja {
    return this.#unitAsal;
  }

  public get kodeKlasifikasi(): string {
    return this.#kodeKlasifikasi;
  }

  public set kodeKlasifikasi(value: string) {
    this.#kodeKlasifikasi = value.trim();
  }

  public get status(): StatusNaskah {
    return this.#status;
  }

  public get riwayatParaf(): ReadonlyArray<IParafRecord> {
    return Object.freeze([...this.#riwayatParaf]);
  }

  public get tteInfo(): ITTEResult | null {
    return this.#tteInfo;
  }

  // --- Abstract Methods (Polimorfisme) ---

  /**
   * Mengenerate nomor surat dinas spesifik sesuai aturan tata naskah masing-masing turunan
   */
  public abstract generateNomorSurat(nomorUrut?: string | number): string;

  /**
   * Mengembalikan aturan Jadwal Retensi Arsip (JRA) berdasarkan jenis naskah
   */
  public abstract getRetentionPeriod(): IRetentionConfig;

  // --- Concrete Business Logic ---

  /**
   * Memberikan paraf koordinasi berjenjang sebelum ditandatangani TTE
   */
  public bubuhkanParaf(user: User, catatan: string = 'Disetujui untuk diproses lebih lanjut'): void {
    if (this.#status === 'DIARSIPKAN') {
      throw new Error('[NaskahDinas] Dokumen yang telah diarsipkan permanen tidak dapat diparaf ulang.');
    }

    const record: IParafRecord = {
      nama: user.namaLengkap,
      jabatan: user instanceof Pejabat ? user.jabatanStruktural : `${user.role} ${user.unitKerja.namaUnit}`,
      waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      catatan
    };

    this.#riwayatParaf.push(record);
    this.#status = 'DIPARAF';
  }

  /**
   * Pengesahan naskah dinas dengan Tanda Tangan Elektronik oleh Pejabat berwenang
   */
  public signWithTTE(pejabat: Pejabat, passphrase: string): ITTEResult {
    if (!pejabat.canSignDocument()) {
      throw new Error('[NaskahDinas] Pengguna ini tidak memiliki hak akses penandatanganan dinas.');
    }

    const tteResult = pejabat.signWithTTE(passphrase);
    if (!tteResult.isValid) {
      throw new Error(`[NaskahDinas] Validasi TTE Gagal: ${tteResult.error}`);
    }

    // Pastikan nomor surat telah diterbitkan saat naskah disahkan
    if (!this.#nomorSurat) {
      this.#nomorSurat = this.generateNomorSurat();
    }

    this.#tteInfo = tteResult;
    this.#status = 'TTE';
    return tteResult;
  }

  /**
   * Mengubah status dokumen menjadi Diarsipkan
   */
  public archive(): void {
    if (this.#status !== 'TTE' && this.#status !== 'DISETUJUI') {
      throw new Error('[NaskahDinas] Hanya dokumen yang telah sah TTE/Disetujui yang dapat diarsipkan.');
    }
    this.#status = 'DIARSIPKAN';
  }

  public toJSON() {
    return {
      id: this.#id,
      nomorSurat: this.#nomorSurat,
      tanggal: this.#tanggal.toISOString(),
      perihal: this.#perihal,
      pembuat: this.#pembuat.toJSON(),
      unit_asal: this.#unitAsal.toJSON(),
      kode_klasifikasi: this.#kodeKlasifikasi,
      status: this.#status,
      riwayat_paraf: this.#riwayatParaf,
      tte_info: this.#tteInfo
    };
  }
}

