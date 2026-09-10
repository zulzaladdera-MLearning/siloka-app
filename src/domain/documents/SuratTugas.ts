/**
 * Concrete Class: SuratTugas (Inherit dari NaskahDinas)
 * Naskah dinas penugasan resmi bagi sivitas akademika/staf UNSIL
 * Mendukung format penugasan berkolom (daftar petugas majemuk)
 * Format nomor: [No]/[KodeUnit]/ST/[KodeKlasifikasi]/[Tahun]
 */

import { NaskahDinas, IRetentionConfig } from './NaskahDinas';
import { User } from '../entities/User';
import { UnitKerja } from '../entities/UnitKerja';

export interface IPetugasTugas {
  nama: string;
  nip: string;
  pangkatGolongan?: string;
  jabatan: string;
}

export class SuratTugas extends NaskahDinas {
  #daftarPetugas: IPetugasTugas[];
  #dasarPenugasan: string;
  #maksudTugas: string;
  #lokasiTugas: string;
  #tglMulai: string;
  #tglSelesai: string;

  constructor(
    id: string,
    perihal: string,
    pembuat: User,
    unitAsal: UnitKerja,
    kodeKlasifikasi: string,
    dasarPenugasan: string,
    maksudTugas: string,
    lokasiTugas: string,
    tglMulai: string,
    tglSelesai: string,
    daftarPetugas: IPetugasTugas[] = [],
    tanggal: Date = new Date()
  ) {
    super(id, perihal, pembuat, unitAsal, kodeKlasifikasi, tanggal);

    this.#dasarPenugasan = dasarPenugasan;
    this.#maksudTugas = maksudTugas;
    this.#lokasiTugas = lokasiTugas;
    this.#tglMulai = tglMulai;
    this.#tglSelesai = tglSelesai;
    this.#daftarPetugas = [...daftarPetugas];
  }

  public get daftarPetugas(): ReadonlyArray<IPetugasTugas> {
    return Object.freeze([...this.#daftarPetugas]);
  }

  public tambahPetugas(petugas: IPetugasTugas): void {
    if (!petugas.nama.trim()) throw new Error('[SuratTugas] Nama personil tugas wajib diisi.');
    this.#daftarPetugas.push(petugas);
  }

  public get dasarPenugasan(): string {
    return this.#dasarPenugasan;
  }

  public set dasarPenugasan(value: string) {
    this.#dasarPenugasan = value;
  }

  public get maksudTugas(): string {
    return this.#maksudTugas;
  }

  public set maksudTugas(value: string) {
    this.#maksudTugas = value;
  }

  public get lokasiTugas(): string {
    return this.#lokasiTugas;
  }

  public get durasiTugas(): string {
    return `${this.#tglMulai} s.d. ${this.#tglSelesai}`;
  }

  /**
   * Implementasi Polimorfisme: Penomoran Surat Tugas Resmi UNSIL
   * Format: [Nomor Urut]/[Kode Unit]/ST/[Kode Klasifikasi]/[Tahun]
   * Contoh: 0044/UN58.6/ST/KP.03.00/2026
   */
  public override generateNomorSurat(nomorUrut: string | number = '0044'): string {
    const formattedUrut = String(nomorUrut).padStart(4, '0');
    const tahun = this.tanggal.getFullYear();
    const generated = `${formattedUrut}/${this.unitAsal.kodeUnit}/ST/${this.kodeKlasifikasi}/${tahun}`;
    this.setNomorSurat(generated);
    return generated;
  }

  /**
   * Implementasi Polimorfisme: Jadwal Retensi Arsip (JRA)
   * Surat Tugas operasional berretensi aktif 1 tahun, inaktif 2 tahun.
   */
  public override getRetentionPeriod(): IRetentionConfig {
    return {
      aktifTahun: 1,
      inaktifTahun: 2,
      statusAkhir: 'Musnah',
      deskripsiJRA: 'Surat Tugas Perjalanan Dinas / Kegiatan Operasional'
    };
  }

  public override toJSON() {
    return {
      ...super.toJSON(),
      tipe_dokumen: 'SuratTugas',
      dasar_penugasan: this.#dasarPenugasan,
      maksud_tugas: this.#maksudTugas,
      lokasi_tugas: this.#lokasiTugas,
      durasi_tugas: this.durasiTugas,
      daftar_petugas: this.#daftarPetugas
    };
  }
}

