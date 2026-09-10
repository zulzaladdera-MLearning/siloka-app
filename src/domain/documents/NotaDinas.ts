/**
 * Concrete Class: NotaDinas (Inherit dari NaskahDinas)
 * Naskah dinas internal antar-pejabat di lingkungan internal Universitas Siliwangi
 * Tidak mencantumkan kode keamanan derajat surat di dalam nomornya.
 * Format nomor: [No]/[KodeUnit]/[KodeKlasifikasi]/ND/[Tahun]
 */

import { NaskahDinas, IRetentionConfig } from './NaskahDinas';
import { User } from '../entities/User';
import { UnitKerja } from '../entities/UnitKerja';

export class NotaDinas extends NaskahDinas {
  #kepada: string;
  #dari: string;
  #isiNota: string;
  #tembusan: string[];

  constructor(
    id: string,
    perihal: string,
    pembuat: User,
    unitAsal: UnitKerja,
    kodeKlasifikasi: string,
    kepada: string,
    dari: string,
    isiNota: string = '',
    tembusan: string[] = [],
    tanggal: Date = new Date()
  ) {
    super(id, perihal, pembuat, unitAsal, kodeKlasifikasi, tanggal);

    if (!kepada.trim()) throw new Error('[NotaDinas] Tujuan (Yth.) Nota Dinas wajib ditentukan.');
    if (!dari.trim()) throw new Error('[NotaDinas] Pengirim (Dari) Nota Dinas wajib ditentukan.');

    this.#kepada = kepada.trim();
    this.#dari = dari.trim();
    this.#isiNota = isiNota;
    this.#tembusan = [...tembusan];
  }

  public get kepada(): string {
    return this.#kepada;
  }

  public set kepada(value: string) {
    if (!value.trim()) throw new Error('[NotaDinas] Penerima tidak boleh kosong.');
    this.#kepada = value.trim();
  }

  public get dari(): string {
    return this.#dari;
  }

  public set dari(value: string) {
    if (!value.trim()) throw new Error('[NotaDinas] Pengirim tidak boleh kosong.');
    this.#dari = value.trim();
  }

  public get isiNota(): string {
    return this.#isiNota;
  }

  public set isiNota(value: string) {
    this.#isiNota = value;
  }

  public get tembusan(): ReadonlyArray<string> {
    return Object.freeze([...this.#tembusan]);
  }

  public tambahTembusan(tembusanItem: string): void {
    if (tembusanItem.trim()) {
      this.#tembusan.push(tembusanItem.trim());
    }
  }

  /**
   * Implementasi Polimorfisme: Penomoran Nota Dinas Internal
   * Tanpa sisipan kode derajat keamanan surat ('B' atau 'R')
   * Format: [Nomor Urut]/[Kode Unit]/[Kode Klasifikasi]/ND/[Tahun]
   * Contoh: 0018/UN58.6/KU.01.00/ND/2026
   */
  public override generateNomorSurat(nomorUrut: string | number = '0018'): string {
    const formattedUrut = String(nomorUrut).padStart(4, '0');
    const tahun = this.tanggal.getFullYear();
    const generated = `${formattedUrut}/${this.unitAsal.kodeUnit}/${this.kodeKlasifikasi}/ND/${tahun}`;
    this.setNomorSurat(generated);
    return generated;
  }

  /**
   * Implementasi Polimorfisme: Jadwal Retensi Arsip (JRA)
   * Nota Dinas koordinasi internal berretensi aktif 1 tahun, inaktif 2 tahun.
   */
  public override getRetentionPeriod(): IRetentionConfig {
    return {
      aktifTahun: 1,
      inaktifTahun: 2,
      statusAkhir: 'Musnah',
      deskripsiJRA: 'Nota Dinas Koordinasi & Hubungan Kerja Internal'
    };
  }

  public override toJSON() {
    return {
      ...super.toJSON(),
      tipe_dokumen: 'NotaDinas',
      kepada: this.#kepada,
      dari: this.#dari,
      isi_nota: this.#isiNota,
      tembusan: this.#tembusan
    };
  }
}

