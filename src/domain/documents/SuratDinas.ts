/**
 * Concrete Class: SuratDinas (Inherit dari NaskahDinas)
 * Naskah dinas resmi eksternal/umum untuk korespondensi kedinasan
 * Format nomor: [No]/[KodeUnit]/B/[KodeKlasifikasi]/[Tahun]
 */

import { NaskahDinas, IRetentionConfig } from './NaskahDinas';
import { User } from '../entities/User';
import { UnitKerja } from '../entities/UnitKerja';

export class SuratDinas extends NaskahDinas {
  #tujuan: string;
  #lampiran: string;
  #isiSurat: string;
  #kategoriKeamanan: 'B' | 'R' | 'SR'; // B: Biasa, R: Rahasia, SR: Sangat Rahasia

  constructor(
    id: string,
    perihal: string,
    pembuat: User,
    unitAsal: UnitKerja,
    kodeKlasifikasi: string,
    tujuan: string,
    isiSurat: string = '',
    lampiran: string = '1 (Satu) Berkas',
    kategoriKeamanan: 'B' | 'R' | 'SR' = 'B',
    tanggal: Date = new Date()
  ) {
    super(id, perihal, pembuat, unitAsal, kodeKlasifikasi, tanggal);

    if (!tujuan.trim()) {
      throw new Error('[SuratDinas] Tujuan surat wajib ditentukan.');
    }

    this.#tujuan = tujuan.trim();
    this.#isiSurat = isiSurat;
    this.#lampiran = lampiran;
    this.#kategoriKeamanan = kategoriKeamanan;
  }

  public get tujuan(): string {
    return this.#tujuan;
  }

  public set tujuan(value: string) {
    if (!value.trim()) throw new Error('[SuratDinas] Tujuan tidak boleh kosong.');
    this.#tujuan = value.trim();
  }

  public get lampiran(): string {
    return this.#lampiran;
  }

  public set lampiran(value: string) {
    this.#lampiran = value;
  }

  public get isiSurat(): string {
    return this.#isiSurat;
  }

  public set isiSurat(value: string) {
    this.#isiSurat = value;
  }

  public get kategoriKeamanan(): 'B' | 'R' | 'SR' {
    return this.#kategoriKeamanan;
  }

  /**
   * Implementasi Polimorfisme: Format Penomoran Surat Dinas
   * Format: [Nomor Urut]/[Kode Unit]/[Sifat Keamanan]/[Kode Klasifikasi]/[Tahun]
   * Contoh: 0142/UN58.6/B/KU.01.00/2026
   */
  public override generateNomorSurat(nomorUrut: string | number = '0142'): string {
    const formattedUrut = String(nomorUrut).padStart(4, '0');
    const tahun = this.tanggal.getFullYear();
    const generated = `${formattedUrut}/${this.unitAsal.kodeUnit}/${this.#kategoriKeamanan}/${this.kodeKlasifikasi}/${tahun}`;
    this.setNomorSurat(generated);
    return generated;
  }

  /**
   * Implementasi Polimorfisme: Jadwal Retensi Arsip (JRA)
   * Surat Dinas Operasional berretensi aktif 2 tahun, inaktif 3 tahun.
   */
  public override getRetentionPeriod(): IRetentionConfig {
    return {
      aktifTahun: 2,
      inaktifTahun: 3,
      statusAkhir: 'Musnah',
      deskripsiJRA: 'Surat Dinas Korespondensi Umum & Administrasi Operasional'
    };
  }

  public override toJSON() {
    return {
      ...super.toJSON(),
      tipe_dokumen: 'SuratDinas',
      tujuan: this.#tujuan,
      lampiran: this.#lampiran,
      isi_surat: this.#isiSurat,
      kategori_keamanan: this.#kategoriKeamanan
    };
  }
}

